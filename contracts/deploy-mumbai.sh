#!/bin/bash
# Deploy PNS contracts to Polygon Mumbai Testnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PNS Mumbai Testnet Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration
RPC_URL="https://polygon-mumbai.g.alchemy.com/v2/demo"
CHAIN_ID=80001
PRIVATE_KEY="${PRIVATE_KEY:-9f49a7433da3ddadf30655bbce3f9be8329facbcb304895f4ad6d917a279ef85}"

# Get deployer address
DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY)
echo -e "${YELLOW}Deployer address: $DEPLOYER${NC}"

# Check balance
BALANCE=$(cast balance $DEPLOYER --rpc-url $RPC_URL)
echo -e "${YELLOW}Balance: $BALANCE wei${NC}"

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}Error: Deployer has no MATIC. Please fund the address with Mumbai testnet MATIC.${NC}"
    echo -e "${YELLOW}Get testnet MATIC from: https://faucet.polygon.technology/${NC}"
    exit 1
fi

echo -e "\n${GREEN}Step 1: Deploying PNSRegistry...${NC}"
REGISTRY=$(forge create src/PNSRegistry.sol:PNSRegistry \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy \
    | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✓ PNSRegistry deployed to: $REGISTRY${NC}"

echo -e "\n${GREEN}Step 2: Deploying PNSPriceOracle...${NC}"
PRICE_ORACLE=$(forge create src/PNSPriceOracle.sol:PNSPriceOracle \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy \
    | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✓ PNSPriceOracle deployed to: $PRICE_ORACLE${NC}"

echo -e "\n${GREEN}Step 3: Deploying PNSResolver...${NC}"
RESOLVER=$(forge create src/PNSResolver.sol:PNSResolver \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --constructor-args $REGISTRY \
    --legacy \
    | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✓ PNSResolver deployed to: $RESOLVER${NC}"

echo -e "\n${GREEN}Step 4: Deploying PNSRegistrar...${NC}"
REGISTRAR=$(forge create src/PNSRegistrar.sol:PNSRegistrar \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy \
    | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✓ PNSRegistrar deployed to: $REGISTRAR${NC}"

echo -e "\n${GREEN}Step 5: Deploying PNSController...${NC}"
CONTROLLER=$(forge create src/PNSController.sol:PNSController \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy \
    | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✓ PNSController deployed to: $CONTROLLER${NC}"

echo -e "\n${GREEN}Step 6: Deploying PNSDomainNFT...${NC}"
NFT=$(forge create src/PNSDomainNFT.sol:PNSDomainNFT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy \
    | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✓ PNSDomainNFT deployed to: $NFT${NC}"

echo -e "\n${GREEN}Initializing contracts...${NC}"

# Initialize Registry
echo -e "${YELLOW}Initializing Registry...${NC}"
cast send $REGISTRY "initialize()" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

# Initialize Registrar
echo -e "${YELLOW}Initializing Registrar...${NC}"
cast send $REGISTRAR "initialize(address,address)" $REGISTRY $PRICE_ORACLE \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

# Initialize Controller
echo -e "${YELLOW}Initializing Controller...${NC}"
cast send $CONTROLLER "initialize(address,address,address,address,address)" \
    $REGISTRY $REGISTRAR $RESOLVER $DEPLOYER $PRICE_ORACLE \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

# Initialize NFT
echo -e "${YELLOW}Initializing NFT...${NC}"
cast send $NFT "initialize(address,string,string)" $REGISTRY "Polygon Name Service" "PNS" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

echo -e "\n${GREEN}Granting roles...${NC}"

# Grant REGISTRAR_ROLE to Registrar
REGISTRAR_ROLE=$(cast call $REGISTRY "REGISTRAR_ROLE()(bytes32)" --rpc-url $RPC_URL)
cast send $REGISTRY "grantRole(bytes32,address)" $REGISTRAR_ROLE $REGISTRAR \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

# Grant REGISTRY_ROLE to Resolver
REGISTRY_ROLE=$(cast call $RESOLVER "REGISTRY_ROLE()(bytes32)" --rpc-url $RPC_URL)
cast send $RESOLVER "grantRole(bytes32,address)" $REGISTRY_ROLE $REGISTRY \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Contract Addresses:${NC}"
echo -e "Registry:     $REGISTRY"
echo -e "Controller:   $CONTROLLER"
echo -e "Registrar:    $REGISTRAR"
echo -e "Resolver:     $RESOLVER"
echo -e "PriceOracle:  $PRICE_ORACLE"
echo -e "NFT:          $NFT"

# Save to file
cat > deployment-mumbai.json <<EOF
{
  "network": "mumbai",
  "chainId": 80001,
  "deployer": "$DEPLOYER",
  "contracts": {
    "registry": "$REGISTRY",
    "controller": "$CONTROLLER",
    "registrar": "$REGISTRAR",
    "resolver": "$RESOLVER",
    "priceOracle": "$PRICE_ORACLE",
    "nft": "$NFT"
  }
}
EOF

echo -e "\n${GREEN}✓ Deployment info saved to deployment-mumbai.json${NC}"
