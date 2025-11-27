# PNS Contracts & Backend Audit Findings

## Executive Summary
The contracts and backend have been analyzed for issues that could cause problematic behavior and to verify the registration/availability/record flow. Several critical and medium-severity issues were identified.

---

## 🔴 CRITICAL ISSUES

### 1. **Race Condition in `_register()` - Name Can Be Registered Twice**
**Location:** `PNSRegistrar.sol`, `_register()` function

**Problem:**
```solidity
// Check if name exists and is expired
if (registry.exists(nameHash)) {
    (,, uint64 expiration) = registry.getNameRecord(nameHash);
    require(expiration + gracePeriod <= block.timestamp, "Registrar: Name not available");
    // Name is available after grace period
}

// Later...
if (!registry.exists(nameHash)) {
    registry.registerName(nameHash, owner, resolver, newExpiration);
} else {
    registry.renewName(nameHash, newExpiration);
}
```

Between the availability check and the actual registration, a concurrent transaction could register the same name, causing the `renewName()` to be called on an already-registered name with a different owner.

**Impact:**
- Name owner could be incorrectly transferred
- Payment collected but wrong owner assigned
- Broken invariants in the registry

**Fix:**
Use the registry's own existence check atomically, or implement a committed registration pattern with a commitment that can't be replayed.

---

### 2. **Resolver Authorization Bypass**
**Location:** `PNSResolver.sol`, `setAddr()`, `setPolygonAddr()`, `setText()`, etc.

**Problem:**
```solidity
function setAddr(bytes32 nameHash, uint256 coinType, address addr) external nonReentrant {
    require(msg.sender == tx.origin || hasRole(REGISTRY_ROLE, msg.sender), "Resolver: Unauthorized");
    addressRecords[nameHash][coinType] = addr;
    // ...
}
```

The condition `msg.sender == tx.origin` allows ANY contract to set records if it's being called by an EOA (Externally Owned Account). This is because:
- `msg.sender` = the calling contract
- `tx.origin` = the original EOA that initiated the transaction chain

This means any malicious contract in a transaction chain can modify records for any domain, as long as an EOA initiated the chain.

**Impact:**
- Anyone can modify domain records if they trick an EOA into calling their contract
- No actual ownership verification
- Vulnerability to flash loan or MEV attacks

**Fix:**
Replace with:
```solidity
modifier onlyNameOwner(bytes32 nameHash) {
    (address owner,,) = registry.getNameRecord(nameHash);
    require(msg.sender == owner, "Resolver: Not name owner");
    _;
}
```

---

### 3. **Missing Availability Check in `registerWithCommit()`**
**Location:** `PNSRegistrar.sol`, `registerWithCommit()` function

**Problem:**
The function doesn't verify that the name is actually available before calling `_register()`:
```solidity
function registerWithCommit(...) external payable onlyAuthorized nonReentrant {
    bytes32 commitment = keccak256(abi.encodePacked(name, owner, secret));
    
    require(commitments[commitment] > 0, "Registrar: No commitment");
    require(block.timestamp >= commitments[commitment] + commitmentAge, "Registrar: Commitment too new");
    require(block.timestamp <= commitments[commitment] + commitmentAge + cooldownPeriod, "Registrar: Commitment expired");
    
    delete commitments[commitment];
    
    _register(name, owner, duration, resolver);  // <-- Name availability checked only inside _register
    // ...
}
```

**Problem Details:**
Between the commit and reveal stages, the name could have been registered by someone else. While `_register()` does check availability, if the domain is available only during the grace period, there could be a race condition.

**Impact:**
- Users could lose their registration fee when they attempt to reveal an unavailable domain
- No clear error path for expired registrations

---

### 4. **Missing Existence Check in `renewName()`**
**Location:** `PNSRegistry.sol`, `renewName()` function

**Problem:**
```solidity
function renewName(bytes32 nameHash, uint64 newExpiration)
    external
    onlyRole(REGISTRAR_ROLE)
    nameExists(nameHash)  // <-- Only checks existence, not ownership
    nonReentrant
{
    require(newExpiration > block.timestamp, "PNS: Invalid expiration");
    require(newExpiration > records[nameHash].expiration, "PNS: Cannot shorten expiration");
    
    records[nameHash].expiration = newExpiration;
    // ...
}
```

While `nameExists()` is checked, there's no verification that the renewal is being requested by the actual owner. The `registrar.renew()` function does check ownership:

```solidity
// In PNSRegistrar.renew()
require(msg.sender == owner, "Registrar: Not name owner");
```

However, if someone calls `renewName()` directly on the registry (if they have REGISTRAR_ROLE), they could renew ANY domain without owner verification.

---

### 5. **Controller Doesn't Verify Refund Actually Occurs**
**Location:** `PNSController.sol`, `batchRegister()` function

