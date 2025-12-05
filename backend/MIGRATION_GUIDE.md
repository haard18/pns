# Migration Guide: Updating to Chunked eth_getLogs

## Overview

This guide helps you update your backend configuration to use the enhanced chunked `eth_getLogs` implementation.

## What Changed?

### ✅ Good News
Your backend **already uses chunked queries** - no breaking changes! We've just added:
- Better error handling
- Adaptive chunk sizing
- More configuration options

### 🔧 New Features
1. Automatic chunk size reduction on rate limits
2. Exponential backoff retries
3. Configurable chunk sizes
4. Better logging and monitoring

## Migration Steps

### Step 1: Update Environment Variables

Add these new variables to your `.env` file:

```bash
# Add these new lines to your .env file

# Indexer Configuration
INDEXER_SCAN_INTERVAL_MS=30000
INDEXER_BATCH_SIZE=500
INDEXER_LOG_CHUNK_SIZE=2000
INDEXER_MAX_RETRIES=3
INDEXER_ENABLED=true
DEPLOYMENT_BLOCK=79790269
```

### Step 2: Choose Your Configuration Preset

Based on your RPC provider, use one of these presets:

#### For Alchemy (Recommended)
```bash
INDEXER_BATCH_SIZE=1000
INDEXER_LOG_CHUNK_SIZE=5000
INDEXER_SCAN_INTERVAL_MS=15000
INDEXER_MAX_RETRIES=3
```

#### For Infura
```bash
INDEXER_BATCH_SIZE=500
INDEXER_LOG_CHUNK_SIZE=2000
INDEXER_SCAN_INTERVAL_MS=30000
INDEXER_MAX_RETRIES=3
```

#### For QuickNode Free Tier
```bash
INDEXER_BATCH_SIZE=100
INDEXER_LOG_CHUNK_SIZE=500
INDEXER_SCAN_INTERVAL_MS=60000
INDEXER_MAX_RETRIES=5
```

#### For Public RPC
```bash
INDEXER_BATCH_SIZE=50
INDEXER_LOG_CHUNK_SIZE=200
INDEXER_SCAN_INTERVAL_MS=120000
INDEXER_MAX_RETRIES=5
```

### Step 3: Rebuild the Backend

```bash
cd backend
npm run build
```

### Step 4: Restart the Service

#### Using Docker
```bash
docker-compose restart backend
```

#### Using npm
```bash
npm start
```

### Step 5: Verify the Changes

Check the health endpoint:
```bash
curl http://localhost:3000/api/health | jq
```

Expected response:
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

## Backward Compatibility

### ✅ Fully Backward Compatible

The changes are **100% backward compatible**:

- If you don't add the new env vars, defaults are used
- Existing `.env` files continue to work
- No database schema changes
- No API changes

### Default Values

If you don't set the new variables, these defaults are used:

```typescript
INDEXER_SCAN_INTERVAL_MS = 30000  // 30 seconds
INDEXER_BATCH_SIZE = 500          // 500 blocks
INDEXER_LOG_CHUNK_SIZE = 2000     // 2000 blocks
INDEXER_MAX_RETRIES = 3           // 3 retries
INDEXER_ENABLED = true            // Enabled
```

## Troubleshooting

### Issue: Build Fails

**Solution:** Make sure you have the latest code
```bash
git pull origin main
npm install
npm run build
```

### Issue: Indexer Not Running

**Check 1:** Verify `INDEXER_ENABLED=true` in `.env`

**Check 2:** Check logs for errors
```bash
# Docker
docker-compose logs backend

# Local
npm start
```

**Check 3:** Verify RPC URL is correct
```bash
curl -X POST $POLYGON_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Issue: Rate Limit Errors

**Solution:** Reduce batch and chunk sizes
```bash
INDEXER_BATCH_SIZE=250
INDEXER_LOG_CHUNK_SIZE=1000
INDEXER_SCAN_INTERVAL_MS=60000
```

### Issue: Slow Indexing

**Solution:** Increase batch size (if RPC allows)
```bash
INDEXER_BATCH_SIZE=1000
INDEXER_LOG_CHUNK_SIZE=5000
INDEXER_SCAN_INTERVAL_MS=15000
```

## Performance Tuning

### Start Conservative

Begin with conservative settings:
```bash
INDEXER_BATCH_SIZE=500
INDEXER_LOG_CHUNK_SIZE=2000
INDEXER_SCAN_INTERVAL_MS=30000
```

### Monitor Performance

Watch the logs for:
- Rate limit errors → Reduce batch/chunk size
- Slow processing → Increase batch size
- Timeout errors → Reduce chunk size

### Gradually Increase

If no errors after 1 hour, try:
```bash
INDEXER_BATCH_SIZE=750
INDEXER_LOG_CHUNK_SIZE=3000
```

If still no errors after another hour:
```bash
INDEXER_BATCH_SIZE=1000
INDEXER_LOG_CHUNK_SIZE=5000
```

## Monitoring Commands

### Check Indexer Status
```bash
curl http://localhost:3000/api/health | jq '.data.indexer'
```

### Watch Logs in Real-Time
```bash
# Docker
docker-compose logs -f backend | grep -i "indexer\|scan\|fetch"

