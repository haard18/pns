# Complete System Setup Guide

This guide will help you set up and run the entire PNS (Polygon Name Service) system locally - contracts, backend, and frontend.

## Prerequisites

- Node.js 18+ and npm/yarn
- Solidity knowledge (optional)
- MetaMask or compatible Web3 wallet browser extension
- Terminal/Command line familiarity

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)                     │
│              Running on http://localhost:5173                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ (HTTP API Calls)
┌─────────────────────────────────────────────────────────────┐
│              Backend (Node.js/Express)                       │
│              Running on http://localhost:3000                │
│                    /api/pns/* endpoints                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ (Web3.js / Ethers.js)
┌─────────────────────────────────────────────────────────────┐
│         Smart Contracts (Solidity on Polygon)                │
│              Running on http://127.0.0.1:8545                │
│                  (Anvil Local Blockchain)                    │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Start Local Blockchain (Anvil)

Open **Terminal 1**:

```bash
cd /Users/hardy/Developer/scalper/nameservice

# Start Anvil with 10 test accounts
anvil --fork-url https://polygon-rpc.com --chain-id 137

# Note: Anvil will show account addresses and private keys
# Keep this terminal open - it's your blockchain
```

You should see:
```
Listening on http://127.0.0.1:8545
```

**Available Test Accounts:**
- Copy any of the displayed private keys
- Add to MetaMask: Settings → Networks → Add Network → Custom RPC
  - Network Name: Anvil Local
  - RPC URL: http://127.0.0.1:8545
  - Chain ID: 137
  - Currency: ETH (or MATIC)

---

## Step 2: Deploy Smart Contracts

Open **Terminal 2**:

```bash
cd /Users/hardy/Developer/scalper/nameservice/contracts

# Deploy contracts to local Anvil instance
./deploy.sh

# Or manually with Forge:
forge script script/DeployPNS.s.sol:DeployPNS --rpc-url http://127.0.0.1:8545 --broadcast

# You'll see deployed contract addresses - COPY THESE!
# Example output:
# Registry deployed at: 0x1234...
# Registrar deployed at: 0x5678...
# Resolver deployed at: 0x9abc...
# Controller deployed at: 0xdef0...
```

---

## Step 3: Configure Backend

Open **Terminal 2** (or after deployment completes):

```bash
cd /Users/hardy/Developer/scalper/nameservice/backend

# 1. Install dependencies
npm install

# 2. Create/Update .env file with deployed contract addresses
cat > .env << 'EOF'
PORT=3000
POLYGON_RPC_URL=http://127.0.0.1:8545
REGISTRY_ADDRESS=0x[copied from deploy]
REGISTRAR_ADDRESS=0x[copied from deploy]
RESOLVER_ADDRESS=0x[copied from deploy]
CONTROLLER_ADDRESS=0x[copied from deploy]
PRIVATE_KEY=0x[copied from Anvil account]
NODE_ENV=development
EOF

# 3. Compile TypeScript
npm run build

# 4. Start backend server
npm start

# You should see:
# PNS Backend Server running on http://localhost:3000
```

**Expected Output:**
```
✓ Backend server listening on port 3000
✓ Connected to Polygon RPC at http://127.0.0.1:8545
✓ Registry contract connected
✓ API routes initialized
```

---

## Step 4: Configure Frontend

Open **Terminal 3**:

```bash
cd /Users/hardy/Developer/scalper/nameservice/client

# 1. Install dependencies
npm install

# 2. Create .env.local if it doesn't exist
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3000/api
VITE_POLYGON_RPC=http://127.0.0.1:8545
EOF

# 3. Start frontend dev server
npm run dev

# You should see:
# VITE v4.x.x  ready in 234ms
# ➜  Local:   http://localhost:5173/
```

**Expected Output:**
```
  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## Step 5: Test in Browser

1. Open **http://localhost:5173** in your browser
2. Install **MetaMask** extension (if not already)
3. Connect MetaMask to your local Anvil network
4. Import a test account from Anvil (use private key)
5. Add some test ETH to your account:
   ```
   # In Anvil terminal, it shows initial balances: 10000 ETH per account
   # Or send ETH using another Anvil account
   ```

---

## Testing User Flows

### Flow 1: Search & Check Domain Availability

1. Click on the search bar on homepage
2. Enter a domain name: `myname` (without .poly)
3. Click "Search"
4. You should see availability status and price

### Flow 2: Register a Domain

1. After searching, click "Register Now"
2. Select number of years (1-10)
3. Choose payment method (ETH or USDC)
4. Click "Confirm"
5. Approve MetaMask transaction
6. Wait for transaction confirmation
7. Redirected to profile page

### Flow 3: View Your Domains

1. Click "Profile" or navigate to `/domains`
2. See all your registered domains
3. Click on a domain to manage it

### Flow 4: Renew a Domain

1. Go to `/manage/yourname.poly`
2. Click "Renew Domain"
3. Approve MetaMask transaction
4. Domain expiration updated

---

## Troubleshooting

### Issue: "Cannot connect to blockchain"
**Solution:**
- Ensure Anvil is running on Terminal 1
- Check RPC URL is http://127.0.0.1:8545 (not https://)
- Verify port 8545 is not blocked

### Issue: "Contract not found at address"
**Solution:**
- Redeploy contracts: `forge script script/DeployPNS.s.sol:DeployPNS --rpc-url http://127.0.0.1:8545 --broadcast --private-key 0x...`
- Update backend .env with new addresses
- Restart backend server

### Issue: "MetaMask network not found"
**Solution:**
1. In MetaMask, click Add Network
2. Fill in:
   - Network Name: Anvil Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 137
   - Currency: ETH
3. Save and switch to this network

### Issue: "Insufficient funds"
**Solution:**
- Import multiple Anvil test accounts
- Each has 10,000 ETH for testing
- Check MetaMask account balance

### Issue: "API returns 500 error"
**Solution:**
- Check backend console for errors
- Verify contract addresses in .env match deployed ones
- Check Anvil is still running

---

## Monitoring & Debugging

### View Backend Logs
```bash
# Terminal where backend is running - check console output
# Should show all API requests and blockchain interactions
```

### View Anvil Blockchain Activity
```bash
# Terminal where Anvil is running - shows all transactions
# Example: "eth_call", "eth_sendTransaction", etc.
```

### View Frontend Logs
```bash
# Browser DevTools → Console (F12)
# Shows API calls, component renders, errors
```

### Test API Endpoints Directly

```bash
# Check domain availability
curl http://localhost:3000/api/pns/check-availability \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "myname"}'

# Get domain price
curl http://localhost:3000/api/pns/get-price \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "myname", "duration": 1}'

# Get user domains
curl http://localhost:3000/api/pns/user-domains/0x1234567890123456789012345678901234567890
```

---

## Development Commands

### Backend
```bash
cd backend

# Development (watch mode)
npm run dev

# Build
npm run build

# Run tests
npm test

# Linting
npm run lint
```

### Frontend
```bash
cd client

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

### Contracts
```bash
cd contracts

# Compile
forge build

# Test
forge test

# Deploy
forge script script/DeployPNS.s.sol:DeployPNS --rpc-url http://127.0.0.1:8545 --broadcast

# View gas estimates
forge test --gas-report
```

---

## Production Deployment

### For Polygon Mumbai Testnet

```bash
# 1. Get testnet RPC URL from Alchemy/Infura
# 2. Get testnet ETH from faucet: https://faucet.polygon.technology/

# 3. Deploy contracts
forge script script/DeployPNS.s.sol:DeployPNS \
  --rpc-url https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY \
  --broadcast \
  --private-key YOUR_PRIVATE_KEY

# 4. Update backend .env with Mumbai RPC and contract addresses

# 5. Deploy backend to cloud (AWS, Railway, etc.)

# 6. Update frontend .env with production API URL

# 7. Deploy frontend to Vercel/Netlify
```

---

## Summary

You now have a complete, functional PNS system running locally:

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | http://localhost:5173 | ✅ Running |
| Backend | http://localhost:3000 | ✅ Running |
| Blockchain | http://127.0.0.1:8545 | ✅ Running |
| Smart Contracts | Deployed | ✅ Deployed |
| MetaMask | Connected | ✅ Connected |

Start with the frontend and explore all the features!

---

## Next Steps

1. **Read Documentation**
   - `/QUICKSTART.md` - Quick reference guide
   - `/QUICK_REFERENCE.md` - API reference
   - `/FRONTEND_INTEGRATION.md` - Frontend architecture
   - `/COMPLETE_IMPLEMENTATION.md` - Implementation details

2. **Explore Code**
   - `backend/src/services/pns.service.ts` - Core business logic
   - `client/src/pages/` - Frontend pages
   - `contracts/src/` - Smart contracts

3. **Modify & Extend**
   - Add more domain TLDs
   - Customize pricing model
   - Add marketplace features
   - Implement auctions

4. **Deploy to Production**
   - Choose deployment platform
   - Set up CI/CD pipeline
   - Configure production database
   - Deploy to mainnet

Happy coding! 🚀
