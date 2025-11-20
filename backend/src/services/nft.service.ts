import { PolygonService } from './polygon.service';
import { SolanaService } from './solana.service';
import { MappingService } from './mapping.service';
import { NFTMetadata, NFTWrapRequest, WrapState } from '../types';
import { getFullDomainName, namehash } from '../utils/namehash';
import logger from '../utils/logger';

export class NFTService {
  constructor(
    private polygonService = new PolygonService(),
    private solanaService = new SolanaService(),
    private mappingService = MappingService.getInstance()
  ) {}

  async wrapDomain(request: NFTWrapRequest): Promise<{ txHash: string; chain: WrapState }> {
    const targetState: WrapState = request.targetChain === 'polygon' ? 'polygon' : 'solana';
    let txHash = '';

    if (request.targetChain === 'polygon') {
      txHash = await this.polygonService.wrapDomainAsPolygonNFT(request.name, request.owner);
      await this.polygonService.markWrapState(request.name, 'polygon');
      await this.solanaService.setWrapState({
        name: request.name,
        wrapState: 'polygon'
      });
    } else {
      txHash = await this.solanaService.setWrapState({
        name: request.name,
        wrapState: 'solana'
      });
      await this.polygonService.markWrapState(request.name, 'solana');
    }

    const fullName = getFullDomainName(request.name);
    await this.mappingService.upsertDomain({
      nameHash: namehash(fullName),
      name: fullName,
      polygonOwner: request.owner,
      wrapState: targetState
    });

    logger.info('NFT wrap completed', {
      name: request.name,
      targetChain: request.targetChain
    });

    return {
      txHash,
      chain: targetState
    };
  }

  async unwrapDomain(request: NFTWrapRequest): Promise<{ txHash: string }> {
    let txHash = '';
    if (request.fromChain === 'polygon') {
      // Burn on Polygon side (handled by admin)
      txHash = await this.polygonService.markWrapState(request.name, 'none');
    } else {
      txHash = await this.solanaService.setWrapState({
        name: request.name,
        wrapState: 'none'
      });
    }

    await this.mappingService.upsertDomain({
      nameHash: namehash(getFullDomainName(request.name)),
      name: getFullDomainName(request.name),
      polygonOwner: request.owner,
      wrapState: 'none'
    });

    return { txHash };
  }

  async getMetadata(name: string, chain: WrapState): Promise<NFTMetadata> {
    const fullName = getFullDomainName(name);
    const mapping = await this.mappingService.getDomain(namehash(fullName));

    return {
      name: `${fullName} (${chain.toUpperCase()})`,
      description: 'Predictify Name Service cross-chain domain wrapper',
      image: `${process.env.METADATA_BASE_URL || 'https://example.com'}/images/${fullName}.png`,
      attributes: [
        { trait_type: 'Chain', value: chain },
        { trait_type: 'Owner', value: mapping?.polygonOwner ?? 'unknown' },
        { trait_type: 'Solana PDA', value: mapping?.solanaPda ?? 'pending' }
      ]
    };
  }
}

