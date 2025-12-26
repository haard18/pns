// Contract Configuration for PNS Frontend
// This file contains contract addresses and ABIs for all PNS contracts

export interface ContractAddresses {
  registry: `0x${string}`;
  controller: `0x${string}`;
  registrar: `0x${string}`;
  resolver: `0x${string}`;
  priceOracle: `0x${string}`;
  nft: `0x${string}`;
  marketplace: `0x${string}`;
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
    marketplace: (import.meta.env.VITE_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  },
  // Polygon Mumbai Testnet
  80001: {
    registry: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    controller: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    registrar: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    resolver: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    priceOracle: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    nft: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    marketplace: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  // Polygon Mainnet v3 USDC (Deployed December 26, 2025)
  137: {
    registry: '0xF55E379eeC0ae4c21A3e5140e5d7b8b538ed3EFf' as `0x${string}`,
    controller: '0x272e664A632489b7DA6C6DdD572D21230B8F1432' as `0x${string}`,
    registrar: '0x3cE7cfAB407030b6e754D2654b82DF7207649665' as `0x${string}`,
    resolver: '0x2F0b0B245Efb7232b2DAB5e4e9C2c387AFB7E4a0' as `0x${string}`,
    priceOracle: '0x9EfCe9EB995399c02486642Cb00Ca57403837f60' as `0x${string}`,
    nft: '0xE481763F6e201f279D46da30F8e0D6912DaDBcc8' as `0x${string}`,
    marketplace: '0x2392b05affaedf1f184b41768cc439e51e5bf388' as `0x${string}`,
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

// PNSMarketplace ABI - For buying and selling domains
export const PNSMarketplaceABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "listDomain",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "newPrice", "type": "uint256" }
    ],
    "name": "updateListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "cancelListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "buyDomain",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "getListing",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "seller", "type": "address" },
          { "internalType": "uint256", "name": "price", "type": "uint256" },
          { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
          { "internalType": "uint256", "name": "listedAt", "type": "uint256" },
          { "internalType": "bool", "name": "active", "type": "bool" }
        ],
        "internalType": "struct PNSMarketplace.Listing",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "seller", "type": "address" }
    ],
    "name": "getSellerListings",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "isListed",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "calculateFees",
    "outputs": [
      { "internalType": "uint256", "name": "fee", "type": "uint256" },
      { "internalType": "uint256", "name": "sellerAmount", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "marketplaceFee",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minListingPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "activeListingsCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "seller", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "DomainListed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "seller", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256" }
    ],
    "name": "DomainSold",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "seller", "type": "address" }
    ],
    "name": "ListingCancelled",
    "type": "event"
  }
] as const;

// PNSDomainNFT ABI - For NFT operations
export const PNSDomainNFTABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "ownerOf",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "nameHash", "type": "bytes32" }
    ],
    "name": "getTokenId",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "operator", "type": "address" },
      { "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "operator", "type": "address" }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "tokenURI",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// USDC ABI - For token approvals and transfers
export const USDCABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      { "internalType": "uint8", "name": "", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// USDC Token Address (Polygon Mainnet)
export const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as `0x${string}`;

// PNSRegistrar ABI
export const PNSRegistrarABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "renew",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// PNSRegistrar ABI (NFT wrapping)
export const PNSRegistrarNFTABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "wrapToNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
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
