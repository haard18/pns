# PNS Backend with Docker Compose

This backend service indexes Polygon Naming Service (PNS) events and stores them in PostgreSQL, with Redis for caching and tracking the last scanned block.

## Architecture

- **PostgreSQL**: Stores event logs, domain data, text records, and address records
- **Redis**: Caches data and stores the last scanned blockchain block number
- **Backend Service**: Node.js/Express API with event indexer

## Quick Start

### 1. Start all services with Docker Compose

```bash
# Start PostgreSQL, Redis, and Backend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (database data will be lost)
docker-compose down -v
```

### 2. Development Mode (without Docker)

If you prefer to run services locally:

```bash
# Start PostgreSQL and Redis only
docker-compose up -d postgres redis

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=3000
NODE_ENV=production

# Blockchain
POLYGON_RPC_URL=your_rpc_url
POLYGON_CHAIN_ID=137
DEPLOYMENT_BLOCK=79790269

# Contract Addresses
POLYGON_REGISTRY_ADDRESS=0xD913d5976030a05349a0B393063a052130234303
POLYGON_REGISTRAR_ADDRESS=0x7e3a227Fb9abE743692Cd4beb8Db3A210C700B3a
POLYGON_RESOLVER_ADDRESS=0x6Ed01A870D262a054e2C5E7a7161cF8F2EA2f8d7
POLYGON_CONTROLLER_ADDRESS=0xced4F08241EC1Bb6B95f85028911043903299538
POLYGON_PRICE_ORACLE_ADDRESS=0xE810156cf63d572dB9d31F277DCC05AA60aD8C22
POLYGON_NFT_ADDRESS=0xf7e61Ad13C8a1593e57C161DD863CDcD0d01326E

# Database (Docker Compose will use these)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pns

# Redis
REDIS_URL=redis://redis:6379

# Indexer
INDEXER_SCAN_INTERVAL_MS=30000
INDEXER_BATCH_SIZE=5
INDEXER_ENABLED=true
```

## Database Schema

The PostgreSQL database includes:

- `domains`: Domain registration data
- `event_logs`: All blockchain events
- `text_records`: Domain text records (social links, email, etc.)
- `address_records`: Domain address records (multi-chain addresses)
- `indexer_metadata`: System metadata

## Redis Keys

- `indexer:last_scanned_block`: Last processed block number
- `indexer:state`: Indexer state (running, total events, etc.)
- `domain:{nameHash}`: Cached domain data (TTL: 1 hour)

## API Endpoints

### Health Check
```bash
GET /health
GET /api/health
```

### Domains
```bash
GET /api/domains/:address          # Get domains by owner
GET /api/domains/info/:nameOrHash  # Get domain info
GET /api/domains/search?q=query    # Search domains
GET /api/domains/expiring          # Get expiring domains
GET /api/domains/expired           # Get expired domains
GET /api/domains/stats             # Get statistics
```

### Transactions
```bash
POST /api/tx/record                # Record transaction
GET /api/tx/:address               # Get user transactions
GET /api/tx/domain/:domain         # Get domain transactions
GET /api/tx/recent                 # Get recent transactions
```

## Docker Commands

```bash
# Build backend image
docker-compose build backend

# View logs for specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f backend

# Execute commands in containers
docker-compose exec postgres psql -U postgres -d pns
docker-compose exec redis redis-cli

# Restart a service
docker-compose restart backend

# Check service status
docker-compose ps

# View resource usage
docker stats
```

## Database Management

### Connect to PostgreSQL
```bash
docker-compose exec postgres psql -U postgres -d pns
```

### Common SQL Queries
```sql
-- Check last scanned block (from indexer_metadata)
SELECT * FROM indexer_metadata WHERE key = 'schema_version';

-- View recent events
SELECT event_name, name, block_number, transaction_hash 
FROM event_logs 
ORDER BY block_number DESC 
LIMIT 10;

-- Count events by type
SELECT event_name, COUNT(*) 
FROM event_logs 
GROUP BY event_name;

-- View all domains
SELECT name, owner, expiration, last_updated_block 
FROM domains 
ORDER BY created_at DESC;

-- Check text records for a domain
SELECT * FROM text_records WHERE name_hash = '0x...';
```

### Connect to Redis
```bash
docker-compose exec redis redis-cli

# View last scanned block
GET indexer:last_scanned_block

# View indexer state
GET indexer:state

# View all keys
KEYS *

# Clear all cache
FLUSHDB
```

## Backup and Restore

### PostgreSQL Backup
```bash
# Backup database
docker-compose exec -T postgres pg_dump -U postgres pns > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres pns
```

### Redis Backup
Redis automatically persists data with AOF (Append Only File). The data is stored in the `redis_data` volume.

## Monitoring

### Check Backend Health
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-04T...",
    "indexer": {
      "lastProcessedBlock": 79800000,
      "isRunning": true,
      "totalEventsProcessed": 42
    },
    "redis": "connected",
    "database": "connected",
    "version": "2.0.0"
  }
}
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Verify database is ready
docker-compose exec postgres pg_isready -U postgres

# Verify Redis is ready
docker-compose exec redis redis-cli ping
```

### Reset everything
```bash
# Stop and remove all data
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Indexer not scanning
1. Check `.env` has correct RPC URL
2. Verify `INDEXER_ENABLED=true`
3. Check last scanned block in Redis
4. Review backend logs for errors

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Production Deployment

1. Update `.env` with production values
2. Set `NODE_ENV=production`
3. Use strong PostgreSQL password
4. Configure proper CORS_ORIGIN
5. Set up log rotation for `./logs` directory
6. Monitor disk usage for PostgreSQL and Redis volumes
7. Set up automated backups

## License

MIT
