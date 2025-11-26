# 🚀 PNS Quickstart Guide - Complete Setup

A complete step-by-step guide to get the Polygon Name Service (PNS) running locally.

---

## 📋 Prerequisites

Before starting, ensure you have installed:

- **Node.js** (v18+): [nodejs.org](https://nodejs.org)
- **Git**: `git --version`
- **Foundry** (for contracts): `curl -L https://foundry.paradigm.xyz | bash`
- **Anvil** (for local Polygon): Usually comes with Foundry

### Verify Prerequisites
```bash
node --version       # v18.0.0 or higher
npm --version        # 9.0.0 or higher
git --version        # 2.0.0 or higher
forge --version      # 0.2.0 or higher
anvil --version      # 0.1.0 or higher
```

---

## 🎯 Quick Start (5 minutes)

### Option A: Automated Setup (Recommended)
```bash
cd /Users/hardy/Developer/scalper/nameservice
bash start-local-all.sh
```
This starts all services with one command. Skip to "Testing the System" below.

### Option B: Manual Setup (Detailed)
Follow the step-by-step guide below.

---

## 📦 Step-by-Step Manual Setup

### STEP 1: Deploy Smart Contracts (Polygon on Anvil)

```bash
# Navigate to contracts directory
cd /Users/hardy/Developer/scalper/nameservice/contracts

# Terminal 1: Start Anvil (local Polygon)
anvil --reset

# Keep this terminal running. You should see:
# Listening on http://127.0.0.1:8545
```

In a new terminal:
```bash
# Terminal 2: Deploy contracts
cd /Users/hardy/Developer/scalper/nameservice/contracts
chmod +x deploy.sh
./deploy.sh
```

**Expected Output:**
```
🚀 Deploying PNS contracts to Anvil...
✓ PNSRegistry deployed: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✓ PNSRegistrar deployed: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
✓ PNSResolver deployed: 0x0B306BF915C4d645ff596e81930CF6512e64e64E
✓ PNSController deployed: 0xC5a5C42992dECbae36851359345FE25997F5C8d1
✓ PNSPriceOracle deployed: 0xE8f2EcC58DeA96b59a0dE5e1b3BcbD89a46d3DA8
✓ PNSDomainNFT deployed: 0xf165De531d3C4d4a18628520ea99dEbe4b26e90D
```

**Save these contract addresses** - you'll need them for the backend!

---

### STEP 2: Configure Backend

```bash
# Navigate to backend
cd /Users/hardy/Developer/scalper/nameservice/backend

# Copy environment template
cp .env.example .env

# Edit .env with contract addresses from Step 1
nano .env  # or use your preferred editor
```

**Update these values in `.env`:**
```env
PORT=3000
NODE_ENV=development

# Polygon - from deploy output
POLYGON_RPC_URL=http://localhost:8545
POLYGON_CHAIN_ID=31337
POLYGON_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
POLYGON_REGISTRAR_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
POLYGON_CONTROLLER_ADDRESS=0xC5a5C42992dECbae36851359345FE25997F5C8d1
POLYGON_RESOLVER_ADDRESS=0x0B306BF915C4d645ff596e81930CF6512e64e64E
POLYGON_PRICE_ORACLE_ADDRESS=0xE8f2EcC58DeA96b59a0dE5e1b3BcbD89a46d3DA8
POLYGON_NFT_ADDRESS=0xf165De531d3C4d4a18628520ea99dEbe4b26e90D

# Admin account (from anvil output, usually first account)
ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efb47b534f1dccf8529

# CORS
CORS_ORIGIN=*

# Database (optional for now)
DATABASE_URL=postgresql://localhost:5432/pns

# Redis (optional for now)
REDIS_URL=redis://localhost:6379
```

---

### STEP 3: Install & Build Backend

```bash
# Terminal 3: Backend setup
cd /Users/hardy/Developer/scalper/nameservice/backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Expected output:
# npm notice up to date, audited 65 packages
# (no errors)
```

---

### STEP 4: Start Backend API

```bash
# Same terminal, start the server
npm run dev

# Expected output:
# 🚀 Server running on port 3000
# 📡 Polygon RPC: http://localhost:8545
# 📚 API Docs: http://localhost:3000/
```

**Keep this running** - this is your API server.

---

### STEP 5: Test the System

Open a new terminal and test the API:

```bash
# Terminal 4: Testing

# 1️⃣ Health check
curl http://localhost:3000/api/health
# Should return: {"success":true,"data":{"status":"healthy",...}...}

# 2️⃣ Check available domain
curl "http://localhost:3000/api/available/example"
# Should return: {"success":true,"data":{"name":"example","available":true}...}

# 3️⃣ Get pricing
curl "http://localhost:3000/api/price?chain=polygon&name=myname&duration=31536000"
# Should return: {"success":true,"data":{"price":"...","currency":"ETH","chain":"polygon"}...}

# 4️⃣ Register domain (simulated)
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "polygon",
    "name": "testdomain",
    "owner": "0x1234567890123456789012345678901234567890",
    "duration": 31536000
  }'
```

✅ All tests pass? Great! Your system is running.

---

## 🏗️ Architecture Overview

```
Your Local System:
┌────────────────────────────────────────┐
│                                        │
│  Terminal 1: Anvil (Port 8545)         │
│  ├─ Local Polygon blockchain           │
│  └─ Smart Contracts running            │
│                                        │
│  Terminal 2: Deploy Script             │
│  └─ Deployed 6 contracts               │
│                                        │
│  Terminal 3: Backend (Port 3000)       │
│  ├─ Express.js API                     │
│  ├─ Connected to Anvil                 │
│  └─ Ready for requests                 │
│                                        │
│  Terminal 4: Testing                   │
│  └─ curl commands to API               │
│                                        │
└────────────────────────────────────────┘
```

---

## 📡 API Endpoints

Once the backend is running, you have access to:

### 1. **Health Check**
```bash
GET /api/health
# Response: Server status
```

### 2. **Check Domain Availability**
```bash
GET /api/available/:name
curl "http://localhost:3000/api/available/example"
```

### 3. **Get Domain Price**
```bash
GET /api/price?chain=polygon&name=NAME&duration=SECONDS
curl "http://localhost:3000/api/price?chain=polygon&name=myname&duration=31536000"
```

### 4. **Register Domain**
```bash
POST /api/register
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "polygon",
    "name": "mynewdomain",
    "owner": "0xYOUR_ADDRESS",
    "duration": 31536000,
    "resolver": "0xRESOLVER_ADDRESS"
  }'
```

### 5. **Renew Domain**
```bash
POST /api/renew
curl -X POST http://localhost:3000/api/renew \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "polygon",
    "name": "existingdomain",
    "duration": 31536000
  }'
```

### 6. **Get User's Domains**
```bash
GET /api/domains/:address
curl "http://localhost:3000/api/domains/0xYOUR_ADDRESS"
```

### 7. **Get Domain Info**
```bash
GET /api/domain/:name?chain=polygon
curl "http://localhost:3000/api/domain/example?chain=polygon"
```

---

## 🧪 Testing Checklist

After setup, verify everything works:

- [ ] Anvil running (Terminal 1)
- [ ] Contracts deployed with addresses
- [ ] Backend compiles without errors
- [ ] Backend server starts on port 3000
- [ ] GET /api/health returns 200
- [ ] GET /api/available/testname returns success
- [ ] GET /api/price returns success
- [ ] POST /api/register can be called

---

## 🛠️ Common Commands

```bash
# Backend
cd backend
npm install              # Install dependencies
npm run build            # Compile TypeScript
npm run dev              # Start dev server
npm run lint             # Check code quality

# Contracts
cd contracts
anvil --reset            # Start Anvil
./deploy.sh              # Deploy contracts
forge test               # Run tests

# Check Anvil
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## 🚨 Troubleshooting

### "Port 3000 already in use"
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### "Cannot connect to Polygon RPC"
```bash
# Check Anvil is running
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}'

