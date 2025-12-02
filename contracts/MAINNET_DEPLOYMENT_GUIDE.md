# PNS (Polygon Naming Service) - Mainnet Deployment Guide

## Contract Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  PNSController                                                                       │
│  └── User-facing interface for registrations, renewals, batch operations             │
└────────────────────┬────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   LOGIC LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  PNSRegistrar                     PNSResolver                    PNSPriceOracle     │
│  └── Registration/renewal         └── Name resolution           └── Pricing logic    │
│      logic, auctions                  addresses, text records                        │
└────────────────────┬────────────────────┬────────────────────────────────────────────┘
                     │                    │
                     ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  PNSRegistry                                                PNSDomainNFT            │
│  └── Central registry for domain ownership,                 └── ERC721 NFT for      │
│      expiration, subdomains, reverse records                    domain trading       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Contract Dependencies

### 1. PNSRegistry (Core - Deploy First)
- **Dependencies**: None
- **Initializer**: `initialize(address admin)`
- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Can grant/revoke roles
  - `ADMIN_ROLE`: Can pause, set Solana pointers, upgrade
  - `REGISTRAR_ROLE`: Can register/renew/expire names
  - `RESOLVER_ROLE`: Can bump record versions

### 2. PNSPriceOracle (Independent - Deploy Second)
- **Dependencies**: None
- **Initializer**: `initialize()`
- **Owner**: Deployer (for price updates)
- **Pricing Tiers**:
  - 1-3 chars: 50 MATIC/year
  - 4 chars: 10 MATIC/year  
  - 5-6 chars: 2 MATIC/year
  - 7+ chars: 0.5 MATIC/year

### 3. PNSResolver (Needs Registry)
- **Dependencies**: PNSRegistry
- **Initializer**: `initialize(address admin, address registryAddress)`
- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Can add coin types, upgrade
  - `REGISTRY_ROLE`: Registry can modify records on behalf of owners

### 4. PNSDomainNFT (Needs Registry)
- **Dependencies**: PNSRegistry
- **Constructor**: `constructor(address registryAddress, string memory newBaseURI)`
- **Owner**: Deployer (for minting, burning, freezing)

### 5. PNSRegistrar (Needs Registry + PriceOracle)
- **Dependencies**: PNSRegistry, PNSPriceOracle
- **Initializer**: `initialize(address registry, address priceOracle, address treasury, address admin)`
- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Full admin
  - `ADMIN_ROLE`: Config changes
  - `CONTROLLER_ROLE`: Can register on behalf of users

### 6. PNSController (Needs All - Deploy Last)
- **Dependencies**: PNSRegistry, PNSRegistrar, PNSResolver, PNSPriceOracle
- **Initializer**: `initialize(registry, registrar, resolver, feeRecipient, priceOracle)`
- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Full admin
  - `ADMIN_ROLE`: Config changes, emergency functions

## Role Configuration After Deployment

```
Registry:
├── Grant REGISTRAR_ROLE to → Registrar
└── Grant RESOLVER_ROLE to → Resolver

Resolver:
└── Grant REGISTRY_ROLE to → Registry

Registrar:
└── Grant CONTROLLER_ROLE to → Controller
```

---

## Environment Setup

### .env File
```bash
# RPC & Keys
RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0x...your_private_key...
POLYGONSCAN_API_KEY=YOUR_POLYGONSCAN_KEY

# Deployment Addresses
PNS_ADMIN=0x...your_admin_address...
PNS_TREASURY=0x...your_treasury_address...
NFT_BASE_URI=https://api.yoursite.com/metadata/
```

### Load Environment
```bash
cd /Users/hardy/Developer/scalper/nameservice/contracts
source .env
```

---

## Mainnet Deployment Commands

### Step 1: Deploy All Contracts
```bash
forge script script/DeployPNS.s.sol:DeployPNS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  -vvvv
```

### Step 2: Manual Deployment (Individual Contracts)
If you prefer deploying contracts individually:

