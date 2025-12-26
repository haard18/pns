// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PNSDomainNFT} from "../src/PNSDomainNFT.sol";

contract DeployPNSDomainNFT is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        address registry = vm.envAddress("REGISTRY");
        PNSDomainNFT nft = new PNSDomainNFT(
            registry,
            "https://pns.poly/metadata/"
        );

        vm.stopBroadcast();

        console2.log("PNSDomainNFT deployed at:", address(nft));
    }
}
