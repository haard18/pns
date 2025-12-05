# Quick Reference: Chunked eth_getLogs Configuration

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `INDEXER_SCAN_INTERVAL_MS` | `30000` | How often to scan for new events (milliseconds) |
| `INDEXER_BATCH_SIZE` | `500` | Number of blocks to process per batch |
| `INDEXER_LOG_CHUNK_SIZE` | `2000` | Maximum blocks per eth_getLogs query |
| `INDEXER_MAX_RETRIES` | `3` | Maximum retries for failed RPC requests |
| `INDEXER_ENABLED` | `true` | Enable/disable the indexer |
| `DEPLOYMENT_BLOCK` | `79790269` | Starting block for initial sync |

## RPC Provider Presets

### Alchemy (Recommended)
```bash
INDEXER_BATCH_SIZE=1000
INDEXER_LOG_CHUNK_SIZE=5000
INDEXER_SCAN_INTERVAL_MS=15000
```
**Throughput:** ~4,000 blocks/minute

### Infura
```bash
INDEXER_BATCH_SIZE=500
INDEXER_LOG_CHUNK_SIZE=2000
INDEXER_SCAN_INTERVAL_MS=30000
```
**Throughput:** ~1,000 blocks/minute

### QuickNode Free
```bash
INDEXER_BATCH_SIZE=100
INDEXER_LOG_CHUNK_SIZE=500
INDEXER_SCAN_INTERVAL_MS=60000
```
**Throughput:** ~100 blocks/minute

### Public RPC
```bash
INDEXER_BATCH_SIZE=50
INDEXER_LOG_CHUNK_SIZE=200
INDEXER_SCAN_INTERVAL_MS=120000
```
**Throughput:** ~25 blocks/minute

## How Chunking Works

### Two-Level Strategy

```
┌─────────────────────────────────────────────────────────┐
│ Latest Block: 80000                                     │
│ Last Processed: 79000                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │ LEVEL 1: Batch Processing      │
        │ (INDEXER_BATCH_SIZE = 500)     │
        └─────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌───────────────┐                   ┌───────────────┐
│ Batch 1       │                   │ Batch 2       │
│ 79001-79500   │                   │ 79501-80000   │
│ (500 blocks)  │                   │ (500 blocks)  │
└───────────────┘                   └───────────────┘
        │                                   │
        ▼                                   ▼
┌─────────────────────────────────┐
│ LEVEL 2: eth_getLogs Chunking  │
│ (INDEXER_LOG_CHUNK_SIZE = 2000)│
└─────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────┐
│ Since 500 < 2000:                         │
│ → Single eth_getLogs query                │
│                                           │
│ If batch > chunk size:                    │
│ → Split into multiple eth_getLogs queries│
└───────────────────────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────┐
│ eth_getLogs Query    │
└──────────┬───────────┘
           │
           ▼
    ┌──────────────┐
    │ Success?     │
    └──┬───────┬───┘
       │       │
      Yes      No
       │       │
       │       ▼
       │  ┌─────────────────┐
       │  │ Rate Limit?     │
       │  └──┬───────┬──────┘
       │     │       │
       │    Yes      No
       │     │       │
       │     ▼       ▼
       │  ┌──────┐  ┌──────────────┐
       │  │Reduce│  │Retry with    │
       │  │Chunk │  │Exponential   │
       │  │Size  │  │Backoff       │
       │  └──┬───┘  └──┬───────────┘
       │     │         │
       │     └────┬────┘
       │          │
       │          ▼
       │     ┌─────────┐
       │     │ Retry   │
       │     └────┬────┘
       │          │
       └──────────┴──────────┐
                             ▼
                      ┌──────────────┐
                      │ Process Logs │
                      └──────────────┘
```

## Performance Tuning

### Symptoms & Solutions

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Frequent rate limit errors | Chunk size too large | Reduce `INDEXER_LOG_CHUNK_SIZE` |
| Slow indexing | Batch size too small | Increase `INDEXER_BATCH_SIZE` |
| High RPC costs | Scanning too often | Increase `INDEXER_SCAN_INTERVAL_MS` |
| Missing recent events | Scanning too slow | Decrease `INDEXER_SCAN_INTERVAL_MS` |
| Timeout errors | Chunk size too large | Reduce `INDEXER_LOG_CHUNK_SIZE` |

### Optimization Formula

```
Blocks/Minute = (INDEXER_BATCH_SIZE / INDEXER_SCAN_INTERVAL_MS) * 60000

Example:
BATCH_SIZE = 500
SCAN_INTERVAL = 30000ms (30 seconds)

Throughput = (500 / 30000) * 60000 = 1000 blocks/minute
```

## Monitoring Commands

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

## Common Issues

### Issue: "Query returned more than X results"
**Solution:** Reduce `INDEXER_LOG_CHUNK_SIZE`
```bash
INDEXER_LOG_CHUNK_SIZE=1000  # or lower
```

### Issue: "Rate limit exceeded"
**Solution:** Reduce batch size and increase interval
```bash
INDEXER_BATCH_SIZE=250
INDEXER_SCAN_INTERVAL_MS=60000
```

### Issue: "Indexer falling behind"
**Solution:** Increase batch size (if RPC allows)
```bash
INDEXER_BATCH_SIZE=1000
INDEXER_LOG_CHUNK_SIZE=5000
```

### Issue: "Connection timeout"
**Solution:** Reduce chunk size and add retries
```bash
INDEXER_LOG_CHUNK_SIZE=500
INDEXER_MAX_RETRIES=5
```

## API Endpoints

### Health Check
```bash
GET /api/health
```

Response:
```json
{
  "indexer": {
    "lastProcessedBlock": 79800000,
    "isRunning": true,
    "totalEventsProcessed": 1523
  }
}
```

### Get Domains by Owner
```bash
GET /api/domains/:address
```

### Get Domain Info
```bash
GET /api/domains/info/:nameOrHash
```

## Code Examples

### Manual Resync
```typescript
import EventIndexer from './indexer/scanEvents';

const indexer = new EventIndexer();
await indexer.initialize();

// Resync from specific block
await indexer.resyncFromBlock(79790000);
```

### Check Status Programmatically
```typescript
const status = indexer.getStatus();
console.log({
  lastBlock: status.lastProcessedBlock,
  running: status.isRunning,
  eventsProcessed: status.totalEventsProcessed
});
```

## Best Practices

1. ✅ **Start Conservative** - Use default settings first
2. ✅ **Monitor Logs** - Watch for rate limit errors
3. ✅ **Tune Gradually** - Increase batch size slowly
4. ✅ **Set Deployment Block** - Avoid scanning from genesis
5. ✅ **Use Redis** - Cache last processed block
6. ✅ **Enable Retries** - Handle transient errors
7. ✅ **Test First** - Verify on testnet before mainnet

## Resources

- 📖 [Full Guide](./INDEXER_GUIDE.md)
- 📝 [Summary](./CHUNKED_LOGS_SUMMARY.md)
- 🏗️ [Architecture](../ARCHITECTURE.md)

---

**Quick Start:**
```bash
# 1. Update .env
cp .env.example .env
# Edit .env with your settings

# 2. Build
npm run build

# 3. Start
npm start

# 4. Monitor
curl http://localhost:3000/api/health
```
