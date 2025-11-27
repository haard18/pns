#!/bin/bash

# PNS Test Commands Helper
# This script provides easy access to test the deployed PNS system
# Run: source test-commands.sh (from the contracts directory)

# Default values - update these with your deployment output
RPC_URL="${RPC_URL:-http://localhost:8545}"
CONTROLLER="${CONTROLLER:-}"
REGISTRY="${REGISTRY:-}"
RESOLVER="${RESOLVER:-}"
REGISTRAR="${REGISTRAR:-}"
PRICE_ORACLE="${PRICE_ORACLE:-}"
NFT="${NFT:-}"
ADMIN="${ADMIN:-0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266}"
ADMIN_KEY="${ADMIN_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
USER1="${USER1:-0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a}"
USER1_KEY="${USER1_KEY:-0x5de4111afa1a4b94908f83103db1fb50da4c89699e6dffb97ae4e8e89143a01b}"
USER2="${USER2:-0x90F79bf6EB2c4f870365E785982E1f101E93b906}"
USER2_KEY="${USER2_KEY:-0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Helper function to display usage
show_help() {
    cat << EOF
${BLUE}PNS Test Commands Helper${NC}

${YELLOW}Setup:${NC}
  setup-vars <registry> <controller> <resolver> <registrar> <oracle>
    Set contract addresses for testing

${YELLOW}Domain Queries:${NC}
  check-owner <domain>              Check who owns a domain
  check-available <domain>          Check if a domain is available
  check-expiration <domain>         Get domain expiration timestamp
  check-resolver <domain>           Get domain resolver address

${YELLOW}Domain Registration:${NC}
  register <domain> <owner> <years> [private_key]  
    Register a domain (default owner: USER1)
  
  renew <domain> <years> [private_key]
    Renew a domain registration

${YELLOW}Records:${NC}
  set-text <domain> <key> <value> [private_key]
    Set a text record (e.g., avatar, website, email)
  
  get-text <domain> <key>
    Get a text record value
  
  set-polygon-addr <domain> <address> [private_key]
    Set Polygon address for a domain
  
  get-polygon-addr <domain>
    Get Polygon address for a domain

${YELLOW}Utility:${NC}
  get-namehash <domain>            Get keccak256 hash of a domain name
  show-config                        Show current configuration
  show-help                          Show this help message

${YELLOW}Examples:${NC}
  check-owner alice
  register mydomain 0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a 1
  set-text alice avatar https://avatar.example.com
  get-polygon-addr bobby
EOF
}

# Helper: Check if contracts are configured
check_config() {
    if [ -z "$CONTROLLER" ] || [ -z "$REGISTRY" ]; then
        echo -e "${RED}❌ Contracts not configured!${NC}"
        echo "Run: setup-vars <registry> <controller> <resolver> <registrar> <oracle>"
        return 1
    fi
    return 0
}

