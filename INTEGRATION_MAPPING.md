# Integration Mapping Reference

## Backend API Endpoints → Frontend Integration Points

### Domain Management Endpoints

#### 1. Check Domain Availability
**Backend Endpoint:** `POST /api/pns/check-availability`
- **Input:** `{ name: string }`
- **Output:** `{ available: boolean, message: string }`
- **Frontend Usage:** `pnsApi.checkDomainAvailability(name)` in Search.tsx

```typescript
// Search.tsx
const available = await checkAvailability("myname");
// Shows: "Available" or "Already Registered"
```

---

#### 2. Get Domain Price
**Backend Endpoint:** `POST /api/pns/get-price`
- **Input:** `{ name: string, duration?: number }`
- **Output:** `{ price: string, duration: number, totalPrice: string }`
- **Frontend Usage:** `pnsApi.getDomainPrice(name, duration)` in Search.tsx & RegisterDomain.tsx

```typescript
// Search.tsx
const priceData = await getPrice("myname", 1);
// Shows: "0.1 ETH for 1 year"

// RegisterDomain.tsx
const price = await getPrice(domainName, years);
// Updates total price calculation
```

---

#### 3. Register Domain
**Backend Endpoint:** `POST /api/pns/register`
- **Input:** `{ name: string, owner: string, duration: number, resolver?: string }`
- **Output:** `{ success: boolean, domainRecord: DomainRecord, txHash: string }`
- **Frontend Usage:** `useDomain().register(name, owner, duration)` in RegisterDomain.tsx

```typescript
// RegisterDomain.tsx
const result = await register("myname", walletAddress, 2);
// Registers domain for 2 years
// Navigates to profile page on success
```

---

#### 4. Renew Domain
**Backend Endpoint:** `POST /api/pns/renew`
- **Input:** `{ name: string, duration: number }`
- **Output:** `{ success: boolean, expirationDate: string, txHash: string }`
- **Frontend Usage:** `useDomain().renew(name, duration)` in ManageDomain.tsx

```typescript
// ManageDomain.tsx
const result = await renew("myname", 1);
// Extends domain for 1 more year
// Updates expiration date
```

---

#### 5. Get User's Domains
**Backend Endpoint:** `GET /api/pns/user-domains/:address`
- **Input:** Wallet address in URL
- **Output:** `DomainRecord[]`
- **Frontend Usage:** `useDomain().getUserDomains(address)` in Domain.tsx & Profile.tsx

```typescript
// Domain.tsx
const domains = await getUserDomains(walletAddress);
// Shows list of all user's domains
// Updates statistics (total count, portfolio value)

// Profile.tsx
const domains = await getUserDomains(walletAddress);
// Populates user's domain list
// Shows total domains owned
```

---

#### 6. Get Domain Details
**Backend Endpoint:** `GET /api/pns/domain-details/:name`
- **Input:** Domain name in URL
- **Output:** `DomainRecord`
- **Frontend Usage:** `useDomain().getDomainDetails(name)` in ManageDomain.tsx

```typescript
// ManageDomain.tsx
const details = await getDomainDetails("myname");
// Displays:
// - Owner address
// - Expiration date
// - Resolver address
// - Registration date
```

---

#### 7. Health Check
**Backend Endpoint:** `GET /api/health`
- **Output:** `{ status: "ok", timestamp: string }`
- **Frontend Usage:** `pnsApi.checkApiHealth()` (optional)

```typescript
// App.tsx or utils
const isHealthy = await checkApiHealth();
// Used for connection verification
```

---

## Data Flow Diagrams

### Search Flow
```
User types domain name
         ↓
Search button clicked
         ↓
checkAvailability() called
         ↓
Backend checks Registry contract
         ↓
Response: { available: true }
         ↓
Display "Available" badge
         ↓
getPrice() called
         ↓
Backend calculates price
         ↓
Response: { price: "0.1 ETH" }
         ↓
Display price and Register button
```

