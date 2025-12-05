import { Request, Response } from 'express';
import database from '../services/database.service';
import logger from '../utils/logger';

export class DomainsController {
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

      // Query from PostgreSQL database
      const domains = await database.getDomainsByOwner(address);

      // Apply pagination
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);
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
        domain = await database.getDomainByNameHash(nameOrHash);
      } else {
        domain = await database.getDomainByName(nameOrHash);
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
      const domains = await database.searchDomains(q, limitNum);

      logger.info('Domain search performed', { query: q, results: domains.length });

      return res.json({
        success: true,
        data: {
          domains,
          query: q,
          total: domains.length
        }
      });
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

      const expiringDomains = await database.getExpiringDomains(daysNum, pageNum, limitNum);

      return res.json({
        success: true,
        data: {
          domains: expiringDomains,
          page: pageNum,
          limit: limitNum,
          daysToExpiry: daysNum
        }
      });
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

      const expiredDomains = await database.getExpiredDomains(pageNum, limitNum);

      return res.json({
        success: true,
        data: {
          domains: expiredDomains,
          page: pageNum,
          limit: limitNum
        }
      });
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
      const stats = await database.getStatistics();

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching domain statistics:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /domains/all - Get all domains (paginated)
   */
  getAllDomains = async (req: Request, res: Response) => {
    try {
      const { page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);

      const result = await database.getAllDomains(pageNum, limitNum);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching all domains:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /domains/:nameOrHash/full - Get domain with text/address records
   */
  getDomainWithRecords = async (req: Request, res: Response) => {
    try {
      const { nameOrHash } = req.params;

      if (!nameOrHash) {
        return res.status(400).json({
          success: false,
          error: 'Domain name or hash is required'
        });
      }

      let nameHash: string;

      // Determine nameHash
      if (nameOrHash.startsWith('0x') && nameOrHash.length === 66) {
        nameHash = nameOrHash;
      } else {
        // Look up domain by name to get nameHash
        const domain = await database.getDomainByName(nameOrHash);
        if (!domain) {
          return res.status(404).json({
            success: false,
            error: 'Domain not found'
          });
        }
        nameHash = domain.name_hash;
      }

      const result = await database.getDomainWithRecords(nameHash);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Domain not found'
        });
      }

      logger.info('Domain with records fetched', { nameOrHash });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching domain with records:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /domains/:nameOrHash/records - Get text records for a domain
   */
  getTextRecords = async (req: Request, res: Response) => {
    try {
      const { nameOrHash } = req.params;

      if (!nameOrHash) {
        return res.status(400).json({
          success: false,
          error: 'Domain name or hash is required'
        });
      }

      let nameHash: string;

      // Determine nameHash
      if (nameOrHash.startsWith('0x') && nameOrHash.length === 66) {
        nameHash = nameOrHash;
      } else {
        const domain = await database.getDomainByName(nameOrHash);
        if (!domain) {
          return res.status(404).json({
            success: false,
            error: 'Domain not found'
          });
        }
        nameHash = domain.name_hash;
      }

      const textRecords = await database.getTextRecords(nameHash);

      return res.json({
        success: true,
        data: {
          nameHash,
          textRecords
        }
      });
    } catch (error) {
      logger.error('Error fetching text records:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * GET /domains/:nameOrHash/addresses - Get address records for a domain
   */
  getAddressRecords = async (req: Request, res: Response) => {
    try {
      const { nameOrHash } = req.params;

      if (!nameOrHash) {
        return res.status(400).json({
          success: false,
          error: 'Domain name or hash is required'
        });
      }

      let nameHash: string;

      // Determine nameHash
      if (nameOrHash.startsWith('0x') && nameOrHash.length === 66) {
        nameHash = nameOrHash;
      } else {
        const domain = await database.getDomainByName(nameOrHash);
        if (!domain) {
          return res.status(404).json({
            success: false,
            error: 'Domain not found'
          });
        }
        nameHash = domain.name_hash;
      }

      const addressRecords = await database.getAddressRecords(nameHash);

      return res.json({
        success: true,
        data: {
          nameHash,
          addressRecords
        }
      });
    } catch (error) {
      logger.error('Error fetching address records:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}

export default DomainsController;
