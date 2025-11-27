# Quick Setup & Testing Guide

## 1. Deploy the Contracts

```bash
cd /Users/hardy/Developer/scalper/nameservice/contracts

# Start Anvil if not already running
anvil --reset

# In another terminal, run the deployment
./deploy-complete.sh
```

The deployment script will output contract addresses. **Save these addresses!**

Example output:
```
📋 Contract Addresses:
  Registry:      0x5FbDB2315678afccb33f7461434AB9B267682B9f
  PriceOracle:   0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  Resolver:      0x9fE46736679d2D9a65F0992F2272dE9159a2cDAe
  Registrar:     0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
  Controller:    0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
  NFT:           0x2279B7A0a67DB372996a5FaB50D91eABC4F8a3A8
```

## 2. Load the Test Helper Commands

```bash
cd /Users/hardy/Developer/scalper/nameservice/contracts

# Source the helper script to load functions
source ./test-commands.sh

# Set up your contract addresses (from deployment output)
setup-vars \
  0x5FbDB2315678afccb33f7461434AB9B267682B9f \
  0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 \
  0x9fE46736679d2D9a65F0992F2272dE9159a2cDAe \
  0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 \
  0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

## 3. Test Commands

### Check if domains were registered

```bash
# Check who owns the 'alice' domain
check-owner alice

# Check who owns the 'bobby' domain
check-owner bobby

# Output should show:
# Owner of 'alice': 0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a
# Owner of 'bobby': 0x90F79bf6EB2c4f870365E785982E1f101E93b906
```

### Test domain registration

```bash
# Register a new domain 'charlie' owned by admin for 1 year
register charlie 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 1

# Check if it's available
check-available charlie

# Should output: Domain 'charlie' is NOT available (since we just registered it)
```

### Test availability checks

```bash
# Check if a domain is available
check-available available-domain
# Should output: Domain 'available-domain' is AVAILABLE

# Check expiration
check-expiration alice
# Should output the Unix timestamp and date
```

### Test resolver functions

```bash
# Set a text record (avatar)
set-text alice avatar https://avatar.example.com

# Get the text record
get-text alice avatar
# Should output: https://avatar.example.com

# Set Polygon address for a domain
set-polygon-addr alice 0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a

# Get the Polygon address
get-polygon-addr alice
# Should output: 0x3c44cdddb6a900c2cf0852ca0ce2380e3360a69a
```

### Test domain renewal

```bash
# Renew the alice domain for 2 more years
renew alice 2
```

## 4. Direct cast Commands (if you prefer)

If you want to use `cast` directly without the helper script:

```bash
# You need to set the environment variables first
export RPC_URL=http://localhost:8545
export CONTROLLER=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
export REGISTRY=0x5FbDB2315678afccb33f7461434AB9B267682B9f
export RESOLVER=0x9fE46736679d2D9a65F0992F2272dE9159a2cDAe

# Now you can use cast with the correct syntax:
cast call $CONTROLLER getDomainOwner string:bobby --rpc-url $RPC_URL

# Get domain expiration
cast call $CONTROLLER getDomainExpiration string:alice --rpc-url $RPC_URL

# Register a domain
cast send $CONTROLLER registerDomain string:test address:0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a uint256:1 \
  --rpc-url $RPC_URL --private-key 0x5de4111afa1a4b94908f83103db1fb50da4c89699e6dffb97ae4e8e89143a01b --value 10ether
```

## 5. Fixing the `cast` Syntax Error

The error you received:
```
error: invalid value 'getDomainOwner(string)' for '[TO]': invalid string length
```

**Root cause:** Shell quoting issue with `cast`

**Solution:** Use the new syntax where:
- Function signatures don't include parameter types in the name
- Parameters use type prefixes: `string:value`, `address:0x...`, `uint256:123`

**Wrong:**
```bash
cast call $CONTROLLER 'getDomainOwner(string)' 'bobby' --rpc-url $RPC_URL
```

**Correct:**
```bash
cast call $CONTROLLER getDomainOwner string:bobby --rpc-url $RPC_URL
```

## 6. Environment Variables for Persistent Setup

Create a `.env.test` file:

```bash
# .env.test
export RPC_URL=http://localhost:8545
export REGISTRY=0x5FbDB2315678afccb33f7461434AB9B267682B9f
export PRICE_ORACLE=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
export RESOLVER=0x9fE46736679d2D9a65F0992F2272dE9159a2cDAe
export REGISTRAR=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
export CONTROLLER=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
export NFT=0x2279B7A0a67DB372996a5FaB50D91eABC4F8a3A8
export ADMIN=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
export TREASURY=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
export USER1=0x3C44CdDdB6a900c2Cf0852ca0cE2380e3360a69a
export USER2=0x90F79bf6EB2c4f870365E785982E1f101E93b906
```

Then you can load it:
```bash
source .env.test
```

## 7. Troubleshooting

### "Contracts not configured" error
Make sure you ran `setup-vars` with the correct contract addresses from your deployment.

### "Domain not found" when checking owner
The domain hasn't been registered yet, or it was registered to a different address.

### Transaction fails with "Not authorized"
Make sure you're using the correct private key for the account that owns the domain.

### "Insufficient payment"
The payment amount is too low. The deploy script uses `--value 10ether` which should be enough for any domain.

## 8. What to Verify

- ✅ `alice` domain is owned by USER1
- ✅ `bobby` domain is owned by USER2
- ✅ New domain registration works
- ✅ Domain availability check works correctly
- ✅ Domain expiration timestamp is in the future
- ✅ Text records can be set and retrieved
- ✅ Polygon address resolution works
- ✅ Domain renewal extends expiration

## Files Modified

- `deploy-complete.sh` - Updated test command examples with correct `cast` syntax
- `test-commands.sh` - New interactive helper for testing (created)
- `QUICK_TEST_GUIDE.md` - This file (created)
