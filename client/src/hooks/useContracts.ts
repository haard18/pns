/**
 * Custom hook for direct contract interactions
 * Provides typed contract instances and methods for PNS operations
 * According to new architecture: Frontend calls contracts directly for all operations
 * Updated for USDC payments (December 5, 2025)
 */
import { useAccount, useConfig } from 'wagmi';
import { readContract, waitForTransactionReceipt, writeContract as writeContractClient } from 'wagmi/actions';
import { parseEther } from 'viem';
import { getContractAddresses, PNSControllerABI, PNSPriceOracleABI, PNSResolverABI, PNSRegistryABI } from '../config/contractConfig';
import { namehash, validateDomainName } from '../lib/namehash';

// USDC contract address on Polygon Mainnet
const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as `0x${string}`;

// ERC20 ABI for approve and allowance
const ERC20_ABI = [
    {
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

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

    // Default to Polygon Mainnet (137) if not connected, to allow read-only operations
    // This prevents the "white screen" crash when wallet is disconnected
    const currentChainId = chainId || 137;

    const contracts = getContractAddresses(currentChainId);

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
     * Register a domain directly on-chain using USDC payment
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

            // Get price in USDC (6 decimals)
            const price = await getDomainPrice(name, durationYears);
            const cleanName = name.replace(/\.poly$/i, '');

            console.log('[registerDomain] Price in USDC:', price.toString(), '(', Number(price) / 1e6, 'USDC)');

            // Check USDC balance
            const usdcBalance = await readContract(config, {
                address: USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address],
            }) as bigint;

            if (usdcBalance < price) {
                return { success: false, error: `Insufficient USDC balance. Need ${Number(price) / 1e6} USDC, have ${Number(usdcBalance) / 1e6} USDC` };
            }

            // Check current allowance
            const currentAllowance = await readContract(config, {
                address: USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [address, contracts.controller],
            }) as bigint;

            // Step 1: Approve USDC if needed
            if (currentAllowance < price) {
                console.log('[registerDomain] Approving USDC spend:', price.toString());

                try {
                    const approveTxHash = await writeContractClient(config, {
                        account: address,
                        address: USDC_ADDRESS,
                        abi: ERC20_ABI,
                        functionName: 'approve',
                        args: [contracts.controller, price],
                    });

                    console.log('[registerDomain] Approval tx:', approveTxHash);

                    // Wait for approval transaction
                    await waitForTransactionReceipt(config, { hash: approveTxHash });
                    console.log('[registerDomain] Approval confirmed');
                } catch (approveError: any) {
                    console.error('[registerDomain] Approval failed:', approveError);
                    return { success: false, error: `Approval failed: ${approveError.message}` };
                }
            }

            // Step 2: Register domain (no value - USDC is transferred via transferFrom)
            console.log('[registerDomain] Registering domain:', cleanName);

            try {
                const registerTxHash = await writeContractClient(config, {
                    account: address,
                    address: contracts.controller,
                    abi: PNSControllerABI,
                    functionName: 'registerDomain',
                    args: [cleanName, address as `0x${string}`, BigInt(durationYears)],
                });

                console.log('[registerDomain] Registration tx:', registerTxHash);
                return { success: true, txHash: registerTxHash };
            } catch (registerError: any) {
                console.error('[registerDomain] Registration failed:', registerError);
                return { success: false, error: `Registration failed: ${registerError.message}` };
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    };

    /**
     * Renew a domain using USDC payment
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

            // Get renewal price in USDC (6 decimals)
            const price = await getDomainPrice(name, durationYears);
            const cleanName = name.replace(/\.poly$/i, '');

            console.log('[renewDomain] Price in USDC:', price.toString(), '(', Number(price) / 1e6, 'USDC)');

            // Check USDC balance
            const usdcBalance = await readContract(config, {
                address: USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address],
            }) as bigint;

            if (usdcBalance < price) {
                return { success: false, error: `Insufficient USDC balance. Need ${Number(price) / 1e6} USDC, have ${Number(usdcBalance) / 1e6} USDC` };
            }

            // Check current allowance
            const currentAllowance = await readContract(config, {
                address: USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [address, contracts.controller],
            }) as bigint;

            // Step 1: Approve USDC if needed
            if (currentAllowance < price) {
                console.log('[renewDomain] Approving USDC spend:', price.toString());

                try {
                    const approveTxHash = await writeContractClient(config, {
                        account: address,
                        address: USDC_ADDRESS,
                        abi: ERC20_ABI,
                        functionName: 'approve',
                        args: [contracts.controller, price],
                    });

                    console.log('[renewDomain] Approval tx:', approveTxHash);
                    await waitForTransactionReceipt(config, { hash: approveTxHash });
                    console.log('[renewDomain] Approval confirmed');
                } catch (approveError: any) {
                    console.error('[renewDomain] Approval failed:', approveError);
                    return { success: false, error: `Approval failed: ${approveError.message}` };
                }
            }

            // Step 2: Renew domain (no value - USDC is transferred via transferFrom)
            try {
                const renewTxHash = await writeContractClient(config, {
                    account: address,
                    address: contracts.controller,
                    abi: PNSControllerABI,
                    functionName: 'renewDomain',
                    args: [cleanName, BigInt(durationYears)],
                });

                console.log('[renewDomain] Renewal tx:', renewTxHash);
                return { success: true, txHash: renewTxHash };
            } catch (renewError: any) {
                console.error('[renewDomain] Renewal failed:', renewError);
                return { success: false, error: `Renewal failed: ${renewError.message}` };
            }
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
            if (domainInfo.owner.toLowerCase() !== address.toLowerCase()) {
                return { success: false, error: 'You do not own this domain' };
            }

            const nameHash = getNameHash(name);
            const resolverAddress = contracts.resolver;

            console.log('Setting text record:', {
                nameHash,
                key,
                value,
                resolver: resolverAddress,
                owner: address
            });

            // Call setText on the Resolver contract
            const hash = await writeContractClient(config, {
                address: resolverAddress,
                abi: PNSResolverABI,
                functionName: 'setText',
                args: [nameHash, key, value],
            });

            console.log('Text record tx submitted:', hash);

            // Wait for confirmation
            const receipt = await waitForTransactionReceipt(config, {
                hash,
                confirmations: 1,
            });

            if (receipt.status === 'success') {
                console.log('Text record set successfully');
                return { success: true, txHash: hash };
            } else {
                return { success: false, error: 'Transaction failed' };
            }
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
            if (domainInfo.owner.toLowerCase() !== address.toLowerCase()) {
                return { success: false, error: 'You do not own this domain' };
            }

            const nameHash = getNameHash(name);
            const resolverAddress = contracts.resolver;

            console.log('Setting address record:', {
                nameHash,
                coinType,
                addressValue,
                resolver: resolverAddress,
                owner: address
            });

            // Call setAddr on the Resolver contract
            const hash = await writeContractClient(config, {
                address: resolverAddress,
                abi: PNSResolverABI,
                functionName: 'setAddr',
                args: [nameHash, BigInt(coinType), addressValue as `0x${string}`],
            });

            console.log('Address record tx submitted:', hash);

            // Wait for confirmation
            const receipt = await waitForTransactionReceipt(config, {
                hash,
                confirmations: 1,
            });

            if (receipt.status === 'success') {
                console.log('Address record set successfully');
                return { success: true, txHash: hash };
            } else {
                return { success: false, error: 'Transaction failed' };
            }
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

    /**
     * Transfer domain ownership to a new address
     */
    const transferDomain = async (name: string, newOwner: string): Promise<RegistrationResult> => {
        if (!address) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            // Validate new owner address
            if (!newOwner || !/^0x[a-fA-F0-9]{40}$/.test(newOwner)) {
                return { success: false, error: 'Invalid recipient address' };
            }

            // Check ownership
            const domainInfo = await getDomainInfo(name);
            if (domainInfo.owner.toLowerCase() !== address.toLowerCase()) {
                return { success: false, error: 'You do not own this domain' };
            }

            // Check if domain is expired
            if (domainInfo.available || domainInfo.expiration < Date.now() / 1000) {
                return { success: false, error: 'Domain has expired' };
            }

            // Check if transferring to self
            if (newOwner.toLowerCase() === address.toLowerCase()) {
                return { success: false, error: 'Cannot transfer to yourself' };
            }

            const nameHash = getNameHash(name);

            console.log('[transferDomain] Transferring domain:', name, 'to:', newOwner);
            console.log('[transferDomain] NameHash:', nameHash);
            console.log('[transferDomain] Registry:', contracts.registry);

            const transferTxHash = await writeContractClient(config, {
                address: contracts.registry,
                abi: PNSRegistryABI,
                functionName: 'transferName',
                args: [nameHash, newOwner as `0x${string}`],
            });

            console.log('[transferDomain] Transfer tx:', transferTxHash);

            // Wait for confirmation
            const receipt = await waitForTransactionReceipt(config, {
                hash: transferTxHash,
                confirmations: 1,
            });

            if (receipt.status === 'success') {
                console.log('[transferDomain] Transfer successful');
                return { success: true, txHash: transferTxHash };
            } else {
                return { success: false, error: 'Transaction failed' };
            }
        } catch (error: any) {
            console.error('[transferDomain] Transfer error:', error);
            return { success: false, error: error.message || 'Transfer failed' };
        }
    };

    return {
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
        transferDomain,
    };
}

