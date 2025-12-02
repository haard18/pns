// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PNSUtils
 * @dev Utility library for Polygon Name Service operations
 * Contains namehash, validation, and constants used across all PNS contracts
 */
library PNSUtils {
    /// @notice Base TLD constant (.poly)
    string public constant BASE_TLD = "poly";
    bytes32 public constant BASE_TLD_HASH = keccak256(abi.encodePacked(BASE_TLD));
    
    /// @notice Minimum and maximum domain name lengths
    uint256 public constant MIN_NAME_LENGTH = 3;
    uint256 public constant MAX_NAME_LENGTH = 63;
    
    /// @notice Grace period after expiration (30 days)
    uint256 public constant GRACE_PERIOD = 30 days;
    
    /// @notice Minimum registration duration (1 year)
    uint256 public constant MIN_REGISTRATION_DURATION = 365 days;
    
    /// @notice Maximum registration duration (10 years)
    uint256 public constant MAX_REGISTRATION_DURATION = 10 * 365 days;

    /// @notice Error for invalid domain names
    error InvalidDomainName(string reason);
    
    /// @notice Error for expired domains
    error DomainExpired(bytes32 nameHash);
    
    /// @notice Error for unauthorized access
    error Unauthorized(address caller);

    /**
     * @dev Calculate namehash for a given domain name
     * @param name The domain name (without .poly suffix)
     * @return The namehash of the domain
     */
    function namehash(string memory name) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(name, ".", BASE_TLD));
    }

    /**
     * @dev Calculate namehash with explicit TLD
     * @param name The domain name
     * @param tld The top-level domain
     * @return The namehash of the domain
     */
    function namehashWithTld(string memory name, string memory tld) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(name, ".", tld));
    }

    /**
     * @dev Calculate subdomain namehash
     * @param parent The parent domain namehash
     * @param label The subdomain label
     * @return The namehash of the subdomain
     */
    function subdomainNamehash(bytes32 parent, string memory label) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(parent, keccak256(abi.encodePacked(label))));
    }

    /**
     * @dev Validate domain name according to PNS rules
     * @param name The domain name to validate
     * @return valid Whether the domain name is valid
     */
    function validateDomainName(string memory name) internal pure returns (bool valid) {
        bytes memory nameBytes = bytes(name);
        uint256 length = nameBytes.length;
        
        // Check length constraints
        if (length < MIN_NAME_LENGTH || length > MAX_NAME_LENGTH) {
            return false;
        }
        
        // Check for invalid characters and patterns
        for (uint256 i = 0; i < length; i++) {
            bytes1 char = nameBytes[i];
            
            // Allow a-z, 0-9, and hyphens
            if (!((char >= 0x61 && char <= 0x7A) || // a-z
                  (char >= 0x30 && char <= 0x39) || // 0-9
                  (char == 0x2D))) {                // hyphen
                return false;
            }
            
            // Cannot start or end with hyphen
            if ((i == 0 || i == length - 1) && char == 0x2D) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * @dev Check if a domain is expired
     * @param expiration The expiration timestamp
     * @return Whether the domain is expired
     */
    function isExpired(uint64 expiration) internal view returns (bool) {
        return block.timestamp > expiration;
    }

    /**
     * @dev Check if a domain is in grace period
     * @param expiration The expiration timestamp
     * @return Whether the domain is in grace period
     */
    function isInGracePeriod(uint64 expiration) internal view returns (bool) {
        return block.timestamp > expiration && block.timestamp <= expiration + GRACE_PERIOD;
    }

    /**
     * @dev Check if a domain is available for registration
     * @param expiration The expiration timestamp
     * @return Whether the domain is available
     */
    function isAvailable(uint64 expiration) internal view returns (bool) {
        return expiration == 0 || block.timestamp > expiration + GRACE_PERIOD;
    }

    /**
     * @dev Calculate new expiration time
     * @param currentExpiration Current expiration (0 if new domain)
     * @param duration Duration to add in seconds
     * @return New expiration timestamp
     */
    function calculateExpiration(uint64 currentExpiration, uint256 duration) internal view returns (uint64) {
        uint64 baseTime = currentExpiration > block.timestamp ? currentExpiration : uint64(block.timestamp);
        return baseTime + uint64(duration);
    }

    /**
     * @dev Validate registration duration
     * @param duration Duration in seconds
     * @return Whether the duration is valid
     */
    function validateDuration(uint256 duration) internal pure returns (bool) {
        return duration >= MIN_REGISTRATION_DURATION && duration <= MAX_REGISTRATION_DURATION;
    }

    /**
     * @dev Convert string to lowercase
     * @param str Input string
     * @return Lowercase string
     */
    function toLowerCase(string memory str) internal pure returns (string memory) {
        bytes memory data = bytes(str);
        for (uint256 i = 0; i < data.length; i++) {
            bytes1 char = data[i];
            if (char >= 0x41 && char <= 0x5A) { // A-Z
                data[i] = bytes1(uint8(char) + 32); // Convert to lowercase
            }
        }
        return string(data);
    }

    /**
     * @dev Check if caller has admin or specific role
     * @param hasRole Function to check role
     * @param role Role to check
     * @param account Account to check
     */
    function requireRole(
        function(bytes32, address) external view returns (bool) hasRole,
        bytes32 role,
        address account
    ) internal view {
        if (!hasRole(role, account)) {
            revert Unauthorized(account);
        }
    }
}