// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { PNSMarketplace } from "../src/PNSMarketplace.sol";
import { PNSDomainNFT } from "../src/PNSDomainNFT.sol";

/**
 * @title DeployMarketplace
 * @dev Deployment script for PNS Marketplace
 */
contract DeployMarketplace is Script {
    address public domainNFTAddress;
    address public usdcTokenAddress;
    address public feeRecipientAddress;
    address public adminAddress;

    PNSMarketplace public marketplace;

    function run() public {
        // Get configuration from environment
        // Support both NFT and PNS_NFT_ADDRESS variable names
        try vm.envAddress("PNS_NFT_ADDRESS") returns (address nftAddr) {
            domainNFTAddress = nftAddr;
        } catch {
            try vm.envAddress("NFT") returns (address nftAddr) {
                domainNFTAddress = nftAddr;
            } catch {
                console.log("Error: NFT address not found in environment");
                console.log("Please set either NFT or PNS_NFT_ADDRESS in your .env file");
                console.log("Example: NFT=0x7916a0bCcEf6AEfF4d603C04313eDf0d59Dfc028");
                revert("NFT address required");
            }
        }
        
        // Support both USDC and USDC_TOKEN_ADDRESS
        try vm.envAddress("USDC_TOKEN_ADDRESS") returns (address usdcAddr) {
            usdcTokenAddress = usdcAddr;
        } catch {
            usdcTokenAddress = vm.envOr("USDC", address(0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359));
        }
        
        // Use PNS_TREASURY or PNS_ADMIN as fallback for fee recipient
        try vm.envAddress("FEE_RECIPIENT") returns (address feeAddr) {
            feeRecipientAddress = feeAddr;
        } catch {
            try vm.envAddress("PNS_TREASURY") returns (address treasuryAddr) {
                feeRecipientAddress = treasuryAddr;
            } catch {
                feeRecipientAddress = vm.envOr("PNS_ADMIN", msg.sender);
            }
        }
        
        adminAddress = vm.envOr("PNS_ADMIN", msg.sender);

        require(domainNFTAddress != address(0), "PNS NFT address required");
        require(usdcTokenAddress != address(0), "USDC token address required");
        require(feeRecipientAddress != address(0), "Fee recipient address required");

        console.log("Deploying PNS Marketplace...");
        console.log("PNS Domain NFT:", domainNFTAddress);
        console.log("USDC Token:", usdcTokenAddress);
        console.log("Fee Recipient:", feeRecipientAddress);
        console.log("Admin:", adminAddress);

        vm.startBroadcast();

        // Deploy PNSMarketplace
        console.log("\n=== Deploying PNSMarketplace ===");
        marketplace = new PNSMarketplace(
            domainNFTAddress,
            usdcTokenAddress,
            feeRecipientAddress
        );
        console.log("PNSMarketplace deployed at:", address(marketplace));

        // Setup marketplace in NFT contract (if deployer is owner)
        console.log("\n=== Setting Marketplace in NFT Contract ===");
        console.log("Attempting to set marketplace address in NFT contract...");
        
        // Check if we're the owner first
        try PNSDomainNFT(domainNFTAddress).owner() returns (address nftOwner) {
            console.log("NFT Contract Owner:", nftOwner);
            console.log("Current Deployer:", msg.sender);
            
            if (nftOwner == msg.sender) {
                try PNSDomainNFT(domainNFTAddress).setMarketplace(address(marketplace)) {
                    console.log("SUCCESS: Marketplace address set in NFT contract");
                } catch Error(string memory reason) {
                    console.log("FAILED: Could not set marketplace -", reason);
                    console.log("You will need to call setMarketplace() manually");
                } catch {
                    console.log("FAILED: Unknown error setting marketplace");
                    console.log("You will need to call setMarketplace() manually");
                }
            } else {
                console.log("SKIPPED: Deployer is not the NFT owner");
                console.log("The NFT owner must call setMarketplace() manually");
            }
        } catch {
            console.log("WARNING: Could not check NFT owner");
            console.log("If setting marketplace fails, you may need to call it manually");
        }

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n");
        console.log("====================================================================");
        console.log("                    DEPLOYMENT SUCCESSFUL!                          ");
        console.log("====================================================================");
        console.log("");
        console.log("PNS Marketplace Contract:");
        console.log("  Address: %s", address(marketplace));
        console.log("");
        console.log("Configuration:");
        console.log("  Domain NFT: %s", domainNFTAddress);
        console.log("  USDC Token: %s", usdcTokenAddress);
        console.log("  Fee Recipient: %s", feeRecipientAddress);
        console.log("  Marketplace Fee: %s bps (2.5%%)", marketplace.marketplaceFee());
        console.log("  Min Listing Price: %s USDC", marketplace.minListingPrice() / 1e6);
        console.log("");
        console.log("====================================================================");
        
        console.log("\n=== Next Steps ===");
        console.log("1. Save marketplace address to .env:");
        console.log("   MARKETPLACE=%s", address(marketplace));
        console.log("2. If setMarketplace was skipped, call it manually as NFT owner:");
        console.log("   cast send %s", domainNFTAddress);
        console.log("     'setMarketplace(address)' %s", address(marketplace));
        console.log("     --rpc-url $RPC_URL --private-key $OWNER_KEY");
        console.log("3. Update frontend with marketplace address");
        console.log("4. Update backend indexer to listen for marketplace events");
    }
}
