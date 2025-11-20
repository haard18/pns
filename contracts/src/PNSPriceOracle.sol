// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title PNSPriceOracle
 * @dev Dynamic pricing oracle for PNS registration and renewal
 * Implements tiered pricing based on domain length with governance control
 */
contract PNSPriceOracle is Ownable, Initializable, UUPSUpgradeable {
    /// @notice Price tier structure
    struct PriceTier {
        uint256 length; // Domain length in characters
        uint256 pricePerYear; // Price in wei per year
    }

    /// @notice Base price for short names (1-3 chars)
    uint256 public shortDomainPrice = 50 ether;

    /// @notice Price for mid-length names (4 chars)
    uint256 public midDomainPrice = 10 ether;

    /// @notice Price for regular names (5-6 chars)
    uint256 public regularDomainPrice = 2 ether;

    /// @notice Price for long names (7+ chars)
    uint256 public longDomainPrice = 0.5 ether;

    /// @notice Premium names mapping (name hash -> premium price)
    mapping(bytes32 => uint256) public premiumPrices;

    /// @notice Premium names enabled flag
    bool public premiumNamesEnabled = true;

    /// @notice Price update timestamp for governance
    uint256 public lastPriceUpdate;

    /// @notice Minimum domain name length (3 characters)
    uint256 public constant MIN_DOMAIN_LENGTH = 3;

    /// @notice Maximum domain name length (63 characters)
    uint256 public constant MAX_DOMAIN_LENGTH = 63;

    // ============ Events ============

    /// @notice Emitted when prices are updated
    event PricesUpdated(
        uint256 shortPrice, uint256 midPrice, uint256 regularPrice, uint256 longPrice, uint256 timestamp
    );

    /// @notice Emitted when a premium price is set
    event PremiumPriceSet(bytes32 indexed nameHash, uint256 price);

    /// @notice Emitted when premium pricing is toggled
    event PremiumNamesToggled(bool enabled);

    // ============ Constructor & Initialization ============

    /**
     * @dev Constructor initializes the owner
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Initializes the price oracle
     */
    function initialize() external initializer {
        lastPriceUpdate = block.timestamp;
    }

    // ============ Admin Functions ============

    /**
     * @dev Updates the price tiers
     * @param _shortPrice Price for 1-3 char domains
     * @param _midPrice Price for 4 char domains
     * @param _regularPrice Price for 5-6 char domains
     * @param _longPrice Price for 7+ char domains
     */
    function setPrices(uint256 _shortPrice, uint256 _midPrice, uint256 _regularPrice, uint256 _longPrice)
        external
        onlyOwner
    {
        require(_shortPrice > 0, "PNS: Invalid short price");
        require(_midPrice > 0, "PNS: Invalid mid price");
        require(_regularPrice > 0, "PNS: Invalid regular price");
        require(_longPrice > 0, "PNS: Invalid long price");

        shortDomainPrice = _shortPrice;
        midDomainPrice = _midPrice;
        regularDomainPrice = _regularPrice;
        longDomainPrice = _longPrice;

        lastPriceUpdate = block.timestamp;

        emit PricesUpdated(_shortPrice, _midPrice, _regularPrice, _longPrice, block.timestamp);
    }

    /**
     * @dev Sets a premium price for a specific name
     * @param nameHash Hash of the premium domain
     * @param price Premium price in wei per year
     */
    function setPremiumPrice(bytes32 nameHash, uint256 price) external onlyOwner {
        require(price > 0, "PNS: Invalid premium price");
        premiumPrices[nameHash] = price;
        emit PremiumPriceSet(nameHash, price);
    }

    /**
     * @dev Toggles premium name pricing
     * @param enabled True to enable premium pricing
     */
    function togglePremiumNames(bool enabled) external onlyOwner {
        premiumNamesEnabled = enabled;
        emit PremiumNamesToggled(enabled);
    }

    // ============ Query Functions ============

    /**
     * @dev Calculates the registration/renewal price for a domain
     * @param nameHash Hash of the domain name
     * @param name The domain name string
     * @param numYears Number of years to register/renew
     * @return Total price in wei
     */
    function getPrice(bytes32 nameHash, string calldata name, uint256 numYears) external view returns (uint256) {
        require(numYears > 0, "PNS: Invalid duration");

        // Check for premium pricing first
        if (premiumNamesEnabled && premiumPrices[nameHash] > 0) {
            return premiumPrices[nameHash] * numYears;
        }

        // Calculate tiered pricing based on length
        uint256 length = bytes(name).length;
        require(length >= MIN_DOMAIN_LENGTH && length <= MAX_DOMAIN_LENGTH, "PNS: Invalid domain length");

        uint256 yearlyPrice;

        if (length <= 3) {
            yearlyPrice = shortDomainPrice;
        } else if (length == 4) {
            yearlyPrice = midDomainPrice;
        } else if (length <= 6) {
            yearlyPrice = regularDomainPrice;
        } else {
            yearlyPrice = longDomainPrice;
        }

        return yearlyPrice * numYears;
    }

    /**
     * @dev Gets the yearly price for a domain
     * @param nameHash Hash of the domain name
     * @param name The domain name string
     * @return yearlyPrice Price in wei per year
     */
    function getYearlyPrice(bytes32 nameHash, string calldata name) external view returns (uint256 yearlyPrice) {
        // Check for premium pricing first
        if (premiumNamesEnabled && premiumPrices[nameHash] > 0) {
            return premiumPrices[nameHash];
        }

        uint256 length = bytes(name).length;
        require(length >= MIN_DOMAIN_LENGTH && length <= MAX_DOMAIN_LENGTH, "PNS: Invalid domain length");

        if (length <= 3) {
            return shortDomainPrice;
        } else if (length == 4) {
            return midDomainPrice;
        } else if (length <= 6) {
            return regularDomainPrice;
        } else {
            return longDomainPrice;
        }
    }

    /**
     * @dev Checks if a name has premium pricing
     * @param nameHash Hash of the domain name
     * @return True if premium priced
     */
    function isPremium(bytes32 nameHash) external view returns (bool) {
        return premiumNamesEnabled && premiumPrices[nameHash] > 0;
    }

    /**
     * @dev Gets the price tier for a domain length
     * @param length Domain name length
     * @return tier Price tier tier (1=short, 2=mid, 3=regular, 4=long)
     */
    function getPriceTier(uint256 length) external pure returns (uint256 tier) {
        if (length <= 3) return 1; // short
        if (length == 4) return 2; // mid
        if (length <= 6) return 3; // regular
        return 4; // long
    }

    // ============ Upgrade Authorization ============

    /**
     * @dev Authorizes upgrade to new implementation
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
