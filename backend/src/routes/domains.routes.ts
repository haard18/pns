import { Router } from 'express';
import { DomainsController } from '../controllers/domains.controller';

const router = Router();
const domainsController = new DomainsController();

// Domain routes
router.get('/domains/:address', domainsController.getDomainsByOwner);
router.get('/domains/info/:nameOrHash', domainsController.getDomainInfo);
router.get('/domains/search', domainsController.searchDomains);
router.get('/domains/expiring', domainsController.getExpiringDomains);
router.get('/domains/expired', domainsController.getExpiredDomains);
router.get('/domains/stats', domainsController.getStatistics);
router.get('/domains/all', domainsController.getAllDomains); // Admin only in production

export default router;