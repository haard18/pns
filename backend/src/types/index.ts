export type ChainType = 'polygon' | 'solana';

export interface DomainRecord {
  name: string;
  chain: ChainType;
  owner: string;
  expires: number;
  resolver?: string;
  metadata?: string;
  txHash: string;
  registeredAt: number;
}

export interface RegisterRequest {
  chain: ChainType;
  name: string;
  owner: string;
  duration: number;
  resolver?: string;
}

export interface RenewRequest {
  chain: ChainType;
  name: string;
  duration: number;
}

export interface PriceRequest {
  chain: ChainType;
  name: string;
  duration: number;
}

export interface PriceResponse {
  price: string;
  currency: 'ETH' | 'SOL';
  chain: ChainType;
  priceWei?: string;
  priceLamports?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PolygonConfig {
  rpcUrl: string;
  chainId: number;
  contracts: {
    registry: string;
    registrar: string;
    controller: string;
    resolver: string;
    priceOracle: string;
    nft: string;
  };
}

export interface SolanaConfig {
  rpcUrl: string;
  programId: string;
  payerKeypair: string;
}

export interface RegistryAccountData {
  authority: string;
  domainCount: number;
  bump: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface SolanaDomainPDA {
  address: string;
  bump: number;
}
