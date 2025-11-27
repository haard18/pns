/**
 * Custom hook for direct contract interactions
 * Provides typed contract instances and methods for PNS operations
 */
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { parseEther, keccak256, toBytes, formatEther, encodeFunctionData } from 'viem';
import {
    getContractAddresses,
    PNSControllerABI,
    PNSPriceOracleABI,
    PNSResolverABI,
    PNSRegistrarABI,
} from '../config/contractConfig';

export function useContracts() {
    const { address, chainId } = useAccount();
    const config = useConfig();
    const contracts = getContractAddresses(chainId || 31337);

    // Write contract hook
    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    /**
     * Calculate namehash for a domain
     */
    const getNameHash = (name: string): `0x${string}` => {
        const fullName = name.endsWith('.poly') ? name : `${name}.poly`;
        return keccak256(toBytes(fullName));
    };

    /**
     * Register a domain directly on-chain
     */
    const registerDomain = async (name: string, owner: string, durationYears: number) => {
        console.log('[useContracts] registerDomain called - wallet address, chainId:', address, chainId);
        if (!address) throw new Error('Wallet not connected');

        // Query price from the price oracle so we send exact amount
        const nameHash = getNameHash(name);
        try {
            const priceWei = await readContract(config, {
                address: contracts.priceOracle,
                abi: PNSPriceOracleABI,
                functionName: 'getPrice',
                args: [nameHash, name, BigInt(durationYears)],
            }) as bigint;
            console.log('[useContracts] registerDomain - priceWei:', priceWei.toString(), 'name:', name, 'years:', durationYears);
            const writeParams = {
                address: contracts.controller,
                abi: PNSControllerABI,
                functionName: 'registerDomain',
                args: [name, owner as `0x${string}`, BigInt(durationYears)],
                value: priceWei,
            } as const;
            console.log('[useContracts] registerDomain - writeParams:', writeParams);
            try {
                const writeResult: unknown = await writeContract(writeParams);
                // If writeContract returns a tx hash or object, return it so callers can record it
                if (writeResult) {
                    return writeResult;
                }
            } catch (err) {
                console.warn('[useContracts] writeContract error (will fallback to eth_sendTransaction):', err);
            }

            // Fallback: encode function data and use window.ethereum to send tx (ensures MetaMask prompt)
            try {
                const data = encodeFunctionData({ abi: PNSControllerABI as any, functionName: 'registerDomain', args: [name, owner as `0x${string}`, BigInt(durationYears)] });
                const valueHex = '0x' + priceWei.toString(16);
                const anyWin = window as any;
                if (anyWin?.ethereum && anyWin.ethereum.request) {
                    console.log('[useContracts] fallback eth_sendTransaction params', { to: contracts.controller, from: address, data, value: valueHex });
                    const txHash = await anyWin.ethereum.request({
                        method: 'eth_sendTransaction',
                        params: [{ to: contracts.controller, from: address, data, value: valueHex }],
                    });
                    console.log('[useContracts] fallback eth_sendTransaction txHash:', txHash);
                    return txHash;
                } else {
                    throw new Error('No window.ethereum provider available for fallback send');
                }
            } catch (err) {
                console.error('[useContracts] fallback send failed:', err);
                throw err;
            }
        } catch (err) {
            console.error('Failed to fetch price from oracle, falling back to fixed price:', err);
            const fallback = parseEther('0.1');
            const totalPrice = fallback * BigInt(durationYears);
            console.log('[useContracts] registerDomain - fallback totalPrice:', totalPrice.toString(), 'name:', name, 'years:', durationYears);
            const fallbackParams = {
                address: contracts.controller,
                abi: PNSControllerABI,
                functionName: 'registerDomain',
                args: [name, owner as `0x${string}`, BigInt(durationYears)],
                value: totalPrice,
            } as const;
            console.log('[useContracts] registerDomain - fallbackParams:', fallbackParams);
            return writeContract(fallbackParams);
        }
    };

    /**
     * Check if domain is available - DIRECT CONTRACT CALL
     */
    const checkAvailability = async (name: string): Promise<boolean> => {
        try {
            // Remove .poly suffix if present - contract expects just the name
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
     * Get domain price - DIRECT CONTRACT CALL
     */
    const getDomainPrice = async (name: string, durationYears: number): Promise<string> => {
        try {
            const nameHash = getNameHash(name);
            const result = await readContract(config, {
                address: contracts.priceOracle,
                abi: PNSPriceOracleABI,
                functionName: 'getPrice',
                args: [nameHash, name, BigInt(durationYears)],
            });

            const priceWei = result as bigint;
            return formatEther(priceWei);
        } catch (error) {
            console.error('Error getting price:', error);
            return '0';
        }
    };

    /**
     * Get domain owner - DIRECT CONTRACT CALL
     */
    const getDomainOwner = async (name: string): Promise<string | null> => {
        try {
            const result = await readContract(config, {
                address: contracts.controller,
                abi: PNSControllerABI,
                functionName: 'getDomainOwner',
                args: [name],
            });
            return result as string;
        } catch (error) {
            console.error('Error getting owner:', error);
            return null;
        }
    };

    /**
     * Get domain expiration - DIRECT CONTRACT CALL
     */
    const getDomainExpiration = async (name: string): Promise<number | null> => {
        try {
            const result = await readContract(config, {
                address: contracts.controller,
                abi: PNSControllerABI,
                functionName: 'getDomainExpiration',
                args: [name],
            });
            return Number(result);
        } catch (error) {
            console.error('Error getting expiration:', error);
            return null;
        }
    };

    /**
     * Get domain resolver - DIRECT CONTRACT CALL
     */
    const getDomainResolver = async (name: string): Promise<string | null> => {
        try {
            const result = await readContract(config, {
                address: contracts.controller,
                abi: PNSControllerABI,
                functionName: 'getDomainResolver',
                args: [name],
            });
            return result as string;
        } catch (error) {
            console.error('Error getting resolver:', error);
            return null;
        }
    };

    /**
     * Set text record for a domain
     */
    const setTextRecord = async (name: string, key: string, value: string) => {
        if (!address) throw new Error('Wallet not connected');

        const nameHash = getNameHash(name);

        return writeContract({
            address: contracts.resolver,
            abi: PNSResolverABI,
            functionName: 'setText',
            args: [nameHash, key, value],
        });
    };

    /**
     * Get text record for a domain - DIRECT CONTRACT CALL
     */
    const getTextRecord = async (name: string, key: string): Promise<string> => {
        try {
            const nameHash = getNameHash(name);
            const result = await readContract(config, {
                address: contracts.resolver,
                abi: PNSResolverABI,
                functionName: 'getText',
                args: [nameHash, key],
            });
            return result as string;
        } catch (error) {
            console.error('Error getting text record:', error);
            return '';
        }
    };

    /**
     * Set address record for a domain
     */
    const setAddressRecord = async (name: string, coinType: number, addr: string) => {
        if (!address) throw new Error('Wallet not connected');

        const nameHash = getNameHash(name);

        return writeContract({
            address: contracts.resolver,
            abi: PNSResolverABI,
            functionName: 'setAddr',
            args: [nameHash, BigInt(coinType), addr as `0x${string}`],
        });
    };

    /**
     * Renew a domain
     */
    const renewDomain = async (name: string, durationYears: number) => {
        if (!address) throw new Error('Wallet not connected');

        // Query price from the price oracle so we send exact amount for renewal
        const nameHash = getNameHash(name);
        try {
            const priceWei = await readContract(config, {
                address: contracts.priceOracle,
                abi: PNSPriceOracleABI,
                functionName: 'getPrice',
                args: [nameHash, name, BigInt(durationYears)],
            }) as bigint;
            console.log('[useContracts] renewDomain - priceWei:', priceWei.toString(), 'name:', name, 'years:', durationYears);
            const writeParams = {
                address: contracts.registrar,
                abi: PNSRegistrarABI,
                functionName: 'renew',
                args: [name, BigInt(durationYears)],
                value: priceWei,
            } as const;
            console.log('[useContracts] renewDomain - writeParams:', writeParams);
            try {
                const writeResult: unknown = await writeContract(writeParams);
                if (writeResult) return writeResult;
            } catch (err) {
                console.warn('[useContracts] renew writeContract error (will fallback to eth_sendTransaction):', err);
            }

            // Fallback for renew
            try {
                const data = encodeFunctionData({ abi: PNSRegistrarABI as any, functionName: 'renew', args: [name, BigInt(durationYears)] });
                const valueHex = '0x' + priceWei.toString(16);
                const anyWin = window as any;
                if (anyWin?.ethereum && anyWin.ethereum.request) {
                    console.log('[useContracts] fallback eth_sendTransaction params (renew)', { to: contracts.registrar, from: address, data, value: valueHex });
                    const txHash = await anyWin.ethereum.request({
                        method: 'eth_sendTransaction',
                        params: [{ to: contracts.registrar, from: address, data, value: valueHex }],
                    });
                    console.log('[useContracts] fallback eth_sendTransaction txHash (renew):', txHash);
                    return txHash;
                } else {
                    throw new Error('No window.ethereum provider available for fallback renew');
                }
            } catch (err) {
                console.error('[useContracts] fallback renew send failed:', err);
                throw err;
            }
        } catch (err) {
            console.error('Failed to fetch price from oracle for renewal, falling back to fixed price:', err);
            const fallback = parseEther('0.1');
            const totalPrice = fallback * BigInt(durationYears);
            console.log('[useContracts] renewDomain - fallback totalPrice:', totalPrice.toString(), 'name:', name, 'years:', durationYears);
            const fallbackParams = {
                address: contracts.registrar,
                abi: PNSRegistrarABI,
                functionName: 'renew',
                args: [name, BigInt(durationYears)],
                value: totalPrice,
            } as const;
            console.log('[useContracts] renewDomain - fallbackParams:', fallbackParams);
            return writeContract(fallbackParams);
        }
    };

    return {
        // Contract addresses
        contracts,

        // Write operations
        registerDomain,
        setTextRecord,
        setAddressRecord,
        renewDomain,

        // Read operations - DIRECT FROM CONTRACTS
        checkAvailability,
        getDomainPrice,
        getDomainOwner,
        getDomainExpiration,
        getDomainResolver,
        getTextRecord,

        // Transaction state
        hash,
        isPending,
        isConfirming,
        isConfirmed,
        writeError,

        // Utilities
        getNameHash,
    };
}
