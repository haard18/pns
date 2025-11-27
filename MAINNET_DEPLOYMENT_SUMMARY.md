# Polygon Mainnet Deployment Summary
**Date:** November 27, 2025
**Network:** Polygon Mainnet (Chain ID: 137)
**Status:** ✅ COMPLETE & VERIFIED

## Deployment Details

### Deployer Account
```
Address: 0xD894A520ed104f468490c78312A4e01A2AF18078
```

### Treasury Account
```
Address: 0xd894a520ed104f468490c78312a4e01a2af18078
```

### RPC Configuration
```
URL: https://polygon-mainnet.infura.io/v3/62ea68f978fa4aa89c251a5778254b1b
```

## Smart Contracts Deployed

### 1. PNSRegistry
**Address:** `0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38`
- Core registry managing domain ownership
- Stores name records, reverse mappings, and subdomains
- Status: ✅ Verified & Initialized

### 2. PNSPriceOracle
**Address:** `0xBF7E19638ddd7c7D312aE06a387d5F838c4a8C73`
- Dynamic pricing engine for domain registrations
- Default pricing:
  - Short (1-3 chars): 50 MATIC/year
  - Mid (4 chars): 10 MATIC/year
  - Regular (5-6 chars): 2 MATIC/year
  - Long (7+ chars): 0.5 MATIC/year
- Status: ✅ Verified & Initialized

### 3. PNSResolver
**Address:** `0x4f15efcE62cE45c402408015A34CD7c3a43fAC07`
- Resolution contract for storing name records
- Supports: addresses, text records, content hashes
- Default coin types configured:
  - 60: ETH (Ethereum)
  - 966: MATIC (Polygon)
- Status: ✅ Verified & Initialized

### 4. PNSRegistrar
**Address:** `0x1E4461AB41652Ac9d84FA215c4AD443857e10c95`
- Handles registration and renewal logic
- Default settings:
  - Registration period: 365 days
  - Grace period: 30 days
  - Minimum name length: 3 chars
  - Maximum name length: 63 chars
  - Treasury: 0xd894a520ed104f468490c78312a4e01a2af18078
- Status: ✅ Verified & Initialized

### 5. PNSController
**Address:** `0x72673ECA8BC86c6fe65221Bf90ea68A1A529A2a7`
- User-facing interface for domain operations
- Features:
  - Domain registration/renewal
  - Batch operations support
  - Rate limiting: 100 registrations per user per day
  - Registration fee: 0.5% (50 basis points)
- Status: ✅ Verified & Initialized

### 6. PNSDomainNFT
**Address:** `0x889F312473288c6F8D3f57F563D0bcA7D8789Acf`
- ERC721 NFT representation of domains
- Base URI: `ipfs://bafkreiedjwny3u67id3zl2gymy7hhrphkvmwi2o6ni5majlqzj4ihuzzv4`
- Token name: "Polygon Naming Service"
- Token symbol: "PNS"
- Status: ✅ Verified & Initialized

## Roles & Permissions Granted

### Registry Roles
- ✅ `ADMIN_ROLE` → Deployer Account
- ✅ `REGISTRAR_ROLE` → PNSRegistrar Contract

### Resolver Roles
- ✅ `REGISTRY_ROLE` → PNSRegistry Contract

### Registrar Roles
- ✅ `CONTROLLER_ROLE` → PNSController Contract
- ✅ `ADMIN_ROLE` → Deployer Account

## Cross-Contract References Verified

| Contract | References | Status |
|----------|-----------|--------|
| PNSRegistrar | → PNSRegistry | ✅ 0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38 |
| PNSRegistrar | → PNSPriceOracle | ✅ 0xBF7E19638ddd7c7D312aE06a387d5F838c4a8C73 |
| PNSResolver | → PNSRegistry | ✅ 0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38 |
| PNSController | → All contracts | ✅ Initialized |
| PNSDomainNFT | → PNSRegistry | ✅ Initialized |

## Frontend Configuration Updated

### Environment Variables (.env.local)
```
VITE_POLYGON_RPC=https://polygon-mainnet.infura.io/v3/62ea68f978fa4aa89c251a5778254b1b
VITE_REGISTRY_ADDRESS=0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38
VITE_CONTROLLER_ADDRESS=0x72673ECA8BC86c6fe65221Bf90ea68A1A529A2a7
VITE_REGISTRAR_ADDRESS=0x1E4461AB41652Ac9d84FA215c4AD443857e10c95
VITE_RESOLVER_ADDRESS=0x4f15efcE62cE45c402408015A34CD7c3a43fAC07
VITE_PRICE_ORACLE_ADDRESS=0xBF7E19638ddd7c7D312aE06a387d5F838c4a8C73
VITE_NFT_ADDRESS=0x889F312473288c6F8D3f57F563D0bcA7D8789Acf
```

### Contract Config (contractConfig.ts)
- All contract addresses configured for Chain ID 137 (Polygon Mainnet)
- Frontend will automatically use mainnet addresses when connected to chain 137

## Deployment Costs

- **Estimated Gas Used:** 32,480,693
- **Gas Price:** 125.79 gwei
- **Estimated Total Cost:** ~4.09 POL

## Next Steps

1. **Frontend Deployment:**
   ```bash
   cd client
   npm run build
   npm run preview
   ```

2. **Backend Configuration:**
   - Update backend `.env` with contract addresses
   - Configure API endpoints

3. **Testing:**
   - Test domain registration
   - Test renewals
   - Verify role-based access control
   - Validate pricing calculations

4. **Production Launch:**
   - DNS integration
   - Marketing materials
   - Community announcement

## Verification Commands

All contracts verified and operational. To re-verify:

```bash
# Check Registry
cast call 0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38 "baseTld()" \
  --rpc-url https://polygon-mainnet.infura.io/v3/62ea68f978fa4aa89c251a5778254b1b

# Check roles
cast call 0x08CA1CB2ebc4AB7d709fCe5Da9f185D950E21D38 \
  "hasRole(bytes32,address)" \
  "$(cast keccak 'REGISTRAR_ROLE')" \
  0x1E4461AB41652Ac9d84FA215c4AD443857e10c95 \
  --rpc-url https://polygon-mainnet.infura.io/v3/62ea68f978fa4aa89c251a5778254b1b
```

---

**Deployed by:** Hardy | **Timestamp:** 2025-11-27 23:46:57 UTC
