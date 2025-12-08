# Daimo Pay Setup Guide

## Quick Start

Your Daimo Pay integration is now complete! Follow these steps to start accepting payments from any chain.

## 1. Verify Installation

Check that `@daimo/pay` is installed (already done):

```bash
cd client
npm list @daimo/pay
```

Should show: `@daimo/pay@^1.19.5`

## 2. Configuration Files Created

✅ `/src/config/daimoConfig.ts` - Payment configuration
✅ `/src/hooks/useDaimoPayDomain.ts` - Payment hook
✅ `/src/App.tsx` - Already has DaimoPayProvider wrapper
✅ `/src/pages/RegisterDomain.tsx` - DaimoPayButton integrated

## 3. Environment Setup (Optional)

For production, create or update `.env.local`:

```bash
# For prototyping, use the demo app ID
VITE_DAIMO_APP_ID=pay-demo
VITE_DAIMO_API_URL=https://pay-api.daimo.xyz

# For production, contact Daimo for your app ID
# Email: support@daimo.com
```

## 4. Test the Integration

### Local Testing

1. Start your development server:
```bash
npm run dev
```

2. Navigate to domain registration page
3. Click "Pay from Any Chain" button
4. Test payment modal opens correctly

### Test Payment Flow

1. **Select Domain**: Choose a domain to register
2. **Choose Payment Method**: Default is "Pay from Any Chain" (Daimo)
3. **Click DaimoPayButton**: Modal opens with payment options
4. **Select Source**: Choose any chain/token you have
5. **Confirm Payment**: Payment processes automatically
6. **Auto Registration**: Domain registers after payment completes
7. **Redirect**: Navigate to profile after 3 seconds

## 5. What Works Now

✅ **Multi-Chain Payments**
- Accept ETH, USDC, USDT from Ethereum, Base, Arbitrum, Optimism, Polygon
- Support for Solana, BSC, Celo, and more

✅ **Automatic Registration**
- Payment triggers domain registration automatically
- No second transaction needed from user

✅ **Transaction Tracking**
- Payment and registration transactions both recorded
- Payment ID correlation for webhooks

✅ **Error Handling**
- Payment failures caught and displayed
- Registration failures logged with error messages

✅ **Status Updates**
- Real-time payment status
- Registration progress indicator
- Success/error notifications

## 6. Payment Flow

```
User: Select domain → Click "Pay from Any Chain"
         ↓
Daimo: Opens modal with payment options (any chain/token)
         ↓
User: Confirms payment with their chosen token
         ↓
Daimo: Bridges/swaps to USDC on Polygon automatically
         ↓
App: Receives onPaymentCompleted callback
         ↓
App: Automatically registers domain on PNS contract
         ↓
App: Records both transactions in database
         ↓
App: Redirects to profile page
```

## 7. Customization Options

### Change Default Payment Method

In `RegisterDomain.tsx`:
```typescript
const [paymentMethod, setPaymentMethod] = useState<"USDC" | "Daimo" | "Other">("Daimo");
// Change "Daimo" to "USDC" for traditional payment default
```

### Adjust Preferred Chains

In `daimoConfig.ts`:
```typescript
preferredChains: [137, 1, 10] as number[], // Polygon, Ethereum, Optimism
```

### Change Button Text/Intent

In `daimoConfig.ts`:
```typescript
intent: 'Register' as const, // or 'Purchase', 'Deposit', 'Renew'
```

## 8. Production Checklist

Before going live:

- [ ] Get production App ID from Daimo team
- [ ] Update `VITE_DAIMO_APP_ID` in environment
- [ ] Verify controller contract can receive USDC
- [ ] Test payments from multiple chains
- [ ] Test with small amounts first
- [ ] Monitor transaction recordings in database
- [ ] Set up webhook endpoint (optional but recommended)
- [ ] Test error scenarios

## 9. Monitoring & Debugging

### Enable Debug Mode

Debug mode is automatically enabled in development. Check console for logs:

```
[Daimo] Payment started: { paymentId: "...", ... }
[Daimo] Payment completed: { txHash: "...", ... }
[Daimo] Registering domain: example.poly
[Daimo] Domain registered successfully: 0x...
```

### Check Payment State

The payment state includes:
```typescript
{
  paymentId: string | null,
  isPaying: boolean,
  isComplete: boolean,
  txHash: string | null,
  error: string | null,
  registrationInProgress: boolean
}
```

### Database Records

Transactions are recorded with:
- Payment transaction (with paymentId)
- Registration transaction (linked to payment)

## 10. Support & Resources

### Documentation
- **Integration Guide**: `/DAIMO_INTEGRATION.md`
- **Daimo Docs**: https://paydocs.daimo.com
- **API Reference**: https://paydocs.daimo.com/sdk

### Examples
- **Demo App**: https://daimo-pay-demo.vercel.app
- **GitHub Examples**: https://github.com/daimo-eth/pay/tree/master/examples

### Get Help
- **Daimo Support**: support@daimo.com
- **Daimo Discord**: https://discord.gg/daimo
- **GitHub Issues**: https://github.com/daimo-eth/pay/issues

## 11. Testing Checklist

Test these scenarios:

- [ ] Payment from Ethereum with ETH
- [ ] Payment from Base with USDC
- [ ] Payment from Arbitrum with USDT
- [ ] Payment from Optimism with ETH
- [ ] Domain registers after successful payment
- [ ] Error displayed if payment fails
- [ ] Error displayed if registration fails after payment
- [ ] Redirect to profile after success
- [ ] Transaction recorded in database
- [ ] Multiple domain registration (if applicable)

## 12. Common Issues

### Issue: DaimoPayButton doesn't render
**Solution**: Ensure wallet is connected and domain is selected

### Issue: Payment completes but registration fails
**Solution**: Check controller contract has REGISTER_ROLE permissions and check USDC balance/approval

### Issue: Modal doesn't open
**Solution**: Check console for errors, ensure DaimoPayProvider is wrapping app

### Issue: Wrong amount charged
**Solution**: Verify price calculation in getPrice() matches expected USDC amount

## Next Steps

1. ✅ Test locally with demo App ID
2. 🔄 Request production App ID from Daimo
3. 🔄 Set up webhook endpoint for robust tracking
4. 🔄 Deploy to production
5. 🔄 Monitor first real transactions

Your Daimo Pay integration is ready to use! 🎉