# If it fails, restart Anvil:
pkill anvil
anvil --reset
```

### "Contract addresses not found"
```bash
# Check deploy.sh output again
cd contracts
./deploy.sh

# Copy all addresses to .env file
```

### "npm install fails"
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install

# If still fails, update npm
npm install -g npm@latest
```

### "TypeScript compilation errors"
```bash
# Ensure Node version is correct
node --version  # Should be v18+

# Update TypeScript
npm install -g typescript@latest

# Rebuild
npm run build
```

---

## 📁 Project Structure Quick Reference

```
nameservice/
├── contracts/          ← Smart Contracts (Solidity)
│   ├── src/           # 6 contract files
│   ├── deploy.sh      # Run to deploy
│   └── README.md
│
├── backend/           ← API Server (Node.js/TypeScript)
│   ├── src/
│   │   ├── index.ts   # Express server
│   │   ├── routes/    # API endpoints
│   │   └── services/  # Business logic
│   ├── .env           # Configuration
│   ├── package.json
│   └── README.md
│
├── solana/            ← Solana program (commented out)
│
└── QUICKSTART.md      ← This file
```

---

## 🎓 Understanding the System

### What are the 6 Contracts?
1. **PNSRegistry** - Stores domain ownership
2. **PNSRegistrar** - Handles registration logic
3. **PNSResolver** - Resolves addresses
4. **PNSController** - Access control
5. **PNSPriceOracle** - Dynamic pricing
6. **PNSDomainNFT** - Mints NFTs for domains

