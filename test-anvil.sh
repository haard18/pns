#!/bin/bash

# PNS Complete Anvil Testing Script
# Tests the full architecture: Contracts + Frontend + Backend + Event Indexing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ANVIL_RPC_URL="http://127.0.0.1:8545"
ANVIL_CHAIN_ID="31337"
ADMIN_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded732d4dff72ef700a0a0"
ADMIN_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
USER_PRIVATE_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
USER_ADDRESS="0x70997970C51812e339D9B73b0245ad59419F44Be"

# Contract addresses (will be populated after deployment)
REGISTRY_ADDRESS=""
REGISTRAR_ADDRESS=""
CONTROLLER_ADDRESS=""
RESOLVER_ADDRESS=""
PRICE_ORACLE_ADDRESS=""
DOMAIN_NFT_ADDRESS=""

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

cyan() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')] $1${NC}"
}

print_banner() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                     PNS Complete Anvil Testing                              ║"
    echo "║                                                                              ║"
    echo "║  Tests: Smart Contracts + Frontend + Backend + Event Indexing              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
}

check_anvil() {
    info "Checking if Anvil is running..."
    
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        $ANVIL_RPC_URL > /dev/null; then
        log "Anvil is running ✓"
    else
        error "Anvil is not running. Start it with: anvil --host 0.0.0.0 --port 8545"
    fi
}

start_anvil_if_needed() {
    if ! curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        $ANVIL_RPC_URL > /dev/null; then
        
        warn "Starting Anvil..."
        anvil --host 0.0.0.0 --port 8545 --accounts 10 --balance 10000 &
        ANVIL_PID=$!
        sleep 3
        
        if ! curl -s -X POST -H "Content-Type: application/json" \
            --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
            $ANVIL_RPC_URL > /dev/null; then
            error "Failed to start Anvil"
        fi
        
        log "Anvil started with PID: $ANVIL_PID"
        echo $ANVIL_PID > .anvil.pid
    else
        log "Anvil already running ✓"
    fi
}

