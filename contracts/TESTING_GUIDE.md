# PNS Testing Guide

## Quick Start

### Run All Tests
```bash
cd contracts
forge test -v
```

### Run Specific Test
```bash
forge test --match testRegistryInitialization -v
```

### Run with Gas Report
```bash
forge test --gas-report
```

### Run with Coverage
```bash
forge coverage
```

### Watch Mode (auto-run tests on file changes)
```bash
forge test --watch
```

## Test Results Summary

The PNS smart contract suite includes comprehensive integration tests covering:

### ✅ Passing Tests (15/22)
- **Registry Tests**: Name registration, transfer, reverse records
- **Price Oracle Tests**: Dynamic pricing, premium pricing tiers
- **Resolver Tests**: Address records, text metadata, content hashes
- **Controller Tests**: Simple, batch, and metadata-enhanced registrations
- **NFT Tests**: Domain NFT minting and transfers
- **Initialization Tests**: All contracts properly initialized with roles

### ⚠️ Failing Tests (7/22) - Known Issues

1. **testDirectRegistration** - Access control needs adjustment
2. **testCommitRevealRegistration** - Role permission issue
3. **testRenewal** - Access control needs adjustment
4. **testBatchRegistration** - Insufficient payment calculation
5. **testRegistrationWithAddress** - Resolver authorization
6. **testRegistrationWithMetadata** - Resolver authorization
7. **testDomainAvailability** - Access control needs adjustment

## Compilation

### Verify Contracts Compile
```bash
forge build
```

### Check for Issues
```bash
forge build --names
```

## Deployment

### Deploy to Polygon Mumbai (Testnet)
```bash
forge script script/DeployPNS.s.sol --rpc-url https://rpc-mumbai.maticvigil.com --broadcast --verify
```

### Deploy to Polygon Mainnet
```bash
forge script script/DeployPNS.s.sol --rpc-url https://polygon-rpc.com --broadcast --verify
```

## Contract Overview

### Core Contracts

1. **PNSRegistry.sol**
   - Central registry for domain ownership
   - Manages name-to-address mappings
   - Supports subdomains
   - Access control (ADMIN_ROLE, REGISTRAR_ROLE, RESOLVER_ROLE)

2. **PNSRegistrar.sol**
   - Handles domain registration and renewals
   - Commit-reveal scheme for privacy
   - Grace periods for expired domains
   - Premium auction support

3. **PNSResolver.sol**
   - Stores address records (multi-chain support)
   - Text records (avatar, website, email, social)
   - Content hashes for IPFS/Arweave integration

4. **PNSPriceOracle.sol**
   - Dynamic pricing based on domain length
   - Premium name pricing
   - Governor-controlled price updates

5. **PNSController.sol**
   - User-facing registration interface
   - Simplified batch registration
   - Metadata setting at registration time

6. **PNSDomainNFT.sol**
   - ERC721 token for each domain
   - Transferable domain NFTs
   - Metadata URIs

## Testing Strategy

### Unit Tests
Test individual contract functions in isolation

### Integration Tests
Test interactions between multiple contracts

### Security Considerations
- Reentrancy guards on all payable functions
- Access control checks on privileged operations
- Input validation and sanitization

## Common Test Patterns

### Testing as Admin
```solidity
vm.prank(admin);
registry.someAdminFunction();
```

### Testing with ETH Transfer
```solidity
vm.deal(user, 100 ether);
vm.prank(user);
registrar.register{value: price}("domain", user, 1, resolver);
```

### Fast-forward Time
```solidity
vm.warp(block.timestamp + 1 days);
```

### Testing Role-Based Access
```solidity
bytes32 role = registry.ADMIN_ROLE();
assertTrue(registry.hasRole(role, admin));
```

## Debugging Tests

### View Transaction Logs
```bash
forge test -vvv
```

### Show Stack Traces
```bash
forge test -vvvv
```

### Run Single Test with Full Output
```bash
forge test --match testRegistryInitialization -vvv
```

## Gas Optimization

### Check Gas Usage Per Test
```bash
forge test --gas-report | grep testName
```

### View Contract Sizes
```bash
forge build --sizes
```

## Next Steps

1. Fix access control issues in remaining tests
2. Add additional edge case tests
3. Security audit review
4. Mainnet deployment

## Contact & Support

For issues or questions:
1. Check test output with `-vvv` flag
2. Verify contract deployments and role assignments
3. Review access control modifiers in contracts
