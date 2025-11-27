import { ethers, Contract, JsonRpcProvider, Wallet } from 'ethers';
import { Config } from '../config';
import { DomainRecord, PriceResponse, WrapState } from '../types';
import { namehash, getFullDomainName, formatPrice } from '../utils/namehash';
import logger from '../utils/logger';

// Controller ABI - human-readable format
const CONTROLLER_ABI = [
  'function registerDomain(string name, address owner, uint256 duration) payable',
  'function registerWithAddress(string name, address owner, uint256 duration, address resolverAddr) payable',
  'function renewDomain(string name, uint256 duration) payable',
  'function isDomainAvailable(string name) view returns (bool)',
  'function getDomainOwner(string name) view returns (address)',
  'function getDomainExpiration(string name) view returns (uint64)',
  'function getDomainResolver(string name) view returns (address)'
];

// Registry ABI
const REGISTRY_ABI = [
  'function records(bytes32) view returns (address owner, address resolver, uint64 expiration, uint96 reserved)',
  'function exists(bytes32) view returns (bool)',
  'function getNameRecord(bytes32) view returns (address owner, address resolver, uint64 expiration)',
  'function mirrorData(bytes32 nameHash) view returns (bytes32 solanaPda, uint64 lastSyncedSlot, uint8 wrapState)',
  'function setSolanaPointer(bytes32 nameHash, bytes32 solanaPda, uint64 slot)',
  'function setWrapState(bytes32 nameHash, uint8 state)',
  'function getReverseRecord(address addr) view returns (bytes32)',
  'function isValid(bytes32 nameHash) view returns (bool)'
];

// Price Oracle ABI
const PRICE_ORACLE_ABI = [
  'function getPrice(bytes32 nameHash, string name, uint256 duration) view returns (uint256)'
];

// Resolver ABI
const RESOLVER_ABI = [
  'function setText(bytes32 nameHash, string key, string value)',
  'function setPolygonAddr(bytes32 nameHash, address addr)',
  'function setAddr(bytes32 nameHash, uint256 coinType, address addr)',
  'function getText(bytes32 nameHash, string key) view returns (string)',
  'function getPolygonAddr(bytes32 nameHash) view returns (address)',
  'function setContentHash(bytes32 nameHash, bytes hash)',
  'function setCustomRecord(bytes32 nameHash, bytes32 keyHash, bytes value)',
  'function clearCustomRecord(bytes32 nameHash, bytes32 keyHash)'
];

// NFT ABI
const NFT_ABI = [
  'function mintDomain(string name, bytes32 nameHash, address owner)',
  'function burnDomain(uint256 tokenId)',
  'function freezeToken(uint256 tokenId)',
  'function unfreezeToken(uint256 tokenId)',
  'function getTokenId(bytes32 nameHash) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)'
];

export class PolygonService {
  private provider: JsonRpcProvider;
  private controller: Contract;
  private registry: Contract;
  private priceOracle: Contract;
  private resolver: Contract;
  private nft: Contract | null;

  constructor() {
    this.provider = new JsonRpcProvider(Config.polygon.rpcUrl);
    
    this.controller = new Contract(
      Config.polygon.contracts.controller,
      CONTROLLER_ABI,
      this.provider
    );
    
    this.registry = new Contract(
      Config.polygon.contracts.registry,
      REGISTRY_ABI,
      this.provider
    );
    
    this.priceOracle = new Contract(
      Config.polygon.contracts.priceOracle,
      PRICE_ORACLE_ABI,
      this.provider
    );

    this.resolver = new Contract(
      Config.polygon.contracts.resolver,
      RESOLVER_ABI,
      this.provider
    );

    this.nft = Config.polygon.contracts.nft
      ? new Contract(Config.polygon.contracts.nft, NFT_ABI, this.provider)
      : null;
      
    // Debug logging
    logger.info('PolygonService initialized', {
      controllerAddress: Config.polygon.contracts.controller,
      registryAddress: Config.polygon.contracts.registry,
      rpcUrl: Config.polygon.rpcUrl
    });
  }

  private getWallet(privateKey?: string): Wallet {
    const key = privateKey || process.env.ADMIN_PRIVATE_KEY!;
    return new ethers.Wallet(key, this.provider);
  }

  private getNameHash(name: string): string {
    const fullName = getFullDomainName(name);
    return namehash(fullName);
  }

