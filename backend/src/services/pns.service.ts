import { PolygonService } from './polygon.service';
import { SolanaService } from './solana.service';
import {
  ChainType,
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
  private solanaService: SolanaService;

  constructor() {
    this.polygonService = new PolygonService();
    this.solanaService = new SolanaService();
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

    if (request.chain === 'polygon') {
      return await this.polygonService.register(
        request.name,
        request.owner,
        request.duration,
        request.resolver
      );
    } else {
      return await this.solanaService.register(
        request.name,
        request.owner,
        request.duration,
        request.resolver
      );
    }
  }

  async renewDomain(request: RenewRequest): Promise<DomainRecord> {
    logger.info('Renewing domain', {
      name: request.name,
      chain: request.chain,
      duration: request.duration
    });

    if (request.chain === 'polygon') {
      return await this.polygonService.renew(request.name, request.duration);
    } else {
      return await this.solanaService.renew(request.name, request.duration);
    }
  }

  async getPrice(request: PriceRequest): Promise<PriceResponse> {
    // Validate domain name
    const validation = validateDomainName(request.name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (request.chain === 'polygon') {
      return await this.polygonService.getPrice(request.name, request.duration);
    } else {
      return await this.solanaService.getPrice(request.name, request.duration);
    }
  }

  async getDomainsByOwner(owner: string, chain?: ChainType): Promise<DomainRecord[]> {
    const domains: DomainRecord[] = [];

    if (!chain || chain === 'polygon') {
      try {
        const polygonDomains = await this.polygonService.getDomainsByOwner(owner);
        domains.push(...polygonDomains);
      } catch (error) {
        logger.error('Failed to fetch Polygon domains', { error, owner });
      }
    }

    if (!chain || chain === 'solana') {
      try {
        const solanaDomains = await this.solanaService.getDomainsByOwner(owner);
        domains.push(...solanaDomains);
      } catch (error) {
        logger.error('Failed to fetch Solana domains', { error, owner });
      }
    }

    return domains;
  }

  async getDomain(name: string, chain: ChainType): Promise<DomainRecord | null> {
    if (chain === 'polygon') {
      return await this.polygonService.getDomain(name);
    } else {
      return await this.solanaService.getDomain(name);
    }
  }

  async isAvailable(name: string, chain: ChainType): Promise<boolean> {
    // Validate domain name
    const validation = validateDomainName(name);
    if (!validation.valid) {
      return false;
    }

    if (chain === 'polygon') {
      return await this.polygonService.isAvailable(name);
    } else {
      return await this.solanaService.isAvailable(name);
    }
  }

  async checkAvailabilityBothChains(name: string): Promise<{
    polygon: boolean;
    solana: boolean;
  }> {
    const [polygon, solana] = await Promise.all([
      this.isAvailable(name, 'polygon').catch(() => false),
      this.isAvailable(name, 'solana').catch(() => false)
    ]);

    return { polygon, solana };
  }
}
