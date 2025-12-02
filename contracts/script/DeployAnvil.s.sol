// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { PNSRegistry } from "../src/PNSRegistry.sol";
import { PNSRegistrar } from "../src/PNSRegistrar.sol";
import { PNSController } from "../src/PNSController.sol";
import { PNSResolver } from "../src/PNSResolver.sol";
import { PNSPriceOracle } from "../src/PNSPriceOracle.sol";
import { PNSDomainNFT } from "../src/PNSDomainNFT.sol";

contract DeployAnvil is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Registry
        PNSRegistry registry = new PNSRegistry();
        registry.initialize(deployer);
        console.log("PNSRegistry deployed at:", address(registry));
        
        // Deploy Price Oracle
        PNSPriceOracle priceOracle = new PNSPriceOracle();
        priceOracle.initialize();
        console.log("PNSPriceOracle deployed at:", address(priceOracle));
        
        // Deploy Resolver
        PNSResolver resolver = new PNSResolver();
        resolver.initialize(deployer, address(registry));
        console.log("PNSResolver deployed at:", address(resolver));
        
        // Deploy Domain NFT
        PNSDomainNFT domainNFT = new PNSDomainNFT(
            address(registry),
            "https://metadata.example.com/"
        );
        console.log("PNSDomainNFT deployed at:", address(domainNFT));
        
        // Deploy Registrar
        PNSRegistrar registrar = new PNSRegistrar();
        registrar.initialize(
            address(registry),
            address(priceOracle),
            deployer, // treasury
            deployer  // admin
        );
        console.log("PNSRegistrar deployed at:", address(registrar));
        
        // Deploy Controller
        PNSController controller = new PNSController();
        controller.initialize(
            address(registry),
            address(registrar),
            address(resolver),
            deployer, // fee recipient
            address(priceOracle)
        );
        console.log("PNSController deployed at:", address(controller));
        
        // Set up roles and permissions
        registry.grantRole(registry.REGISTRAR_ROLE(), address(registrar));
        registry.grantRole(registry.RESOLVER_ROLE(), address(resolver));
        
        // Grant controller access to registrar
        registrar.grantRole(registrar.CONTROLLER_ROLE(), address(controller));
        
        console.log("All contracts deployed and configured!");
        
        vm.stopBroadcast();
    }
}
