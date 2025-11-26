import { PolygonService } from './polygon.service';
import { MappingService } from './mapping.service';
import { NFTMetadata, NFTWrapRequest, WrapState } from '../types';
import { getFullDomainName, namehash } from '../utils/namehash';
import logger from '../utils/logger';

export class NFTService {
  constructor(
    private polygonService = new PolygonService(),
    private mappingService = MappingService.getInstance()
  ) {}

  async wrapDomain(request: NFTWrapRequest): Promise<{ txHash: string; chain: WrapState }> {
    const targetState: WrapState = 'polygon';
    let txHash = '';

    // Polygon is the only supported chain
    txHash = await this.polygonService.wrapDomainAsPolygonNFT(request.name, request.owner);
    await this.polygonService.markWrapState(request.name, 'polygon');

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
    // Polygon is the only supported chain
    txHash = await this.polygonService.markWrapState(request.name, 'none');

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

