import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { NFTService } from '../services/nft.service';
import { ApiResponse, NFTWrapRequest, WrapState } from '../types';
import logger from '../utils/logger';

const router = Router();
const nftService = new NFTService();

const wrapSchema = Joi.object({
  name: Joi.string().min(3).required(),
  fromChain: Joi.string().valid('polygon', 'solana').required(),
  targetChain: Joi.string().valid('polygon', 'solana').required(),
  owner: Joi.string().required()
});

router.post('/wrap', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { value, error } = wrapSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } satisfies ApiResponse);
    }

    const payload = value as NFTWrapRequest;
    const result = await nftService.wrapDomain(payload);
    return res.json({
      success: true,
      data: result,
      timestamp: Date.now()
    } satisfies ApiResponse);
  } catch (err: any) {
    logger.error('NFT wrap failed', { error: err.message });
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to wrap NFT',
      timestamp: Date.now()
    } satisfies ApiResponse);
  }
});

router.post('/unwrap', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { value, error } = wrapSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } satisfies ApiResponse);
    }

    const payload = value as NFTWrapRequest;
    const result = await nftService.unwrapDomain(payload);
    return res.json({
      success: true,
      data: result,
      timestamp: Date.now()
    } satisfies ApiResponse);
  } catch (err: any) {
    logger.error('NFT unwrap failed', { error: err.message });
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to unwrap NFT',
      timestamp: Date.now()
    } satisfies ApiResponse);
  }
});

router.get('/metadata/:name', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { name } = req.params;
    const chain = (req.query.chain as WrapState) || 'polygon';
    const metadata = await nftService.getMetadata(name, chain);
    return res.json(metadata);
  } catch (err: any) {
    logger.error('Failed to generate metadata', { error: err.message });
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch metadata',
      timestamp: Date.now()
    } satisfies ApiResponse);
  }
});

export default router;

