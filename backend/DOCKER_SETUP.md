# PNS Backend - Docker Setup Guide

This guide explains how to run the PNS Backend with PostgreSQL and Redis using Docker Compose.

## Architecture

The backend consists of three services:
1. **PostgreSQL** - Stores event logs, domains, and records
2. **Redis** - Caches data and tracks last scanned blockchain block
3. **Backend API** - Express server with event indexer

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured with contract addresses and RPC URL

## Quick Start

### 1. Start All Services

```bash
./start-docker.sh
```

Or manually:
```bash
docker-compose up -d
```

### 2. Check Service Status

```bash
docker-compose ps
```

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# PostgreSQL only
docker-compose logs -f postgres

# Redis only
docker-compose logs -f redis
```

### 4. Check Health

```bash
curl http://localhost:3000/health
```

## Management Commands

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Deletes all data)
```bash
docker-compose down -v
```

### Restart Backend Only
```bash
docker-compose restart backend
```

### Rebuild Backend (after code changes)
```bash
docker-compose up -d --build backend
```

### Access PostgreSQL CLI
```bash
docker exec -it pns-postgres psql -U postgres -d pns
```

### Access Redis CLI
```bash
docker exec -it pns-redis redis-cli
```

## Database Schema

The database is automatically initialized with:
- `domains` - Domain registry data
- `event_logs` - Blockchain event history
- `text_records` - Domain text records (social, etc.)
- `address_records` - Domain address records (crypto addresses)
- `indexer_metadata` - Indexer state

## Redis Keys

- `indexer:last_scanned_block` - Last processed blockchain block number
- `indexer:state` - Current indexer state
- `domain:{nameHash}` - Cached domain data (TTL: 1 hour)

## Environment Variables

Required in `.env`:
```env
# Polygon Configuration
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_CHAIN_ID=137

# Contract Addresses
POLYGON_REGISTRY_ADDRESS=0x...
POLYGON_RESOLVER_ADDRESS=0x...
POLYGON_CONTROLLER_ADDRESS=0x...
POLYGON_NFT_ADDRESS=0x...

# Indexer Configuration
DEPLOYMENT_BLOCK=79790269
INDEXER_SCAN_INTERVAL_MS=30000
INDEXER_BATCH_SIZE=5
INDEXER_ENABLED=true

# Auto-configured by Docker Compose (don't change)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pns
REDIS_URL=redis://redis:6379
```

## Troubleshooting

### Backend Fails to Start
1. Check if PostgreSQL and Redis are healthy:
   ```bash
   docker-compose ps
   ```

2. Check backend logs:
   ```bash
   docker-compose logs backend
   ```

3. Ensure `.env` file has valid RPC URL and contract addresses

### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker exec -it pns-postgres psql -U postgres -d pns -c "SELECT 1;"
```

### Redis Connection Issues
```bash
# Check Redis logs
docker-compose logs redis

# Test connection
docker exec -it pns-redis redis-cli ping
```

### Indexer Not Scanning
1. Check if indexer is enabled in `.env`:
   ```env
   INDEXER_ENABLED=true
   ```

2. Check last scanned block in Redis:
   ```bash
   docker exec -it pns-redis redis-cli GET indexer:last_scanned_block
   ```

3. Check backend logs for errors:
   ```bash
   docker-compose logs -f backend | grep -i error
   ```

## API Endpoints

Once running, the API is available at `http://localhost:3000`:

- `GET /health` - Health check with indexer status
- `GET /api/domains/:address` - Get domains owned by address
- `GET /api/domains/info/:nameOrHash` - Get domain information
- `GET /api/domains/search?q=query` - Search domains
- `GET /api/domains/expiring` - Get expiring domains
- `GET /api/domains/stats` - Get domain statistics

## Data Persistence

Data is persisted in Docker volumes:
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data (with AOF persistence)

To backup:
```bash
# PostgreSQL
docker exec pns-postgres pg_dump -U postgres pns > backup.sql

# Redis
docker exec pns-redis redis-cli SAVE
docker cp pns-redis:/data/dump.rdb redis-backup.rdb
```

## Production Deployment

For production:

1. **Use strong passwords** in `docker-compose.yml`
2. **Limit exposed ports** or use reverse proxy
3. **Enable SSL/TLS** for PostgreSQL and Redis
4. **Set up monitoring** (Prometheus, Grafana)
5. **Configure backup strategy**
6. **Use managed services** (AWS RDS, ElastiCache) for better reliability

## Development vs Production

### Development (Local)
```bash
# Use local .env
docker-compose up -d
```

### Production
```bash
# Set NODE_ENV
export NODE_ENV=production

# Use production config
docker-compose -f docker-compose.yml up -d
```

## Useful Scripts

All scripts are in the `backend/` directory:

- `start-docker.sh` - Start all services
- `stop-docker.sh` - Stop all services
- `restart-docker.sh` - Restart all services
- `logs-docker.sh` - View logs
- `DOCKER_README.md` - Extended documentation

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify `.env` configuration
3. Ensure RPC URL is valid and has sufficient quota
4. Check contract addresses match deployed contracts
