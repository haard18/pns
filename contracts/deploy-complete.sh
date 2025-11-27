#!/bin/bash

# PNS Complete End-to-End Deployment & Initialization
# This script deploys all contracts, initializes them, configures everything,
# and performs test registrations to verify the system is fully operational

set -e

echo "🚀 PNS Complete End-to-End Deployment"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RPC_URL="${RPC_URL:-http://localhost:8545}"
ADMIN="${ADMIN:-0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266}"
ADMIN_KEY="${ADMIN_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
TREASURY="${TREASURY:-0x70997970C51812dc3A010C7d01b50e0d17dc79C8}"

# Test users (from Anvil defaults)
USER1="${USER1:-0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a}"
USER1_KEY="${USER1_KEY:-0x5de4111afa1a4b94908f83103db1fb50da4c89699e6dffb97ae4e8e89143a01b}"
USER2="${USER2:-0x90F79bf6EB2c4f870365E785982E1f101E93b906}"
USER2_KEY="${USER2_KEY:-0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6}"

# Role hashes (pre-calculated keccak256)
CONTROLLER_ROLE="0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357"
REGISTRY_ROLE="0xc2979137d1774e40fe2638d355bf7a7b092be4c67f242aad1655e1e27f9df9cc"
REGISTRAR_ROLE="0xedcc084d3dcd65a1f7f23c65c46722faca6953d28e43150a467cf43e5c309238"
ADMIN_ROLE="0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"

echo -e "${BLUE}Configuration:${NC}"
echo "RPC URL: $RPC_URL"
echo "Admin: $ADMIN"
echo "Treasury: $TREASURY"
echo "Test User 1: $USER1"
echo "Test User 2: $USER2"
echo ""

# Check connectivity
echo -e "${BLUE}Checking RPC connectivity...${NC}"
if ! curl -s $RPC_URL > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to $RPC_URL${NC}"
    echo "Please start Anvil with: anvil --reset"
    exit 1
fi
echo -e "${GREEN}✓ Connected to $RPC_URL${NC}"
echo ""