### Registration Flow
```
User fills registration form
- Domain name
- Duration (1-10 years)
- Payment method (ETH/USDC)
         ↓
Connect Wallet clicked (if not connected)
         ↓
useWallet() establishes connection
         ↓
Confirm button clicked
         ↓
register() function called with:
- domain name
- wallet address
- duration
         ↓
Backend creates transaction
         ↓
User approves in MetaMask
         ↓
Smart contract executes
         ↓
Backend returns txHash
         ↓
Redirect to profile page
         ↓
getUserDomains() fetches updated list
         ↓
New domain appears in user's portfolio
```

### Domain Management Flow
```
User navigates to /manage/myname.poly
         ↓
getDomainDetails() fetches data
         ↓
Display domain information:
- Owner
- Expiration date
- Records
- Permissions
         ↓
User clicks "Renew Domain"
         ↓
renew() function called
         ↓
User approves MetaMask transaction
         ↓
Backend updates Registry
         ↓
Expiration date updated
         ↓
Success message displayed
```

---

## Type Definitions

### Request/Response Types

```typescript
// Domain Record
interface DomainRecord {
  name: string;
  owner: string;
  resolver?: string;
  registrationDate: string;
  expirationDate: string;
  text?: Record<string, string>;
}

// Register Request
interface RegisterRequest {
  name: string;
  owner: string;
  duration: number;
  resolver?: string;
}

// Price Response
interface PriceResponse {
  price: string;
  duration: number;
  totalPrice: string;
}

// Generic API Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Wallet State
interface WalletState {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  chainId: number;
}

// Domain Hook State
interface DomainState {
  domain: string | null;
  price: string | null;
  isAvailable: boolean | null;
  isLoading: boolean;
  error: string | null;
}
```

---

## Component → Hook → API Mapping

### Search.tsx Component
```
Component: Search.tsx
    ↓ Uses Hook
Hook: useDomain()
    ├─ checkAvailability()
    │   ↓ Calls Service
    │   Service: pnsApi.checkDomainAvailability()
    │       ↓ Makes Request
    │       Backend: POST /api/pns/check-availability
    │
    └─ getPrice()
        ↓ Calls Service
        Service: pnsApi.getDomainPrice()
            ↓ Makes Request
            Backend: POST /api/pns/get-price
```

### Domain.tsx Component
```
Component: Domain.tsx
    ↓ Uses Hook
Hook: useDomain()
    ├─ Wallet: useWallet()
    │   └─ address from Wagmi
    │
    └─ getUserDomains()
        ↓ Calls Service
        Service: pnsApi.getUserDomains()
            ↓ Makes Request
            Backend: GET /api/pns/user-domains/:address
                ↓ Queries
                Smart Contract: Registry.domainsOf(address)
```

### RegisterDomain.tsx Component
```
Component: RegisterDomain.tsx
    ↓ Uses Hook + Context
    ├─ useDomain()
    │   ├─ register()
    │   │   ↓ Calls Service
    │   │   Service: pnsApi.registerDomain()
    │   │       ↓ Makes Request
    │   │       Backend: POST /api/pns/register
    │   │           ↓ Executes
    │   │           Smart Contract: Registrar.register()
    │   │
    │   └─ getPrice()
    │       ↓ Calls Service
    │       Service: pnsApi.getDomainPrice()
    │
    └─ useWallet()
        └─ address, connect(), disconnect()
            ↓ From Wagmi
            MetaMask / Wallet Provider
```

### ManageDomain.tsx Component
```
Component: ManageDomain.tsx
    ↓ Uses Hooks
    ├─ useDomain()
    │   ├─ renew()
    │   │   ↓ Calls Service
    │   │   Service: pnsApi.renewDomain()
    │   │       ↓ Makes Request
    │   │       Backend: POST /api/pns/renew
    │   │
    │   └─ getDomainDetails()
    │       ↓ Calls Service
    │       Service: pnsApi.getDomainDetails()
    │           ↓ Makes Request
    │           Backend: GET /api/pns/domain-details/:name
    │
    └─ useWallet()
        └─ address from Wagmi
```