# Local
npm start | grep -i "indexer\|scan\|fetch"
```

### Check Last Processed Block
```bash
redis-cli GET pns:last_scanned_block
```

### Check Total Events Processed
```bash
curl http://localhost:3000/api/health | jq '.data.indexer.totalEventsProcessed'
```

## Rollback Plan

If you encounter issues, you can rollback:

### Step 1: Revert Environment Variables

Remove the new variables from `.env` or set to defaults:
```bash
# Comment out or remove these lines
# INDEXER_BATCH_SIZE=500
# INDEXER_LOG_CHUNK_SIZE=2000
# etc.
```

### Step 2: Rebuild
```bash
npm run build
```

### Step 3: Restart
```bash
# Docker
docker-compose restart backend

# Local
npm start
```

The system will use the old defaults and continue working.

## Testing Checklist

Before deploying to production, verify:

- [ ] Build succeeds: `npm run build`
- [ ] Health endpoint responds: `curl http://localhost:3000/api/health`
- [ ] Indexer is running: Check `isRunning: true` in health response
- [ ] Blocks are processing: `lastProcessedBlock` is increasing
- [ ] No rate limit errors in logs
- [ ] Redis is connected
- [ ] Database is connected
- [ ] API endpoints work: `GET /api/domains/:address`

## Production Deployment

### Step 1: Test on Staging

Deploy to staging environment first:
```bash
# Update .env on staging
vim .env

# Rebuild
npm run build

# Restart
docker-compose restart backend

# Monitor for 1 hour
docker-compose logs -f backend
```

### Step 2: Monitor Metrics

Watch for:
- Rate limit errors
- Processing speed
- Memory usage
- RPC costs

### Step 3: Deploy to Production

Once staging is stable:
```bash
# Update .env on production
vim .env

# Rebuild
npm run build

# Restart with zero downtime
docker-compose up -d --no-deps --build backend

# Monitor
docker-compose logs -f backend
```

## Configuration Examples

### Example 1: High-Volume Production (Alchemy)
```bash
# .env
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
INDEXER_BATCH_SIZE=1000
INDEXER_LOG_CHUNK_SIZE=5000
INDEXER_SCAN_INTERVAL_MS=15000
INDEXER_MAX_RETRIES=3
INDEXER_ENABLED=true
DEPLOYMENT_BLOCK=79790269
```

### Example 2: Medium-Volume Production (Infura)
```bash
# .env
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_KEY
INDEXER_BATCH_SIZE=500
INDEXER_LOG_CHUNK_SIZE=2000
INDEXER_SCAN_INTERVAL_MS=30000
INDEXER_MAX_RETRIES=3
INDEXER_ENABLED=true
DEPLOYMENT_BLOCK=79790269
```

### Example 3: Development (Local Anvil)
```bash
# .env
POLYGON_RPC_URL=http://localhost:8545
INDEXER_BATCH_SIZE=100
INDEXER_LOG_CHUNK_SIZE=500
INDEXER_SCAN_INTERVAL_MS=10000
INDEXER_MAX_RETRIES=1
INDEXER_ENABLED=true
DEPLOYMENT_BLOCK=0
```

## Support

### Documentation
- 📖 [Full Guide](./INDEXER_GUIDE.md)
- 📝 [Quick Reference](./QUICK_REFERENCE.md)
- 🏗️ [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)

### Logs
Check logs for detailed information:
```bash
# Docker
docker-compose logs backend

# Local
npm start
```

### Health Check
Monitor indexer health:
```bash
curl http://localhost:3000/api/health
```

## Summary

### Migration is Simple:
1. ✅ Add new env vars to `.env`
2. ✅ Choose preset for your RPC provider
3. ✅ Rebuild: `npm run build`
4. ✅ Restart: `npm start` or `docker-compose restart`
5. ✅ Verify: `curl http://localhost:3000/api/health`

### No Breaking Changes:
- ✅ Fully backward compatible
- ✅ Defaults work out of the box
- ✅ Easy rollback if needed

### Benefits:
- ✅ Better error handling
- ✅ Adaptive chunk sizing
- ✅ More reliable indexing
- ✅ Better monitoring

**You're ready to go!** 🚀
