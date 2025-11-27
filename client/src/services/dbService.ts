/**
 * Database Service for recording successful contract transactions
 * This service sends transaction data to the backend for database storage
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface TransactionRecord {
    txHash: string;
    type: 'register' | 'renew' | 'transfer' | 'update_record';
    domainName: string;
    owner: string;
    chainId: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

/**
 * Record a successful transaction in the database
 */
export async function recordTransaction(transaction: TransactionRecord): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/record`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction),
        });

        if (!response.ok) {
            console.error('Failed to record transaction:', await response.text());
            return false;
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error recording transaction:', error);
        return false;
    }
}

/**
 * Get transaction history for a domain
 */
export async function getDomainTransactions(domainName: string): Promise<TransactionRecord[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/domain/${domainName}`);

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching domain transactions:', error);
        return [];
    }
}

/**
 * Get transaction history for an address
 */
export async function getAddressTransactions(address: string): Promise<TransactionRecord[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/address/${address}`);

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching address transactions:', error);
        return [];
    }
}
