# 🧪 Solana Local Testing Guide

This guide walks you through testing the entire Solana PNS program **locally** before touching devnet. This is the safest approach to catch bugs early.

## Prerequisites

```bash
# Check Rust is installed
rustc --version
cargo --version

# Check Solana CLI is installed
solana --version
solana-test-validator --version

# Check Anchor is installed
anchor --version

# If anything is missing, run:
# https://docs.solana.com/cli/install-solana-cli-tools
# https://rustup.rs/
# cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked
```

---

## Step 1: Start Local Solana Validator

**Terminal 1** - Start the validator:

```bash
# Kill any existing validators
pkill solana-test-validator

# Start fresh validator with sufficient funds
solana-test-validator \
  --ledger /tmp/solana-test-validator \
  --reset \
  --quiet
```

**What this does:**
- ✅ Starts a local blockchain on `http://localhost:8899`
- ✅ Resets the ledger (clean slate)
- ✅ Allocates funds to your keypair
- ✅ Runs silently (`--quiet`)

**Verify it's working:**
```bash
# New terminal window
solana config set --url http://localhost:8899
solana balance  # Should show some SOL
```

---

## Step 2: Build the Anchor Program

**Terminal 2** - In the solana directory:

```bash
cd /Users/hardy/Developer/scalper/nameservice/solana

# Build the program
anchor build

# You should see:
# ✨  Done
```

**What this does:**
- ✅ Compiles Rust code
- ✅ Generates TypeScript types
- ✅ Creates IDL (Interface Definition Language)
- ✅ Places compiled `.so` in `target/deploy/`

**If you get errors:**
```bash
# Update Rust toolchain
rustup update

# Clean and rebuild
cargo clean
anchor build --force
```

---

## Step 3: Run the Test Suite

**Still in Terminal 2:**

```bash
# Run tests against local validator
anchor test --skip-local-validator

# Expected output:
# ✨  Running 5 tests...
#   ✓ initialize (XXXms)
#   ✓ can register a domain (XXXms)
#   ✓ can renew a domain (XXXms)
#   ✓ can transfer a domain (XXXms)
#   ✓ can set resolver (XXXms)
# ✨  5 tests passed
```

**What this does:**
- ✅ Compiles and deploys program to local validator
- ✅ Runs 5 test cases
- ✅ Verifies all core functionality works
- ✅ Uses `--skip-local-validator` because we started it manually

**Test cases verify:**
1. ✅ Registry initialization
2. ✅ Domain registration
3. ✅ Domain renewal
4. ✅ Domain transfer
5. ✅ Setting resolver address

---

## Step 4: Manual Testing with TypeScript Client

**Terminal 3** - Test individual operations:

```bash
cd /Users/hardy/Developer/scalper/nameservice/solana

# Create a test script
cat > test-local.ts << 'EOF'
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import * as fs from "fs";

// Load IDL
const idl = JSON.parse(
  fs.readFileSync("./target/idl/pns_anchor.json", "utf8")
);

// Connect to local validator
const connection = new Connection("http://localhost:8899", "confirmed");

// Use default local keypair
const keypair = Keypair.generate(); // Or load from ~/.config/solana/id.json
const wallet = new Wallet(keypair);
const provider = new AnchorProvider(connection, wallet, {
  commitment: "processed",
});

const programId = new PublicKey("5kD5m3gyXcYeGKn9LK4heqzZJCKXtZSHnKgWnQ9sEN36");
const program = new Program(idl, programId, provider);

// Test function
async function testProgram() {
  try {
    console.log("🔌 Connected to local validator");
    console.log("📍 Program ID:", programId.toString());
    console.log("👤 User:", keypair.publicKey.toString());

    // Initialize registry
    const registryPda = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      programId
    )[0];

    console.log("\n📦 Initializing registry...");
    const initTx = await program.methods
      .initialize()
      .accounts({
        registry: registryPda,
        authority: keypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("✅ Init tx:", initTx);

    // Check registry was created
    const registry = await program.account.registry.fetch(registryPda);
    console.log("📊 Registry state:", registry);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testProgram();
EOF

# Run it
ts-node test-local.ts
```

---

## Step 5: Deploy to Local Validator (Manual)

If tests pass but you want to deploy fresh:

```bash
# Get your local keypair
solana address
# Output: GrN3ECTnGHZk1kzjw1TvXJBpJJUg8AeWBfMJTBhkKKvY (example)

# Deploy program
anchor deploy --provider.cluster localhost

# You should see:
# Deploy success!
# Program ID: <some-address>
```

