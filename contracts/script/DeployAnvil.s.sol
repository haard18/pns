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
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10**6); // Mint 1M USDC
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

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
        
        // Deploy Mock USDC for testing
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));
        
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
            address(usdc), // USDC token
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
            address(priceOracle),
            address(usdc) // USDC token
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
