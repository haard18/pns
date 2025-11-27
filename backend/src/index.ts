import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Config } from './config';
import pnsRoutes from './routes/pns.routes';
import recordRoutes from './routes/records.routes';
import nftRoutes from './routes/nft.routes';
import transactionRoutes from './routes/transaction.routes';
import logger from './utils/logger';
import { ApiResponse } from './types';
import { SyncService } from './services/sync.service';

// Initialize Express app
const app: Application = express();

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

// Routes
app.use('/api', pnsRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/transactions', transactionRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'PNS Multi-Chain API',
      version: '1.0.0',
      chains: ['polygon'],
      endpoints: {
        register: 'POST /api/register',
        renew: 'POST /api/renew',
        price: 'GET /api/price',
        domains: 'GET /api/domains/:address',
        domain: 'GET /api/domain/:name',
        available: 'GET /api/available/:name',
        health: 'GET /api/health'
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

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack
  });

  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    timestamp: Date.now()
  };

  res.status(500).json(response);
});

// Start server
const PORT = Config.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`PNS Multi-Chain API server started`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    polygonRpc: Config.polygon.rpcUrl
  });

  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Polygon RPC: ${Config.polygon.rpcUrl}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/`);
});

const syncService = new SyncService();
syncService.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
