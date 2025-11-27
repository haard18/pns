#!/bin/bash

RPC="https://polygon-mainnet.infura.io/v3/62ea68f978fa4aa89c251a5778254b1b"
ADMIN="0xD894A520ed104f468490c78312A4e01A2AF18078"

echo "=== Verifying Deployed Contracts ==="
echo ""

# Verify Registry
echo "1. PNSRegistry at 0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38"
cast call 0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38 "baseTld()" --rpc-url "$RPC" 2>/dev/null && echo "✓ Registry verified" || echo "✗ Registry call failed"

# Verify Price Oracle
echo ""
echo "2. PNSPriceOracle at 0xBF7E19638ddd7c7D312aE06a387d5F838c4a8C73"
cast call 0xBF7E19638ddd7c7D312aE06a387d5F838c4a8C73 "shortDomainPrice()" --rpc-url "$RPC" 2>/dev/null && echo "✓ Price Oracle verified" || echo "✗ Price Oracle call failed"

# Verify Resolver
echo ""
echo "3. PNSResolver at 0x4f15efcE62cE45c402408015A34CD7c3a43fAC07"
cast call 0x4f15efcE62cE45c402408015A34CD7c3a43fAC07 "owner()" --rpc-url "$RPC" 2>/dev/null && echo "✓ Resolver verified" || echo "✗ Resolver call failed"

# Verify Registrar
echo ""
echo "4. PNSRegistrar at 0x1E4461AB41652Ac9d84FA215c4AD443857e10c95"
cast call 0x1E4461AB41652Ac9d84FA215c4AD443857e10c95 "treasury()" --rpc-url "$RPC" 2>/dev/null && echo "✓ Registrar verified" || echo "✗ Registrar call failed"

# Verify Controller
echo ""
echo "5. PNSController at 0x72673ECA8BC86c6fe65221Bf90ea68A1A529A2a7"
cast call 0x72673ECA8BC86c6fe65221Bf90ea68A1A529A2a7 "paused()" --rpc-url "$RPC" 2>/dev/null && echo "✓ Controller verified" || echo "✗ Controller call failed"

# Verify NFT
echo ""
echo "6. PNSDomainNFT at 0x889F312473288c6F8D3f57F563D0bcA7D8789Acf"
cast call 0x889F312473288c6F8D3f57F563D0bcA7D8789Acf "name()" --rpc-url "$RPC" 2>/dev/null && echo "✓ NFT verified" || echo "✗ NFT call failed"

echo ""
echo "=== Deployment Summary ==="
echo "Registry:     0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38"
echo "PriceOracle:  0xBF7E19638ddd7c7D312aE06a387d5F838c4a8C73"
echo "Resolver:     0x4f15efcE62cE45c402408015A34CD7c3a43fAC07"
echo "Registrar:    0x1E4461AB41652Ac9d84FA215c4AD443857e10c95"
echo "Controller:   0x72673ECA8BC86c6fe65221Bf90ea68A1A529A2a7"
echo "NFT:          0x889F312473288c6F8D3f57F563D0bcA7D8789Acf"
echo ""
echo "Admin:        $ADMIN"
echo "Treasury:     $ADMIN"
echo "Network:      Polygon Mainnet (Chain 137)"
