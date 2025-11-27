# Contract Address Fix

## Issue
The frontend was using incorrect contract addresses:
- **Controller**: Was using `0x9fE...` (Resolver address)
- **Resolver**: Was using `0xDc6...` (Controller address)

This caused all contract read operations to fail with "function not found" errors.

## Fix Applied

### Updated Contract Addresses (localhost/Anvil)
```typescript
{
  registry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  controller: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',  // ✅ Fixed
  registrar: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  resolver: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',   // ✅ Fixed
  priceOracle: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // ✅ Fixed
  nft: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
}
```

### Domain Name Handling
Also fixed domain name handling - contracts expect just the name without `.poly` suffix:
- **Before**: `checkAvailability("haard.poly")` → Error
- **After**: `checkAvailability("haard.poly")` → strips to `"haard"` → Success

## Files Modified
- [`client/src/config/contractConfig.ts`](file:///Users/hardy/Developer/scalper/nameservice/client/src/config/contractConfig.ts) - Fixed address mapping
- [`client/src/hooks/useContracts.ts`](file:///Users/hardy/Developer/scalper/nameservice/client/src/hooks/useContracts.ts) - Added .poly suffix stripping

## Testing
```bash
# Test availability check
cast call 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 \
  "isDomainAvailable(string)(bool)" "haard" \
  --rpc-url http://localhost:8545
# Returns: true ✅
```

The frontend should now work correctly! 🎯