deploy_contracts() {
    log "Deploying PNS contracts to Anvil..."
    
    cd contracts
    
    # Clean previous builds
    forge clean
    
    # Build contracts
    info "Building contracts..."
    forge build
    
    if [ $? -ne 0 ]; then
        error "Contract compilation failed"
    fi
    
    # Deploy using the deployment script
    info "Running deployment script..."
    
    # Create a temporary deployment script for Anvil
    cat > script/DeployAnvil.s.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { PNSRegistry } from "../src/PNSRegistry.sol";
import { PNSRegistrar } from "../src/PNSRegistrar.sol";
import { PNSController } from "../src/PNSController.sol";
import { PNSResolver } from "../src/PNSResolver.sol";
import { PNSPriceOracle } from "../src/PNSPriceOracle.sol";
import { PNSDomainNFT } from "../src/PNSDomainNFT.sol";

contract DeployAnvil is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Registry
        PNSRegistry registry = new PNSRegistry();
        registry.initialize(deployer);
        console.log("PNSRegistry deployed at:", address(registry));
        
        // Deploy Price Oracle
        PNSPriceOracle priceOracle = new PNSPriceOracle();
        priceOracle.initialize(deployer, 0.01 ether); // 0.01 MATIC base price
        console.log("PNSPriceOracle deployed at:", address(priceOracle));
        
        // Deploy Resolver
        PNSResolver resolver = new PNSResolver();
        resolver.initialize(address(registry));
        console.log("PNSResolver deployed at:", address(resolver));
        
        // Deploy Domain NFT
        PNSDomainNFT domainNFT = new PNSDomainNFT();
        domainNFT.initialize("Polygon Name Service", "PNS", deployer);
        console.log("PNSDomainNFT deployed at:", address(domainNFT));
        
        // Deploy Registrar
        PNSRegistrar registrar = new PNSRegistrar();
        registrar.initialize(
            address(registry),
            address(priceOracle),
            address(domainNFT),
            deployer
        );
        console.log("PNSRegistrar deployed at:", address(registrar));
        
        // Deploy Controller
        PNSController controller = new PNSController();
        controller.initialize(
            address(registry),
            address(registrar),
            address(resolver),
            address(priceOracle),
            deployer
        );
        console.log("PNSController deployed at:", address(controller));
        
        // Set up roles and permissions
        registry.grantRole(registry.REGISTRAR_ROLE(), address(registrar));
        registry.grantRole(registry.RESOLVER_ROLE(), address(resolver));
        
        // Grant controller access to registrar
        registrar.grantRole(registrar.CONTROLLER_ROLE(), address(controller));
        
        console.log("All contracts deployed and configured!");
        
        vm.stopBroadcast();
    }
}
EOF
    
    # Set environment for deployment
    export PRIVATE_KEY=$ADMIN_PRIVATE_KEY
    
    # Deploy contracts
    forge script script/DeployAnvil.s.sol --rpc-url $ANVIL_RPC_URL --broadcast -v
    
    if [ $? -ne 0 ]; then
        error "Contract deployment failed"
    fi
    
    # Extract contract addresses from broadcast logs
    BROADCAST_DIR="broadcast/DeployAnvil.s.sol/$ANVIL_CHAIN_ID"
    if [ -f "$BROADCAST_DIR/run-latest.json" ]; then
        REGISTRY_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "PNSRegistry") | .contractAddress' "$BROADCAST_DIR/run-latest.json" | head -1)
        PRICE_ORACLE_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "PNSPriceOracle") | .contractAddress' "$BROADCAST_DIR/run-latest.json" | head -1)
        RESOLVER_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "PNSResolver") | .contractAddress' "$BROADCAST_DIR/run-latest.json" | head -1)
        DOMAIN_NFT_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "PNSDomainNFT") | .contractAddress' "$BROADCAST_DIR/run-latest.json" | head -1)
        REGISTRAR_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "PNSRegistrar") | .contractAddress' "$BROADCAST_DIR/run-latest.json" | head -1)
        CONTROLLER_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "PNSController") | .contractAddress' "$BROADCAST_DIR/run-latest.json" | head -1)
        
        # Update environment files with deployed addresses
        log "📝 Updating environment files with contract addresses..."
        
        # Update .env.anvil
        sed -i.bak "s/POLYGON_REGISTRY_ADDRESS=.*/POLYGON_REGISTRY_ADDRESS=$REGISTRY_ADDRESS/" ../.env.anvil
        sed -i.bak "s/POLYGON_REGISTRAR_ADDRESS=.*/POLYGON_REGISTRAR_ADDRESS=$REGISTRAR_ADDRESS/" ../.env.anvil
        sed -i.bak "s/POLYGON_CONTROLLER_ADDRESS=.*/POLYGON_CONTROLLER_ADDRESS=$CONTROLLER_ADDRESS/" ../.env.anvil
        sed -i.bak "s/POLYGON_RESOLVER_ADDRESS=.*/POLYGON_RESOLVER_ADDRESS=$RESOLVER_ADDRESS/" ../.env.anvil
        sed -i.bak "s/POLYGON_PRICE_ORACLE_ADDRESS=.*/POLYGON_PRICE_ORACLE_ADDRESS=$PRICE_ORACLE_ADDRESS/" ../.env.anvil
        sed -i.bak "s/POLYGON_NFT_ADDRESS=.*/POLYGON_NFT_ADDRESS=$DOMAIN_NFT_ADDRESS/" ../.env.anvil
        
        # Update frontend addresses.ts
        cat > ../client/src/lib/addresses.ts << EOF
// Contract addresses for different networks
// This file is auto-generated during deployment

