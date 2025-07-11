import { Router } from 'express';
import transactionController from '../controllers/TransactionController';
import { protect } from '../middleware/auth';
import { validate, validateParams, validateQuery, schemas } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(protect);

// Additional validation schemas for transactions
const transactionSchemas = {
  createTransaction: Joi.object({
    fundId: Joi.number().integer().positive().required(),
    commitmentId: Joi.number().integer().positive().required(),
    capitalActivityId: Joi.number().integer().positive(),
    transactionDate: Joi.date().required(),
    effectiveDate: Joi.date(),
    transactionType: Joi.string().valid('capital_call', 'distribution', 'fee', 'expense', 'equalization', 'transfer', 'adjustment').required(),
    transactionCode: Joi.string().required(),
    description: Joi.string().required(),
    amount: Joi.string().required(),
    currency: Joi.string().length(3).default('USD'),
    baseAmount: Joi.string(),
    exchangeRate: Joi.string(),
    direction: Joi.string().valid('debit', 'credit').required(),
    category: Joi.string(),
    subCategory: Joi.string(),
    glAccountCode: Joi.string(),
    batchId: Joi.string(),
    referenceNumber: Joi.string(),
    notes: Joi.string(),
    metadata: Joi.object()
  }),

  reverseTransaction: Joi.object({
    reason: Joi.string().required()
  }),

  transactionQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().default('transactionDate'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    fundId: Joi.number().integer().positive(),
    commitmentId: Joi.number().integer().positive(),
    capitalActivityId: Joi.number().integer().positive(),
    transactionType: Joi.string().valid('capital_call', 'distribution', 'fee', 'expense', 'equalization', 'transfer', 'adjustment'),
    startDate: Joi.date(),
    endDate: Joi.date(),
    batchId: Joi.string(),
    search: Joi.string()
  }),

  summaryQuery: Joi.object({
    fundId: Joi.number().integer().positive(),
    commitmentId: Joi.number().integer().positive(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    groupBy: Joi.string().valid('transactionType', 'month', 'fund').default('transactionType')
  })
};

// Transaction CRUD operations
router.post('/', validate(transactionSchemas.createTransaction), transactionController.createTransaction);
router.get('/', validateQuery(transactionSchemas.transactionQuery), transactionController.getTransactions);
router.get('/summary', validateQuery(transactionSchemas.summaryQuery), transactionController.getTransactionSummary);
router.get('/batch/:batchId', transactionController.getBatchTransactions);
router.get('/:id', validateParams(schemas.id), transactionController.getTransactionById);
router.patch('/:id', validateParams(schemas.id), transactionController.updateTransaction);

// Transaction-specific operations
router.post('/:id/reverse', validateParams(schemas.id), validate(transactionSchemas.reverseTransaction), transactionController.reverseTransaction);

export default router;