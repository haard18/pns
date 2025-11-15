#!/bin/bash

# PNS Solana Local Testing - Quick Start Script
# Run this script to test the entire Solana program locally

set -e

echo "🚀 PNS Solana Local Testing Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not installed${NC}"
    echo "Install from: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI not installed${NC}"
    echo "Install with: cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked"
    exit 1
fi

if ! command -v rustc &> /dev/null; then
    echo -e "${RED}❌ Rust not installed${NC}"
    echo "Install from: https://rustup.rs/"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"
echo ""

# Change to solana directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SOLANA_DIR="$SCRIPT_DIR/solana"

if [ ! -d "$SOLANA_DIR" ]; then
    echo -e "${RED}❌ Solana directory not found at $SOLANA_DIR${NC}"
    exit 1
fi

cd "$SOLANA_DIR"
echo -e "${GREEN}✓ In solana directory${NC}"
echo ""

# Step 1: Kill existing validators
echo -e "${BLUE}Step 1: Cleaning up old validators...${NC}"
pkill -f solana-test-validator || true
sleep 2
echo -e "${GREEN}✓ Old validators killed${NC}"
echo ""

# Step 2: Start validator
echo -e "${BLUE}Step 2: Starting local Solana validator...${NC}"
echo "   Validator running on: http://localhost:8899"
echo "   Ledger: /tmp/solana-test-validator"
echo ""

solana-test-validator \
  --ledger /tmp/solana-test-validator \
  --reset \
  --quiet &

VALIDATOR_PID=$!
sleep 3

# Verify validator started
if ! kill -0 $VALIDATOR_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start validator${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Validator started (PID: $VALIDATOR_PID)${NC}"
echo ""

# Step 3: Configure Solana CLI
echo -e "${BLUE}Step 3: Configuring Solana CLI...${NC}"
solana config set --url http://localhost:8899 > /dev/null 2>&1
echo -e "${GREEN}✓ Configured${NC}"
echo ""

# Step 4: Check balance
echo -e "${BLUE}Step 4: Checking account balance...${NC}"
BALANCE=$(solana balance 2>/dev/null || echo "0")
echo "   Balance: $BALANCE SOL"
echo -e "${GREEN}✓ Account ready${NC}"
echo ""

# Step 5: Build program
echo -e "${BLUE}Step 5: Building Anchor program...${NC}"
if ! anchor build 2>&1 | tail -5; then
    echo -e "${RED}❌ Build failed${NC}"
    kill $VALIDATOR_PID
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Step 6: Run tests
echo -e "${BLUE}Step 6: Running test suite...${NC}"
echo ""

if anchor test --skip-local-validator; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Tests failed${NC}"
    echo ""
    echo "To debug, run in another terminal:"
    echo "  solana logs --url http://localhost:8899"
    echo ""
    read -p "Keep validator running for debugging? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        kill $VALIDATOR_PID
        exit 1
    fi
fi

echo ""
echo "=================================="
echo -e "${GREEN}✨ Local Testing Complete!${NC}"
echo "=================================="
echo ""
echo "Program ID: 5kD5m3gyXcYeGKn9LK4heqzZJCKXtZSHnKgWnQ9sEN36"
echo "Validator:  http://localhost:8899"
echo "Ledger:     /tmp/solana-test-validator"
echo ""
echo "Next steps:"
echo "  1. Keep this validator running"
echo "  2. Open another terminal and start the backend:"
echo "     cd backend && npm install && npm run dev"
echo "  3. Test API endpoints:"
echo "     curl http://localhost:3000/api/health"
echo ""
echo "To stop validator: kill $VALIDATOR_PID"
echo "Or press Ctrl+C here"
echo ""

# Keep running until interrupted
wait $VALIDATOR_PID
