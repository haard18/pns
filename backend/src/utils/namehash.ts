import { keccak256, toUtf8Bytes, ZeroHash } from 'ethers';

const POLY_TLD = '.poly';

export function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

export function labelhash(label: string): string {
  return keccak256(toUtf8Bytes(label));
}

export function namehash(name: string): string {
  if (!name || name === '.') {
    return ZeroHash;
  }

  const normalized = normalizeName(name);
  const labels = normalized.split('.');
  
  let node = ZeroHash;
  for (let i = labels.length - 1; i >= 0; i--) {
    const labelHash = labelhash(labels[i]);
    node = keccak256(new Uint8Array([...hexToBytes(node), ...hexToBytes(labelHash)]));
  }
  
  return node;
}

export function getFullDomainName(name: string): string {
  const normalized = normalizeName(name);
  if (normalized.endsWith(POLY_TLD)) {
    return normalized;
  }
  return `${normalized}${POLY_TLD}`;
}

export function validateDomainName(name: string): { valid: boolean; error?: string } {
  const normalized = normalizeName(name);
  
  if (normalized.length < 3) {
    return { valid: false, error: 'Domain name too short (minimum 3 characters)' };
  }
  
  if (normalized.length > 63) {
    return { valid: false, error: 'Domain name too long (maximum 63 characters)' };
  }
  
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return { valid: false, error: 'Domain name can only contain lowercase letters, numbers, and hyphens' };
  }
  
  if (normalized.startsWith('-') || normalized.endsWith('-')) {
    return { valid: false, error: 'Domain name cannot start or end with a hyphen' };
  }
  
  return { valid: true };
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatPrice(price: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = price / divisor;
  const fraction = price % divisor;
  
  if (fraction === BigInt(0)) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  return `${whole}.${fractionStr.replace(/0+$/, '')}`;
}
