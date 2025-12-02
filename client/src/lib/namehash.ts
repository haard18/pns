/**
 * Namehash utility functions for PNS frontend
 * Provides consistent domain name hashing across the application
 */
import { keccak256, toBytes } from 'viem';

export const BASE_TLD = 'poly';
export const MIN_NAME_LENGTH = 3;
export const MAX_NAME_LENGTH = 63;

/**
 * Calculate namehash for a domain name
 * @param name Domain name (without .poly suffix)
 * @returns Namehash as hex string
 */
export function namehash(name: string): `0x${string}` {
  const normalizedName = normalizeName(name);
  const fullName = normalizedName.endsWith(`.${BASE_TLD}`) 
    ? normalizedName 
    : `${normalizedName}.${BASE_TLD}`;
  
  return keccak256(toBytes(fullName));
}

/**
 * Normalize domain name (lowercase, trim)
 * @param name Raw domain name
 * @returns Normalized name
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Validate domain name according to PNS rules
 * @param name Domain name to validate
 * @returns Validation result
 */
export function validateDomainName(name: string): {
  valid: boolean;
  error?: string;
} {
  const normalizedName = normalizeName(name);
  
  // Remove .poly suffix if present for validation
  const nameWithoutTld = normalizedName.endsWith(`.${BASE_TLD}`)
    ? normalizedName.slice(0, -(BASE_TLD.length + 1))
    : normalizedName;

  // Check length
  if (nameWithoutTld.length < MIN_NAME_LENGTH) {
    return { valid: false, error: `Name must be at least ${MIN_NAME_LENGTH} characters` };
  }
  
  if (nameWithoutTld.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Name must be at most ${MAX_NAME_LENGTH} characters` };
  }

  // Check for valid characters (a-z, 0-9, hyphens)
  const validPattern = /^[a-z0-9-]+$/;
  if (!validPattern.test(nameWithoutTld)) {
    return { valid: false, error: 'Name can only contain letters, numbers, and hyphens' };
  }

  // Cannot start or end with hyphen
  if (nameWithoutTld.startsWith('-') || nameWithoutTld.endsWith('-')) {
    return { valid: false, error: 'Name cannot start or end with a hyphen' };
  }

  // Cannot have consecutive hyphens
  if (nameWithoutTld.includes('--')) {
    return { valid: false, error: 'Name cannot contain consecutive hyphens' };
  }

  return { valid: true };
}

/**
 * Format domain name for display (always shows .poly suffix)
 * @param name Domain name
 * @returns Formatted name
 */
export function formatDomainName(name: string): string {
  const normalizedName = normalizeName(name);
  return normalizedName.endsWith(`.${BASE_TLD}`)
    ? normalizedName
    : `${normalizedName}.${BASE_TLD}`;
}

/**
 * Extract label from full domain name (removes .poly suffix)
 * @param name Full domain name
 * @returns Label without TLD
 */
export function extractLabel(name: string): string {
  const normalizedName = normalizeName(name);
  return normalizedName.endsWith(`.${BASE_TLD}`)
    ? normalizedName.slice(0, -(BASE_TLD.length + 1))
    : normalizedName;
}

/**
 * Check if domain is available based on expiration
 * @param expiration Expiration timestamp (0 if never registered)
 * @returns Whether domain is available for registration
 */
export function isDomainAvailable(expiration: number): boolean {
  if (expiration === 0) return true; // Never registered
  
  const now = Math.floor(Date.now() / 1000);
  const GRACE_PERIOD = 30 * 24 * 60 * 60; // 30 days in seconds
  
  return now > expiration + GRACE_PERIOD;
}

/**
 * Check if domain is expired but in grace period
 * @param expiration Expiration timestamp
 * @returns Whether domain is in grace period
 */
export function isInGracePeriod(expiration: number): boolean {
  if (expiration === 0) return false; // Never registered
  
  const now = Math.floor(Date.now() / 1000);
  const GRACE_PERIOD = 30 * 24 * 60 * 60; // 30 days in seconds
  
  return now > expiration && now <= expiration + GRACE_PERIOD;
}

/**
 * Format expiration timestamp for display
 * @param expiration Expiration timestamp
 * @returns Formatted date string
 */
export function formatExpiration(expiration: number): string {
  if (expiration === 0) return 'Never registered';
  
  const date = new Date(expiration * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate registration duration in seconds
 * @param years Number of years to register
 * @returns Duration in seconds
 */
export function calculateDuration(years: number): number {
  return years * 365 * 24 * 60 * 60; // Convert years to seconds
}

/**
 * Get human-readable error message for registration failures
 * @param error Error from contract call
 * @returns User-friendly error message
 */
export function getRegistrationError(error: any): string {
  const errorMessage = error?.message || error?.toString() || '';
  
  if (errorMessage.includes('Name already registered')) {
    return 'This domain is already registered';
  }
  
  if (errorMessage.includes('Invalid domain name')) {
    return 'Invalid domain name format';
  }
  
  if (errorMessage.includes('insufficient funds')) {
    return 'Insufficient funds for registration';
  }
  
  if (errorMessage.includes('User denied')) {
    return 'Transaction was cancelled';
  }
  
  return 'Registration failed. Please try again.';
}

/**
 * Format wei amount to MATIC with specified decimals
 * @param weiAmount Amount in wei (bigint or string)
 * @param decimals Number of decimal places to show
 * @returns Formatted MATIC string
 */
export function formatMatic(weiAmount: bigint | string, decimals: number = 4): string {
  const wei = typeof weiAmount === 'string' ? BigInt(weiAmount) : weiAmount;
  const ether = Number(wei) / 1e18;
  return ether.toFixed(decimals);
}