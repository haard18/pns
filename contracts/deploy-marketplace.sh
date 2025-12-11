#!/bin/bash

# PNS Marketplace Deployment Script
# This script deploys the PNSMarketplace contract to Polygon

set -e

echo "================================"
echo "PNS Marketplace Deployment"
echo "================================"

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found!"
    echo "Please create a .env file with the following variables:"
    echo "  PRIVATE_KEY=<your-private-key>"
    echo "  POLYGON_RPC_URL=<polygon-rpc-url>"
    echo "  POLYGONSCAN_API_KEY=<polygonscan-api-key> (optional, for verification)"
    echo ""
    echo "Optional variables:"
    echo "  PNS_NFT_ADDRESS=<deployed-nft-contract-address> (can be added after first deployment)"
    echo "  USDC_TOKEN_ADDRESS=<usdc-token-address> (defaults to Polygon mainnet USDC)"
    echo "  FEE_RECIPIENT=<fee-recipient-address> (defaults to deployer)"
    echo "  PNS_ADMIN=<admin-address> (defaults to deployer)"
    exit 1
fi

# Validate required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set in .env"
    exit 1
fi

# Support both RPC_URL and POLYGON_RPC_URL
if [ -z "$RPC_URL" ] && [ -z "$POLYGON_RPC_URL" ]; then
    echo "Error: RPC_URL or POLYGON_RPC_URL not set in .env"
    exit 1
fi

# Use RPC_URL if set, otherwise use POLYGON_RPC_URL
RPC_URL=${RPC_URL:-$POLYGON_RPC_URL}

# Auto-detect NFT address from existing .env variables
if [ -z "$PNS_NFT_ADDRESS" ]; then
    # Try NFT variable (used in existing .env)
    if [ -n "$NFT" ]; then
        PNS_NFT_ADDRESS=$NFT
        echo "Using NFT address from .env: $PNS_NFT_ADDRESS"
    else
        echo ""
        echo "╔════════════════════════════════════════════════════════════════╗"
        echo "║  NFT address not found in .env file                           ║"
        echo "╚════════════════════════════════════════════════════════════════╝"
        echo ""
        echo "Please add your deployed PNS NFT contract address to .env:"
        echo ""
        echo "  NFT=0xYourNFTContractAddress"
        echo "  or"
        echo "  PNS_NFT_ADDRESS=0xYourNFTContractAddress"
        echo ""
        echo "Current .env has these contract addresses:"
        [ -n "$REGISTRY" ] && echo "  REGISTRY=$REGISTRY"
        [ -n "$CONTROLLER" ] && echo "  CONTROLLER=$CONTROLLER"
        [ -n "$NFT" ] && echo "  NFT=$NFT"
        echo ""
        exit 1
    fi
fi

# Set defaults
USDC_TOKEN_ADDRESS=${USDC:-${USDC_TOKEN_ADDRESS:-"0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"}}
FEE_RECIPIENT=${FEE_RECIPIENT:-${PNS_TREASURY:-${PNS_ADMIN}}}
NETWORK=${NETWORK:-"polygon"}

echo ""
echo "Configuration:"
echo "  Network: $NETWORK"
echo "  RPC URL: $RPC_URL"
echo "  PNS NFT Address: $PNS_NFT_ADDRESS"
echo "  USDC Token: $USDC_TOKEN_ADDRESS"
echo "  Fee Recipient: ${FEE_RECIPIENT:-'deployer address'}"
echo ""

read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "Starting deployment..."
echo ""

# Deploy the marketplace
forge script script/DeployMarketplace.s.sol:DeployMarketplace \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    ${POLYGONSCAN_API_KEY:+--verify --etherscan-api-key $POLYGONSCAN_API_KEY} \
    -vvvv

echo ""
echo "================================"
echo "  DEPLOYMENT COMPLETED!"
echo "================================"
echo ""
echo "✓ PNS Marketplace has been deployed successfully!"
echo ""
echo "IMPORTANT: Check the output above for the marketplace address."
echo "It will look like: 'Address: 0x...'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 📝 ADD TO .ENV FILE:"
echo "   Copy the marketplace address from above and add to .env:"
echo "   MARKETPLACE=0x..."
echo ""
echo "2. 🔗 SET MARKETPLACE IN NFT CONTRACT (if skipped):"
echo "   Run: ./set-marketplace.sh"
echo ""
echo "3. 🎨 UPDATE FRONTEND:"
echo "   Add marketplace address to your frontend config"
echo ""
echo "4. 🔍 UPDATE BACKEND INDEXER:"
echo "   Add marketplace event listeners"
echo ""
echo "5. ✅ TEST:"
echo "   Try listing and buying a domain"
echo ""
