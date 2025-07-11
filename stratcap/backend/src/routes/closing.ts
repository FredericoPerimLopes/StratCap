import express from 'express';
import ClosingController from '../controllers/ClosingController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();
const closingController = new ClosingController();

// Validation rules
const initializeClosingValidation = [
  param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
  body('closingType')
    .isIn(['initial', 'subsequent', 'final'])
    .withMessage('Closing type must be initial, subsequent, or final'),
  body('closingDate')
    .isISO8601()
    .withMessage('Valid closing date is required'),
];

const updateStepValidation = [
  param('closingId').isInt({ min: 1 }).withMessage('Valid closing ID is required'),
  param('stepNumber').isInt({ min: 1, max: 6 }).withMessage('Step number must be between 1 and 6'),
];

const equalizationValidation = [
  param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('interestRate')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Interest rate must be between 0 and 1 (as decimal)'),
];

// Routes

/**
 * @route   POST /api/closings/fund/:fundId/initialize
 * @desc    Initialize a new closing workflow
 * @access  Private
 */
router.post(
  '/fund/:fundId/initialize',
  auth,
  initializeClosingValidation,
  validate,
  closingController.initializeClosing
);

/**
 * @route   GET /api/closings/:closingId/steps
 * @desc    Get closing workflow steps
 * @access  Private
 */
router.get(
  '/:closingId/steps',
  auth,
  [param('closingId').isInt({ min: 1 })],
  validate,
  closingController.getClosingSteps
);

/**
 * @route   PUT /api/closings/:closingId/steps/:stepNumber
 * @desc    Update a closing workflow step
 * @access  Private
 */
router.put(
  '/:closingId/steps/:stepNumber',
  auth,
  updateStepValidation,
  validate,
  closingController.updateClosingStep
);

/**
 * @route   GET /api/closings/:closingId/summary
 * @desc    Get closing summary
 * @access  Private
 */
router.get(
  '/:closingId/summary',
  auth,
  [param('closingId').isInt({ min: 1 })],
  validate,
  closingController.getClosingSummary
);

/**
 * @route   GET /api/closings/:closingId/validate
 * @desc    Validate closing for completion
 * @access  Private
 */
router.get(
  '/:closingId/validate',
  auth,
  [param('closingId').isInt({ min: 1 })],
  validate,
  closingController.validateClosing
);

/**
 * @route   POST /api/closings/:closingId/clone
 * @desc    Clone closing for amendment
 * @access  Private
 */
router.post(
  '/:closingId/clone',
  auth,
  [param('closingId').isInt({ min: 1 })],
  validate,
  closingController.cloneClosing
);

/**
 * @route   GET /api/closings/fund/:fundId
 * @desc    Get closings for fund
 * @access  Private
 */
router.get(
  '/fund/:fundId',
  auth,
  [
    param('fundId').isInt({ min: 1 }),
    query('status').optional().isIn(['draft', 'pending', 'completed', 'cancelled']),
    query('closingType').optional().isIn(['initial', 'subsequent', 'final']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  validate,
  closingController.getClosingsForFund
);

/**
 * @route   POST /api/closings/fund/:fundId/equalization/calculate
 * @desc    Calculate equalization
 * @access  Private
 */
router.post(
  '/fund/:fundId/equalization/calculate',
  auth,
  equalizationValidation,
  validate,
  closingController.calculateEqualization
);

/**
 * @route   POST /api/closings/fund/:fundId/equalization/apply
 * @desc    Apply equalization adjustments
 * @access  Private
 */
router.post(
  '/fund/:fundId/equalization/apply',
  auth,
  [
    param('fundId').isInt({ min: 1 }),
    body('equalizationSummary').isObject().withMessage('Equalization summary is required'),
  ],
  validate,
  closingController.applyEqualizationAdjustments
);

/**
 * @route   GET /api/closings/equalization/interest-rate/recommended
 * @desc    Get recommended equalization interest rate
 * @access  Private
 */
router.get(
  '/equalization/interest-rate/recommended',
  auth,
  [query('effectiveDate').optional().isISO8601()],
  validate,
  closingController.getRecommendedInterestRate
);

/**
 * @route   POST /api/closings/equalization/interest/calculate
 * @desc    Calculate equalization interest for specific amount
 * @access  Private
 */
router.post(
  '/equalization/interest/calculate',
  auth,
  [
    body('principal').isFloat({ min: 0 }).withMessage('Principal amount is required'),
    body('interestRate').isFloat({ min: 0, max: 1 }).withMessage('Valid interest rate is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
  ],
  validate,
  closingController.calculateEqualizationInterest
);

export default router;