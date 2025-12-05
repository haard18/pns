import { ethers, Interface } from 'ethers';
import logger from '../utils/logger';

export interface ParsedEvent {
  eventName: string;
  blockNumber: number;
  transactionHash: string;
  address: string;
  args: Record<string, any>;
  timestamp?: number;
}

export interface DomainEvent extends ParsedEvent {
  nameHash: string;
  name?: string;
  owner?: string;
  resolver?: string;
  expiration?: number;
}

export interface TextChangedEvent extends ParsedEvent {
  nameHash: string;
  indexedKey: string;
  key: string;
  value: string;
}

export interface AddressChangedEvent extends ParsedEvent {
  nameHash: string;
  coinType: number;
  newAddress: string;
}

// ABI for Registry events
const REGISTRY_EVENT_ABI = [
  'event NameRegistered(bytes32 indexed nameHash, string name, address indexed owner, address indexed resolver, uint64 expiration)',
  'event NameRenewed(bytes32 indexed nameHash, uint64 newExpiration)',
  'event OwnershipTransferred(bytes32 indexed nameHash, address indexed previousOwner, address indexed newOwner)',
  'event ResolverUpdated(bytes32 indexed nameHash, address indexed newResolver)',
];

// ABI for Resolver events
const RESOLVER_EVENT_ABI = [
  'event TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)',
  'event AddressChanged(bytes32 indexed node, uint256 coinType, bytes newAddress)',
];

// ABI for NFT events
const NFT_EVENT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

/**
 * Parse PNS Registry events
 */
