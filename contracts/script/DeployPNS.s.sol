// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.19;

// import { Script } from "forge-std/Script.sol";
// import { console } from "forge-std/console.sol";

// import { PNSRegistry } from "../src/PNSRegistry.sol";
// import { PNSPriceOracle } from "../src/PNSPriceOracle.sol";
// import { PNSResolver } from "../src/PNSResolver.sol";
// import { PNSRegistrar } from "../src/PNSRegistrar.sol";
// import { PNSController } from "../src/PNSController.sol";
// import { PNSDomainNFT } from "../src/PNSDomainNFT.sol";

// /**
//  * @title DeployPNS
//  * @dev Deployment script for PNS system on Polygon
//  */
// contract DeployPNS is Script {
//     address public adminAddress;
//     address public treasuryAddress;

//     PNSRegistry public registry;
//     PNSPriceOracle public priceOracle;
//     PNSResolver public resolver;
//     PNSRegistrar public registrar;
//     PNSController public controller;
//     PNSDomainNFT public nft;

//     function run() public {
//         // Get configuration from environment or use defaults
//         adminAddress = vm.envOr("PNS_ADMIN", msg.sender);
//         treasuryAddress = vm.envOr("PNS_TREASURY", msg.sender);

//         console.log("Deploying PNS System...");
//         console.log("Admin:", adminAddress);
//         console.log("Treasury:", treasuryAddress);

//         vm.startBroadcast();

//         // Deploy PNSRegistry
//         console.log("\n=== Deploying PNSRegistry ===");
//         registry = new PNSRegistry();
//         registry.initialize(adminAddress);
//         console.log("PNSRegistry deployed at:", address(registry));

//         // Deploy PNSPriceOracle
//         console.log("\n=== Deploying PNSPriceOracle ===");
//         priceOracle = new PNSPriceOracle();
//         priceOracle.initialize();
//         console.log("PNSPriceOracle deployed at:", address(priceOracle));

//         // Deploy PNSResolver
//         console.log("\n=== Deploying PNSResolver ===");
//         resolver = new PNSResolver();
//         resolver.initialize(adminAddress, address(registry));
//         console.log("PNSResolver deployed at:", address(resolver));

//         // Deploy PNSRegistrar
//         console.log("\n=== Deploying PNSRegistrar ===");
//         registrar = new PNSRegistrar();
//         registrar.initialize(address(registry), address(priceOracle), treasuryAddress, adminAddress);
//         console.log("PNSRegistrar deployed at:", address(registrar));

//         // Deploy PNSController
//         console.log("\n=== Deploying PNSController ===");
//         controller = new PNSController();
//         controller.initialize(address(registry), address(registrar), address(resolver), adminAddress);
//         console.log("PNSController deployed at:", address(controller));

//         // Deploy PNSDomainNFT
//         console.log("\n=== Deploying PNSDomainNFT ===");
//         nft = new PNSDomainNFT(address(registry), "https://pns.poly/metadata/");
//         console.log("PNSDomainNFT deployed at:", address(nft));

//         // Grant roles
//         console.log("\n=== Setting up roles ===");
//         registry.setRegistrar(address(registrar));
//         console.log("Registrar role set");

//         registry.setResolver(address(resolver));
//         console.log("Resolver role set");

//         vm.stopBroadcast();

//         // Log summary
//         console.log("\n=== PNS System Deployment Complete ===");
//         console.log("Registry:", address(registry));
//         console.log("PriceOracle:", address(priceOracle));
//         console.log("Resolver:", address(resolver));
//         console.log("Registrar:", address(registrar));
//         console.log("Controller:", address(controller));
//         console.log("NFT:", address(nft));

//         // Write addresses to a JSON file
//         _writeDeploymentAddresses();
//     }

//     function _writeDeploymentAddresses() internal {
//         string memory json = "{\n";
//         json = string.concat(json, '  "registry": "', _addressToString(address(registry)), '",\n');
//         json = string.concat(json, '  "priceOracle": "', _addressToString(address(priceOracle)), '",\n');
//         json = string.concat(json, '  "resolver": "', _addressToString(address(resolver)), '",\n');
//         json = string.concat(json, '  "registrar": "', _addressToString(address(registrar)), '",\n');
//         json = string.concat(json, '  "controller": "', _addressToString(address(controller)), '",\n');
//         json = string.concat(json, '  "nft": "', _addressToString(address(nft)), '"\n');
//         json = string.concat(json, "}");

//         vm.writeFile("deployments/pns-addresses.json", json);
//     }

//     function _addressToString(address addr) internal pure returns (string memory) {
//         bytes32 value = bytes32(uint256(uint160(addr)));
//         bytes memory alphabet = "0123456789abcdef";
//         bytes memory str = new bytes(42);
//         str[0] = "0";
//         str[1] = "x";
//         for (uint256 i = 0; i < 20; i++) {
//             str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
//             str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
//         }
//         return string(str);
//     }
// }
