#!/bin/bash
# PNS Smart Contracts - Anvil Testing Guide
# This script demonstrates how to test the PNS contracts on a local Anvil blockchain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}PNS Contracts - Anvil Testing${NC}"
echo -e "${BLUE}================================${NC}\n"

# ============ SETUP ============

echo -e "${YELLOW}Step 1: Start Anvil (if not already running)${NC}"
echo "anvil --mnemonic 'test test test test test test test test test test test junk'"
echo ""

# Default Anvil addresses (from the mnemonic above)
ADMIN="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
TREASURY="0x70997970C51812e339D9B73b0245ad59419F44Be"
USER1="0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a"
USER2="0x90F79bf6EB2c4f870365E785982E1f101E93b906"

echo -e "${BLUE}Using default Anvil accounts:${NC}"
echo "ADMIN:    $ADMIN"
echo "TREASURY: $TREASURY"
echo "USER1:    $USER1"
echo "USER2:    $USER2"
echo ""

# ============ DEPLOY CONTRACTS ============

echo -e "${YELLOW}Step 2: Deploy PNS Contracts${NC}"
echo ""

echo "2a. Deploy PNSRegistry"
echo "forge create src/PNSRegistry.sol:PNSRegistry --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "2b. Deploy PNSPriceOracle"
echo "forge create src/PNSPriceOracle.sol:PNSPriceOracle --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "2c. Deploy PNSResolver"
echo "forge create src/PNSResolver.sol:PNSResolver --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "2d. Deploy PNSRegistrar"
echo "forge create src/PNSRegistrar.sol:PNSRegistrar --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "2e. Deploy PNSController"
echo "forge create src/PNSController.sol:PNSController --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "2f. Deploy PNSDomainNFT"
echo "forge create src/PNSDomainNFT.sol:PNSDomainNFT --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0 --constructor-args $ADMIN 'https://pns.poly/metadata/'"
echo ""

# ============ INITIALIZE CONTRACTS ============

echo -e "${YELLOW}Step 3: Initialize Contracts${NC}"
echo ""

# You would replace these with actual deployed contract addresses
REGISTRY="0x..." # Replace with deployed address
PRICE_ORACLE="0x..." # Replace with deployed address
RESOLVER="0x..." # Replace with deployed address
REGISTRAR="0x..." # Replace with deployed address
CONTROLLER="0x..." # Replace with deployed address
NFT="0x..." # Replace with deployed address

echo "3a. Initialize Registry"
echo "cast send $REGISTRY 'initialize(address)' $ADMIN --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "3b. Initialize PriceOracle"
echo "cast send $PRICE_ORACLE 'initialize()' --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "3c. Initialize Resolver"
echo "cast send $RESOLVER 'initialize(address,address)' $ADMIN $REGISTRY --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "3d. Initialize Registrar"
echo "cast send $REGISTRAR 'initialize(address,address,address,address)' $REGISTRY $PRICE_ORACLE $TREASURY $ADMIN --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "3e. Initialize Controller"
echo "cast send $CONTROLLER 'initialize(address,address,address,address)' $REGISTRY $REGISTRAR $RESOLVER $TREASURY --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

# ============ GRANT ROLES ============

echo -e "${YELLOW}Step 4: Grant Roles${NC}"
echo ""

echo "4a. Set Registrar on Registry"
echo "cast send $REGISTRY 'setRegistrar(address)' $REGISTRAR --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "4b. Set Resolver on Registry"
echo "cast send $REGISTRY 'setResolver(address)' $RESOLVER --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "4c. Grant CONTROLLER_ROLE to Controller on Registrar"
CONTROLLER_ROLE=$(cast keccak256 "CONTROLLER_ROLE()")
echo "cast send $REGISTRAR 'grantRole(bytes32,address)' $CONTROLLER_ROLE $CONTROLLER --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "4d. Grant REGISTRY_ROLE to Controller on Resolver"
REGISTRY_ROLE=$(cast keccak256 "REGISTRY_ROLE()")
echo "cast send $RESOLVER 'grantRole(bytes32,address)' $REGISTRY_ROLE $CONTROLLER --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

# ============ TEST REGISTRATIONS ============

echo -e "${YELLOW}Step 5: Test Domain Registration${NC}"
echo ""

echo "5a. Check pricing for 'alice' (1 year)"
echo "cast call $PRICE_ORACLE 'getPrice(bytes32,string,uint256)' \$(cast keccak256 'alice.poly') 'alice' 1 --rpc-url http://localhost:8545"
echo ""

echo "5b. Register 'alice.poly' as USER1"
# Get the price first and use it for the transaction
echo "cast send $CONTROLLER 'registerDomain(string,address,uint256)' alice $USER1 1 --rpc-url http://localhost:8545 --private-key 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1f7c7a1d85f337151 --value 50ether"
echo ""

echo "5c. Check if 'alice.poly' exists"
NAME_HASH=$(cast keccak256 'alice.poly')
echo "cast call $REGISTRY 'exists(bytes32)' $NAME_HASH --rpc-url http://localhost:8545"
echo ""

echo "5d. Get domain owner"
echo "cast call $REGISTRY 'getNameRecord(bytes32)' $NAME_HASH --rpc-url http://localhost:8545"
echo ""

# ============ TEST RESOLVER ============

echo -e "${YELLOW}Step 6: Test Resolver Functions${NC}"
echo ""

echo "6a. Set address record for 'alice.poly'"
echo "cast send $RESOLVER 'setPolygonAddr(bytes32,address)' $NAME_HASH $USER1 --rpc-url http://localhost:8545 --private-key 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1f7c7a1d85f337151"
echo ""

echo "6b. Get address record for 'alice.poly'"
echo "cast call $RESOLVER 'getPolygonAddr(bytes32)' $NAME_HASH --rpc-url http://localhost:8545"
echo ""

echo "6c. Set text record (avatar)"
echo "cast send $RESOLVER 'setText(bytes32,string,string)' $NAME_HASH 'avatar' 'https://example.com/avatar.png' --rpc-url http://localhost:8545 --private-key 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1f7c7a1d85f337151"
echo ""

echo "6d. Get text record (avatar)"
echo "cast call $RESOLVER 'getText(bytes32,string)' $NAME_HASH 'avatar' --rpc-url http://localhost:8545"
echo ""

# ============ TEST NFT ============

echo -e "${YELLOW}Step 7: Test Domain NFT${NC}"
echo ""

echo "7a. Mint NFT for 'alice.poly'"
echo "cast send $NFT 'mintDomain(string,bytes32,address)' 'alice' $NAME_HASH $USER1 --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
echo ""

echo "7b. Check NFT owner"
echo "cast call $NFT 'ownerOf(uint256)' 1 --rpc-url http://localhost:8545"
echo ""

echo "7c. Get token URI"
echo "cast call $NFT 'tokenURI(uint256)' 1 --rpc-url http://localhost:8545"
echo ""

# ============ SUMMARY ============

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Key Commands Used:"
echo "  - forge create: Deploy contracts"
echo "  - cast send: Execute state-changing functions"
echo "  - cast call: Query contract state (read-only)"
echo "  - cast keccak256: Hash values for role IDs"
echo ""
echo "Remember to replace contract addresses with actual deployed addresses!"