```bash
# Deploy Registry
forge create src/PNSRegistry.sol:PNSRegistry \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify --etherscan-api-key $POLYGONSCAN_API_KEY

# Initialize Registry (replace REGISTRY_ADDRESS)
cast send $REGISTRY "initialize(address)" $PNS_ADMIN \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy PriceOracle
forge create src/PNSPriceOracle.sol:PNSPriceOracle \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify --etherscan-api-key $POLYGONSCAN_API_KEY

# Initialize PriceOracle
cast send $PRICE_ORACLE "initialize()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy Resolver
forge create src/PNSResolver.sol:PNSResolver \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify --etherscan-api-key $POLYGONSCAN_API_KEY

# Initialize Resolver
cast send $RESOLVER "initialize(address,address)" $PNS_ADMIN $REGISTRY \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy NFT
forge create src/PNSDomainNFT.sol:PNSDomainNFT \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args $REGISTRY $NFT_BASE_URI \
  --verify --etherscan-api-key $POLYGONSCAN_API_KEY

# Deploy Registrar
forge create src/PNSRegistrar.sol:PNSRegistrar \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify --etherscan-api-key $POLYGONSCAN_API_KEY

# Initialize Registrar
cast send $REGISTRAR "initialize(address,address,address,address)" \
  $REGISTRY $PRICE_ORACLE $PNS_TREASURY $PNS_ADMIN \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy Controller
forge create src/PNSController.sol:PNSController \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify --etherscan-api-key $POLYGONSCAN_API_KEY

# Initialize Controller
cast send $CONTROLLER "initialize(address,address,address,address,address)" \
  $REGISTRY $REGISTRAR $RESOLVER $PNS_ADMIN $PRICE_ORACLE \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Step 3: Configure Roles
```bash
# Grant REGISTRAR_ROLE to Registrar in Registry
REGISTRAR_ROLE=$(cast keccak "REGISTRAR_ROLE")
cast send $REGISTRY "grantRole(bytes32,address)" $REGISTRAR_ROLE $REGISTRAR \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Grant RESOLVER_ROLE to Resolver in Registry  
RESOLVER_ROLE=$(cast keccak "RESOLVER_ROLE")
cast send $REGISTRY "grantRole(bytes32,address)" $RESOLVER_ROLE $RESOLVER \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Grant REGISTRY_ROLE to Registry in Resolver
REGISTRY_ROLE=$(cast keccak "REGISTRY_ROLE")
cast send $RESOLVER "grantRole(bytes32,address)" $REGISTRY_ROLE $REGISTRY \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Grant CONTROLLER_ROLE to Controller in Registrar
cast send $REGISTRAR "setController(address)" $CONTROLLER \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## Manual Transaction Commands (Using Cast)

### Domain Registration

#### 1. Check Domain Availability
```bash
# Calculate namehash for "example.poly"
NAME="example"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")
echo "Namehash: $NAMEHASH"

# Check if domain exists
cast call $REGISTRY "exists(bytes32)" $NAMEHASH --rpc-url $RPC_URL

# Check if available through controller
cast call $CONTROLLER "isDomainAvailable(string)" $NAME --rpc-url $RPC_URL
```

#### 2. Get Registration Price
```bash
# Get price for 1 year
NAME="example"
YEARS=1
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")
PRICE=$(cast call $PRICE_ORACLE "getPrice(bytes32,string,uint256)" $NAMEHASH $NAME $YEARS --rpc-url $RPC_URL)
echo "Price in wei: $PRICE"
echo "Price in MATIC: $(cast --from-wei $PRICE)"
```

#### 3. Register Domain (Simple)
```bash
NAME="myname"
OWNER="0xYourAddress"
DURATION=1  # years
PRICE="500000000000000000"  # 0.5 MATIC (adjust based on getPrice)

cast send $CONTROLLER "registerDomain(string,address,uint256)" \
  $NAME $OWNER $DURATION \
  --value $PRICE \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### 4. Register Domain with Address Resolution
```bash
NAME="myname"
OWNER="0xYourAddress"
DURATION=1
RESOLVE_ADDR="0xAddressToResolve"
PRICE="500000000000000000"

