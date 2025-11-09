# PNS Anvil Testing - Quick Reference

## 🚀 Quick Start

### Terminal 1: Start Anvil
```bash
anvil --mnemonic "test test test test test test test test test test test junk"
```

### Terminal 2: Run Tests
```bash
# Start from contracts directory
cd /Users/hardy/Developer/scalper/nameservice/contracts

# Run all tests
forge test -v

# Run with gas report
forge test --gas-report

# Run specific test
forge test --match-test testRegistryInitialization -v
```

## 📋 Default Anvil Accounts

From mnemonic: `test test test test test test test test test test test junk`

| Account | Address | Private Key |
|---------|---------|-------------|
| Account 0 (Admin) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Account 1 | `0x70997970C51812e339D9B73b0245ad59419F44Be` | `0x59c6995e998f97f5a0dab3bfb139d08b061623c618f96e4da308107da46ca7f0` |
| Account 2 (User1) | `0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a` | `0x5de4111afa1a4b94908f83103db1fb50da4c89699e6dffb97ae4e8e89143a01b` |
| Account 3 (User2) | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419f67cbca63919248cdc4c5fea9d50be` |

## 🔧 Deployment Steps

### 1. Deploy All Contracts

```bash
# Deploy PNSRegistry
REGISTRY=$(forge create src/PNSRegistry.sol:PNSRegistry \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --json | jq -r '.deployedTo')
0x5FbDB2315678afecb367f032d93F642f64180aa3
# Deploy PNSPriceOracle
PRICE_ORACLE=$(forge create src/PNSPriceOracle.sol:PNSPriceOracle \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --json | jq -r '.deployedTo')
0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
# Deploy PNSResolver
RESOLVER=$(forge create src/PNSResolver.sol:PNSResolver \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --json | jq -r '.deployedTo')
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
# Deploy PNSRegistrar
REGISTRAR=$(forge create src/PNSRegistrar.sol:PNSRegistrar \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --json | jq -r '.deployedTo')
0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
# Deploy PNSController
CONTROLLER=$(forge create src/PNSController.sol:PNSController \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --json | jq -r '.deployedTo')
0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
# Deploy PNSDomainNFT
NFT=$(forge create src/PNSDomainNFT.sol:PNSDomainNFT \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --constructor-args 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 "https://pns.poly/metadata/" \
  --json | jq -r '.deployedTo')
0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
# Save addresses
echo "REGISTRY=$REGISTRY"
echo "PRICE_ORACLE=$PRICE_ORACLE"
echo "RESOLVER=$RESOLVER"
echo "REGISTRAR=$REGISTRAR"
echo "CONTROLLER=$CONTROLLER"
echo "NFT=$NFT"
```

### 2. Initialize Contracts

```bash
ADMIN="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
TREASURY="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

# Initialize Registry
cast send $REGISTRY 'initialize(address)' $ADMIN \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Initialize PriceOracle
cast send $PRICE_ORACLE 'initialize()' \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Initialize Resolver
cast send $RESOLVER 'initialize(address,address)' $ADMIN $REGISTRY \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Initialize Registrar
cast send $REGISTRAR 'initialize(address,address,address,address)' $REGISTRY $PRICE_ORACLE $TREASURY $ADMIN \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Initialize Controller
cast send $CONTROLLER 'initialize(address,address,address,address)' $REGISTRY $REGISTRAR $RESOLVER $TREASURY \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 3. Grant Roles

```bash
# Set Registrar on Registry
cast send $REGISTRY 'setRegistrar(address)' $REGISTRAR \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Set Resolver on Registry
cast send $REGISTRY 'setResolver(address)' $RESOLVER \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Grant CONTROLLER_ROLE to Controller on Registrar
# CONTROLLER_ROLE = 0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357
cast send $REGISTRAR 'grantRole(bytes32,address)' 0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357 $CONTROLLER \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Grant REGISTRY_ROLE to Controller on Resolver
# REGISTRY_ROLE = 0xc2979137d1774e40fe2638d355bf7a7b092be4c67f242aad1655e1e27f9df9cc
cast send $RESOLVER 'grantRole(bytes32,address)' 0xc2979137d1774e40fe2638d355bf7a7b092be4c67f242aad1655e1e27f9df9cc $CONTROLLER \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Grant REGISTRAR_ROLE to Registrar on Registry
# REGISTRAR_ROLE = 0xedcc084d3dcd65a1f7f23c65c46722faca6953d28e43150a467cf43e5c309238
cast send $REGISTRY 'grantRole(bytes32,address)' 0xedcc084d3dcd65a1f7f23c65c46722faca6953d28e43150a467cf43e5c309238 $REGISTRAR \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## 📝 Testing Domain Operations

### Register a Domain

```bash
USER1="0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
USER1_KEY="0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"

# Check price
cast call $PRICE_ORACLE 'getPrice(bytes32,string,uint256)' \
  $(cast keccak256 'alice.poly') 'alice' 1 \
  --rpc-url http://localhost:8545

