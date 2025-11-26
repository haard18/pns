# 📊 PNS System Quick Reference

## 🚀 Start Here: 5-Minute Setup

```bash
# Terminal 1: Contracts
cd contracts && anvil --reset

# Terminal 2: Deploy (in contracts directory)
chmod +x deploy.sh && ./deploy.sh

# Terminal 3: Backend
cd backend
cp .env.example .env
# Edit .env with deployed contract addresses
npm install && npm run build && npm run dev

# Terminal 4: Test
curl http://localhost:3000/api/health
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────┐
│  REST API (Express.js on Port 3000)            │
│  ├─ POST /register      (Register domains)     │
│  ├─ POST /renew         (Renew domains)        │
│  ├─ GET /price          (Get pricing)          │
│  ├─ GET /domains/:addr  (List user domains)    │
│  ├─ GET /domain/:name   (Get domain details)   │
│  ├─ GET /available/:name (Check availability) │
│  └─ GET /health         (Health check)         │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────▼──────────┐
        │  PNSService        │
        │  (Unified Logic)   │
        └─────────┬──────────┘
                  │
    ┌─────────────▼──────────────┐
    │  PolygonService            │
    │  (Smart Contracts via      │
    │   Ethers.js)               │
    └─────────────┬──────────────┘
                  │
         ┌────────▼─────────┐
         │ Anvil / Polygon  │
         │ Port: 8545       │
         └──────────────────┘
```

---

## 📦 Components

| Component | Location | Tech | Purpose |
|-----------|----------|------|---------|
| **Smart Contracts** | `contracts/src/` | Solidity | EVM-based domain registry |
| **Backend API** | `backend/src/` | TypeScript/Express | REST API for domain operations |
| **Local Chain** | Anvil | Foundry | Local Polygon for testing |
| **Configuration** | `backend/.env` | ENV vars | API configuration |

---

## 🔑 Key Files

### Backend Structure
```
backend/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── routes/pns.routes.ts  # API endpoints
│   ├── services/
│   │   ├── pns.service.ts    # Unified service logic
│   │   └── polygon.service.ts # Polygon-specific logic
│   ├── types/index.ts        # TypeScript type definitions
│   ├── utils/
│   │   ├── namehash.ts       # ENS-compatible hashing
│   │   └── logger.ts         # Logging utility
│   ├── config/index.ts       # Configuration loader
│   └── idl/pns_anchor.json  # Contract ABI
├── .env                      # Local configuration (DO NOT COMMIT)
├── .env.example             # Configuration template
├── package.json             # Dependencies
└── tsconfig.json           # TypeScript configuration
```

### Contract Addresses (from deploy.sh)
```
PNSRegistry:       0x5FbDB2315678afecb367f032d93F642f64180aa3
PNSRegistrar:      0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
PNSResolver:       0x0B306BF915C4d645ff596e81930CF6512e64e64E
PNSController:     0xC5a5C42992dECbae36851359345FE25997F5C8d1
PNSPriceOracle:    0xE8f2EcC58DeA96b59a0dE5e1b3BcbD89a46d3DA8
PNSDomainNFT:      0xf165De531d3C4d4a18628520ea99dEbe4b26e90D
```

---

## 🌐 API Examples

### 1. Health Check
```bash
curl http://localhost:3000/api/health

Response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 123.45
  },
  "timestamp": 1700000000
}
```

### 2. Check Availability
```bash
curl "http://localhost:3000/api/available/example"

Response:
{
  "success": true,
  "data": {
    "name": "example",
    "available": true
  },
  "timestamp": 1700000000
}
```

### 3. Get Price
```bash
curl "http://localhost:3000/api/price?chain=polygon&name=myname&duration=31536000"

Response:
{
  "success": true,
  "data": {
    "price": "0.0100",
    "currency": "ETH",
    "chain": "polygon",
    "priceWei": "10000000000000000"
  },
  "timestamp": 1700000000
}
```

### 4. Register Domain
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "polygon",
    "name": "mynewdomain",
    "owner": "0x1234567890123456789012345678901234567890",
    "duration": 31536000,
    "resolver": "0x0987654321098765432109876543210987654321"
  }'

Response:
{
  "success": true,
  "data": {
    "name": "mynewdomain",
    "chain": "polygon",
    "owner": "0x1234567890123456789012345678901234567890",
    "expires": 1731536000,
    "txHash": "0x1234...",
    "registeredAt": 1700000000
  },
  "timestamp": 1700000000
}
```

---

## ⚙️ Configuration (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Polygon RPC
POLYGON_RPC_URL=http://localhost:8545
POLYGON_CHAIN_ID=31337

# Contract Addresses (from deploy.sh)
POLYGON_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
POLYGON_REGISTRAR_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
POLYGON_CONTROLLER_ADDRESS=0xC5a5C42992dECbae36851359345FE25997F5C8d1
POLYGON_RESOLVER_ADDRESS=0x0B306BF915C4d645ff596e81930CF6512e64e64E
POLYGON_PRICE_ORACLE_ADDRESS=0xE8f2EcC58DeA96b59a0dE5e1b3BcbD89a46d3DA8
POLYGON_NFT_ADDRESS=0xf165De531d3C4d4a18628520ea99dEbe4b26e90D

# Admin (first Anvil account)
ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efb47b534f1dccf8529

# CORS
CORS_ORIGIN=*

# Optional: Database & Cache
DATABASE_URL=postgresql://localhost:5432/pns
REDIS_URL=redis://localhost:6379
```

