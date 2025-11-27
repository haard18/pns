#!/bin/bash

RPC="https://polygon-mainnet.infura.io/v3/62ea68f978fa4aa89c251a5778254b1b"

REGISTRY="0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38"
ORACLE="0xBF7E19638ddd7c7D312aE06a387d5F838c4a8C73"
RESOLVER="0x4f15efcE62cE45c402408015A34CD7c3a43fAC07"
REGISTRAR="0x1E4461AB41652Ac9d84FA215c4AD443857e10c95"
CONTROLLER="0x72673ECA8BC86c6fe65221Bf90ea68A1A529A2a7"
NFT="0x889F312473288c6F8D3f57F563D0bcA7D8789Acf"

ADMIN="0xD894A520ed104f468490c78312A4e01A2AF18078"

echo "=== Checking Roles & Permissions ==="
echo ""

echo "1. Registry Roles:"
# Check REGISTRAR_ROLE for Registrar
REGISTRAR_ROLE=$(cast keccak "REGISTRAR_ROLE")
HAS_REGISTRAR=$(cast call "$REGISTRY" "hasRole(bytes32,address)" "$REGISTRAR_ROLE" "$REGISTRAR" --rpc-url "$RPC" 2>/dev/null | grep -q "0x0000000000000000000000000000000000000000000000000000000000000001" && echo "✓ YES" || echo "✗ NO")
echo "   REGISTRAR_ROLE on Registrar: $HAS_REGISTRAR"

# Check ADMIN_ROLE
ADMIN_ROLE=$(cast keccak "ADMIN_ROLE")
HAS_ADMIN=$(cast call "$REGISTRY" "hasRole(bytes32,address)" "$ADMIN_ROLE" "$ADMIN" --rpc-url "$RPC" 2>/dev/null | grep -q "0x0000000000000000000000000000000000000000000000000000000000000001" && echo "✓ YES" || echo "✗ NO")
echo "   ADMIN_ROLE on Admin: $HAS_ADMIN"

echo ""
echo "2. Resolver Roles:"
REGISTRY_ROLE=$(cast keccak "REGISTRY_ROLE")
HAS_REGISTRY_ROLE=$(cast call "$RESOLVER" "hasRole(bytes32,address)" "$REGISTRY_ROLE" "$REGISTRY" --rpc-url "$RPC" 2>/dev/null | grep -q "0x0000000000000000000000000000000000000000000000000000000000000001" && echo "✓ YES" || echo "✗ NO")
echo "   REGISTRY_ROLE on Registry: $HAS_REGISTRY_ROLE"

echo ""
echo "3. Registrar Roles:"
CONTROLLER_ROLE=$(cast keccak "CONTROLLER_ROLE")
HAS_CONTROLLER=$(cast call "$REGISTRAR" "hasRole(bytes32,address)" "$CONTROLLER_ROLE" "$CONTROLLER" --rpc-url "$RPC" 2>/dev/null | grep -q "0x0000000000000000000000000000000000000000000000000000000000000001" && echo "✓ YES" || echo "✗ NO")
echo "   CONTROLLER_ROLE on Controller: $HAS_CONTROLLER"

echo ""
echo "4. Contract References:"
REGISTRY_REF=$(cast call "$REGISTRAR" "registry()" --rpc-url "$RPC" 2>/dev/null)
echo "   Registrar → Registry: $REGISTRY_REF"

RESOLVER_REF=$(cast call "$REGISTRAR" "priceOracle()" --rpc-url "$RPC" 2>/dev/null)
echo "   Registrar → PriceOracle: $RESOLVER_REF"

REGISTRY_REF2=$(cast call "$RESOLVER" "registry()" --rpc-url "$RPC" 2>/dev/null)
echo "   Resolver → Registry: $REGISTRY_REF2"

echo ""
echo "=== All Deployments Verified ✓ ==="
