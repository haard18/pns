import dotenv from 'dotenv';
import { PolygonConfig } from '../types';

dotenv.config();

export class Config {
  static readonly PORT = parseInt(process.env.PORT || '3000', 10);
  static readonly NODE_ENV = process.env.NODE_ENV || 'development';

  static readonly polygon: PolygonConfig = {
    rpcUrl: process.env.POLYGON_RPC_URL || 'http://localhost:8545',
    chainId: parseInt(process.env.POLYGON_CHAIN_ID || '31337', 10),
    contracts: {
      registry: process.env.POLYGON_REGISTRY_ADDRESS || '',
      registrar: process.env.POLYGON_REGISTRAR_ADDRESS || '',
      controller: process.env.POLYGON_CONTROLLER_ADDRESS || '',
      resolver: process.env.POLYGON_RESOLVER_ADDRESS || '',
      priceOracle: process.env.POLYGON_PRICE_ORACLE_ADDRESS || '',
      nft: process.env.POLYGON_NFT_ADDRESS || ''
    }
  };

  // Solana config commented out - can be re-enabled later if needed
  // static readonly solana: SolanaConfig = {
  //   rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  //   programId: process.env.SOLANA_PROGRAM_ID || '',
  //   payerKeypair: process.env.SOLANA_PAYER_KEYPAIR || ''
  // };

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
      'POLYGON_CONTROLLER_ADDRESS'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0 && this.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