export class EventParser {
  private provider: ethers.JsonRpcProvider;
  private registryInterface: Interface;
  private resolverInterface: Interface;
  private nftInterface: Interface;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.registryInterface = new Interface(REGISTRY_EVENT_ABI);
    this.resolverInterface = new Interface(RESOLVER_EVENT_ABI);
    this.nftInterface = new Interface(NFT_EVENT_ABI);
  }

  /**
   * Decode raw log using appropriate interface
   */
  private decodeLog(log: any, contractType: 'registry' | 'resolver' | 'nft'): { eventName: string; args: any } | null {
    try {
      let iface: Interface;
      switch (contractType) {
        case 'registry':
          iface = this.registryInterface;
          break;
        case 'resolver':
          iface = this.resolverInterface;
          break;
        case 'nft':
          iface = this.nftInterface;
          break;
      }

      const parsed = iface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });

      if (!parsed) return null;

      return {
        eventName: parsed.name,
        args: parsed.args,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse NameRegistered event from decoded args
   */
  parseNameRegistered(log: any, args: any): DomainEvent {
    return {
      eventName: 'NameRegistered',
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
      nameHash: args.nameHash,
      name: args.name,
      owner: args.owner,
      resolver: args.resolver,
      expiration: Number(args.expiration),
      args: args,
    };
  }

  /**
   * Parse NameRenewed event from decoded args
   */
  parseNameRenewed(log: any, args: any): DomainEvent {
    return {
      eventName: 'NameRenewed',
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
      nameHash: args.nameHash,
      expiration: Number(args.newExpiration),
      args: args,
    };
  }

  /**
   * Parse OwnershipTransferred event from decoded args
   */
  parseOwnershipTransferred(log: any, args: any): DomainEvent {
    return {
      eventName: 'OwnershipTransferred',
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
      nameHash: args.nameHash,
      owner: args.newOwner,
      args: args,
    };
  }

  /**
   * Parse ResolverUpdated event from decoded args
   */
  parseResolverUpdated(log: any, args: any): DomainEvent {
    return {
      eventName: 'ResolverUpdated',
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
      nameHash: args.nameHash,
      resolver: args.newResolver,
      args: args,
    };
  }

  /**
   * Parse TextChanged event (from resolver) from decoded args
   */
  parseTextChanged(log: any, args: any): TextChangedEvent {
    return {
      eventName: 'TextChanged',
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
      nameHash: args.node,
      indexedKey: args.indexedKey,
      key: args.key,
      value: args.value,
      args: args,
    };
  }

  /**
   * Parse AddressChanged event (from resolver) from decoded args
   */
  parseAddressChanged(log: any, args: any): AddressChangedEvent {
    return {
      eventName: 'AddressChanged',
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
      nameHash: args.node,
      coinType: Number(args.coinType),
      newAddress: ethers.hexlify(args.newAddress),
      args: args,
    };
  }

  /**
   * Parse Transfer event (from NFT) from decoded args
   */
  parseTransfer(log: any, args: any): DomainEvent {
    return {
      eventName: 'Transfer',
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
      nameHash: args.tokenId.toString(), // NFT tokenId corresponds to nameHash
      owner: args.to,
      args: args,
    };
  }

  /**
   * Get block timestamp
   */
  async getBlockTimestamp(blockNumber: number): Promise<number> {
    try {
      const block = await this.provider.getBlock(blockNumber);
      return block ? block.timestamp : Math.floor(Date.now() / 1000);
    } catch (error) {
      logger.error('Error fetching block timestamp:', { blockNumber, error });
      return Math.floor(Date.now() / 1000);
    }
  }

  /**
   * Determine contract type from address
   */
  private getContractType(address: string, contractAddresses?: { registry?: string; resolver?: string; domainNFT?: string }): 'registry' | 'resolver' | 'nft' | null {
    const addr = address.toLowerCase();

    if (contractAddresses) {
      if (contractAddresses.registry && addr === contractAddresses.registry.toLowerCase()) return 'registry';
      if (contractAddresses.resolver && addr === contractAddresses.resolver.toLowerCase()) return 'resolver';
      if (contractAddresses.domainNFT && addr === contractAddresses.domainNFT.toLowerCase()) return 'nft';
    }

    // Fallback: try to decode with each interface
    return null;
  }

  /**
   * Parse any PNS-related event from raw log
   */
  async parseEvent(log: any, contractAddresses?: { registry?: string; resolver?: string; domainNFT?: string }): Promise<ParsedEvent | null> {
    try {
      // Add timestamp to all events
      const timestamp = await this.getBlockTimestamp(log.blockNumber);

      // Determine contract type
      let contractType = this.getContractType(log.address, contractAddresses);

      // Try to decode the log
      let decoded: { eventName: string; args: any } | null = null;

      if (contractType) {
        decoded = this.decodeLog(log, contractType);
      } else {
        // Try each interface
        decoded = this.decodeLog(log, 'registry');
        if (!decoded) decoded = this.decodeLog(log, 'resolver');
        if (!decoded) decoded = this.decodeLog(log, 'nft');
      }

      if (!decoded) {
        logger.warn('Could not decode event', {
          address: log.address,
          topics: log.topics?.[0]?.substring(0, 10)
        });
        return null;
      }

      let parsedEvent: ParsedEvent | null = null;

      switch (decoded.eventName) {
        case 'NameRegistered':
          parsedEvent = this.parseNameRegistered(log, decoded.args);
          break;
        case 'NameRenewed':
          parsedEvent = this.parseNameRenewed(log, decoded.args);
          break;
        case 'OwnershipTransferred':
          parsedEvent = this.parseOwnershipTransferred(log, decoded.args);
          break;
        case 'ResolverUpdated':
          parsedEvent = this.parseResolverUpdated(log, decoded.args);
          break;
        case 'TextChanged':
          parsedEvent = this.parseTextChanged(log, decoded.args);
          break;
        case 'AddressChanged':
          parsedEvent = this.parseAddressChanged(log, decoded.args);
          break;
        case 'Transfer':
          parsedEvent = this.parseTransfer(log, decoded.args);
          break;
        default:
          logger.warn('Unhandled event type:', decoded.eventName);
          return null;
      }

      if (parsedEvent) {
        parsedEvent.timestamp = timestamp;
      }

      return parsedEvent;
    } catch (error) {
      logger.error('Error parsing event:', { log, error });
      return null;
    }
  }

  /**
   * Get event filters for PNS contracts
   */
  getEventFilters(_contractAddresses: {
    registry: string;
    resolver: string;
    domainNFT: string;
  }) {
    return {
      registry: [
        // NameRegistered
        ethers.id('NameRegistered(bytes32,string,address,address,uint64)'),
        // NameRenewed
        ethers.id('NameRenewed(bytes32,uint64)'),
        // OwnershipTransferred
        ethers.id('OwnershipTransferred(bytes32,address,address)'),
        // ResolverUpdated
        ethers.id('ResolverUpdated(bytes32,address)'),
      ],
      resolver: [
        // TextChanged
        ethers.id('TextChanged(bytes32,string,string,string)'),
        // AddressChanged
        ethers.id('AddressChanged(bytes32,uint256,bytes)'),
      ],
      domainNFT: [
        // Transfer
        ethers.id('Transfer(address,address,uint256)'),
      ],
    };
  }

  /**
   * Fetch logs for a specific contract and block range with automatic chunking
   * Handles RPC rate limits and large block ranges by splitting into smaller chunks
   */
  async fetchLogs(
    contractAddress: string,
    topics: string[],
    fromBlock: number,
    toBlock: number,
    maxChunkSize: number = 2000,
    retryCount: number = 0,
    maxRetries: number = 3
  ): Promise<any[]> {
    const blockRange = toBlock - fromBlock + 1;

    try {
      // If range is small enough, fetch directly
      if (blockRange <= maxChunkSize) {
        const logs = await this.provider.getLogs({
          address: contractAddress,
          topics: [topics],
          fromBlock,
          toBlock,
        });

        logger.debug('Fetched logs chunk', {
          contractAddress: contractAddress.substring(0, 10) + '...',
          fromBlock,
          toBlock,
          logsCount: logs.length,
        });

        return logs;
      }

      // Split into smaller chunks
      logger.debug('Splitting large block range into chunks', {
        fromBlock,
        toBlock,
        blockRange,
        chunkSize: maxChunkSize,
      });

      const allLogs: any[] = [];
      for (let start = fromBlock; start <= toBlock; start += maxChunkSize) {
        const end = Math.min(start + maxChunkSize - 1, toBlock);
        const chunkLogs = await this.fetchLogs(
          contractAddress,
          topics,
          start,
          end,
          maxChunkSize,
          0,
          maxRetries
        );
        allLogs.push(...chunkLogs);

        // Small delay between chunks to avoid rate limiting
        if (end < toBlock) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return allLogs;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);

      // Check if error is due to response size or rate limiting
      const isRateLimitError =
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('exceeded') ||
        errorMessage.includes('query returned more than');

      if (isRateLimitError && blockRange > 100) {
        // Reduce chunk size and retry
        const newChunkSize = Math.max(100, Math.floor(maxChunkSize / 2));
        logger.warn('Rate limit or size error, reducing chunk size', {
          contractAddress: contractAddress.substring(0, 10) + '...',
          fromBlock,
          toBlock,
          oldChunkSize: maxChunkSize,
          newChunkSize,
          error: errorMessage.substring(0, 100),
        });

        return this.fetchLogs(
          contractAddress,
          topics,
          fromBlock,
          toBlock,
          newChunkSize,
          0,
          maxRetries
        );
      }

      // Retry with exponential backoff for transient errors
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        logger.warn('Retrying fetchLogs after error', {
          contractAddress: contractAddress.substring(0, 10) + '...',
          fromBlock,
          toBlock,
          retryCount: retryCount + 1,
          maxRetries,
          delayMs: delay,
          error: errorMessage.substring(0, 100),
        });

        await new Promise(resolve => setTimeout(resolve, delay));

        return this.fetchLogs(
          contractAddress,
          topics,
          fromBlock,
          toBlock,
          maxChunkSize,
          retryCount + 1,
          maxRetries
        );
      }

      logger.error('Error fetching logs after retries:', {
        contractAddress,
        fromBlock,
        toBlock,
        retryCount,
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Get the latest block number
   */
  async getLatestBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      logger.error('Error getting latest block number:', error);
      throw error;
    }
  }
}

export default EventParser;