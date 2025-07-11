import express from 'express';
import DocumentController from '../controllers/DocumentController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();
const documentController = new DocumentController();

// Validation rules
const uploadDocumentValidation = [
  body('category')
    .isIn(['kyc', 'aml', 'legal', 'closing', 'transfer', 'compliance', 'financial', 'other'])
    .withMessage('Invalid document category'),
  body('entityType')
    .isIn(['fund', 'investor', 'commitment', 'closing', 'transfer', 'transaction'])
    .withMessage('Invalid entity type'),
  body('entityId')
    .isInt({ min: 1 })
    .withMessage('Valid entity ID is required'),
  body('accessLevel')
    .optional()
    .isIn(['public', 'internal', 'confidential', 'restricted'])
    .withMessage('Invalid access level'),
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('Requires approval must be boolean'),
];

const approveDocumentValidation = [
  param('documentId').isUUID().withMessage('Valid document ID is required'),
  body('decision')
    .isIn(['approve', 'reject'])
    .withMessage('Decision must be approve or reject'),
  body('comments')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comments must be less than 1000 characters'),
];

const searchValidation = [
  query('category')
    .optional()
    .isIn(['kyc', 'aml', 'legal', 'closing', 'transfer', 'compliance', 'financial', 'other']),
  query('entityType')
    .optional()
    .isIn(['fund', 'investor', 'commitment', 'closing', 'transfer', 'transaction']),
  query('entityId')
    .optional()
    .isInt({ min: 1 }),
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'approved', 'rejected', 'archived']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const bulkApprovalValidation = [
  body('documentIds')
    .isArray({ min: 1 })
    .withMessage('Document IDs array is required'),
  body('documentIds.*')
    .isUUID()
    .withMessage('All document IDs must be valid UUIDs'),
  body('decision')
    .isIn(['approve', 'reject'])
    .withMessage('Decision must be approve or reject'),
  body('comments')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comments must be less than 1000 characters'),
];

// Routes

/**
 * @route   POST /api/documents/upload
 * @desc    Upload a new document
 * @access  Private
 */
router.post(
  '/upload',
  auth,
  documentController.getUploadMiddleware(),
  uploadDocumentValidation,
  validate,
  documentController.uploadDocument
);

/**
 * @route   GET /api/documents/:documentId
 * @desc    Get document by ID
 * @access  Private
 */
router.get(
  '/:documentId',
  auth,
  [param('documentId').isUUID()],
  validate,
  documentController.getDocument
);

/**
 * @route   GET /api/documents/:documentId/download
 * @desc    Download document content
 * @access  Private
 */
router.get(
  '/:documentId/download',
  auth,
  [param('documentId').isUUID()],
  validate,
  documentController.downloadDocument
);

/**
 * @route   PUT /api/documents/:documentId/version
 * @desc    Update document version
 * @access  Private
 */
router.put(
  '/:documentId/version',
  auth,
  documentController.getUploadMiddleware(),
  [
    param('documentId').isUUID(),
    body('changes').isLength({ min: 1, max: 500 }).withMessage('Changes description is required'),
  ],
  validate,
  documentController.updateDocumentVersion
);

/**
 * @route   POST /api/documents/:documentId/approve
 * @desc    Approve or reject document
 * @access  Private
 */
router.post(
  '/:documentId/approve',
  auth,
  approveDocumentValidation,
  validate,
  documentController.approveDocument
);

/**
 * @route   GET /api/documents/search
 * @desc    Search documents
 * @access  Private
 */
router.get(
  '/search',
  auth,
  searchValidation,
  validate,
  documentController.searchDocuments
);

/**
 * @route   DELETE /api/documents/:documentId
 * @desc    Delete document
 * @access  Private
 */
router.delete(
  '/:documentId',
  auth,
  [
    param('documentId').isUUID(),
    body('reason').optional().isLength({ max: 500 }),
  ],
  validate,
  documentController.deleteDocument
);

/**
 * @route   GET /api/documents/:documentId/versions
 * @desc    Get document versions
 * @access  Private
 */
router.get(
  '/:documentId/versions',
  auth,
  [param('documentId').isUUID()],
  validate,
  documentController.getDocumentVersions
);

/**
 * @route   GET /api/documents/entity/:entityType/:entityId
 * @desc    Get documents by entity
 * @access  Private
 */
router.get(
  '/entity/:entityType/:entityId',
  auth,
  [
    param('entityType').isIn(['fund', 'investor', 'commitment', 'closing', 'transfer', 'transaction']),
    param('entityId').isInt({ min: 1 }),
    query('category').optional().isIn(['kyc', 'aml', 'legal', 'closing', 'transfer', 'compliance', 'financial', 'other']),
    query('status').optional().isIn(['pending', 'processing', 'approved', 'rejected', 'archived']),
  ],
  validate,
  documentController.getDocumentsByEntity
);

/**
 * @route   GET /api/documents/approvals/pending
 * @desc    Get pending approvals
 * @access  Private
 */
router.get(
  '/approvals/pending',
  auth,
  [
    query('category').optional().isIn(['kyc', 'aml', 'legal', 'closing', 'transfer', 'compliance', 'financial', 'other']),
    query('entityType').optional().isIn(['fund', 'investor', 'commitment', 'closing', 'transfer', 'transaction']),
  ],
  validate,
  documentController.getPendingApprovals
);

/**
 * @route   POST /api/documents/approvals/bulk
 * @desc    Bulk approve documents
 * @access  Private
 */
router.post(
  '/approvals/bulk',
  auth,
  bulkApprovalValidation,
  validate,
  documentController.bulkApproveDocuments
);

/**
 * @route   GET /api/documents/statistics
 * @desc    Get document statistics
 * @access  Private
 */
router.get(
  '/statistics',
  auth,
  [
    query('entityType').optional().isIn(['fund', 'investor', 'commitment', 'closing', 'transfer', 'transaction']),
    query('entityId').optional().isInt({ min: 1 }),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  validate,
  documentController.getDocumentStatistics
);

export default router;