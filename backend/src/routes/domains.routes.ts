import { Router } from 'express';
import { DomainsController } from '../controllers/domains.controller';

const router = Router();
const domainsController = new DomainsController();

// Domain routes
router.get('/domains/search', domainsController.searchDomains);
router.get('/domains/expiring', domainsController.getExpiringDomains);
router.get('/domains/expired', domainsController.getExpiredDomains);
router.get('/domains/stats', domainsController.getStatistics);
router.get('/domains/all', domainsController.getAllDomains); // Admin only in production

// Domain info routes (put after static routes to avoid conflicts)
router.get('/domains/info/:nameOrHash', domainsController.getDomainInfo);
router.get('/domains/:nameOrHash/full', domainsController.getDomainWithRecords);
router.get('/domains/:nameOrHash/records', domainsController.getTextRecords);
router.get('/domains/:nameOrHash/addresses', domainsController.getAddressRecords);

// Owner-based domain lookup (most specific last)
router.get('/domains/:address', domainsController.getDomainsByOwner);

export default router;