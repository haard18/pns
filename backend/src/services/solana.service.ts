import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { ethers } from 'ethers';
import { Config } from '../config';
import { ChainType, DomainRecord, PriceResponse, RecordType, WrapState } from '../types';
import { namehash, getFullDomainName } from '../utils/namehash';
import logger from '../utils/logger';
import idl from '../idl/pns_anchor.json';

export class SolanaService {
  private connection: Connection;
  private programId: PublicKey;

  constructor() {
    this.connection = new Connection(Config.solana.rpcUrl, 'confirmed');
    this.programId = new PublicKey(Config.solana.programId || PublicKey.default.toString());
  }

  private getProvider(wallet: Keypair): AnchorProvider {
    return new AnchorProvider(
      this.connection,
      new Wallet(wallet),
      { commitment: 'confirmed' }
    );
  }

  private getProgram(wallet: Keypair): Program {
    const provider = this.getProvider(wallet);
    return new Program(idl as any, this.programId, provider);
  }

  private loadKeypair(encoded?: string): Keypair {
    const key = encoded ?? Config.solana.payerKeypair;
    return Keypair.fromSecretKey(bs58.decode(key));
  }

  private recordTypeDiscriminator(recordType: RecordType): number {
    switch (recordType) {
      case 'address':
        return 0;
      case 'text':
        return 1;
      case 'contentHash':
        return 2;
      case 'custom':
      default:
        return 3;
    }
  }

  private deriveKeyHash(recordType: RecordType, key: string): Uint8Array {
    if (recordType === 'custom') {
      return ethers.getBytes(key);
    }

    let prefix = 'text';
    if (recordType === 'address') {
      prefix = 'addr';
    } else if (recordType === 'contentHash') {
      prefix = 'content';
    }
    const prefixBytes = ethers.toUtf8Bytes(prefix);
    const valueBytes = ethers.toUtf8Bytes(key);
    const concatenated = ethers.concat([prefixBytes, valueBytes]);
    return ethers.getBytes(ethers.keccak256(concatenated));
  }

  private toChainSource(chain: ChainType): number {
    return chain === 'polygon' ? 0 : 1;
  }

  private toFixedBytes(hexValue: string, expectedLength: number): Uint8Array {
    const normalized = hexValue.startsWith('0x') ? hexValue.slice(2) : hexValue;
    const padded = normalized.padStart(expectedLength * 2, '0');
    const buffer = Buffer.from(padded, 'hex');
    if (buffer.length !== expectedLength) {
      throw new Error(`Invalid byte length. Expected ${expectedLength}, got ${buffer.length}`);
    }
    return buffer;
  }

  private wrapStateDiscriminator(state: WrapState): number {
    if (state === 'polygon') {
      return 1;
    }
    if (state === 'solana') {
      return 2;
    }
    return 0;
  }

