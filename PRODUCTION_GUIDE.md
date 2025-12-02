# PNS (Polygon Name Service) - Production Deployment Guide

## Architecture Overview

```
Frontend (React + Vite) 
    ↓ Direct Contract Calls
Smart Contracts (Polygon)
    ↓ Event Emissions
Backend (Event Indexer + API)
```

### Key Principles:
- **Frontend** → Calls contracts directly for ALL read/write operations
- **Backend** → Only indexes blockchain events + stores transaction history  
- **No backend blockchain writes** - Frontend handles all contract interactions

## Quick Start

### 1. Run Setup Script
```bash
# Make executable and run
chmod +x setup.sh
./setup.sh
```

### 2. Configure Environment
Update the generated `.env` files:
- `backend/.env` - Backend configuration
- `client/.env.local` - Frontend configuration  
- `contracts/.env` - Smart contract deployment

### 3. Deploy Smart Contracts
```bash
cd contracts
./deploy-amoy.sh     # Testnet
./deploy-polygon.sh  # Mainnet
```

### 4. Start Development
```bash
./start-dev.sh   # Start all services
./stop-dev.sh    # Stop all services
```

### 5. Build for Production
```bash
# Build frontend
cd client && pnpm run build

# Build backend
cd backend && npm run build

# Deploy using PM2, Docker, or your preferred method
```

## Environment Configuration

### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/pns_db
POLYGON_RPC_URL=https://polygon-rpc.com
REGISTRY_CONTRACT=0x...
INDEXER_SCAN_INTERVAL_MS=30000
```

### Frontend (.env.local)
```bash
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_WALLETCONNECT_PROJECT_ID=your-project-id
VITE_API_BASE_URL=https://api.yourpns.com/api
VITE_REGISTRY_ADDRESS=0x...
```

### Contracts (.env)
```bash
PRIVATE_KEY=your-deployer-private-key
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=your-api-key
```

## Production Deployment

### Option 1: Traditional Server

1. **Deploy Frontend:**
   ```bash
   cd client
   pnpm run build
   # Copy dist/ to your web server (nginx/apache)
   ```

2. **Deploy Backend:**
   ```bash
   cd backend
   npm run build
   pm2 start ecosystem.config.js
   ```

3. **Setup Database:**
   ```bash
   # PostgreSQL for production
   createdb pns_db
   # Update DATABASE_URL in backend/.env
   ```

### Option 2: Docker

```bash
docker-compose up -d
```

### Option 3: Cloud Platforms

- **Vercel** (Frontend) + **Railway/Render** (Backend)
- **Netlify** (Frontend) + **Heroku** (Backend)  
- **AWS S3/CloudFront** (Frontend) + **AWS ECS/EC2** (Backend)

## Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name yourpns.com;
    
    # Frontend
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring

### Health Checks
```bash
curl http://localhost:3001/api/health
./scripts/monitoring/health-check.sh
```

### System Statistics  
```bash
./scripts/monitoring/system-stats.sh
```

### Log Management
- Backend logs: `backend/logs/`
- PM2 logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`

## Database Backup

```bash
./scripts/backup/backup-db.sh
./scripts/backup/restore-db.sh backup_file.sql.gz
```

## Security Checklist

- [ ] Environment variables secured (no .env in git)
- [ ] Private keys encrypted/secured
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] CORS origins restricted
- [ ] Database access restricted
- [ ] Monitoring/alerting setup
- [ ] Regular backups scheduled

## Smart Contract Verification

```bash
cd contracts
forge verify-contract \
  --chain polygon \
  --constructor-args $(cast abi-encode "constructor(address)" $ADMIN_ADDRESS) \
  $CONTRACT_ADDRESS \
  src/PNSRegistry.sol:PNSRegistry \
  --etherscan-api-key $POLYGONSCAN_API_KEY
```

## Performance Optimization

### Frontend
- Code splitting with lazy loading
- Image optimization 
- CDN for static assets
- Bundle analysis: `pnpm run build --analyze`

### Backend
- Database indexing on frequently queried fields
- Response caching for static data
- Connection pooling
- Event indexer batch optimization

### Smart Contracts
- Gas optimization techniques applied
- Proxy pattern for upgradeability
- Event optimization for indexing

## Troubleshooting

### Common Issues

1. **Contract calls failing:**
   - Check RPC URL connectivity
   - Verify contract addresses in frontend config
   - Ensure wallet connected to correct network

2. **Backend indexer not syncing:**
   - Check RPC URL in backend config
   - Verify contract addresses match deployed contracts
   - Check logs for specific errors: `tail -f backend/logs/combined.log`

3. **Frontend build errors:**
   - Clear cache: `rm -rf node_modules && pnpm install`
   - Check TypeScript errors
   - Verify all environment variables set

4. **Database connection issues:**
   - Verify DATABASE_URL format
   - Check PostgreSQL service status
   - Test connection manually

### Debug Commands

```bash
# Check contract deployment
cd contracts && forge script script/DeployPNS.s.sol --rpc-url $POLYGON_RPC_URL

# Test backend health
curl http://localhost:3001/api/health

# Check frontend build
cd client && pnpm run build --mode development

# Monitor backend logs  
tail -f backend/logs/combined.log

# Check PM2 status
pm2 status
pm2 logs pns-backend
```

## Scaling Considerations

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Read replicas for database
- CDN for global distribution

### Vertical Scaling  
- Increase server resources
- Database performance tuning
- Event indexer optimization

### Caching Strategy
- Redis for session/temporary data
- Database query caching
- API response caching
- Frontend asset caching

## Support

- **Documentation:** Check individual README files in each directory
- **Logs:** Always check logs first for debugging
- **Health Endpoint:** `/api/health` for backend status
- **Contract Events:** Use block explorers to verify event emissions

Remember: This is an event-driven architecture where the frontend calls contracts directly and the backend only indexes events for efficient querying.