// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title PNSResolver
 * @dev Resolution contract for storing and retrieving name records
 * Supports multiple record types: addresses, content hashes, and text records
 */
contract PNSResolver is AccessControl, Initializable, UUPSUpgradeable, ReentrancyGuard {
    /// @notice Role for registry contracts
    bytes32 public constant REGISTRY_ROLE = keccak256("REGISTRY_ROLE");

    /// @notice Stored text records (nameHash -> recordType -> value)
    mapping(bytes32 => mapping(string => string)) public textRecords;

    /// @notice Stored address records (nameHash -> coinType -> address)
    mapping(bytes32 => mapping(uint256 => address)) public addressRecords;

    /// @notice Content hash records (nameHash -> contenthash)
    mapping(bytes32 => bytes) public contentHashRecords;

    /// @notice Metadata about supported coin types
    mapping(uint256 => string) public coinTypes;

    /// @notice Owner address
    address public owner;

    // ============ Events ============

    /// @notice Emitted when an address record is updated
    event AddressRecordSet(
        bytes32 indexed nameHash,
        uint256 indexed coinType,
        address indexed addr
    );

    /// @notice Emitted when a text record is updated
    event TextRecordSet(bytes32 indexed nameHash, string indexed key, string value);

    /// @notice Emitted when content hash is updated
    event ContentHashSet(bytes32 indexed nameHash, bytes hash);

    /// @notice Emitted when records are cleared
    event RecordsCleared(bytes32 indexed nameHash);

    // ============ Initialization ============

    /**
     * @dev Initializes the resolver
     * @param admin Initial admin address
     * @param registry Registry contract address
     */
    function initialize(address admin, address registry) external initializer {
        require(admin != address(0), "Resolver: Invalid admin");
        require(registry != address(0), "Resolver: Invalid registry");

        owner = admin;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRY_ROLE, registry);

        // Initialize common coin types
        coinTypes[60] = "ETH"; // Ethereum
        coinTypes[966] = "MATIC"; // Polygon
    }

    // ============ Admin Functions ============

    /**
     * @dev Adds a supported coin type
     * @param coinType Coin type ID
     * @param coinName Coin name
     */
    function addCoinType(uint256 coinType, string calldata coinName)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(bytes(coinName).length > 0, "Resolver: Invalid coin name");
        coinTypes[coinType] = coinName;
    }

    /**
     * @dev Registers a new resolver for a name (called by registry)
     * @param nameHash Hash of the name
     */
    function registerResolver(bytes32 nameHash) external onlyRole(REGISTRY_ROLE) {
        // This is just a notification function
        // Can be used to initialize resolver data for a new name
    }

    // ============ Address Record Functions ============

    /**
     * @dev Sets an address record for a name
     * @param nameHash Hash of the name
     * @param coinType Coin type (60 for ETH/Polygon)
     * @param addr Address to store
     */
    function setAddr(
        bytes32 nameHash,
        uint256 coinType,
        address addr
    ) external nonReentrant {
        require(msg.sender == tx.origin || hasRole(REGISTRY_ROLE, msg.sender),
            "Resolver: Unauthorized");

        addressRecords[nameHash][coinType] = addr;
        emit AddressRecordSet(nameHash, coinType, addr);
    }

    /**
     * @dev Gets an address record for a name
     * @param nameHash Hash of the name
     * @param coinType Coin type
     * @return Address stored for the coin type
     */
    function getAddr(bytes32 nameHash, uint256 coinType)
        external
        view
        returns (address)
    {
        return addressRecords[nameHash][coinType];
    }

    /**
     * @dev Sets Polygon address (convenience function for coin type 966)
     * @param nameHash Hash of the name
     * @param addr Polygon address
     */
    function setPolygonAddr(bytes32 nameHash, address addr) external nonReentrant {
        require(msg.sender == tx.origin || hasRole(REGISTRY_ROLE, msg.sender),
            "Resolver: Unauthorized");

        addressRecords[nameHash][966] = addr;
        emit AddressRecordSet(nameHash, 966, addr);
    }

    /**
     * @dev Gets Polygon address for a name
     * @param nameHash Hash of the name
     * @return Polygon address
     */
    function getPolygonAddr(bytes32 nameHash) external view returns (address) {
        return addressRecords[nameHash][966];
    }

    // ============ Text Record Functions ============

    /**
     * @dev Sets a text record
     * @param nameHash Hash of the name
     * @param key Record key (e.g., "avatar", "email", "website")
     * @param value Record value
     */
    function setText(
        bytes32 nameHash,
        string calldata key,
        string calldata value
    ) external nonReentrant {
        require(msg.sender == tx.origin || hasRole(REGISTRY_ROLE, msg.sender),
            "Resolver: Unauthorized");
        require(bytes(key).length > 0, "Resolver: Invalid key");

        textRecords[nameHash][key] = value;
        emit TextRecordSet(nameHash, key, value);
    }

    /**
     * @dev Gets a text record
     * @param nameHash Hash of the name
     * @param key Record key
     * @return Record value
     */
    function getText(bytes32 nameHash, string calldata key)
        external
        view
        returns (string memory)
    {
        return textRecords[nameHash][key];
    }

    /**
     * @dev Sets multiple text records in one transaction
     * @param nameHash Hash of the name
     * @param keys Array of record keys
     * @param values Array of record values
     */
    function setMultipleTextRecords(
        bytes32 nameHash,
        string[] calldata keys,
        string[] calldata values
    ) external nonReentrant {
        require(msg.sender == tx.origin || hasRole(REGISTRY_ROLE, msg.sender),
            "Resolver: Unauthorized");
        require(keys.length == values.length, "Resolver: Array length mismatch");

        for (uint256 i = 0; i < keys.length; i++) {
            require(bytes(keys[i]).length > 0, "Resolver: Invalid key");
            textRecords[nameHash][keys[i]] = values[i];
            emit TextRecordSet(nameHash, keys[i], values[i]);
        }
    }

    // ============ Content Hash Functions ============

    /**
     * @dev Sets a content hash (IPFS, Arweave, etc.)
     * @param nameHash Hash of the name
     * @param hash Content hash bytes
     */
    function setContentHash(bytes32 nameHash, bytes calldata hash)
        external
        nonReentrant
    {
        require(msg.sender == tx.origin || hasRole(REGISTRY_ROLE, msg.sender),
            "Resolver: Unauthorized");
        require(hash.length > 0, "Resolver: Invalid content hash");

        contentHashRecords[nameHash] = hash;
        emit ContentHashSet(nameHash, hash);
    }

    /**
     * @dev Gets a content hash
     * @param nameHash Hash of the name
     * @return Content hash bytes
     */
    function getContentHash(bytes32 nameHash)
        external
        view
        returns (bytes memory)
    {
        return contentHashRecords[nameHash];
    }

    // ============ Reverse Resolution Functions ============

    /**
     * @dev Returns a name string (for reverse resolution display)
     * @param label The label/name
     * @return The formatted name with .poly TLD
     */
    function name(bytes32, string calldata label)
        external
        pure
        returns (string memory)
    {
        return string(abi.encodePacked(label, ".poly"));
    }

    // ============ Utility Functions ============

    /**
     * @dev Clears all records for a name
     * @param nameHash Hash of the name
     */
    function clearRecords(bytes32 nameHash)
        external
        nonReentrant
    {
        require(msg.sender == tx.origin || hasRole(REGISTRY_ROLE, msg.sender),
            "Resolver: Unauthorized");

        // Note: We can't iterate over mappings, so we clear known records
        // In production, you'd want to track which records exist
        delete contentHashRecords[nameHash];
        emit RecordsCleared(nameHash);
    }

    /**
     * @dev Checks if a record exists
     * @param nameHash Hash of the name
     * @param key Record key
     * @return True if text record exists
     */
    function hasTextRecord(bytes32 nameHash, string calldata key)
        external
        view
        returns (bool)
    {
        return bytes(textRecords[nameHash][key]).length > 0;
    }

    /**
     * @dev Checks if an address record exists
     * @param nameHash Hash of the name
     * @param coinType Coin type
     * @return True if address record exists
     */
    function hasAddressRecord(bytes32 nameHash, uint256 coinType)
        external
        view
        returns (bool)
    {
        return addressRecords[nameHash][coinType] != address(0);
    }

    // ============ Upgrade Authorization ============

    /**
     * @dev Authorizes upgrade to new implementation
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
}
