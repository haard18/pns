/**
 * Daimo Pay Configuration
 * Configuration for @daimo/pay integration
 * Allows users to pay from any coin on any chain to USDC on Polygon
 */

// Polygon USDC token address
export const POLYGON_USDC = {
  chainId: 137, // Polygon Mainnet
  token: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC on Polygon
  symbol: 'USDC',
  decimals: 6,
} as const;

// Daimo Pay API Configuration
export const DAIMO_API_URL = import.meta.env.VITE_DAIMO_API_URL || 'https://pay-api.daimo.xyz';

// App ID for Daimo Pay (for production, get real one from Daimo team)
// For prototyping, you can use "pay-demo"
export const DAIMO_APP_ID = import.meta.env.VITE_DAIMO_APP_ID || 'pay-demo';

// Daimo Pay Configuration
export const DAIMO_CONFIG = {
  appId: DAIMO_APP_ID,
  apiUrl: DAIMO_API_URL,
  // Enable debug mode in development
  debugMode: import.meta.env.DEV || false,
  // Preferred chains for payment options (Polygon first)
  preferredChains: [137] as number[], // Polygon Mainnet
  // Preferred tokens (USDC on Polygon)
  preferredTokens: [
    {
      chain: 137,
      address: POLYGON_USDC.token as `0x${string}`,
    },
  ] as Array<{ chain: number; address: `0x${string}` }>,
} as const;

// Payment intents supported
export type PaymentIntent = 'Purchase' | 'Register' | 'Deposit' | 'Renew';

// Helper to format USDC amount (from USDC units to display)
export function formatUsdcForDaimo(amountUsdc: string | number): string {
  return typeof amountUsdc === 'string' ? amountUsdc : amountUsdc.toFixed(2);
}

// Helper to get recipient address (your controller contract)
export function getRecipientAddress(chainId: number): `0x${string}` {
  // This will be your PNS Controller contract address that receives USDC
  const addresses: Record<number, `0x${string}`> = {
    137: '0x463ba8Cb8b322b2DE6B498078462Bf9746638927', // Polygon Mainnet Controller
    31337: (import.meta.env.VITE_CONTROLLER_ADDRESS || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9') as `0x${string}`, // Local
  };
  
  return addresses[chainId] || addresses[137];
}
