// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./PNSRegistry.sol";

/**
 * @title PNSDomainNFT
 * @dev ERC721 NFT representing tradeable PNS domains
 * Each domain is an NFT that can be transferred, listed for sale, etc.
 */
contract PNSDomainNFT is ERC721, Ownable, ReentrancyGuard {
    /// @notice Reference to registry
    PNSRegistry public registry;

    /// @notice Token ID counter
    uint256 private _tokenIdCounter;

    // ============ Events ============

    /// @notice Mapping of name hash to token ID
    mapping(bytes32 => uint256) public nameHashToTokenId;

    /// @notice Mapping of token ID to name hash
    mapping(uint256 => bytes32) public tokenIdToNameHash;

    /// @notice Base URI for metadata
    string public baseURI;

    // ============ Events ============

    /// @notice Emitted when a domain NFT is minted
    event DomainMinted(
        uint256 indexed tokenId,
        bytes32 indexed nameHash,
        address indexed owner,
        string name
    );

    /// @notice Emitted when a domain NFT is burned
    event DomainBurned(uint256 indexed tokenId, bytes32 indexed nameHash);

    // ============ Initialization ============

    /**
     * @dev Initializes the NFT contract
     * @param registryAddress Registry contract address
     * @param newBaseURI Base URI for metadata
     */
    constructor(address registryAddress, string memory newBaseURI)
        ERC721("Polygon Naming Service", "PNS")
        Ownable(msg.sender)
    {
        require(registryAddress != address(0), "NFT: Invalid registry");
        registry = PNSRegistry(registryAddress);
        baseURI = newBaseURI;
        _tokenIdCounter = 1; // Start from 1, reserve 0
    }

    // ============ Admin Functions ============

    /**
     * @dev Sets the base URI for metadata
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
    }

    // ============ Minting Functions ============

    /**
     * @dev Mints an NFT for a registered domain
     * Can only be called by the registry or owner
     * @param name Domain name
     * @param nameHash Hash of the domain
     * @param owner NFT owner address
     */
    function mintDomain(
        string calldata name,
        bytes32 nameHash,
        address owner
    ) external onlyOwner nonReentrant {
        require(owner != address(0), "NFT: Invalid owner");
        require(nameHashToTokenId[nameHash] == 0, "NFT: Domain already minted");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        nameHashToTokenId[nameHash] = tokenId;
        tokenIdToNameHash[tokenId] = nameHash;

        _safeMint(owner, tokenId);

        emit DomainMinted(tokenId, nameHash, owner, name);
    }

    /**
     * @dev Burns an NFT for an expired domain
     * @param tokenId Token ID to burn
     */
    function burnDomain(uint256 tokenId) external onlyOwner nonReentrant {
        require(ownerOf(tokenId) != address(0), "NFT: Token does not exist");

        bytes32 nameHash = tokenIdToNameHash[tokenId];
        delete nameHashToTokenId[nameHash];
        delete tokenIdToNameHash[tokenId];

        _burn(tokenId);

        emit DomainBurned(tokenId, nameHash);
    }

    // ============ Transfer Overrides ============

    /**
     * @dev Overrides transfer to update registry
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override nonReentrant {
        require(_ownerOf(tokenId) == _msgSender() || isApprovedForAll(from, _msgSender()) || getApproved(tokenId) == _msgSender(), "ERC721: Unauthorized");

        // Update registry
        bytes32 nameHash = tokenIdToNameHash[tokenId];
        if (nameHash != bytes32(0) && registry.exists(nameHash)) {
            // Transfer in registry would need to be called separately
            // Or we could emit an event here for off-chain listeners
        }

        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev Overrides safeTransferFrom
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override nonReentrant {
        require(_ownerOf(tokenId) == _msgSender() || isApprovedForAll(from, _msgSender()) || getApproved(tokenId) == _msgSender(), "ERC721: Unauthorized");
        super.safeTransferFrom(from, to, tokenId, data);
    }

    // ============ Query Functions ============

    /**
     * @dev Gets the token ID for a domain
     * @param nameHash Hash of the domain
     * @return Token ID
     */
    function getTokenId(bytes32 nameHash) external view returns (uint256) {
        return nameHashToTokenId[nameHash];
    }

    /**
     * @dev Gets the name hash for a token
     * @param tokenId Token ID
     * @return Name hash
     */
    function getNameHash(uint256 tokenId) external view returns (bytes32) {
        require(ownerOf(tokenId) != address(0), "NFT: Token does not exist");
        return tokenIdToNameHash[tokenId];
    }

    /**
     * @dev Checks if a domain has an NFT
     * @param nameHash Hash of the domain
     * @return True if minted
     */
    function isDomainMinted(bytes32 nameHash) external view returns (bool) {
        return nameHashToTokenId[nameHash] != 0;
    }

    // ============ Metadata Functions ============

    /**
     * @dev Returns the base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Returns URI for a token
     * @param tokenId Token ID
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(ownerOf(tokenId) != address(0), "NFT: Token does not exist");
        return string(abi.encodePacked(baseURI, _toString(tokenId)));
    }

    /**
     * @dev Converts uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        temp = value;
        while (temp != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (temp % 10)));
            temp /= 10;
        }
        return string(buffer);
    }

    // ============ ERC165 Support ============

    /**
     * @dev Returns whether the contract supports an interface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