# Function: Setup variables
setup-vars() {
    if [ $# -ne 5 ]; then
        echo -e "${RED}Usage: setup-vars <registry> <controller> <resolver> <registrar> <oracle>${NC}"
        return 1
    fi
    
    REGISTRY="$1"
    CONTROLLER="$2"
    RESOLVER="$3"
    REGISTRAR="$4"
    PRICE_ORACLE="$5"
    
    echo -e "${GREEN}✓ Contracts configured:${NC}"
    echo "  Registry:    $REGISTRY"
    echo "  Controller:  $CONTROLLER"
    echo "  Resolver:    $RESOLVER"
    echo "  Registrar:   $REGISTRAR"
    echo "  PriceOracle: $PRICE_ORACLE"
}

# Function: Show configuration
show-config() {
    echo -e "${BLUE}Current Configuration:${NC}"
    echo "RPC URL:     $RPC_URL"
    echo "Registry:    ${REGISTRY:-not set}"
    echo "Controller:  ${CONTROLLER:-not set}"
    echo "Resolver:    ${RESOLVER:-not set}"
    echo "Registrar:   ${REGISTRAR:-not set}"
    echo "Price Oracle: ${PRICE_ORACLE:-not set}"
    echo ""
    echo -e "${BLUE}Test Accounts:${NC}"
    echo "ADMIN:   $ADMIN"
    echo "USER1:   $USER1"
    echo "USER2:   $USER2"
}

# Function: Get namehash
get-namehash() {
    if [ -z "$1" ]; then
        echo -e "${RED}Usage: get-namehash <domain>${NC}"
        return 1
    fi
    local domain="$1.poly"
    cast keccak256 "string:$domain"
}

# Function: Check domain owner
check-owner() {
    check_config || return 1
    
    if [ -z "$1" ]; then
        echo -e "${RED}Usage: check-owner <domain>${NC}"
        return 1
    fi
    
    local owner=$(cast call $CONTROLLER "getDomainOwner" "string:$1" --rpc-url $RPC_URL 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Owner of '$1':${NC} $owner"
    else
        echo -e "${YELLOW}Domain '$1' not found or error${NC}"
    fi
}

# Function: Check domain availability
check-available() {
    check_config || return 1
    
    if [ -z "$1" ]; then
        echo -e "${RED}Usage: check-available <domain>${NC}"
        return 1
    fi
    
    local available=$(cast call $CONTROLLER "isDomainAvailable" "string:$1" --rpc-url $RPC_URL 2>/dev/null)
    if [ "$available" = "true" ]; then
        echo -e "${GREEN}✓ Domain '$1' is AVAILABLE${NC}"
    elif [ "$available" = "false" ]; then
        echo -e "${YELLOW}✗ Domain '$1' is NOT available${NC}"
    else
        echo -e "${RED}Error checking availability${NC}"
    fi
}

# Function: Check domain expiration
check-expiration() {
    check_config || return 1
    
    if [ -z "$1" ]; then
        echo -e "${RED}Usage: check-expiration <domain>${NC}"
        return 1
    fi
    
    local expiration=$(cast call $CONTROLLER "getDomainExpiration" "string:$1" --rpc-url $RPC_URL 2>/dev/null)
    if [ $? -eq 0 ]; then
        local human_date=$(date -r $expiration 2>/dev/null || echo "unable to convert")
        echo -e "${GREEN}Domain '$1' expires at:${NC}"
        echo "  Unix: $expiration"
        echo "  Date: $human_date"
    else
        echo -e "${RED}Error getting expiration (domain may not exist)${NC}"
    fi
}

# Function: Check domain resolver
check-resolver() {
    check_config || return 1
    
    if [ -z "$1" ]; then
        echo -e "${RED}Usage: check-resolver <domain>${NC}"
        return 1
    fi
    
    local resolver=$(cast call $CONTROLLER "getDomainResolver" "string:$1" --rpc-url $RPC_URL 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Resolver for '$1':${NC} $resolver"
    else
        echo -e "${RED}Error getting resolver${NC}"
    fi
}

# Function: Register domain
register() {
    check_config || return 1
    
    if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
        echo -e "${RED}Usage: register <domain> <owner> <years> [private_key]${NC}"
        return 1
    fi
    
    local domain="$1"
    local owner="$2"
    local years="$3"
    local key="${4:-$USER1_KEY}"
    
    echo -e "${BLUE}Registering '$domain' for $owner for $years year(s)...${NC}"
    
    cast send $CONTROLLER "registerDomain" "string:$domain" "address:$owner" "uint256:$years" \
        --rpc-url $RPC_URL --private-key $key --value 10ether
}

# Function: Renew domain
renew() {
    check_config || return 1
    
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo -e "${RED}Usage: renew <domain> <years> [private_key]${NC}"
        return 1
    fi
    
    local domain="$1"
    local years="$2"
    local key="${3:-$USER1_KEY}"
    
    echo -e "${BLUE}Renewing '$domain' for $years year(s)...${NC}"
    
    cast send $CONTROLLER "renewDomain" "string:$domain" "uint256:$years" \
        --rpc-url $RPC_URL --private-key $key --value 10ether
}

# Function: Set text record
set-text() {
    check_config || return 1
    
    if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
        echo -e "${RED}Usage: set-text <domain> <key> <value> [private_key]${NC}"
        return 1
    fi
    
    local domain="$1"
    local key="$2"
    local value="$3"
    local pk="${4:-$USER1_KEY}"
    local namehash=$(get-namehash "$domain")
    
    echo -e "${BLUE}Setting text record for '$domain' ($key = $value)...${NC}"
    
    cast send $RESOLVER "setText" "bytes32:$namehash" "string:$key" "string:$value" \
        --rpc-url $RPC_URL --private-key $pk
}

# Function: Get text record
get-text() {
    check_config || return 1
    
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo -e "${RED}Usage: get-text <domain> <key>${NC}"
        return 1
    fi
    
    local domain="$1"
    local key="$2"
    local namehash=$(get-namehash "$domain")
    
    cast call $RESOLVER "getText" "bytes32:$namehash" "string:$key" --rpc-url $RPC_URL
}

# Function: Set Polygon address
set-polygon-addr() {
    check_config || return 1
    
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo -e "${RED}Usage: set-polygon-addr <domain> <address> [private_key]${NC}"
        return 1
    fi
    
    local domain="$1"
    local addr="$2"
    local pk="${3:-$USER1_KEY}"
    local namehash=$(get-namehash "$domain")
    
    echo -e "${BLUE}Setting Polygon address for '$domain' to $addr...${NC}"
    
    cast send $RESOLVER "setPolygonAddr" "bytes32:$namehash" "address:$addr" \
        --rpc-url $RPC_URL --private-key $pk
}

# Function: Get Polygon address
get-polygon-addr() {
    check_config || return 1
    
    if [ -z "$1" ]; then
        echo -e "${RED}Usage: get-polygon-addr <domain>${NC}"
        return 1
    fi
    
    local domain="$1"
    local namehash=$(get-namehash "$domain")
    
    cast call $RESOLVER "getPolygonAddr" "bytes32:$namehash" --rpc-url $RPC_URL
}

# Function: Help
show-help() {
    show_help
}

# If called with arguments, execute the command
if [ $# -gt 0 ]; then
    "$@"
else
    show_help
fi
