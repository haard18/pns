// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { console } from "forge-std/console.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { PNSRegistry } from "../src/PNSRegistry.sol";
import { PNSPriceOracle } from "../src/PNSPriceOracle.sol";
import { PNSResolver } from "../src/PNSResolver.sol";
import { PNSRegistrar } from "../src/PNSRegistrar.sol";
import { PNSController } from "../src/PNSController.sol";
import { PNSDomainNFT } from "../src/PNSDomainNFT.sol";

// Mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title PNSIntegrationTest
 * @dev Comprehensive integration tests for PNS system with USDC payments
 */
contract PNSIntegrationTest is Test {
    PNSRegistry registry;
    PNSPriceOracle priceOracle;
    PNSResolver resolver;
    PNSRegistrar registrar;
    PNSController controller;
    PNSDomainNFT nft;
    MockUSDC usdc;

    address admin = address(0x1);
    address treasury = address(0x2);
    address user1 = address(0x3);
    address user2 = address(0x4);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy mock USDC
        usdc = new MockUSDC();

        // Deploy registry
        registry = new PNSRegistry();
        registry.initialize(admin);

        // Deploy price oracle
        priceOracle = new PNSPriceOracle();
        priceOracle.initialize();

        // Deploy resolver
        resolver = new PNSResolver();
        resolver.initialize(admin, address(registry));

        // Deploy registrar with USDC
        registrar = new PNSRegistrar();
        registrar.initialize(address(registry), address(priceOracle), treasury, address(usdc), admin);

        // Deploy controller with USDC
        controller = new PNSController();
        controller.initialize(address(registry), address(registrar), address(resolver), admin, address(priceOracle), address(usdc));

        // Deploy NFT
        nft = new PNSDomainNFT(address(registry), "https://pns.poly/metadata/");

        // Grant roles
        registry.setRegistrar(address(registrar));
        registry.setResolver(address(resolver));
        registry.grantRole(registry.REGISTRAR_ROLE(), address(registrar));
        registrar.grantRole(registrar.CONTROLLER_ROLE(), address(controller));
        registrar.grantRole(registrar.ADMIN_ROLE(), admin);
        resolver.grantRole(resolver.REGISTRY_ROLE(), address(controller));

        vm.stopPrank();

        // Mint USDC to users
        usdc.mint(user1, 1000 * 10**6); // 1000 USDC
        usdc.mint(user2, 1000 * 10**6);
    }

    // ============ Helper function ============
    function approveAndRegister(address user, string memory name, uint256 duration) internal {
        bytes32 nameHash = keccak256(abi.encodePacked(name, ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, name, duration);
        
        vm.startPrank(user);
        usdc.approve(address(controller), price);
        controller.registerDomain(name, user, duration);
        vm.stopPrank();
    }

    // ============ Registry Tests ============

    function testRegistryInitialization() public view {
        assertEq(address(registry.owner()), admin);
        assertTrue(registry.hasRole(registry.ADMIN_ROLE(), admin));
    }

    function testRegisterName() public {
        vm.startPrank(admin);
        bytes32 nameHash = keccak256(abi.encodePacked("alice", ".poly"));
        uint64 expiration = uint64(block.timestamp + 365 days);

        registry.grantRole(registry.REGISTRAR_ROLE(), admin);
        registry.registerName(nameHash, user1, address(resolver), expiration);

        assertTrue(registry.exists(nameHash));
        (address nameOwner, address resolverAddr, uint64 exp) = registry.getNameRecord(nameHash);
        assertEq(nameOwner, user1);
        assertEq(resolverAddr, address(resolver));
        assertEq(exp, expiration);

        vm.stopPrank();
    }

    // ============ Price Oracle Tests ============

    function testPriceCalculation() public view {
        bytes32 hash3 = keccak256(abi.encodePacked("abc", ".poly"));
        bytes32 hash4 = keccak256(abi.encodePacked("abcd", ".poly"));
        bytes32 hash5 = keccak256(abi.encodePacked("abcde", ".poly"));
        bytes32 hash7 = keccak256(abi.encodePacked("abcdefg", ".poly"));

        uint256 price3 = priceOracle.getPrice(hash3, "abc", 1);
        uint256 price4 = priceOracle.getPrice(hash4, "abcd", 1);
        uint256 price5 = priceOracle.getPrice(hash5, "abcde", 1);
        uint256 price7 = priceOracle.getPrice(hash7, "abcdefg", 1);

        // Verify USDC pricing (6 decimals)
        assertEq(price3, 50 * 10**6); // 50 USDC
        assertEq(price4, 10 * 10**6); // 10 USDC
        assertEq(price5, 2 * 10**6);  // 2 USDC
        assertEq(price7, 5 * 10**5);  // 0.5 USDC

        // 3 char is most expensive
        assertTrue(price3 > price4);
        assertTrue(price4 > price5);
        assertTrue(price5 > price7);
    }

    function testPremiumPricing() public {
        vm.startPrank(admin);
        bytes32 premiumHash = keccak256(abi.encodePacked("premium", ".poly"));
        priceOracle.setPremiumPrice(premiumHash, 100 * 10**6); // 100 USDC

        uint256 premiumPrice = priceOracle.getPrice(premiumHash, "premium", 1);
        assertEq(premiumPrice, 100 * 10**6);

        vm.stopPrank();
    }

    // ============ Controller Tests with USDC ============

    function testSimpleRegistration() public {
        bytes32 nameHash = keccak256(abi.encodePacked("testdomain", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "testdomain", 1);

        vm.startPrank(user1);
        usdc.approve(address(controller), price);
        controller.registerDomain("testdomain", user1, 1);
        vm.stopPrank();

        assertTrue(registry.exists(nameHash));
        (address owner,,) = registry.getNameRecord(nameHash);
        assertEq(owner, user1);
    }

    function testRegistrationWithAddress() public {
        bytes32 nameHash = keccak256(abi.encodePacked("user2domain", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "user2domain", 1);

        vm.startPrank(user1);
        usdc.approve(address(controller), price);
        controller.registerWithAddress("user2domain", user1, 1, user1);
        vm.stopPrank();

        assertTrue(registry.exists(nameHash));
        address stored = resolver.getPolygonAddr(nameHash);
        assertEq(stored, user1);
    }

    function testRegistrationWithMetadata() public {
        bytes32 nameHash = keccak256(abi.encodePacked("metadomain", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "metadomain", 1);

        vm.startPrank(user1);
        usdc.approve(address(controller), price);
        controller.registerWithMetadata(
            "metadomain", 
            user1, 
            1, 
            user1, 
            "https://example.com/avatar.png", 
            "https://example.com", 
            "user@example.com"
        );
        vm.stopPrank();

        assertTrue(registry.exists(nameHash));
        address stored = resolver.getPolygonAddr(nameHash);
        assertEq(stored, user1);

        string memory avatar = resolver.getText(nameHash, "avatar");
        assertEq(avatar, "https://example.com/avatar.png");
    }

    function testBatchRegistration() public {
        string[] memory names = new string[](2);
        names[0] = "batch1";
        names[1] = "batch2";

        uint256 duration = 1;
        uint256 totalPrice = 0;

        // Calculate total price
        for (uint256 i = 0; i < names.length; i++) {
            bytes32 hash = keccak256(abi.encodePacked(names[i], ".poly"));
            uint256 price = priceOracle.getPrice(hash, names[i], duration);
            totalPrice += price;
        }

        vm.startPrank(user1);
        usdc.approve(address(controller), totalPrice);
        controller.batchRegister(names, user1, duration);
        vm.stopPrank();

        // Verify registrations
        for (uint256 i = 0; i < names.length; i++) {
            bytes32 hash = keccak256(abi.encodePacked(names[i], ".poly"));
            assertTrue(registry.exists(hash));
            (address domainOwner,,) = registry.getNameRecord(hash);
            assertEq(domainOwner, user1);
        }
    }

    function testRenewal() public {
        // Register first
        approveAndRegister(user1, "renewtest", 1);

        bytes32 nameHash = keccak256(abi.encodePacked("renewtest", ".poly"));
        (, , uint64 originalExp) = registry.getNameRecord(nameHash);

        // Renew
        uint256 renewPrice = priceOracle.getPrice(nameHash, "renewtest", 1);
        vm.startPrank(user1);
        usdc.approve(address(controller), renewPrice);
        controller.renewDomain("renewtest", 1);
        vm.stopPrank();

        (, , uint64 newExp) = registry.getNameRecord(nameHash);
        assertTrue(newExp > originalExp);
    }

    function testDomainAvailability() public {
        // Should be available initially
        assertTrue(controller.isDomainAvailable("available"));

        // Register it
        approveAndRegister(user1, "available", 1);

        // Should not be available
        assertFalse(controller.isDomainAvailable("available"));
    }

    function testUSDCPaymentFlow() public {
        bytes32 nameHash = keccak256(abi.encodePacked("payment", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "payment", 1);

        uint256 treasuryBalanceBefore = usdc.balanceOf(treasury);
        uint256 user1BalanceBefore = usdc.balanceOf(user1);

        vm.startPrank(user1);
        usdc.approve(address(controller), price);
        controller.registerDomain("payment", user1, 1);
        vm.stopPrank();

        uint256 treasuryBalanceAfter = usdc.balanceOf(treasury);
        uint256 user1BalanceAfter = usdc.balanceOf(user1);

        // Verify USDC was transferred
        assertEq(treasuryBalanceAfter - treasuryBalanceBefore, price);
        assertEq(user1BalanceBefore - user1BalanceAfter, price);
    }

    function testInsufficientApproval() public {
        bytes32 nameHash = keccak256(abi.encodePacked("test", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "test", 1);

        vm.startPrank(user1);
        usdc.approve(address(controller), price - 1); // Approve less than needed
        
        vm.expectRevert();
        controller.registerDomain("test", user1, 1);
        vm.stopPrank();
    }

    // ============ NFT Tests ============

    function testNFTMinting() public {
        vm.startPrank(admin);

        bytes32 nameHash = keccak256(abi.encodePacked("nftdomain"));
        nft.mintDomain("nftdomain", nameHash, user1);

        assertTrue(nft.isDomainMinted(nameHash));
        assertEq(nft.ownerOf(1), user1);

        vm.stopPrank();
    }
}
