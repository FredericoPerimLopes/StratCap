import { Router } from 'express';
import { CreditFacilityController } from '../controllers/creditFacilityController';
import { protect, authorize } from '../middleware/auth';

const router = Router();
const creditFacilityController = new CreditFacilityController();

// Apply authentication to all routes
router.use(protect);

// Credit Facility CRUD Operations
router.post('/', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.createFacility
);

router.get('/fund/:fundId', 
  authorize('fund_manager', 'credit_admin', 'investor', 'viewer'), 
  creditFacilityController.getFacilitiesByFund
);

router.get('/:id', 
  authorize('fund_manager', 'credit_admin', 'investor', 'viewer'), 
  creditFacilityController.getFacility
);

router.put('/:id', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.updateFacility
);

router.post('/:id/terminate', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.terminateFacility
);

// Facility Analytics
router.get('/:id/utilization', 
  authorize('fund_manager', 'credit_admin', 'investor', 'viewer'), 
  creditFacilityController.getFacilityUtilization
);

router.get('/fund/:fundId/metrics', 
  authorize('fund_manager', 'credit_admin', 'investor', 'viewer'), 
  creditFacilityController.getCreditMetrics
);

router.get('/attention', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.getFacilitiesRequiringAttention
);

// Drawdown Operations
router.post('/drawdowns', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.requestDrawdown
);

router.get('/:facilityId/drawdowns', 
  authorize('fund_manager', 'credit_admin', 'investor', 'viewer'), 
  creditFacilityController.getDrawdowns
);

router.post('/drawdowns/:id/approve', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.approveDrawdown
);

router.post('/drawdowns/:id/fund', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.fundDrawdown
);

// Paydown Operations
router.post('/paydowns', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.initiatePaydown
);

router.get('/:facilityId/paydowns', 
  authorize('fund_manager', 'credit_admin', 'investor', 'viewer'), 
  creditFacilityController.getPaydowns
);

router.post('/paydowns/:id/process', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.processPaydown
);

// Borrowing Base Operations
router.post('/borrowing-base', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.createBorrowingBase
);

router.post('/borrowing-base/:id/submit', 
  authorize('fund_manager', 'credit_admin'), 
  creditFacilityController.submitBorrowingBase
);

router.get('/borrowing-base/:id/summary', 
  authorize('fund_manager', 'credit_admin', 'investor', 'viewer'), 
  creditFacilityController.getBorrowingBaseSummary
);

// Fee Operations
router.get('/:id/fees/calculate', 
  authorize('fund_manager', 'credit_admin', 'investor', 'viewer'), 
  creditFacilityController.calculateFees
);

router.get('/:id/fees/accruals', 
  authorize('fund_manager', 'credit_admin', 'viewer'), 
  creditFacilityController.getDailyAccruals
);

router.get('/:id/fees/schedule', 
  authorize('fund_manager', 'credit_admin', 'investor', 'viewer'), 
  creditFacilityController.generateFeeSchedule
);

router.get('/:id/fees/effective-rate', 
  authorize('fund_manager', 'credit_admin', 'investor', 'viewer'), 
  creditFacilityController.calculateEffectiveRate
);

export default router;