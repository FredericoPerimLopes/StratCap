import { Router } from 'express';
import { body, param, query } from 'express-validator';
import CapitalActivityController from '../controllers/CapitalActivityController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const capitalActivityController = new CapitalActivityController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation schemas
const createCapitalCallValidation = [
  body('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
  body('eventNumber').isString().notEmpty().withMessage('Event number is required'),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('totalAmount').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid total amount is required'),
  body('baseAmount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Valid base amount is required'),
  body('feeAmount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Valid fee amount is required'),
  body('expenseAmount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Valid expense amount is required'),
  body('purpose').optional().isString(),
  body('allocationMethod').isIn(['pro_rata', 'custom', 'class_based']).withMessage('Valid allocation method is required'),
  body('customAllocations').optional().isArray(),
  body('customAllocations.*.commitmentId').optional().isInt({ min: 1 }),
  body('customAllocations.*.amount').optional().isDecimal({ decimal_digits: '0,2' }),
  body('includeClasses').optional().isArray(),
  body('excludeInvestors').optional().isArray(),
];

const createDistributionValidation = [
  body('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
  body('eventNumber').isString().notEmpty().withMessage('Event number is required'),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('totalDistributionAmount').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid total distribution amount is required'),
  body('distributionBreakdown').isObject().withMessage('Distribution breakdown is required'),
  body('distributionBreakdown.returnOfCapital').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid return of capital is required'),
  body('distributionBreakdown.gain').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid gain is required'),
  body('distributionBreakdown.carriedInterest').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid carried interest is required'),
  body('distributionBreakdown.managementFees').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid management fees is required'),
  body('distributionBreakdown.otherFees').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid other fees is required'),
  body('distributionBreakdown.expenses').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid expenses is required'),
  body('waterfallTier').optional().isInt({ min: 1 }),
  body('includeClasses').optional().isArray(),
  body('excludeInvestors').optional().isArray(),
];

const updatePaymentValidation = [
  body('paidAmount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Valid paid amount is required'),
  body('paymentDate').optional().isISO8601().withMessage('Valid payment date is required'),
  body('paidDate').optional().isISO8601().withMessage('Valid paid date is required'),
  body('notes').optional().isString(),
];

// Routes

/**
 * @route GET /api/funds/:fundId/capital-activities
 * @desc Get all capital activities for a fund
 * @access Private
 */
router.get(
  '/funds/:fundId/capital-activities',
  [
    param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
    query('eventType').optional().isIn(['capital_call', 'distribution', 'equalization', 'reallocation']),
    query('status').optional().isIn(['draft', 'pending', 'approved', 'completed', 'cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  capitalActivityController.getCapitalActivities.bind(capitalActivityController)
);

/**
 * @route GET /api/capital-activities/:id
 * @desc Get specific capital activity with allocations
 * @access Private
 */
router.get(
  '/capital-activities/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid capital activity ID is required')],
  capitalActivityController.getCapitalActivity.bind(capitalActivityController)
);

/**
 * @route POST /api/capital-activities/capital-calls
 * @desc Create a new capital call
 * @access Private
 */
router.post(
  '/capital-activities/capital-calls',
  createCapitalCallValidation,
  capitalActivityController.createCapitalCall.bind(capitalActivityController)
);

/**
 * @route POST /api/capital-activities/distributions
 * @desc Create a new distribution
 * @access Private
 */
router.post(
  '/capital-activities/distributions',
  createDistributionValidation,
  capitalActivityController.createDistribution.bind(capitalActivityController)
);

/**
 * @route PUT /api/capital-activities/:id/approve
 * @desc Approve a capital activity
 * @access Private
 */
router.put(
  '/capital-activities/:id/approve',
  [param('id').isInt({ min: 1 }).withMessage('Valid capital activity ID is required')],
  capitalActivityController.approveCapitalActivity.bind(capitalActivityController)
);

/**
 * @route PUT /api/capital-activities/:id/cancel
 * @desc Cancel a capital activity
 * @access Private
 */
router.put(
  '/capital-activities/:id/cancel',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid capital activity ID is required'),
    body('reason').optional().isString(),
  ],
  capitalActivityController.cancelCapitalActivity.bind(capitalActivityController)
);

/**
 * @route PUT /api/capital-activities/:id
 * @desc Update a capital activity
 * @access Private
 */
router.put(
  '/capital-activities/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid capital activity ID is required')],
  capitalActivityController.updateCapitalActivity.bind(capitalActivityController)
);

