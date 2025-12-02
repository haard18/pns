We are finalizing a Polygon-only Name Service (PNS) project.

We just changed the architecture so the frontend calls smart contracts directly for all read/write operations, and the backend only indexes events + stores transaction history.  
Everything in the repo needs to be reorganized, cleaned, and made consistent with this new architecture.

Below is the architecture specification — use it as the single source of truth:

--------------------------------------------------------------------
ARCHITECTURE SPEC (DO NOT MODIFY)

Frontend → Smart Contracts (direct reads + writes)
Backend → Only for:
    • event indexing
    • domain ownership database
    • transaction history logging
--------------------------------------------------------------------

### Frontend Responsibilities
- Do NOT call backend for:
  - availability
  - expiration
  - owner
  - resolver
  - records

These must call contracts directly:
  - PNSController
  - PNSRegistry
  - PNSResolver
  - PNSPriceOracle
  - PNSDomainNFT
  - PNSRegistrar

Frontend write flows:
  - registerDomain()
  - renewDomain()
  - setTextRecord()
  - setAddressRecord()

After successful write → call backend API:
  - POST /tx/record

Backend is NOT allowed to perform blockchain writes.

### Backend Responsibilities
Backend must support:
1. Event indexing
   - Scan NameRegistered, NameRenewed, ResolverChanged, TextChanged, Transfer events
   - Keep a DB copy of (domainHash, name, owner, expiration, resolver)

2. History logging
   - When frontend sends successful tx
   - Store {user, action, txHash, chain, timestamp}

3. API endpoints:
   - GET /domains/:address → returns domains owned by address (from indexed DB)
   - GET /tx/:address → returns transaction history
   - POST /tx/record → record write operations

### Required Folder Structure
Create the following clean structure:

contracts/
  ├── PNSRegistry.sol
  ├── PNSRegistrar.sol
  ├── PNSController.sol
  ├── PNSResolver.sol
  ├── PNSPriceOracle.sol
  ├── PNSDomainNFT.sol
  ├── libs/
  │     └── PNSUtils.sol (namehash, validation, constants)

client/
  src/
    hooks/
      useContracts.ts
      useDomain.ts
    lib/
      namehash.ts
      addresses.ts
      providers.ts
    pages/
      RegisterDomain.tsx
      ManageDomain.tsx

backend/
  src/
    indexer/
      scanEvents.ts
      syncLoop.ts
    controllers/
      domains.controller.ts
      tx.controller.ts
    services/
      domain.service.ts
      tx.service.ts
      eventParser.ts
    routes/
      domains.routes.ts
      tx.routes.ts
    db/
      prisma schema or mongoose models
    app.ts

### Cleanup Tasks Copilot Must Perform
- Standardize all Solidity contracts:
  - Use consistent pragma (^0.8.24)
  - Use OZ upgradeable modules (AccessControlUpgradeable, UUPSUpgradeable, etc.)
  - Replace _setupRole with _grantRole
  - Add PausableUpgradeable to registrar + controller
  - Add namehash + validation into PNSUtils
  - Add clear event emissions everywhere needed
  - Remove unused code, unused events, unused storage

- Clean frontend hooks:
  - Move all direct reads into useContracts.ts
  - Move domain logic into useDomain.ts
  - Remove any backend reads
  - Ensure all reads call contracts correctly using viem/wagmi

- Update backend:
  - Make it event-driven and indexing-based only
  - Remove ANY function that calls blockchain RPC write methods
  - Add event scanners and cron-like sync loop
  - Add DB layer for storing indexed domain + tx history
  - Implement REST API cleanly

- Add utility files:
  - namehash.ts (frontend)
  - PNSUtils.sol (contracts)
  - eventParser.ts (backend)

- Ensure everything follows the architecture diagram exactly.

### Output Expectations
Copilot should:
- Refactor files
- Delete dead code
- Fix wrong imports
- Normalize file names + folder structure
- Improve readability and maintainability
- Ensure contracts, frontend, and backend match the new architecture fully

Do not guess. Follow the architecture spec exactly.
