import { EventParser, DomainEvent, TextChangedEvent, AddressChangedEvent } from '../services/eventParser';
import { DomainService } from '../services/domain.service';
import { Config } from '../config';
import logger from '../utils/logger';

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
  private readonly maxRetries = 3;
  private scanInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.eventParser = new EventParser(Config.polygon.rpcUrl);
    this.domainService = new DomainService();
    
    // Use config batch size, default to 5 for QuickNode free tier compatibility
    this.batchSize = Config.indexer.batchSize || 5;
    
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
   */
  private async processBatch(range: ScanRange): Promise<void> {
    const contractAddresses = {
      registry: Config.contracts.registry,
      resolver: Config.contracts.resolver,
      domainNFT: Config.contracts.domainNFT,
    };

    const eventFilters = this.eventParser.getEventFilters(contractAddresses);

    try {
      // Fetch logs from all contracts
      const [registryLogs, resolverLogs, nftLogs] = await Promise.all([
        this.eventParser.fetchLogs(
          contractAddresses.registry,
          eventFilters.registry,
          range.fromBlock,
          range.toBlock
        ),
        this.eventParser.fetchLogs(
          contractAddresses.resolver,
          eventFilters.resolver,
          range.fromBlock,
          range.toBlock
        ),
        this.eventParser.fetchLogs(
          contractAddresses.domainNFT,
          eventFilters.domainNFT,
          range.fromBlock,
          range.toBlock
        ),
      ]);

      const allLogs = [...registryLogs, ...resolverLogs, ...nftLogs];
      
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
  private async processLog(log: any, contractAddresses: { registry: string; resolver: string; domainNFT: string }): Promise<void> {
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
          logger.warn('Unhandled event type:', parsedEvent.eventName);
      }
    } catch (error) {
      logger.error('Error processing log:', { log, error });
    }
  }

  /**
   * Handle NameRegistered event
   */
  private async handleNameRegistered(event: DomainEvent): Promise<void> {
    await this.domainService.createOrUpdateDomain({
      nameHash: event.nameHash,
      name: event.name!,
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
    await this.domainService.updateDomainResolver(
      event.nameHash,
      event.resolver!,
      event.blockNumber,
      event.transactionHash
    );
  }

  /**
   * Handle Transfer event (NFT)
   */
  private async handleTransfer(event: DomainEvent): Promise<void> {
    // For NFT transfers, update domain ownership
    if (event.owner && event.owner !== '0x0000000000000000000000000000000000000000') {
      await this.domainService.updateDomainOwner(
        event.nameHash,
        event.owner,
        event.blockNumber,
        event.transactionHash
      );
    }
  }

  /**
   * Handle TextChanged event
   */
  private async handleTextChanged(event: TextChangedEvent): Promise<void> {
    // Update text records in domain service if needed
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
    // Update address records in domain service if needed
    logger.debug('Address record changed', {
      nameHash: event.nameHash,
      coinType: event.coinType,
      newAddress: event.newAddress,
    });
  }

  /**
   * Get last processed block from database
   */
  private async getLastProcessedBlock(): Promise<number> {
    try {
      // This should read from your database
      // For now, return deployment block or 0
      return Config.contracts.deploymentBlock || 0;
    } catch (error) {
      logger.error('Error getting last processed block:', error);
      return 0;
    }
  }

  /**
   * Save last processed block to database
   */
  private async saveLastProcessedBlock(blockNumber: number): Promise<void> {
    try {
      // This should save to your database
      logger.debug('Saving last processed block:', blockNumber);
    } catch (error) {
      logger.error('Error saving last processed block:', error);
    }
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