cast send $CONTROLLER "registerWithAddress(string,address,uint256,address)" \
  $NAME $OWNER $DURATION $RESOLVE_ADDR \
  --value $PRICE \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### 5. Register with Full Metadata
```bash
NAME="myname"
OWNER="0xYourAddress"
DURATION=1
RESOLVE_ADDR="0xAddressToResolve"
AVATAR="https://example.com/avatar.png"
WEBSITE="https://mywebsite.com"
EMAIL="contact@mywebsite.com"
PRICE="500000000000000000"

cast send $CONTROLLER \
  "registerWithMetadata(string,address,uint256,address,string,string,string)" \
  $NAME $OWNER $DURATION $RESOLVE_ADDR $AVATAR $WEBSITE $EMAIL \
  --value $PRICE \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Domain Renewal

```bash
NAME="myname"
DURATION=1  # years to extend
PRICE="500000000000000000"

# Via Controller
cast send $CONTROLLER "renewDomain(string,uint256)" \
  $NAME $DURATION \
  --value $PRICE \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Or directly via Registrar (owner only)
cast send $REGISTRAR "renew(string,uint256)" \
  $NAME $DURATION \
  --value $PRICE \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Domain Transfer

```bash
NAME="myname"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")
NEW_OWNER="0xNewOwnerAddress"

# Transfer ownership (must be current owner)
cast send $REGISTRY "transferName(bytes32,address)" \
  $NAMEHASH $NEW_OWNER \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Name Resolution

#### Resolve Name to Address
```bash
NAME="example"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")

# Get Polygon address (coin type 966)
cast call $RESOLVER "getAddr(bytes32,uint256)" $NAMEHASH 966 --rpc-url $RPC_URL

# Get ETH address (coin type 60)
cast call $RESOLVER "getAddr(bytes32,uint256)" $NAMEHASH 60 --rpc-url $RPC_URL

# Convenience: Get Polygon address directly
cast call $RESOLVER "getPolygonAddr(bytes32)" $NAMEHASH --rpc-url $RPC_URL
```

#### Set Address Resolution
```bash
NAME="myname"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")
ADDRESS="0xTargetAddress"

# Set Polygon address (must be domain owner)
cast send $RESOLVER "setPolygonAddr(bytes32,address)" \
  $NAMEHASH $ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Set ETH address
cast send $RESOLVER "setAddr(bytes32,uint256,address)" \
  $NAMEHASH 60 $ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Reverse Resolution (Address → Name)

#### Set Reverse Record
```bash
NAME="myname"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")

# Set your address to resolve to this name (must be domain owner)
cast send $REGISTRY "setReverseRecord(bytes32)" \
  $NAMEHASH \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Get Reverse Record
```bash
ADDRESS="0xYourAddress"
cast call $REGISTRY "getReverseRecord(address)" $ADDRESS --rpc-url $RPC_URL
```

### Text Records (ENS-style)

#### Set Text Record
```bash
NAME="myname"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")

# Set avatar
cast send $RESOLVER "setText(bytes32,string,string)" \
  $NAMEHASH "avatar" "https://example.com/avatar.png" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Set website
cast send $RESOLVER "setText(bytes32,string,string)" \
  $NAMEHASH "url" "https://mywebsite.com" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Set email
cast send $RESOLVER "setText(bytes32,string,string)" \
  $NAMEHASH "email" "contact@example.com" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Set description
cast send $RESOLVER "setText(bytes32,string,string)" \
  $NAMEHASH "description" "My awesome domain" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Set Twitter handle
cast send $RESOLVER "setText(bytes32,string,string)" \
  $NAMEHASH "com.twitter" "@myhandle" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Set Multiple Text Records
```bash
NAME="myname"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")

cast send $RESOLVER \
  "setMultipleTextRecords(bytes32,string[],string[])" \
  $NAMEHASH \
  '["avatar","url","email"]' \
  '["https://example.com/avatar.png","https://mywebsite.com","me@example.com"]' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Get Text Record
```bash
NAME="example"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")

