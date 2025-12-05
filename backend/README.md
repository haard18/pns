# PNS Backend - Event Indexer

Polygon Name Service backend with **chunked `eth_getLogs` event indexing**.

## 🎯 Overview

This backend uses **chunked polling** instead of active WebSocket listening for reliable blockchain event indexing. It automatically handles rate limits, retries errors, and maintains a PostgreSQL database of all domain events.

## ✨ Features

- ✅ **Chunked eth_getLogs Queries** - No WebSocket connections
- ✅ **Adaptive Chunk Sizing** - Automatically reduces chunk size on rate limits
- ✅ **Exponential Backoff** - Retries transient errors intelligently
- ✅ **Parallel Processing** - Queries multiple contracts simultaneously
- ✅ **Redis Caching** - Fast lookups and state management
- ✅ **PostgreSQL Storage** - Persistent event and domain data
- ✅ **Fully Configurable** - Tune for any RPC provider

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Services
```bash
# Using Docker (recommended)
docker-compose up -d

# Or locally
npm run build
npm start
```

### 4. Verify
```bash
curl http://localhost:3000/api/health
```

## 📋 Configuration

### Environment Variables

```bash
# RPC Configuration
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_CHAIN_ID=137

# Contract Addresses
POLYGON_REGISTRY_ADDRESS=0x...
POLYGON_CONTROLLER_ADDRESS=0x...
POLYGON_RESOLVER_ADDRESS=0x...
POLYGON_NFT_ADDRESS=0x...

# Indexer Settings
INDEXER_SCAN_INTERVAL_MS=30000      # How often to scan (ms)
INDEXER_BATCH_SIZE=500              # Blocks per batch
INDEXER_LOG_CHUNK_SIZE=2000         # eth_getLogs chunk size
INDEXER_MAX_RETRIES=3               # Retry attempts
INDEXER_ENABLED=true                # Enable/disable
DEPLOYMENT_BLOCK=79790269           # Starting block

# Database
DATABASE_URL=postgresql://localhost:5432/pns
REDIS_URL=redis://localhost:6379
```

### RPC Provider Presets

#### Alchemy (Recommended)
```bash
INDEXER_BATCH_SIZE=1000
INDEXER_LOG_CHUNK_SIZE=5000
INDEXER_SCAN_INTERVAL_MS=15000
```

#### Infura
```bash
INDEXER_BATCH_SIZE=500
INDEXER_LOG_CHUNK_SIZE=2000
INDEXER_SCAN_INTERVAL_MS=30000
```

#### QuickNode Free
```bash
INDEXER_BATCH_SIZE=100
INDEXER_LOG_CHUNK_SIZE=500
INDEXER_SCAN_INTERVAL_MS=60000
```

## 📚 Documentation

- 📖 [**Indexer Guide**](./INDEXER_GUIDE.md) - Complete guide to event indexing
- 📝 [**Quick Reference**](./QUICK_REFERENCE.md) - Configuration cheat sheet
- 🏗️ [**Architecture Diagram**](./ARCHITECTURE_DIAGRAM.md) - Visual system overview
- 📊 [**Migration Guide**](./MIGRATION_GUIDE.md) - Upgrading from older versions
- 📄 [**Summary**](./CHUNKED_LOGS_SUMMARY.md) - What changed and why

## 🔧 API Endpoints

### Health Check
```bash
GET /api/health
```

### Domains
```bash
GET /api/domains/:address          # Get domains by owner
GET /api/domains/info/:nameOrHash  # Get domain details
GET /api/domains/search?q=query    # Search domains
GET /api/domains/expiring          # Get expiring domains
GET /api/domains/stats             # Get statistics
```

### Transactions
```bash
POST /api/tx/record                # Record transaction
GET /api/tx/:address               # Get user transactions
GET /api/tx/domain/:domain         # Get domain transactions
GET /api/tx/recent                 # Get recent transactions
```

## 🏗️ Architecture

```
Blockchain Events
       ↓
   eth_getLogs (chunked)
       ↓
   Event Parser
       ↓
   PostgreSQL + Redis
       ↓
   REST API
```

### How Chunking Works

1. **Batch Processing** - Process blocks in configurable batches (default: 500)
2. **Auto-Chunking** - Split large ranges into smaller eth_getLogs queries (default: 2000)
3. **Parallel Queries** - Fetch logs from all contracts simultaneously
4. **Adaptive Sizing** - Reduce chunk size on rate limits
5. **Retry Logic** - Exponential backoff for transient errors

