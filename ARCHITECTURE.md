# Architecture Update: Direct Contract Calls

## Overview
The frontend now calls smart contracts **directly** for all read operations. The backend is used **only** for:
- Recording transaction history
- Indexing domain ownership (requires event scanning)
- Storing application state

## What Changed

### Before
```
Frontend → Backend API → Smart Contracts
```

### After
```
Frontend → Smart Contracts (direct)
         ↓
         Backend (only for transaction recording)
```

## Direct Contract Calls

### Read Operations (No Backend)
- ✅ `checkAvailability()` - Calls `PNSController.isDomainAvailable()`
- ✅ `getDomainPrice()` - Calls `PNSPriceOracle.getPrice()`
- ✅ `getDomainOwner()` - Calls `PNSController.getDomainOwner()`
- ✅ `getDomainExpiration()` - Calls `PNSController.getDomainExpiration()`
- ✅ `getDomainResolver()` - Calls `PNSController.getDomainResolver()`
- ✅ `getTextRecord()` - Calls `PNSResolver.getText()`

### Write Operations (Direct + Backend Recording)
- ✅ `registerDomain()` - Calls contract, then records in backend
- ✅ `renewDomain()` - Calls contract directly
- ✅ `setTextRecord()` - Calls contract directly
- ✅ `setAddressRecord()` - Calls contract directly

### Backend-Only Operations
- ✅ `getUserDomains()` - Requires event indexing (still uses backend)
- ✅ `recordTransaction()` - Stores transaction history

## Benefits

1. **Faster**: No API roundtrip for reads
2. **More Reliable**: Direct source of truth
3. **Decentralized**: Works even if backend is down
4. **Lower Backend Load**: Backend only stores history
5. **True Web3**: User's wallet directly interacts with blockchain

## Files Modified

- [`client/src/hooks/useContracts.ts`](file:///Users/hardy/Developer/scalper/nameservice/client/src/hooks/useContracts.ts) - Added direct read functions
- [`client/src/hooks/useDomain.ts`](file:///Users/hardy/Developer/scalper/nameservice/client/src/hooks/useDomain.ts) - Replaced API calls with contract calls
- [`client/src/pages/RegisterDomain.tsx`](file:///Users/hardy/Developer/scalper/nameservice/client/src/pages/RegisterDomain.tsx) - Simplified to always use contracts

## Backend Role

The backend now serves as:
1. **Transaction Recorder**: Stores successful transactions for history
2. **Event Indexer**: Scans blockchain events to build domain ownership database
3. **API for Queries**: Provides indexed data (e.g., all domains owned by an address)

This is the standard Web3 architecture pattern! 🎯
