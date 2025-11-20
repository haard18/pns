import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { RecordService } from '../services/record.service';
import logger from '../utils/logger';
import { ApiResponse, RecordDeleteRequest, RecordWriteRequest } from '../types';

const router = Router();
const recordService = new RecordService();

const upsertSchema = Joi.object({
  name: Joi.string().min(3).required(),
  chain: Joi.string().valid('polygon', 'solana').required(),
  recordType: Joi.string().valid('address', 'text', 'contentHash', 'custom').required(),
  key: Joi.string().required(),
  value: Joi.string().required(),
  coinType: Joi.number().integer().optional(),
  customKeyHash: Joi.string().optional(),
  propagate: Joi.boolean().optional()
});

router.post('/', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { value, error } = upsertSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } satisfies ApiResponse);
    }

    const payload = value as RecordWriteRequest;
    const record = await recordService.upsertRecord(payload);

    const response: ApiResponse = {
      success: true,
      data: record,
      timestamp: Date.now()
    };
    return res.status(200).json(response);
  } catch (err: any) {
    logger.error('Failed to upsert record', { error: err.message });
    const response: ApiResponse = {
      success: false,
      error: err.message || 'Failed to upsert record',
      timestamp: Date.now()
    };
    return res.status(500).json(response);
  }
});

router.delete('/:chain/:name/:recordType/:key', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { chain, name, recordType, key } = req.params;
    const customKeyHash = req.query.customKeyHash as string | undefined;

    if (!['polygon', 'solana'].includes(chain)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chain parameter',
        timestamp: Date.now()
      } satisfies ApiResponse);
    }

    const request: RecordDeleteRequest = {
      chain: chain as 'polygon' | 'solana',
      name,
      recordType: recordType as any,
      key,
      customKeyHash
    };

    await recordService.deleteRecord(request);

    return res.json({
      success: true,
      timestamp: Date.now()
    } satisfies ApiResponse);
  } catch (err: any) {
    logger.error('Failed to delete record', { error: err.message });
    const response: ApiResponse = {
      success: false,
      error: err.message || 'Failed to delete record',
      timestamp: Date.now()
    };
    return res.status(500).json(response);
  }
});

router.get('/:name', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { name } = req.params;
    const records = await recordService.getRecords(name);
    return res.json({
      success: true,
      data: records,
      timestamp: Date.now()
    } satisfies ApiResponse);
  } catch (err: any) {
    logger.error('Failed to fetch records', { error: err.message });
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch records',
      timestamp: Date.now()
    } satisfies ApiResponse);
  }
});

export default router;

