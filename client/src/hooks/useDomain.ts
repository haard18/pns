/**
 * Custom hook for domain operations
 * Uses DIRECT CONTRACT CALLS according to new architecture
 * Backend is only used for recording successful transactions
 */
import { useState, useCallback } from 'react';
import { useContracts } from './useContracts';
import type { DomainInfo, RegistrationResult } from './useContracts';
import { useAccount } from 'wagmi';
import { validateDomainName, formatUsdc } from '../lib/namehash';

export interface PriceData {
  price: string;
  priceWei: bigint;
  currency: 'USDC';
}

export interface UseDomainState {
  domain: DomainInfo | null;
  price: bigint | null;
  priceFormatted: string | null;
  isAvailable: boolean | null;
  isLoading: boolean;
  error: string | null;
  isRegistering: boolean;
  isRenewing: boolean;
  registrationResult: RegistrationResult | null;
}

export interface UseDomainActions {
  checkAvailability: (name: string) => Promise<boolean | undefined>;
  getPrice: (name: string, durationYears?: number) => Promise<PriceData | null>;
  getDomainDetails: (name: string) => Promise<void>;
  register: (name: string, owner: string, durationYears: number, resolver?: string) => Promise<RegistrationResult | undefined>;
  renew: (name: string, durationYears: number) => Promise<void>;
  setTextRecord: (name: string, key: string, value: string) => Promise<void>;
  setAddressRecord: (name: string, coinType: number, address: string) => Promise<void>;
  getTextRecord: (name: string, key: string) => Promise<string>;
  getAddressRecord: (name: string, coinType?: number) => Promise<string>;
  getUserDomains: (userAddress: string) => Promise<DomainInfo[]>;
  reset: () => void;
}