---

## 🔄 Development Workflow

### Make Changes to Contracts
```bash
cd contracts

# Edit Solidity files
vim src/*.sol

# Test locally
forge test

# Redeploy
./deploy.sh

# Update backend .env with new addresses
```

### Make Changes to Backend
```bash
cd backend

# Edit TypeScript files
vim src/**/*.ts

# Rebuild
npm run build

# Restart with auto-reload
npm run dev
```

### Testing
```bash
# Test individual endpoint
curl "http://localhost:3000/api/available/testname"

# Use Postman/Insomnia for complex requests
# Or write integration tests
```

---

## 🚨 Common Issues & Fixes

### Issue: "Port 3000 already in use"
```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: "Cannot connect to Polygon RPC"
```bash
# Check Anvil is running
curl http://localhost:8545 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}'

# If not running, start it
cd contracts && anvil --reset
```

### Issue: "Contract not found" error
```bash
# Redeploy contracts
cd contracts
./deploy.sh

# Copy new addresses to backend/.env
```

### Issue: "npm install fails"
```bash
# Clear cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules

# Reinstall
npm install

# If still fails, update npm
npm install -g npm@latest
```

---

## 📊 What Each Service Does

### PNSService (Unified)
- Routes calls to appropriate chain
- Validates input
- Returns unified response format

### PolygonService
- Connects to Anvil via Ethers.js
- Calls smart contracts
- Manages gas and transactions
- Handles Polygon-specific logic

### Routes
- Validates HTTP requests
- Calls services
- Returns REST responses
- Handles errors

---

## 🧪 Testing Checklist

Run these to verify everything works:

```bash
# 1. Check Anvil
curl -s http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' | jq .

# 2. Check Backend
curl -s http://localhost:3000/api/health | jq .

# 3. Check Available Domain
curl -s "http://localhost:3000/api/available/test" | jq .

# 4. Get Price
curl -s "http://localhost:3000/api/price?chain=polygon&name=test&duration=31536000" | jq .
```

All should return `"success": true`.

---

## 📈 Performance Metrics

| Operation | Time | Cost |
|-----------|------|------|
| Health Check | <10ms | Free |
| Check Available | <50ms | Free |
| Get Price | <100ms | Free |
| Register Domain | <5s | Gas + service fee |
| Renew Domain | <5s | Gas + service fee |

---

## 🔐 Security Reminders

- ✅ Never commit `.env` with real keys
- ✅ Use testnet before mainnet
- ✅ Keep private keys in environment variables only
- ✅ Validate all user input
- ✅ Use rate limiting in production
- ✅ Enable HTTPS in production

---

## 📚 File Reference

| File | Purpose | Size |
|------|---------|------|
| `backend/src/index.ts` | Express server setup | 100 lines |
| `backend/src/routes/pns.routes.ts` | API endpoints | 295 lines |
| `backend/src/services/pns.service.ts` | Unified service | 140 lines |
| `backend/src/services/polygon.service.ts` | Polygon integration | 235 lines |
| `backend/src/types/index.ts` | Type definitions | 150 lines |
| `backend/src/utils/namehash.ts` | Domain hashing | 80 lines |
| `contracts/src/*.sol` | Smart contracts | 1500 lines |

---

## 🎯 Next Steps

1. **Run QUICKSTART.md** - Follow the step-by-step guide
2. **Test the API** - Use curl or Postman
3. **Explore the code** - Read through services
4. **Make changes** - Add features or modify behavior
5. **Deploy to testnet** - See deployment guides

---

## 📞 Quick Commands

```bash
# Backend development
cd backend
npm install              # Install deps
npm run build            # Compile
npm run dev              # Start with hot reload
npm run lint             # Check code

# Contracts
cd contracts
anvil --reset            # Start local chain
./deploy.sh              # Deploy contracts
forge test               # Run tests

# Testing
curl http://localhost:3000/api/health
curl "http://localhost:3000/api/available/test"

# Clean up
pkill anvil              # Stop Anvil
pkill node               # Stop Node process
lsof -i :3000            # Check what's using port 3000
```

---

**Last Updated**: November 26, 2025
**Status**: ✅ Ready to Use
**Solana Status**: ⏸️ Commented out (can be re-enabled later)
