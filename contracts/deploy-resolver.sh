#!/bin/bash
# Deploy remaining PNS contracts to Polygon Mainnet

set -e

RPC_URL="https://polygon-rpc.com"
PRIVATE_KEY="9f49a7433da3ddadf30655bbce3f9be8329facbcb304895f4ad6d917a279ef85"
REGISTRY="0xEbcbf5dB26A7496Ab146E7595bE76B3FE1345F80"

echo "Deploying PNSResolver..."
RESOLVER_OUTPUT=$(forge create src/PNSResolver.sol:PNSResolver \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --constructor-args $REGISTRY \
    --legacy \
    --broadcast 2>&1)

RESOLVER=$(echo "$RESOLVER_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo "Resolver: $RESOLVER"

if [ -z "$RESOLVER" ]; then
    echo "Failed to deploy Resolver"
    echo "$RESOLVER_OUTPUT"
    exit 1
fi

echo ""
echo "Deployed Addresses:"
echo "Registry:  $REGISTRY"
echo "Resolver:  $RESOLVER"