  async register(
    name: string,
    owner: string,
    duration: number,
    resolver?: string,
    privateKey?: string
  ): Promise<DomainRecord> {
    try {
      const fullName = getFullDomainName(name);
      const nameHash = namehash(fullName);
      
      // Check availability
      const available = await this.controller.isDomainAvailable(name);
      if (!available) {
        throw new Error(`Domain ${name} is not available`);
      }

      // Get price
      const price = await this.priceOracle.getPrice(nameHash, name, duration);
      
      // Get signer
      const wallet = this.getWallet(privateKey);
      const controllerWithSigner = this.controller.connect(wallet) as Contract;

      // Register domain
      let tx;
      if (resolver) {
        tx = await controllerWithSigner.registerWithAddress(
          name,
          owner,
          duration,
          resolver,
          { value: price }
        );
      } else {
        tx = await controllerWithSigner.registerDomain(
          name,
          owner,
          duration,
          { value: price }
        );
      }

      const receipt = await tx.wait();
      
      // Get domain details
      const record = await this.registry.getNameRecord(nameHash);
      
      logger.info(`Domain registered on Polygon: ${name}`, {
        txHash: receipt.hash,
        owner,
        duration
      });

      return {
        name: fullName,
        chain: 'polygon',
        owner: record.owner,
        expires: Number(record.expiration),
        resolver: record.resolver !== ethers.ZeroAddress ? record.resolver : undefined,
        txHash: receipt.hash,
        registeredAt: Date.now()
      };
    } catch (error) {
      logger.error('Failed to register domain on Polygon', { error, name, owner });
      throw error;
    }
  }

  async renew(name: string, duration: number, privateKey?: string): Promise<DomainRecord> {
    try {
      const fullName = getFullDomainName(name);
      const nameHash = namehash(fullName);
      
      // Get price
      const price = await this.priceOracle.getPrice(nameHash, name, duration);
      
      // Get signer
      const wallet = this.getWallet(privateKey);
      const controllerWithSigner = this.controller.connect(wallet) as Contract;

      // Renew domain
      const tx = await controllerWithSigner.renewDomain(name, duration, { value: price });
      const receipt = await tx.wait();
      
      // Get updated details
      const record = await this.registry.getNameRecord(nameHash);
      
      logger.info(`Domain renewed on Polygon: ${name}`, {
        txHash: receipt.hash,
        duration
      });

      return {
        name: fullName,
        chain: 'polygon',
        owner: record.owner,
        expires: Number(record.expiration),
        resolver: record.resolver !== ethers.ZeroAddress ? record.resolver : undefined,
        txHash: receipt.hash,
        registeredAt: Date.now()
      };
    } catch (error) {
      logger.error('Failed to renew domain on Polygon', { error, name });
      throw error;
    }
  }

  async getPrice(name: string, duration: number): Promise<PriceResponse> {
    try {
      const fullName = getFullDomainName(name);
      const nameHash = namehash(fullName);
      
      const priceWei = await this.priceOracle.getPrice(nameHash, name, duration);
      
      return {
        price: formatPrice(priceWei),
        currency: 'ETH',
        chain: 'polygon',
        priceWei: priceWei.toString()
      };
    } catch (error) {
      logger.error('Failed to get price on Polygon', { error, name });
      throw error;
    }
  }

  async getDomainsByOwner(owner: string): Promise<DomainRecord[]> {
    try {
      // This would require event indexing or a subgraph
      // For now, return empty array with a note
      logger.warn('getDomainsByOwner requires event indexing - not yet implemented');
      return [];
    } catch (error) {
      logger.error('Failed to get domains on Polygon', { error, owner });
      throw error;
    }
  }

  async getDomain(name: string): Promise<DomainRecord | null> {
    try {
      const fullName = getFullDomainName(name);
      const nameHash = namehash(fullName);
      
      const exists = await this.registry.exists(nameHash);
      if (!exists) {
        return null;
      }

      const record = await this.registry.getNameRecord(nameHash);
      
      return {
        name: fullName,
        chain: 'polygon',
        owner: record.owner,
        expires: Number(record.expiration),
        resolver: record.resolver !== ethers.ZeroAddress ? record.resolver : undefined,
        txHash: '',
        registeredAt: 0
      };
    } catch (error) {
      logger.error('Failed to get domain on Polygon', { error, name });
      throw error;
    }
  }

  async isAvailable(name: string): Promise<boolean> {
    try {
      return await this.controller.isDomainAvailable(name);
    } catch (error) {
      logger.error('Failed to check availability on Polygon', { error, name });
      throw error;
    }
  }

