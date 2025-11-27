import { Router } from 'express';
import logger from '../utils/logger';

const router = Router();

// In-memory storage for transactions (in production, use a real database)
const transactions: any[] = [];

/**
 * Record a successful transaction
 */
// @ts-ignore
router.post('/record', async (req, res) => {
    try {
        const { txHash, type, domainName, owner, chainId, timestamp, metadata } = req.body;

        // Validate required fields
        if (!txHash || !type || !domainName || !owner) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: txHash, type, domainName, owner',
            });
        }

        // Create transaction record
        const transaction = {
            txHash,
            type,
            domainName,
            owner,
            chainId: chainId || 31337,
            timestamp: timestamp || Math.floor(Date.now() / 1000),
            metadata: metadata || {},
            recordedAt: new Date().toISOString(),
        };

        // Store transaction
        transactions.push(transaction);

        logger.info(`Transaction recorded: ${txHash} for domain ${domainName}`);

        res.json({
            success: true,
            data: transaction,
            timestamp: Math.floor(Date.now() / 1000),
        });
    } catch (error) {
        logger.error('Error recording transaction:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record transaction',
        });
    }
});

/**
 * Get transactions for a specific domain
 */
router.get('/domain/:domainName', async (req, res) => {
    try {
        const { domainName } = req.params;

        const domainTransactions = transactions.filter(
            tx => tx.domainName.toLowerCase() === domainName.toLowerCase()
        );

        res.json({
            success: true,
            data: domainTransactions,
            timestamp: Math.floor(Date.now() / 1000),
        });
    } catch (error) {
        logger.error('Error fetching domain transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions',
        });
    }
});

/**
 * Get transactions for a specific address
 */
router.get('/address/:address', async (req, res) => {
    try {
        const { address } = req.params;

        const addressTransactions = transactions.filter(
            tx => tx.owner.toLowerCase() === address.toLowerCase()
        );

        res.json({
            success: true,
            data: addressTransactions,
            timestamp: Math.floor(Date.now() / 1000),
        });
    } catch (error) {
        logger.error('Error fetching address transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions',
        });
    }
});

/**
 * Get all transactions (admin only)
 */
// @ts-ignore
router.get('/all', async (req, res) => {
    try {
        res.json({
            success: true,
            data: transactions,
            count: transactions.length,
            timestamp: Math.floor(Date.now() / 1000),
        });
    } catch (error) {
        logger.error('Error fetching all transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions',
        });
    }
});

export default router;
