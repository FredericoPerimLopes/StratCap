import { Request, Response } from 'express';
import ClosingWorkflowService from '../services/ClosingWorkflowService';
import { EqualizationService } from '../services/EqualizationService';

class ClosingController {
  private closingWorkflowService: ClosingWorkflowService;
  private equalizationService: EqualizationService;

  constructor() {
    this.closingWorkflowService = new ClosingWorkflowService();
    this.equalizationService = new EqualizationService();
  }

  /**
   * Initialize a new closing workflow
   */
  initializeClosing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const userId = (req as any).user?.id;
      const initialData = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const closing = await this.closingWorkflowService.initializeClosing(
        parseInt(fundId),
        userId,
        initialData
      );

      res.status(201).json({
        success: true,
        data: closing,
        message: 'Closing workflow initialized successfully',
      });
    } catch (error) {
      console.error('Error initializing closing:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize closing',
      });
    }
  };

  /**
   * Get closing workflow steps
   */
  getClosingSteps = async (req: Request, res: Response): Promise<void> => {
    try {
      const { closingId } = req.params;

      const steps = await this.closingWorkflowService.getClosingSteps(parseInt(closingId));

      res.json({
        success: true,
        data: steps,
      });
    } catch (error) {
      console.error('Error getting closing steps:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get closing steps',
      });
    }
  };

  /**
   * Update a closing workflow step
   */
  updateClosingStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const { closingId, stepNumber } = req.params;
      const userId = (req as any).user?.id;
      const stepData = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const closing = await this.closingWorkflowService.updateClosingStep(
        parseInt(closingId),
        parseInt(stepNumber),
        stepData,
        userId
      );

      res.json({
        success: true,
        data: closing,
        message: `Step ${stepNumber} updated successfully`,
      });
    } catch (error) {
      console.error('Error updating closing step:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update closing step',
      });
    }
  };

  /**
   * Get closing summary
   */
  getClosingSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { closingId } = req.params;

      const summary = await this.closingWorkflowService.getClosingSummary(parseInt(closingId));

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Error getting closing summary:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get closing summary',
      });
    }
  };

  /**
   * Validate closing for completion
   */
  validateClosing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { closingId } = req.params;

      const validation = await this.closingWorkflowService.validateClosingCompletion(parseInt(closingId));

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      console.error('Error validating closing:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate closing',
      });
    }
  };

  /**
   * Clone closing for amendment
   */
  cloneClosing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { closingId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const clonedClosing = await this.closingWorkflowService.cloneClosing(
        parseInt(closingId),
        userId
      );

      res.status(201).json({
        success: true,
        data: clonedClosing,
        message: 'Closing cloned successfully',
      });
    } catch (error) {
      console.error('Error cloning closing:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clone closing',
      });
    }
  };

  /**
   * Get closings for fund
   */
  getClosingsForFund = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { status, closingType, dateFrom, dateTo } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (closingType) filters.closingType = closingType as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const closings = await this.closingWorkflowService.getClosingsForFund(
        parseInt(fundId),
        filters
      );

      res.json({
        success: true,
        data: closings,
      });
    } catch (error) {
      console.error('Error getting closings for fund:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get closings',
      });
    }
  };

  /**
   * Calculate equalization
   */
  calculateEqualization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { startDate, endDate, interestRate, includeNonCapital } = req.body;

      // Validate parameters
      const validation = this.equalizationService.validateEqualizationParameters(
        new Date(startDate),
        new Date(endDate),
        parseFloat(interestRate)
      );

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: `Invalid parameters: ${validation.errors.join(', ')}`,
        });
        return;
      }

      const equalizationReport = await this.equalizationService.generateEqualizationReport(
        parseInt(fundId),
        new Date(startDate),
        new Date(endDate),
        parseFloat(interestRate),
        includeNonCapital || false
      );

      res.json({
        success: true,
        data: equalizationReport,
      });
    } catch (error) {
      console.error('Error calculating equalization:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate equalization',
      });
    }
  };

  /**
   * Apply equalization adjustments
   */
  applyEqualizationAdjustments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { equalizationSummary } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      await this.equalizationService.applyEqualizationAdjustments(
        parseInt(fundId),
        equalizationSummary,
        userId
      );

      res.json({
        success: true,
        message: 'Equalization adjustments applied successfully',
      });
    } catch (error) {
      console.error('Error applying equalization adjustments:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply equalization adjustments',
      });
    }
  };

  /**
   * Get recommended interest rate
   */
  getRecommendedInterestRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { effectiveDate } = req.query;
      const date = effectiveDate ? new Date(effectiveDate as string) : new Date();

      const recommendedRate = this.equalizationService.getRecommendedInterestRate(date);

      res.json({
        success: true,
        data: {
          recommendedRate,
          effectiveDate: date,
          explanation: 'Based on current market conditions and regulatory guidelines',
        },
      });
    } catch (error) {
      console.error('Error getting recommended interest rate:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get recommended interest rate',
      });
    }
  };

  /**
   * Calculate equalization interest for specific amount
   */
  calculateEqualizationInterest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { principal, interestRate, startDate, endDate } = req.body;

      const interest = this.equalizationService.calculateEqualizationInterest(
        parseFloat(principal),
        parseFloat(interestRate),
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: {
          principal: parseFloat(principal),
          interestRate: parseFloat(interestRate),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          interest: interest.toFixed(2),
          total: (parseFloat(principal) + interest).toFixed(2),
        },
      });
    } catch (error) {
      console.error('Error calculating equalization interest:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate equalization interest',
      });
    }
  };
}

export default ClosingController;