**Get the new Program ID:**
```bash
solana address -k target/deploy/pns_anchor-keypair.json
```

---

## Step 6: Check Program on Local Chain

```bash
# Get program info
solana program show 5kD5m3gyXcYeGKn9LK4heqzZJCKXtZSHnKgWnQ9sEN36

# Check recent transactions
solana logs --limit 50

# Check account balances
solana balance
```

---

## 🧪 Full Local Testing Workflow

Here's the **complete flow** you should follow:

### Terminal 1 - Validator
```bash
pkill solana-test-validator
solana-test-validator --ledger /tmp/solana-test-validator --reset --quiet
```

### Terminal 2 - Build & Test
```bash
cd ~/Developer/scalper/nameservice/solana
anchor build
anchor test --skip-local-validator
```

### Terminal 3 - Inspect (Optional)
```bash
solana logs --url http://localhost:8899
# Watch the logs in real-time
```

---

## ✅ Success Criteria

**All tests should pass locally:**

```
✨  Running 5 tests...
  ✓ initialize (150ms)
  ✓ can register a domain (200ms)
  ✓ can renew a domain (180ms)
  ✓ can transfer a domain (190ms)
  ✓ can set resolver (170ms)

✨  5 tests passed
```

If you see any failures, debug:
```bash
# See detailed error output
anchor test --skip-local-validator 2>&1 | tee test-output.log

# Check program logs
solana logs --url http://localhost:8899
```

---

## Common Issues & Fixes

### ❌ "Cannot connect to validator"
```bash
# Kill any zombie validators
pkill -f solana-test-validator

# Start fresh
solana-test-validator --ledger /tmp/solana-test-validator --reset --quiet
```

### ❌ "Account does not have enough lamports"
```bash
# Request more SOL from airdrop
solana airdrop 10 --url http://localhost:8899
```

### ❌ "Program not found"
```bash
# Rebuild and redeploy
anchor build --force
anchor deploy --provider.cluster localhost
```

### ❌ "Anchor version mismatch"
```bash
# Use exact version
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked
```

---

## 🚀 Next: Move to Devnet

**Only when all local tests pass:**

1. Switch to devnet
   ```bash
   solana config set --url https://api.devnet.solana.com
   solana airdrop 5  # Get devnet SOL
   ```

2. Get fresh program ID
   ```bash
   solana-keygen new --outfile target/deploy/pns_anchor-keypair.json
   solana address -k target/deploy/pns_anchor-keypair.json
   ```

3. Update program ID in code
   ```rust
   // In solana/programs/pns_anchor/src/lib.rs
   declare_id!("YOUR_NEW_DEVNET_PROGRAM_ID");
   ```

4. Deploy to devnet
   ```bash
   anchor build
   anchor deploy --provider.cluster devnet
   ```

5. Update backend `.env`
   ```env
   SOLANA_PROGRAM_ID=YOUR_NEW_DEVNET_PROGRAM_ID
   SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

---

## 📊 Testing Checklist

- [ ] Local validator starts without errors
- [ ] `anchor build` completes successfully
- [ ] All 5 tests pass with `anchor test --skip-local-validator`
- [ ] No errors in `solana logs`
- [ ] Program account has correct data
- [ ] Can manually call `initialize` instruction
- [ ] Can manually call `register_domain` instruction
- [ ] Domain data persists after creation
- [ ] Transfer works correctly
- [ ] Renewal extends expiration time

---

## 🎯 Benefits of Local Testing

✅ **No gas fees** - Test as much as you want  
✅ **Instant feedback** - Test/fix/retest in minutes  
✅ **Safe debugging** - Errors won't affect devnet  
✅ **Reproducible** - Same conditions every time  
✅ **Learn Solana** - Understand how things work  
✅ **Catch bugs early** - Before devnet/mainnet  

---

## 📞 Helpful Commands Reference

```bash
# Start validator
solana-test-validator --ledger /tmp/solana --reset --quiet

# Kill validator
pkill solana-test-validator

# Build program
anchor build

# Run all tests
anchor test --skip-local-validator

# Check local balance
solana balance --url http://localhost:8899

# Get test SOL
solana airdrop 10 --url http://localhost:8899

# View logs in real-time
solana logs --url http://localhost:8899

# Show program info
solana program show <PROGRAM_ID> --url http://localhost:8899
```

---

**Status**: Ready for local testing  
**Time to test**: ~5-10 minutes per full cycle  
**Risk level**: Zero (everything is local)  

Ready to start testing locally? Follow the steps above! 🚀
