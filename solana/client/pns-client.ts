import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

/**
 * Solana PNS Client - TypeScript wrapper for the pns_anchor Anchor program
 * Generated from IDL for client-side interactions
 */

export interface DomainAccount {
  nameHash: Uint8Array;
  owner: PublicKey;
  resolver: PublicKey | null;
  expiration: BN;
  bump: number;
}

export interface RegistryAccount {
  authority: PublicKey;
  domainCount: BN;
  bump: number;
}

export class PnsClient {
  private program: Program<any>;
  private connection: Connection;

  constructor(
    connection: Connection,
    programId: PublicKey,
    wallet?: Wallet | Keypair
  ) {
    this.connection = connection;

    // Create provider and program
    if (!wallet) {
      wallet = new anchor.Wallet(Keypair.generate());
    }

    const provider = new AnchorProvider(connection, wallet as Wallet, {
      commitment: "confirmed",
    });

    this.program = new Program(PnsIdl, programId, provider);
  }

  /**
   * Get registry PDA address
   */
  getRegistryPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      this.program.programId
    );
  }

  /**
   * Get domain PDA address from nameHash
   * @param nameHash - 32-byte Keccak256 hash of the domain name
   */
  getDomainPDA(nameHash: Buffer | Uint8Array): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("domain"), Buffer.from(nameHash)],
      this.program.programId
    );
  }

  /**
   * Initialize the registry (should be called only once)
   */
  async initialize(authority: Keypair): Promise<string> {
    const [registry] = this.getRegistryPDA();

    const tx = await this.program.methods
      .initialize()
      .accounts({
        registry,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    return tx;
  }

  /**
   * Register a new domain
   * @param nameHash - 32-byte Keccak256 hash of domain name
   * @param duration - Registration duration in seconds
   * @param owner - Keypair of domain owner
   * @param resolver - Optional resolver Pubkey
   */
  async registerDomain(
    nameHash: Buffer | Uint8Array,
    duration: BN | number,
    owner: Keypair,
    resolver?: PublicKey
  ): Promise<string> {
    const [domainPDA] = this.getDomainPDA(nameHash);
    const [registry] = this.getRegistryPDA();

    const durationBN = typeof duration === "number" ? new BN(duration) : duration;

    const tx = await this.program.methods
      .registerDomain(
        Array.from(nameHash),
        durationBN,
        resolver || null
      )
      .accounts({
        domainAccount: domainPDA,
        registry,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    return tx;
  }

  /**
   * Renew an existing domain
   * @param nameHash - 32-byte hash of domain name
   * @param duration - Renewal duration in seconds
   * @param owner - Keypair of current domain owner
   */
  async renewDomain(
    nameHash: Buffer | Uint8Array,
    duration: BN | number,
    owner: Keypair
  ): Promise<string> {
    const [domainPDA] = this.getDomainPDA(nameHash);

    const durationBN = typeof duration === "number" ? new BN(duration) : duration;

    const tx = await this.program.methods
      .renewDomain(durationBN)
      .accounts({
        domainAccount: domainPDA,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    return tx;
  }

  /**
   * Transfer domain to a new owner
   * @param nameHash - 32-byte hash of domain name
   * @param newOwner - Pubkey of new owner
   * @param currentOwner - Keypair of current owner
   */
  async transferDomain(
    nameHash: Buffer | Uint8Array,
    newOwner: PublicKey,
    currentOwner: Keypair
  ): Promise<string> {
    const [domainPDA] = this.getDomainPDA(nameHash);

    const tx = await this.program.methods
      .transferDomain(newOwner)
      .accounts({
        domainAccount: domainPDA,
        owner: currentOwner.publicKey,
      })
      .signers([currentOwner])
      .rpc();

    return tx;
  }

  /**
   * Set resolver for a domain
   * @param nameHash - 32-byte hash of domain name
   * @param resolver - Optional resolver Pubkey (null to remove)
   * @param owner - Keypair of domain owner
   */
  async setResolver(
    nameHash: Buffer | Uint8Array,
    resolver: PublicKey | null,
    owner: Keypair
  ): Promise<string> {
    const [domainPDA] = this.getDomainPDA(nameHash);

    const tx = await this.program.methods
      .setResolver(resolver)
      .accounts({
        domainAccount: domainPDA,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    return tx;
  }

  /**
   * Fetch domain account data
   * @param nameHash - 32-byte hash of domain name
   */
  async fetchDomain(nameHash: Buffer | Uint8Array): Promise<DomainAccount | null> {
    try {
      const [domainPDA] = this.getDomainPDA(nameHash);
      const domain = await this.program.account.domainAccount.fetch(domainPDA);
      return domain;
    } catch {
      return null;
    }
  }

  /**
   * Fetch registry account data
   */
  async fetchRegistry(): Promise<RegistryAccount> {
    const [registryPDA] = this.getRegistryPDA();
    return this.program.account.registry.fetch(registryPDA);
  }

  /**
   * Get all domains for an owner (requires indexing)
   * @param owner - Pubkey of domain owner
   */
  async fetchDomainsByOwner(owner: PublicKey): Promise<DomainAccount[]> {
    const domains = await this.program.account.domainAccount.all([
      {
        memcmp: {
          offset: 32, // After nameHash field (32 bytes)
          bytes: owner.toBase58(),
        },
      },
    ]);

    return domains.map((d: any) => d.account);
  }

  /**
   * Check if domain is available (not registered or expired)
   * @param nameHash - 32-byte hash of domain name
   */
  async isAvailable(nameHash: Buffer | Uint8Array): Promise<boolean> {
    const domain = await this.fetchDomain(nameHash);
    if (!domain) return true;

    const now = Math.floor(Date.now() / 1000);
    return domain.expiration.toNumber() < now;
  }

  /**
   * Get the Anchor program instance
   */
  getProgram(): Program<any> {
    return this.program;
  }
}

/**
 * IDL definition for the PNS Anchor program
 * This matches the Rust program structure
 */
const PnsIdl = {
  version: "0.1.0",
  name: "pns_anchor",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "registry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "registerDomain",
      accounts: [
        {
          name: "domainAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "registry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "owner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "nameHash",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "duration",
          type: "u64",
        },
        {
          name: "resolver",
          type: {
            option: "publicKey",
          },
        },
      ],
    },
    {
      name: "renewDomain",
      accounts: [
        {
          name: "domainAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "duration",
          type: "u64",
        },
      ],
    },
    {
      name: "transferDomain",
      accounts: [
        {
          name: "domainAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "newOwner",
          type: "publicKey",
        },
      ],
    },
    {
      name: "setResolver",
      accounts: [
        {
          name: "domainAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "resolver",
          type: {
            option: "publicKey",
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "registry",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "domainCount",
            type: "u64",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "domainAccount",
      type: {
        kind: "struct",
        fields: [
          {
            name: "nameHash",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "owner",
            type: "publicKey",
          },
          {
            name: "resolver",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "expiration",
            type: "u64",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
  ],
  events: [
    {
      name: "DomainRegistered",
      fields: [
        {
          name: "nameHash",
          type: {
            array: ["u8", 32],
          },
          index: false,
        },
        {
          name: "owner",
          type: "publicKey",
          index: true,
        },
        {
          name: "expiration",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "DomainRenewed",
      fields: [
        {
          name: "nameHash",
          type: {
            array: ["u8", 32],
          },
          index: false,
        },
        {
          name: "newExpiration",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "DomainTransferred",
      fields: [
        {
          name: "nameHash",
          type: {
            array: ["u8", 32],
          },
          index: false,
        },
        {
          name: "oldOwner",
          type: "publicKey",
          index: true,
        },
        {
          name: "newOwner",
          type: "publicKey",
          index: true,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "Unauthorized",
      msg: "Unauthorized - caller is not domain owner",
    },
    {
      code: 6001,
      name: "DomainExpired",
      msg: "Domain is expired",
    },
    {
      code: 6002,
      name: "DomainNotAvailable",
      msg: "Domain is not available",
    },
    {
      code: 6003,
      name: "InvalidDuration",
      msg: "Invalid duration - must be between 1 second and 10 years",
    },
    {
      code: 6004,
      name: "InvalidName",
      msg: "Invalid domain name",
    },
  ],
};

export default PnsClient;
