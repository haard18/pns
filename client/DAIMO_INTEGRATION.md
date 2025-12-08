# Daimo Pay Integration for PNS Domain Registration

## Overview

This integration allows users to pay for domain registrations using **any token from any chain**, which is automatically converted to USDC on Polygon for the domain registration contract.

## What is Daimo Pay?

Daimo Pay enables one-click payments from any cryptocurrency on any chain to your desired token on your desired chain. Users can pay with:
- ETH, USDC, USDT on Ethereum, Base, Arbitrum, Optimism, Polygon
- Tokens from Solana, BSC, Celo, Linea, Gnosis, Scroll, and World Chain
- Direct wallet connections or payment apps (Venmo, CashApp, etc.)

## Integration Architecture

### 1. Configuration (`src/config/daimoConfig.ts`)

- **POLYGON_USDC**: Target token configuration (USDC on Polygon)
- **DAIMO_APP_ID**: Your app identifier (use "pay-demo" for prototyping)
- **DAIMO_API_URL**: Daimo Pay API endpoint
- **Payment preferences**: Prioritizes Polygon and USDC for better UX

### 2. Custom Hook (`src/hooks/useDaimoPayDomain.ts`)

The `useDaimoPayDomain` hook handles the entire payment and registration flow:

```typescript
const {
  paymentState,        // Current payment status
  prepareDaimoPayProps, // Generate props for DaimoPayButton
  resetState,          // Reset after completion
  order                // Payment order details
} = useDaimoPayDomain();
```

**Payment Flow:**

1. **Payment Started**: User clicks DaimoPayButton and initiates payment
2. **Payment Completed**: Payment confirmed on-chain (any chain)
3. **Auto Registration**: Hook automatically calls domain registration contract
4. **Transaction Recording**: Both payment and registration transactions saved to DB

### 3. UI Integration (`src/pages/RegisterDomain.tsx`)

Two payment methods available:

1. **Daimo Pay** (Default): Pay from any chain
2. **Direct USDC**: Traditional USDC approval + payment on Polygon

```tsx
<DaimoPayButton
  {...prepareDaimoPayProps(
    domainName,
    priceInUsd,
    durationYears,
    ownerAddress
  )}
/>
```

## Payment Flow Diagram

```
User clicks "Pay from Any Chain"
         ↓
[Daimo Pay Modal Opens]
         ↓
User selects payment source (any token, any chain)
         ↓
Payment transaction sent on source chain
         ↓
Daimo bridges/swaps to USDC on Polygon
         ↓
[onPaymentCompleted callback triggered]
         ↓
Auto-register domain on PNS contract
         ↓
Record both transactions in database
         ↓
Redirect to profile page
```

## Key Features

### 1. Multi-Chain Support
Users can pay from ANY of these chains:
- Ethereum, Polygon, Arbitrum, Optimism, Base
- BSC, Celo, Linea, Gnosis, Scroll, World Chain
- Solana

### 2. Multi-Token Support
Accept payments in:
- ETH, WETH
- USDC, USDT, DAI
- Native tokens from various chains

### 3. Automatic Registration
After payment is confirmed, the domain is automatically registered without requiring a second transaction.

### 4. Transaction Tracking
Both payment and registration transactions are recorded with:
- Transaction hash
- Payment ID (for correlation)
- Amount and duration
- Timestamps

### 5. Error Handling
- Payment failures are caught and displayed
- Registration failures after payment are logged
- Retry mechanisms available

## Configuration for Production

### 1. Get Daimo API Key

Contact Daimo team to get your production API key and App ID:
- Email: support@daimo.com
- Website: https://pay.daimo.com

### 2. Environment Variables

Add to `.env.local`:

```env
VITE_DAIMO_APP_ID=your-production-app-id
VITE_DAIMO_API_URL=https://pay-api.daimo.xyz
```

### 3. Update Recipient Address

In `daimoConfig.ts`, ensure the controller contract address is correct:

```typescript
export function getRecipientAddress(chainId: number): `0x${string}` {
  const addresses: Record<number, `0x${string}`> = {
    137: '0x463ba8Cb8b322b2DE6B498078462Bf9746638927', // Your Controller
  };
  return addresses[chainId] || addresses[137];
}
```

## Testing

### Development Testing

1. Use `pay-demo` as the App ID
2. Test with small amounts on testnet first
3. Monitor console logs for payment flow

### Production Testing Checklist

- [ ] Verify controller contract can receive USDC
- [ ] Test payment from multiple chains (Ethereum, Base, Arbitrum)
- [ ] Test payment with multiple tokens (ETH, USDC, USDT)
- [ ] Verify domain registration after payment
- [ ] Check transaction recording in database
- [ ] Test error handling (failed payments, failed registrations)

## Webhooks (Optional)

For robust production tracking, implement Daimo webhooks:

```typescript
// Backend endpoint to receive payment notifications
app.post('/api/daimo-webhook', async (req, res) => {
  const { paymentId, txHash, status } = req.body;
  
  if (status === 'completed') {
    // Verify payment on-chain
    // Update database
    // Trigger domain registration if not already done
  }
  
  res.json({ received: true });
});
```

Register webhook URL at: https://paydocs.daimo.com/webhooks

## Customization

### Change Payment Intent

In `daimoConfig.ts`, you can use different intents:

```typescript
type PaymentIntent = 'Purchase' | 'Register' | 'Deposit' | 'Renew';
```

### Customize Preferred Tokens

```typescript
preferredTokens: [
  { chain: 137, address: POLYGON_USDC.token },  // Polygon USDC
  { chain: 1, address: '0xA0b86....' },         // Ethereum USDC
]
```

### Add Custom Metadata

In `useDaimoPayDomain.ts`, extend the metadata:

```typescript
metadata: {
  duration: pendingRegistration.durationYears,
  price: pendingRegistration.priceUsd,
  referralCode: yourReferralCode,
  customField: yourData,
}
```

## Resources

- **Daimo Pay Docs**: https://paydocs.daimo.com
- **Quickstart**: https://paydocs.daimo.com/quickstart
- **SDK Reference**: https://paydocs.daimo.com/sdk
- **Example Apps**: https://github.com/daimo-eth/pay/tree/master/examples
- **Demo**: https://daimo-pay-demo.vercel.app

## Support

For issues with Daimo Pay integration:
- GitHub: https://github.com/daimo-eth/pay
- Email: support@daimo.com
- Discord: https://discord.gg/daimo

## License

This integration uses `@daimo/pay` which is MIT licensed.
