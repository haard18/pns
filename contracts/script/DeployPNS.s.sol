// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { PNSRegistry } from "../src/PNSRegistry.sol";
import { PNSPriceOracle } from "../src/PNSPriceOracle.sol";
import { PNSResolver } from "../src/PNSResolver.sol";
import { PNSRegistrar } from "../src/PNSRegistrar.sol";
import { PNSController } from "../src/PNSController.sol";
import { PNSDomainNFT } from "../src/PNSDomainNFT.sol";

/**
 * @title DeployPNS
 * @dev Deployment script for PNS system on Polygon
 */
contract DeployPNS is Script {
    address public adminAddress;
    address public treasuryAddress;

    PNSRegistry public registry;
    PNSPriceOracle public priceOracle;
    PNSResolver public resolver;
    PNSRegistrar public registrar;
    PNSController public controller;
    PNSDomainNFT public nft;

    function run() public {
        // Get configuration from environment or use defaults
        adminAddress = vm.envOr("PNS_ADMIN", msg.sender);
        treasuryAddress = vm.envOr("PNS_TREASURY", msg.sender);

        console.log("Deploying PNS System...");
        console.log("Admin:", adminAddress);
        console.log("Treasury:", treasuryAddress);

        vm.startBroadcast();

        // Deploy PNSRegistry
        console.log("\n=== Deploying PNSRegistry ===");
        registry = new PNSRegistry();
        registry.initialize(adminAddress);
        console.log("PNSRegistry deployed at:", address(registry));

        // Deploy PNSPriceOracle
        console.log("\n=== Deploying PNSPriceOracle ===");
        priceOracle = new PNSPriceOracle();
        priceOracle.initialize();
        console.log("PNSPriceOracle deployed at:", address(priceOracle));

        // Deploy PNSResolver
        console.log("\n=== Deploying PNSResolver ===");
        resolver = new PNSResolver();
        resolver.initialize(adminAddress, address(registry));
        console.log("PNSResolver deployed at:", address(resolver));

        // Deploy PNSRegistrar
        console.log("\n=== Deploying PNSRegistrar ===");
        registrar = new PNSRegistrar();
        registrar.initialize(address(registry), address(priceOracle), treasuryAddress, adminAddress);
        console.log("PNSRegistrar deployed at:", address(registrar));

        // Deploy PNSController
        console.log("\n=== Deploying PNSController ===");
        controller = new PNSController();
        controller.initialize(
            address(registry),
            address(registrar),
            address(resolver),
            adminAddress,
            address(priceOracle)
        );
        console.log("PNSController deployed at:", address(controller));

        // Deploy PNSDomainNFT
        console.log("\n=== Deploying PNSDomainNFT ===");
        string memory baseURI = "https://api.pns.link/metadata/";
        nft = new PNSDomainNFT(address(registry), baseURI);
        // NFT does not have initialize function, it uses constructor
        console.log("PNSDomainNFT deployed at:", address(nft));

        // Setup Roles and Permissions
        console.log("\n=== Setting up Roles ===");

        // Grant REGISTRAR_ROLE to Registrar in Registry
        bytes32 registrarRole = registry.REGISTRAR_ROLE();
        registry.grantRole(registrarRole, address(registrar));
        console.log("Granted REGISTRAR_ROLE to Registrar");

        // Grant REGISTRY_ROLE to Resolver
        bytes32 registryRole = resolver.REGISTRY_ROLE();
        resolver.grantRole(registryRole, address(registry));
        console.log("Granted REGISTRY_ROLE to Registry");

        // Grant CONTROLLER_ROLE to Controller in Registrar
        registrar.setController(address(controller));
        console.log("Granted CONTROLLER_ROLE to Controller");

        // Log all addresses for verification
        console.log("\n=== Deployment Complete ===");
        console.log("Registry:", address(registry));
        console.log("PriceOracle:", address(priceOracle));
        console.log("Resolver:", address(resolver));
        console.log("Registrar:", address(registrar));
        console.log("Controller:", address(controller));
        console.log("NFT:", address(nft));

        vm.stopBroadcast();
    }
}
