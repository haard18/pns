// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PNSDomainNFT} from "../src/PNSDomainNFT.sol";

contract DeployPNSDomainNFT is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        PNSDomainNFT nft = new PNSDomainNFT(
            0xEbcbf5dB26A7496Ab146E7595bE76B3FE1345F80,
            "ipfs://bafkreiedjwny3u67id3zl2gymy7hhrphkvmwi2o6ni5majlqzj4ihuzzv4"
        );

        vm.stopBroadcast();

        console2.log("PNSDomainNFT deployed at:", address(nft));
    }
}
