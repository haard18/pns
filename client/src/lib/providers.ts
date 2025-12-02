/**
 * Blockchain provider configuration and utilities
 */
import { createConfig, http } from 'wagmi';
import { polygon, polygonAmoy, localhost } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// Define custom localhost chain for development
const localhostDev = {
  ...localhost,
  id: 31337,
  name: 'Local Development',
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
};

// WalletConnect Project ID (should be set in environment)
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

/**
 * Wagmi configuration
 */
export const config = createConfig({
  chains: [polygon, polygonAmoy, localhostDev],
  connectors: [
    injected(),
    ...(walletConnectProjectId ? [walletConnect({
      projectId: walletConnectProjectId,
    })] : []),
  ],
  transports: {
    [polygon.id]: http(import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com'),
    [polygonAmoy.id]: http(import.meta.env.VITE_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'),
    [localhostDev.id]: http('http://127.0.0.1:8545'),
  },
});

/**
 * Get RPC URL for a specific chain
 * @param chainId Chain ID
 * @returns RPC URL
 */
export function getRpcUrl(chainId: number): string {
  const rpcUrls: Record<number, string> = {
    137: import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    80002: import.meta.env.VITE_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    31337: 'http://127.0.0.1:8545',
    1337: 'http://127.0.0.1:8545',
  };
  
  return rpcUrls[chainId] || '';
}

/**
 * Get chain configuration
 * @param chainId Chain ID
 * @returns Chain configuration object
 */
export function getChainConfig(chainId: number) {
  const chains = {
    137: polygon,
    80002: polygonAmoy,
    31337: localhostDev,
    1337: localhostDev,
  };
  
  return chains[chainId as keyof typeof chains];
}

/**
 * Check if MetaMask is available
 * @returns Whether MetaMask is available
 */
export function isMetaMaskAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
}

/**
 * Add network to MetaMask
 * @param chainId Chain ID to add
 */
export async function addNetworkToMetaMask(chainId: number) {
  if (!window.ethereum) {
    throw new Error('MetaMask not available');
  }

  const chainParams: Record<number, any> = {
    137: {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorerUrls: ['https://polygonscan.com'],
    },
    80002: {
      chainId: '0x13882',
      chainName: 'Polygon Amoy Testnet',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
      rpcUrls: ['https://rpc-amoy.polygon.technology'],
      blockExplorerUrls: ['https://amoy.polygonscan.com'],
    },
  };

  const params = chainParams[chainId];
  if (!params) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [params],
    });
  } catch (error) {
    console.error('Failed to add network:', error);
    throw error;
  }
}

/**
 * Switch to a specific network in MetaMask
 * @param chainId Chain ID to switch to
 */
export async function switchNetworkInMetaMask(chainId: number) {
  if (!window.ethereum) {
    throw new Error('MetaMask not available');
  }

  const chainIdHex = `0x${chainId.toString(16)}`;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (error: any) {
    // If the chain doesn't exist in MetaMask, add it
    if (error.code === 4902) {
      await addNetworkToMetaMask(chainId);
    } else {
      throw error;
    }
  }
}

/**
 * Format wallet address for display
 * @param address Wallet address
 * @param length Number of characters to show from start and end
 * @returns Formatted address
 */
export function formatAddress(address: string, length = 4): string {
  if (!address) return '';
  if (address.length <= length * 2 + 2) return address;
  
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @returns Promise that resolves when text is copied
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Format MATIC amount for display
 * @param wei Amount in wei
 * @param decimals Number of decimal places
 * @returns Formatted amount
 */
export function formatMatic(wei: bigint, decimals = 4): string {
  const ether = Number(wei) / 1e18;
  return ether.toFixed(decimals);
}

/**
 * Parse MATIC amount to wei
 * @param matic Amount in MATIC
 * @returns Amount in wei
 */
export function parseMaticToWei(matic: string): bigint {
  return BigInt(Math.floor(parseFloat(matic) * 1e18));
}