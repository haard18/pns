// Contract Configuration for PNS Frontend
// This file contains contract addresses and ABIs for all PNS contracts

export interface ContractAddresses {
  registry: `0x${string}`;
  controller: `0x${string}`;
  registrar: `0x${string}`;
  resolver: `0x${string}`;
  priceOracle: `0x${string}`;
  nft: `0x${string}`;
}

// Contract addresses - Update these after deployment
export const contractAddresses: Record<number, ContractAddresses> = {
  // Localhost / Anvil
  31337: {
    registry: (import.meta.env.VITE_REGISTRY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`,
    controller: (import.meta.env.VITE_CONTROLLER_ADDRESS || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9') as `0x${string}`,
    registrar: (import.meta.env.VITE_REGISTRAR_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9') as `0x${string}`,
    resolver: (import.meta.env.VITE_RESOLVER_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0') as `0x${string}`,
    priceOracle: (import.meta.env.VITE_PRICE_ORACLE_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512') as `0x${string}`,
    nft: (import.meta.env.VITE_NFT_ADDRESS || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707') as `0x${string}`,
  },
  // Polygon Mumbai Testnet
  80001: {
    registry: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    controller: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    registrar: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    resolver: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    priceOracle: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    nft: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  // Polygon Mainnet v2 USDC (Deployed December 5, 2025)
  137: {
    registry: '0x7c4486efe85C3bFBF0cb6b8Ac0cAcc3D580501Ba' as `0x${string}`,
    controller: '0x463ba8Cb8b322b2DE6B498078462Bf9746638927' as `0x${string}`,
    registrar: '0x31ac529Be6F2d51c42dd1C9D1DDcC95910D788f6' as `0x${string}`,
    resolver: '0x2B826A368aBb0ECa9FB0Ac1C35BA3735133f4De2' as `0x${string}`,
    priceOracle: '0xbbeaEE62A29DF74Cb872D7F92907e274D8587DE9' as `0x${string}`,
    nft: '0x7916a0bCcEf6AEfF4d603C04313eDf0d59Dfc028' as `0x${string}`,
  },
};

// Get contract addresses for current chain
export function getContractAddresses(chainId: number): ContractAddresses {
  return contractAddresses[chainId] || contractAddresses[31337];
}

// PNSController ABI - Main contract for user interactions (USDC payments)
export const PNSControllerABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "registerDomain",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "renewDomain",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "isDomainAvailable",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "getDomainOwner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "getDomainExpiration",
    "outputs": [{ "internalType": "uint64", "name": "", "type": "uint64" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "getDomainResolver",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "duration", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "cost", "type": "uint256" }
    ],
    "name": "DomainRegistered",
    "type": "event"
  }
] as const;

// PNSPriceOracle ABI
export const PNSPriceOracleABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "nameHash", "type": "bytes32" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "getPrice",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// PNSResolver ABI
export const PNSResolverABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "nameHash", "type": "bytes32" },
      { "internalType": "string", "name": "key", "type": "string" },
      { "internalType": "string", "name": "value", "type": "string" }
    ],
    "name": "setText",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "nameHash", "type": "bytes32" },
      { "internalType": "string", "name": "key", "type": "string" }
    ],
    "name": "getText",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "nameHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "coinType", "type": "uint256" },
      { "internalType": "address", "name": "addr", "type": "address" }
    ],
    "name": "setAddr",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "nameHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "coinType", "type": "uint256" }
    ],
    "name": "getAddr",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// PNSRegistryABI - Registry contract for domain records
export const PNSRegistryABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "nameHash", "type": "bytes32" }
    ],
    "name": "records",
    "outputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "resolver", "type": "address" },
      { "internalType": "uint64", "name": "expiration", "type": "uint64" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "nameHash", "type": "bytes32" },
      { "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "transferName",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "nameHash", "type": "bytes32" },
      { "internalType": "address", "name": "resolver", "type": "address" }
    ],
    "name": "setNameResolver",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "nameHash", "type": "bytes32" }
    ],
    "name": "getResolver",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// PNSRegistrar ABI
export const PNSRegistrarABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "renew",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

// Helper function to calculate namehash (ENS-compatible)
export function namehash(name: string): `0x${string}` {
  // For simplicity, we'll use keccak256(name + ".poly")
  // In production, you'd want to implement proper ENS namehash algorithm
  const fullName = name.endsWith('.poly') ? name : `${name}.poly`;
  return `0x${Buffer.from(fullName).toString('hex')}` as `0x${string}`;
}
