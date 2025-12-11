// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { PNSDomainNFT } from "./PNSDomainNFT.sol";

/**
 * @title PNSMarketplace
 * @dev Marketplace for listing and selling PNS domain NFTs
 * Allows domain owners to list their domains for sale and buyers to purchase them
 */
contract PNSMarketplace is AccessControl, ReentrancyGuard {
    /// @notice Role for admin operations
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Reference to PNS Domain NFT contract
    PNSDomainNFT public domainNFT;

    /// @notice USDC token for payments
    IERC20 public usdcToken;

    /// @notice Marketplace fee in basis points (2.5% = 250)
    uint256 public marketplaceFee = 250;

    /// @notice Fee recipient address
    address public feeRecipient;

    /// @notice Minimum listing price in USDC (6 decimals)
    uint256 public minListingPrice = 1 * 10**6; // 1 USDC

    /// @notice Listing structure
    struct Listing {
        address seller;
        uint256 price; // Price in USDC (6 decimals)
        uint256 tokenId;
        uint256 listedAt;
        bool active;
    }

    /// @notice Mapping of token ID to listing
    mapping(uint256 => Listing) public listings;

    /// @notice Mapping to track active listings by seller
    mapping(address => uint256[]) public sellerListings;

    /// @notice Total number of active listings
    uint256 public activeListingsCount;

    // ============ Events ============

    /// @notice Emitted when a domain is listed for sale
    event DomainListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 timestamp
    );

    /// @notice Emitted when a domain listing is updated
    event ListingUpdated(
        uint256 indexed tokenId,
        uint256 oldPrice,
        uint256 newPrice
    );

    /// @notice Emitted when a domain listing is cancelled
    event ListingCancelled(
        uint256 indexed tokenId,
        address indexed seller
    );

    /// @notice Emitted when a domain is sold
    event DomainSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 fee
    );

    /// @notice Emitted when marketplace fee is updated
    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when fee recipient is updated
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    // ============ Constructor ============

    /**
     * @dev Initializes the marketplace
     * @param _domainNFT PNSDomainNFT contract address
     * @param _usdcToken USDC token address
     * @param _feeRecipient Fee recipient address
     */
    constructor(
        address _domainNFT,
        address _usdcToken,
        address _feeRecipient
    ) {
        require(_domainNFT != address(0), "Marketplace: Invalid NFT contract");
        require(_usdcToken != address(0), "Marketplace: Invalid USDC token");
        require(_feeRecipient != address(0), "Marketplace: Invalid fee recipient");

        domainNFT = PNSDomainNFT(_domainNFT);
        usdcToken = IERC20(_usdcToken);
        feeRecipient = _feeRecipient;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ============ Admin Functions ============

    /**
     * @dev Sets the marketplace fee
     * @param _fee New fee in basis points (max 10% = 1000)
     */
    function setMarketplaceFee(uint256 _fee) external onlyRole(ADMIN_ROLE) {
        require(_fee <= 1000, "Marketplace: Fee too high"); // Max 10%
        uint256 oldFee = marketplaceFee;
        marketplaceFee = _fee;
        emit MarketplaceFeeUpdated(oldFee, _fee);
    }

    /**
     * @dev Sets the fee recipient
     * @param _feeRecipient New fee recipient address
     */
    function setFeeRecipient(address _feeRecipient) external onlyRole(ADMIN_ROLE) {
        require(_feeRecipient != address(0), "Marketplace: Invalid fee recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(oldRecipient, _feeRecipient);
    }

    /**
     * @dev Sets the minimum listing price
     * @param _minPrice New minimum price in USDC (6 decimals)
     */
    function setMinListingPrice(uint256 _minPrice) external onlyRole(ADMIN_ROLE) {
        require(_minPrice > 0, "Marketplace: Invalid min price");
        minListingPrice = _minPrice;
    }

    // ============ Listing Functions ============

    /**
     * @dev Lists a domain for sale
     * @param tokenId Token ID of the domain NFT
     * @param price Sale price in USDC (6 decimals)
     */
    function listDomain(uint256 tokenId, uint256 price) external nonReentrant {
        require(price >= minListingPrice, "Marketplace: Price too low");
        require(domainNFT.ownerOf(tokenId) == msg.sender, "Marketplace: Not token owner");
        require(!listings[tokenId].active, "Marketplace: Already listed");
        
        // Check if marketplace is approved to transfer the NFT
        require(
            domainNFT.isApprovedForAll(msg.sender, address(this)) || 
            domainNFT.getApproved(tokenId) == address(this),
            "Marketplace: Not approved"
        );

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            tokenId: tokenId,
            listedAt: block.timestamp,
            active: true
        });

        sellerListings[msg.sender].push(tokenId);
        activeListingsCount++;

        emit DomainListed(tokenId, msg.sender, price, block.timestamp);
    }

    /**
     * @dev Updates the price of a listed domain
     * @param tokenId Token ID of the domain NFT
     * @param newPrice New price in USDC (6 decimals)
     */
    function updateListing(uint256 tokenId, uint256 newPrice) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Marketplace: Not listed");
        require(listing.seller == msg.sender, "Marketplace: Not seller");
        require(newPrice >= minListingPrice, "Marketplace: Price too low");

        uint256 oldPrice = listing.price;
        listing.price = newPrice;

        emit ListingUpdated(tokenId, oldPrice, newPrice);
    }

    /**
     * @dev Cancels a domain listing
     * @param tokenId Token ID of the domain NFT
     */
    function cancelListing(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Marketplace: Not listed");
        require(listing.seller == msg.sender, "Marketplace: Not seller");

        listing.active = false;
        activeListingsCount--;

        // Remove from seller's listings
        _removeFromSellerListings(msg.sender, tokenId);

        emit ListingCancelled(tokenId, msg.sender);
    }

    /**
     * @dev Purchases a listed domain
     * @param tokenId Token ID of the domain NFT to purchase
     */
    function buyDomain(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Marketplace: Not listed");
        require(msg.sender != listing.seller, "Marketplace: Cannot buy own domain");

        // Verify the seller still owns the NFT
        require(domainNFT.ownerOf(tokenId) == listing.seller, "Marketplace: Seller no longer owns NFT");

        uint256 price = listing.price;
        address seller = listing.seller;

        // Calculate fees
        uint256 fee = (price * marketplaceFee) / 10000;
        uint256 sellerAmount = price - fee;

        // Mark listing as inactive before transfers
        listing.active = false;
        activeListingsCount--;

        // Remove from seller's listings
        _removeFromSellerListings(seller, tokenId);

        // Transfer USDC from buyer to seller and fee recipient
        require(
            usdcToken.transferFrom(msg.sender, seller, sellerAmount),
            "Marketplace: Seller payment failed"
        );
        
        if (fee > 0) {
            require(
                usdcToken.transferFrom(msg.sender, feeRecipient, fee),
                "Marketplace: Fee payment failed"
            );
        }

        // Transfer NFT from seller to buyer
        domainNFT.transferFrom(seller, msg.sender, tokenId);

        emit DomainSold(tokenId, seller, msg.sender, price, fee);
    }

    // ============ Helper Functions ============

    /**
     * @dev Removes a token from seller's listings array
     * @param seller Seller address
     * @param tokenId Token ID to remove
     */
    function _removeFromSellerListings(address seller, uint256 tokenId) private {
        uint256[] storage sellerTokens = sellerListings[seller];
        for (uint256 i = 0; i < sellerTokens.length; i++) {
            if (sellerTokens[i] == tokenId) {
                sellerTokens[i] = sellerTokens[sellerTokens.length - 1];
                sellerTokens.pop();
                break;
            }
        }
    }

    // ============ Query Functions ============

    /**
     * @dev Gets listing details for a token
     * @param tokenId Token ID to query
     * @return Listing details
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    /**
     * @dev Gets all active listings by a seller
     * @param seller Seller address
     * @return Array of token IDs
     */
    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListings[seller];
    }

    /**
     * @dev Checks if a domain is listed
     * @param tokenId Token ID to check
     * @return True if listed and active
     */
    function isListed(uint256 tokenId) external view returns (bool) {
        return listings[tokenId].active;
    }

    /**
     * @dev Calculates the fees for a given price
     * @param price Sale price
     * @return fee Marketplace fee
     * @return sellerAmount Amount seller receives
     */
    function calculateFees(uint256 price) external view returns (uint256 fee, uint256 sellerAmount) {
        fee = (price * marketplaceFee) / 10000;
        sellerAmount = price - fee;
    }

    /**
     * @dev Gets multiple listings at once (for pagination)
     * @param tokenIds Array of token IDs
     * @return Array of listings
     */
    function getListingsBatch(uint256[] calldata tokenIds) external view returns (Listing[] memory) {
        Listing[] memory result = new Listing[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            result[i] = listings[tokenIds[i]];
        }
        return result;
    }
}