  private getRecordPda(domainPda: PublicKey, keyHash: Uint8Array): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('record'), domainPda.toBuffer(), Buffer.from(keyHash)],
      this.programId
    );
  }

  private async getDomainPDA(nameHash: Buffer): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('domain'), nameHash],
      this.programId
    );
  }

  private async getRegistryPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('registry')],
      this.programId
    );
  }

  async register(
    name: string,
    owner: string,
    duration: number,
    resolver?: string,
    payerKeypairString?: string
  ): Promise<DomainRecord> {
    try {
      const fullName = getFullDomainName(name);
      const nameHash = Buffer.from(namehash(fullName).slice(2), 'hex');
      
      // Get payer keypair
      const payerKeypair = payerKeypairString
        ? Keypair.fromSecretKey(bs58.decode(payerKeypairString))
        : Keypair.fromSecretKey(bs58.decode(Config.solana.payerKeypair));

      const program = this.getProgram(payerKeypair);
      
      // Get PDAs
      const [registryPDA] = await this.getRegistryPDA();
      const [domainPDA] = await this.getDomainPDA(nameHash);
      
      const ownerPubkey = new PublicKey(owner);
      const resolverPubkey = resolver ? new PublicKey(resolver) : null;

      // Register domain
      const tx = await program.methods
        .registerDomain(name, new BN(duration), resolverPubkey)
        .accounts({
          registry: registryPDA,
          domainAccount: domainPDA,
          owner: ownerPubkey,
          systemProgram: SystemProgram.programId
        })
        .signers([payerKeypair])
        .rpc();

      logger.info(`Domain registered on Solana: ${name}`, {
        txHash: tx,
        owner,
        duration
      });

      // Calculate expiration
      const expiration = Math.floor(Date.now() / 1000) + duration;

      return {
        name: fullName,
        chain: 'solana',
        owner: ownerPubkey.toString(),
        expires: expiration,
        resolver: resolverPubkey?.toString(),
        txHash: tx,
        registeredAt: Date.now()
      };
    } catch (error) {
      logger.error('Failed to register domain on Solana', { error, name, owner });
      throw error;
    }
  }

  async renew(
    name: string,
    duration: number,
    payerKeypairString?: string
  ): Promise<DomainRecord> {
    try {
      const fullName = getFullDomainName(name);
      const nameHash = Buffer.from(namehash(fullName).slice(2), 'hex');
      
      // Get payer keypair
      const payerKeypair = payerKeypairString
        ? Keypair.fromSecretKey(bs58.decode(payerKeypairString))
        : Keypair.fromSecretKey(bs58.decode(Config.solana.payerKeypair));

      const program = this.getProgram(payerKeypair);
      
      // Get domain PDA
      const [domainPDA] = await this.getDomainPDA(nameHash);
      
      // Get current domain data
      const domainAccount: any = await program.account.domainAccount.fetch(domainPDA);

      // Renew domain
      const tx = await program.methods
        .renewDomain(new BN(duration))
        .accounts({
          domainAccount: domainPDA,
          owner: domainAccount.owner
        } as any)
        .signers([payerKeypair])
        .rpc();

      logger.info(`Domain renewed on Solana: ${name}`, {
        txHash: tx,
        duration
      });

      // Get updated domain data
      const updatedDomain: any = await program.account.domainAccount.fetch(domainPDA);

      return {
        name: fullName,
        chain: 'solana',
        owner: updatedDomain.owner.toString(),
        expires: updatedDomain.expiration.toNumber(),
        resolver: updatedDomain.resolver?.toString(),
        txHash: tx,
        registeredAt: Date.now()
      };
    } catch (error) {
      logger.error('Failed to renew domain on Solana', { error, name });
      throw error;
    }
  }

  async getPrice(name: string, duration: number): Promise<PriceResponse> {
    try {
      // Simple pricing logic - can be enhanced
      const basePrice = 0.1; // 0.1 SOL base price
      const yearlyPrice = basePrice * (duration / (365 * 24 * 60 * 60));
      
      // Adjust by name length
      let priceMultiplier = 1;
      if (name.length === 3) priceMultiplier = 5;
      else if (name.length === 4) priceMultiplier = 2;
      else if (name.length <= 6) priceMultiplier = 1;
      else priceMultiplier = 0.5;

      const finalPrice = yearlyPrice * priceMultiplier;
      const priceLamports = Math.floor(finalPrice * LAMPORTS_PER_SOL);
      
      return {
        price: finalPrice.toFixed(4),
        currency: 'SOL',
        chain: 'solana',
        priceLamports: priceLamports.toString()
      };
    } catch (error) {
      logger.error('Failed to get price on Solana', { error, name });
      throw error;
    }
  }

  async mirrorDomain(opts: {
    name: string;
    polygonOwner: string;
    solanaDelegate?: string;
    expiration: number;
    resolver?: string;
    polygonTx: string;
    authorityKeypair?: string;
  }): Promise<string> {
    try {
      const fullName = getFullDomainName(opts.name);
      const nameHash = Buffer.from(namehash(fullName).slice(2), 'hex');
      const polygonOwnerBytes = this.toFixedBytes(opts.polygonOwner, 20);
      const polygonTxBytes = this.toFixedBytes(opts.polygonTx, 32);
      const authority = this.loadKeypair(opts.authorityKeypair);
      const program = this.getProgram(authority);
      const [registryPda] = await this.getRegistryPDA();
      const [domainPda] = await this.getDomainPDA(nameHash);
      const delegatePubkey = opts.solanaDelegate ? new PublicKey(opts.solanaDelegate) : null;
      const resolverPubkey = opts.resolver ? new PublicKey(opts.resolver) : null;

      const tx = await program.methods
        .mirrorDomain(
          Array.from(nameHash),
          Array.from(polygonOwnerBytes),
          delegatePubkey,
          new BN(opts.expiration),
          resolverPubkey,
          Array.from(polygonTxBytes)
        )
        .accounts({
          domainAccount: domainPda,
          registry: registryPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([authority])
        .rpc();

      return tx;
    } catch (error) {
      logger.error('Failed to mirror domain on Solana', { error, name: opts.name });
      throw error;
    }
  }

  async upsertRecord(opts: {
    name: string;
    recordType: RecordType;
    key: string;
    value: Uint8Array;
    sourceChain: ChainType;
    version: number;
    authorityKeypair?: string;
  }): Promise<string> {
    try {
      const fullName = getFullDomainName(opts.name);
      const nameHash = Buffer.from(namehash(fullName).slice(2), 'hex');
      const keyHash = this.deriveKeyHash(opts.recordType, opts.key);
      const authority = this.loadKeypair(opts.authorityKeypair);
      const program = this.getProgram(authority);
      const [registryPda] = await this.getRegistryPDA();
      const [domainPda] = await this.getDomainPDA(nameHash);
      const [recordPda] = this.getRecordPda(domainPda, keyHash);

      const tx = await program.methods
        .upsertRecord(
          Array.from(nameHash),
          Array.from(keyHash),
          this.recordTypeDiscriminator(opts.recordType),
          Array.from(opts.value),
          this.toChainSource(opts.sourceChain),
          new BN(opts.version)
        )
        .accounts({
          domainAccount: domainPda,
          recordAccount: recordPda,
          registry: registryPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([authority])
        .rpc();

      return tx;
    } catch (error) {
      logger.error('Failed to upsert record on Solana', { error, name: opts.name });
      throw error;
    }
  }

  async deleteRecord(opts: {
    name: string;
    key: string;
    recordType: RecordType;
    authorityKeypair?: string;
  }): Promise<string> {
    try {
      const fullName = getFullDomainName(opts.name);
      const nameHash = Buffer.from(namehash(fullName).slice(2), 'hex');
      const keyHash = this.deriveKeyHash(opts.recordType, opts.key);
      const authority = this.loadKeypair(opts.authorityKeypair);
      const program = this.getProgram(authority);
      const [registryPda] = await this.getRegistryPDA();
      const [domainPda] = await this.getDomainPDA(nameHash);
      const [recordPda] = this.getRecordPda(domainPda, keyHash);

      const tx = await program.methods
        .deleteRecord(Array.from(nameHash), Array.from(keyHash))
        .accounts({
          domainAccount: domainPda,
          recordAccount: recordPda,
          registry: registryPda,
          authority: authority.publicKey
        })
        .signers([authority])
        .rpc();

      return tx;
    } catch (error) {
      logger.error('Failed to delete record on Solana', { error, name: opts.name });
      throw error;
    }
  }

  async setWrapState(opts: {
    name: string;
    wrapState: WrapState;
    nftMint?: string;
    authorityKeypair?: string;
  }): Promise<string> {
    try {
      const fullName = getFullDomainName(opts.name);
      const nameHash = Buffer.from(namehash(fullName).slice(2), 'hex');
      const authority = this.loadKeypair(opts.authorityKeypair);
      const program = this.getProgram(authority);
      const [registryPda] = await this.getRegistryPDA();
      const [domainPda] = await this.getDomainPDA(nameHash);
      const mintKey = opts.nftMint ? new PublicKey(opts.nftMint) : null;

      const tx = await program.methods
        .setWrapState(
          Array.from(nameHash),
          mintKey,
          this.wrapStateDiscriminator(opts.wrapState)
        )
        .accounts({
          domainAccount: domainPda,
          registry: registryPda,
          authority: authority.publicKey
        })
        .signers([authority])
        .rpc();

      return tx;
    } catch (error) {
      logger.error('Failed to set wrap state on Solana', { error, name: opts.name });
      throw error;
    }
  }

  async getDomainsByOwner(owner: string): Promise<DomainRecord[]> {
    try {
      const ownerPubkey = new PublicKey(owner);
      
      // Create a temporary wallet to get the program
      const tempKeypair = Keypair.generate();
      const program = this.getProgram(tempKeypair);
      
      const accounts = await program.account.domainAccount.all([
        {
          memcmp: {
            offset: 32, // After nameHash (32 bytes)
            bytes: ownerPubkey.toBase58()
          }
        }
      ]);

      return accounts.map((account: any) => ({
        name: 'unknown',
        chain: 'solana' as const,
        owner: account.account.owner.toString(),
        expires: account.account.expiration.toNumber(),
        txHash: '',
        registeredAt: Date.now()
      }));
    } catch (error) {
      logger.error('Failed to get domains on Solana', { error, owner });
      throw error;
    }
  }

  async getDomain(name: string): Promise<DomainRecord | null> {
    try {
      const fullName = getFullDomainName(name);
      const nameHash = Buffer.from(namehash(fullName).slice(2), 'hex');
      
      // Create a temporary wallet to get the program
      const tempKeypair = Keypair.generate();
      const program = this.getProgram(tempKeypair);
      
      // Get domain PDA
      const [domainPDA] = await this.getDomainPDA(nameHash);
      
      try {
        const domainAccount: any = await program.account.domainAccount.fetch(domainPDA);
        
        return {
          name: fullName,
          chain: 'solana',
          owner: domainAccount.owner.toString(),
          expires: domainAccount.expiration.toNumber(),
          resolver: domainAccount.resolver?.toString(),
          txHash: '',
          registeredAt: 0
        };
      } catch {
        return null;
      }
    } catch (error) {
      logger.error('Failed to get domain on Solana', { error, name });
      throw error;
    }
  }

  async isAvailable(name: string): Promise<boolean> {
    try {
      const domain = await this.getDomain(name);
      if (!domain) return true;
      
      // Check if expired
      const now = Math.floor(Date.now() / 1000);
      return domain.expires < now;
    } catch (error) {
      logger.error('Failed to check availability on Solana', { error, name });
      throw error;
    }
  }
}
