import { Router } from 'express';
import { TransactionController } from '../controllers/tx.controller';

const router = Router();
const transactionController = new TransactionController();

// Transaction routes
router.post('/tx/record', transactionController.recordTransaction);
router.get('/tx/:address', transactionController.getUserTransactions);
router.get('/tx/domain/:domain', transactionController.getDomainTransactions);
router.get('/tx/recent', transactionController.getRecentTransactions);
router.get('/tx/stats', transactionController.getTransactionStats);

// Testing only
router.delete('/tx/test-data', transactionController.clearTestData);

export default router;