/**
 * @route PUT /api/capital-allocations/:allocationId/payment
 * @desc Update capital allocation payment
 * @access Private
 */
router.put(
  '/capital-allocations/:allocationId/payment',
  [
    param('allocationId').isInt({ min: 1 }).withMessage('Valid allocation ID is required'),
    ...updatePaymentValidation,
  ],
  capitalActivityController.updateCapitalAllocationPayment.bind(capitalActivityController)
);

/**
 * @route PUT /api/distribution-allocations/:allocationId/payment
 * @desc Update distribution allocation payment
 * @access Private
 */
router.put(
  '/distribution-allocations/:allocationId/payment',
  [
    param('allocationId').isInt({ min: 1 }).withMessage('Valid allocation ID is required'),
    ...updatePaymentValidation,
  ],
  capitalActivityController.updateDistributionAllocationPayment.bind(capitalActivityController)
);

/**
 * @route GET /api/capital-activities/:id/capital-call-summary
 * @desc Get capital call summary
 * @access Private
 */
router.get(
  '/capital-activities/:id/capital-call-summary',
  [param('id').isInt({ min: 1 }).withMessage('Valid capital activity ID is required')],
  capitalActivityController.getCapitalCallSummary.bind(capitalActivityController)
);

/**
 * @route GET /api/capital-activities/:id/distribution-summary
 * @desc Get distribution summary
 * @access Private
 */
router.get(
  '/capital-activities/:id/distribution-summary',
  [param('id').isInt({ min: 1 }).withMessage('Valid capital activity ID is required')],
  capitalActivityController.getDistributionSummary.bind(capitalActivityController)
);

/**
 * @route POST /api/capital-activities/:id/process-distribution-payments
 * @desc Process distribution payments
 * @access Private
 */
router.post(
  '/capital-activities/:id/process-distribution-payments',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid capital activity ID is required'),
    body('paymentDate').isISO8601().withMessage('Valid payment date is required'),
  ],
  capitalActivityController.processDistributionPayments.bind(capitalActivityController)
);

/**
 * @route GET /api/investors/:investorId/allocation-history
 * @desc Get allocation history for an investor
 * @access Private
 */
router.get(
  '/investors/:investorId/allocation-history',
  [
    param('investorId').isInt({ min: 1 }).withMessage('Valid investor ID is required'),
    query('fundId').optional().isInt({ min: 1 }),
  ],
  capitalActivityController.getInvestorAllocationHistory.bind(capitalActivityController)
);

/**
 * @route GET /api/funds/:fundId/allocation-metrics
 * @desc Get fund allocation metrics
 * @access Private
 */
router.get(
  '/funds/:fundId/allocation-metrics',
  [param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required')],
  capitalActivityController.getFundAllocationMetrics.bind(capitalActivityController)
);

/**
 * @route POST /api/capital-allocations/:allocationId/send-reminder
 * @desc Send capital call reminder
 * @access Private
 */
router.post(
  '/capital-allocations/:allocationId/send-reminder',
  [param('allocationId').isInt({ min: 1 }).withMessage('Valid allocation ID is required')],
  capitalActivityController.sendCapitalCallReminder.bind(capitalActivityController)
);

/**
 * @route GET /api/allocations/:allocationId/notifications/:type
 * @desc Get notification history for an allocation
 * @access Private
 */
router.get(
  '/allocations/:allocationId/notifications/:type',
  [
    param('allocationId').isInt({ min: 1 }).withMessage('Valid allocation ID is required'),
    param('type').isIn(['capital', 'distribution']).withMessage('Valid allocation type is required'),
  ],
  capitalActivityController.getNotificationHistory.bind(capitalActivityController)
);

/**
 * @route POST /api/allocations/validate
 * @desc Validate allocation amounts
 * @access Private
 */
router.post(
  '/allocations/validate',
  [
    body('allocations').isArray().withMessage('Allocations array is required'),
    body('allocations.*.commitmentId').isInt({ min: 1 }).withMessage('Valid commitment ID is required'),
    body('allocations.*.amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid amount is required'),
  ],
  capitalActivityController.validateAllocations.bind(capitalActivityController)
);

export default router;