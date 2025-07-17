import { Router } from 'express';
import { GeneralLedgerController } from '../controllers/generalLedgerController';
import { protect, authorize } from '../middleware/auth';

const router = Router();
const generalLedgerController = new GeneralLedgerController();

// Apply authentication to all routes
router.use(protect);

// GL Account Management
router.post('/accounts', 
  authorize('fund_manager', 'accountant', 'admin'), 
  generalLedgerController.createGLAccount
);

router.get('/accounts', 
  authorize('fund_manager', 'accountant', 'analyst', 'viewer'), 
  generalLedgerController.getChartOfAccounts
);

router.get('/accounts/:accountId/balance', 
  authorize('fund_manager', 'accountant', 'analyst', 'viewer'), 
  generalLedgerController.getAccountBalance
);

router.get('/accounts/:accountId/activity', 
  authorize('fund_manager', 'accountant', 'analyst', 'viewer'), 
  generalLedgerController.getAccountActivity
);

// Journal Entry Management
router.post('/journal-entries', 
  authorize('fund_manager', 'accountant'), 
  generalLedgerController.createJournalEntry
);

router.post('/journal-entries/automated', 
  authorize('fund_manager', 'accountant', 'system'), 
  generalLedgerController.createAutomatedJournalEntry
);

router.get('/journal-entries/:id', 
  authorize('fund_manager', 'accountant', 'analyst', 'viewer'), 
  generalLedgerController.getJournalEntry
);

router.post('/journal-entries/:id/post', 
  authorize('fund_manager', 'accountant'), 
  generalLedgerController.postJournalEntry
);

router.post('/journal-entries/:id/reverse', 
  authorize('fund_manager', 'accountant'), 
  generalLedgerController.reverseJournalEntry
);

router.post('/journal-entries/validate', 
  authorize('fund_manager', 'accountant', 'analyst'), 
  generalLedgerController.validateJournalEntry
);

// Financial Reporting
router.get('/trial-balance', 
  authorize('fund_manager', 'accountant', 'analyst', 'viewer'), 
  generalLedgerController.getTrialBalance
);

router.get('/dashboard-metrics', 
  authorize('fund_manager', 'accountant', 'analyst', 'viewer'), 
  generalLedgerController.getDashboardMetrics
);

export default router;