See [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) for visual details.

## 📊 Monitoring

### Check Indexer Status
```bash
curl http://localhost:3000/api/health | jq '.data.indexer'
```

### Watch Logs
```bash
# Docker
docker-compose logs -f backend

# Local
npm start
```

### Check Last Processed Block
```bash
redis-cli GET pns:last_scanned_block
```

## 🐛 Troubleshooting

### Rate Limit Errors
**Solution:** Reduce batch and chunk sizes
```bash
INDEXER_BATCH_SIZE=250
INDEXER_LOG_CHUNK_SIZE=1000
```

### Slow Indexing
**Solution:** Increase batch size (if RPC allows)
```bash
INDEXER_BATCH_SIZE=1000
INDEXER_LOG_CHUNK_SIZE=5000
```

### Connection Timeouts
**Solution:** Reduce chunk size and increase retries
```bash
INDEXER_LOG_CHUNK_SIZE=500
INDEXER_MAX_RETRIES=5
```

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for more troubleshooting.

## 🧪 Development

### Build
```bash
npm run build
```

### Run Locally
```bash
npm start
```

### Run with Docker
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f backend
```

### Restart
```bash
docker-compose restart backend
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration
│   ├── controllers/      # Request handlers
│   ├── indexer/          # Event indexer
│   │   └── scanEvents.ts # Main indexer logic
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   │   ├── eventParser.ts    # eth_getLogs with chunking
│   │   ├── database.service.ts
│   │   └── redis.service.ts
│   └── utils/            # Utilities
├── INDEXER_GUIDE.md      # Complete indexer guide
├── QUICK_REFERENCE.md    # Configuration reference
├── ARCHITECTURE_DIAGRAM.md # Visual diagrams
├── MIGRATION_GUIDE.md    # Migration instructions
└── CHUNKED_LOGS_SUMMARY.md # Change summary
```

## 🔄 How It Works

### Polling vs Active Listening

**❌ Active Listening (Not Used)**
```typescript
// WebSocket-based - unreliable
contract.on('NameRegistered', (event) => {
  // Process event
});
```

**✅ Chunked Polling (Current)**
```typescript
// Periodic eth_getLogs with chunking
setInterval(async () => {
  const logs = await fetchLogs(fromBlock, toBlock, chunkSize);
  // Process logs
}, scanInterval);
```

### Event Processing Flow

1. **Poll** - Check for new blocks every 30 seconds
2. **Batch** - Split into batches of 500 blocks
3. **Chunk** - Split batches into eth_getLogs queries of 2000 blocks
4. **Fetch** - Query all contracts in parallel
5. **Parse** - Decode event data
6. **Store** - Update PostgreSQL and Redis
7. **Repeat** - Continue from last processed block

## 🎯 Performance

### Throughput Calculation
```
Blocks/Minute = (BATCH_SIZE / SCAN_INTERVAL_MS) * 60000

Example (default settings):
= (500 / 30000) * 60000
= 1000 blocks/minute
```

### Optimization Tips

1. **Start Conservative** - Use default settings
2. **Monitor Logs** - Watch for rate limit errors
3. **Tune Gradually** - Increase batch size slowly
4. **Use Premium RPC** - Alchemy or Infura for best performance

## 🔐 Security

- ✅ Rate limiting on API endpoints
- ✅ Input validation
- ✅ CORS configuration
- ✅ Environment variable validation
- ✅ Error handling and logging

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

- 📖 [Documentation](./INDEXER_GUIDE.md)
- 🐛 [Issues](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

## 🎉 Summary

This backend provides **production-ready event indexing** with:

- ✅ **No active WebSocket listening** - uses chunked polling
- ✅ **Automatic error handling** - retries and adaptive sizing
- ✅ **Fully configurable** - tune for any RPC provider
- ✅ **Well documented** - comprehensive guides
- ✅ **Battle-tested** - handles edge cases gracefully

**Ready for production!** 🚀

---

**Quick Links:**
- [Indexer Guide](./INDEXER_GUIDE.md) - How it works
- [Quick Reference](./QUICK_REFERENCE.md) - Configuration
- [Migration Guide](./MIGRATION_GUIDE.md) - Upgrading
- [Architecture](./ARCHITECTURE_DIAGRAM.md) - Visual diagrams
