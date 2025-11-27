# PNS Quick Start Guide

## 🚀 Running the Complete System

### 1. Start Anvil (Local Blockchain)
```bash
cd contracts
anvil
```

### 2. Deploy Contracts
```bash
# In a new terminal
cd contracts
./deploy.sh

# Copy the contract addresses from the output
```

### 3. Configure Backend
```bash
cd backend

# Update .env with contract addresses from deployment
# Then start the server
npm install
npm run build
npm run dev
```

### 4. Configure Frontend
```bash
cd client

# Update .env.local with contract addresses
# Then start the dev server
npm install
npm run dev
```

### 5. Connect MetaMask
- Network: Localhost 8545
- Chain ID: 31337
- Import test account from Anvil

## 📝 Testing Registration

1. Open http://localhost:5173
2. Connect MetaMask
3. Go to "Register Domain"
4. Enter domain name
5. Click "Confirm"
6. Approve in MetaMask
7. Wait for confirmation

## 🔍 Verify Transaction

```bash
# Check transaction was recorded
curl http://localhost:3000/api/transactions/all

# Check domain ownership
curl "http://localhost:3000/api/domain/YOURNAME?chain=polygon"
```

## 📂 Key Files

### Frontend
- `client/src/config/contractConfig.ts` - Contract addresses & ABIs
- `client/src/hooks/useContracts.ts` - Direct contract calls
- `client/src/hooks/useDomain.ts` - Domain operations
- `client/src/pages/RegisterDomain.tsx` - Registration UI

### Backend
- `backend/src/routes/transaction.routes.ts` - Transaction recording
- `backend/src/services/polygon.service.ts` - Contract integration

### Contracts
- `contracts/src/PNSController.sol` - Main user interface
- `contracts/src/PNSRegistrar.sol` - Registration logic
- `contracts/src/PNSRegistry.sol` - Domain storage
- `contracts/src/PNSResolver.sol` - Record storage

## ✅ What's Working

- ✅ Direct frontend-to-contract integration
- ✅ Transaction recording in database
- ✅ Ownership verification (contracts + backend)
- ✅ Secure registration flow
- ✅ All critical vulnerabilities fixed

## 🔧 Environment Variables

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:3000/api
VITE_POLYGON_RPC=http://127.0.0.1:8545
VITE_CONTROLLER_ADDRESS=0x... # From deployment
```

### Backend (.env)
```env
PORT=3000
POLYGON_RPC_URL=http://localhost:8545
PNS_CONTROLLER_ADDRESS=0x... # From deployment
ADMIN_PRIVATE_KEY=0xac09... # Anvil test key
```

## 🎯 Next Steps

1. Test complete registration flow
2. Verify transaction recording
3. Test record updates
4. Deploy to testnet (Mumbai)
5. Security audit
6. Mainnet deployment
