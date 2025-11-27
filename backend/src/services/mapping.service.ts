import { Pool } from 'pg';
import { Config } from '../config';
import logger from '../utils/logger';
import { DomainMapping, PersistedRecord } from '../types';

const CREATE_DOMAIN_TABLE = `
CREATE TABLE IF NOT EXISTS domains (
  name_hash TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  polygon_owner TEXT NOT NULL,
  solana_delegate TEXT,
  solana_pda TEXT,
  expiration BIGINT,
  wrap_state TEXT DEFAULT 'none',
  last_polygon_tx TEXT,
  last_solana_slot BIGINT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`;

const CREATE_RECORD_TABLE = `
CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  name_hash TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key TEXT NOT NULL,
  record_type TEXT NOT NULL,
  value TEXT NOT NULL,
  source_chain TEXT NOT NULL,
  version BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name_hash, key_hash)
);`;

export class MappingService {
  private static instance: MappingService;
  private pool: Pool | null = null;
  private ready: Promise<void>;

  private constructor() {
    this.ready = this.initializePool();
  }

  static getInstance(): MappingService {
    if (!MappingService.instance) {
      MappingService.instance = new MappingService();
    }
    return MappingService.instance;
  }

  private async initializePool(): Promise<void> {
    try {
      this.pool = new Pool({
        connectionString: Config.database.url
      });
      await this.ensureTables();
      logger.info('MappingService connected to database');
    } catch (error) {
      logger.warn('MappingService database connection failed - running in memory-only mode', {
        error: error instanceof Error ? error.message : String(error)
      });
      this.pool = null;
      // Service will continue to work with no persistence
    }
  }

  private async ensureTables(): Promise<void> {
    if (!this.pool) return;
    try {
      await this.pool.query(CREATE_DOMAIN_TABLE);
      await this.pool.query(CREATE_RECORD_TABLE);
      logger.debug('MappingService tables ready');
    } catch (error) {
      logger.warn('Failed to create tables', { error });
    }
  }

  async upsertDomain(mapping: DomainMapping): Promise<void> {
    await this.ready;
    if (!this.pool) return; // Silently skip if no database

    try {
      const query = `
        INSERT INTO domains (
          name_hash, name, polygon_owner, solana_delegate, solana_pda,
          expiration, wrap_state, last_polygon_tx, last_solana_slot, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()
        )
        ON CONFLICT (name_hash) DO UPDATE SET
          name = EXCLUDED.name,
          polygon_owner = EXCLUDED.polygon_owner,
          solana_delegate = EXCLUDED.solana_delegate,
          solana_pda = EXCLUDED.solana_pda,
          expiration = EXCLUDED.expiration,
          wrap_state = EXCLUDED.wrap_state,
          last_polygon_tx = EXCLUDED.last_polygon_tx,
          last_solana_slot = EXCLUDED.last_solana_slot,
          updated_at = NOW();
      `;
      await this.pool.query(query, [
        mapping.nameHash,
        mapping.name,
        mapping.polygonOwner,
        mapping.solanaDelegate ?? null,
        mapping.solanaPda ?? null,
        mapping.expiration ?? null,
        mapping.wrapState ?? 'none',
        mapping.lastPolygonTx ?? null,
        mapping.lastSolanaSlot ?? null
      ]);
    } catch (error) {
      logger.warn('Failed to upsert domain', { error, nameHash: mapping.nameHash });
    }
  }

  async getDomain(nameHash: string): Promise<DomainMapping | null> {
    await this.ready;
    if (!this.pool) return null;

    try {
      const { rows } = await this.pool.query('SELECT * FROM domains WHERE name_hash = $1 LIMIT 1', [
        nameHash
      ]);
      if (!rows.length) {
        return null;
      }
      const row = rows[0];
      return {
        nameHash: row.name_hash,
        name: row.name,
        polygonOwner: row.polygon_owner,
        solanaDelegate: row.solana_delegate ?? undefined,
        solanaPda: row.solana_pda ?? undefined,
        expiration: row.expiration ?? undefined,
        wrapState: row.wrap_state ?? 'none',
        lastPolygonTx: row.last_polygon_tx ?? undefined,
        lastSolanaSlot: row.last_solana_slot ?? undefined
      };
    } catch (error) {
      logger.warn('Failed to get domain', { error, nameHash });
      return null;
    }
  }

  async upsertRecord(record: PersistedRecord): Promise<void> {
    await this.ready;
    if (!this.pool) return; // Silently skip if no database

    try {
      const query = `
        INSERT INTO records (
          name_hash, key_hash, key, record_type, value, source_chain, version, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
        ON CONFLICT (name_hash, key_hash) DO UPDATE SET
          key = EXCLUDED.key,
          record_type = EXCLUDED.record_type,
          value = EXCLUDED.value,
          source_chain = EXCLUDED.source_chain,
          version = EXCLUDED.version,
          updated_at = NOW();
      `;
      await this.pool.query(query, [
        record.nameHash,
        record.keyHash,
        record.key,
        record.recordType,
        record.value,
        record.sourceChain,
        record.version
      ]);
    } catch (error) {
      logger.warn('Failed to upsert record', { error, nameHash: record.nameHash });
    }
  }

  async deleteRecord(nameHash: string, keyHash: string): Promise<void> {
    await this.ready;
    if (!this.pool) return; // Silently skip if no database

    try {
      await this.pool.query('DELETE FROM records WHERE name_hash = $1 AND key_hash = $2', [
        nameHash,
        keyHash
      ]);
    } catch (error) {
      logger.warn('Failed to delete record', { error, nameHash });
    }
  }

  async getRecords(nameHash: string): Promise<PersistedRecord[]> {
    await this.ready;
    if (!this.pool) return []; // Return empty array if no database

    try {
      const { rows } = await this.pool.query(
        'SELECT name_hash, key_hash, key, record_type, value, source_chain, version FROM records WHERE name_hash = $1',
        [nameHash]
      );
      return rows.map((row) => ({
        nameHash: row.name_hash,
        keyHash: row.key_hash,
        key: row.key,
        recordType: row.record_type,
        value: row.value,
        sourceChain: row.source_chain,
        version: Number(row.version)
      }));
    } catch (error) {
      logger.warn('Failed to get records', { error, nameHash });
      return [];
    }
  }
}

