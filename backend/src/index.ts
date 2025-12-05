import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Config } from './config';

// New architecture routes - event indexing only
import domainsRoutes from './routes/domains.routes';

import logger from './utils/logger';
import { ApiResponse } from './types';
import EventIndexer from './indexer/scanEvents';
import database from './services/database.service';
import redis from './services/redis.service';

// Initialize Express app
const app: Application = express();
app.set('trust proxy', 1); // Trust first proxy

let indexer: EventIndexer;

// Validate configuration in production
if (process.env.NODE_ENV === 'production') {
  Config.validate();
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// API Routes - New architecture
app.use('/api', domainsRoutes);
// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const indexerStatus = indexer ? indexer.getStatus() : null;
  const redisHealthy = await redis.ping();

  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      indexer: indexerStatus,
      redis: redisHealthy ? 'connected' : 'disconnected',
      database: 'connected',
      version: '2.0.0'
    }
  });
});

app.get('/api/health', async (_req: Request, res: Response) => {
  const indexerStatus = indexer ? indexer.getStatus() : null;
  const redisHealthy = await redis.ping();

  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      indexer: indexerStatus,
      redis: redisHealthy ? 'connected' : 'disconnected',
      database: 'connected',
      version: '2.0.0'
    }
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'PNS Event Indexer API',
      version: '2.0.0',
      architecture: 'Event-driven indexing only',
      description: 'Backend only indexes blockchain events. Frontend calls contracts directly.',
      chains: ['polygon'],
      endpoints: {
        domains: 'GET /api/domains/:address - Get domains owned by address',
        domainInfo: 'GET /api/domains/info/:nameOrHash - Get domain information',
        search: 'GET /api/domains/search?q=query - Search domains',
        expiring: 'GET /api/domains/expiring - Get expiring domains',
        expired: 'GET /api/domains/expired - Get expired domains',
        stats: 'GET /api/domains/stats - Get domain statistics',
        recordTx: 'POST /api/tx/record - Record successful transaction',
        userTx: 'GET /api/tx/:address - Get user transaction history',
        domainTx: 'GET /api/tx/domain/:domain - Get domain transaction history',
        recentTx: 'GET /api/tx/recent - Get recent public transactions',
        health: 'GET /api/health - Health check and indexer status'
      }
    },
    timestamp: Date.now()
  };

  res.json(response);
});

// 404 handler
app.use((_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: 'Route not found',
    timestamp: Date.now()
  };

  res.status(404).json(response);
});

// Initialize database and Redis
async function initializeServices() {
  try {
    logger.info('Connecting to database...');
    await database.connect();

    logger.info('Connecting to Redis...');
    await redis.connect();

    logger.info('All services connected successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}

// Initialize and start event indexer
async function startIndexer() {
  try {
    indexer = new EventIndexer();
    await indexer.initialize();

    if (Config.indexer.enabled) {
      await indexer.start();
      logger.info('Event indexer started successfully');
    } else {
      logger.info('Event indexer is disabled');
    }
  } catch (error) {
    logger.error('Failed to start event indexer:', error);
    // Continue without indexer in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

// Start server
const PORT = Config.PORT || 3000;

async function startServer() {
  try {
    // Initialize database and Redis first
    await initializeServices();

    // Start HTTP server
    app.listen(PORT, async () => {
      logger.info(`PNS Event Indexer API server started`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        polygonRpc: Config.polygon.rpcUrl,
        architecture: 'Event-driven indexing with PostgreSQL and Redis'
      });

      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Polygon RPC: ${Config.polygon.rpcUrl}`);
      console.log(`🗄️  Database: ${Config.database.url.split('@')[1] || 'Connected'}`);
      console.log(`🔴 Redis: ${Config.redis.url}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/`);
      console.log(`🔍 Event indexing: ${Config.indexer.scanIntervalMs || 30000}ms intervals`);

      // Start the event indexer
      await startIndexer();
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  if (indexer) {
    indexer.stop();
  }
  await database.disconnect();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  if (indexer) {
    indexer.stop();
  }
  await database.disconnect();
  await redis.disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;