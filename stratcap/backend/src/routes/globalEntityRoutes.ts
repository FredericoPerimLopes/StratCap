import { Router } from 'express';
import { GlobalEntityController } from '../controllers/globalEntityController';
import { protect, authorize } from '../middleware/auth';

const router = Router();
const globalEntityController = new GlobalEntityController();

// Apply authentication to all routes
router.use(protect);

// Global metrics and analytics
router.get('/metrics', 
  authorize('fund_manager', 'analyst', 'admin', 'viewer') as any, 
  globalEntityController.getGlobalMetrics
);

router.get('/analytics/cross-fund', 
  authorize('fund_manager', 'analyst', 'admin', 'viewer') as any, 
  globalEntityController.getCrossFundAnalytics
);

router.get('/relationship-map', 
  authorize('fund_manager', 'analyst', 'admin') as any, 
  globalEntityController.getRelationshipMap
);

// Entity search and discovery
router.get('/search', 
  authorize('fund_manager', 'analyst', 'admin', 'viewer') as any, 
  globalEntityController.searchEntities
);

router.get('/performance-comparison', 
  authorize('fund_manager', 'analyst', 'admin', 'viewer') as any, 
  globalEntityController.getPerformanceComparison
);

// Investor-centric views
router.get('/investors/:investorId/summary', 
  authorize('fund_manager', 'analyst', 'admin', 'investor', 'viewer') as any, 
  globalEntityController.getInvestorSummary
);

router.get('/investors/:investorId/portfolio', 
  authorize('fund_manager', 'analyst', 'admin', 'investor', 'viewer') as any, 
  globalEntityController.getInvestorPortfolio
);

// Fund-centric views
router.get('/funds/:fundId/summary', 
  authorize('fund_manager', 'analyst', 'admin', 'investor', 'viewer') as any, 
  globalEntityController.getFundSummary
);

router.get('/funds/:fundId/investor-base', 
  authorize('fund_manager', 'analyst', 'admin', 'viewer') as any, 
  globalEntityController.getFundInvestorBase
);

// Investment-centric views
router.get('/investments/:investmentId/summary', 
  authorize('fund_manager', 'analyst', 'admin', 'viewer') as any, 
  globalEntityController.getInvestmentSummary
);

export default router;