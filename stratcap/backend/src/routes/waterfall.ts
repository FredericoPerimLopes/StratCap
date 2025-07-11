import { Router } from 'express';
import WaterfallController from '../controllers/WaterfallController';
import { authenticateToken } from '../middleware/auth';
import { validateWaterfallCalculation, validateHypotheticalScenarios } from '../middleware/validation';

const router = Router();
const waterfallController = new WaterfallController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/waterfall/calculate
 * @desc Calculate waterfall distribution
 * @access Private
 */
router.post('/calculate', validateWaterfallCalculation, waterfallController.calculateWaterfall);

/**
 * @route GET /api/waterfall/:id
 * @desc Get waterfall calculation by ID
 * @access Private
 */
router.get('/:id', waterfallController.getWaterfallCalculation);

/**
 * @route GET /api/waterfall/fund/:fundId
 * @desc Get all waterfall calculations for a fund
 * @access Private
 */
router.get('/fund/:fundId', waterfallController.getFundWaterfallCalculations);

/**
 * @route POST /api/waterfall/hypothetical
 * @desc Create hypothetical waterfall scenarios
 * @access Private
 */
router.post('/hypothetical', validateHypotheticalScenarios, waterfallController.createHypotheticalScenarios);

/**
 * @route GET /api/waterfall/:calculationId/audit
 * @desc Get audit trail for calculation
 * @access Private
 */
router.get('/:calculationId/audit', waterfallController.getAuditTrail);

/**
 * @route GET /api/waterfall/:calculationId/validate
 * @desc Validate waterfall calculation
 * @access Private
 */
router.get('/:calculationId/validate', waterfallController.validateCalculation);

/**
 * @route GET /api/waterfall/:calculationId/distributions
 * @desc Get distribution events for calculation
 * @access Private
 */
router.get('/:calculationId/distributions', waterfallController.getDistributionEvents);

/**
 * @route PUT /api/waterfall/distribution/:eventId/status
 * @desc Update distribution event status
 * @access Private
 */
router.put('/distribution/:eventId/status', waterfallController.updateDistributionEventStatus);

/**
 * @route POST /api/waterfall/:calculationId/approve
 * @desc Approve waterfall calculation
 * @access Private
 */
router.post('/:calculationId/approve', waterfallController.approveCalculation);

/**
 * @route GET /api/waterfall/:calculationId/allocation-summary
 * @desc Get allocation summary for calculation
 * @access Private
 */
router.get('/:calculationId/allocation-summary', waterfallController.getAllocationSummary);

/**
 * @route POST /api/waterfall/preferred-return/calculate
 * @desc Calculate preferred return only
 * @access Private
 */
router.post('/preferred-return/calculate', waterfallController.calculatePreferredReturn);

/**
 * @route POST /api/waterfall/carried-interest/calculate
 * @desc Calculate carried interest only
 * @access Private
 */
router.post('/carried-interest/calculate', waterfallController.calculateCarriedInterest);

export default router;