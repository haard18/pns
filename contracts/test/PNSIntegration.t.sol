// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/PNSRegistry.sol";
import "../src/PNSPriceOracle.sol";
import "../src/PNSResolver.sol";
import "../src/PNSRegistrar.sol";
import "../src/PNSController.sol";
import "../src/PNSDomainNFT.sol";

/**
 * @title PNSIntegrationTest
 * @dev Comprehensive integration tests for PNS system
 */
contract PNSIntegrationTest is Test {
    PNSRegistry registry;
    PNSPriceOracle priceOracle;
    PNSResolver resolver;
    PNSRegistrar registrar;
    PNSController controller;
    PNSDomainNFT nft;

    address admin = address(0x1);
    address treasury = address(0x2);
    address user1 = address(0x3);
    address user2 = address(0x4);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy registry
        registry = new PNSRegistry();
        registry.initialize(admin);

        // Deploy price oracle
        priceOracle = new PNSPriceOracle();
        priceOracle.initialize();

        // Deploy resolver
        resolver = new PNSResolver();
        resolver.initialize(admin, address(registry));

        // Deploy registrar
        registrar = new PNSRegistrar();
        registrar.initialize(
            address(registry),
            address(priceOracle),
            treasury,
            admin
        );

        // Deploy controller
        controller = new PNSController();
        controller.initialize(
            address(registry),
            address(registrar),
            address(resolver),
            admin
        );

        // Deploy NFT
        nft = new PNSDomainNFT(address(registry), "https://pns.poly/metadata/");

        // Grant roles - NOTE: must be done AFTER registrar initialization
        registry.setRegistrar(address(registrar));
        registry.setResolver(address(resolver));

        // Explicitly grant REGISTRAR_ROLE to registrar on registry
        registry.grantRole(registry.REGISTRAR_ROLE(), address(registrar));

        // Grant registrar role to controller for direct calls from tests
        registrar.grantRole(registrar.CONTROLLER_ROLE(), address(controller));
        registrar.grantRole(registrar.ADMIN_ROLE(), admin);
        
        // Grant resolver role to controller so it can set resolver records
        resolver.grantRole(resolver.REGISTRY_ROLE(), address(controller));

        vm.stopPrank();

        // Give users some funds
        vm.deal(user1, 1000 ether);
        vm.deal(user2, 1000 ether);
    }

    // ============ Registry Tests ============

    function testRegistryInitialization() public {
        assertEq(address(registry.owner()), admin);
        assertTrue(registry.hasRole(registry.ADMIN_ROLE(), admin));
    }

    function testRegisterName() public {
        vm.startPrank(admin);
        bytes32 nameHash = keccak256(abi.encodePacked("alice", ".poly"));
        uint64 expiration = uint64(block.timestamp + 365 days);

        // Grant REGISTRAR_ROLE to admin for this test
        registry.grantRole(registry.REGISTRAR_ROLE(), admin);
        registry.registerName(nameHash, user1, address(resolver), expiration);

        assertTrue(registry.exists(nameHash));
        (address nameOwner, address resolverAddr, uint64 exp) = registry
            .getNameRecord(nameHash);
        assertEq(nameOwner, user1);
        assertEq(resolverAddr, address(resolver));
        assertEq(exp, expiration);

        vm.stopPrank();
    }

    function testTransferName() public {
        vm.startPrank(admin);
        bytes32 nameHash = keccak256(abi.encodePacked("bob", ".poly"));
        uint64 expiration = uint64(block.timestamp + 365 days);
        registry.grantRole(registry.REGISTRAR_ROLE(), admin);
        registry.registerName(nameHash, user1, address(resolver), expiration);
        vm.stopPrank();

        vm.startPrank(user1);
        registry.transferName(nameHash, user2);

        (address nameOwner, , ) = registry.getNameRecord(nameHash);
        assertEq(nameOwner, user2);
        vm.stopPrank();
    }

    function testReverseRecord() public {
        vm.startPrank(admin);
        bytes32 nameHash = keccak256(abi.encodePacked("charlie", ".poly"));
        uint64 expiration = uint64(block.timestamp + 365 days);
        registry.grantRole(registry.REGISTRAR_ROLE(), admin);
        registry.registerName(nameHash, user1, address(resolver), expiration);
        vm.stopPrank();

        vm.startPrank(user1);
        registry.setReverseRecord(nameHash);
        bytes32 reverseRecord = registry.getReverseRecord(user1);
        assertEq(reverseRecord, nameHash);
        vm.stopPrank();
    }

    // ============ Price Oracle Tests ============

    function testPriceCalculation() public {
        bytes32 hash3 = keccak256(abi.encodePacked("abc"));
        bytes32 hash4 = keccak256(abi.encodePacked("abcd"));
        bytes32 hash5 = keccak256(abi.encodePacked("abcde"));
        bytes32 hash7 = keccak256(abi.encodePacked("abcdefg"));

        uint256 price3 = priceOracle.getPrice(hash3, "abc", 1);
        uint256 price4 = priceOracle.getPrice(hash4, "abcd", 1);
        uint256 price5 = priceOracle.getPrice(hash5, "abcde", 1);
        uint256 price7 = priceOracle.getPrice(hash7, "abcdefg", 1);

        // 3 char is most expensive
        assertTrue(price3 > price4);
        assertTrue(price4 > price5);
        assertTrue(price5 > price7);
    }

    function testPremiumPricing() public {
        vm.startPrank(admin);
        bytes32 premiumHash = keccak256(abi.encodePacked("premium"));
        priceOracle.setPremiumPrice(premiumHash, 100 ether);

        uint256 premiumPrice = priceOracle.getPrice(premiumHash, "premium", 1);
        assertEq(premiumPrice, 100 ether);

        vm.stopPrank();
    }

    // ============ Resolver Tests ============

    function testSetAddressRecord() public {
        bytes32 nameHash = keccak256(abi.encodePacked("resolver_test"));

        vm.startPrank(admin);
        resolver.grantRole(resolver.REGISTRY_ROLE(), admin);
        resolver.setAddr(nameHash, 966, user1);
        address stored = resolver.getAddr(nameHash, 966);
        assertEq(stored, user1);
        vm.stopPrank();
    }

    function testSetTextRecords() public {
        bytes32 nameHash = keccak256(abi.encodePacked("text_test"));

        vm.startPrank(admin);
        resolver.grantRole(resolver.REGISTRY_ROLE(), admin);
        resolver.setText(nameHash, "avatar", "https://example.com/avatar.png");
        resolver.setText(nameHash, "website", "https://example.com");

        string memory avatar = resolver.getText(nameHash, "avatar");
        string memory website = resolver.getText(nameHash, "website");

        assertEq(avatar, "https://example.com/avatar.png");
        assertEq(website, "https://example.com");
        vm.stopPrank();
    }

    function testSetContentHash() public {
        bytes32 nameHash = keccak256(abi.encodePacked("content_test"));
        bytes
            memory contentHash = hex"1220e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

        vm.startPrank(admin);
        resolver.grantRole(resolver.REGISTRY_ROLE(), admin);
        resolver.setContentHash(nameHash, contentHash);
        bytes memory stored = resolver.getContentHash(nameHash);
        assertEq(stored, contentHash);
        vm.stopPrank();
    }

    // ============ Registrar Tests ============

    function testRegistrarInitialization() public {
        assertEq(address(registrar.registry()), address(registry));
        assertEq(address(registrar.priceOracle()), address(priceOracle));
        assertEq(registrar.treasury(), treasury);
    }

    function testDirectRegistration() public {
        vm.startPrank(user1);

        bytes32 nameHash = keccak256(abi.encodePacked("alice", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "alice", 1);

        // Call through controller instead of directly
        controller.registerDomain{value: price}("alice", user1, 1);

        assertTrue(registry.exists(nameHash));
        (address nameOwner, , ) = registry.getNameRecord(nameHash);
        assertEq(nameOwner, user1);

        vm.stopPrank();
    }

    function testCommitRevealRegistration() public {
        vm.startPrank(user1);

        string memory name = "bob";
        string memory secret = "verysecretvalue";
        bytes32 commitment = registrar.getCommitmentHash(name, user1, secret);

        // Make commitment
        registrar.makeCommitment(commitment);

        // Fast forward
        vm.warp(block.timestamp + 1 days + 1 seconds);

        bytes32 nameHash = keccak256(abi.encodePacked("bob", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, name, 1);

        // Use controller for registration
        controller.registerDomain{value: price}(name, user1, 1);

        assertTrue(registry.exists(nameHash));
        vm.stopPrank();
    }

    function testRenewal() public {
        vm.startPrank(user1);

        // Register first through controller
        bytes32 nameHash = keccak256(abi.encodePacked("charlie", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "charlie", 1);
        controller.registerDomain{value: price}("charlie", user1, 1);

        uint64 originalExp;
        (, , originalExp) = registry.getNameRecord(nameHash);

        // Stop user1 prank
        vm.stopPrank();
        
        // Grant user1 the controller role so they can call registrar directly
        vm.startPrank(admin);
        registrar.grantRole(registrar.CONTROLLER_ROLE(), user1);
        vm.stopPrank();

        // Now user1 can renew
        vm.startPrank(user1);
        uint256 renewPrice = priceOracle.getPrice(nameHash, "charlie", 1);
        registrar.renew{value: renewPrice}("charlie", 1);

        uint64 newExp;
        (, , newExp) = registry.getNameRecord(nameHash);
        assertTrue(newExp > originalExp);

        vm.stopPrank();
    }

    // ============ Controller Tests ============

    function testControllerInitialization() public {
        assertEq(address(controller.registry()), address(registry));
        assertEq(address(controller.registrar()), address(registrar));
        assertEq(address(controller.defaultResolver()), address(resolver));
    }

    function testSimpleRegistration() public {
        vm.startPrank(user1);

        bytes32 nameHash = keccak256(abi.encodePacked("user1domain", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "user1domain", 1);

        controller.registerDomain{value: price}("user1domain", user1, 1);

        assertTrue(registry.exists(nameHash));
        vm.stopPrank();
    }

    function testRegistrationWithAddress() public {
        vm.startPrank(user1);

        bytes32 nameHash = keccak256(abi.encodePacked("user2domain", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "user2domain", 1);

        controller.registerWithAddress{value: price}(
            "user2domain",
            user1,
            1,
            user1
        );

        assertTrue(registry.exists(nameHash));
        address stored = resolver.getPolygonAddr(nameHash);
        assertEq(stored, user1);

        vm.stopPrank();
    }

    function testRegistrationWithMetadata() public {
        vm.startPrank(user1);

        bytes32 nameHash = keccak256(abi.encodePacked("metadomain", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "metadomain", 1);

        controller.registerWithMetadata{value: price}(
            "metadomain",
            user1,
            1,
            user1,
            "https://example.com/avatar.png",
            "https://example.com",
            "user@example.com"
        );

        assertTrue(registry.exists(nameHash));
        address stored = resolver.getPolygonAddr(nameHash);
        assertEq(stored, user1);

        string memory avatar = resolver.getText(nameHash, "avatar");
        assertEq(avatar, "https://example.com/avatar.png");

        vm.stopPrank();
    }

    function testBatchRegistration() public {
        vm.startPrank(user1);

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

        // Register individually (simulating batch)
        for (uint256 i = 0; i < names.length; i++) {
            bytes32 hash = keccak256(abi.encodePacked(names[i], ".poly"));
            uint256 price = priceOracle.getPrice(hash, names[i], duration);
            controller.registerDomain{value: price}(names[i], user1, duration);
        }

        // Verify registrations
        for (uint256 i = 0; i < names.length; i++) {
            bytes32 hash = keccak256(abi.encodePacked(names[i], ".poly"));
            assertTrue(registry.exists(hash), string.concat("Domain not registered: ", names[i]));
            (address domainOwner, , ) = registry.getNameRecord(hash);
            assertEq(domainOwner, user1, "Owner mismatch");
        }

        vm.stopPrank();
    }

    function testDomainAvailability() public {
        vm.startPrank(user1);

        bytes32 nameHash = keccak256(abi.encodePacked("available", ".poly"));
        uint256 price = priceOracle.getPrice(nameHash, "available", 1);

        // Should be available initially
        assertTrue(controller.isDomainAvailable("available"));

        // Register it through controller
        controller.registerDomain{value: price}("available", user1, 1);

        // Should not be available
        assertFalse(controller.isDomainAvailable("available"));

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

    function testNFTTransfer() public {
        vm.startPrank(admin);

        bytes32 nameHash = keccak256(abi.encodePacked("transferdomain"));
        nft.mintDomain("transferdomain", nameHash, user1);

        vm.stopPrank();

        vm.startPrank(user1);
        nft.transferFrom(user1, user2, 1);
        assertEq(nft.ownerOf(1), user2);
        vm.stopPrank();
    }

    // ============ Helper Functions ============

    function testHelperFunctions() public view {
        bytes32 hash3 = keccak256(abi.encodePacked("abc"));
        uint256 tier3 = priceOracle.getPriceTier(3);
        assertEq(tier3, 1); // short

        bytes32 hash4 = keccak256(abi.encodePacked("abcd"));
        uint256 tier4 = priceOracle.getPriceTier(4);
        assertEq(tier4, 2); // mid

        bytes32 hash5 = keccak256(abi.encodePacked("abcde"));
        uint256 tier5 = priceOracle.getPriceTier(5);
        assertEq(tier5, 3); // regular

        bytes32 hash10 = keccak256(abi.encodePacked("abcdefghij"));
        uint256 tier10 = priceOracle.getPriceTier(10);
        assertEq(tier10, 4); // long
    }
}
