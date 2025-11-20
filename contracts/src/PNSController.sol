// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import { PNSRegistry } from "./PNSRegistry.sol";
import { PNSRegistrar } from "./PNSRegistrar.sol";
import { PNSResolver } from "./PNSResolver.sol";
import { PNSPriceOracle } from "./PNSPriceOracle.sol";

/**
 * @title PNSController
 * @dev User-facing interface for PNS operations
 * Provides simplified registration flow, batch operations, and emergency functions
 */
contract PNSController is Ownable, Initializable, UUPSUpgradeable, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}

    /// @notice Reference to registry contract
    PNSRegistry public registry;

    /// @notice Reference to registrar contract
    PNSRegistrar public registrar;

    /// @notice Reference to default resolver contract
    PNSResolver public defaultResolver;

    /// @notice Emergency pause flag
    bool public paused = false;

    /// @notice Reference to price oracle
    PNSPriceOracle public priceOracle;

    /// @notice Registration fee in basis points (0.5% = 50)
    uint256 public registrationFeeBps = 50;

    /// @notice Fee recipient
    address public feeRecipient;

    /// @notice Rate limit: max registrations per user per day
    uint256 public rateLimitPerDay = 100;

    /// @notice Rate limiting (user -> day -> count)
    mapping(address => mapping(uint256 => uint256)) public registrationCount;

    // ============ Events ============

    /// @notice Emitted when a domain is registered via controller
    event DomainRegistered(string indexed name, address indexed owner, uint256 duration, uint256 totalCost);

    /// @notice Emitted when a domain is renewed via controller
    event DomainRenewed(string indexed name, address indexed owner, uint256 duration, uint256 totalCost);

    /// @notice Emitted when pause state changes
    event PauseStateChanged(bool isPaused);

    /// @notice Emitted when emergency withdrawal happens
    event EmergencyWithdrawal(address indexed recipient, uint256 amount);

    /// @notice Emitted when resolver is updated
    event DefaultResolverUpdated(address indexed newResolver);

    // ============ Modifiers ============

    /// @notice Only when not paused
    modifier whenNotPaused() {
        require(!paused, "Controller: Paused");
        _;
    }

    // ============ Initialization ============

    /**
     * @dev Initializes the controller
     * @param _registry PNSRegistry address
     * @param _registrar PNSRegistrar address
     * @param _resolver Default PNSResolver address
     * @param _feeRecipient Fee recipient address
     */
    function initialize(
        address _registry,
        address _registrar,
        address _resolver,
        address _feeRecipient,
        address _priceOracle
    ) external initializer {
        require(_registry != address(0), "Controller: Invalid registry");
        require(_registrar != address(0), "Controller: Invalid registrar");
        require(_resolver != address(0), "Controller: Invalid resolver");
        require(_feeRecipient != address(0), "Controller: Invalid fee recipient");
        require(_priceOracle != address(0), "Controller: Invalid price oracle");

        registry = PNSRegistry(_registry);
        registrar = PNSRegistrar(_registrar);
        defaultResolver = PNSResolver(_resolver);
        feeRecipient = _feeRecipient;
        priceOracle = PNSPriceOracle(_priceOracle);
    }

    // ============ Admin Functions ============

    /**
     * @dev Sets the default resolver
     * @param _resolver New resolver address
     */
    function setDefaultResolver(address _resolver) external onlyOwner {
        require(_resolver != address(0), "Controller: Invalid resolver");
        defaultResolver = PNSResolver(_resolver);
        emit DefaultResolverUpdated(_resolver);
    }

    /**
     * @dev Sets registration fee in basis points
     * @param bps Basis points (e.g., 50 = 0.5%)
     */
    function setRegistrationFeeBps(uint256 bps) external onlyOwner {
        require(bps <= 10000, "Controller: Invalid BPS");
        registrationFeeBps = bps;
    }

    /**
     * @dev Sets the fee recipient
     * @param _recipient New recipient address
     */
    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Controller: Invalid recipient");
        feeRecipient = _recipient;
    }

    /**
     * @dev Sets the price oracle
     */
    function setPriceOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Controller: Invalid oracle");
        priceOracle = PNSPriceOracle(_oracle);
    }

    /**
     * @dev Sets rate limit
     * @param limit Max registrations per day per user
     */
    function setRateLimit(uint256 limit) external onlyOwner {
        rateLimitPerDay = limit;
    }

    /**
     * @dev Toggles pause state
     * @param _paused New pause state
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PauseStateChanged(_paused);
    }

    // ============ Registration Functions ============

    /**
     * @dev Registers a domain with address resolution
     * @param name Domain name
     * @param owner Owner address
     * @param duration Duration in years
     * @param resolveAddr Address to resolve the domain to
     */
    function registerWithAddress(string calldata name, address owner, uint256 duration, address resolveAddr)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        require(owner != address(0), "Controller: Invalid owner");
        require(duration > 0 && duration <= 10, "Controller: Invalid duration");

        // Rate limiting
        _checkRateLimit(msg.sender);

        bytes32 nameHash = keccak256(abi.encodePacked(name, ".poly"));

        // Register the domain
        registrar.register{value: msg.value}(name, owner, duration, address(defaultResolver));

        // Set address resolution
        if (resolveAddr != address(0)) {
            defaultResolver.setPolygonAddr(nameHash, resolveAddr);
        }

        emit DomainRegistered(name, owner, duration, msg.value);
    }

    /**
     * @dev Registers a domain with metadata
     * @param name Domain name
     * @param owner Owner address
     * @param duration Duration in years
     * @param resolveAddr Address to resolve to
     * @param avatar Avatar URI
     * @param website Website URL
     * @param email Email address
     */
    function registerWithMetadata(
        string calldata name,
        address owner,
        uint256 duration,
        address resolveAddr,
        string calldata avatar,
        string calldata website,
        string calldata email
    ) external payable whenNotPaused nonReentrant {
        require(owner != address(0), "Controller: Invalid owner");
        require(duration > 0 && duration <= 10, "Controller: Invalid duration");

        _checkRateLimit(msg.sender);

        bytes32 nameHash = keccak256(abi.encodePacked(name, ".poly"));

        // Register the domain
        registrar.register{value: msg.value}(name, owner, duration, address(defaultResolver));

        // Set resolution and metadata
        if (resolveAddr != address(0)) {
            defaultResolver.setPolygonAddr(nameHash, resolveAddr);
        }

        // Set metadata text records
        string[] memory keys = new string[](3);
        string[] memory values = new string[](3);

        keys[0] = "avatar";
        values[0] = avatar;
        keys[1] = "website";
        values[1] = website;
        keys[2] = "email";
        values[2] = email;

        defaultResolver.setMultipleTextRecords(nameHash, keys, values);

        emit DomainRegistered(name, owner, duration, msg.value);
    }

    /**
     * @dev Simple domain registration
     * @param name Domain name
     * @param owner Owner address
     * @param duration Duration in years
     */
    function registerDomain(string calldata name, address owner, uint256 duration)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        require(owner != address(0), "Controller: Invalid owner");
        require(duration > 0 && duration <= 10, "Controller: Invalid duration");

        _checkRateLimit(msg.sender);

        registrar.register{value: msg.value}(name, owner, duration, address(defaultResolver));

        emit DomainRegistered(name, owner, duration, msg.value);
    }

    /**
     * @dev Batch register multiple domains
     * @param names Array of domain names
     * @param owner Owner address (same for all)
     * @param duration Duration in years (same for all)
     */
    function batchRegister(string[] calldata names, address owner, uint256 duration)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        require(names.length > 0, "Controller: Empty batch");
        require(names.length <= 10, "Controller: Batch too large");
        require(owner != address(0), "Controller: Invalid owner");
        require(duration > 0 && duration <= 10, "Controller: Invalid duration");

        uint256 totalCost = 0;
        for (uint256 i = 0; i < names.length; i++) {
            bytes32 hash = keccak256(abi.encodePacked(names[i], ".poly"));
            uint256 price = priceOracle.getPrice(hash, names[i], duration);
            totalCost += price;
        }

        require(msg.value >= totalCost, "Controller: Insufficient total payment");

        for (uint256 i = 0; i < names.length; i++) {
            bytes32 hash = keccak256(abi.encodePacked(names[i], ".poly"));
            uint256 price = priceOracle.getPrice(hash, names[i], duration);

            registrar.register{value: price}(names[i], owner, duration, address(defaultResolver));
        }

        emit DomainRegistered("batch", owner, duration, totalCost);
    }

    // ============ Renewal Functions ============

    /**
     * @dev Renews a domain registration
     * @param name Domain name
     * @param duration Renewal duration in years
     */
    function renewDomain(string calldata name, uint256 duration) external payable whenNotPaused nonReentrant {
        require(duration > 0 && duration <= 10, "Controller: Invalid duration");

        registrar.renew{value: msg.value}(name, duration);

        emit DomainRenewed(name, msg.sender, duration, msg.value);
    }

    /**
     * @dev Batch renew multiple domains
     * @param names Array of domain names
     * @param duration Renewal duration in years (same for all)
     */
    function batchRenew(string[] calldata names, uint256 duration) external payable whenNotPaused nonReentrant {
        require(names.length > 0, "Controller: Empty batch");
        require(names.length <= 10, "Controller: Batch too large");
        require(duration > 0 && duration <= 10, "Controller: Invalid duration");

        for (uint256 i = 0; i < names.length; i++) {
            registrar.renew(names[i], duration);
        }

        emit DomainRenewed("", msg.sender, duration, msg.value);
    }

    // ============ Domain Query Functions ============

    /**
     * @dev Checks if a domain is available
     * @param name Domain name
     * @return True if available
     */
    function isDomainAvailable(string calldata name) external view returns (bool) {
        bytes32 nameHash = keccak256(abi.encodePacked(name, ".poly"));

        if (!registry.exists(nameHash)) {
            return true;
        }

        (,, uint64 expiration) = registry.getNameRecord(nameHash);
        return expiration + registrar.gracePeriod() <= block.timestamp;
    }

    /**
     * @dev Gets domain expiration
     * @param name Domain name
     * @return Expiration timestamp
     */
    function getDomainExpiration(string calldata name) external view returns (uint64) {
        bytes32 nameHash = keccak256(abi.encodePacked(name, ".poly"));
        require(registry.exists(nameHash), "Controller: Domain not found");

        (,, uint64 expiration) = registry.getNameRecord(nameHash);
        return expiration;
    }

    /**
     * @dev Gets domain owner
     * @param name Domain name
     * @return Owner address
     */
    function getDomainOwner(string calldata name) external view returns (address) {
        bytes32 nameHash = keccak256(abi.encodePacked(name, ".poly"));
        require(registry.exists(nameHash), "Controller: Domain not found");

        (address owner,,) = registry.getNameRecord(nameHash);
        return owner;
    }

    /**
     * @dev Gets domain resolver address
     * @param name Domain name
     * @return Resolver address
     */
    function getDomainResolver(string calldata name) external view returns (address) {
        bytes32 nameHash = keccak256(abi.encodePacked(name, ".poly"));
        return registry.getResolver(nameHash);
    }

    // ============ Emergency Functions ============

    /**
     * @dev Emergency withdrawal by owner
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "Controller: No funds");

        (bool success,) = owner().call{value: balance}("");
        require(success, "Controller: Withdrawal failed");

        emit EmergencyWithdrawal(owner(), balance);
    }

    /**
     * @dev Emergency withdrawal of specific amount
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawAmount(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Controller: Insufficient balance");

        (bool success,) = owner().call{value: amount}("");
        require(success, "Controller: Withdrawal failed");

        emit EmergencyWithdrawal(owner(), amount);
    }

    // ============ Internal Functions ============

    /**
     * @dev Checks rate limiting
     * @param user User address
     */
    function _checkRateLimit(address user) internal {
        uint256 day = block.timestamp / 1 days;
        require(registrationCount[user][day] < rateLimitPerDay, "Controller: Rate limit exceeded");
        registrationCount[user][day]++;
    }

    /**
     * @dev Checks rate limiting for batch
     * @param user User address
     * @param count Batch count
     */
    function _checkRateLimit(address user, uint256 count) internal {
        uint256 day = block.timestamp / 1 days;
        require(registrationCount[user][day] + count <= rateLimitPerDay, "Controller: Rate limit exceeded");
        registrationCount[user][day] += count;
    }

    // ============ Fallback Functions ============

    /**
     * @dev Receive ether
     */
    receive() external payable {}

    // ============ Upgrade Authorization ============

    /**
     * @dev Authorizes upgrade to new implementation
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
