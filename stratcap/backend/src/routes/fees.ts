import { Router } from 'express';
import FeeController from '../controllers/FeeController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const feeController = new FeeController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Validation schemas
const managementFeeValidation = [
  param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
  body('periodStartDate').isISO8601().withMessage('Valid period start date is required'),
  body('periodEndDate').isISO8601().withMessage('Valid period end date is required'),
  body('basisType').optional().isIn(['nav', 'commitments', 'invested_capital']).withMessage('Invalid basis type'),
  body('customBasisAmount').optional().isDecimal().withMessage('Custom basis amount must be a valid decimal'),
  body('isAccrual').optional().isBoolean().withMessage('Is accrual must be a boolean'),
  body('useTimeWeighted').optional().isBoolean().withMessage('Use time weighted must be a boolean'),
];

const carriedInterestValidation = [
  param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
  body('asOfDate').isISO8601().withMessage('Valid as of date is required'),
  body('distributionAmount').optional().isDecimal().withMessage('Distribution amount must be a valid decimal'),
  body('useAccrualMethod').optional().isBoolean().withMessage('Use accrual method must be a boolean'),
  body('onDistribution').optional().isBoolean().withMessage('On distribution must be a boolean'),
];

const trueUpValidation = [
  param('calculationId').isInt({ min: 1 }).withMessage('Valid calculation ID is required'),
  body('actualBasisAmount').isDecimal().withMessage('Actual basis amount is required and must be a valid decimal'),
  body('reason').isString().isLength({ min: 10 }).withMessage('Reason is required and must be at least 10 characters'),
];

const offsetValidation = [
  param('calculationId').isInt({ min: 1 }).withMessage('Valid calculation ID is required'),
  body('offsetType').isIn(['transaction_fee', 'monitoring_fee', 'consulting_fee', 'expense_reimbursement', 'other']).withMessage('Valid offset type is required'),
  body('offsetAmount').isDecimal().withMessage('Offset amount is required and must be a valid decimal'),
  body('description').isString().isLength({ min: 5 }).withMessage('Description is required and must be at least 5 characters'),
  body('sourceReference').optional().isString().withMessage('Source reference must be a string'),
  body('offsetDate').optional().isISO8601().withMessage('Offset date must be a valid date'),
];

const feeBasisValidation = [
  param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
  body('asOfDate').isISO8601().withMessage('Valid as of date is required'),
  body('basisData').isObject().withMessage('Basis data is required and must be an object'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-character code'),
];

// Management Fee Routes
router.post(
  '/funds/:fundId/management-fees/calculate',
  managementFeeValidation,
  validateRequest,
  feeController.calculateManagementFee
);

router.post(
  '/calculations/:calculationId/true-up',
  trueUpValidation,
  validateRequest,
  feeController.createManagementFeetrueUp
);

// Carried Interest Routes
router.post(
  '/funds/:fundId/carried-interest/calculate',
  carriedInterestValidation,
  validateRequest,
  feeController.calculateCarriedInterest
);

// Fee Calculation Management
router.get(
  '/funds/:fundId/calculations',
  [
    param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('feeType').optional().isIn(['management', 'carried_interest', 'other']).withMessage('Invalid fee type'),
  ],
  validateRequest,
  feeController.getFeeCalculations
);

router.post(
  '/calculations/:calculationId/post',
  [param('calculationId').isInt({ min: 1 }).withMessage('Valid calculation ID is required')],
  validateRequest,
  feeController.postFeeCalculation
);

router.post(
  '/calculations/:calculationId/reverse',
  [
    param('calculationId').isInt({ min: 1 }).withMessage('Valid calculation ID is required'),
    body('reason').isString().isLength({ min: 10 }).withMessage('Reversal reason is required and must be at least 10 characters'),
  ],
  validateRequest,
  feeController.reverseFeeCalculation
);

// Fee Offset Routes
router.post(
  '/calculations/:calculationId/offsets',
  offsetValidation,
  validateRequest,
  feeController.createFeeOffset
);

router.post(
  '/offsets/:offsetId/approve',
  [
    param('offsetId').isInt({ min: 1 }).withMessage('Valid offset ID is required'),
    body('userId').optional().isInt({ min: 1 }).withMessage('Valid user ID is required'),
  ],
  validateRequest,
  feeController.approveFeeOffset
);

router.get(
  '/offsets/pending',
  [query('fundId').optional().isInt({ min: 1 }).withMessage('Fund ID must be a valid integer')],
  validateRequest,
  feeController.getPendingOffsets
);

router.get(
  '/funds/:fundId/offsets/summary',
  [
    param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
  ],
  validateRequest,
  feeController.getOffsetSummary
);

// Fee Basis Routes
router.post(
  '/funds/:fundId/basis/snapshot',
  feeBasisValidation,
  validateRequest,
  feeController.createFeeBasisSnapshot
);

router.get(
  '/funds/:fundId/basis/history',
  [
    param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
    query('basisType').optional().isIn(['nav', 'commitments', 'invested_capital', 'distributions']).withMessage('Invalid basis type'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validateRequest,
  feeController.getFeeBasisHistory
);

// Dashboard and Summary Routes
router.get(
  '/funds/:fundId/summary',
  [
    param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
  ],
  validateRequest,
  feeController.getFeeSummary
);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Fee service is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;