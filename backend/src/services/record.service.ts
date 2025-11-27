import { ethers } from 'ethers';
import { PolygonService } from './polygon.service';
import { MappingService } from './mapping.service';
import {
  PersistedRecord,
  RecordDeleteRequest,
  RecordResponse,
  RecordType,
  RecordWriteRequest
} from '../types';
import { getFullDomainName, namehash } from '../utils/namehash';
import logger from '../utils/logger';

export class RecordService {
  constructor(
    private polygonService = new PolygonService(),
    private mappingService = MappingService.getInstance()
  ) {}

  private keyHash(recordType: RecordType, key: string, customKeyHash?: string): string {
    if (recordType === 'custom') {
      if (!customKeyHash) {
        throw new Error('customKeyHash is required for custom record types');
      }
      return customKeyHash;
    }
    const prefix =
      recordType === 'address'
        ? 'addr'
        : recordType === 'contentHash'
          ? 'content'
          : 'text';
    const hash = ethers.keccak256(
      ethers.concat([ethers.toUtf8Bytes(prefix), ethers.toUtf8Bytes(key)])
    );
    return hash;
  }

  private toPersistedRecord(
    nameHashHex: string,
    keyHash: string,
    request: RecordWriteRequest,
    version: number
  ): PersistedRecord {
    return {
      nameHash: nameHashHex,
      keyHash,
      key: request.key,
      recordType: request.recordType,
      value: request.value,
      sourceChain: request.chain,
      version
    };
  }

  async upsertRecord(request: RecordWriteRequest): Promise<RecordResponse> {
    if (request.chain !== 'polygon') {
      throw new Error(`Unsupported chain for records: ${request.chain}`);
    }

    const fullName = getFullDomainName(request.name);
    const nameHashHex = namehash(fullName);
    const version = Date.now();
    const keyHash = this.keyHash(request.recordType, request.key, request.customKeyHash);
    let txHash = '';

    // Polygon is the only supported chain
    if (request.recordType === 'text') {
      txHash = await this.polygonService.setTextRecord(request.name, request.key, request.value);
    } else if (request.recordType === 'address') {
      const coinType = request.coinType ?? 966;
      txHash = await this.polygonService.setAddressRecord(
        request.name,
        coinType,
        request.value
      );
    } else if (request.recordType === 'contentHash') {
      txHash = await this.polygonService.setContentHashRecord(request.name, request.value);
    } else {
      txHash = await this.polygonService.setCustomRecord(request.name, keyHash, request.value);
    }

    const persisted = this.toPersistedRecord(nameHashHex, keyHash, request, version);
    await this.mappingService.upsertRecord(persisted);

    logger.info('Record upserted on Polygon', {
      name: request.name,
      recordType: request.recordType
    });

    return {
      ...persisted,
      txHash
    };
  }

  async deleteRecord(request: RecordDeleteRequest): Promise<void> {
    const fullName = getFullDomainName(request.name);
    const nameHashHex = namehash(fullName);
    const keyHash = this.keyHash(request.recordType, request.key, request.customKeyHash);

    // Polygon is the only supported chain
    await this.polygonService.clearCustomRecord(request.name, keyHash);
    await this.mappingService.deleteRecord(nameHashHex, keyHash);
  }

  async getRecords(name: string): Promise<RecordResponse[]> {
    const fullName = getFullDomainName(name);
    const nameHashHex = namehash(fullName);
    const records = await this.mappingService.getRecords(nameHashHex);
    return records.map((record) => ({
      ...record,
      txHash: ''
    }));
  }
}

