#!/bin/bash
# Deploy PNS contracts to Polygon Amoy Testnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PNS Amoy Testnet Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration
RPC_URL="https://polygon-amoy.infura.io/v3/62ea68f978fa4aa89c251a5778254b1b"
CHAIN_ID=80002
PRIVATE_KEY="${PRIVATE_KEY:-9f49a7433da3ddadf30655bbce3f9be8329facbcb304895f4ad6d917a279ef85}"

# Get deployer address
DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY)
echo -e "${YELLOW}Deployer address: $DEPLOYER${NC}"

# Check balance
BALANCE=$(cast balance $DEPLOYER --rpc-url $RPC_URL)
echo -e "${YELLOW}Balance: $BALANCE wei${NC}"

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}Error: Deployer has no MATIC. Please fund the address with Amoy testnet MATIC.${NC}"
    echo -e "${YELLOW}Get testnet MATIC from: https://faucet.polygon.technology/${NC}"
    exit 1
fi

# Function to deploy and extract address
deploy_contract() {
    local contract_path=$1
    local args=$2
    local name=$3
    
    echo -e "\n${GREEN}Deploying $name...${NC}"
    
    # Construct command
    CMD="forge create $contract_path --rpc-url $RPC_URL --private-key $PRIVATE_KEY --legacy --broadcast"
    if [ ! -z "$args" ]; then
        CMD="$CMD --constructor-args $args"
    fi
    
    # Execute and capture output
    OUTPUT=$(eval $CMD)
    ADDRESS=$(echo "$OUTPUT" | grep "Deployed to:" | awk '{print $3}')
    
    if [ -z "$ADDRESS" ]; then
        echo -e "${RED}Failed to deploy $name${NC}"
        echo "$OUTPUT"
        exit 1
    fi
    
    echo -e "${GREEN}✓ $name deployed to: $ADDRESS${NC}"
    echo "$ADDRESS"
}

# Deploy contracts
REGISTRY=$(deploy_contract "src/PNSRegistry.sol:PNSRegistry" "" "PNSRegistry")
PRICE_ORACLE=$(deploy_contract "src/PNSPriceOracle.sol:PNSPriceOracle" "" "PNSPriceOracle")
RESOLVER=$(deploy_contract "src/PNSResolver.sol:PNSResolver" "$REGISTRY" "PNSResolver")
REGISTRAR=$(deploy_contract "src/PNSRegistrar.sol:PNSRegistrar" "" "PNSRegistrar")
CONTROLLER=$(deploy_contract "src/PNSController.sol:PNSController" "" "PNSController")
NFT=$(deploy_contract "src/PNSDomainNFT.sol:PNSDomainNFT" "$REGISTRY \"https://api.pns.link/metadata/\"" "PNSDomainNFT")

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
cat > deployment-amoy.json <<EOF
{
  "network": "amoy",
  "chainId": 80002,
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

echo -e "\n${GREEN}✓ Deployment info saved to deployment-amoy.json${NC}"
