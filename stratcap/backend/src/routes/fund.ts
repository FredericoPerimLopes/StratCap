import { Router } from 'express';
import fundController from '../controllers/FundController';
import { protect } from '../middleware/auth';
import { validate, validateParams, validateQuery, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

// Fund CRUD operations
router.post('/', validate(schemas.createFund), fundController.createFund);
router.get('/', validateQuery(schemas.pagination), fundController.getFunds);
router.get('/:id', validateParams(schemas.id), fundController.getFundById);
router.patch('/:id', validateParams(schemas.id), fundController.updateFund);
router.delete('/:id', validateParams(schemas.id), fundController.deleteFund);

// Fund-specific operations
router.get('/:id/metrics', validateParams(schemas.id), fundController.getFundMetrics);
router.patch('/:id/status', validateParams(schemas.id), fundController.updateFundStatus);

export default router;