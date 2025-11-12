### 🧠 Copilot Prompt: “Multi-Chain PNS Backend + Solana Integration”

````
We already have a complete Polygon implementation of a name service (PNS) with contracts:
- PNSRegistry.sol
- PNSRegistrar.sol
- PNSResolver.sol
- PNSDomainNFT.sol
- PNSPriceOracle.sol
- PNSController.sol

Now, create the backend system and Solana integration layer that lets users mint or query domains on **either Polygon or Solana**.

### GOAL
Build a unified backend in TypeScript (Node.js + Express or FastAPI equivalent) that:
1. Connects to the existing deployed Polygon PNS smart contracts via Ethers.js or Viem.
2. Integrates with Solana via @coral-xyz/anchor to interact with a new Anchor program that mirrors the registrar/registry logic.
3. Exposes clean REST or GraphQL APIs for:
   - `POST /register` → mint a domain on Polygon or Solana based on user choice
   - `GET /domains/:address` → list all domains owned by an address (aggregating both chains)
   - `GET /price?name=` → get current registration price from Oracle (Polygon or Solana)
   - `POST /renew` → renew domain
4. Normalizes responses from both chains into a single JSON schema.

### SOLANA SPEC
- Write a minimal Anchor program `pns_anchor` with these accounts:
  - `Registry` PDA: stores domain hash, owner pubkey, resolver pubkey, expiration timestamp.
  - `Registrar`: handles register and renew instructions.
  - `DomainNFT`: mint via Metaplex standard (metadata stored on Arweave/IPFS).
- Implement helper functions in the backend:
  - `registerOnSolana(name, ownerPubkey, duration, resolver?)`
  - `fetchSolanaDomains(ownerPubkey)`
  - `getSolanaPrice(name, duration)`
- Include Anchor IDL integration to auto-generate TS client.

### BACKEND REQUIREMENTS
- Node.js (TypeScript)
- Express or Fastify
- Ethers.js (Polygon side)
- @coral-xyz/anchor + Solana web3.js (Solana side)
- Shared util: `namehash()` to normalize domain identifiers
- Store shared metadata on IPFS/Arweave using Pinata or Bundlr SDK
- Include `.env` config for RPC URLs, contract addresses, and keypairs
- Provide a unified `pns.service.ts` file that abstracts both chains:
  ```ts
  async function registerDomain(chain: "polygon" | "solana", name: string, owner: string, duration: number, resolver?: string)
  async function getDomains(owner: string): Promise<DomainRecord[]>
````

### OUTPUT EXPECTATIONS

1. Backend directory structure with API routes, services, and utils.
2. Example Anchor account + instruction layout for Solana version.
3. Unified response schema for frontend:

   ```json
   {
     "name": "haard.poly",
     "chain": "solana",
     "owner": "So1PubKey...",
     "expires": 1750000000,
     "resolver": "SomeResolver",
     "metadata": "ipfs://Qm..."
   }
   ```
4. Optional: cron or worker to sync new registrations from both chains into a database (Postgres/Mongo).

Focus on:

* API design
* Chain abstraction layer
* TypeScript typings
* Deployment readiness

```


