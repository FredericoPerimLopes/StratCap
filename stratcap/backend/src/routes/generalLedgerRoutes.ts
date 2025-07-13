import { Router } from 'express';
import { GeneralLedgerController } from '../controllers/generalLedgerController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const generalLedgerController = new GeneralLedgerController();

// Apply authentication to all routes
router.use(authenticate as any);

// GL Account Management
router.post('/accounts', 
  authorize(['fund_manager', 'accountant', 'admin']) as any, 
  generalLedgerController.createGLAccount
);

router.get('/accounts', 
  authorize(['fund_manager', 'accountant', 'analyst', 'viewer']) as any, 
  generalLedgerController.getChartOfAccounts
);

router.get('/accounts/:accountId/balance', 
  authorize(['fund_manager', 'accountant', 'analyst', 'viewer']) as any, 
  generalLedgerController.getAccountBalance
);

router.get('/accounts/:accountId/activity', 
  authorize(['fund_manager', 'accountant', 'analyst', 'viewer']) as any, 
  generalLedgerController.getAccountActivity
);

// Journal Entry Management
router.post('/journal-entries', 
  authorize(['fund_manager', 'accountant']) as any, 
  generalLedgerController.createJournalEntry
);

router.post('/journal-entries/automated', 
  authorize(['fund_manager', 'accountant', 'system']) as any, 
  generalLedgerController.createAutomatedJournalEntry
);

router.get('/journal-entries/:id', 
  authorize(['fund_manager', 'accountant', 'analyst', 'viewer']) as any, 
  generalLedgerController.getJournalEntry
);

router.post('/journal-entries/:id/post', 
  authorize(['fund_manager', 'accountant']) as any, 
  generalLedgerController.postJournalEntry
);

router.post('/journal-entries/:id/reverse', 
  authorize(['fund_manager', 'accountant']) as any, 
  generalLedgerController.reverseJournalEntry
);

router.post('/journal-entries/validate', 
  authorize(['fund_manager', 'accountant', 'analyst']) as any, 
  generalLedgerController.validateJournalEntry
);

// Financial Reporting
router.get('/trial-balance', 
  authorize(['fund_manager', 'accountant', 'analyst', 'viewer']) as any, 
  generalLedgerController.getTrialBalance
);

router.get('/dashboard-metrics', 
  authorize(['fund_manager', 'accountant', 'analyst', 'viewer']) as any, 
  generalLedgerController.getDashboardMetrics
);

export default router;