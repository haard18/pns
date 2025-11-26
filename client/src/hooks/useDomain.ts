/**
 * Custom hook for domain operations
 */
import { useState, useCallback } from 'react'
import * as pnsApi from '../services/pnsApi'
import type { DomainRecord, PriceResponse } from '../services/pnsApi'

export interface UseDomainState {
  domain: DomainRecord | null
  price: PriceResponse | null
  isAvailable: boolean | null
  isLoading: boolean
  error: string | null
}

export interface UseDomainActions {
  checkAvailability: (name: string) => Promise<boolean>
  getPrice: (name: string, duration?: number) => Promise<PriceResponse | null>
  getDomainDetails: (name: string) => Promise<DomainRecord | null>
  register: (name: string, owner: string, duration: number, resolver?: string) => Promise<DomainRecord | null>
  renew: (name: string, duration: number) => Promise<DomainRecord | null>
  getUserDomains: (address: string) => Promise<DomainRecord[]>
  reset: () => void
}

export function useDomain(): UseDomainState & UseDomainActions {
  const [domain, setDomain] = useState<DomainRecord | null>(null)
  const [price, setPrice] = useState<PriceResponse | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setDomain(null)
    setPrice(null)
    setIsAvailable(null)
    setError(null)
  }, [])

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
      
      const available = await pnsApi.checkDomainAvailability(name)
      setIsAvailable(available)
      return available
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check availability'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getPrice = useCallback(async (name: string, duration = 31536000): Promise<PriceResponse | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const priceData = await pnsApi.getDomainPrice(name, duration)
      setPrice(priceData)
      return priceData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get price'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getDomainDetails = useCallback(async (name: string): Promise<DomainRecord | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const domainData = await pnsApi.getDomainDetails(name)
      setDomain(domainData)
      return domainData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get domain details'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(
    async (name: string, owner: string, duration: number, resolver?: string): Promise<DomainRecord | null> => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await pnsApi.registerDomain(name, owner, duration, resolver)
        setDomain(result)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to register domain'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const renew = useCallback(async (name: string, duration: number): Promise<DomainRecord | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await pnsApi.renewDomain(name, duration)
      setDomain(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to renew domain'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

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
    isLoading,
    error,
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
