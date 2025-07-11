import { Router } from 'express';
import reportController from '../controllers/ReportController';
import { protect } from '../middleware/auth';
import { validateParams, validateQuery, schemas } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(protect);

// Additional validation schemas for reports
const reportSchemas = {
  fundPerformanceQuery: Joi.object({
    startDate: Joi.date(),
    endDate: Joi.date()
  }),

  investorPortfolioQuery: Joi.object({
    asOfDate: Joi.date()
  }),

  capitalActivityQuery: Joi.object({
    fundId: Joi.number().integer().positive(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    eventType: Joi.string().valid('capital_call', 'distribution', 'equalization', 'reallocation')
  }),

  commitmentQuery: Joi.object({
    fundId: Joi.number().integer().positive(),
    investorId: Joi.number().integer().positive(),
    status: Joi.string().valid('pending', 'active', 'suspended', 'terminated'),
    asOfDate: Joi.date()
  })
};

// Basic Report endpoints
router.get('/dashboard', reportController.getDashboardMetrics);
router.get('/fund/:fundId/performance', 
  validateParams(schemas.id.rename('id', 'fundId')), 
  validateQuery(reportSchemas.fundPerformanceQuery), 
  reportController.getFundPerformanceReport
);
router.get('/investor/:investorId/portfolio', 
  validateParams(schemas.id.rename('id', 'investorId')), 
  validateQuery(reportSchemas.investorPortfolioQuery), 
  reportController.getInvestorPortfolioReport
);
router.get('/capital-activities', 
  validateQuery(reportSchemas.capitalActivityQuery), 
  reportController.getCapitalActivityReport
);
router.get('/commitments', 
  validateQuery(reportSchemas.commitmentQuery), 
  reportController.getCommitmentReport
);

// Enhanced Report endpoints
router.get('/fund/:fundId/comprehensive', 
  validateParams(schemas.id.rename('id', 'fundId')), 
  reportController.getComprehensiveFundReport
);
router.get('/fund-family/:fundFamilyId/consolidation', 
  validateParams(schemas.id.rename('id', 'fundFamilyId')), 
  reportController.getFundFamilyReport
);
router.get('/investor/:investorId/positions', 
  validateParams(schemas.id.rename('id', 'investorId')), 
  reportController.getInvestorPositionReport
);
router.get('/fund/:fundId/fees', 
  validateParams(schemas.id.rename('id', 'fundId')), 
  reportController.getFeeSummaryReport
);

// Export endpoints
router.get('/export/:reportType', 
  reportController.exportReport
);

export default router;