import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, keccak256, toBytes } from 'viem';
import { contractAddresses, PNSMarketplaceABI, PNSDomainNFTABI, USDCABI, USDC_ADDRESS } from '../config/contractConfig';

export interface DomainListing {
  seller: `0x${string}`;
  price: bigint;
  tokenId: bigint;
  listedAt: bigint;
  active: boolean;
}

export const useMarketplace = () => {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Get marketplace address based on chain
  const getMarketplaceAddress = (chainId: number = 137): `0x${string}` => {
    return contractAddresses[chainId]?.marketplace as `0x${string}`;
  };

  // Get NFT address based on chain
  const getNFTAddress = (chainId: number = 137): `0x${string}` => {
    return contractAddresses[chainId]?.nft as `0x${string}`;
  };

  // Check if domain is owned by user
  const checkOwnership = async (domainName: string, userAddress: `0x${string}`, chainId: number = 137) => {
    try {
      const nameHash = keccak256(toBytes(domainName.toLowerCase()));
      const nftAddress = getNFTAddress(chainId);

      // Get token ID from name hash
      const { data: tokenId } = await useReadContract({
        address: nftAddress,
        abi: PNSDomainNFTABI,
        functionName: 'getTokenId',
        args: [nameHash],
      });

      if (!tokenId) return { owned: false, tokenId: 0n };

      // Get owner of token
      const { data: owner } = await useReadContract({
        address: nftAddress,
        abi: PNSDomainNFTABI,
        functionName: 'ownerOf',
        args: [tokenId],
      });

      return {
        owned: owner?.toLowerCase() === userAddress.toLowerCase(),
        tokenId: tokenId as bigint,
      };
    } catch (err) {
      console.error('Error checking ownership:', err);
      return { owned: false, tokenId: 0n };
    }
  };

  // Approve marketplace to transfer NFT
  const approveNFT = async (chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);
    const nftAddress = getNFTAddress(chainId);

    writeContract({
      address: nftAddress,
      abi: PNSDomainNFTABI,
      functionName: 'setApprovalForAll',
      args: [marketplaceAddress, true],
    });
  };

  // Check if marketplace is approved for NFT
  const isMarketplaceApproved = (userAddress: `0x${string}`, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);
    const nftAddress = getNFTAddress(chainId);

    return useReadContract({
      address: nftAddress,
      abi: PNSDomainNFTABI,
      functionName: 'isApprovedForAll',
      args: [userAddress, marketplaceAddress],
    });
  };

  // List domain for sale
  const listDomain = async (tokenId: bigint, priceInUSDC: string, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);
    const priceInWei = parseUnits(priceInUSDC, 6); // USDC has 6 decimals

    writeContract({
      address: marketplaceAddress,
      abi: PNSMarketplaceABI,
      functionName: 'listDomain',
      args: [tokenId, priceInWei],
    });
  };

  // Update listing price
  const updateListing = async (tokenId: bigint, newPriceInUSDC: string, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);
    const priceInWei = parseUnits(newPriceInUSDC, 6);

    writeContract({
      address: marketplaceAddress,
      abi: PNSMarketplaceABI,
      functionName: 'updateListing',
      args: [tokenId, priceInWei],
    });
  };

  // Cancel listing
  const cancelListing = async (tokenId: bigint, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);

    writeContract({
      address: marketplaceAddress,
      abi: PNSMarketplaceABI,
      functionName: 'cancelListing',
      args: [tokenId],
    });
  };

  // Approve USDC for marketplace
  const approveUSDC = async (amount: string, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);
    const amountInWei = parseUnits(amount, 6);

    writeContract({
      address: USDC_ADDRESS,
      abi: USDCABI,
      functionName: 'approve',
      args: [marketplaceAddress, amountInWei],
    });
  };

  // Check USDC allowance
  const getUSDCAllowance = (userAddress: `0x${string}`, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);

    return useReadContract({
      address: USDC_ADDRESS,
      abi: USDCABI,
      functionName: 'allowance',
      args: [userAddress, marketplaceAddress],
    });
  };

  // Buy domain
  const buyDomain = async (tokenId: bigint, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);

    writeContract({
      address: marketplaceAddress,
      abi: PNSMarketplaceABI,
      functionName: 'buyDomain',
      args: [tokenId],
    });
  };

  // Get listing details
  const getListing = (tokenId: bigint, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);

    return useReadContract({
      address: marketplaceAddress,
      abi: PNSMarketplaceABI,
      functionName: 'getListing',
      args: [tokenId],
    });
  };

  // Check if domain is listed
  const isListed = (tokenId: bigint, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);

    return useReadContract({
      address: marketplaceAddress,
      abi: PNSMarketplaceABI,
      functionName: 'isListed',
      args: [tokenId],
    });
  };

  // Get seller's listings
  const getSellerListings = (sellerAddress: `0x${string}`, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);

    return useReadContract({
      address: marketplaceAddress,
      abi: PNSMarketplaceABI,
      functionName: 'getSellerListings',
      args: [sellerAddress],
    });
  };

  // Get marketplace fee
  const getMarketplaceFee = (chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);

    return useReadContract({
      address: marketplaceAddress,
      abi: PNSMarketplaceABI,
      functionName: 'marketplaceFee',
    });
  };

  // Calculate fees for a price
  const calculateFees = (priceInUSDC: string, chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);
    const priceInWei = parseUnits(priceInUSDC, 6);

    return useReadContract({
      address: marketplaceAddress,
      abi: PNSMarketplaceABI,
      functionName: 'calculateFees',
      args: [priceInWei],
    });
  };

  // Get active listings count
  const getActiveListingsCount = (chainId: number = 137) => {
    const marketplaceAddress = getMarketplaceAddress(chainId);

    return useReadContract({
      address: marketplaceAddress,
      abi: PNSMarketplaceABI,
      functionName: 'activeListingsCount',
    });
  };

  // Get user USDC balance
  const getUSDCBalance = (userAddress: `0x${string}`) => {
    return useReadContract({
      address: USDC_ADDRESS,
      abi: USDCABI,
      functionName: 'balanceOf',
      args: [userAddress],
    });
  };

  // Format USDC amount (6 decimals)
  const formatUSDC = (amount: bigint): string => {
    return formatUnits(amount, 6);
  };

  // Parse USDC amount (6 decimals)
  const parseUSDC = (amount: string): bigint => {
    return parseUnits(amount, 6);
  };

  // Get token ID from domain name
  const getTokenIdFromName = (domainName: string, chainId: number = 137) => {
    const nftAddress = getNFTAddress(chainId);
    const cleanName = domainName.replace(/\.poly$/i, '');
    const nameHash = keccak256(toBytes(cleanName.toLowerCase()));

    return useReadContract({
      address: nftAddress,
      abi: PNSDomainNFTABI,
      functionName: 'getTokenId',
      args: [nameHash],
    });
  };

  return {
    // Transaction state
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,

    // NFT Operations
    checkOwnership,
    approveNFT,
    isMarketplaceApproved,

    // Listing Operations
    listDomain,
    updateListing,
    cancelListing,
    getListing,
    isListed,
    getSellerListings,

    // Buying Operations
    approveUSDC,
    getUSDCAllowance,
    buyDomain,
    getUSDCBalance,

    // Marketplace Info
    getMarketplaceFee,
    calculateFees,
    getActiveListingsCount,

    // Utilities
    formatUSDC,
    parseUSDC,
    getTokenIdFromName,
  };
};