  async setTextRecord(name: string, key: string, value: string, privateKey?: string): Promise<string> {
    const nameHash = this.getNameHash(name);
    const wallet = this.getWallet(privateKey);

    // Pre-flight ownership & expiration check for clearer UX and defense in depth
    const registryRecord = await this.registry.getNameRecord(nameHash);
    if (registryRecord.owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('Polygon: Only the domain owner can update text records');
    }

    const resolver = this.resolver.connect(wallet) as Contract;
    const tx = await resolver.setText(nameHash, key, value);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async setAddressRecord(
    name: string,
    coinType: number,
    addressValue: string,
    privateKey?: string
  ): Promise<string> {
    const nameHash = this.getNameHash(name);
    const wallet = this.getWallet(privateKey);

    const registryRecord = await this.registry.getNameRecord(nameHash);
    if (registryRecord.owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('Polygon: Only the domain owner can update address records');
    }

    const resolver = this.resolver.connect(wallet) as Contract;
    const tx = await resolver.setAddr(nameHash, coinType, addressValue);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async setContentHashRecord(name: string, hexContentHash: string, privateKey?: string): Promise<string> {
    const nameHash = this.getNameHash(name);
    const wallet = this.getWallet(privateKey);

    const registryRecord = await this.registry.getNameRecord(nameHash);
    if (registryRecord.owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('Polygon: Only the domain owner can update content hash records');
    }

    const resolver = this.resolver.connect(wallet) as Contract;
    const hashBytes = ethers.getBytes(hexContentHash);
    const tx = await resolver.setContentHash(nameHash, hashBytes);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async setCustomRecord(
    name: string,
    keyHash: string,
    value: string,
    privateKey?: string
  ): Promise<string> {
    const nameHash = this.getNameHash(name);
    const wallet = this.getWallet(privateKey);

    const registryRecord = await this.registry.getNameRecord(nameHash);
    if (registryRecord.owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('Polygon: Only the domain owner can update custom records');
    }

    const resolver = this.resolver.connect(wallet) as Contract;
    const keyBytes = ethers.getBytes(keyHash);
    const valueBytes = ethers.toUtf8Bytes(value);
    const tx = await resolver.setCustomRecord(nameHash, keyBytes, valueBytes);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async clearCustomRecord(name: string, keyHash: string, privateKey?: string): Promise<string> {
    const nameHash = this.getNameHash(name);
    const wallet = this.getWallet(privateKey);

    const registryRecord = await this.registry.getNameRecord(nameHash);
    if (registryRecord.owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('Polygon: Only the domain owner can clear custom records');
    }

    const resolver = this.resolver.connect(wallet) as Contract;
    const keyBytes = ethers.getBytes(keyHash);
    const tx = await resolver.clearCustomRecord(nameHash, keyBytes);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async setSolanaPointer(
    name: string,
    solanaPdaHex: string,
    slot: number,
    privateKey?: string
  ): Promise<string> {
    const nameHash = this.getNameHash(name);
    const wallet = this.getWallet(privateKey);
    const registry = this.registry.connect(wallet) as Contract;
    const padded = ethers.zeroPadValue(solanaPdaHex, 32);
    const tx = await registry.setSolanaPointer(nameHash, padded, slot);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async markWrapState(name: string, state: WrapState, privateKey?: string): Promise<string> {
    const nameHash = this.getNameHash(name);
    const wallet = this.getWallet(privateKey);
    const registry = this.registry.connect(wallet) as Contract;
    const wrapValue = state === 'polygon' ? 1 : 0;
    const tx = await registry.setWrapState(nameHash, wrapValue);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async wrapDomainAsPolygonNFT(name: string, owner: string, privateKey?: string): Promise<string> {
    if (!this.nft) {
      throw new Error('Polygon NFT contract not configured');
    }
    const nameHash = this.getNameHash(name);
    const wallet = this.getWallet(privateKey);
    const nft = this.nft.connect(wallet) as Contract;
    const tx = await nft.mintDomain(name, nameHash, owner);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getMirrorInfo(name: string): Promise<{
    solanaPda: string;
    lastSlot: number;
    wrapState: WrapState;
  }> {
    const nameHash = this.getNameHash(name);
    const mirror = await this.registry.mirrorData(nameHash);
    const wrapState = mirror.wrapState === 1 ? 'polygon' : 'none';
    return {
      solanaPda: ethers.hexlify(mirror.solanaPda),
      lastSlot: Number(mirror.lastSyncedSlot),
      wrapState
    };
  }
}
