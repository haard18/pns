import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { Config } from '../config';
import { DomainRecord, PriceResponse } from '../types';
import { namehash, getFullDomainName } from '../utils/namehash';
import logger from '../utils/logger';
import idl from '../idl/pns_anchor.json';
import bs58 from 'bs58';

export class SolanaService {
  private connection: Connection;
  private programId: PublicKey;
  private program: Program | null = null;

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

  private async getProgram(wallet: Keypair): Promise<Program> {
    if (!this.program) {
      const provider = this.getProvider(wallet);
      this.program = new Program(idl as any, this.programId, provider);
    }
    return this.program;
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

      const program = await this.getProgram(payerKeypair);
      
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

      const program = await this.getProgram(payerKeypair);
      
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

  async getDomainsByOwner(owner: string): Promise<DomainRecord[]> {
    try {
      const ownerPubkey = new PublicKey(owner);
      
      // Create a temporary wallet to get the program
      const tempKeypair = Keypair.generate();
      await this.getProgram(tempKeypair);
      
      if (!this.program) {
        throw new Error('Program not initialized');
      }
      
      // Fetch all domain accounts owned by the address
      const accounts = await this.program.account.domainAccount.all([
        {
          memcmp: {
            offset: 32, // After nameHash (32 bytes)
            bytes: ownerPubkey.toBase58()
          }
        }
      ]);

      return accounts.map((account: any) => ({
        name: 'unknown', // Would need reverse lookup or indexing
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
      const program = await this.getProgram(tempKeypair);
      
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