export const ADDRESSES = {
  anvil: {
    registry: '$REGISTRY_ADDRESS' as \`0x\${string}\`,
    registrar: '$REGISTRAR_ADDRESS' as \`0x\${string}\`,
    controller: '$CONTROLLER_ADDRESS' as \`0x\${string}\`,
    resolver: '$RESOLVER_ADDRESS' as \`0x\${string}\`,
    priceOracle: '$PRICE_ORACLE_ADDRESS' as \`0x\${string}\`,
    nft: '$DOMAIN_NFT_ADDRESS' as \`0x\${string}\`
  },
  localhost: {
    registry: '$REGISTRY_ADDRESS' as \`0x\${string}\`,
    registrar: '$REGISTRAR_ADDRESS' as \`0x\${string}\`,
    controller: '$CONTROLLER_ADDRESS' as \`0x\${string}\`,
    resolver: '$RESOLVER_ADDRESS' as \`0x\${string}\`,
    priceOracle: '$PRICE_ORACLE_ADDRESS' as \`0x\${string}\`,
    nft: '$DOMAIN_NFT_ADDRESS' as \`0x\${string}\`
  },
  polygon: {
    registry: '' as \`0x\${string}\`,
    registrar: '' as \`0x\${string}\`,
    controller: '' as \`0x\${string}\`,
    resolver: '' as \`0x\${string}\`,
    priceOracle: '' as \`0x\${string}\`,
    nft: '' as \`0x\${string}\`
  }
} as const;

export type NetworkName = keyof typeof ADDRESSES;
EOF
        
        log "✅ Contract addresses:"
        log "   Registry: $REGISTRY_ADDRESS"
        log "   Controller: $CONTROLLER_ADDRESS" 
        log "   Registrar: $REGISTRAR_ADDRESS"
        log "   Resolver: $RESOLVER_ADDRESS"
        log "   Price Oracle: $PRICE_ORACLE_ADDRESS"
        log "   NFT: $DOMAIN_NFT_ADDRESS"
    else
        error "Could not find deployment artifacts"
    fi
    
    log "Contracts deployed successfully!"
    cyan "Registry:     $REGISTRY_ADDRESS"
    cyan "Registrar:    $REGISTRAR_ADDRESS"
    cyan "Controller:   $CONTROLLER_ADDRESS"
    cyan "Resolver:     $RESOLVER_ADDRESS"
    cyan "PriceOracle:  $PRICE_ORACLE_ADDRESS"
    cyan "DomainNFT:    $DOMAIN_NFT_ADDRESS"
    
    cd ..
}

update_backend_config() {
    log "Updating backend configuration for Anvil..."
    
    # Update backend .env
    cat > backend/.env << EOF
NODE_ENV=development
PORT=3001

# Anvil Configuration
POLYGON_RPC_URL=$ANVIL_RPC_URL
POLYGON_AMOY_RPC_URL=$ANVIL_RPC_URL

# Contract Addresses
REGISTRY_CONTRACT=$REGISTRY_ADDRESS
REGISTRAR_CONTRACT=$REGISTRAR_ADDRESS
CONTROLLER_CONTRACT=$CONTROLLER_ADDRESS
RESOLVER_CONTRACT=$RESOLVER_ADDRESS
PRICE_ORACLE_CONTRACT=$PRICE_ORACLE_ADDRESS
DOMAIN_NFT_CONTRACT=$DOMAIN_NFT_ADDRESS

# Indexer Configuration
INDEXER_SCAN_INTERVAL_MS=5000
INDEXER_BATCH_SIZE=100
DEPLOYMENT_BLOCK=0

# Security
JWT_SECRET=test-secret-for-anvil
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs
EOF
    
    log "Backend configuration updated ✓"
}

update_frontend_config() {
    log "Updating frontend configuration for Anvil..."
    
    # Update client addresses.ts
    cat > client/src/lib/addresses.ts << EOF
/**
 * Contract addresses for Anvil testing
 */

export interface ContractAddresses {
  registry: \`0x\${string}\`;
  registrar: \`0x\${string}\`;
  controller: \`0x\${string}\`;
  resolver: \`0x\${string}\`;
  priceOracle: \`0x\${string}\`;
  domainNFT: \`0x\${string}\`;
}

const contractAddresses: Record<number, ContractAddresses> = {
  // Anvil Local
  31337: {
    registry: '$REGISTRY_ADDRESS' as \`0x\${string}\`,
    registrar: '$REGISTRAR_ADDRESS' as \`0x\${string}\`,
    controller: '$CONTROLLER_ADDRESS' as \`0x\${string}\`,
    resolver: '$RESOLVER_ADDRESS' as \`0x\${string}\`,
    priceOracle: '$PRICE_ORACLE_ADDRESS' as \`0x\${string}\`,
    domainNFT: '$DOMAIN_NFT_ADDRESS' as \`0x\${string}\`,
  },
};

export function getContractAddresses(chainId: number): ContractAddresses {
  const addresses = contractAddresses[chainId];
  
  if (!addresses) {
    throw new Error(\`Unsupported chain ID: \${chainId}\`);
  }
  
  return addresses;
}

export function isSupportedChain(chainId: number): boolean {
  return chainId in contractAddresses;
}

export function getSupportedChains(): number[] {
  return Object.keys(contractAddresses).map(Number);
}

export function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    31337: 'Anvil Local',
  };
  
  return chainNames[chainId] || \`Chain \${chainId}\`;
}
EOF
    
    # Update frontend .env.local
    cat > client/.env.local << EOF
# Anvil Configuration
VITE_POLYGON_RPC_URL=$ANVIL_RPC_URL
VITE_API_BASE_URL=http://localhost:3001/api

# Contract Addresses
VITE_REGISTRY_ADDRESS=$REGISTRY_ADDRESS
VITE_REGISTRAR_ADDRESS=$REGISTRAR_ADDRESS
VITE_CONTROLLER_ADDRESS=$CONTROLLER_ADDRESS
VITE_RESOLVER_ADDRESS=$RESOLVER_ADDRESS
VITE_PRICE_ORACLE_ADDRESS=$PRICE_ORACLE_ADDRESS
VITE_DOMAIN_NFT_ADDRESS=$DOMAIN_NFT_ADDRESS
EOF
    
    log "Frontend configuration updated ✓"
}

start_backend() {
    log "Starting backend server..."
    
    cd backend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        info "Installing backend dependencies..."
        npm install
    fi
    
    # Build backend
    info "Building backend..."
    npm run build
    
    # Start backend in background
    info "Starting backend server..."
    npm run dev &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../.backend.pid
    
    cd ..
    
    # Wait for backend to start
    sleep 5
    
    # Test backend health
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        log "Backend started successfully (PID: $BACKEND_PID) ✓"
    else
        error "Backend failed to start"
    fi
}

start_frontend() {
    log "Starting frontend server..."
    
    cd client
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        info "Installing frontend dependencies..."
        pnpm install
    fi
    
    # Start frontend in background
    info "Starting frontend development server..."
    pnpm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../.frontend.pid
    
    cd ..
    
    # Wait for frontend to start
    sleep 10
    
    # Test frontend
    if curl -f -s http://localhost:3000 > /dev/null; then
        log "Frontend started successfully (PID: $FRONTEND_PID) ✓"
    else
        warn "Frontend may still be starting up..."
    fi
}

test_contract_interactions() {
    log "Testing contract interactions..."
    
    cd contracts
    
    # Test domain registration using cast
    info "Testing domain registration..."
    
    # Get price for "test" domain (1 year)
    PRICE=$(cast call $PRICE_ORACLE_ADDRESS "getPrice(string,uint256)(uint256)" "test" 31536000 --rpc-url $ANVIL_RPC_URL)
    cyan "Price for 'test.poly' (1 year): $PRICE wei"
    
    # Register domain
    info "Registering 'test.poly'..."
    TX_HASH=$(cast send $CONTROLLER_ADDRESS \
        "registerDomain(string,address,uint256,address)" \
        "test" $USER_ADDRESS 31536000 $RESOLVER_ADDRESS \
        --private-key $USER_PRIVATE_KEY \
        --value $PRICE \
        --rpc-url $ANVIL_RPC_URL)
    
    cyan "Registration TX: $TX_HASH"
    
    # Wait for transaction
    sleep 2
    
    # Check registration
    DOMAIN_HASH=$(cast keccak "test.poly")
    OWNER=$(cast call $REGISTRY_ADDRESS "records(bytes32)(address,address,uint64,uint96)" $DOMAIN_HASH --rpc-url $ANVIL_RPC_URL | cut -d' ' -f1)
    
    if [ "$OWNER" = "$USER_ADDRESS" ]; then
        log "Domain registration successful ✓"
        cyan "Owner: $OWNER"
    else
        error "Domain registration failed"
    fi
    
    cd ..
}

test_backend_indexing() {
    log "Testing backend event indexing..."
    
    # Wait for indexer to process events
    sleep 10
    
    # Test domain lookup
    info "Testing domain lookup API..."
    RESPONSE=$(curl -s http://localhost:3001/api/domains/$USER_ADDRESS)
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        log "Backend API responding ✓"
        cyan "Response: $RESPONSE"
    else
        warn "Backend API may still be indexing events"
        cyan "Response: $RESPONSE"
    fi
    
    # Test health endpoint
    info "Testing health endpoint..."
    HEALTH=$(curl -s http://localhost:3001/api/health)
    cyan "Health: $HEALTH"
}

test_frontend_interaction() {
    log "Testing frontend interaction..."
    
    info "Frontend should be available at: http://localhost:3000"
    info "You can now test:"
    info "- Connect wallet (use one of the Anvil accounts)"
    info "- Register domains"
    info "- View domain portfolio"
    info "- Set domain records"
    
    cyan "Test accounts:"
    cyan "Admin:  $ADMIN_ADDRESS"
    cyan "User:   $USER_ADDRESS"
    cyan "Key:    $USER_PRIVATE_KEY"
}

cleanup() {
    log "Cleaning up processes..."
    
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm .frontend.pid
        log "Frontend stopped"
    fi
    
    if [ -f ".backend.pid" ]; then
        BACKEND_PID=$(cat .backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm .backend.pid
        log "Backend stopped"
    fi
    
    if [ -f ".anvil.pid" ]; then
        ANVIL_PID=$(cat .anvil.pid)
        kill $ANVIL_PID 2>/dev/null || true
        rm .anvil.pid
        log "Anvil stopped"
    fi
    
    # Also kill any remaining processes
    pkill -f "anvil" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "pnpm run dev" 2>/dev/null || true
}

# Trap cleanup on exit
trap cleanup EXIT

print_summary() {
    log "Test environment setup complete! 🎉"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                           Test Environment URLs                             ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    cyan "Frontend:     http://localhost:3000"
    cyan "Backend API:  http://localhost:3001"
    cyan "Health Check: http://localhost:3001/api/health"
    cyan "Anvil RPC:    $ANVIL_RPC_URL"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                           Contract Addresses                                ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    cyan "Registry:     $REGISTRY_ADDRESS"
    cyan "Registrar:    $REGISTRAR_ADDRESS"
    cyan "Controller:   $CONTROLLER_ADDRESS"
    cyan "Resolver:     $RESOLVER_ADDRESS"
    cyan "PriceOracle:  $PRICE_ORACLE_ADDRESS"
    cyan "DomainNFT:    $DOMAIN_NFT_ADDRESS"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                           Test Accounts                                     ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    cyan "Admin:  $ADMIN_ADDRESS"
    cyan "User:   $USER_ADDRESS"
    echo ""
    warn "To stop all services: Ctrl+C or kill this script"
    info "Test the complete flow by registering domains in the frontend!"
}

# Main execution
main() {
    print_banner
    
    # Setup
    start_anvil_if_needed
    check_anvil
    
    # Deploy and configure
    deploy_contracts
    update_backend_config
    update_frontend_config
    
    # Start services
    start_backend
    start_frontend
    
    # Test functionality
    test_contract_interactions
    test_backend_indexing
    test_frontend_interaction
    
    print_summary
    
    # Keep script running
    info "Press Ctrl+C to stop all services and cleanup"
    while true; do
        sleep 1
    done
}

# Run if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi