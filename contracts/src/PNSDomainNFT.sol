// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { PNSRegistry } from "./PNSRegistry.sol";

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

    /// @notice Mapping of name hash to token ID
    mapping(bytes32 => uint256) public nameHashToTokenId;

    /// @notice Mapping of token ID to name hash
    mapping(uint256 => bytes32) public tokenIdToNameHash;

    /// @notice Mapping of token ID to domain name
    mapping(uint256 => string) public tokenIdToDomainName;

    /// @notice Base URI for metadata
    string public baseURI;

    /// @notice Marketplace contract address
    address public marketplace;

    /// @notice Tracks which chain currently hosts the active wrapper (currently Polygon only)
    enum MintChain {
        None,
        Polygon
    }

    mapping(bytes32 => MintChain) public mintChainByNameHash;
    mapping(uint256 => bool) public frozenToken;

    // ============ Events ============

    /// @notice Emitted when a domain NFT is minted
    event DomainMinted(uint256 indexed tokenId, bytes32 indexed nameHash, address indexed owner, string name);

    /// @notice Emitted when a domain NFT is burned
    event DomainBurned(uint256 indexed tokenId, bytes32 indexed nameHash);

    /// @notice Emitted when wrap state flips chains
    event WrapStateChanged(bytes32 indexed nameHash, MintChain indexed chain);

    /// @notice Emitted when freeze state changes
    event TokenFrozen(uint256 indexed tokenId, bool frozen);

    /// @notice Emitted when marketplace address is updated
    event MarketplaceUpdated(address indexed oldMarketplace, address indexed newMarketplace);

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

    /**
     * @dev Sets the marketplace contract address
     * @param _marketplace Marketplace contract address
     */
    function setMarketplace(address _marketplace) external onlyOwner {
        require(_marketplace != address(0), "NFT: Invalid marketplace");
        address oldMarketplace = marketplace;
        marketplace = _marketplace;
        emit MarketplaceUpdated(oldMarketplace, _marketplace);
    }

    /**
     * @dev Marks a domain as wrapped - currently only Polygon wrapping is supported
     */
    function markExternalWrap(bytes32 nameHash, MintChain chain) external onlyOwner {
        require(chain == MintChain.Polygon, "NFT: Polygon wrapping is the only supported option");
        require(mintChainByNameHash[nameHash] != MintChain.Polygon, "NFT: Polygon token exists");
        mintChainByNameHash[nameHash] = chain;
        emit WrapStateChanged(nameHash, chain);
    }

    // ============ Minting Functions ============

    /**
     * @dev Mints an NFT for a registered domain
     * Can only be called by the registry or owner
     * @param name Domain name
     * @param nameHash Hash of the domain
     * @param owner NFT owner address
     */
    function mintDomain(string calldata name, bytes32 nameHash, address owner) external onlyOwner nonReentrant {
        require(owner != address(0), "NFT: Invalid owner");
        require(nameHashToTokenId[nameHash] == 0, "NFT: Domain already minted");
        require(
            mintChainByNameHash[nameHash] == MintChain.None || mintChainByNameHash[nameHash] == MintChain.Polygon,
            "NFT: Domain already wrapped"
        );

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        nameHashToTokenId[nameHash] = tokenId;
        tokenIdToNameHash[tokenId] = nameHash;
        tokenIdToDomainName[tokenId] = name;

        _safeMint(owner, tokenId);
        mintChainByNameHash[nameHash] = MintChain.Polygon;

        emit DomainMinted(tokenId, nameHash, owner, name);
        emit WrapStateChanged(nameHash, MintChain.Polygon);
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
        delete tokenIdToDomainName[tokenId];
        delete frozenToken[tokenId];
        mintChainByNameHash[nameHash] = MintChain.None;

        _burn(tokenId);

        emit DomainBurned(tokenId, nameHash);
        emit WrapStateChanged(nameHash, MintChain.None);
    }

    /**
     * @dev Freezes a token before bridging
     */
    function freezeToken(uint256 tokenId) external onlyOwner {
        frozenToken[tokenId] = true;
        emit TokenFrozen(tokenId, true);
    }

    /**
     * @dev Unfreezes a token after bridge completes
     */
    function unfreezeToken(uint256 tokenId) external onlyOwner {
        frozenToken[tokenId] = false;
        emit TokenFrozen(tokenId, false);
    }

    // ============ Transfer Overrides ============

    /**
     * @dev Overrides transfer to update registry
     */
    function transferFrom(address from, address to, uint256 tokenId) public override nonReentrant {
        require(
            _ownerOf(tokenId) == _msgSender() || isApprovedForAll(from, _msgSender())
                || getApproved(tokenId) == _msgSender(),
            "ERC721: Unauthorized"
        );

        // Update registry
        bytes32 nameHash = tokenIdToNameHash[tokenId];
        require(!frozenToken[tokenId], "NFT: Token frozen");
        if (nameHash != bytes32(0) && registry.exists(nameHash)) {
            // Transfer in registry would need to be called separately
            // Or we could emit an event here for off-chain listeners
        }

        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev Overrides safeTransferFrom
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        override
        nonReentrant
    {
        require(
            _ownerOf(tokenId) == _msgSender() || isApprovedForAll(from, _msgSender())
                || getApproved(tokenId) == _msgSender(),
            "ERC721: Unauthorized"
        );
        require(!frozenToken[tokenId], "NFT: Token frozen");
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
     * @dev Returns URI for a token - generates dynamic SVG with domain name
     * @param tokenId Token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "NFT: Token does not exist");
        
        string memory domainName = tokenIdToDomainName[tokenId];
        string memory svg = _generateSVG(domainName);
        string memory json = _generateMetadata(domainName, svg);
        
        return string(abi.encodePacked("data:application/json;base64,", _base64Encode(bytes(json))));
    }

    /**
     * @dev Generates dynamic SVG with domain name
     * @param domainName Domain name to display
     */
    function _generateSVG(string memory domainName) internal pure returns (string memory) {
        return string(abi.encodePacked(
            _getSVGPart1(),
            domainName,
            _getSVGPart2()
        ));
    }

    /**
     * @dev First part of SVG template (before domain name)
     */
    function _getSVGPart1() internal pure returns (string memory) {
        return string(abi.encodePacked(
            _getSVGPart1a(),
            _getSVGPart1b()
        ));
    }

    /**
     * @dev First part of SVG template - Part A (header and defs)
     */
    function _getSVGPart1a() internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
            '<linearGradient id="paint0_linear" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">',
            '<stop stop-color="#1616E9"/>',
            '<stop offset="1" stop-color="#04042F"/>',
            '</linearGradient>',
            '<clipPath id="clip0"><rect width="200" height="200" fill="white"/></clipPath>',
            '</defs>',
            '<g clip-path="url(#clip0)">',
            '<rect width="200" height="200" fill="url(#paint0_linear)"/>'
        ));
    }

    /**
     * @dev First part of SVG template - Part B (overlay graphics)
     */
    function _getSVGPart1b() internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<g style="mix-blend-mode:overlay" opacity="0.5">',
            '<path fill-rule="evenodd" clip-rule="evenodd" d="M111.518 40.599C115.239 41.245 117.734 41.895 120.333 42.896C123.101 43.961 127.268 46.225 129.354 47.796C131.137 49.139 133.746 52.064 133.746 52.72C133.746 53.044 133.373 53.184 131.907 53.411C129.56 53.775 127.778 54.626 126.798 55.851L126.031 56.809L124.369 56.677C122.491 56.527 120.765 55.972 116.239 54.06C110.164 51.495 107.923 51.049 101.177 51.066L96.594 51.078L98.137 51.888C101.379 53.589 103.677 54.334 107.717 54.994C110.323 55.42 110.643 55.589 110.942 56.697C111.253 57.847 112.492 59.335 113.483 59.749C114.505 60.176 116.99 60.166 118.443 59.729C119.561 59.392 121.155 59.525 122 60.026C122.233 60.164 118.332 63.707 113.77 67.5C113.491 67.732 113.305 67.961 113.356 68.009C113.507 68.151 116.617 67.464 118.79 66.808C120.927 66.163 124.131 64.671 125.319 63.768C126.608 62.789 127.593 61.652 129.37 59.096C130.461 57.526 131.328 56.518 131.663 56.426C134.164 55.747 138.223 56.195 141.823 57.547C148.858 60.19 152.063 64.857 151.711 71.946C151.557 75.05 150.784 77.451 149.15 79.893C148.074 81.502 145.152 84.528 144.674 84.528C144.558 84.528 144.736 83.86 145.071 83.044C146.512 79.527 145.946 76.704 143.273 74.08C139.708 70.581 133.981 69.154 124.497 69.402C118.326 69.563 116.385 69.979 112.381 72.003C109.305 73.557 103.919 76.988 104.329 77.131C104.457 77.176 104.693 77.109 104.851 76.982C105.464 76.493 111.105 74.512 113.754 73.856C117.872 72.836 119.931 72.581 124.013 72.583C128.993 72.586 134.075 73.517 137.307 75.02L138.376 75.516L137.426 75.393C129.533 74.366 122.095 75.786 116.862 79.318C112.416 82.32 109.558 86.336 108.087 91.649C107.587 93.458 107.53 94.148 107.538 98.297C107.545 101.395 107.674 103.672 107.927 105.181C109.406 113.974 109.405 113.965 109.4 118.831C109.394 124.134 109.129 125.621 107.472 129.633C105.384 134.692 100.993 140.168 96.648 143.134C93.918 144.997 86.926 147.992 81.994 149.411C78.201 150.503 78.094 150.475 80.436 148.994C86.917 144.895 92.799 138.193 95.911 131.366C97.695 127.45 99.116 122.413 99.781 117.644C99.927 116.6 100.256 113.128 100.514 109.929C101.09 102.781 101.947 98.542 104.221 91.59C104.552 90.578 104.781 89.623 104.729 89.468C104.587 89.04 102.098 92.925 101.006 95.281C99.902 97.664 98.816 100.794 96.624 107.911C93.593 117.754 90.459 123.613 85.483 128.745C81.971 132.367 79.843 133.857 75.761 135.555C72.913 136.739 65.432 139.026 65.191 138.786C65.15 138.745 65.641 138.326 66.282 137.855C68.097 136.523 71.814 132.514 73.271 130.317C77.098 124.546 79.198 118.629 81.519 107.08C83.519 97.127 84.81 92.7 87.098 87.952C89.458 83.055 93.203 78.172 97.069 74.951C98.444 73.804 98.466 73.769 97.701 73.921C96.467 74.166 93.178 75.789 91.175 77.141C87.124 79.874 82.683 84.093 78.669 89.022C73.758 95.053 71.945 97.129 69.808 99.172C66.052 102.762 62.305 104.954 57.821 106.184C56.41 106.572 55.303 106.685 52.913 106.689C51.215 106.692 49.589 106.593 49.299 106.469C48.816 106.263 48.958 106.119 50.96 104.788C54.581 102.381 58.012 99.044 62.323 93.738C69.853 84.468 77.48 78.132 86.742 73.451C88.374 72.626 89.598 71.95 89.461 71.948C89.052 71.944 84.594 73.138 83.064 73.661C81.037 74.354 78.729 75.546 72.62 79.05C67.092 82.221 63.623 83.772 60.589 84.427C58.08 84.969 54.5 84.966 52.319 84.421C50.364 83.932 48.881 83.376 49.058 83.199C49.121 83.136 50.12 82.831 51.28 82.521C53.854 81.832 55.921 80.894 58.26 79.353C60.127 78.124 63.13 75.174 64.351 73.37C65.165 72.167 66.161 70.278 66.044 70.16C66.001 70.118 65.062 70.198 63.957 70.34C61.186 70.693 58.045 70.304 55.062 69.238C52.714 68.399 49.777 66.741 48.807 65.707L48.263 65.127L49.519 65.561C51.113 66.112 54.012 66.141 56.102 65.628C58.817 64.963 60.814 63.843 64.102 61.143C64.599 60.735 65.35 60.45 66.358 60.285C72.606 59.263 78.247 57.334 82.113 54.898C83.476 54.038 83.464 54.035 80.926 54.493C75.792 55.421 69.809 54.579 64.664 52.206C62.648 51.276 58.995 48.817 57.126 47.132C55.686 45.833 55.186 45.098 56.058 45.561C56.91 46.013 61.55 46.993 64.164 47.273C70.71 47.974 78.2 46.667 83.846 43.839C89.923 40.796 94.864 39.851 103.834 40.018C107.329 40.084 109.495 40.247 111.518 40.599Z" fill="white"/>',
            '<path d="M116.295 102.452C120.135 107.335 122.553 112.753 123.713 119.069C124.199 121.717 124.244 128.308 123.798 131.532C122.942 137.709 120.463 142.771 115.991 147.47C110.231 153.522 102.992 157.583 94.813 159.35C92.013 159.955 85.347 160.206 82.706 159.806C80.152 159.419 77.483 158.813 77.483 158.619C77.483 158.528 78.151 158.316 78.967 158.147C83.329 157.249 89.674 154.655 93.857 152.062C102.718 146.568 108.856 139.608 112.234 131.229C113.896 127.106 114.368 124.016 114.347 117.407C114.328 111.373 114.012 107.894 112.722 99.484L112.558 98.415L113.68 99.484C114.296 100.071 115.473 101.407 116.295 102.452Z" fill="white"/>',
            '<path d="M122.592 85.227C121.897 87.653 122.141 91.098 123.174 93.434C124.436 96.287 126.114 98.251 131.039 102.637C132.619 104.043 134.454 105.863 135.118 106.681C138.83 111.257 140.631 116.044 140.631 121.338C140.631 123.931 140.402 125.327 139.542 127.983C137.345 134.769 131.718 141.303 125.269 144.559C124.719 144.837 124.219 145.064 124.157 145.064C124.096 145.064 124.766 144.104 125.647 142.931C128.35 139.331 130.226 135.259 131.28 130.701C131.607 129.285 131.718 127.865 131.717 125.122C131.715 121.886 131.637 121.139 131.064 118.921C129.937 114.557 128.665 112 124.763 106.249C122.322 102.653 120.728 99.548 120.073 97.11C119.447 94.785 119.482 91.029 120.148 88.919C120.915 86.49 123.235 82.985 122.592 85.227Z" fill="white"/>',
            '<path d="M76.06 105.113C73.446 114.641 66.722 121.974 58.908 123.816C58.092 124.008 56.957 124.167 56.388 124.169L55.353 124.173L56.744 123.146C60.485 120.383 62.798 116.746 63.815 112.025C63.918 111.546 64.14 111.351 64.723 111.228C66.982 110.749 71.339 107.715 74.753 104.242C75.853 103.123 76.441 102.673 76.49 102.911C76.532 103.108 76.338 104.099 76.06 105.113Z" fill="white"/>',
            '</g>',
            '</g>',
            '<text x="100" y="180" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">'
        ));
    }

    /**
     * @dev Second part of SVG template (after domain name)
     */
    function _getSVGPart2() internal pure returns (string memory) {
        return '.poly</text></svg>';
    }

    /**
     * @dev Generates JSON metadata
     * @param domainName Domain name
     * @param svg SVG image data
     */
    function _generateMetadata(string memory domainName, string memory svg) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '{"name":"',
            domainName,
            '.poly","description":"A domain registered on the Polygon Naming Service (PNS).","image":"data:image/svg+xml;base64,',
            _base64Encode(bytes(svg)),
            '","attributes":[{"trait_type":"Registry","value":"Polygon Naming Service"},{"trait_type":"Type","value":"Domain NFT"},{"trait_type":"Domain","value":"',
            domainName,
            '.poly"}]}'
        ));
    }

    /**
     * @dev Base64 encoding
     * @param data Data to encode
     */
    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen);

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            let dataPtr := data
            let endPtr := add(dataPtr, mload(data))
            
            for {} lt(dataPtr, endPtr) {} {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)

                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }

            switch mod(mload(data), 3)
            case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
        }

        return result;
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
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
