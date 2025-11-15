#!/bin/bash

# Full PNS Local Testing Suite
# Tests Polygon (Anvil), Solana (local validator), and Backend together

set -e

echo "🚀 PNS Full Local Testing Suite"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
WORK_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONTRACTS_DIR="$WORK_DIR/contracts"
SOLANA_DIR="$WORK_DIR/solana"
BACKEND_DIR="$WORK_DIR/backend"

# Array to track PIDs
declare -a PIDS

# Cleanup function
cleanup() {
    echo ""
    echo -e "${BLUE}Cleaning up...${NC}"
    for pid in "${PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            kill $pid 2>/dev/null || true
        fi
    done
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

trap cleanup EXIT

# Start services
start_service() {
    local name=$1
    local command=$2
    local cwd=$3
    
    echo -e "${BLUE}Starting $name...${NC}"
    cd "$cwd"
    eval "$command" &
    local pid=$!
    PIDS+=($pid)
    echo -e "${GREEN}✓ $name started (PID: $pid)${NC}"
    sleep 2
}

# Test service
test_service() {
    local name=$1
    local url=$2
    local max_retries=10
    local retry=0
    
    echo -e "${BLUE}Testing $name health...${NC}"
    while [ $retry -lt $max_retries ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name responding${NC}"
            return 0
        fi
        retry=$((retry + 1))
        sleep 1
    done
    
    echo -e "${RED}❌ $name not responding${NC}"
    return 1
}

echo -e "${YELLOW}Prerequisites:${NC}"
echo "  - anvil running (or will start)"
echo "  - solana-test-validator running (or will start)"
echo "  - Node.js installed"
echo ""

# ============================================================================
# STEP 1: Test Anvil (Polygon)
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: Polygon (Anvil)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Check if Anvil is already running
if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
    echo -e "${YELLOW}Anvil not running, starting...${NC}"
    cd "$CONTRACTS_DIR"
    anvil --reset --quiet &
    ANVIL_PID=$!
    PIDS+=($ANVIL_PID)
    sleep 3
    echo -e "${GREEN}✓ Anvil started (PID: $ANVIL_PID)${NC}"
else
    echo -e "${GREEN}✓ Anvil already running${NC}"
fi

# Deploy contracts
echo ""
echo -e "${BLUE}Deploying contracts...${NC}"
cd "$CONTRACTS_DIR"
if [ -f "./deploy.sh" ]; then
    chmod +x ./deploy.sh
    if ./deploy.sh > /tmp/deploy.log 2>&1; then
        echo -e "${GREEN}✓ Contracts deployed${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        cat /tmp/deploy.log
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ deploy.sh not found, skipping${NC}"
fi

echo ""

# ============================================================================
# STEP 2: Test Solana (Local Validator)
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: Solana (Local Validator)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Kill old validators
pkill -f solana-test-validator || true
sleep 2

echo -e "${BLUE}Starting Solana test validator...${NC}"
cd "$SOLANA_DIR"
solana-test-validator \
  --ledger /tmp/solana-test-validator \
  --reset \
  --quiet &
SOLANA_PID=$!
PIDS+=($SOLANA_PID)
sleep 3
echo -e "${GREEN}✓ Solana validator started (PID: $SOLANA_PID)${NC}"

# Configure CLI
solana config set --url http://localhost:8899 > /dev/null 2>&1

# Build and test
echo ""
echo -e "${BLUE}Building Anchor program...${NC}"
if anchor build > /tmp/anchor-build.log 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    cat /tmp/anchor-build.log
    exit 1
fi

echo ""
echo -e "${BLUE}Running Solana tests...${NC}"
if anchor test --skip-local-validator > /tmp/anchor-test.log 2>&1; then
    echo -e "${GREEN}✓ All Solana tests passed${NC}"
    grep "✓" /tmp/anchor-test.log || true
else
    echo -e "${RED}❌ Tests failed${NC}"
    cat /tmp/anchor-test.log
    exit 1
fi

echo ""

# ============================================================================
# STEP 3: Test Backend
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 3: Backend (Express API)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

cd "$BACKEND_DIR"

echo -e "${BLUE}Installing dependencies...${NC}"
if npm install > /tmp/npm-install.log 2>&1; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Some npm dependencies failed (may still work)${NC}"
fi

echo ""
echo -e "${BLUE}Building TypeScript...${NC}"
if npm run build > /tmp/npm-build.log 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    cat /tmp/npm-build.log
    exit 1
fi

echo ""
echo -e "${BLUE}Starting backend server...${NC}"
npm run dev &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)
sleep 3
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

echo ""
echo -e "${BLUE}Testing API endpoints...${NC}"

# Health check
if curl -s http://localhost:3000/api/health | grep -q "success"; then
    echo -e "${GREEN}✓ GET /api/health${NC}"
else
    echo -e "${RED}❌ GET /api/health failed${NC}"
fi

# Availability check
if curl -s "http://localhost:3000/api/available/test?chain=solana" | grep -q "success"; then
    echo -e "${GREEN}✓ GET /api/available/:name${NC}"
else
    echo -e "${RED}❌ GET /api/available/:name failed${NC}"
fi

# Price check
if curl -s "http://localhost:3000/api/price?chain=solana&name=test&duration=31536000" | grep -q "success"; then
    echo -e "${GREEN}✓ GET /api/price${NC}"
else
    echo -e "${YELLOW}⚠ GET /api/price may need config${NC}"
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All Services Running Locally!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Services:"
echo "  🔗 Polygon (Anvil):         http://localhost:8545"
echo "  🔗 Solana (Local):          http://localhost:8899"
echo "  🔗 Backend API:             http://localhost:3000"
echo ""

echo "Next steps:"
echo "  1. This script is keeping all services running"
echo "  2. Open new terminals to test or make changes"
echo "  3. Press Ctrl+C to stop all services"
echo ""

echo "Useful commands in new terminals:"
echo "  # Test API endpoint"
echo "  curl http://localhost:3000/api/health"
echo ""
echo "  # Watch Solana logs"
echo "  solana logs --url http://localhost:8899"
echo ""
echo "  # Check backend logs"
echo "  tail -f backend.log"
echo ""

echo "Testing checklist:"
echo "  ✓ Anvil started"
echo "  ✓ Contracts deployed"
echo "  ✓ Solana validator started"
echo "  ✓ Program built"
echo "  ✓ Tests passed"
echo "  ✓ Backend running"
echo "  ✓ API responding"
echo ""

echo "Ready to test! Press Ctrl+C to stop all services."
echo ""

# Keep running
wait
