import dotenv from 'dotenv';
import { PolygonConfig } from '../types';

dotenv.config();

export class Config {
  static readonly PORT = parseInt(process.env.PORT || '3000', 10);
  static readonly NODE_ENV = process.env.NODE_ENV || 'development';

  static readonly polygon: PolygonConfig = {
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    chainId: parseInt(process.env.POLYGON_CHAIN_ID || '137', 10),
    contracts: {
      registry: process.env.POLYGON_REGISTRY_ADDRESS || '',
      registrar: process.env.POLYGON_REGISTRAR_ADDRESS || '',
      controller: process.env.POLYGON_CONTROLLER_ADDRESS || '',
      resolver: process.env.POLYGON_RESOLVER_ADDRESS || '',
      priceOracle: process.env.POLYGON_PRICE_ORACLE_ADDRESS || '',
      nft: process.env.POLYGON_NFT_ADDRESS || ''
    }
  };

  // Shortcut for contracts (used by indexer)
  static readonly contracts = {
    registry: process.env.POLYGON_REGISTRY_ADDRESS || '',
    registrar: process.env.POLYGON_REGISTRAR_ADDRESS || '',
    controller: process.env.POLYGON_CONTROLLER_ADDRESS || '',
    resolver: process.env.POLYGON_RESOLVER_ADDRESS || '',
    priceOracle: process.env.POLYGON_PRICE_ORACLE_ADDRESS || '',
    domainNFT: process.env.POLYGON_NFT_ADDRESS || '',
    // Block number when contracts were deployed (for initial sync)
    // Polygon Mainnet deployment: December 2, 2025 - block ~79790269
    deploymentBlock: parseInt(process.env.DEPLOYMENT_BLOCK || '79790269', 10)
  };

  // Indexer configuration - optimized for public RPC rate limits
  static readonly indexer = {
    scanIntervalMs: parseInt(process.env.INDEXER_SCAN_INTERVAL_MS || '60000', 10), // 60 seconds (reduced frequency)
    batchSize: parseInt(process.env.INDEXER_BATCH_SIZE || '200', 10), // Smaller batches to avoid rate limits
    logChunkSize: parseInt(process.env.INDEXER_LOG_CHUNK_SIZE || '500', 10), // Smaller chunks for eth_getLogs
    maxRetries: parseInt(process.env.INDEXER_MAX_RETRIES || '5', 10), // More retries with backoff
    enabled: process.env.INDEXER_ENABLED !== 'false' // Enabled by default
  };

  static readonly database = {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/pns'
  };

  static readonly redis = {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  };

  static readonly ipfs = {
    pinataApiKey: process.env.PINATA_API_KEY || '',
    pinataSecretKey: process.env.PINATA_SECRET_KEY || '',
    gateway: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'
  };

  static validate(): void {
    const required = [
      'POLYGON_RPC_URL',
      'POLYGON_REGISTRY_ADDRESS',
      'POLYGON_CONTROLLER_ADDRESS'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0 && this.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
