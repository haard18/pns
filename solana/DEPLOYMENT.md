# PNS Anchor Program - Deployment & Setup Guide

Complete guide for building, testing, and deploying the Solana PNS Anchor program.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Build](#build)
3. [Local Testing](#local-testing)
4. [Devnet Deployment](#devnet-deployment)
5. [Mainnet Deployment](#mainnet-deployment)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## Environment Setup

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup update
```

### 2. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
export PATH="/Users/hardy/.local/share/solana/install/active_release/bin:$PATH"
```

Verify installation:
```bash
solana --version
solana config get
```

### 3. Install Anchor

```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked
anchor --version
```

### 4. Set Up Solana CLI Config

For Devnet:
```bash
solana config set --url https://api.devnet.solana.com
solana config set --keypair ~/.config/solana/devnet-keypair.json
```

For Mainnet:
```bash
solana config set --url https://api.mainnet-beta.solana.com
solana config set --keypair ~/.config/solana/mainnet-keypair.json
```

### 5. Get Devnet SOL (for testing)

```bash
solana airdrop 2 --url devnet
```

## Build

### Clone and Navigate to Project

```bash
cd /Users/hardy/Developer/scalper/nameservice/solana
```

### Build the Program

```bash
anchor build
```

**Output:**
- `target/deploy/pns_anchor.so` - Compiled program
- `target/idl/pns_anchor.json` - IDL specification
- `target/types/pns_anchor.ts` - TypeScript types

### Generate Program ID (First Time Only)

```bash
solana-keygen new --outfile target/deploy/pns_anchor-keypair.json
solana address -k target/deploy/pns_anchor-keypair.json
```

**Save the output** - this is your program ID!

Example:
```
JA4xC8Yx2q2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x
```

### Update Program ID

1. Update `src/lib.rs`:
```rust
declare_id!("JA4xC8Yx2q2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x");
```

2. Update `Anchor.toml`:
```toml
[programs.devnet]
pns_anchor = "JA4xC8Yx2q2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x"
```

3. Rebuild:
```bash
anchor build
```

## Local Testing

### Start Local Validator

```bash
solana-test-validator --url devnet
```

Leave this running in a separate terminal.

### Run Tests

```bash
anchor test --skip-local-validator
```

**Expected Output:**
```
✓ Initializes registry
✓ Registers a domain
✓ Renews a domain
✓ Transfers a domain
✓ Sets resolver
```

### View Logs

```bash
tail -f test-ledger/validator.log
```

## Devnet Deployment

### 1. Set Devnet Configuration

```bash
solana config set --url https://api.devnet.solana.com
```

### 2. Verify Airdrop

```bash
solana airdrop 2 --url devnet
solana balance --url devnet
```

### 3. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

**Output Example:**
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: JA4xC8Yx2q2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x
Program Id: JA4xC8Yx2q2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x
Deployment successful. Completed in 15s.
```

### 4. Verify Deployment

```bash
# Check program exists
solana program show JA4xC8Yx2q2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x --url devnet

# Get program info
solana account JA4xC8Yx2q2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x --url devnet

# Check program deployment size
solana program show JA4xC8Yx2q2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x2Y2x --url devnet | grep "Size"
```

### 5. Initialize Registry on Devnet

```bash
# Create a TypeScript script (scripts/init-devnet.ts)
# Or use CLI tools to call the initialize instruction
```

## Mainnet Deployment

### ⚠️ Prerequisites

- [ ] Full security audit completed
- [ ] Comprehensive testing on Devnet passed
- [ ] Upgrade authority decided (multisig recommended)
- [ ] Sufficient SOL for deployment (~2 SOL)

### 1. Set Mainnet Configuration

```bash
solana config set --url https://api.mainnet-beta.solana.com
solana config set --keypair ~/.config/solana/mainnet-keypair.json
```

### 2. Check Mainnet Balance

```bash
solana balance --url mainnet
```

Must be at least 2 SOL.

### 3. Deploy to Mainnet

```bash
anchor deploy --provider.cluster mainnet
```

### 4. Verify Deployment

```bash
solana program show YOUR_PROGRAM_ID --url mainnet
```

### 5. Update Backend Configuration

Update `backend/.env`:
```env
SOLANA_PROGRAM_ID=YOUR_PROGRAM_ID
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Verification

### Check Program on Explorer

**Devnet:**
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet

**Mainnet:**
https://explorer.solana.com/address/YOUR_PROGRAM_ID

### Inspect Program Account

```bash
# Show program details
solana program show YOUR_PROGRAM_ID --url devnet

# Get program authority
solana account YOUR_PROGRAM_ID --url devnet | grep "Authority:"
```

### Test Instructions

Create a test script to verify all instructions work:

```bash
# Create test-mainnet.sh
#!/bin/bash

PROGRAM_ID="YOUR_PROGRAM_ID"
RPC_URL="https://api.devnet.solana.com"

# Test initialize
echo "Testing initialize..."
# Add test code

# Test registerDomain
echo "Testing registerDomain..."
# Add test code

# Test renewDomain
echo "Testing renewDomain..."
# Add test code

echo "All tests passed!"
```

## Troubleshooting

### Build Errors

**Error:** `error: could not compile 'pns_anchor'`

**Solution:**
```bash
# Clean build
cargo clean
anchor build

# Update dependencies
cargo update
anchor build
```

### Deployment Errors

**Error:** `Error: Instruction expected 2 accounts, got 1`

**Solution:**
- Check `Anchor.toml` has correct program ID
- Verify all account seeds in context match instruction constraints

**Error:** `Error: Account is not signer`

**Solution:**
- Ensure signer accounts marked with `#[account(... signer)]` in context
- Pass keypair in `signers` array in client code

### Runtime Errors

**Error:** `Error: Domain is not available`

**Solution:**
- Check if domain already registered and not expired
- For re-registration, wait for expiration time to pass

**Error:** `Error: Unauthorized`

**Solution:**
- Verify caller is domain owner
- Check signer matches domain owner in instruction

### Connection Issues

**Error:** `Error: Client network request failed`

**Solution:**
```bash
# Verify RPC endpoint is accessible
curl https://api.devnet.solana.com

# Check Solana CLI config
solana config get

# Try different RPC endpoint
solana config set --url https://devnet.rpcpool.com
```

### Insufficient Funds

**Error:** `Error: Insufficient funds for transaction`

**Solution:**
```bash
# Airdrop more SOL
solana airdrop 5 --url devnet

# Check balance
solana balance --url devnet
```

## Quick Reference Commands

```bash
# Build
anchor build

# Test locally
solana-test-validator
anchor test --skip-local-validator

# Deploy devnet
anchor deploy --provider.cluster devnet

# Check deployment
solana program show YOUR_PROGRAM_ID --url devnet

# View program info
solana account YOUR_PROGRAM_ID --url devnet

# Get program balance
solana account YOUR_PROGRAM_ID --url devnet | grep "Balance:"

# Initialize registry
# (Use TypeScript client or CLI tools)
```

## Next Steps

1. ✅ Build program
2. ✅ Test on local validator
3. ✅ Deploy to Devnet
4. ✅ Test on Devnet
5. → Update backend with program ID
6. → Integrate with frontend
7. → Audit (before mainnet)
8. → Deploy to Mainnet

## Support

For issues:
1. Check Solana docs: https://docs.solana.com
2. Check Anchor docs: https://www.anchor-lang.com
3. Check Solana Explorer: https://explorer.solana.com