**Problem:**
```solidity
function batchRegister(string[] calldata names, address owner, uint256 duration)
    external
    payable
    whenNotPaused
    nonReentrant
{
    uint256 totalCost = 0;
    for (uint256 i = 0; i < names.length; i++) {
        // Calculate total cost
    }
    
    require(msg.value >= totalCost, "Controller: Insufficient total payment");
    
    for (uint256 i = 0; i < names.length; i++) {
        // ... each registration may refund excess
        registrar.register{value: price}(names[i], owner, duration, address(defaultResolver));
    }
    
    emit DomainRegistered("batch", owner, duration, totalCost);
}
```

If a single registration in the batch fails after funds are sent to registrar, the funds could be locked or refunded to the registrar rather than the controller.

**Impact:**
- Potential loss of funds in failed batch operations
- No atomic batch processing

---

## 🟠 MEDIUM ISSUES

### 6. **Expiration Logic Inconsistency**
**Location:** `PNSRegistry.sol`, `expireName()` function

**Problem:**
```solidity
function expireName(bytes32 nameHash) external onlyRole(REGISTRAR_ROLE) nameExists(nameHash) nonReentrant {
    require(records[nameHash].expiration <= block.timestamp, "PNS: Name not yet expired");
    delete records[nameHash];
    delete exists[nameHash];
    delete reverseRecords[records[nameHash].owner];  // <-- records[nameHash] was just deleted!
}
```

The reverse record deletion happens AFTER the record is deleted, so `records[nameHash].owner` is no longer accessible (it will be `address(0)`).

**Fix:**
```solidity
function expireName(bytes32 nameHash) external onlyRole(REGISTRAR_ROLE) nameExists(nameHash) nonReentrant {
    require(records[nameHash].expiration <= block.timestamp, "PNS: Name not yet expired");
    address owner = records[nameHash].owner;  // Save owner first
    delete records[nameHash];
    delete exists[nameHash];
    delete reverseRecords[owner];
}
```

---

### 7. **No Actual Grace Period Enforcement**
**Location:** `PNSRegistrar.sol`, `_register()` function

**Problem:**
```solidity
if (registry.exists(nameHash)) {
    (,, uint64 expiration) = registry.getNameRecord(nameHash);
    require(expiration + gracePeriod <= block.timestamp, "Registrar: Name not available");
}
```

The grace period is enforced in the registrar but:
1. The expired domain is NEVER marked as expired/released in the registry
2. If the grace period passes, anyone can re-register the name, but the old record is still in the registry
3. This causes data bloat and potential confusion

**Impact:**
- Registry accumulates stale expired records
- No clear cleanup mechanism
- Potential for accidentally querying expired data

---

### 8. **Backend Missing Ownership Verification in Records Update**
**Location:** `backend/src/services/polygon.service.ts` - Record methods have no ownership check

**Problem:**
```typescript
async setTextRecord(name: string, key: string, value: string, privateKey?: string): Promise<string> {
    const nameHash = this.getNameHash(name);
    const wallet = this.getWallet(privateKey);
    const resolver = this.resolver.connect(wallet) as Contract;
    const tx = await resolver.setText(nameHash, key, value);  // <-- Will fail if owner didn't approve
    const receipt = await tx.wait();
    return receipt.hash;
}
```

The backend doesn't verify domain ownership before attempting to set records. If the caller isn't the owner, the contract call will fail on-chain, but there's no pre-check.

**Impact:**
- Poor UX (silent failures)
- No clear error messages about authorization
- Backend should validate ownership before attempting transaction

---

### 9. **Broken Availability Check Flow in Backend**
**Location:** `backend/src/services/polygon.service.ts`, `register()` function

**Problem:**
```typescript
async register(
    name: string,
    owner: string,
    duration: number,
    resolver?: string,
    privateKey?: string
): Promise<DomainRecord> {
    // ...
    const available = await this.controller.isDomainAvailable(name);
    if (!available) {
        throw new Error(`Domain ${name} is not available`);
    }
    // ...
}
```

But the `PNSController.isDomainAvailable()` calls `registry.exists()` and checks grace period, which could be stale by the time registration actually executes.

**Impact:**
- User sees "domain available" but registration fails
- Race conditions between check and execution
- No transaction atomicity

---

## 🟡 MINOR ISSUES

### 10. **Missing Input Validation in `concludeAuction()`**
**Location:** `PNSRegistrar.sol`, `concludeAuction()` function

The function accepts a `name` parameter but never validates it matches the `nameHash`. Could lead to confusing events with wrong names.

### 11. **No Maximum Duration Validation at Registrar Level**
The registrar allows any `duration` value. The controller limits to 10 years but the registrar doesn't, allowing inconsistencies if registrar is called directly.

### 12. **Backend Renewal Doesn't Verify Ownership**
The `renew()` operation relies on smart contract checking but doesn't pre-verify ownership in backend service.

### 13. **Missing Chain Selection in Record Operations**
Records routes accept `chain` parameter but RecordService ignores it and always uses Polygon. Code suggests multi-chain support was planned but incomplete.

---

## 📋 FLOW ANALYSIS