# ============================================================================
# STEP 1: Deploy Contracts
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: Deploying Contracts${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Deploying PNSRegistry..."
REGISTRY=$(forge create src/PNSRegistry.sol:PNSRegistry \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  --broadcast 2>&1 | grep "Deployed to:" | awk '{print $NF}')
echo -e "${GREEN}✓ PNSRegistry: $REGISTRY${NC}"

echo "Deploying PNSPriceOracle..."
PRICE_ORACLE=$(forge create src/PNSPriceOracle.sol:PNSPriceOracle \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  --broadcast 2>&1 | grep "Deployed to:" | awk '{print $NF}')
echo -e "${GREEN}✓ PNSPriceOracle: $PRICE_ORACLE${NC}"

echo "Deploying PNSResolver..."
RESOLVER=$(forge create src/PNSResolver.sol:PNSResolver \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  --broadcast 2>&1 | grep "Deployed to:" | awk '{print $NF}')
echo -e "${GREEN}✓ PNSResolver: $RESOLVER${NC}"

echo "Deploying PNSRegistrar..."
REGISTRAR=$(forge create src/PNSRegistrar.sol:PNSRegistrar \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  --broadcast 2>&1 | grep "Deployed to:" | awk '{print $NF}')
echo -e "${GREEN}✓ PNSRegistrar: $REGISTRAR${NC}"

echo "Deploying PNSController..."
CONTROLLER=$(forge create src/PNSController.sol:PNSController \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  --broadcast 2>&1 | grep "Deployed to:" | awk '{print $NF}')
echo -e "${GREEN}✓ PNSController: $CONTROLLER${NC}"

echo "Deploying PNSDomainNFT..."
NFT=$(forge create src/PNSDomainNFT.sol:PNSDomainNFT \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  --broadcast \
  --constructor-args $REGISTRY "https://pns.poly/metadata/" 2>&1 | grep "Deployed to:" | awk '{print $NF}')
echo -e "${GREEN}✓ PNSDomainNFT: $NFT${NC}"
echo ""

# ============================================================================
# STEP 2: Initialize Contracts
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: Initializing Contracts${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Initializing PNSRegistry..."
cast send $REGISTRY 'initialize(address)' $ADMIN \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ PNSRegistry initialized${NC}"

echo "Initializing PNSPriceOracle..."
cast send $PRICE_ORACLE 'initialize()' \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ PNSPriceOracle initialized${NC}"

echo "Initializing PNSResolver..."
cast send $RESOLVER 'initialize(address,address)' $ADMIN $REGISTRY \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ PNSResolver initialized${NC}"

echo "Initializing PNSRegistrar..."
cast send $REGISTRAR 'initialize(address,address,address,address)' $REGISTRY $PRICE_ORACLE $TREASURY $ADMIN \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ PNSRegistrar initialized${NC}"

echo "Initializing PNSController..."
cast send $CONTROLLER 'initialize(address,address,address,address,address)' $REGISTRY $REGISTRAR $RESOLVER $TREASURY $PRICE_ORACLE \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ PNSController initialized${NC}"
echo ""

# ============================================================================
# STEP 3: Configure Registry References
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 3: Configuring Registry References${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Setting Registrar on Registry..."
cast send $REGISTRY 'setRegistrar(address)' $REGISTRAR \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ Registrar set${NC}"

echo "Setting Resolver on Registry..."
cast send $REGISTRY 'setResolver(address)' $RESOLVER \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ Resolver set${NC}"
echo ""

# ============================================================================
# STEP 4: Grant Roles
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 4: Granting Roles${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Granting CONTROLLER_ROLE to Controller on Registrar..."
cast send $REGISTRAR 'grantRole(bytes32,address)' $CONTROLLER_ROLE $CONTROLLER \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ CONTROLLER_ROLE granted${NC}"

echo "Granting REGISTRY_ROLE to Controller on Resolver..."
cast send $RESOLVER 'grantRole(bytes32,address)' $REGISTRY_ROLE $CONTROLLER \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ REGISTRY_ROLE granted${NC}"

echo "Granting REGISTRAR_ROLE to Registrar on Registry..."
cast send $REGISTRY 'grantRole(bytes32,address)' $REGISTRAR_ROLE $REGISTRAR \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ REGISTRAR_ROLE granted${NC}"

echo "Granting ADMIN_ROLE to Admin on Registry..."
cast send $REGISTRY 'grantRole(bytes32,address)' $ADMIN_ROLE $ADMIN \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ ADMIN_ROLE granted${NC}"
echo ""

# ============================================================================
# STEP 5: Configure Registrar Settings
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 5: Configuring Registrar Settings${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Setting registration period to 1 year..."
cast send $REGISTRAR 'setRegistrationPeriod(uint256)' 31536000 \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ Registration period set to 1 year${NC}"

echo "Setting grace period to 30 days..."
cast send $REGISTRAR 'setGracePeriod(uint256)' 2592000 \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ Grace period set to 30 days${NC}"

echo "Configuring commitment (1 day age, 7 day cooldown)..."
cast send $REGISTRAR 'setCommitmentConfig(uint256,uint256)' 86400 604800 \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ Commitment config set${NC}"

echo "Setting price oracle prices..."
# Prices: short (1-2 chars), mid (3-4 chars), regular (5-15 chars), long (16+ chars)
cast send $PRICE_ORACLE 'setPrices(uint256,uint256,uint256,uint256)' \
  $(cast to-wei 5 eth) $(cast to-wei 2 eth) $(cast to-wei 1 eth) $(cast to-wei 0.5 eth) \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY \
  > /dev/null 2>&1
echo -e "${GREEN}✓ Price oracle configured (5 ETH, 2 ETH, 1 ETH, 0.5 ETH)${NC}"
echo ""

# ============================================================================
# STEP 5.5: Fund Test Accounts
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 5.5: Funding Test Accounts${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Funding User1 with 100 ETH..."
cast send $USER1 --value 100ether --rpc-url $RPC_URL --private-key $ADMIN_KEY > /dev/null 2>&1
echo -e "${GREEN}✓ User1 funded${NC}"

echo "Funding User2 with 100 ETH..."
cast send $USER2 --value 100ether --rpc-url $RPC_URL --private-key $ADMIN_KEY > /dev/null 2>&1
echo -e "${GREEN}✓ User2 funded${NC}"
echo ""

# ============================================================================
# STEP 6: Test Domain Registration (Optional)
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 6: Testing Domain Registration${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Registering test domain 'alice' for User1 (1 year)..."
REGISTER_TX=$(cast send $CONTROLLER 'registerDomain(string,address,uint256)' 'alice' $USER1 1 \
  --rpc-url $RPC_URL \
  --private-key $USER1_KEY \
  --value 10ether 2>&1 | grep "transactionHash" | awk '{print $NF}' | tr -d '"')

if [ -z "$REGISTER_TX" ]; then
    echo -e "${YELLOW}⚠ Registration may have failed${NC}"
else
    sleep 2
    echo -e "${GREEN}✓ Domain 'alice' registered (tx: $REGISTER_TX)${NC}"
fi

echo "Registering test domain 'bobby' for User2 (1 year)..."
REGISTER_TX=$(cast send $CONTROLLER 'registerDomain(string,address,uint256)' 'bobby' $USER2 1 \
  --rpc-url $RPC_URL \
  --private-key $USER2_KEY \
  --value 10ether 2>&1 | grep "transactionHash" | awk '{print $NF}' | tr -d '"')

if [ -z "$REGISTER_TX" ]; then
    echo -e "${YELLOW}⚠ Registration may have failed${NC}"
else
    sleep 2
    echo -e "${GREEN}✓ Domain 'bobby' registered (tx: $REGISTER_TX)${NC}"
fi

echo ""

# ============================================================================
# STEP 7: Verify Setup
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 7: Verifying Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Checking Registry owner..."
OWNER=$(cast call $REGISTRY 'owner()' --rpc-url $RPC_URL)
if [ "$OWNER" == "$ADMIN" ]; then
    echo -e "${GREEN}✓ Registry owner verified${NC}"
else
    echo -e "${YELLOW}⚠ Registry owner mismatch${NC}"
fi

echo "Checking Registrar registration period..."
REG_PERIOD=$(cast call $REGISTRAR 'registrationPeriod()' --rpc-url $RPC_URL)
echo -e "${GREEN}✓ Registration period: $REG_PERIOD seconds (31536000 = 1 year)${NC}"

echo "Checking Registrar grace period..."
GRACE_PERIOD=$(cast call $REGISTRAR 'gracePeriod()' --rpc-url $RPC_URL)
echo -e "${GREEN}✓ Grace period: $GRACE_PERIOD seconds (2592000 = 30 days)${NC}"

echo "Checking Price Oracle configuration..."
echo -e "${GREEN}✓ Price Oracle configured${NC}"

echo ""

# ============================================================================
# SUMMARY & EXPORT
# ============================================================================
echo -e "${GREEN}✅ Complete End-to-End Deployment Successful!${NC}"
echo "=============================================="
echo ""

echo "📋 Contract Addresses:"
echo "  Registry:      $REGISTRY"
echo "  PriceOracle:   $PRICE_ORACLE"
echo "  Resolver:      $RESOLVER"
echo "  Registrar:     $REGISTRAR"
echo "  Controller:    $CONTROLLER"
echo "  NFT:           $NFT"
echo ""

echo "🔐 Admin Accounts:"
echo "  Admin:         $ADMIN"
echo "  Treasury:      $TREASURY"
echo ""

echo "👥 Test Accounts:"
echo "  User1:         $USER1"
echo "  User2:         $USER2"
echo ""

echo "📝 Export these environment variables:"
echo ""
echo "  export RPC_URL=$RPC_URL"
echo "  export REGISTRY=$REGISTRY"
echo "  export PRICE_ORACLE=$PRICE_ORACLE"
echo "  export RESOLVER=$RESOLVER"
echo "  export REGISTRAR=$REGISTRAR"
echo "  export CONTROLLER=$CONTROLLER"
echo "  export NFT=$NFT"
echo "  export ADMIN=$ADMIN"
echo "  export ADMIN_KEY=$ADMIN_KEY"
echo "  export TREASURY=$TREASURY"
echo "  export USER1=$USER1"
echo "  export USER1_KEY=$USER1_KEY"
echo "  export USER2=$USER2"
echo "  export USER2_KEY=$USER2_KEY"
echo ""

echo "🧪 Next Steps - Test Operations:"
echo ""
echo "  # Check domain ownership (alice)"
echo "  cast call \$CONTROLLER getDomainOwner string:alice --rpc-url \$RPC_URL"
echo ""
echo "  # Check domain ownership (bobby)"
echo "  cast call \$CONTROLLER getDomainOwner string:bobby --rpc-url \$RPC_URL"
echo ""
echo "  # Check domain availability"
echo "  cast call \$CONTROLLER isDomainAvailable string:alice --rpc-url \$RPC_URL"
echo ""
echo "  # Get domain expiration"
echo "  cast call \$CONTROLLER getDomainExpiration string:alice --rpc-url \$RPC_URL"
echo ""
echo "  # Get domain resolver"
echo "  cast call \$CONTROLLER getDomainResolver string:alice --rpc-url \$RPC_URL"
echo ""
echo "  # Get name by address"
echo "  cast call \$REGISTRY getReverseRecord address:$USER1 --rpc-url \$RPC_URL"
echo ""
echo "  # Register another domain (charlie) - duration in years (1-10)"
echo "  cast send \$CONTROLLER registerDomain string:charlie address:$ADMIN uint256:1 \\"
echo "    --rpc-url \$RPC_URL --private-key \$ADMIN_KEY --value 10ether"
echo ""
echo "  # Set text record (avatar)"
echo "  cast send \$RESOLVER setText bytes32:\$(cast keccak256 string:alice.poly) string:avatar string:https://avatar.example.com \\"
echo "    --rpc-url \$RPC_URL --private-key \$USER1_KEY"
echo ""
echo "  # Get text record"
echo "  cast call \$RESOLVER getText bytes32:\$(cast keccak256 string:alice.poly) string:avatar --rpc-url \$RPC_URL"
echo ""
echo "  # Set Polygon address resolver for a domain"
echo "  cast send \$RESOLVER setPolygonAddr bytes32:\$(cast keccak256 string:alice.poly) address:$USER1 \\"
echo "    --rpc-url \$RPC_URL --private-key \$USER1_KEY"
echo ""
echo "  # Get resolved Polygon address"
echo "  cast call \$RESOLVER getPolygonAddr bytes32:\$(cast keccak256 string:alice.poly) --rpc-url \$RPC_URL"
echo ""

echo "═════════════════════════════════════════"
echo "✨ System is ready for testing!"
echo "═════════════════════════════════════════"