cast call $RESOLVER "getText(bytes32,string)" $NAMEHASH "avatar" --rpc-url $RPC_URL
cast call $RESOLVER "getText(bytes32,string)" $NAMEHASH "url" --rpc-url $RPC_URL
cast call $RESOLVER "getText(bytes32,string)" $NAMEHASH "email" --rpc-url $RPC_URL
```

### Content Hash (IPFS/Arweave)

#### Set Content Hash
```bash
NAME="myname"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")
# IPFS CIDv1 in binary format (example)
CONTENT_HASH="0xe3010170122029f2d17be6139079dc48696d1f582a8530eb9805b561eda517e22a892c7e3f1f"

cast send $RESOLVER "setContentHash(bytes32,bytes)" \
  $NAMEHASH $CONTENT_HASH \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Get Content Hash
```bash
NAME="example"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")

cast call $RESOLVER "getContentHash(bytes32)" $NAMEHASH --rpc-url $RPC_URL
```

### Subdomains

#### Create Subdomain
```bash
PARENT_NAME="myname"
PARENT_HASH=$(cast keccak "$(echo -n "${PARENT_NAME}.poly")")
SUBDOMAIN_LABEL=$(cast keccak "sub")  # for "sub.myname.poly"
SUBDOMAIN_OWNER="0xSubdomainOwner"

cast send $REGISTRY "createSubdomain(bytes32,bytes32,address)" \
  $PARENT_HASH $SUBDOMAIN_LABEL $SUBDOMAIN_OWNER \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Get Subdomain Owner
```bash
cast call $REGISTRY "getSubdomainOwner(bytes32,bytes32)" \
  $PARENT_HASH $SUBDOMAIN_LABEL \
  --rpc-url $RPC_URL
```

#### Transfer Subdomain
```bash
NEW_OWNER="0xNewSubdomainOwner"

cast send $REGISTRY "transferSubdomain(bytes32,bytes32,address)" \
  $PARENT_HASH $SUBDOMAIN_LABEL $NEW_OWNER \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### NFT Operations

#### Mint Domain NFT
```bash
NAME="myname"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")
OWNER="0xNFTOwner"

# Only NFT contract owner can mint
cast send $NFT "mintDomain(string,bytes32,address)" \
  $NAME $NAMEHASH $OWNER \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Get Token ID for Domain
```bash
NAME="myname"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")

cast call $NFT "getTokenId(bytes32)" $NAMEHASH --rpc-url $RPC_URL
```

#### Transfer NFT
```bash
TOKEN_ID=1
FROM="0xCurrentOwner"
TO="0xNewOwner"

cast send $NFT "transferFrom(address,address,uint256)" \
  $FROM $TO $TOKEN_ID \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Query Functions

#### Get Domain Info
```bash
NAME="example"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")

# Get full name record
cast call $REGISTRY "getNameRecord(bytes32)" $NAMEHASH --rpc-url $RPC_URL

# Get owner
cast call $CONTROLLER "getDomainOwner(string)" $NAME --rpc-url $RPC_URL

# Get expiration
cast call $CONTROLLER "getDomainExpiration(string)" $NAME --rpc-url $RPC_URL

# Check if valid (exists and not expired)
cast call $REGISTRY "isValid(bytes32)" $NAMEHASH --rpc-url $RPC_URL

# Check if expired
cast call $REGISTRY "isExpired(bytes32)" $NAMEHASH --rpc-url $RPC_URL
```

#### Get Resolver
```bash
NAME="example"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")

cast call $REGISTRY "getResolver(bytes32)" $NAMEHASH --rpc-url $RPC_URL
```

### Admin Operations

#### Update Prices (Oracle Owner)
```bash
SHORT_PRICE="50000000000000000000"   # 50 MATIC
MID_PRICE="10000000000000000000"     # 10 MATIC  
REGULAR_PRICE="2000000000000000000"  # 2 MATIC
LONG_PRICE="500000000000000000"      # 0.5 MATIC

cast send $PRICE_ORACLE "setPrices(uint256,uint256,uint256,uint256)" \
  $SHORT_PRICE $MID_PRICE $REGULAR_PRICE $LONG_PRICE \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Set Premium Price for Specific Domain
```bash
NAME="bitcoin"
NAMEHASH=$(cast keccak "$(echo -n "${NAME}.poly")")
PREMIUM_PRICE="1000000000000000000000"  # 1000 MATIC per year

