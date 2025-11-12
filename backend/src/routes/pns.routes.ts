import { Router, Request, Response } from 'express';
import { PNSService } from '../services/pns.service';
import {
  RegisterRequest,
  RenewRequest,
  PriceRequest,
  ApiResponse,
  ChainType
} from '../types';
import logger from '../utils/logger';
import Joi from 'joi';

const router = Router();
const pnsService = new PNSService();

// Validation schemas
const registerSchema = Joi.object({
  chain: Joi.string().valid('polygon', 'solana').required(),
  name: Joi.string().min(3).max(63).required(),
  owner: Joi.string().required(),
  duration: Joi.number().integer().min(1).required(),
  resolver: Joi.string().optional()
});

const renewSchema = Joi.object({
  chain: Joi.string().valid('polygon', 'solana').required(),
  name: Joi.string().min(3).max(63).required(),
  duration: Joi.number().integer().min(1).required()
});



// POST /api/register - Register a domain
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message,
        timestamp: Date.now()
      };
      return res.status(400).json(response);
    }

    const request: RegisterRequest = value;
    const domain = await pnsService.registerDomain(request);

    const response: ApiResponse = {
      success: true,
      data: domain,
      timestamp: Date.now()
    };

    logger.info('Domain registered successfully', { domain: domain.name });
    res.status(201).json(response);
  } catch (err: any) {
    logger.error('Registration failed', { error: err.message });
    
    const response: ApiResponse = {
      success: false,
      error: err.message || 'Failed to register domain',
      timestamp: Date.now()
    };
    
    res.status(500).json(response);
  }
});

// POST /api/renew - Renew a domain
router.post('/renew', async (req: Request, res: Response): Promise<any> => {
  try {
    const { error, value } = renewSchema.validate(req.body);
    
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message,
        timestamp: Date.now()
      };
      return res.status(400).json(response);
    }

    const request: RenewRequest = value;
    const domain = await pnsService.renewDomain(request);

    const response: ApiResponse = {
      success: true,
      data: domain,
      timestamp: Date.now()
    };

    logger.info('Domain renewed successfully', { domain: domain.name });
    res.status(200).json(response);
  } catch (err: any) {
    logger.error('Renewal failed', { error: err.message });
    
    const response: ApiResponse = {
      success: false,
      error: err.message || 'Failed to renew domain',
      timestamp: Date.now()
    };
    
    res.status(500).json(response);
  }
});

// GET /api/price - Get domain price
router.get('/price', async (req: Request, res: Response): Promise<any> => {
  try {
    const querySchema = Joi.object({
      chain: Joi.string().valid('polygon', 'solana').required(),
      name: Joi.string().min(3).max(63).required(),
      duration: Joi.number().integer().min(1).optional().default(365 * 24 * 60 * 60)
    });

    const { error, value } = querySchema.validate(req.query);
    
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message,
        timestamp: Date.now()
      };
      return res.status(400).json(response);
    }

    const request: PriceRequest = value;
    const price = await pnsService.getPrice(request);

    const response: ApiResponse = {
      success: true,
      data: price,
      timestamp: Date.now()
    };

    res.status(200).json(response);
  } catch (err: any) {
    logger.error('Price query failed', { error: err.message });
    
    const response: ApiResponse = {
      success: false,
      error: err.message || 'Failed to get price',
      timestamp: Date.now()
    };
    
    res.status(500).json(response);
  }
});

// GET /api/domains/:address - Get domains by owner
router.get('/domains/:address', async (req: Request, res: Response): Promise<any> => {
  try {
    const { address } = req.params;
    const chain = req.query.chain as ChainType | undefined;

    if (chain && !['polygon', 'solana'].includes(chain)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid chain parameter',
        timestamp: Date.now()
      };
      return res.status(400).json(response);
    }

    const domains = await pnsService.getDomainsByOwner(address, chain);

    const response: ApiResponse = {
      success: true,
      data: domains,
      timestamp: Date.now()
    };

    res.status(200).json(response);
  } catch (err: any) {
    logger.error('Failed to fetch domains', { error: err.message });
    
    const response: ApiResponse = {
      success: false,
      error: err.message || 'Failed to fetch domains',
      timestamp: Date.now()
    };
    
    res.status(500).json(response);
  }
});

// GET /api/domain/:name - Get specific domain
router.get('/domain/:name', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name } = req.params;
    const chain = req.query.chain as ChainType;

    if (!chain || !['polygon', 'solana'].includes(chain)) {
      const response: ApiResponse = {
        success: false,
        error: 'Chain parameter is required (polygon or solana)',
        timestamp: Date.now()
      };
      return res.status(400).json(response);
    }

    const domain = await pnsService.getDomain(name, chain);

    if (!domain) {
      const response: ApiResponse = {
        success: false,
        error: 'Domain not found',
        timestamp: Date.now()
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: domain,
      timestamp: Date.now()
    };

    res.status(200).json(response);
  } catch (err: any) {
    logger.error('Failed to fetch domain', { error: err.message });
    
    const response: ApiResponse = {
      success: false,
      error: err.message || 'Failed to fetch domain',
      timestamp: Date.now()
    };
    
    res.status(500).json(response);
  }
});

// GET /api/available/:name - Check availability
router.get('/available/:name', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name } = req.params;
    const chain = req.query.chain as ChainType;

    if (chain && !['polygon', 'solana'].includes(chain)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid chain parameter',
        timestamp: Date.now()
      };
      return res.status(400).json(response);
    }

    let available;
    if (chain) {
      available = await pnsService.isAvailable(name, chain);
    } else {
      available = await pnsService.checkAvailabilityBothChains(name);
    }

    const response: ApiResponse = {
      success: true,
      data: { name, available },
      timestamp: Date.now()
    };

    res.status(200).json(response);
  } catch (err: any) {
    logger.error('Availability check failed', { error: err.message });
    
    const response: ApiResponse = {
      success: false,
      error: err.message || 'Failed to check availability',
      timestamp: Date.now()
    };
    
    res.status(500).json(response);
  }
});

// GET /api/health - Health check
router.get('/health', (_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime()
    },
    timestamp: Date.now()
  };
  
  res.status(200).json(response);
});

export default router;
