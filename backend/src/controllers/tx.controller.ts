import { Request, Response } from 'express';
import { DomainService } from '../services/domain.service';
import logger from '../utils/logger';

export class TransactionController {
  private domainService: DomainService;

  constructor() {
    this.domainService = new DomainService();
  }

  /**
   * POST /tx/record - Record a successful transaction
   * This is called by the frontend after successful contract interactions
   */
  recordTransaction = async (req: Request, res: Response) => {
    try {
      const { user, action, domain, txHash, metadata } = req.body;

      // Validate required fields
      if (!user || !action || !txHash) {
        return res.status(400).json({
          success: false,
          error: 'user, action, and txHash are required fields'
        });
      }

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(user)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user address format'
        });
      }

      // Validate tx hash format
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid transaction hash format'
        });
      }

      // Validate action type
      const validActions = ['register', 'renew', 'setTextRecord', 'setAddressRecord', 'transfer'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          error: `Invalid action. Must be one of: ${validActions.join(', ')}`
        });
      }

      const transaction = await this.domainService.recordTransaction({
        user: user.toLowerCase(), // Normalize to lowercase
        action,
        domain,
        txHash: txHash.toLowerCase(), // Normalize to lowercase
        metadata
      });

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction recorded successfully'
      });

      logger.info('Transaction recorded', {
        id: transaction.id,
        user,
        action,
        domain,
        txHash
      });
    } catch (error) {
      logger.error('Error recording transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /tx/:address - Get transaction history for a user
   */
  getUserTransactions = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const { page = '1', limit = '50', action } = req.query;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address parameter is required'
        });
      }

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid address format'
        });
      }

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);

      let result = await this.domainService.getUserTransactions(
        address.toLowerCase(),
        pageNum,
        limitNum
      );

      // Filter by action if specified
      if (action && typeof action === 'string') {
        result.transactions = result.transactions.filter(tx => tx.action === action);
        result.total = result.transactions.length;
      }

      res.json({
        success: true,
        data: result
      });

      logger.info('User transactions fetched', {
        address,
        page: pageNum,
        limit: limitNum,
        action,
        total: result.total
      });
    } catch (error) {
      logger.error('Error fetching user transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /tx/domain/:domain - Get transaction history for a specific domain
   */
  getDomainTransactions = async (req: Request, res: Response) => {
    try {
      const { domain } = req.params;
      const { page = '1', limit = '50' } = req.query;

      if (!domain) {
        return res.status(400).json({
          success: false,
          error: 'Domain parameter is required'
        });
      }

      const transactions = await this.domainService.getDomainTransactions(domain);
      
      // Apply pagination
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedTransactions = transactions.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          transactions: paginatedTransactions,
          total: transactions.length,
          page: pageNum,
          limit: limitNum,
          hasMore: endIndex < transactions.length,
          domain
        }
      });

      logger.info('Domain transactions fetched', {
        domain,
        total: transactions.length,
        page: pageNum
      });
    } catch (error) {
      logger.error('Error fetching domain transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /tx/recent - Get recent transactions (public feed)
   */
  getRecentTransactions = async (req: Request, res: Response) => {
    try {
      const { limit = '20', action } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 20, 100);

      // Get recent transactions from all users
      const result = await this.domainService.getUserTransactions(
        '0x0000000000000000000000000000000000000000', // Dummy address to get all
        1,
        1000 // Get a larger set to filter from
      );

      let transactions = result.transactions;

      // Filter by action if specified
      if (action && typeof action === 'string') {
        transactions = transactions.filter(tx => tx.action === action);
      }

      // Take only the most recent ones and anonymize sensitive data
      const recentTransactions = transactions
        .slice(0, limitNum)
        .map(tx => ({
          id: tx.id,
          action: tx.action,
          domain: tx.domain,
          txHash: tx.txHash,
          timestamp: tx.timestamp,
          user: `${tx.user.slice(0, 6)}...${tx.user.slice(-4)}` // Partially hide address
        }));

      res.json({
        success: true,
        data: {
          transactions: recentTransactions,
          total: recentTransactions.length,
          limit: limitNum
        }
      });

      logger.info('Recent transactions fetched', {
        limit: limitNum,
        action,
        total: recentTransactions.length
      });
    } catch (error) {
      logger.error('Error fetching recent transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /tx/stats - Get transaction statistics
   */
  getTransactionStats = async (req: Request, res: Response) => {
    try {
      const { period = '24h' } = req.query;

      const stats = await this.domainService.getStatistics();
      
      // You can extend this to provide more detailed stats based on period
      const response = {
        ...stats,
        period,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: response
      });

      logger.info('Transaction statistics fetched', { period });
    } catch (error) {
      logger.error('Error fetching transaction statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * DELETE /tx/test-data - Clear all data (testing only)
   */
  clearTestData = async (req: Request, res: Response) => {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'This operation is not allowed in production'
        });
      }

      await this.domainService.clearAll();

      res.json({
        success: true,
        message: 'All test data cleared successfully'
      });

      logger.info('Test data cleared');
    } catch (error) {
      logger.error('Error clearing test data:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}

export default TransactionController;