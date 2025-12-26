# PNS Deployment Guide - Step by Step

## Current Implementation Status

✅ **NFT Minting on Purchase**: NFTs are automatically minted when users buy domains (implemented in `PNSRegistrar.sol` lines 348-355)

✅ **Dynamic SVG Generation**: Each NFT displays the domain name (e.g., "haard.poly") with custom artwork

## Deployment Options

### Option 1: Local Testing (Anvil)

Start Anvil in a separate terminal:
```bash
cd /Users/hardy/Developer/scalper/nameservice/contracts
anvil --reset
```

Then deploy all contracts:
```bash
./deploy-complete.sh
```

This script will:
1. Deploy all contracts (Registry, PriceOracle, Resolver, Registrar, Controller, NFT)
2. Initialize all contracts
3. Configure roles and permissions
4. Set up price oracle
5. Test domain registrations
6. Output all contract addresses

### Option 2: Polygon Mainnet Deployment

#### Prerequisites
```bash
# Set your environment variables
export PRIVATE_KEY="your_private_key_here"
export RPC_URL="https://polygon-rpc.com"
export ETHERSCAN_API_KEY="your_polygonscan_api_key"
```

#### Step-by-Step Deployment

**1. Deploy PNSRegistry**
```bash
forge create src/PNSRegistry.sol:PNSRegistry \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --broadcast
```

**2. Deploy PNSPriceOracle**
```bash
forge create src/PNSPriceOracle.sol:PNSPriceOracle \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --broadcast
```

**3. Deploy PNSResolver**
```bash
forge create src/PNSResolver.sol:PNSResolver \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --broadcast
```

**4. Deploy PNSRegistrar**
```bash
forge create src/PNSRegistrar.sol:PNSRegistrar \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --broadcast
```

**5. Deploy PNSController**
```bash
forge create src/PNSController.sol:PNSController \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --broadcast
```

**6. Deploy PNSDomainNFT**
```bash
forge create src/PNSDomainNFT.sol:PNSDomainNFT \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args $REGISTRY "https://pns.poly/metadata/" \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --broadcast
```

**7. Initialize Contracts**

Save the deployed addresses as environment variables:
```bash
export REGISTRY="0x..."
export PRICE_ORACLE="0x..."
export RESOLVER="0x..."
export REGISTRAR="0x..."
export CONTROLLER="0x..."
export NFT="0x..."
export ADMIN="your_admin_address"
export TREASURY="your_treasury_address"
```

Initialize Registry:
```bash
cast send $REGISTRY 'initialize(address)' $ADMIN \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Initialize PriceOracle:
```bash
cast send $PRICE_ORACLE 'initialize()' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Initialize Resolver:
```bash
cast send $RESOLVER 'initialize(address,address)' $ADMIN $REGISTRY \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Initialize Registrar:
```bash
cast send $REGISTRAR 'initialize(address,address,address,address)' \
  $REGISTRY $PRICE_ORACLE $TREASURY $ADMIN \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Initialize Controller:
```bash
cast send $CONTROLLER 'initialize(address,address,address,address,address)' \
  $REGISTRY $REGISTRAR $RESOLVER $TREASURY $PRICE_ORACLE \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**8. Configure Registry References**

Set Registrar on Registry:
```bash
cast send $REGISTRY 'setRegistrar(address)' $REGISTRAR \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Set Resolver on Registry:
```bash
cast send $REGISTRY 'setResolver(address)' $RESOLVER \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**9. Set NFT Contract on Registrar**
```bash
cast send $REGISTRAR 'setNFTContract(address)' $NFT \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**10. Grant Roles**

Calculate role hashes:
```bash
CONTROLLER_ROLE=$(cast keccak "CONTROLLER_ROLE")
REGISTRY_ROLE=$(cast keccak "REGISTRY_ROLE")
REGISTRAR_ROLE=$(cast keccak "REGISTRAR_ROLE")
ADMIN_ROLE=$(cast keccak "ADMIN_ROLE")
```

