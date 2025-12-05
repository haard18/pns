# USDC Payment Integration - Migration Guide

## Overview

The Polygon Name Service (PNS) contracts have been updated to accept USDC (USD Coin) payments instead of POL (Polygon native token) for domain name registrations and renewals.

## Key Changes

### 1. **PNSRegistrar.sol**
- **Added USDC Token Support**: Import `IERC20` interface and added `usdcToken` state variable
- **Updated Initialize Function**: Now accepts USDC token address as parameter
- **Payment Method Changed**: 
  - Removed `payable` modifiers from all functions
  - Replaced `msg.value` checks with `usdcToken.transferFrom()` calls
  - USDC is transferred directly from user to treasury
- **Auction System Updated**: Premium auction bids now use USDC instead of native tokens

### 2. **PNSController.sol**
- **Added USDC Token Support**: Import `IERC20` interface and added `usdcToken` state variable
- **Updated Initialize Function**: Now accepts USDC token address as parameter
- **Removed Payable Functions**: All registration and renewal functions are no longer payable
- **Updated Payment Logic**: Users must approve USDC allowance before calling functions
- **Removed Emergency Withdrawal**: No longer needed since contract doesn't hold native tokens
- **Batch Operations**: Total USDC cost is calculated and transferred in single transaction

### 3. **PNSPriceOracle.sol**
- **Updated Price Denomination**: Prices now in USDC (6 decimals) instead of wei (18 decimals)
- **New Default Prices**:
  - Short domains (1-3 chars): 50 USDC
  - Mid domains (4 chars): 10 USDC
  - Regular domains (5-6 chars): 2 USDC
  - Long domains (7+ chars): 0.5 USDC
- **Updated Documentation**: All comments now reflect USDC pricing

### 4. **DeployPNS.s.sol**
- **Added USDC Token Address**: Defaults to Polygon mainnet USDC: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`
- **Updated Initialization**: Both PNSRegistrar and PNSController now receive USDC address

## USDC Token Addresses

### Polygon Mainnet
```
0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
```

### Polygon Amoy Testnet
You'll need to use a mock USDC or faucet USDC for testing. Check [Polygon Faucet](https://faucet.polygon.technology/) or deploy a mock ERC20 token.

## Frontend Integration Changes

### Before (POL Payment)
```javascript
// User sends POL directly
await controller.registerDomain(name, owner, duration, {
  value: ethers.parseEther("2.0") // 2 POL
});
```

### After (USDC Payment)
```javascript
// Step 1: Approve USDC spending
const price = await priceOracle.getPrice(nameHash, name, duration);
await usdcToken.approve(controller.address, price);

// Step 2: Register domain (no value sent)
await controller.registerDomain(name, owner, duration);
```

## Migration Steps for Existing Users

1. **Get USDC**: Users need to acquire USDC on Polygon
2. **Approve Controller**: Users must approve the PNSController contract to spend their USDC
3. **Register/Renew**: Call registration/renewal functions (no longer need to send POL)

## Deployment Instructions

### Set Environment Variables
```bash
# In .env file
USDC_TOKEN_ADDRESS=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359  # Polygon Mainnet
PNS_ADMIN=<your_admin_address>
PNS_TREASURY=<your_treasury_address>
PRIVATE_KEY=<your_private_key>
```

### Deploy Contracts
```bash
forge script script/DeployPNS.s.sol:DeployPNS --rpc-url polygon --broadcast --verify
```

## Testing

### Local Testing with Anvil
1. Deploy mock USDC token
2. Mint USDC to test accounts
3. Approve and test registration flows

### Example Test Flow
```solidity
// 1. Deploy mock USDC
MockUSDC usdc = new MockUSDC();

// 2. Mint USDC to user
usdc.mint(user, 1000 * 10**6); // 1000 USDC

// 3. User approves controller
vm.prank(user);
usdc.approve(address(controller), 100 * 10**6); // Approve 100 USDC

// 4. Register domain
vm.prank(user);
controller.registerDomain("test", user, 1); // 1 year
```

## Benefits of USDC Integration

1. **Stable Pricing**: Prices remain consistent regardless of POL price volatility
2. **User Familiarity**: USDC is widely recognized and trusted
3. **Better Accounting**: Treasury receives stable value, easier financial planning
4. **Cross-chain Compatible**: USDC exists on many chains, easier to expand
5. **No Refunds Needed**: Exact amounts transferred, no excess refund logic

## Important Notes

- ⚠️ **Breaking Change**: This is a breaking change. Existing frontend must be updated.
- ⚠️ **Approvals Required**: Users must approve USDC spending before transactions.
- ⚠️ **Gas Costs**: May be slightly higher due to ERC20 transfers (vs native transfers).
- ✅ **Backwards Incompatible**: Old deployment cannot be upgraded to this version without migration.

## Security Considerations

1. **Approval Management**: Users should only approve exact amounts or use permit() if available
2. **Reentrancy**: All functions still use `nonReentrant` modifier
3. **Access Control**: Admin roles unchanged, same security model
4. **Token Contract**: Using official USDC contract reduces risk of malicious token behavior

## Contact & Support

For questions or issues related to this migration, please contact the development team or open an issue on GitHub.
