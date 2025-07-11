import { Router } from 'express';
import investorController from '../controllers/InvestorController';
import { protect } from '../middleware/auth';
import { validate, validateParams, validateQuery, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

// Investor CRUD operations
router.post('/', validate(schemas.createInvestor), investorController.createInvestor);
router.get('/', validateQuery(schemas.pagination), investorController.getInvestors);
router.get('/:id', validateParams(schemas.id), investorController.getInvestorById);
router.patch('/:id', validateParams(schemas.id), investorController.updateInvestor);
router.delete('/:id', validateParams(schemas.id), investorController.deleteInvestor);

// Investor-specific operations
router.get('/:id/portfolio', validateParams(schemas.id), investorController.getInvestorPortfolio);
router.patch('/:id/kyc-status', validateParams(schemas.id), investorController.updateKYCStatus);
router.patch('/:id/aml-status', validateParams(schemas.id), investorController.updateAMLStatus);
router.get('/:id/due-diligence', validateParams(schemas.id), investorController.getDueDiligenceStatus);

export default router;