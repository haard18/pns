import logger from '../utils/logger';

export interface DomainRecord {
  nameHash: string;
  name: string;
  owner: string;
  resolver: string;
  expiration: number;
  lastUpdatedBlock: number;
  lastUpdatedTx: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionRecord {
  id?: string;
  user: string;
  action: string;
  domain?: string;
  txHash: string;
  blockNumber?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Domain service for managing indexed domain data
 * This is READ-ONLY from blockchain perspective - only stores indexed events
 */
export class DomainService {
  // In a real implementation, this would use a database like PostgreSQL, MongoDB, etc.
  // For now, using in-memory storage for demonstration
  private domains: Map<string, DomainRecord> = new Map();
  private transactions: TransactionRecord[] = [];

  /**
   * Create or update a domain record
   */
  async createOrUpdateDomain(domain: Omit<DomainRecord, 'createdAt' | 'updatedAt'>): Promise<DomainRecord> {
    try {
      const existing = this.domains.get(domain.nameHash);
      const now = new Date();

      const domainRecord: DomainRecord = {
        ...domain,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      this.domains.set(domain.nameHash, domainRecord);

      logger.info('Domain record updated', {
        nameHash: domain.nameHash,
        name: domain.name,
        owner: domain.owner,
        expiration: domain.expiration,
      });

      return domainRecord;
    } catch (error) {
      logger.error('Error creating/updating domain:', error);
      throw error;
    }
  }

  /**
   * Update domain expiration
   */
  async updateDomainExpiration(
    nameHash: string,
    expiration: number,
    blockNumber: number,
    txHash: string
  ): Promise<void> {
    try {
      const domain = this.domains.get(nameHash);
      if (!domain) {
        logger.warn('Attempted to update expiration for non-existent domain:', nameHash);
        return;
      }

      domain.expiration = expiration;
      domain.lastUpdatedBlock = blockNumber;
      domain.lastUpdatedTx = txHash;
      domain.updatedAt = new Date();

      this.domains.set(nameHash, domain);

      logger.info('Domain expiration updated', {
        nameHash,
        expiration,
        blockNumber,
      });
    } catch (error) {
      logger.error('Error updating domain expiration:', error);
      throw error;
    }
  }

  /**
   * Update domain owner
   */
  async updateDomainOwner(
    nameHash: string,
    owner: string,
    blockNumber: number,
    txHash: string
  ): Promise<void> {
    try {
      const domain = this.domains.get(nameHash);
      if (!domain) {
        logger.warn('Attempted to update owner for non-existent domain:', nameHash);
        return;
      }

      domain.owner = owner;
      domain.lastUpdatedBlock = blockNumber;
      domain.lastUpdatedTx = txHash;
      domain.updatedAt = new Date();

      this.domains.set(nameHash, domain);

      logger.info('Domain owner updated', {
        nameHash,
        owner,
        blockNumber,
      });
    } catch (error) {
      logger.error('Error updating domain owner:', error);
      throw error;
    }
  }

  /**
   * Update domain resolver
   */
  async updateDomainResolver(
    nameHash: string,
    resolver: string,
    blockNumber: number,
    txHash: string
  ): Promise<void> {
    try {
      const domain = this.domains.get(nameHash);
      if (!domain) {
        logger.warn('Attempted to update resolver for non-existent domain:', nameHash);
        return;
      }

      domain.resolver = resolver;
      domain.lastUpdatedBlock = blockNumber;
      domain.lastUpdatedTx = txHash;
      domain.updatedAt = new Date();

      this.domains.set(nameHash, domain);

      logger.info('Domain resolver updated', {
        nameHash,
        resolver,
        blockNumber,
      });
    } catch (error) {
      logger.error('Error updating domain resolver:', error);
      throw error;
    }
  }

  /**
   * Get domain by nameHash
   */
  async getDomainByNameHash(nameHash: string): Promise<DomainRecord | null> {
    return this.domains.get(nameHash) || null;
  }

  /**
   * Get domain by name
   */
  async getDomainByName(name: string): Promise<DomainRecord | null> {
    // In a real database, this would be an indexed query
    for (const domain of this.domains.values()) {
      if (domain.name === name) {
        return domain;
      }
    }
    return null;
  }

  /**
   * Get domains owned by an address
   */
  async getDomainsByOwner(owner: string): Promise<DomainRecord[]> {
    const ownedDomains: DomainRecord[] = [];

    for (const domain of this.domains.values()) {
      if (domain.owner.toLowerCase() === owner.toLowerCase()) {
        ownedDomains.push(domain);
      }
    }

    // Sort by expiration date (newest first)
    return ownedDomains.sort((a, b) => b.expiration - a.expiration);
  }

  /**
   * Get all domains (paginated)
   */
  async getAllDomains(page: number = 1, limit: number = 100): Promise<{
    domains: DomainRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const domains = Array.from(this.domains.values());
    const total = domains.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedDomains = domains
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
      .slice(startIndex, endIndex);

    return {
      domains: paginatedDomains,
      total,
      page,
      limit,
    };
  }

  /**
   * Search domains by name pattern
   */
  async searchDomains(query: string, limit: number = 50): Promise<DomainRecord[]> {
    const results: DomainRecord[] = [];
    const lowerQuery = query.toLowerCase();

    for (const domain of this.domains.values()) {
      if (domain.name.toLowerCase().includes(lowerQuery)) {
        results.push(domain);
        if (results.length >= limit) break;
      }
    }

    return results.sort((a, b) => {
      // Prioritize exact matches and shorter names
      const aExact = a.name.toLowerCase() === lowerQuery;
      const bExact = b.name.toLowerCase() === lowerQuery;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      return a.name.length - b.name.length;
    });
  }

  /**
   * Record a transaction
   */
  async recordTransaction(transaction: Omit<TransactionRecord, 'id' | 'timestamp'>): Promise<TransactionRecord> {
    try {
      const txRecord: TransactionRecord = {
        ...transaction,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      };

      this.transactions.push(txRecord);

      logger.info('Transaction recorded', {
        user: transaction.user,
        action: transaction.action,
        domain: transaction.domain,
        txHash: transaction.txHash,
      });

      return txRecord;
    } catch (error) {
      logger.error('Error recording transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for a user
   */
  async getUserTransactions(
    userAddress: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    transactions: TransactionRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const userTxs = this.transactions.filter(
      tx => tx.user.toLowerCase() === userAddress.toLowerCase()
    );

    const total = userTxs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedTxs = userTxs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(startIndex, endIndex);

    return {
      transactions: paginatedTxs,
      total,
      page,
      limit,
    };
  }

  /**
   * Get all transactions for a domain
   */
  async getDomainTransactions(domain: string): Promise<TransactionRecord[]> {
    return this.transactions
      .filter(tx => tx.domain === domain)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    totalDomains: number;
    totalTransactions: number;
    registrationsToday: number;
    activeUsers: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const registrationsToday = this.transactions.filter(
      tx => tx.action === 'register' && tx.timestamp >= todayStart
    ).length;

    const uniqueUsers = new Set(
      this.transactions
        .filter(tx => tx.timestamp >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        .map(tx => tx.user.toLowerCase())
    ).size;

    return {
      totalDomains: this.domains.size,
      totalTransactions: this.transactions.length,
      registrationsToday,
      activeUsers: uniqueUsers,
    };
  }

  /**
   * Clear all data (for testing)
   */
  async clearAll(): Promise<void> {
    this.domains.clear();
    this.transactions.length = 0;
    logger.info('All domain data cleared');
  }

  /**
   * Get expired domains
   */
  async getExpiredDomains(): Promise<DomainRecord[]> {
    const now = Math.floor(Date.now() / 1000);
    const expiredDomains: DomainRecord[] = [];

    for (const domain of this.domains.values()) {
      if (domain.expiration <= now) {
        expiredDomains.push(domain);
      }
    }

    return expiredDomains.sort((a, b) => a.expiration - b.expiration);
  }

  /**
   * Get domains expiring soon
   */
  async getExpiringDomains(days: number = 30): Promise<DomainRecord[]> {
    const now = Math.floor(Date.now() / 1000);
    const futureTime = now + (days * 24 * 60 * 60);
    const expiringDomains: DomainRecord[] = [];

    for (const domain of this.domains.values()) {
      if (domain.expiration > now && domain.expiration <= futureTime) {
        expiringDomains.push(domain);
      }
    }

    return expiringDomains.sort((a, b) => a.expiration - b.expiration);
  }
}

export default DomainService;