### Current Registration Flow (PROBLEMATIC)
```
User → Controller.registerDomain()
  ↓
Registrar.register() (onlyAuthorized)
  ↓
_register() internal:
  1. Validate name length/characters
  2. Check if exists via registry.exists(nameHash) ⚠️ RACE CONDITION
  3. If exists: check expiration + gracePeriod
  4. Get price from oracle
  5. Verify payment >= price
  6. Calculate expiration as now + (duration * 365 days)
  7. Call registry.registerName() if new, OR renewName() if exists
  8. Transfer payment to treasury
  ↓
Registry.registerName():
  1. Verify owner != 0
  2. Verify expiration > now
  3. Require name doesn't already exist ⚠️ REDUNDANT CHECK
  4. Store NameRecord
  5. Set exists[nameHash] = true
  6. Emit NameRegistered
```

**Issues in Flow:**
1. ✅ Backend checks availability (good)
2. ❌ Race condition between availability check and registration
3. ❌ `_register()` logic tries to handle re-registration but violates registry's immutability constraint
4. ❌ No atomic commit-reveal actually required for simple registration
5. ✅ Price oracle is consulted
6. ✅ Refund is issued for excess payment

### Availability Check Flow (BROKEN)
```
User → Controller.isDomainAvailable(name)
  ↓
Check: !registry.exists(nameHash) → return true ✅
  OR
Check: exists(nameHash) && (expiration + gracePeriod <= now) → return true ⚠️ RACE
  else: return false
```

**Problem:**
Between the check and registration, another transaction could:
- Register an expired domain (race for the grace period name)
- Or the name could expire, changing availability

### Record Update Flow (BROKEN)
```
User → RecordService.upsertRecord()
  ↓
1. Validate name format ✅
2. Calculate nameHash ✅
3. No ownership verification ❌
  ↓
PolygonService.setTextRecord()/setAddressRecord()/etc
  ↓
Call Resolver.setText()/setAddr()/etc with private key
  ✓ Contract checks: msg.sender == tx.origin (VULNERABLE!)
  ✓ Records are updated
  ↓
MappingService stores record locally ✅
```

**Problems:**
1. No backend ownership verification
2. Resolver has tx.origin bypass vulnerability
3. No pre-flight checks to prevent on-chain failures

---

## ✅ RECOMMENDATIONS & PRIORITY

### CRITICAL (Fix Before Mainnet)
1. **Replace `tx.origin` check in Resolver with actual ownership verification**
   - Use registry to verify caller owns the domain
   - Remove EOA-only bypass

2. **Fix race condition in `_register()`**
   - Make registration atomic or use a different pattern
   - Don't try to handle re-registration in _register()
   - Separate renewal into truly separate flow

3. **Fix `expireName()` reverse record deletion**
   - Save owner before deleting record

4. **Add backend ownership verification for records**
   - Check that caller owns domain before attempting on-chain update
   - Add pre-flight checks

### HIGH (Fix Soon)
5. **Implement proper grace period handling**
   - Auto-release domains after grace period
   - Clean up expired records
   - Use registry.expireName() after grace period

6. **Make batch operations atomic**
   - Revert entire batch if any registration fails
   - Better error handling

7. **Add max duration validation to Registrar**
   - Match controller's 10-year limit
   - Prevent unbounded registrations

### MEDIUM (Improve)
8. **Remove duplicate existence check in registry.registerName()**
   - Trust the registrar to enforce this
   - Or make registrar fully internal

9. **Complete chain selection in records**
   - Implement Solana record support or remove the option
   - Don't accept unsupported chains

10. **Improve error messages**
    - Better UX for failed transactions
    - Clear indication of why registration failed

---

## 🧪 TEST CASES TO ADD

```solidity
// Test race condition
function testRegistrationRaceCondition() {
    // Two concurrent registrations of same domain
    // Should only one succeed?
}

// Test resolver authorization
function testResolverTxOriginBypass() {
    // Contract calls resolver.setAddr()
    // Should fail but currently succeeds
}

// Test grace period
function testGracePeriodEnforcement() {
    // Register domain
    // Let it expire
    // Verify grace period prevents re-registration
    // After grace period, should allow re-registration
}

// Test batch registration failure
function testBatchRegistrationRollback() {
    // Register batch where one fails
    // Verify funds are properly handled
}
```

---

## Summary Table

| Issue | Severity | Location | Fix Complexity |
|-------|----------|----------|-----------------|
| tx.origin bypass in Resolver | CRITICAL | PNSResolver.sol | Low |
| Race condition in _register() | CRITICAL | PNSRegistrar.sol | High |
| expireName() bug | CRITICAL | PNSRegistry.sol | Low |
| Missing record ownership check (backend) | CRITICAL | record.service.ts | Low |
| Missing commitment enforcement | CRITICAL | PNSRegistrar.sol | Medium |
| Grace period not enforced | HIGH | PNSRegistrar.sol | Medium |
| Batch operations not atomic | HIGH | PNSController.sol | Medium |
| Missing duration validation | MEDIUM | PNSRegistrar.sol | Low |
| Chain selection incomplete (backend) | MEDIUM | record.service.ts | Medium |
| Duplicate existence check | MINOR | PNSRegistry.sol | Low |
