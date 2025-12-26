/**
 * Contract addresses and configuration for different networks
 */

export interface ContractAddresses {
  registry: `0x${string}`;
  registrar: `0x${string}`;
  controller: `0x${string}`;
  resolver: `0x${string}`;
  priceOracle: `0x${string}`;
  domainNFT: `0x${string}`;
}

// Contract addresses for different networks
const contractAddresses: Record<number, ContractAddresses> = {
  // Polygon Mainnet v3 USDC (Deployed December 26, 2025)
  137: {
    registry: '0xF55E379eeC0ae4c21A3e5140e5d7b8b538ed3EFf',
    registrar: '0x3cE7cfAB407030b6e754D2654b82DF7207649665',
    controller: '0x272e664A632489b7DA6C6DdD572D21230B8F1432',
    resolver: '0x2F0b0B245Efb7232b2DAB5e4e9C2c387AFB7E4a0',
    priceOracle: '0x9EfCe9EB995399c02486642Cb00Ca57403837f60',
    domainNFT: '0xE481763F6e201f279D46da30F8e0D6912DaDBcc8',
  },
  
  // Polygon Amoy Testnet
  80002: {
    registry: '0x0000000000000000000000000000000000000000', // TODO: Update with deployed addresses
    registrar: '0x0000000000000000000000000000000000000000',
    controller: '0x0000000000000000000000000000000000000000',
    resolver: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    domainNFT: '0x0000000000000000000000000000000000000000',
  },
  
  // Local/Development (Hardhat/Anvil)
  31337: {
    registry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    registrar: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    controller: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    resolver: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    priceOracle: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    domainNFT: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  },
  
  // Localhost (Alternative)
  1337: {
    registry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    registrar: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    controller: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    resolver: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    priceOracle: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    domainNFT: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  },
};

/**
 * Get contract addresses for a specific chain
 * @param chainId Chain ID
 * @returns Contract addresses object
 */
export function getContractAddresses(chainId: number): ContractAddresses {
  const addresses = contractAddresses[chainId];
  
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  
  return addresses;
}

/**
 * Check if a chain is supported
 * @param chainId Chain ID to check
 * @returns Whether the chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in contractAddresses;
}

/**
 * Get list of supported chain IDs
 * @returns Array of supported chain IDs
 */
export function getSupportedChains(): number[] {
  return Object.keys(contractAddresses).map(Number);
}

/**
 * Get chain name for display
 * @param chainId Chain ID
 * @returns Human-readable chain name
 */
export function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    137: 'Polygon Mainnet',
    80002: 'Polygon Amoy Testnet',
    31337: 'Local Development',
    1337: 'Localhost',
  };
  
  return chainNames[chainId] || `Chain ${chainId}`;
}

/**
 * Check if chain is a testnet
 * @param chainId Chain ID
 * @returns Whether the chain is a testnet
 */
export function isTestnet(chainId: number): boolean {
  return chainId === 80002 || chainId === 31337 || chainId === 1337;
}

/**
 * Get block explorer URL for the chain
 * @param chainId Chain ID
 * @returns Block explorer base URL
 */
export function getBlockExplorerUrl(chainId: number): string {
  const explorers: Record<number, string> = {
    137: 'https://polygonscan.com',
    80002: 'https://amoy.polygonscan.com',
    31337: '',
    1337: '',
  };
  
  return explorers[chainId] || '';
}

/**
 * Get transaction URL on block explorer
 * @param chainId Chain ID
 * @param txHash Transaction hash
 * @returns Full URL to transaction on block explorer
 */
export function getTxUrl(chainId: number, txHash: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/tx/${txHash}` : '';
}

/**
 * Get address URL on block explorer
 * @param chainId Chain ID
 * @param address Address
 * @returns Full URL to address on block explorer
 */
export function getAddressUrl(chainId: number, address: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/address/${address}` : '';
}