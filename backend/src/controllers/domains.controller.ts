import { Request, Response } from 'express';
import { DomainService } from '../services/domain.service';
import logger from '../utils/logger';

export class DomainsController {
  private domainService: DomainService;

  constructor() {
    this.domainService = new DomainService();
  }

  /**
   * GET /domains/:address - Get domains owned by an address
   */
  getDomainsByOwner = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const { page = '1', limit = '50' } = req.query;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address parameter is required'
        });
      }

      // Validate address format (basic check)
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid address format'
        });
      }

      const domains = await this.domainService.getDomainsByOwner(address);

      // Apply pagination
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100 per page
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;

      const paginatedDomains = domains.slice(startIndex, endIndex);

      logger.info('Domains fetched by owner', {
        address,
        total: domains.length,
        page: pageNum
      });

      return res.json({
        success: true,
        data: {
          domains: paginatedDomains,
          total: domains.length,
          page: pageNum,
          limit: limitNum,
          hasMore: endIndex < domains.length
        }
      });
    } catch (error) {
      logger.error('Error fetching domains by owner:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /domains/:nameOrHash/info - Get domain information by name or hash
   */
  getDomainInfo = async (req: Request, res: Response) => {
    try {
      const { nameOrHash } = req.params;

      if (!nameOrHash) {
        return res.status(400).json({
          success: false,
          error: 'Domain name or hash is required'
        });
      }

      let domain;

      // Check if it's a hash (starts with 0x and 66 characters) or name
      if (nameOrHash.startsWith('0x') && nameOrHash.length === 66) {
        domain = await this.domainService.getDomainByNameHash(nameOrHash);
      } else {
        domain = await this.domainService.getDomainByName(nameOrHash);
      }

      if (!domain) {
        return res.status(404).json({
          success: false,
          error: 'Domain not found'
        });
      }

      logger.info('Domain info fetched', { nameOrHash });

      return res.json({
        success: true,
        data: domain
      });
    } catch (error) {
      logger.error('Error fetching domain info:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /domains/search - Search domains by name pattern
   */
  searchDomains = async (req: Request, res: Response) => {
    try {
      const { q, limit = '50' } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query parameter "q" is required'
        });
      }

      if (q.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters long'
        });
      }

      const limitNum = Math.min(parseInt(limit as string) || 50, 100);
      const domains = await this.domainService.searchDomains(q, limitNum);

      return res.json({
        success: true,
        data: {
          domains,
          query: q,
          total: domains.length
        }
      });

      logger.info('Domain search performed', { query: q, results: domains.length });
    } catch (error) {
      logger.error('Error searching domains:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /domains/expiring - Get domains expiring soon
   */
  getExpiringDomains = async (req: Request, res: Response) => {
    try {
      const { days = '30', page = '1', limit = '50' } = req.query;
      const daysNum = parseInt(days as string) || 30;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);

      const expiringDomains = await this.domainService.getExpiringDomains(daysNum);

      // Apply pagination
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedDomains = expiringDomains.slice(startIndex, endIndex);

      return res.json({
        success: true,
        data: {
          domains: paginatedDomains,
          total: expiringDomains.length,
          page: pageNum,
          limit: limitNum,
          hasMore: endIndex < expiringDomains.length,
          daysToExpiry: daysNum
        }
      });

      logger.info('Expiring domains fetched', { days: daysNum, total: expiringDomains.length });
    } catch (error) {
      logger.error('Error fetching expiring domains:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /domains/expired - Get expired domains
   */
  getExpiredDomains = async (req: Request, res: Response) => {
    try {
      const { page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);

      const expiredDomains = await this.domainService.getExpiredDomains();

      // Apply pagination
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedDomains = expiredDomains.slice(startIndex, endIndex);

      return res.json({
        success: true,
        data: {
          domains: paginatedDomains,
          total: expiredDomains.length,
          page: pageNum,
          limit: limitNum,
          hasMore: endIndex < expiredDomains.length
        }
      });

      logger.info('Expired domains fetched', { total: expiredDomains.length });
    } catch (error) {
      logger.error('Error fetching expired domains:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /domains/stats - Get domain statistics
   */
  getStatistics = async (_req: Request, res: Response) => {
    try {
      const stats = await this.domainService.getStatistics();

      return res.json({
        success: true,
        data: stats
      });

      logger.info('Domain statistics fetched', stats);
    } catch (error) {
      logger.error('Error fetching domain statistics:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /domains/all - Get all domains (paginated, admin only)
   */
  getAllDomains = async (req: Request, res: Response) => {
    try {
      const { page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);

      const result = await this.domainService.getAllDomains(pageNum, limitNum);

      return res.json({
        success: true,
        data: result
      });

      logger.info('All domains fetched', {
        page: pageNum,
        limit: limitNum,
        total: result.total
      });
    } catch (error) {
      logger.error('Error fetching all domains:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}

export default DomainsController;