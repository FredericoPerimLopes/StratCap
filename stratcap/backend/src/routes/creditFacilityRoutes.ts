import { Router } from 'express';
import { CreditFacilityController } from '../controllers/creditFacilityController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const creditFacilityController = new CreditFacilityController();

// Apply authentication to all routes
router.use(authenticate as any);

// Credit Facility CRUD Operations
router.post('/', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.createFacility
);

router.get('/fund/:fundId', 
  authorize(['fund_manager', 'credit_admin', 'investor', 'viewer']) as any, 
  creditFacilityController.getFacilitiesByFund
);

router.get('/:id', 
  authorize(['fund_manager', 'credit_admin', 'investor', 'viewer']) as any, 
  creditFacilityController.getFacility
);

router.put('/:id', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.updateFacility
);

router.post('/:id/terminate', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.terminateFacility
);

// Facility Analytics
router.get('/:id/utilization', 
  authorize(['fund_manager', 'credit_admin', 'investor', 'viewer']) as any, 
  creditFacilityController.getFacilityUtilization
);

router.get('/fund/:fundId/metrics', 
  authorize(['fund_manager', 'credit_admin', 'investor', 'viewer']) as any, 
  creditFacilityController.getCreditMetrics
);

router.get('/attention', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.getFacilitiesRequiringAttention
);

// Drawdown Operations
router.post('/drawdowns', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.requestDrawdown
);

router.get('/:facilityId/drawdowns', 
  authorize(['fund_manager', 'credit_admin', 'investor', 'viewer']) as any, 
  creditFacilityController.getDrawdowns
);

router.post('/drawdowns/:id/approve', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.approveDrawdown
);

router.post('/drawdowns/:id/fund', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.fundDrawdown
);

// Paydown Operations
router.post('/paydowns', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.initiatePaydown
);

router.get('/:facilityId/paydowns', 
  authorize(['fund_manager', 'credit_admin', 'investor', 'viewer']) as any, 
  creditFacilityController.getPaydowns
);

router.post('/paydowns/:id/process', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.processPaydown
);

// Borrowing Base Operations
router.post('/borrowing-base', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.createBorrowingBase
);

router.post('/borrowing-base/:id/submit', 
  authorize(['fund_manager', 'credit_admin']) as any, 
  creditFacilityController.submitBorrowingBase
);

router.get('/borrowing-base/:id/summary', 
  authorize(['fund_manager', 'credit_admin', 'investor', 'viewer']) as any, 
  creditFacilityController.getBorrowingBaseSummary
);

// Fee Operations
router.get('/:id/fees/calculate', 
  authorize(['fund_manager', 'credit_admin', 'investor', 'viewer']) as any, 
  creditFacilityController.calculateFees
);

router.get('/:id/fees/accruals', 
  authorize(['fund_manager', 'credit_admin', 'viewer']) as any, 
  creditFacilityController.getDailyAccruals
);

router.get('/:id/fees/schedule', 
  authorize(['fund_manager', 'credit_admin', 'investor', 'viewer']) as any, 
  creditFacilityController.generateFeeSchedule
);

router.get('/:id/fees/effective-rate', 
  authorize(['fund_manager', 'credit_admin', 'investor', 'viewer']) as any, 
  creditFacilityController.calculateEffectiveRate
);

export default router;