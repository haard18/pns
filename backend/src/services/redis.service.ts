import { createClient, RedisClientType } from 'redis';
import { Config } from '../config';
import logger from '../utils/logger';

class RedisService {
  private client: RedisClientType | null = null;
  private readonly LAST_BLOCK_KEY = 'indexer:last_scanned_block';
  private readonly INDEXER_STATE_KEY = 'indexer:state';

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: Config.redis.url,
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      await this.client.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Get Redis client
   */
  getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis not initialized. Call connect() first.');
    }
    return this.client;
  }

  /**
   * Get last scanned block number
   */
  async getLastScannedBlock(): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }

    try {
      const value = await this.client.get(this.LAST_BLOCK_KEY);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      logger.error('Error getting last scanned block from Redis:', error);
      return 0;
    }
  }

  /**
   * Set last scanned block number
   */
  async setLastScannedBlock(blockNumber: number): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }

    try {
      await this.client.set(this.LAST_BLOCK_KEY, blockNumber.toString());
      logger.debug('Saved last scanned block to Redis:', blockNumber);
    } catch (error) {
      logger.error('Error setting last scanned block in Redis:', error);
      throw error;
    }
  }

  /**
   * Get indexer state
   */
  async getIndexerState(): Promise<any> {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }

    try {
      const value = await this.client.get(this.INDEXER_STATE_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Error getting indexer state from Redis:', error);
      return null;
    }
  }

  /**
   * Set indexer state
   */
  async setIndexerState(state: any): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }

    try {
      await this.client.set(this.INDEXER_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      logger.error('Error setting indexer state in Redis:', error);
      throw error;
    }
  }

  /**
   * Cache domain data
   */
  async cacheDomain(nameHash: string, domain: any, ttl: number = 3600): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }

    try {
      const key = `domain:${nameHash}`;
      await this.client.setEx(key, ttl, JSON.stringify(domain));
    } catch (error) {
      logger.error('Error caching domain:', error);
    }
  }

  /**
   * Get cached domain data
   */
  async getCachedDomain(nameHash: string): Promise<any | null> {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }

    try {
      const key = `domain:${nameHash}`;
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Error getting cached domain:', error);
      return null;
    }
  }

  /**
   * Invalidate domain cache
   */
  async invalidateDomainCache(nameHash: string): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }

    try {
      const key = `domain:${nameHash}`;
      await this.client.del(key);
    } catch (error) {
      logger.error('Error invalidating domain cache:', error);
    }
  }

  /**
   * Set a generic key-value pair
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }

    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Error setting Redis key:', error);
      throw error;
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Error getting Redis key:', error);
      return null;
    }
  }

  /**
   * Delete key
   */
  async delete(key: string): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Error deleting Redis key:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info('Redis disconnected');
    }
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed:', error);
      return false;
    }
  }
}

export default new RedisService();
