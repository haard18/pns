export type ChainType = 'polygon';

export type RecordType = 'address' | 'text' | 'contentHash' | 'custom';

export type WrapState = 'none' | 'polygon';

export interface DomainRecord {
  name: string;
  chain: ChainType;
  owner: string;
  expires: number;
  resolver?: string;
  metadata?: string;
  txHash: string;
  registeredAt: number;
  polygonOwner?: string;
  solanaPda?: string;
  wrapState?: WrapState;
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
  currency: 'ETH';
  chain: ChainType;
  priceWei?: string;
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

// Solana config commented out - can be re-enabled later if needed
// export interface SolanaConfig {
//   rpcUrl: string;
//   programId: string;
//   payerKeypair: string;
// }

export interface RegistryAccountData {
  authority: string;
  domainCount: number;
  bump: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Solana domain PDA - commented out for future use
// export interface SolanaDomainPDA {
//   address: string;
//   bump: number;
// }

export interface DomainMapping {
  nameHash: string;
  name: string;
  polygonOwner: string;
  solanaDelegate?: string;
  solanaPda?: string;
  expiration?: number;
  wrapState?: WrapState;
  lastPolygonTx?: string;
  lastSolanaSlot?: number;
}

export interface PersistedRecord {
  nameHash: string;
  keyHash: string;
  key: string;
  recordType: RecordType;
  value: string;
  sourceChain: ChainType;
  version: number;
}

export interface RecordWriteRequest {
  name: string;
  chain: ChainType;
  recordType: RecordType;
  key: string;
  value: string;
  coinType?: number;
  propagate?: boolean;
  customKeyHash?: string;
}

export interface RecordDeleteRequest {
  name: string;
  chain: ChainType;
  key: string;
  recordType: RecordType;
  customKeyHash?: string;
}

export interface RecordResponse extends PersistedRecord {
  txHash?: string;
}

export interface NFTWrapRequest {
  name: string;
  fromChain: ChainType;
  targetChain: ChainType;
  owner: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
}