### Profile.tsx Component
```
Component: Profile.tsx
    ↓ Uses Hooks
    ├─ useWallet()
    │   └─ address
    │
    └─ useDomain()
        └─ getUserDomains()
            ↓ Calls Service
            Service: pnsApi.getUserDomains()
                ↓ Makes Request
                Backend: GET /api/pns/user-domains/:address
                    ↓ Queries
                    Smart Contract: Registry.domainsOf(address)
```

---

## Error Handling Flow

```
API Call Made
    ↓
Response Received
    ├─ Success (200)
    │   └─ Return data
    │       └─ Update component state
    │
    └─ Error
        ├─ Network Error
        │   └─ Display "Connection failed"
        │
        ├─ API Error (400/500)
        │   └─ Extract error message
        │       └─ Display in UI
        │
        └─ Contract Error
            └─ Parse revert reason
                └─ Show user-friendly message
```

---

## State Management Flow

```
Global State (WalletContext)
├─ address: string | null
├─ isConnected: boolean
├─ chainId: number
└─ connect() / disconnect()

Local State (useDomain Hook)
├─ domain: string
├─ price: string
├─ isAvailable: boolean
├─ isLoading: boolean
├─ error: string
└─ Operations:
   ├─ checkAvailability()
   ├─ getPrice()
   ├─ register()
   ├─ renew()
   ├─ getDomainDetails()
   └─ getUserDomains()

Component State
├─ Input values
├─ UI flags (modals, tabs)
├─ Local lists (records, suggestions)
└─ Form states
```

---

## Environment Variables Used

| Variable | Used In | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | pnsApi.ts | Base URL for backend API calls |
| `VITE_POLYGON_RPC` | WagmiProvider | RPC endpoint for blockchain interactions |

---

## Validation Points

### Frontend Validation
```
Domain Name
├─ Non-empty check
├─ Valid characters check
├─ Minimum length (3 chars)
└─ Maximum length (63 chars)

Duration
├─ Number validation
├─ Min value (1 year)
└─ Max value (10 years)

Wallet Address
├─ Valid Ethereum address format
└─ Connected to Polygon network

Payment
├─ Selected method validation
└─ Sufficient balance check (optional)
```

### Backend Validation
(Handled in backend/src/routes/pns.routes.ts)
```
Domain Name
├─ Availability check
└─ Registration status check

Duration
├─ Valid range check
└─ Premium name pricing

User
├─ Wallet address format
└─ Owner verification
```

---

## Testing Endpoints

Test these manually to verify integration:

```bash
# Check Availability
curl -X POST http://localhost:3000/api/pns/check-availability \
  -H "Content-Type: application/json" \
  -d '{"name":"testdomain"}'

# Get Price
curl -X POST http://localhost:3000/api/pns/get-price \
  -H "Content-Type: application/json" \
  -d '{"name":"testdomain","duration":1}'

# Get User Domains
curl http://localhost:3000/api/pns/user-domains/0x[YOUR_ADDRESS]

# Get Domain Details
curl http://localhost:3000/api/pns/domain-details/testdomain

# Health Check
curl http://localhost:3000/api/health
```

---

## Success Indicators

✅ All endpoints respond correctly
✅ Domain availability checks work
✅ Pricing calculations accurate
✅ Registration transactions succeed
✅ User domains display correctly
✅ Renewal functionality works
✅ Error messages display properly
✅ Wallet connection persists
✅ Loading states appear/disappear correctly
✅ No console errors in browser DevTools

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "API call failed" | Backend not running | Start backend with `npm start` |
| "Network error" | Wrong RPC URL | Check VITE_POLYGON_RPC in .env.local |
| "Contract not found" | Wrong contract address | Redeploy contracts and update backend .env |
| "Undefined domain" | Hook not ready | Add loading check before rendering |
| "Price calculation wrong" | Duration not passed | Ensure duration parameter is included |
| "Domains list empty" | Address not connected | Ensure wallet is connected first |

---

## Performance Metrics

Target response times:
- Domain availability check: < 500ms
- Get price: < 200ms
- User domains list: < 1s
- Register transaction: 10-30s (blockchain dependent)
- Renew transaction: 10-30s (blockchain dependent)

Monitor in browser DevTools → Network tab.
