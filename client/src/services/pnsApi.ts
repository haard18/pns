/**
 * PNS API Service
 * Handles all communication with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface DomainRecord {
  name: string;
  chain: 'polygon';
  owner: string;
  expires: number;
  resolver?: string;
  txHash: string;
  registeredAt: number;
}

export interface PriceResponse {
  price: string;
  currency: 'ETH' | 'MATIC';
  chain: 'polygon';
  priceWei?: string;
}

export interface RegisterRequest {
  chain: 'polygon';
  name: string;
  owner: string;
  duration: number;
  resolver?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Check if a domain is available
 */
export async function checkDomainAvailability(name: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/available/${name}?chain=polygon`);
    const data: ApiResponse<{ available: boolean }> = await response.json();
    
    if (data.success) {
      return data.data?.available ?? false;
    }
    return false;
  } catch (error) {
    console.error('Error checking domain availability:', error);
    throw error;
  }
}

/**
 * Get domain price
 */
export async function getDomainPrice(
  name: string,
  duration: number = 31536000 // 1 year in seconds
): Promise<PriceResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/price?chain=polygon&name=${name}&duration=${duration}`
    );
    const data: ApiResponse<PriceResponse> = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error || 'Failed to get price');
  } catch (error) {
    console.error('Error getting domain price:', error);
    throw error;
  }
}

/**
 * Register a domain
 */
export async function registerDomain(
  name: string,
  owner: string,
  duration: number,
  resolver?: string
): Promise<DomainRecord> {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chain: 'polygon',
        name,
        owner,
        duration,
        resolver,
      } as RegisterRequest),
    });
    
    const data: ApiResponse<DomainRecord> = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error || 'Failed to register domain');
  } catch (error) {
    console.error('Error registering domain:', error);
    throw error;
  }
}

/**
 * Renew a domain
 */
export async function renewDomain(
  name: string,
  duration: number
): Promise<DomainRecord> {
  try {
    const response = await fetch(`${API_BASE_URL}/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chain: 'polygon',
        name,
        duration,
      }),
    });
    
    const data: ApiResponse<DomainRecord> = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error || 'Failed to renew domain');
  } catch (error) {
    console.error('Error renewing domain:', error);
    throw error;
  }
}

/**
 * Get domains owned by an address
 */
export async function getUserDomains(address: string): Promise<DomainRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/domains/${address}?chain=polygon`);
    const data: ApiResponse<DomainRecord[]> = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user domains:', error);
    return [];
  }
}

/**
 * Get specific domain details
 */
export async function getDomainDetails(name: string): Promise<DomainRecord | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/domain/${name}?chain=polygon`);
    const data: ApiResponse<DomainRecord> = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching domain details:', error);
    return null;
  }
}

/**
 * Health check
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data: ApiResponse = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error checking API health:', error);
    return false;
  }
}

/**
 * Format domain name with extension
 */
export function formatDomainName(name: string): string {
  const cleaned = name.toLowerCase().trim();
  if (cleaned.endsWith('.poly')) {
    return cleaned;
  }
  return `${cleaned}.poly`;
}

/**
 * Validate domain name
 */
export function validateDomainName(name: string): { valid: boolean; error?: string } {
  const cleaned = name.toLowerCase().trim();
  
  if (cleaned.length < 3) {
    return { valid: false, error: 'Domain must be at least 3 characters' };
  }
  
  if (cleaned.length > 63) {
    return { valid: false, error: 'Domain must be at most 63 characters' };
  }
  
  // Check for valid characters (alphanumeric and hyphens only)
  const domainPart = cleaned.replace('.poly', '');
  if (!/^[a-z0-9-]+$/.test(domainPart)) {
    return { valid: false, error: 'Domain can only contain letters, numbers, and hyphens' };
  }
  
  if (domainPart.startsWith('-') || domainPart.endsWith('-')) {
    return { valid: false, error: 'Domain cannot start or end with a hyphen' };
  }
  
  return { valid: true };
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string, chars = 6): string {
  if (!address) return '';
  const start = address.substring(0, chars);
  const end = address.substring(address.length - chars);
  return `${start}...${end}`;
}

/**
 * Format big number with decimals
 */
export function formatNumber(value: string | number, decimals = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toFixed(decimals);
}
