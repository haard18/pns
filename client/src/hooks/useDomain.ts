/**
 * Custom hook for domain operations
 * Uses DIRECT CONTRACT CALLS for reads, API only for transaction recording
 */
import { useState, useCallback } from 'react'
import * as pnsApi from '../services/pnsApi'
import type { DomainRecord, PriceResponse } from '../services/pnsApi'
import { useContracts } from './useContracts'
import { useWallet } from '../contexts/WalletContext'

export interface UseDomainState {
  domain: DomainRecord | null
  price: PriceResponse | null
  isAvailable: boolean | null
  isLoading: boolean
  error: string | null
  txHash: string | null
  isConfirming: boolean
  isConfirmed: boolean
}

export interface UseDomainActions {
  checkAvailability: (name: string) => Promise<boolean>
  getPrice: (name: string, durationYears?: number) => Promise<PriceResponse | null>
  getDomainDetails: (name: string) => Promise<DomainRecord | null>
  register: (name: string, owner: string, durationYears: number) => Promise<DomainRecord | null>
  renew: (name: string, durationYears: number) => Promise<DomainRecord | null>
  getUserDomains: (address: string) => Promise<DomainRecord[]>
  reset: () => void
}

export function useDomain(): UseDomainState & UseDomainActions {
  const [domain, setDomain] = useState<DomainRecord | null>(null)
  const [price, setPrice] = useState<PriceResponse | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const { address, chainId } = useWallet()
  const contracts = useContracts()

  const reset = useCallback(() => {
    setDomain(null)
    setPrice(null)
    setIsAvailable(null)
    setError(null)
    setTxHash(null)
  }, [])

  // DIRECT CONTRACT CALL - No API
  const checkAvailability = useCallback(async (name: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate domain name
      const validation = pnsApi.validateDomainName(name)
      if (!validation.valid) {
        setError(validation.error || 'Invalid domain name')
        return false
      }

      // Call contract directly
      const available = await contracts.checkAvailability(name)
      setIsAvailable(available)
      return available
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check availability'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [contracts])

  // DIRECT CONTRACT CALL - No API
  const getPrice = useCallback(async (name: string, durationYears = 1): Promise<PriceResponse | null> => {
    try {
      setIsLoading(true)
      setError(null)

      // Call contract directly
      const priceMatic = await contracts.getDomainPrice(name, durationYears)

      const priceData: PriceResponse = {
        price: priceMatic,
        currency: 'MATIC',
        chain: 'polygon',
        priceWei: (BigInt(parseFloat(priceMatic) * 1e18)).toString()
      }

      setPrice(priceData)
      return priceData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get price'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [contracts])

  // DIRECT CONTRACT CALL - No API
  const getDomainDetails = useCallback(async (name: string): Promise<DomainRecord | null> => {
    try {
      setIsLoading(true)
      setError(null)

      // Call contracts directly
      const owner = await contracts.getDomainOwner(name)
      const expiration = await contracts.getDomainExpiration(name)
      const resolver = await contracts.getDomainResolver(name)

      if (!owner) {
        return null
      }

      const domainData: DomainRecord = {
        name: name.endsWith('.poly') ? name : `${name}.poly`,
        chain: 'polygon',
        owner,
        expires: expiration || 0,
        resolver: resolver || undefined,
        txHash: '',
        registeredAt: 0
      }

      setDomain(domainData)
      return domainData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get domain details'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [contracts])

  const register = useCallback(
    async (name: string, owner: string, durationYears: number): Promise<DomainRecord | null> => {
      try {
        setIsLoading(true)
        setError(null)

        if (!address) {
          throw new Error('Wallet not connected')
        }

        // Register via direct contract call
        const txResult = await contracts.registerDomain(name, owner, durationYears)

        // Determine txHash from the returned value, contracts.hash, or txResult.hash
        let txHashFromCall: string | undefined = undefined
        if (typeof txResult === 'string') {
          txHashFromCall = txResult
        } else if (txResult && (txResult as any).hash) {
          txHashFromCall = (txResult as any).hash
        } else if (contracts.hash) {
          txHashFromCall = contracts.hash
        }

        if (txHashFromCall) {
          setTxHash(txHashFromCall)
        }

        // Create a domain record from the transaction
        const result: DomainRecord = {
          name: `${name}.poly`,
          chain: 'polygon',
          owner,
          expires: Math.floor(Date.now() / 1000) + (durationYears * 365 * 24 * 60 * 60),
          txHash: txHashFromCall || '',
          registeredAt: Math.floor(Date.now() / 1000),
        }

        setDomain(result)

        // Record in backend database after successful transaction
        if ((contracts.isConfirmed && (contracts.hash || txHashFromCall)) || txHashFromCall) {
          const { recordTransaction } = await import('../services/dbService')
          await recordTransaction({
            txHash: txHashFromCall || contracts.hash || '',
            type: 'register',
            domainName: result.name,
            owner,
            chainId: chainId || 31337,
            timestamp: result.registeredAt,
            metadata: {
              duration: durationYears,
            }
          })
        }

        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to register domain'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [address, contracts, chainId]
  )

  const renew = useCallback(async (name: string, durationYears: number): Promise<DomainRecord | null> => {
    try {
      setIsLoading(true)
      setError(null)

      await contracts.renewDomain(name, durationYears)

      // Get updated domain details
      const updated = await getDomainDetails(name)
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to renew domain'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [contracts, getDomainDetails])

  // This still uses API as it requires indexing
  const getUserDomains = useCallback(async (address: string): Promise<DomainRecord[]> => {
    try {
      setIsLoading(true)
      setError(null)
      return await pnsApi.getUserDomains(address)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch domains'
      setError(message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    // State
    domain,
    price,
    isAvailable,
    isLoading: isLoading || contracts.isPending,
    error: error || (contracts.writeError?.message || null),
    txHash,
    isConfirming: contracts.isConfirming,
    isConfirmed: contracts.isConfirmed,
    // Actions
    checkAvailability,
    getPrice,
    getDomainDetails,
    register,
    renew,
    getUserDomains,
    reset,
  }
}