# Register domain (50 ether is plenty for all registration costs)
cast send $CONTROLLER 'registerDomain(string,address,uint256)' 'alice' $USER1 1 \
  --rpc-url http://localhost:8545 \
  --private-key $USER1_KEY \
  --value 50ether
```

### Query Domain Information

```bash
NAME_HASH=$(cast keccak256 'alice.poly')

# Check if domain exists
cast call $REGISTRY 'exists(bytes32)' $NAME_HASH \
  --rpc-url http://localhost:8545

# Get domain record
cast call $REGISTRY 'getNameRecord(bytes32)' $NAME_HASH \
  --rpc-url http://localhost:8545

# Check availability
cast call $CONTROLLER 'isDomainAvailable(string)' 'alice' \
  --rpc-url http://localhost:8545

# Get domain owner
cast call $CONTROLLER 'getDomainOwner(string)' 'alice' \
  --rpc-url http://localhost:8545
```

### Set Resolver Records

```bash
NAME_HASH=$(cast keccak256 'alice.poly')
USER1="0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a"
USER1_KEY="0x5de4111afa1a4b94908f83103db1fb50da4c89699e6dffb97ae4e8e89143a01b"

# Set address record
cast send $RESOLVER 'setPolygonAddr(bytes32,address)' $NAME_HASH $USER1 \
  --rpc-url http://localhost:8545 \
  --private-key $USER1_KEY

# Get address record
cast call $RESOLVER 'getPolygonAddr(bytes32)' $NAME_HASH \
  --rpc-url http://localhost:8545

# Set text record (avatar)
cast send $RESOLVER 'setText(bytes32,string,string)' $NAME_HASH 'avatar' 'https://example.com/avatar.png' \
  --rpc-url http://localhost:8545 \
  --private-key $USER1_KEY

# Get text record
cast call $RESOLVER 'getText(bytes32,string)' $NAME_HASH 'avatar' \
  --rpc-url http://localhost:8545
```

### NFT Operations

```bash
NAME_HASH=$(cast keccak256 'alice.poly')
ADMIN="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ADMIN_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Mint NFT
cast send $NFT 'mintDomain(string,bytes32,address)' 'alice' $NAME_HASH $USER1 \
  --rpc-url http://localhost:8545 \
  --private-key $ADMIN_KEY

# Check NFT owner
cast call $NFT 'ownerOf(uint256)' 1 \
  --rpc-url http://localhost:8545

# Get token URI
cast call $NFT 'tokenURI(uint256)' 1 \
  --rpc-url http://localhost:8545
```

## 🔍 Useful cast Commands

```bash
# Get account balance
cast balance 0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a --rpc-url http://localhost:8545

# Get contract code
cast code $REGISTRY --rpc-url http://localhost:8545

# Get storage value at index
cast storage $REGISTRY 0 --rpc-url http://localhost:8545

# Decode function call data
cast 4byte-decode 0x91d14854

# Encode function call
cast calldata 'registerDomain(string,address,uint256)' 'test' '0x...' 1

# Get block number
cast block-number --rpc-url http://localhost:8545

# Get current timestamp
cast block latest timestamp --rpc-url http://localhost:8545
```

## 📊 Testing Workflow Example

```bash
#!/bin/bash

# Set variables
ADMIN="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ADMIN_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
USER1="0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a"
USER1_KEY="0x5de4111afa1a4b94908f83103db1fb50da4c89699e6dffb97ae4e8e89143a01b"

# Deploy contracts
echo "Deploying contracts..."
REGISTRY=$(forge create src/PNSRegistry.sol:PNSRegistry --rpc-url http://localhost:8545 --private-key $ADMIN_KEY --json | jq -r '.deployedTo')
echo "Registry: $REGISTRY"

# Initialize
echo "Initializing..."
cast send $REGISTRY 'initialize(address)' $ADMIN --rpc-url http://localhost:8545 --private-key $ADMIN_KEY

# Test
echo "Testing domain operations..."
NAME_HASH=$(cast keccak256 'test.poly')
cast call $REGISTRY 'exists(bytes32)' $NAME_HASH --rpc-url http://localhost:8545
```

## 🐛 Debugging Tips

- **Use `-vvv` flag with forge for detailed output**
  ```bash
  forge test -vvv
  ```

- **Check transaction details with cast**
  ```bash
  cast tx 0x... --rpc-url http://localhost:8545
  ```

- **View transaction receipt**
  ```bash
  cast receipt 0x... --rpc-url http://localhost:8545
  ```

- **Decode transaction call data**
  ```bash
  cast decode-transaction 0x... --rpc-url http://localhost:8545
  ```

- **Monitor Anvil logs for detailed execution trace**
  - Anvil will show all transactions, gas usage, and state changes

## 📚 Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Cast Reference](https://book.getfoundry.sh/reference/cast/)
- [Forge Reference](https://book.getfoundry.sh/reference/forge/)
- [Anvil Reference](https://book.getfoundry.sh/reference/anvil/)
