import { PolygonService } from './polygon.service';
import {
  DomainRecord,
  RegisterRequest,
  RenewRequest,
  PriceRequest,
  PriceResponse
} from '../types';
import logger from '../utils/logger';
import { validateDomainName } from '../utils/namehash';

export class PNSService {
  private polygonService: PolygonService;

  constructor() {
    this.polygonService = new PolygonService();
  }

  async registerDomain(request: RegisterRequest): Promise<DomainRecord> {
    // Validate domain name
    const validation = validateDomainName(request.name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    logger.info('Registering domain', {
      name: request.name,
      chain: request.chain,
      owner: request.owner
    });

    return await this.polygonService.register(
      request.name,
      request.owner,
      request.duration,
      request.resolver
    );
  }

  async renewDomain(request: RenewRequest): Promise<DomainRecord> {
    logger.info('Renewing domain', {
      name: request.name,
      chain: request.chain,
      duration: request.duration
    });

    return await this.polygonService.renew(request.name, request.duration);
  }

  async getPrice(request: PriceRequest): Promise<PriceResponse> {
    // Validate domain name
    const validation = validateDomainName(request.name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return await this.polygonService.getPrice(request.name, request.duration);
  }

  async getDomainsByOwner(owner: string): Promise<DomainRecord[]> {
    try {
      return await this.polygonService.getDomainsByOwner(owner);
    } catch (error) {
      logger.error('Failed to fetch Polygon domains', { error, owner });
      return [];
    }
  }

  async getDomain(name: string): Promise<DomainRecord | null> {
    return await this.polygonService.getDomain(name);
  }

  async isAvailable(name: string): Promise<boolean> {
    // Validate domain name
    const validation = validateDomainName(name);
    if (!validation.valid) {
      return false;
    }

    return await this.polygonService.isAvailable(name);
  }
}
