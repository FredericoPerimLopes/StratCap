import { Router } from 'express';
import { DataAnalysisController } from '../controllers/dataAnalysisController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const dataAnalysisController = new DataAnalysisController();

// Apply authentication to all routes
router.use(authenticate as any);

// Data Sources
router.get('/data-sources', 
  authorize(['fund_manager', 'analyst', 'investor', 'viewer']) as any, 
  dataAnalysisController.getDataSources
);

router.get('/data-sources/:dataSource/schema', 
  authorize(['fund_manager', 'analyst', 'investor', 'viewer']) as any, 
  dataAnalysisController.getDataSourceSchema
);

router.get('/data-sources/:dataSource/preview', 
  authorize(['fund_manager', 'analyst', 'investor', 'viewer']) as any, 
  dataAnalysisController.previewData
);

// Pivot Tables
router.post('/pivot-tables', 
  authorize(['fund_manager', 'analyst']) as any, 
  dataAnalysisController.createPivotTable
);

router.post('/pivot-tables/:configId/execute', 
  authorize(['fund_manager', 'analyst', 'investor', 'viewer']) as any, 
  dataAnalysisController.executePivotTable
);

router.post('/pivot-tables/validate', 
  authorize(['fund_manager', 'analyst']) as any, 
  dataAnalysisController.validatePivotConfig
);

// Custom Reports
router.post('/reports', 
  authorize(['fund_manager', 'analyst']) as any, 
  dataAnalysisController.createCustomReport
);

router.post('/reports/:reportId/execute', 
  authorize(['fund_manager', 'analyst', 'investor', 'viewer']) as any, 
  dataAnalysisController.executeCustomReport
);

// Data Export
router.post('/export/:dataSource', 
  authorize(['fund_manager', 'analyst', 'investor']) as any, 
  dataAnalysisController.exportData
);

// Analysis Templates
router.get('/templates', 
  authorize(['fund_manager', 'analyst', 'investor', 'viewer']) as any, 
  dataAnalysisController.getAnalysisTemplates
);

router.post('/templates/:templateId/execute', 
  authorize(['fund_manager', 'analyst', 'investor', 'viewer']) as any, 
  dataAnalysisController.executeTemplate
);

// Utility Endpoints
router.get('/aggregation-functions', 
  authorize(['fund_manager', 'analyst', 'investor', 'viewer']) as any, 
  dataAnalysisController.getAggregationFunctions
);

export default router;