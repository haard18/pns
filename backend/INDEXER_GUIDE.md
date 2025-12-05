# Event Indexing with Chunked eth_getLogs

## Overview

The backend uses **chunked `eth_getLogs` queries** instead of active WebSocket listening for reliable and efficient blockchain event indexing. This approach is more robust and handles RPC rate limits gracefully.

## Architecture

### Polling vs Active Listening

**❌ Active Listening (Not Used)**
```typescript
// WebSocket-based - unreliable, connection drops
contract.on('NameRegistered', (event) => {
  // Process event
});
```

**✅ Chunked Polling (Current Implementation)**
```typescript
// Periodic eth_getLogs queries with automatic chunking
setInterval(async () => {
  const logs = await fetchLogs(fromBlock, toBlock, chunkSize);
  // Process logs
}, scanInterval);
```

## How It Works

### 1. **Batch Processing**
The indexer processes blocks in configurable batches:

```
Latest Block: 1000
Last Processed: 500
Batch Size: 500 blocks

Scan 1: Blocks 501-1000 (500 blocks)
```

### 2. **Automatic Chunking**
Large block ranges are automatically split into smaller chunks for `eth_getLogs`:

```
Batch: 501-1000 (500 blocks)
Chunk Size: 2000 blocks

Since 500 < 2000, fetch in one query
```

If a batch is larger than the chunk size:
```
Batch: 501-3000 (2500 blocks)
Chunk Size: 2000 blocks

Chunk 1: 501-2500 (2000 blocks)
Chunk 2: 2501-3000 (500 blocks)
```

### 3. **Adaptive Chunking**
If RPC returns rate limit errors, the chunk size is automatically reduced:

```
Initial Chunk: 2000 blocks → Rate Limit Error
Retry with: 1000 blocks → Rate Limit Error
Retry with: 500 blocks → Success ✓
```

### 4. **Exponential Backoff**
Transient errors are retried with exponential backoff:

```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
Attempt 4: Wait 4 seconds
```

## Configuration

All settings are configurable via environment variables:

### `.env` Configuration

```bash
# How often to scan for new events (milliseconds)
INDEXER_SCAN_INTERVAL_MS=30000

# Number of blocks to process per batch
INDEXER_BATCH_SIZE=500

# Maximum blocks per eth_getLogs query
INDEXER_LOG_CHUNK_SIZE=2000

# Maximum retries for failed RPC requests
INDEXER_MAX_RETRIES=3

# Enable/disable the indexer
INDEXER_ENABLED=true

# Starting block for initial sync
DEPLOYMENT_BLOCK=79790269
```

### Recommended Settings by RPC Provider

#### **Alchemy**
```bash
INDEXER_BATCH_SIZE=1000
INDEXER_LOG_CHUNK_SIZE=5000
INDEXER_SCAN_INTERVAL_MS=15000
```

#### **Infura**
```bash
INDEXER_BATCH_SIZE=500
INDEXER_LOG_CHUNK_SIZE=2000
INDEXER_SCAN_INTERVAL_MS=30000
```

#### **QuickNode (Free Tier)**
```bash
INDEXER_BATCH_SIZE=100
INDEXER_LOG_CHUNK_SIZE=500
INDEXER_SCAN_INTERVAL_MS=60000
```

#### **Public RPC**
```bash
INDEXER_BATCH_SIZE=50
INDEXER_LOG_CHUNK_SIZE=200
INDEXER_SCAN_INTERVAL_MS=120000
```

## Error Handling

### Rate Limit Errors
Automatically detected and handled:
- `429 Too Many Requests`
- `rate limit exceeded`
- `query returned more than X results`

**Action**: Reduce chunk size by 50% and retry

### Transient Errors
Network issues, timeouts, etc.

**Action**: Retry with exponential backoff (up to 3 times)

### Permanent Errors
Invalid contract address, malformed query, etc.

**Action**: Log error and skip batch

## Performance Optimization

### Parallel Fetching
Logs from different contracts are fetched in parallel:

