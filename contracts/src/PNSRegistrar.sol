// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import { PNSRegistry } from "./PNSRegistry.sol";
import { PNSPriceOracle } from "./PNSPriceOracle.sol";

/**
 * @title PNSRegistrar
 * @dev Registration and renewal logic for PNS
 * Handles name registration, renewals, grace periods, and premium auctions
 */
contract PNSRegistrar is AccessControl, Initializable, UUPSUpgradeable, ReentrancyGuard {
    /// @notice Role for admin operations
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    /// @notice Role for controller operations
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    /// @notice Reference to registry contract
    PNSRegistry public registry;

    /// @notice Reference to price oracle
    PNSPriceOracle public priceOracle;

    /// @notice Registration period in seconds (1 year default)
    uint256 public registrationPeriod = 365 days;

    /// @notice Grace period in seconds (30 days default)
    uint256 public gracePeriod = 30 days;

    /// @notice Treasury address for collecting fees
    address public treasury;

    /// @notice Minimum registration length
    uint256 public constant MIN_NAME_LENGTH = 3;

    /// @notice Maximum registration length
    uint256 public constant MAX_NAME_LENGTH = 63;

    /// @notice Maximum allowed registration duration in years
    uint256 public constant MAX_REGISTRATION_DURATION_YEARS = 10;

    /// @notice Auction structure for premium names
    struct PremiumAuction {
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
        bool concluded;
    }

    /// @notice Premium name auctions (nameHash -> auction details)
    mapping(bytes32 => PremiumAuction) public auctions;

    /// @notice Registrations pending commit-reveal
    mapping(bytes32 => uint256) public commitments;

    /// @notice Commitment time
    uint256 public commitmentAge = 1 days;

    /// @notice Cooldown time
    uint256 public cooldownPeriod = 7 days;

    // ============ Events ============

    /// @notice Emitted when a name is registered
    event NameRegistered(
        bytes32 indexed nameHash, string name, address indexed owner, uint256 price, uint64 expiration
    );

    /// @notice Emitted when a name is renewed
    event NameRenewed(bytes32 indexed nameHash, string name, uint256 price, uint64 newExpiration);

    /// @notice Emitted when a commitment is made
    event CommitmentMade(bytes32 indexed commitment, uint256 timestamp);

    /// @notice Emitted when an auction starts
    event AuctionStarted(bytes32 indexed nameHash, uint256 endTime);

    /// @notice Emitted when an auction bid is placed
    event AuctionBidPlaced(bytes32 indexed nameHash, address indexed bidder, uint256 amount);

    /// @notice Emitted when an auction ends
    event AuctionEnded(bytes32 indexed nameHash, address indexed winner, uint256 finalPrice);

    /// @notice Emitted when refund is issued
    event RefundIssued(address indexed recipient, uint256 amount);

    // ============ Modifiers ============

    /// @notice Only controller or admin
    modifier onlyAuthorized() {
        require(hasRole(CONTROLLER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "Registrar: Not authorized");
        _;
    }

    // ============ Initialization ============

    /**
     * @dev Initializes the registrar
     * @param _registry PNSRegistry contract address
     * @param _priceOracle PNSPriceOracle contract address
     * @param _treasury Treasury address
     * @param admin Initial admin address
     */
    function initialize(address _registry, address _priceOracle, address _treasury, address admin)
        external
        initializer
    {
        require(_registry != address(0), "Registrar: Invalid registry");
        require(_priceOracle != address(0), "Registrar: Invalid oracle");
        require(_treasury != address(0), "Registrar: Invalid treasury");
        require(admin != address(0), "Registrar: Invalid admin");

        registry = PNSRegistry(_registry);
        priceOracle = PNSPriceOracle(_priceOracle);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(CONTROLLER_ROLE, admin);
    }

    // ============ Admin Functions ============

    /**
     * @dev Sets the treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
        require(_treasury != address(0), "Registrar: Invalid treasury");
        treasury = _treasury;
    }

    /**
     * @dev Grants controller role
     * @param controller Controller address
     */
    function setController(address controller) external onlyRole(ADMIN_ROLE) {
        require(controller != address(0), "Registrar: Invalid controller");
        grantRole(CONTROLLER_ROLE, controller);
    }

    /**
     * @dev Sets registration period
     * @param period Period in seconds
     */
    function setRegistrationPeriod(uint256 period) external onlyRole(ADMIN_ROLE) {
        require(period > 0, "Registrar: Invalid period");
        registrationPeriod = period;
    }

    /**
     * @dev Sets grace period
     * @param period Period in seconds
     */
    function setGracePeriod(uint256 period) external onlyRole(ADMIN_ROLE) {
        require(period > 0, "Registrar: Invalid period");
        gracePeriod = period;
    }

    /**
     * @dev Sets commitment configuration
     * @param age Commitment age in seconds
     * @param cooldown Cooldown period in seconds
     */
    function setCommitmentConfig(uint256 age, uint256 cooldown) external onlyRole(ADMIN_ROLE) {
        require(age > 0, "Registrar: Invalid age");
        require(cooldown > 0, "Registrar: Invalid cooldown");
        commitmentAge = age;
        cooldownPeriod = cooldown;
    }

    // ============ Commit-Reveal Registration Functions ============

    /**
     * @dev Commits a name for registration (first step)
     * @param commitment Commitment hash
     */
    function makeCommitment(bytes32 commitment) external nonReentrant {
        require(commitments[commitment] == 0, "Registrar: Commitment exists");
        commitments[commitment] = block.timestamp;
        emit CommitmentMade(commitment, block.timestamp);
    }

    /**
     * @dev Generates a commitment hash
     * @param name Domain name
     * @param owner Owner address
     * @param secret Secret value
     * @return Commitment hash
     */
    function getCommitmentHash(string calldata name, address owner, string calldata secret)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(name, owner, secret));
    }

    /**
     * @dev Registers a name using commit-reveal
     * @param name Domain name
     * @param owner Owner address
     * @param secret Secret value
     * @param duration Registration duration in years
     * @param resolver Resolver address (optional)
     */
    function registerWithCommit(
        string calldata name,
        address owner,
        string calldata secret,
        uint256 duration,
        address resolver
    ) external payable onlyAuthorized nonReentrant {
        bytes32 commitment = keccak256(abi.encodePacked(name, owner, secret));

        require(commitments[commitment] > 0, "Registrar: No commitment");
        require(block.timestamp >= commitments[commitment] + commitmentAge, "Registrar: Commitment too new");
        require(
            block.timestamp <= commitments[commitment] + commitmentAge + cooldownPeriod, "Registrar: Commitment expired"
        );

        delete commitments[commitment];

        _register(name, owner, duration, resolver);

        // Refund excess payment
        uint256 price = priceOracle.getPrice(keccak256(abi.encodePacked(name, ".poly")), name, duration);
        if (msg.value > price) {
            (bool success,) = msg.sender.call{value: msg.value - price}("");
            require(success, "Registrar: Refund failed");
            emit RefundIssued(msg.sender, msg.value - price);
        }
    }

    // ============ Direct Registration Functions ============

    /**
     * @dev Registers a name directly
     * @param name Domain name
     * @param owner Owner address
     * @param duration Registration duration in years
     * @param resolver Resolver address (optional)
     */
    function register(string calldata name, address owner, uint256 duration, address resolver)
        external
        payable
        onlyAuthorized
        nonReentrant
    {
        _register(name, owner, duration, resolver);

        // Refund excess payment
        uint256 price = priceOracle.getPrice(keccak256(abi.encodePacked(name, ".poly")), name, duration);
        if (msg.value > price) {
            (bool success,) = msg.sender.call{value: msg.value - price}("");
            require(success, "Registrar: Refund failed");
            emit RefundIssued(msg.sender, msg.value - price);
        }
    }

    /**
     * @dev Internal registration logic
     * @param name Domain name
     * @param owner Owner address
     * @param duration Duration in years
     * @param resolver Resolver address
     */
    function _register(string calldata name, address owner, uint256 duration, address resolver) internal {
        bytes32 nameHash = keccak256(abi.encodePacked(name, ".poly"));

        // Validate name
        uint256 nameLength = bytes(name).length;
        require(nameLength >= MIN_NAME_LENGTH && nameLength <= MAX_NAME_LENGTH, "Registrar: Invalid name length");
        require(_isValidName(name), "Registrar: Invalid characters");
        require(duration > 0 && duration <= MAX_REGISTRATION_DURATION_YEARS, "Registrar: Invalid duration");

        // If the name already exists, enforce grace period and explicitly expire it
        // before allowing a fresh registration. This avoids conflating registration
        // with renewal and keeps registry state consistent.
        if (registry.exists(nameHash)) {
            (,, uint64 expiration) = registry.getNameRecord(nameHash);
            require(expiration + gracePeriod <= block.timestamp, "Registrar: Name not available");
            // After grace period, mark the name as expired in the registry
            registry.expireName(nameHash);
        }

        // Ensure no concurrent registration has happened before proceeding
        require(!registry.exists(nameHash), "Registrar: Name already registered");

        // Get price and validate payment
        uint256 price = priceOracle.getPrice(nameHash, name, duration);
        require(msg.value >= price, "Registrar: Insufficient payment");

        // Calculate expiration
        uint64 newExpiration = uint64(block.timestamp + (duration * 365 days));

        // Register fresh name in registry
        registry.registerName(nameHash, owner, resolver, newExpiration);

        // Transfer payment to treasury
        (bool success,) = treasury.call{value: price}("");
        require(success, "Registrar: Payment transfer failed");

        emit NameRegistered(nameHash, name, owner, price, newExpiration);
    }

    // ============ Renewal Functions ============

    /**
     * @dev Renews a name registration
     * @param name Domain name
     * @param duration Renewal duration in years
     */
    function renew(string calldata name, uint256 duration) external payable nonReentrant {
        bytes32 nameHash = keccak256(abi.encodePacked(name, ".poly"));

        require(registry.exists(nameHash), "Registrar: Name does not exist");
        (address owner,, uint64 expiration) = registry.getNameRecord(nameHash);
        require(msg.sender == owner, "Registrar: Not name owner");
        require(duration > 0 && duration <= MAX_REGISTRATION_DURATION_YEARS, "Registrar: Invalid duration");

        // Calculate new expiration
        uint64 renewalExpiration = uint64(expiration + (duration * 365 days));

        // Get price and validate payment
        uint256 price = priceOracle.getPrice(nameHash, name, duration);
        require(msg.value >= price, "Registrar: Insufficient payment");

        // Renew in registry
        registry.renewName(nameHash, renewalExpiration);

        // Transfer payment to treasury
        (bool success,) = treasury.call{value: price}("");
        require(success, "Registrar: Payment transfer failed");

        // Refund excess
        if (msg.value > price) {
            (bool refundSuccess,) = msg.sender.call{value: msg.value - price}("");
            require(refundSuccess, "Registrar: Refund failed");
            emit RefundIssued(msg.sender, msg.value - price);
        }

        emit NameRenewed(nameHash, name, price, renewalExpiration);
    }

    // ============ Premium Auction Functions ============

    /**
     * @dev Starts a premium auction for a name
     * @param nameHash Name hash
     * @param auctionDuration Duration of auction in seconds
     */
    function startAuction(bytes32 nameHash, uint256 auctionDuration) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(auctionDuration > 0, "Registrar: Invalid duration");
        require(!auctions[nameHash].concluded, "Registrar: Auction already concluded");

        auctions[nameHash] = PremiumAuction({
            highestBidder: address(0), highestBid: 0, endTime: block.timestamp + auctionDuration, concluded: false
        });

        emit AuctionStarted(nameHash, block.timestamp + auctionDuration);
    }

    /**
     * @dev Places a bid in a premium auction
     * @param nameHash Name hash
     */
    function placeBid(bytes32 nameHash) external payable nonReentrant {
        require(msg.value > 0, "Registrar: Bid must be positive");
        require(block.timestamp < auctions[nameHash].endTime, "Registrar: Auction ended");
        require(msg.value > auctions[nameHash].highestBid, "Registrar: Bid too low");

        // Refund previous highest bidder
        if (auctions[nameHash].highestBidder != address(0)) {
            (bool success,) = auctions[nameHash].highestBidder.call{value: auctions[nameHash].highestBid}("");
            require(success, "Registrar: Refund failed");
            emit RefundIssued(auctions[nameHash].highestBidder, auctions[nameHash].highestBid);
        }

        auctions[nameHash].highestBidder = msg.sender;
        auctions[nameHash].highestBid = msg.value;

        emit AuctionBidPlaced(nameHash, msg.sender, msg.value);
    }

    /**
     * @dev Concludes an auction
     * @param nameHash Name hash
     * @param name Domain name
     * @param resolver Resolver address (optional)
     */
    function concludeAuction(bytes32 nameHash, string calldata name, address resolver)
        external
        onlyRole(ADMIN_ROLE)
        nonReentrant
    {
        // Sanity check that the provided name matches the nameHash to avoid
        // confusing events with mismatched labels.
        require(
            keccak256(abi.encodePacked(name, ".poly")) == nameHash, "Registrar: name/nameHash mismatch"
        );

        PremiumAuction storage auction = auctions[nameHash];

        require(!auction.concluded, "Registrar: Auction already concluded");
        require(block.timestamp >= auction.endTime, "Registrar: Auction not ended");
        require(auction.highestBidder != address(0), "Registrar: No bids");

        auction.concluded = true;

        // Register the name to highest bidder
        uint64 expiration = uint64(block.timestamp + 365 days);
        registry.registerName(nameHash, auction.highestBidder, resolver, expiration);

        // Transfer bid to treasury
        (bool success,) = treasury.call{value: auction.highestBid}("");
        require(success, "Registrar: Payment transfer failed");

        emit AuctionEnded(nameHash, auction.highestBidder, auction.highestBid);
        emit NameRegistered(nameHash, name, auction.highestBidder, auction.highestBid, expiration);
    }

    // ============ Utility Functions ============

    /**
     * @dev Validates a domain name
     * @param name Domain name
     * @return True if valid
     */
    function _isValidName(string calldata name) internal pure returns (bool) {
        bytes memory nameBytes = bytes(name);
        if (nameBytes.length == 0 || nameBytes.length > 63) return false;

        for (uint256 i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];
            // Allow lowercase letters, numbers, and hyphens
            if (
                !(char >= 0x30 && char <= 0x39) // 0-9
                    && !(char >= 0x61 && char <= 0x7A) // a-z
                    && char != 0x2D // hyphen
            ) {
                return false;
            }
            // No leading or trailing hyphens
            if ((i == 0 || i == nameBytes.length - 1) && char == 0x2D) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Gets auction details
     * @param nameHash Name hash
     * @return Auction details
     */
    function getAuction(bytes32 nameHash) external view returns (PremiumAuction memory) {
        return auctions[nameHash];
    }

    // ============ Upgrade Authorization ============

    /**
     * @dev Authorizes upgrade to new implementation
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
