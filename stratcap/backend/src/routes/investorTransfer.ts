import express from 'express';
import InvestorTransferController from '../controllers/InvestorTransferController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();
const investorTransferController = new InvestorTransferController();

// Validation rules
const initializeTransferValidation = [
  param('commitmentId').isInt({ min: 1 }).withMessage('Valid commitment ID is required'),
  param('transferorId').isInt({ min: 1 }).withMessage('Valid transferor ID is required'),
  body('transferType')
    .isIn(['full', 'partial'])
    .withMessage('Transfer type must be full or partial'),
  body('transferDate')
    .isISO8601()
    .withMessage('Valid transfer date is required'),
  body('effectiveDate')
    .isISO8601()
    .withMessage('Valid effective date is required'),
  body('transferReason')
    .isLength({ min: 1, max: 500 })
    .withMessage('Transfer reason is required and must be less than 500 characters'),
];

const updateStepValidation = [
  param('transferId').isInt({ min: 1 }).withMessage('Valid transfer ID is required'),
  param('stepNumber').isInt({ min: 1, max: 5 }).withMessage('Step number must be between 1 and 5'),
];

const bulkApprovalValidation = [
  body('transferIds')
    .isArray({ min: 1 })
    .withMessage('Transfer IDs array is required'),
  body('transferIds.*')
    .isInt({ min: 1 })
    .withMessage('All transfer IDs must be valid integers'),
  body('comments')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comments must be less than 1000 characters'),
];

// Routes

/**
 * @route   POST /api/investor-transfers/commitment/:commitmentId/transferor/:transferorId/initialize
 * @desc    Initialize a new investor transfer workflow
 * @access  Private
 */
router.post(
  '/commitment/:commitmentId/transferor/:transferorId/initialize',
  auth,
  initializeTransferValidation,
  validate,
  investorTransferController.initializeTransfer
);

/**
 * @route   PUT /api/investor-transfers/:transferId/steps/:stepNumber
 * @desc    Update transfer step
 * @access  Private
 */
router.put(
  '/:transferId/steps/:stepNumber',
  auth,
  updateStepValidation,
  validate,
  investorTransferController.updateTransferStep
);

/**
 * @route   GET /api/investor-transfers/:transferId/summary
 * @desc    Get transfer summary
 * @access  Private
 */
router.get(
  '/:transferId/summary',
  auth,
  [param('transferId').isInt({ min: 1 })],
  validate,
  investorTransferController.getTransferSummary
);

/**
 * @route   GET /api/investor-transfers/:transferId
 * @desc    Get transfer by ID
 * @access  Private
 */
router.get(
  '/:transferId',
  auth,
  [param('transferId').isInt({ min: 1 })],
  validate,
  investorTransferController.getTransfer
);

/**
 * @route   POST /api/investor-transfers/:transferId/submit
 * @desc    Submit transfer for review
 * @access  Private
 */
router.post(
  '/:transferId/submit',
  auth,
  [param('transferId').isInt({ min: 1 })],
  validate,
  investorTransferController.submitTransfer
);

/**
 * @route   POST /api/investor-transfers/:transferId/cancel
 * @desc    Cancel transfer
 * @access  Private
 */
router.post(
  '/:transferId/cancel',
  auth,
  [
    param('transferId').isInt({ min: 1 }),
    body('reason').isLength({ min: 1, max: 500 }).withMessage('Cancellation reason is required'),
  ],
  validate,
  investorTransferController.cancelTransfer
);

/**
 * @route   GET /api/investor-transfers/:transferId/validate
 * @desc    Validate transfer for completion
 * @access  Private
 */
router.get(
  '/:transferId/validate',
  auth,
  [param('transferId').isInt({ min: 1 })],
  validate,
  investorTransferController.validateTransfer
);

/**
 * @route   GET /api/investor-transfers/fund/:fundId
 * @desc    Get transfers for fund
 * @access  Private
 */
router.get(
  '/fund/:fundId',
  auth,
  [
    param('fundId').isInt({ min: 1 }),
    query('status').optional().isIn([
      'draft', 'submitted', 'under_review', 'approved', 'completed', 'rejected', 'cancelled'
    ]),
    query('transferType').optional().isIn(['full', 'partial']),
    query('transferorId').optional().isInt({ min: 1 }),
    query('transfereeId').optional().isInt({ min: 1 }),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  investorTransferController.getTransfersForFund
);

/**
 * @route   GET /api/investor-transfers/investor/:investorId
 * @desc    Get transfers by investor
 * @access  Private
 */
router.get(
  '/investor/:investorId',
  auth,
  [
    param('investorId').isInt({ min: 1 }),
    query('status').optional().isIn([
      'draft', 'submitted', 'under_review', 'approved', 'completed', 'rejected', 'cancelled'
    ]),
    query('transferType').optional().isIn(['full', 'partial']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  validate,
  investorTransferController.getTransfersByInvestor
);

/**
 * @route   GET /api/investor-transfers/fund/:fundId/statistics
 * @desc    Get transfer statistics
 * @access  Private
 */
router.get(
  '/fund/:fundId/statistics',
  auth,
  [
    param('fundId').isInt({ min: 1 }),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  validate,
  investorTransferController.getTransferStatistics
);

/**
 * @route   GET /api/investor-transfers/approvals/pending
 * @desc    Get pending approvals for user
 * @access  Private
 */
router.get(
  '/approvals/pending',
  auth,
  [query('fundId').optional().isInt({ min: 1 })],
  validate,
  investorTransferController.getPendingApprovals
);

/**
 * @route   POST /api/investor-transfers/approvals/bulk
 * @desc    Bulk approve transfers
 * @access  Private
 */
router.post(
  '/approvals/bulk',
  auth,
  bulkApprovalValidation,
  validate,
  investorTransferController.bulkApproveTransfers
);

export default router;