export function useDomain(): UseDomainState & UseDomainActions {
  const [domain, setDomain] = useState<DomainInfo | null>(null);
  const [price, setPrice] = useState<bigint | null>(null);
  const [priceFormatted, setPriceFormatted] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);

  const { address } = useAccount();
  const contracts = useContracts();

  const reset = useCallback(() => {
    setDomain(null);
    setPrice(null);
    setPriceFormatted(null);
    setIsAvailable(null);
    setError(null);
    setRegistrationResult(null);
    setIsRegistering(false);
    setIsRenewing(false);
  }, []);

  /**
   * Check if a domain is available for registration
   */
  const checkAvailability = useCallback(async (name: string): Promise<boolean | undefined> => {
    const validation = validateDomainName(name);
    if (!validation.valid) {
      setError(validation.error || 'Invalid domain name');
      setIsAvailable(false);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const available = await contracts.checkAvailability(name);
      setIsAvailable(available);
      return available;
    } catch (error: any) {
      console.error('Error checking availability:', error);
      setError('Failed to check domain availability');
      setIsAvailable(null);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [contracts]);

  /**
   * Get domain price from price oracle
   */
  const getPrice = useCallback(async (name: string, durationYears: number = 1): Promise<PriceData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const priceWei = await contracts.getDomainPrice(name, durationYears);
      const priceFormatted = formatUsdc(priceWei);
      setPrice(priceWei);
      setPriceFormatted(priceFormatted);
      return {
        price: priceFormatted,
        priceWei,
        currency: 'USDC'
      };
    } catch (error: any) {
      console.error('Error getting price:', error);
      setError('Failed to get domain price');
      setPrice(null);
      setPriceFormatted(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [contracts]);

  /**
   * Get detailed information about a domain
   */
  const getDomainDetails = useCallback(async (name: string) => {
    const validation = validateDomainName(name);
    if (!validation.valid) {
      setError(validation.error || 'Invalid domain name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const domainInfo = await contracts.getDomainInfo(name);
      setDomain(domainInfo);
      setIsAvailable(domainInfo.available);
    } catch (error: any) {
      console.error('Error getting domain details:', error);
      setError('Failed to get domain details');
      setDomain(null);
    } finally {
      setIsLoading(false);
    }
  }, [contracts]);

  /**
   * Register a new domain
   */
  const register = useCallback(async (name: string, _owner: string, durationYears: number, resolver?: string): Promise<RegistrationResult | undefined> => {
    if (!address) {
      setError('Please connect your wallet');
      return undefined;
    }

    setIsRegistering(true);
    setError(null);
    setRegistrationResult(null);

    try {
      const result = await contracts.registerDomain(name, durationYears, resolver);
      setRegistrationResult(result);

      if (result.success && result.txHash) {
        // Record transaction in backend after successful registration
        try {
          await fetch('/api/tx/record', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user: address,
              action: 'register',
              domain: name,
              txHash: result.txHash,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (backendError) {
          console.warn('Failed to record transaction in backend:', backendError);
          // Don't fail the registration for backend errors
        }

        // Refresh domain details
        await getDomainDetails(name);
        return {
          success: true,
          txHash: result.txHash,
          name,
          registeredAt: new Date().toISOString()
        } as RegistrationResult & { name: string; registeredAt: string };
      } else {
        setError(result.error || 'Registration failed');
        return result;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setIsRegistering(false);
    }
  }, [address, contracts, getDomainDetails]);

  /**
   * Renew an existing domain
   */
  const renew = useCallback(async (name: string, durationYears: number) => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    setIsRenewing(true);
    setError(null);

    try {
      const result = await contracts.renewDomain(name, durationYears);

      if (result.success && result.txHash) {
        // Record transaction in backend
        try {
          await fetch('/api/tx/record', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user: address,
              action: 'renew',
              domain: name,
              txHash: result.txHash,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (backendError) {
          console.warn('Failed to record transaction in backend:', backendError);
        }

        // Refresh domain details
        await getDomainDetails(name);
      } else {
        setError(result.error || 'Renewal failed');
      }
    } catch (error: any) {
      console.error('Renewal error:', error);
      setError(error.message || 'Renewal failed');
    } finally {
      setIsRenewing(false);
    }
  }, [address, contracts, getDomainDetails]);

  /**
   * Set text record for a domain
   */
  const setTextRecord = useCallback(async (name: string, key: string, value: string) => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await contracts.setTextRecord(name, key, value);

      if (result.success && result.txHash) {
        // Record transaction in backend
        try {
          await fetch('/api/tx/record', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user: address,
              action: 'setTextRecord',
              domain: name,
              txHash: result.txHash,
              metadata: { key, value },
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (backendError) {
          console.warn('Failed to record transaction in backend:', backendError);
        }
      } else {
        setError(result.error || 'Failed to set text record');
      }
    } catch (error: any) {
      console.error('Set text record error:', error);
      setError(error.message || 'Failed to set text record');
    } finally {
      setIsLoading(false);
    }
  }, [address, contracts]);

  /**
   * Set address record for a domain
   */
  const setAddressRecord = useCallback(async (name: string, coinType: number, addressValue: string) => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await contracts.setAddressRecord(name, coinType, addressValue);

      if (result.success && result.txHash) {
        // Record transaction in backend
        try {
          await fetch('/api/tx/record', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user: address,
              action: 'setAddressRecord',
              domain: name,
              txHash: result.txHash,
              metadata: { coinType, address: addressValue },
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (backendError) {
          console.warn('Failed to record transaction in backend:', backendError);
        }
      } else {
        setError(result.error || 'Failed to set address record');
      }
    } catch (error: any) {
      console.error('Set address record error:', error);
      setError(error.message || 'Failed to set address record');
    } finally {
      setIsLoading(false);
    }
  }, [address, contracts]);

  /**
   * Get text record for a domain
   */
  const getTextRecord = useCallback(async (name: string, key: string): Promise<string> => {
    try {
      return await contracts.getTextRecord(name, key);
    } catch (error: any) {
      console.error('Get text record error:', error);
      return '';
    }
  }, [contracts]);

  /**
   * Get address record for a domain
   */
  const getAddressRecord = useCallback(async (name: string, coinType: number = 60): Promise<string> => {
    try {
      return await contracts.getAddressRecord(name, coinType);
    } catch (error: any) {
      console.error('Get address record error:', error);
      return '';
    }
  }, [contracts]);

  /**
   * Get all domains owned by a user
   */
  const getUserDomains = useCallback(async (userAddress: string): Promise<DomainInfo[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use backend API to get domains for user (requires event indexing)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/domains/${userAddress}`);

      if (response.ok) {
        const result = await response.json();
        // Backend returns { success: true, data: { domains: [...], total, page, limit, hasMore } }
        if (result.success && result.data && result.data.domains) {
          return result.data.domains;
        }
        console.warn('getUserDomains: Unexpected response format', result);
        return [];
      }

      console.warn('getUserDomains: Backend returned non-ok response', response.status);
      return [];
    } catch (error: any) {
      console.error('Get user domains error:', error);
      setError('Failed to get user domains');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    domain,
    price,
    priceFormatted,
    isAvailable,
    isLoading,
    error,
    isRegistering,
    isRenewing,
    registrationResult,

    // Actions
    checkAvailability,
    getPrice,
    getDomainDetails,
    register,
    renew,
    setTextRecord,
    setAddressRecord,
    getTextRecord,
    getAddressRecord,
    getUserDomains,
    reset,
  };
}