### What does the Backend do?
- Exposes REST API for frontend
- Connects to smart contracts
- Validates requests
- Manages pricing
- Logs activity

### How does a domain registration work?
1. User calls `POST /api/register`
2. Backend validates the request
3. Backend calls smart contract
4. Smart contract updates registry
5. NFT is minted
6. Backend returns transaction hash

---

## 🚀 Next Steps

### Development
```bash
# Make changes to contracts
cd contracts
# Edit *.sol files
forge test              # Run tests
./deploy.sh             # Redeploy

# Make changes to backend
cd backend
# Edit src/**/*.ts files
npm run build           # Recompile
npm run dev             # Restart server (auto-reload with tsx watch)
```

### Production Deployment
- See `COMPLETE_IMPLEMENTATION.md` for mainnet deployment
- Set up monitoring and logging
- Configure environment variables
- Deploy to production servers

### Adding Features
See `README.md` for the development workflow.

---

## 📞 Support

### Documentation
- `README.md` - Full overview
- `COMPLETE_IMPLEMENTATION.md` - Technical details
- `GETTING_STARTED.md` - Detailed setup guide
- `start-local-all.sh` - Automated setup script

### Code Documentation
- Each file has inline comments
- Type definitions in `backend/src/types/index.ts`
- Contract ABIs in `backend/src/idl/`

---

## ✅ Verification Checklist

Run these commands to verify everything is working:

```bash
# 1. Check Anvil
curl -s http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' \
  | jq .

# 2. Check Backend
curl -s http://localhost:3000/api/health | jq .

# 3. Check Available Domain
curl -s "http://localhost:3000/api/available/test" | jq .

# 4. See all endpoints
curl -s http://localhost:3000 | jq .
```

All should return JSON responses with `"success": true`.

---

## 🎉 Success!

If you've made it this far and all tests pass:

✅ **Polygon contracts are deployed**
✅ **Backend API is running**
✅ **System is fully operational**

You're ready to:
- Develop new features
- Integrate with a frontend
- Deploy to testnet
- Prepare for mainnet

---

## 📊 Performance Tips

### Speed up npm install
```bash
npm install --legacy-peer-deps
```

### Speed up TypeScript compilation
```bash
npm install -g typescript@latest
```

### Monitor Anvil
```bash
# In a separate terminal
cast rpc eth_blockNumber
```

### Clear cache before rebuilding
```bash
rm -rf node_modules
npm cache clean --force
npm install
npm run build
```

---

## 🔐 Security Notes

- Never commit `.env` with real private keys
- Use different private keys for testing
- Keep contract addresses in version control
- Review smart contracts before deployment
- Use testnet before mainnet

---

## 📈 What's Next?

1. **Familiarize with the code** - Read through the contracts and services
2. **Create a frontend** - Connect to the API from a web/mobile app
3. **Write tests** - Add integration and unit tests
4. **Optimize gas** - Profile contract execution
5. **Plan deployments** - Set up CI/CD for automated testing and deployment

---

**Last Updated**: November 26, 2025
**Status**: ✅ Ready for development
**Next Step**: Start the system and test the APIs!