cast send $PRICE_ORACLE "setPremiumPrice(bytes32,uint256)" \
  $NAMEHASH $PREMIUM_PRICE \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Pause/Unpause Controller
```bash
# Pause
cast send $CONTROLLER "setPaused(bool)" true \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Unpause
cast send $CONTROLLER "setPaused(bool)" false \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Emergency Withdraw
```bash
cast send $CONTROLLER "emergencyWithdraw()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## Verification Commands

### Verify Contract on Polygonscan
```bash
forge verify-contract $REGISTRY \
  src/PNSRegistry.sol:PNSRegistry \
  --chain polygon \
  --etherscan-api-key $POLYGONSCAN_API_KEY

forge verify-contract $PRICE_ORACLE \
  src/PNSPriceOracle.sol:PNSPriceOracle \
  --chain polygon \
  --etherscan-api-key $POLYGONSCAN_API_KEY

forge verify-contract $RESOLVER \
  src/PNSResolver.sol:PNSResolver \
  --chain polygon \
  --etherscan-api-key $POLYGONSCAN_API_KEY

forge verify-contract $REGISTRAR \
  src/PNSRegistrar.sol:PNSRegistrar \
  --chain polygon \
  --etherscan-api-key $POLYGONSCAN_API_KEY

forge verify-contract $CONTROLLER \
  src/PNSController.sol:PNSController \
  --chain polygon \
  --etherscan-api-key $POLYGONSCAN_API_KEY

forge verify-contract $NFT \
  src/PNSDomainNFT.sol:PNSDomainNFT \
  --chain polygon \
  --constructor-args $(cast abi-encode "constructor(address,string)" $REGISTRY $NFT_BASE_URI) \
  --etherscan-api-key $POLYGONSCAN_API_KEY
```

---

## Namehash Helper Script

Create a helper script for calculating namehashes:

```bash
#!/bin/bash
# namehash.sh - Calculate PNS namehash

if [ -z "$1" ]; then
  echo "Usage: ./namehash.sh <name>"
  echo "Example: ./namehash.sh myname"
  exit 1
fi

NAME=$1
FULL_NAME="${NAME}.poly"
NAMEHASH=$(cast keccak "$(echo -n "$FULL_NAME")")

echo "Name: $NAME"
echo "Full name: $FULL_NAME"
echo "Namehash: $NAMEHASH"
```

---

## Common Coin Types Reference

| Coin Type | Symbol | Network |
|-----------|--------|---------|
| 60 | ETH | Ethereum |
| 966 | MATIC | Polygon |
| 501 | SOL | Solana |
| 0 | BTC | Bitcoin |
| 2 | LTC | Litecoin |
| 56 | BNB | BSC |

---

## Troubleshooting

### "Name already registered" Error
The domain is already taken. Check availability first:
```bash
cast call $CONTROLLER "isDomainAvailable(string)" "yourname" --rpc-url $RPC_URL
```

### "Insufficient payment" Error
Check the current price:
```bash
cast call $PRICE_ORACLE "getPrice(bytes32,string,uint256)" $NAMEHASH "yourname" 1 --rpc-url $RPC_URL
```

### "Not name owner" Error
You're trying to modify a domain you don't own. Check owner:
```bash
cast call $CONTROLLER "getDomainOwner(string)" "thename" --rpc-url $RPC_URL
```

### "Name expired" Error
The domain has expired. It may be in grace period or available for re-registration.

---

## Current Mainnet Deployment (From .env)

```
REGISTRY=0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38
PRICE_ORACLE=0xBF7E19638ddd7c7D312aE06a387d5F838c4a8C73
RESOLVER=0x4f15efcE62cE45c402408015A34CD7c3a43fAC07
REGISTRAR=0x1E4461AB41652Ac9d84FA215c4AD443857e10c95
CONTROLLER=0x72673ECA8BC86c6fe65221Bf90ea68A1A529A2a7
NFT=0x889F312473288c6F8D3f57F563D0bcA7D8789Acf
```