```typescript
const [registryLogs, resolverLogs, nftLogs] = await Promise.all([
  fetchLogs(registryAddress, ...),
  fetchLogs(resolverAddress, ...),
  fetchLogs(nftAddress, ...)
]);
```

### Rate Limit Prevention
Small delays between chunks prevent rate limiting:

```typescript
for (let chunk of chunks) {
  await fetchLogs(chunk);
  await sleep(100); // 100ms delay
}
```

### Caching
Processed block numbers are cached in Redis to prevent re-processing.

## Monitoring

### Health Check Endpoint
```bash
GET /api/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "indexer": {
      "lastProcessedBlock": 79800000,
      "isRunning": true,
      "totalEventsProcessed": 1523
    },
    "redis": "connected",
    "database": "connected"
  }
}
```

### Logs
The indexer logs detailed information:

```
[INFO] Scanning events { fromBlock: 79790269, toBlock: 79790769, blocksToProcess: 500 }
[DEBUG] Fetched logs chunk { fromBlock: 79790269, toBlock: 79790769, logsCount: 12 }
[DEBUG] Processing batch { fromBlock: 79790269, toBlock: 79790769, totalLogs: 36 }
[INFO] Event scan completed { lastProcessedBlock: 79790769, totalEventsProcessed: 36 }
```

## Benefits Over Active Listening

### ✅ Reliability
- No WebSocket connection drops
- Automatic reconnection not needed
- Works with any RPC provider

### ✅ Rate Limit Handling
- Automatic chunk size adjustment
- Exponential backoff retries
- Configurable batch sizes

### ✅ Consistency
- Guaranteed event ordering
- No missed events
- Deterministic replay

### ✅ Scalability
- Can process historical events
- Parallel contract queries
- Efficient batch processing

### ✅ Flexibility
- Easy to pause/resume
- Manual resync support
- Configurable intervals

## Manual Operations

### Resync from Block
```typescript
// Stop indexer
indexer.stop();

// Resync from specific block
await indexer.resyncFromBlock(79790000);

// Restart indexer
await indexer.start();
```

### Check Status
```typescript
const status = indexer.getStatus();
console.log(status);
// {
//   lastProcessedBlock: 79800000,
//   isRunning: true,
//   totalEventsProcessed: 1523
// }
```

## Troubleshooting

### Indexer Not Processing New Blocks
1. Check if indexer is running: `GET /api/health`
2. Check RPC connectivity: `curl $POLYGON_RPC_URL`
3. Check Redis connection: Verify `REDIS_URL`
4. Check logs for errors

### Rate Limit Errors
1. Reduce `INDEXER_BATCH_SIZE`
2. Reduce `INDEXER_LOG_CHUNK_SIZE`
3. Increase `INDEXER_SCAN_INTERVAL_MS`
4. Upgrade RPC provider plan

### Missing Events
1. Check `DEPLOYMENT_BLOCK` is correct
2. Verify contract addresses in `.env`
3. Manually resync from deployment block
4. Check event signatures match contract

## Code Structure

```
backend/src/
├── indexer/
│   └── scanEvents.ts          # Main indexer logic
├── services/
│   ├── eventParser.ts         # eth_getLogs with chunking
│   ├── database.service.ts    # PostgreSQL storage
│   └── redis.service.ts       # Caching layer
└── config/
    └── index.ts               # Configuration
```

## Summary

The backend uses a **robust, chunked polling approach** for event indexing:

1. ✅ **No active WebSocket listeners** - uses periodic `eth_getLogs` queries
2. ✅ **Automatic chunking** - splits large ranges into smaller queries
3. ✅ **Adaptive sizing** - reduces chunk size on rate limits
4. ✅ **Exponential backoff** - retries transient errors
5. ✅ **Fully configurable** - all parameters via environment variables
6. ✅ **Production-ready** - handles edge cases and errors gracefully

This approach is the **industry standard** for reliable blockchain indexing! 🎯
