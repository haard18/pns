# PNS Anchor Program - Solana Name Service

A complete Anchor program implementation for the Predictify Name Service (PNS) on Solana, providing domain registration, renewal, transfer, and resolver management.

## Program Features

- **Domain Registration**: Register new domains with custom duration (1 second to 10 years)
- **Domain Renewal**: Extend domain expiration time
- **Domain Transfer**: Transfer ownership to another address
- **Resolver Management**: Set optional resolver for domain records
- **PDA-based Storage**: Each domain stored as a Program-Derived Address
- **Namehash Support**: Full 32-byte Keccak256 domain hashing for compatibility
- **Event Logging**: Emit events for DomainRegistered, DomainRenewed, DomainTransferred

## Account Structure

### Registry PDA
```rust
pub struct Registry {
    pub authority: Pubkey,      // 32 bytes - Registry authority
    pub domain_count: u64,      // 8 bytes - Total domains registered
    pub bump: u8,               // 1 byte - Registry PDA bump
}
```

### DomainAccount PDA
```rust
pub struct DomainAccount {
    pub name_hash: [u8; 32],    // 32 bytes - Keccak256 hash of domain
    pub owner: Pubkey,          // 32 bytes - Domain owner
    pub resolver: Option<Pubkey>, // 33 bytes - Optional resolver
    pub expiration: u64,        // 8 bytes - Unix timestamp expiration
    pub bump: u8,               // 1 byte - PDA bump
}
```

## PDAs

The program uses standard PDA derivation:

- **Registry**: `seeds = [b"registry"]`
- **Domain**: `seeds = [b"domain", &name_hash[..]]`

Example:
```typescript
// Registry PDA
const [registryPDA, registryBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("registry")],
  programId
);

// Domain PDA
const [domainPDA, domainBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("domain"), Buffer.from(nameHash)],
  programId
);
```

## Instructions

### initialize()
Initialize the global registry. Should be called once at deployment.

**Accounts:**
- `registry` (mut) - Registry PDA
- `authority` (mut, signer) - Authority/payer
- `system_program` - System program

**Example:**
```typescript
const tx = await pnsClient.initialize(authorityKeypair);
```

### registerDomain(name_hash, duration, resolver?)
Register a new domain or re-register an expired domain.

**Parameters:**
- `name_hash: [u8; 32]` - Keccak256 hash of domain name
- `duration: u64` - Registration duration in seconds (1 sec - 10 years)
- `resolver: Option<Pubkey>` - Optional resolver address

**Accounts:**
- `domain_account` (mut) - Domain PDA
- `registry` (mut) - Registry PDA
- `owner` (mut, signer) - Domain owner/payer
- `system_program` - System program

**Example:**
```typescript
const nameHash = Buffer.from(keccak256(Buffer.from("example.sol")));
const tx = await pnsClient.registerDomain(
  nameHash,
  365 * 24 * 60 * 60, // 1 year
  ownerKeypair,
  resolverPubkey      // optional
);
```

### renewDomain(duration)
Extend an existing domain's expiration.

**Parameters:**
- `duration: u64` - Additional duration in seconds

**Accounts:**
- `domain_account` (mut) - Domain PDA
- `owner` (signer) - Current domain owner

**Example:**
```typescript
const tx = await pnsClient.renewDomain(
  nameHash,
  365 * 24 * 60 * 60, // 1 year
  ownerKeypair
);
```

### transferDomain(new_owner)
Transfer domain ownership to another address.

**Parameters:**
- `new_owner: Pubkey` - New owner's public key

**Accounts:**
- `domain_account` (mut) - Domain PDA
- `owner` (signer) - Current owner

**Example:**
```typescript
const tx = await pnsClient.transferDomain(
  nameHash,
  newOwnerPubkey,
  currentOwnerKeypair
);
```

### setResolver(resolver)
Update the resolver for a domain.

**Parameters:**
- `resolver: Option<Pubkey>` - New resolver (null to remove)

**Accounts:**
- `domain_account` (mut) - Domain PDA
- `owner` (signer) - Domain owner

**Example:**
```typescript
const tx = await pnsClient.setResolver(
  nameHash,
  newResolverPubkey,
  ownerKeypair
);
```

