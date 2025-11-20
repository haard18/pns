// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title PNSRegistry
 * @dev Central registry contract for Polygon Naming Service
 * Manages ownership of domains/names, name-to-address mappings, and subdomains
 */
contract PNSRegistry is AccessControl, Initializable, UUPSUpgradeable, ReentrancyGuard {
    /// @notice Role for admin operations
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    /// @notice Role for registrar contracts
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    /// @notice Role for resolver contracts
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");

    /// @notice Represents a registered name
    struct NameRecord {
        address owner;
        address resolver;
        uint64 expiration;
        uint96 reserved; // For future use
    }

    /// @notice Wrap state to ensure mutual exclusivity across chains
    enum WrapChain {
        None,
        Polygon,
        Solana
    }

    /// @notice Mirror metadata for Solana domain PDA
    struct MirrorInfo {
        bytes32 solanaPda;
        uint64 lastSyncedSlot;
        WrapChain wrapState;
    }

    /// @notice Stores all registered names
    mapping(bytes32 => NameRecord) public records;

    /// @notice Stores reverse mappings (address -> name)
    mapping(address => bytes32) public reverseRecords;

    /// @notice Stores subdomains and their owners
    mapping(bytes32 => mapping(bytes32 => address)) public subdomains;

    /// @notice Tracks if a name exists
    mapping(bytes32 => bool) public exists;

    /// @notice Tracks mirror data for Solana PDAs
    mapping(bytes32 => MirrorInfo) public mirrorData;

    /// @notice Tracks per-record versions for conflict resolution
    mapping(bytes32 => mapping(bytes32 => uint64)) public recordVersions;

    /// @notice Base TLD for the service (.poly)
    bytes32 public baseTld;

    /// @notice Owner address (for non-upgradeable operations)
    address public owner;

    // ============ Events ============

    /// @notice Emitted when a name is registered
    event NameRegistered(
        bytes32 indexed nameHash, string name, address indexed owner, address indexed resolver, uint64 expiration
    );

    /// @notice Emitted when a name is renewed
    event NameRenewed(bytes32 indexed nameHash, uint64 newExpiration);

    /// @notice Emitted when ownership is transferred
    event OwnershipTransferred(bytes32 indexed nameHash, address indexed oldOwner, address indexed newOwner);

    /// @notice Emitted when resolver is updated
    event ResolverUpdated(bytes32 indexed nameHash, address indexed newResolver);

    /// @notice Emitted when reverse record is set
    event ReverseRecordSet(address indexed addr, bytes32 indexed nameHash);

    /// @notice Emitted when a subdomain is created
    event SubdomainCreated(bytes32 indexed parent, bytes32 indexed subdomain, address indexed owner);

    /// @notice Emitted when a name expires
    event NameExpired(bytes32 indexed nameHash);

    /// @notice Emitted when a Solana PDA pointer is updated
    event DomainMirrored(bytes32 indexed nameHash, bytes32 indexed solanaPda, uint64 indexed slot);

    /// @notice Emitted when backend requests a record sync
    event RecordSyncRequested(
        bytes32 indexed nameHash, bytes32 indexed keyHash, uint64 version, address indexed requester
    );

    /// @notice Emitted when wrap state changes
    event WrapStateUpdated(bytes32 indexed nameHash, WrapChain state);

    // ============ Modifiers ============

    /// @notice Only owner of the name can call
    modifier onlyNameOwner(bytes32 nameHash) {
        require(records[nameHash].owner == msg.sender, "PNS: Not name owner");
        _;
    }

    /// @notice Only if name exists
    modifier nameExists(bytes32 nameHash) {
        require(exists[nameHash], "PNS: Name does not exist");
        _;
    }

    /// @notice Only if name is not expired
    modifier nameNotExpired(bytes32 nameHash) {
        require(records[nameHash].expiration > block.timestamp, "PNS: Name has expired");
        _;
    }

    // ============ Initialization ============

    /**
     * @dev Initializes the registry
     * @param admin Initial admin address
     */
    function initialize(address admin) external initializer {
        require(admin != address(0), "PNS: Invalid admin address");

        owner = admin;
        baseTld = keccak256(abi.encodePacked(".poly"));

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // ============ Admin Functions ============

    /**
     * @dev Grants registrar role to an address
     * @param registrar Address to grant registrar role
     */
    function setRegistrar(address registrar) external onlyRole(ADMIN_ROLE) {
        require(registrar != address(0), "PNS: Invalid registrar address");
        grantRole(REGISTRAR_ROLE, registrar);
    }

    /**
     * @dev Grants resolver role to an address
     * @param resolver Address to grant resolver role
     */
    function setResolver(address resolver) external onlyRole(ADMIN_ROLE) {
        require(resolver != address(0), "PNS: Invalid resolver address");
        grantRole(RESOLVER_ROLE, resolver);
    }

    /**
     * @dev Removes a role from an address
     * @param account Address to revoke role from
     * @param role Role to revoke
     */
    function revokeAccess(address account, bytes32 role) external onlyRole(ADMIN_ROLE) {
        revokeRole(role, account);
    }

    // ============ Registration Functions ============

    /**
     * @dev Registers a new name (called by Registrar)
     * @param nameHash Hash of the name
     * @param nameOwner Address of the name owner
     * @param resolver Initial resolver contract
     * @param expiration Expiration timestamp
     */
    function registerName(bytes32 nameHash, address nameOwner, address resolver, uint64 expiration)
        external
        onlyRole(REGISTRAR_ROLE)
        nonReentrant
    {
        require(nameOwner != address(0), "PNS: Invalid owner address");
        require(expiration > block.timestamp, "PNS: Invalid expiration");
        require(!exists[nameHash], "PNS: Name already registered");

        records[nameHash] = NameRecord({
            owner: nameOwner,
            resolver: resolver != address(0) ? resolver : address(0),
            expiration: expiration,
            reserved: 0
        });

        exists[nameHash] = true;

        emit NameRegistered(nameHash, "", nameOwner, resolver, expiration);
    }

    /**
     * @dev Renews a name (called by Registrar)
     * @param nameHash Hash of the name
     * @param newExpiration New expiration timestamp
     */
    function renewName(bytes32 nameHash, uint64 newExpiration)
        external
        onlyRole(REGISTRAR_ROLE)
        nameExists(nameHash)
        nonReentrant
    {
        require(newExpiration > block.timestamp, "PNS: Invalid expiration");
        require(newExpiration > records[nameHash].expiration, "PNS: Cannot shorten expiration");

        records[nameHash].expiration = newExpiration;
        emit NameRenewed(nameHash, newExpiration);
    }

    /**
     * @dev Transfers name ownership
     * @param nameHash Hash of the name
     * @param newOwner New owner address
     */
    function transferName(bytes32 nameHash, address newOwner)
        external
        onlyNameOwner(nameHash)
        nameExists(nameHash)
        nameNotExpired(nameHash)
        nonReentrant
    {
        require(newOwner != address(0), "PNS: Invalid new owner");
        require(newOwner != records[nameHash].owner, "PNS: Same owner");

        address oldOwner = records[nameHash].owner;
        records[nameHash].owner = newOwner;

        // Clear reverse record for old owner
        if (reverseRecords[oldOwner] == nameHash) {
            delete reverseRecords[oldOwner];
        }

        emit OwnershipTransferred(nameHash, oldOwner, newOwner);
    }

    // ============ Resolver Functions ============

    /**
     * @dev Sets the resolver for a name
     * @param nameHash Hash of the name
     * @param resolver New resolver contract address
     */
    function setNameResolver(bytes32 nameHash, address resolver)
        external
        onlyNameOwner(nameHash)
        nameExists(nameHash)
        nameNotExpired(nameHash)
        nonReentrant
    {
        records[nameHash].resolver = resolver;
        emit ResolverUpdated(nameHash, resolver);
    }

    /**
     * @dev Gets the resolver for a name
     * @param nameHash Hash of the name
     * @return Resolver contract address
     */
    function getResolver(bytes32 nameHash) external view returns (address) {
        return records[nameHash].resolver;
    }

    // ============ Reverse Resolution Functions ============

    /**
     * @dev Sets a reverse record (address -> name)
     * @param nameHash Hash of the name
     */
    function setReverseRecord(bytes32 nameHash)
        external
        onlyNameOwner(nameHash)
        nameExists(nameHash)
        nameNotExpired(nameHash)
        nonReentrant
    {
        reverseRecords[msg.sender] = nameHash;
        emit ReverseRecordSet(msg.sender, nameHash);
    }

    /**
     * @dev Gets the reverse record for an address
     * @param addr Address to look up
     * @return Name hash registered to the address
     */
    function getReverseRecord(address addr) external view returns (bytes32) {
        return reverseRecords[addr];
    }

    // ============ Subdomain Functions ============

    /**
     * @dev Creates a subdomain
     * @param parent Parent domain name hash
     * @param label Subdomain label
     * @param subdomainOwner Subdomain owner
     */
    function createSubdomain(bytes32 parent, bytes32 label, address subdomainOwner)
        external
        onlyNameOwner(parent)
        nameExists(parent)
        nameNotExpired(parent)
        nonReentrant
    {
        require(subdomainOwner != address(0), "PNS: Invalid subdomain owner");
        require(subdomains[parent][label] == address(0), "PNS: Subdomain exists");

        subdomains[parent][label] = subdomainOwner;
        emit SubdomainCreated(parent, label, subdomainOwner);
    }

    /**
     * @dev Gets the owner of a subdomain
     * @param parent Parent domain hash
     * @param label Subdomain label
     * @return Owner of the subdomain
     */
    function getSubdomainOwner(bytes32 parent, bytes32 label) external view returns (address) {
        return subdomains[parent][label];
    }

    /**
     * @dev Transfers subdomain ownership
     * @param parent Parent domain hash
     * @param label Subdomain label
     * @param newSubdomainOwner New owner address
     */
    function transferSubdomain(bytes32 parent, bytes32 label, address newSubdomainOwner)
        external
        onlyNameOwner(parent)
        nameExists(parent)
        nonReentrant
    {
        require(subdomains[parent][label] != address(0), "PNS: Subdomain does not exist");
        require(newSubdomainOwner != address(0), "PNS: Invalid new owner");

        subdomains[parent][label] = newSubdomainOwner;
    }

    // ============ Name Info Functions ============

    /**
     * @dev Gets all information about a name
     * @param nameHash Hash of the name
     * @return nameOwner Name owner
     * @return resolver Name resolver
     * @return expiration Expiration timestamp
     */
    function getNameRecord(bytes32 nameHash)
        external
        view
        nameExists(nameHash)
        returns (address nameOwner, address resolver, uint64 expiration)
    {
        NameRecord storage record = records[nameHash];
        return (record.owner, record.resolver, record.expiration);
    }

    /**
     * @dev Checks if a name is expired
     * @param nameHash Hash of the name
     * @return True if expired
     */
    function isExpired(bytes32 nameHash) external view returns (bool) {
        return records[nameHash].expiration <= block.timestamp;
    }

    /**
     * @dev Checks if a name exists and is not expired
     * @param nameHash Hash of the name
     * @return True if valid
     */
    function isValid(bytes32 nameHash) external view returns (bool) {
        return exists[nameHash] && records[nameHash].expiration > block.timestamp;
    }

    // ============ Expiration Functions ============

    /**
     * @dev Marks a name as expired (can be called after grace period)
     * @param nameHash Hash of the name
     */
    function expireName(bytes32 nameHash) external onlyRole(REGISTRAR_ROLE) nameExists(nameHash) nonReentrant {
        require(records[nameHash].expiration <= block.timestamp, "PNS: Name not yet expired");
        delete records[nameHash];
        delete exists[nameHash];
        delete reverseRecords[records[nameHash].owner];

        emit NameExpired(nameHash);
    }

    // ============ Mirror / Cross-Chain Functions ============

    /**
     * @dev Sets the Solana PDA pointer for a name
     * @param nameHash Hash of the name
     * @param solanaPda PDA bytes32
     * @param slot Last synced Solana slot
     */
    function setSolanaPointer(bytes32 nameHash, bytes32 solanaPda, uint64 slot)
        external
        onlyRole(ADMIN_ROLE)
        nameExists(nameHash)
    {
        mirrorData[nameHash].solanaPda = solanaPda;
        mirrorData[nameHash].lastSyncedSlot = slot;
        emit DomainMirrored(nameHash, solanaPda, slot);
    }

    /**
     * @dev Updates wrap state to enforce single-chain NFTs
     */
    function setWrapState(bytes32 nameHash, WrapChain state) external onlyRole(ADMIN_ROLE) nameExists(nameHash) {
        mirrorData[nameHash].wrapState = state;
        emit WrapStateUpdated(nameHash, state);
    }

    /**
     * @dev Increments record version for a given key hash (called by resolver)
     */
    function bumpRecordVersion(bytes32 nameHash, bytes32 keyHash)
        external
        onlyRole(RESOLVER_ROLE)
        nameExists(nameHash)
        returns (uint64 newVersion)
    {
        uint64 updated = uint64(recordVersions[nameHash][keyHash] + 1);
        recordVersions[nameHash][keyHash] = updated;
        emit RecordSyncRequested(nameHash, keyHash, updated, msg.sender);
        return updated;
    }

    /**
     * @dev Fetches latest record version
     */
    function getRecordVersion(bytes32 nameHash, bytes32 keyHash) external view returns (uint64) {
        return recordVersions[nameHash][keyHash];
    }

    // ============ Upgrade Authorization ============

    /**
     * @dev Authorizes upgrade to new implementation
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
