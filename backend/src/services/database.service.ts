import { Pool, PoolClient } from 'pg';
import { Config } from '../config';
import logger from '../utils/logger';

class Database {
  private pool: Pool | null = null;

  /**
   * Initialize database connection pool
   */
  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        connectionString: Config.database.url,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      logger.info('Database connected successfully', {
        timestamp: result.rows[0].now,
      });
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Get database pool
   */
  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not initialized. Call connect() first.');
    }
    return this.pool;
  }

  /**
   * Execute a query
   */
  async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      logger.error('Database query error:', { text, params, error });
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    return await this.pool.connect();
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database disconnected');
    }
  }

  /**
   * Save event log to database
   */
  async saveEventLog(event: {
    eventName: string;
    nameHash: string;
    name?: string;
    owner?: string;
    resolver?: string;
    expiration?: number;
    blockNumber: number;
    transactionHash: string;
    transactionIndex?: number;
    logIndex?: number;
    rawData?: any;
  }): Promise<void> {
    const query = `
      INSERT INTO event_logs (
        event_name, name_hash, name, owner, resolver, expiration,
        block_number, transaction_hash, transaction_index, log_index, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (transaction_hash, log_index) DO NOTHING
    `;

    await this.query(query, [
      event.eventName,
      event.nameHash,
      event.name || null,
      event.owner || null,
      event.resolver || null,
      event.expiration || null,
      event.blockNumber,
      event.transactionHash,
      event.transactionIndex || null,
      event.logIndex || null,
      event.rawData ? JSON.stringify(event.rawData) : null,
    ]);
  }

  /**
   * Update or create domain
   */
  async upsertDomain(domain: {
    nameHash: string;
    name: string;
    owner: string;
    resolver?: string;
    expiration?: number;
    lastUpdatedBlock: number;
    lastUpdatedTx: string;
  }): Promise<void> {
    const query = `
      INSERT INTO domains (
        name_hash, name, owner, resolver, expiration,
        last_updated_block, last_updated_tx
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (name_hash) DO UPDATE SET
        owner = EXCLUDED.owner,
        resolver = EXCLUDED.resolver,
        expiration = EXCLUDED.expiration,
        last_updated_block = EXCLUDED.last_updated_block,
        last_updated_tx = EXCLUDED.last_updated_tx,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.query(query, [
      domain.nameHash,
      domain.name,
      domain.owner,
      domain.resolver || null,
      domain.expiration || null,
      domain.lastUpdatedBlock,
      domain.lastUpdatedTx,
    ]);
  }

  /**
   * Get domain by name hash
   */
  async getDomain(nameHash: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM domains WHERE name_hash = $1',
      [nameHash]
    );
    return result.rows[0];
  }

  /**
   * Get domains by owner
   */
  async getDomainsByOwner(owner: string): Promise<any[]> {
    const result = await this.query(
      'SELECT * FROM domains WHERE owner = $1 ORDER BY name ASC',
      [owner]
    );
    return result.rows;
  }

  /**
   * Update text record
   */
  async updateTextRecord(record: {
    nameHash: string;
    key: string;
    value: string;
    blockNumber: number;
    transactionHash: string;
  }): Promise<void> {
    const query = `
      INSERT INTO text_records (name_hash, key, value, block_number, transaction_hash)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name_hash, key) DO UPDATE SET
        value = EXCLUDED.value,
        block_number = EXCLUDED.block_number,
        transaction_hash = EXCLUDED.transaction_hash,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.query(query, [
      record.nameHash,
      record.key,
      record.value,
      record.blockNumber,
      record.transactionHash,
    ]);
  }

  /**
   * Update address record
   */
  async updateAddressRecord(record: {
    nameHash: string;
    coinType: number;
    address: string;
    blockNumber: number;
    transactionHash: string;
  }): Promise<void> {
    const query = `
      INSERT INTO address_records (name_hash, coin_type, address, block_number, transaction_hash)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name_hash, coin_type) DO UPDATE SET
        address = EXCLUDED.address,
        block_number = EXCLUDED.block_number,
        transaction_hash = EXCLUDED.transaction_hash,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.query(query, [
      record.nameHash,
      record.coinType,
      record.address,
      record.blockNumber,
      record.transactionHash,
    ]);
  }

  /**
   * Get event logs by name hash
   */
  async getEventLogsByNameHash(nameHash: string): Promise<any[]> {
    const result = await this.query(
      'SELECT * FROM event_logs WHERE name_hash = $1 ORDER BY block_number DESC, log_index DESC',
      [nameHash]
    );
    return result.rows;
  }

  /**
   * Update domain expiration
   */
  async updateDomainExpiration(update: {
    nameHash: string;
    expiration: number;
    blockNumber: number;
    transactionHash: string;
  }): Promise<void> {
    const query = `
      UPDATE domains SET
        expiration = $1,
        last_updated_block = $2,
        last_updated_tx = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE name_hash = $4
    `;

    await this.query(query, [
      update.expiration,
      update.blockNumber,
      update.transactionHash,
      update.nameHash,
    ]);
  }

  /**
   * Update domain owner
   */
  async updateDomainOwner(update: {
    nameHash: string;
    owner: string;
    blockNumber: number;
    transactionHash: string;
  }): Promise<void> {
    const query = `
      UPDATE domains SET
        owner = $1,
        last_updated_block = $2,
        last_updated_tx = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE name_hash = $4
    `;

    await this.query(query, [
      update.owner,
      update.blockNumber,
      update.transactionHash,
      update.nameHash,
    ]);
  }

  /**
   * Update domain resolver
   */
  async updateDomainResolver(update: {
    nameHash: string;
    resolver: string;
    blockNumber: number;
    transactionHash: string;
  }): Promise<void> {
    const query = `
      UPDATE domains SET
        resolver = $1,
        last_updated_block = $2,
        last_updated_tx = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE name_hash = $4
    `;

    await this.query(query, [
      update.resolver,
      update.blockNumber,
      update.transactionHash,
      update.nameHash,
    ]);
  }
}

export default new Database();
