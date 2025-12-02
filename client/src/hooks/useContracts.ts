/**
 * Custom hook for direct contract interactions
 * Provides typed contract instances and methods for PNS operations
 * According to new architecture: Frontend calls contracts directly for all operations
 */
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { parseEther, encodeFunctionData } from 'viem';
import { getContractAddresses, PNSControllerABI, PNSPriceOracleABI, PNSResolverABI, PNSRegistryABI } from '../config/contractConfig';
import { namehash, validateDomainName } from '../lib/namehash';

export interface DomainInfo {
  name: string;
  nameHash: `0x${string}`;
  owner: `0x${string}`;
  expiration: number;
  resolver: `0x${string}`;
  available: boolean;
}

export interface RegistrationResult {
  success: boolean;
  txHash?: `0x${string}`;
  error?: string;
}

export function useContracts() {
    const { address, chainId } = useAccount();
    const config = useConfig();
    
    if (!chainId) {
        throw new Error('No chain connected');
    }
    
    const contracts = getContractAddresses(chainId);

    // Write contract hook
    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    /**
     * Helper function to create namehash
     */
    const getNameHash = (name: string): `0x${string}` => {
        // Remove .poly suffix if present
        const cleanName = name.replace(/\.poly$/i, '');
        return namehash(cleanName + '.poly') as `0x${string}`;
    };

    /**
     * Helper function to check if domain is available
     */
    const isDomainAvailable = (expiration: number): boolean => {
        return expiration === 0 || Date.now() / 1000 > expiration;
    };

    /**
     * Get domain information directly from registry
     */
    const getDomainInfo = async (name: string): Promise<DomainInfo> => {
        const nameHash = getNameHash(name);
        
        try {
            // Read from registry contract
            const record = await readContract(config, {
                address: contracts.registry,
                abi: PNSRegistryABI,
                functionName: 'records',
                args: [nameHash],
            });
            
            const [owner, resolver, expiration] = record as [string, string, bigint];
            
            return {
                name,
                nameHash,
                owner: owner as `0x${string}`,
                resolver: resolver as `0x${string}`,
                expiration: Number(expiration),
                available: isDomainAvailable(Number(expiration)),
            };
        } catch (error) {
            console.error('Error fetching domain info:', error);
            // Return default available domain info if read fails
            return {
                name,
                nameHash,
                owner: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                resolver: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                expiration: 0,
                available: true,
            };
        }
    };

    /**
     * Check domain availability
     */
    const checkAvailability = async (name: string): Promise<boolean> => {
        try {
            const cleanName = name.replace(/\.poly$/i, '');
            const result = await readContract(config, {
                address: contracts.controller,
                abi: PNSControllerABI,
                functionName: 'isDomainAvailable',
                args: [cleanName],
            });
            return result as boolean ?? false;
        } catch (error) {
            console.error('Error checking availability:', error);
            return false;
        }
    };

    /**
     * Get domain price from oracle
     */
    const getDomainPrice = async (name: string, durationYears: number): Promise<bigint> => {
        try {
            const nameHash = getNameHash(name);
            const cleanName = name.replace(/\.poly$/i, '');
            
            // Contract expects number of years, not seconds
            const price = await readContract(config, {
                address: contracts.priceOracle,
                abi: PNSPriceOracleABI,
                functionName: 'getPrice',
                args: [nameHash, cleanName, BigInt(durationYears)],
            });
            
            return price as bigint;
        } catch (error) {
            console.error('Error fetching price, using fallback:', error);
            // Fallback price: 0.5 MATIC per year for 5+ char domains
            const fallbackPrice = parseEther('0.5');
            return fallbackPrice * BigInt(durationYears);
        }
    };

    /**
     * Register a domain directly on-chain
     */
    const registerDomain = async (name: string, durationYears: number, _resolverAddress?: string): Promise<RegistrationResult> => {
        if (!address) {
            return { success: false, error: 'Wallet not connected' };
        }

        // Validate domain name
        const validation = validateDomainName(name);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        try {
            // Check availability first
            const available = await checkAvailability(name);
            if (!available) {
                return { success: false, error: 'Domain is not available' };
            }

            // Get price
            const price = await getDomainPrice(name, durationYears);
            const cleanName = name.replace(/\.poly$/i, '');

            // Register via controller with fallback handling
            try {
                writeContract({
                    address: contracts.controller,
                    abi: PNSControllerABI,
                    functionName: 'registerDomain',
                    args: [cleanName, address, BigInt(durationYears)],
                    value: price,
                });

                return { success: true, txHash: hash };
            } catch (writeError) {
                console.warn('writeContract failed, trying fallback:', writeError);
                
                // Fallback: use window.ethereum directly
                if (typeof window !== 'undefined' && (window as any).ethereum) {
                    try {
                        const data = encodeFunctionData({ 
                            abi: PNSControllerABI, 
                            functionName: 'registerDomain', 
                            args: [cleanName, address as `0x${string}`, BigInt(durationYears)] 
                        });
                        
                        const valueHex = '0x' + price.toString(16);
                        const txHash = await (window as any).ethereum.request({
                            method: 'eth_sendTransaction',
                            params: [{
                                to: contracts.controller,
                                from: address,
                                data,
                                value: valueHex,
                            }],
                        });
                        
                        return { success: true, txHash };
                    } catch (fallbackError) {
                        console.error('Fallback transaction failed:', fallbackError);
                        return { success: false, error: 'Transaction failed' };
                    }
                } else {
                    return { success: false, error: 'No wallet provider available' };
                }
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    };

    /**
     * Renew a domain
     */
    const renewDomain = async (name: string, durationYears: number): Promise<RegistrationResult> => {
        if (!address) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            // Check if domain exists and user owns it
            const domainInfo = await getDomainInfo(name);
            if (domainInfo.owner !== address) {
                return { success: false, error: 'You do not own this domain' };
            }

            // Get renewal price
            const price = await getDomainPrice(name, durationYears);
            const cleanName = name.replace(/\.poly$/i, '');

            // Renew via controller
            writeContract({
                address: contracts.controller,
                abi: PNSControllerABI,
                functionName: 'renewDomain',
                args: [cleanName, BigInt(durationYears)],
                value: price,
            });

            return { success: true, txHash: hash };
        } catch (error: any) {
            console.error('Renewal error:', error);
            return { success: false, error: error.message || 'Renewal failed' };
        }
    };

    /**
     * Set text record for a domain
     */
    const setTextRecord = async (name: string, key: string, value: string): Promise<RegistrationResult> => {
        if (!address) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            // Check ownership
            const domainInfo = await getDomainInfo(name);
            if (domainInfo.owner !== address) {
                return { success: false, error: 'You do not own this domain' };
            }

            const nameHash = getNameHash(name);

            // Set text record via resolver
            writeContract({
                address: domainInfo.resolver,
                abi: PNSResolverABI,
                functionName: 'setText',
                args: [nameHash, key, value],
            });

            return { success: true, txHash: hash };
        } catch (error: any) {
            console.error('Set text record error:', error);
            return { success: false, error: error.message || 'Failed to set text record' };
        }
    };

    /**
     * Set address record for a domain
     */
    const setAddressRecord = async (name: string, coinType: number, addressValue: string): Promise<RegistrationResult> => {
        if (!address) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            // Check ownership
            const domainInfo = await getDomainInfo(name);
            if (domainInfo.owner !== address) {
                return { success: false, error: 'You do not own this domain' };
            }

            const nameHash = getNameHash(name);

            // Set address record via resolver
            writeContract({
                address: domainInfo.resolver,
                abi: PNSResolverABI,
                functionName: 'setAddr',
                args: [nameHash, BigInt(coinType), addressValue as `0x${string}`],
            });

            return { success: true, txHash: hash };
        } catch (error: any) {
            console.error('Set address record error:', error);
            return { success: false, error: error.message || 'Failed to set address record' };
        }
    };

    /**
     * Get text record for a domain
     */
    const getTextRecord = async (name: string, key: string): Promise<string> => {
        try {
            const domainInfo = await getDomainInfo(name);
            if (!domainInfo.resolver || domainInfo.resolver === '0x0000000000000000000000000000000000000000') {
                return '';
            }

            const nameHash = getNameHash(name);
            
            const result = await readContract(config, {
                address: domainInfo.resolver,
                abi: PNSResolverABI,
                functionName: 'getText',
                args: [nameHash, key],
            });

            return result as string;
        } catch (error) {
            console.error('Error fetching text record:', error);
            return '';
        }
    };

    /**
     * Get address record for a domain
     */
    const getAddressRecord = async (name: string, coinType: number = 60): Promise<string> => {
        try {
            const domainInfo = await getDomainInfo(name);
            if (!domainInfo.resolver || domainInfo.resolver === '0x0000000000000000000000000000000000000000') {
                return '';
            }

            const nameHash = getNameHash(name);
            
            const result = await readContract(config, {
                address: domainInfo.resolver,
                abi: PNSResolverABI,
                functionName: 'getAddr',
                args: [nameHash, BigInt(coinType)],
            });

            return result as string;
        } catch (error) {
            console.error('Error fetching address record:', error);
            return '';
        }
    };

    /**
     * Get domains owned by an address
     */
    const getOwnedDomains = async (ownerAddress: string): Promise<DomainInfo[]> => {
        // This will be implemented by reading from the backend API
        // since we need indexed data for efficient querying
        try {
            const response = await fetch(`/api/domains/${ownerAddress}`);
            if (!response.ok) {
                throw new Error('Failed to fetch owned domains');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching owned domains:', error);
            return [];
        }
    };

    return {
        // State
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        writeError,
        
        // Contract addresses
        contracts,
        
        // Helper functions
        getNameHash,
        
        // Read functions
        getDomainInfo,
        checkAvailability,
        getDomainPrice,
        getTextRecord,
        getAddressRecord,
        getOwnedDomains,
        
        // Write functions
        registerDomain,
        renewDomain,
        setTextRecord,
        setAddressRecord,
    };
}

