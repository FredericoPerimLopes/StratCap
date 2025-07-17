import { Router } from 'express';
import commitmentController from '../controllers/CommitmentController';
import { protect } from '../middleware/auth';
import { validate, validateParams, validateQuery, schemas } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(protect);

// Commitment CRUD operations
router.post('/', validate(schemas.createCommitment), commitmentController.createCommitment);
router.get('/', validateQuery(schemas.pagination), commitmentController.getCommitments);
router.get('/:id', validateParams(schemas.id), commitmentController.getCommitmentById);
router.patch('/:id', validateParams(schemas.id), commitmentController.updateCommitment);

// Commitment-specific operations
router.patch('/:id/status', validateParams(schemas.id), commitmentController.updateCommitmentStatus);
router.get('/:id/transactions', validateParams(schemas.id), validateQuery(schemas.pagination), commitmentController.getCommitmentTransactions);
router.get('/:id/summary', validateParams(schemas.id), commitmentController.getCommitmentSummary);
router.post('/:id/recalculate', validateParams(schemas.id), commitmentController.recalculateCommitment);

// Enhanced workflow endpoints
router.get('/:id/analytics', validateParams(schemas.id), commitmentController.generateCommitmentAnalytics);
router.put('/:id/side-letter-terms', validateParams(schemas.id), commitmentController.updateSideLetterTerms);
router.post('/fund/:fundId/bulk-recalculate', validateParams(Joi.object({ fundId: Joi.number().integer().positive().required() })), commitmentController.bulkRecalculateCommitments);
router.get('/attention', commitmentController.getCommitmentsRequiringAttention);
router.get('/workflow/steps', commitmentController.getCommitmentWorkflowSteps);

export default router;