import { EventParser, DomainEvent, TextChangedEvent, AddressChangedEvent } from '../services/eventParser';
import { DomainService } from '../services/domain.service';
import { Config } from '../config';
import logger from '../utils/logger';
import database from '../services/database.service';
import redis from '../services/redis.service';

export interface IndexerState {
  lastProcessedBlock: number;
  isRunning: boolean;
  totalEventsProcessed: number;
}

export interface ScanRange {
  fromBlock: number;
  toBlock: number;
}

/**
 * Service for scanning and indexing blockchain events
 * Maintains a local database copy of domain state
 */
export class EventIndexer {
  private eventParser: EventParser;
  private domainService: DomainService;
  private state: IndexerState;
  private readonly batchSize: number;
  private scanInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.eventParser = new EventParser(Config.polygon.rpcUrl);
    this.domainService = new DomainService();

    // Use config batch size with conservative default for better RPC compatibility
    // Smaller batches = more requests but less likely to hit rate limits
    this.batchSize = Config.indexer.batchSize || 500;

    this.state = {
      lastProcessedBlock: 0,
      isRunning: false,
      totalEventsProcessed: 0,
    };
  }

  /**
   * Initialize the indexer
   */
  async initialize(): Promise<void> {
    try {
      // Load last processed block from database or config
      this.state.lastProcessedBlock = await this.getLastProcessedBlock();

      logger.info('Event indexer initialized', {
        lastProcessedBlock: this.state.lastProcessedBlock,
      });
    } catch (error) {
      logger.error('Failed to initialize event indexer:', error);
      throw error;
    }
  }

  /**
   * Start the indexer loop
   */
  async start(): Promise<void> {
    if (this.state.isRunning) {
      logger.warn('Indexer is already running');
      return;
    }

    this.state.isRunning = true;
    logger.info('Starting event indexer...');

    // Initial scan
    await this.scanEvents();

    // Set up recurring scan
    this.scanInterval = setInterval(async () => {
      try {
        await this.scanEvents();
      } catch (error) {
        logger.error('Error in scan interval:', error);
      }
    }, Config.indexer.scanIntervalMs || 30000); // Default 30 seconds

    logger.info('Event indexer started successfully');
  }

  /**
   * Stop the indexer
   */
  stop(): void {
    if (!this.state.isRunning) {
      return;
    }

    this.state.isRunning = false;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    logger.info('Event indexer stopped');
  }

  /**
   * Scan for new events
   */
  async scanEvents(): Promise<void> {
    if (!this.state.isRunning) {
      return;
    }

    try {
      const latestBlock = await this.eventParser.getLatestBlockNumber();
      const startBlock = this.state.lastProcessedBlock + 1;

      if (startBlock > latestBlock) {
        logger.debug('No new blocks to process');
        return;
      }

      logger.info('Scanning events', {
        fromBlock: startBlock,
        toBlock: latestBlock,
        blocksToProcess: latestBlock - startBlock + 1,
      });

      // Process in batches
      for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += this.batchSize) {
        const toBlock = Math.min(fromBlock + this.batchSize - 1, latestBlock);

        await this.processBatch({ fromBlock, toBlock });

        // Update last processed block
        this.state.lastProcessedBlock = toBlock;
        await this.saveLastProcessedBlock(toBlock);
      }

      logger.info('Event scan completed', {
        lastProcessedBlock: this.state.lastProcessedBlock,
        totalEventsProcessed: this.state.totalEventsProcessed,
      });
    } catch (error) {
      logger.error('Error scanning events:', error);
      throw error;
    }
  }

  /**
   * Process a batch of blocks
   * Optimized to make sequential requests to avoid RPC rate limits
   */
  private async processBatch(range: ScanRange): Promise<void> {
    const contractAddresses = {
      registry: Config.contracts.registry,
      registrar: Config.contracts.registrar,
      controller: Config.contracts.controller,
      resolver: Config.contracts.resolver,
      domainNFT: Config.contracts.domainNFT,
    };

    const eventFilters = this.eventParser.getEventFilters(contractAddresses);
    const delayBetweenRequests = 200; // 200ms delay between contract queries

    try {
      // Fetch logs SEQUENTIALLY to avoid overwhelming the RPC
      // Priority order: Registrar (has plaintext names) > Registry > Controller > NFT > Resolver
      
      const allLogs: any[] = [];
      
      // 1. Registrar - MOST IMPORTANT (emits NameRegistered with plaintext names)
      const registrarLogs = await this.eventParser.fetchLogs(
        contractAddresses.registrar,
        eventFilters.registrar,
        range.fromBlock,
        range.toBlock,
        Config.indexer.logChunkSize
      );
      allLogs.push(...registrarLogs);
      
      if (registrarLogs.length > 0) {
        logger.debug('Fetched registrar logs', { count: registrarLogs.length });
      }
      await this.delay(delayBetweenRequests);

      // 2. Controller - Also emits registration events
      const controllerLogs = await this.eventParser.fetchLogs(
        contractAddresses.controller,
        eventFilters.controller,
        range.fromBlock,
        range.toBlock,
        Config.indexer.logChunkSize
      );
      allLogs.push(...controllerLogs);
      await this.delay(delayBetweenRequests);

      // 3. Registry - Ownership and resolver updates
      const registryLogs = await this.eventParser.fetchLogs(
        contractAddresses.registry,
        eventFilters.registry,
        range.fromBlock,
        range.toBlock,
        Config.indexer.logChunkSize
      );
      allLogs.push(...registryLogs);
      await this.delay(delayBetweenRequests);

      // 4. NFT - Transfer events
      const nftLogs = await this.eventParser.fetchLogs(
        contractAddresses.domainNFT,
        eventFilters.domainNFT,
        range.fromBlock,
        range.toBlock,
        Config.indexer.logChunkSize
      );
      allLogs.push(...nftLogs);
      await this.delay(delayBetweenRequests);

      // 5. Resolver - Text and address records (least priority)
      const resolverLogs = await this.eventParser.fetchLogs(
        contractAddresses.resolver,
        eventFilters.resolver,
        range.fromBlock,
        range.toBlock,
        Config.indexer.logChunkSize
      );
      allLogs.push(...resolverLogs);

      // Sort logs by block number and transaction index
      allLogs.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return a.blockNumber - b.blockNumber;
        }
        return (a.transactionIndex || 0) - (b.transactionIndex || 0);
      });

      logger.debug('Processing batch', {
        fromBlock: range.fromBlock,
        toBlock: range.toBlock,
        totalLogs: allLogs.length,
      });

      // Process each log
      for (const log of allLogs) {
        await this.processLog(log, contractAddresses);
        this.state.totalEventsProcessed++;
      }
    } catch (error) {
      logger.error('Error processing batch:', { range, error });
      throw error;
    }
  }

  /**
   * Process a single log entry
   */
  private async processLog(log: any, contractAddresses: { registry: string; registrar: string; resolver: string; domainNFT: string }): Promise<void> {
    try {
      const parsedEvent = await this.eventParser.parseEvent(log, contractAddresses);

      if (!parsedEvent) {
        return;
      }

      logger.debug('Processing event', {
        eventName: parsedEvent.eventName,
        blockNumber: parsedEvent.blockNumber,
        transactionHash: parsedEvent.transactionHash,
      });

      // Save event log to database
      await database.saveEventLog({
        eventName: parsedEvent.eventName,
        nameHash: (parsedEvent as any).nameHash || '',
        name: (parsedEvent as any).name,
        owner: (parsedEvent as any).owner,
        resolver: (parsedEvent as any).resolver,
        expiration: (parsedEvent as any).expiration,
        blockNumber: parsedEvent.blockNumber,
        transactionHash: parsedEvent.transactionHash,
        transactionIndex: log.transactionIndex,
        logIndex: log.logIndex,
        rawData: log,
      });

      // Handle different event types
      switch (parsedEvent.eventName) {
        case 'NameRegistered':
          await this.handleNameRegistered(parsedEvent as DomainEvent);
          break;
        case 'NameRenewed':
          await this.handleNameRenewed(parsedEvent as DomainEvent);
          break;
        case 'OwnershipTransferred':
          await this.handleOwnershipTransferred(parsedEvent as DomainEvent);
          break;
        case 'ResolverUpdated':
          await this.handleResolverUpdated(parsedEvent as DomainEvent);
          break;
        case 'Transfer':
          await this.handleTransfer(parsedEvent as DomainEvent);
          break;
        case 'TextChanged':
          await this.handleTextChanged(parsedEvent as TextChangedEvent);
          break;
        case 'AddressChanged':
          await this.handleAddressChanged(parsedEvent as AddressChangedEvent);
          break;
        default:
          logger.debug('Unhandled event type:', parsedEvent.eventName);
      }
    } catch (error) {
      logger.error('Error processing log:', error);
      throw error;
    }
  }

  /**
   * Handle NameRegistered event
   */
  private async handleNameRegistered(event: DomainEvent): Promise<void> {
    // Skip events with empty domain names
    if (!event.name || event.name.trim() === '') {
      logger.warn('Skipping NameRegistered event with empty name', {
        nameHash: event.nameHash,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      });
      return;
    }

    await database.upsertDomain({
      nameHash: event.nameHash,
      name: event.name,
      owner: event.owner!,
      resolver: event.resolver!,
      expiration: event.expiration!,
      lastUpdatedBlock: event.blockNumber,
      lastUpdatedTx: event.transactionHash,
    });

    // Invalidate cache
    await redis.invalidateDomainCache(event.nameHash);

    // Also update via domain service for backwards compatibility
    await this.domainService.createOrUpdateDomain({
      nameHash: event.nameHash,
      name: event.name,
      owner: event.owner!,
      resolver: event.resolver!,
      expiration: event.expiration!,
      lastUpdatedBlock: event.blockNumber,
      lastUpdatedTx: event.transactionHash,
    });
  }

  /**
   * Handle NameRenewed event
   */
  private async handleNameRenewed(event: DomainEvent): Promise<void> {
    await database.updateDomainExpiration({
      nameHash: event.nameHash,
      expiration: event.expiration!,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });

    // Invalidate cache
    await redis.invalidateDomainCache(event.nameHash);

    await this.domainService.updateDomainExpiration(
      event.nameHash,
      event.expiration!,
      event.blockNumber,
      event.transactionHash
    );
  }

  /**
   * Handle OwnershipTransferred event
   */
  private async handleOwnershipTransferred(event: DomainEvent): Promise<void> {
    await database.updateDomainOwner({
      nameHash: event.nameHash,
      owner: event.owner!,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });

    // Invalidate cache
    await redis.invalidateDomainCache(event.nameHash);

    await this.domainService.updateDomainOwner(
      event.nameHash,
      event.owner!,
      event.blockNumber,
      event.transactionHash
    );
  }

  /**
   * Handle ResolverUpdated event
   */
  private async handleResolverUpdated(event: DomainEvent): Promise<void> {
    await database.updateDomainResolver({
      nameHash: event.nameHash,
      resolver: event.resolver!,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });

    // Invalidate cache
    await redis.invalidateDomainCache(event.nameHash);

    logger.debug('Resolver updated', {
      nameHash: event.nameHash,
      resolver: event.resolver,
    });
  }

  /**
   * Handle Transfer event (NFT Transfer)
   * This handles ownership changes when NFT is transferred
   * Skip mints (from zero address) as they're handled by NameRegistered
   * Skip burns (to zero address) as they indicate domain deletion
   */
  private async handleTransfer(event: DomainEvent): Promise<void> {
    const isMint = event.args?.isMint;
    const isBurn = event.args?.isBurn;
    
    // Skip mints - handled by NameRegistered event
    if (isMint) {
      logger.debug('Skipping Transfer event (mint)', {
        nameHash: event.nameHash,
        to: event.owner,
      });
      return;
    }
    
    // Log burns but still process (domain expired/burned)
    if (isBurn) {
      logger.info('Transfer to zero address (burn)', {
        nameHash: event.nameHash,
      });
      // Optionally mark domain as burned/expired in database
      // For now, we'll still update owner to zero address
    }
    
    logger.info('Processing domain transfer', {
      nameHash: event.nameHash,
      newOwner: event.owner,
      blockNumber: event.blockNumber,
    });
    
    await database.updateDomainOwner({
      nameHash: event.nameHash,
      owner: event.owner!,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });

    // Invalidate cache
    await redis.invalidateDomainCache(event.nameHash);

    await this.domainService.updateDomainOwner(
      event.nameHash,
      event.owner!,
      event.blockNumber,
      event.transactionHash
    );
  }

  /**
   * Handle TextChanged event
   */
  private async handleTextChanged(event: TextChangedEvent): Promise<void> {
    await database.updateTextRecord({
      nameHash: event.nameHash,
      key: event.key!,
      value: event.value!,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });

    // Invalidate cache
    await redis.invalidateDomainCache(event.nameHash);

    logger.debug('Text record changed', {
      nameHash: event.nameHash,
      key: event.key,
      value: event.value,
    });
  }

  /**
   * Handle AddressChanged event
   */
  private async handleAddressChanged(event: AddressChangedEvent): Promise<void> {
    await database.updateAddressRecord({
      nameHash: event.nameHash,
      coinType: event.coinType!,
      address: event.newAddress!,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });

    // Invalidate cache
    await redis.invalidateDomainCache(event.nameHash);

    logger.debug('Address record changed', {
      nameHash: event.nameHash,
      coinType: event.coinType,
      newAddress: event.newAddress,
    });
  }

  /**
   * Get last processed block from Redis
   */
  private async getLastProcessedBlock(): Promise<number> {
    try {
      const lastBlock = await redis.getLastScannedBlock();
      // If no block in Redis, use deployment block as starting point
      return lastBlock || Config.contracts.deploymentBlock || 0;
    } catch (error) {
      logger.error('Error getting last processed block from Redis:', error);
      // Fallback to deployment block
      return Config.contracts.deploymentBlock || 0;
    }
  }

  /**
   * Save last processed block to Redis
   */
  private async saveLastProcessedBlock(blockNumber: number): Promise<void> {
    try {
      await redis.setLastScannedBlock(blockNumber);
      logger.debug('Saved last processed block to Redis:', blockNumber);
    } catch (error) {
      logger.error('Error saving last processed block to Redis:', error);
      throw error;
    }
  }

  /**
   * Helper to add delay between operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get indexer status
   */
  getStatus(): IndexerState {
    return { ...this.state };
  }

  /**
   * Manually trigger a resync from a specific block
   */
  async resyncFromBlock(fromBlock: number): Promise<void> {
    if (this.state.isRunning) {
      throw new Error('Cannot resync while indexer is running');
    }

    logger.info('Starting manual resync', { fromBlock });

    this.state.lastProcessedBlock = fromBlock - 1;
    await this.saveLastProcessedBlock(this.state.lastProcessedBlock);

    await this.scanEvents();

    logger.info('Manual resync completed');
  }
}

export default EventIndexer;