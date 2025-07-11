import { Router } from 'express';
import { auth } from '../middleware/auth';
import AnalyticsController from '../controllers/AnalyticsController';

const router = Router();

// Apply authentication middleware to all analytics routes
router.use(auth);

// Performance Analytics Routes
router.get('/funds/:fundId/performance', AnalyticsController.getFundPerformanceAnalytics);
router.get('/investors/:investorId/performance', AnalyticsController.getInvestorPerformanceAnalytics);

// Cash Flow Analytics Routes
router.get('/funds/:fundId/cash-flows', AnalyticsController.getCashFlowAnalytics);
router.get('/investors/:investorId/cash-flows', AnalyticsController.getInvestorCashFlowAnalytics);
router.get('/funds/:fundId/waterfall-cash-flows', AnalyticsController.getWaterfallCashFlowAnalysis);

// Hypothetical Scenarios Routes
router.post('/funds/:fundId/scenarios', AnalyticsController.createHypotheticalScenario);
router.post('/scenarios/compare', AnalyticsController.compareScenarios);
router.post('/funds/:fundId/monte-carlo', AnalyticsController.runMonteCarloSimulation);
router.post('/portfolios/scenarios', AnalyticsController.createPortfolioScenario);
router.post('/funds/:fundId/stress-test', AnalyticsController.runStressTest);

// Investor Statements Routes
router.get('/investors/:investorId/funds/:fundId/statements', AnalyticsController.generateInvestorStatement);
router.get('/investors/:investorId/funds/:fundId/capital-account', AnalyticsController.generateCapitalAccountStatement);
router.post('/funds/:fundId/quarterly-statements', AnalyticsController.generateQuarterlyStatements);
router.get('/investors/:investorId/funds/:fundId/tax-package', AnalyticsController.generateAnnualTaxPackage);

// Export Routes
router.get('/funds/:fundId/export/performance', AnalyticsController.exportFundPerformance);
router.get('/investors/:investorId/export/portfolio', AnalyticsController.exportInvestorPortfolio);
router.get('/export/capital-activity', AnalyticsController.exportCapitalActivity);
router.get('/export/fee-calculations', AnalyticsController.exportFeeCalculations);

// Advanced Analytics Routes
router.post('/export/pivot-table', AnalyticsController.createPivotTable);
router.post('/export/custom-report', AnalyticsController.buildCustomReport);
router.get('/funds/:fundId/export/visualization', AnalyticsController.exportDataVisualization);

// Dashboard Routes
router.get('/funds/:fundId/dashboard', AnalyticsController.getAnalyticsDashboard);

export default router;