Grant CONTROLLER_ROLE to Controller on Registrar:
```bash
cast send $REGISTRAR 'grantRole(bytes32,address)' $CONTROLLER_ROLE $CONTROLLER \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Grant REGISTRY_ROLE to Controller on Resolver:
```bash
cast send $RESOLVER 'grantRole(bytes32,address)' $REGISTRY_ROLE $CONTROLLER \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Grant REGISTRAR_ROLE to Registrar on Registry:
```bash
cast send $REGISTRY 'grantRole(bytes32,address)' $REGISTRAR_ROLE $REGISTRAR \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Grant ADMIN_ROLE to Admin on Registry:
```bash
cast send $REGISTRY 'grantRole(bytes32,address)' $ADMIN_ROLE $ADMIN \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**11. Configure Registrar Settings**

Set registration period (1 year):
```bash
cast send $REGISTRAR 'setRegistrationPeriod(uint256)' 31536000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Set grace period (30 days):
```bash
cast send $REGISTRAR 'setGracePeriod(uint256)' 2592000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Configure commitment (1 day min age, 7 day cooldown):
```bash
cast send $REGISTRAR 'setCommitmentConfig(uint256,uint256)' 86400 604800 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**12. Configure Price Oracle**

Set prices (in USDC - 6 decimals):
```bash
# Short (1-2 chars): 5000 USDC
# Mid (3-4 chars): 2000 USDC
# Regular (5-15 chars): 1000 USDC
# Long (16+ chars): 500 USDC
cast send $PRICE_ORACLE 'setPrices(uint256,uint256,uint256,uint256)' \
  5000000000 2000000000 1000000000 500000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**13. Set USDC Token Address**
```bash
# Polygon USDC: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
USDC_ADDRESS="0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"

cast send $REGISTRAR 'setUSDCToken(address)' $USDC_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

cast send $CONTROLLER 'setUSDCToken(address)' $USDC_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

## Testing Domain Purchase with NFT Minting

After deployment, test the complete flow:

```bash
# Approve USDC spending
cast send $USDC_ADDRESS 'approve(address,uint256)' $CONTROLLER 1000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Register a domain (this will automatically mint an NFT)
cast send $CONTROLLER 'registerDomain(string,address,uint256)' \
  'haard' $ADMIN 1 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Check if NFT was minted
cast call $NFT 'balanceOf(address)' $ADMIN \
  --rpc-url $RPC_URL

# Get token URI to see the SVG
cast call $NFT 'tokenURI(uint256)' 1 \
  --rpc-url $RPC_URL
```

## How NFT Minting Works

1. **On Purchase**: When a user buys a domain through `PNSController` or `PNSRegistrar`, the NFT is automatically minted
2. **Dynamic SVG**: The NFT displays the domain name (e.g., "haard.poly") with custom Polygon-themed artwork
3. **On-Chain Metadata**: All metadata and SVG are generated on-chain, no IPFS needed
4. **Transferable**: NFTs can be transferred, and the registry ownership updates accordingly

## Marketplace Integration (Optional)

If you want to deploy the marketplace for secondary sales:

```bash
forge create src/PNSMarketplace.sol:PNSMarketplace \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args $NFT $REGISTRY $USDC_ADDRESS \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --broadcast
```

## Verification

After deployment, verify everything is working:

```bash
# Check Registry owner
cast call $REGISTRY 'owner()' --rpc-url $RPC_URL

# Check if NFT contract is set on Registrar
cast call $REGISTRAR 'nftContract()' --rpc-url $RPC_URL

# Check price oracle prices
cast call $PRICE_ORACLE 'getPrice(bytes32,string,uint256)' \
  $(cast keccak "haard.poly") "haard" 1 \
  --rpc-url $RPC_URL
```

## Important Notes

- ✅ NFTs are minted automatically on domain purchase
- ✅ No separate "wrap to NFT" step needed for listing
- ✅ SVG is generated on-chain with domain name
- ✅ All metadata is on-chain (no IPFS)
- ⚠️ Make sure to set USDC token address for mainnet
- ⚠️ Adjust prices in Price Oracle as needed
- ⚠️ Test thoroughly on testnet before mainnet deployment