## Building

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked
```

### Build the Program
```bash
anchor build
```

This generates:
- Compiled program: `target/deploy/pns_anchor.so`
- IDL: `target/idl/pns_anchor.json`
- TypeScript types: `target/types/pns_anchor.ts`

## Testing

```bash
# Run all tests
anchor test

# Run specific test
anchor test -- --grep "Registers a domain"
```

## Deployment

### 1. Generate Keypair (if needed)
```bash
solana-keygen new --outfile target/deploy/pns_anchor-keypair.json
```

### 2. Get Program ID
```bash
solana address -k target/deploy/pns_anchor-keypair.json
```

### 3. Update Program ID
Update the `declare_id!()` macro in `src/lib.rs` and `Anchor.toml` with your program ID.

### 4. Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

### 5. Deploy to Mainnet
```bash
anchor deploy --provider.cluster mainnet
```

## TypeScript Client Usage

### Installation

Copy `client/pns-client.ts` to your backend project:

```bash
cp client/pns-client.ts /path/to/backend/src/services/solana-pns-client.ts
```

### Usage

```typescript
import PnsClient from './solana-pns-client';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

// Initialize client
const connection = new Connection('https://api.devnet.solana.com');
const programId = new PublicKey('YOUR_PROGRAM_ID');
const wallet = Keypair.fromSecretKey(new Uint8Array([...]));

const client = new PnsClient(connection, programId, wallet);

// Register domain
const nameHash = Buffer.from(keccak256(Buffer.from("myname.sol")));
const tx = await client.registerDomain(
  nameHash,
  365 * 24 * 60 * 60, // 1 year
  wallet
);

// Fetch domain
const domain = await client.fetchDomain(nameHash);
console.log('Domain owner:', domain?.owner.toString());

// Check availability
const available = await client.isAvailable(nameHash);
console.log('Domain available:', available);

// Get all domains for owner
const domains = await client.fetchDomainsByOwner(wallet.publicKey);
```

## Integration with Backend

The `pns-client.ts` is already integrated in the backend's `SolanaService`:

```typescript
// In backend/src/services/solana.service.ts
import PnsClient from '../services/solana-pns-client';

export class SolanaService {
  private client: PnsClient;

  constructor() {
    const connection = new Connection(Config.solana.rpcUrl);
    this.client = new PnsClient(
      connection,
      new PublicKey(Config.solana.programId)
    );
  }

  async registerDomain(name: string, owner: string, duration: number): Promise<DomainRecord> {
    const nameHash = Buffer.from(namehash(getFullDomainName(name)).slice(2), 'hex');
    const tx = await this.client.registerDomain(nameHash, duration, ownerKeypair);
    // ... return DomainRecord
  }
}
```

## Error Codes

| Code | Error | Message |
|------|-------|---------|
| 6000 | Unauthorized | Unauthorized - caller is not domain owner |
| 6001 | DomainExpired | Domain is expired |
| 6002 | DomainNotAvailable | Domain is not available |
| 6003 | InvalidDuration | Invalid duration - must be between 1 second and 10 years |
| 6004 | InvalidName | Invalid domain name |

## Events

The program emits three types of events:

```rust
#[event]
pub struct DomainRegistered {
    pub name_hash: [u8; 32],
    pub owner: Pubkey,
    pub expiration: u64,
}

#[event]
pub struct DomainRenewed {
    pub name_hash: [u8; 32],
    pub new_expiration: u64,
}

#[event]
pub struct DomainTransferred {
    pub name_hash: [u8; 32],
    pub old_owner: Pubkey,
    pub new_owner: Pubkey,
}
```

## Gas Costs

Approximate rent/gas costs (in SOL):

- **Initialize Registry**: ~0.0127 SOL (one-time)
- **Register Domain**: ~0.0125 SOL + rent (~0.00288 SOL/year)
- **Renew Domain**: ~0.00005 SOL
- **Transfer Domain**: ~0.00005 SOL
- **Set Resolver**: ~0.00005 SOL

## Future Enhancements

- [ ] Metaplex NFT integration for domain NFTs
- [ ] Decentralized resolver implementations
- [ ] Subdomains support
- [ ] Cross-chain bridge to Polygon PNS
- [ ] Domain auction system
- [ ] Metadata IPFS integration

## License

MIT
