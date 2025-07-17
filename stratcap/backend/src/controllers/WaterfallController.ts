import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Decimal } from 'decimal.js';
import WaterfallCalculationService from '../services/WaterfallCalculationService';
import PreferredReturnService from '../services/PreferredReturnService';
import CarriedInterestService from '../services/CarriedInterestService';
import TierAuditService from '../services/TierAuditService';
import DistributionAllocationService from '../services/DistributionAllocationService';
import WaterfallCalculation from '../models/WaterfallCalculation';
import WaterfallTier from '../models/WaterfallTier';
import DistributionEvent from '../models/DistributionEvent';
import TierAudit from '../models/TierAudit';
import Fund from '../models/Fund';

class WaterfallController {
  private waterfallService: WaterfallCalculationService;
  private preferredReturnService: PreferredReturnService;
  private carriedInterestService: CarriedInterestService;
  private tierAuditService: TierAuditService;
  private distributionAllocationService: DistributionAllocationService;

  constructor() {
    this.waterfallService = new WaterfallCalculationService();
    this.preferredReturnService = new PreferredReturnService();
    this.carriedInterestService = new CarriedInterestService();
    this.tierAuditService = new TierAuditService();
    this.distributionAllocationService = new DistributionAllocationService();
  }

  /**
   * Calculate waterfall distribution
   */
  calculateWaterfall = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        fundId,
        distributionAmount,
        distributionDate,
        calculationType = 'distribution',
        capitalActivityId,
        customTiers,
      } = req.body;

      // Validate inputs
      if (!fundId || !distributionAmount || !distributionDate) {
        res.status(400).json({
          error: 'Missing required fields: fundId, distributionAmount, distributionDate',
        });
        return;
      }

      // Validate fund exists
      const fund = await Fund.findByPk(fundId);
      if (!fund) {
        res.status(404).json({
          error: `Fund with ID ${fundId} not found`,
        });
        return;
      }

      // Validate distribution amount
      const distributionDecimal = new Decimal(distributionAmount);
      if (distributionDecimal.lte(0)) {
        res.status(400).json({
          error: 'Distribution amount must be greater than 0',
        });
        return;
      }

      // Calculate waterfall
      const result = await this.waterfallService.calculateWaterfall({
        fundId: parseInt(fundId),
        distributionAmount: distributionDecimal,
        distributionDate: new Date(distributionDate),
        calculationType,
        capitalActivityId,
        userId: req.user?.id || 1, // Get from authenticated user
        customTiers,
      });

      // Validate calculation
      const validation = this.waterfallService.validateCalculation(result);

      res.status(201).json({
        success: true,
        data: {
          calculation: result.calculation,
          tiers: result.tiers,
          distributions: result.distributions,
          summary: {
            totalDistributed: result.summary.totalDistributed.toString(),
            returnOfCapital: result.summary.returnOfCapital.toString(),
            capitalGains: result.summary.capitalGains.toString(),
            preferredReturnPaid: result.summary.preferredReturnPaid.toString(),
            carriedInterestAmount: result.summary.carriedInterestAmount.toString(),
            lpTotalDistribution: result.summary.lpTotalDistribution.toString(),
            gpTotalDistribution: result.summary.gpTotalDistribution.toString(),
          },
          validation,
          auditTrailCount: result.auditTrail.length,
        },
        message: 'Waterfall calculation completed successfully',
      });
    } catch (error) {
      console.error('Waterfall calculation error:', error);
      res.status(500).json({
        error: 'Internal server error during waterfall calculation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get waterfall calculation by ID
   */
  getWaterfallCalculation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const calculation = await WaterfallCalculation.findByPk(id, {
        include: [
          {
            model: WaterfallTier,
            as: 'tiers',
            order: [['tierLevel', 'ASC']],
          },
          {
            model: DistributionEvent,
            as: 'distributionEvents',
            include: ['investor', 'commitment'],
          },
          {
            model: TierAudit,
            as: 'tierAudits',
            order: [['stepNumber', 'ASC']],
          },
          { model: Fund, as: 'fund' },
        ],
      });

      if (!calculation) {
        res.status(404).json({
          error: `Waterfall calculation with ID ${id} not found`,
        });
        return;
      }

      res.json({
        success: true,
        data: calculation,
      });
    } catch (error) {
      console.error('Error fetching waterfall calculation:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get all waterfall calculations for a fund
   */
  getFundWaterfallCalculations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { status, calculationType, page = 1, limit = 10 } = req.query;

      const whereClause: any = { fundId: parseInt(fundId) };
      
      if (status) {
        whereClause.status = status;
      }
      
      if (calculationType) {
        whereClause.calculationType = calculationType;
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const { rows: calculations, count } = await WaterfallCalculation.findAndCountAll({
        where: whereClause,
        include: [
          { model: Fund, as: 'fund' },
          { model: WaterfallTier, as: 'tiers' },
        ],
        order: [['calculationDate', 'DESC']],
        limit: parseInt(limit as string),
        offset,
      });

      res.json({
        success: true,
        data: {
          calculations,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: count,
            pages: Math.ceil(count / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching fund waterfall calculations:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Create hypothetical waterfall scenarios
   */
  createHypotheticalScenarios = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { fundId, scenarios } = req.body;

      if (!fundId || !scenarios || !Array.isArray(scenarios)) {
        res.status(400).json({
          error: 'Missing required fields: fundId, scenarios (array)',
        });
        return;
      }

      // Validate scenarios
      for (const scenario of scenarios) {
        if (!scenario.distributionAmount || !scenario.date) {
          res.status(400).json({
            error: 'Each scenario must have distributionAmount and date',
          });
          return;
        }
      }

      // Convert scenarios to proper format
      const formattedScenarios = scenarios.map(scenario => ({
        distributionAmount: new Decimal(scenario.distributionAmount),
        date: new Date(scenario.date),
      }));

      const results = await this.waterfallService.createHypotheticalScenario(
        parseInt(fundId),
        formattedScenarios,
        req.user?.id || 1
      );

      const formattedResults = results.map(result => ({
        calculation: result.calculation,
        summary: {
          totalDistributed: result.summary.totalDistributed.toString(),
          returnOfCapital: result.summary.returnOfCapital.toString(),
          capitalGains: result.summary.capitalGains.toString(),
          preferredReturnPaid: result.summary.preferredReturnPaid.toString(),
          carriedInterestAmount: result.summary.carriedInterestAmount.toString(),
          lpTotalDistribution: result.summary.lpTotalDistribution.toString(),
          gpTotalDistribution: result.summary.gpTotalDistribution.toString(),
        },
        tierCount: result.tiers.length,
        distributionEventCount: result.distributions.length,
      }));

      res.status(201).json({
        success: true,
        data: {
          scenarioResults: formattedResults,
          scenarioCount: results.length,
        },
        message: 'Hypothetical scenarios calculated successfully',
      });
    } catch (error) {
      console.error('Error creating hypothetical scenarios:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get audit trail for calculation
   */
  getAuditTrail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { calculationId } = req.params;
      const { format = 'summary' } = req.query;

      if (format === 'detailed') {
        const auditTrail = await this.tierAuditService.exportAuditTrail(parseInt(calculationId));
        res.json({
          success: true,
          data: auditTrail,
        });
      } else {
        const summary = await this.tierAuditService.generateAuditSummary(parseInt(calculationId));
        res.json({
          success: true,
          data: summary,
        });
      }
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Validate waterfall calculation
   */
  validateCalculation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { calculationId } = req.params;

      const validation = await this.tierAuditService.validateWaterfallCalculation(
        parseInt(calculationId)
      );

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      console.error('Error validating calculation:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get distribution events for calculation
   */
  getDistributionEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { calculationId } = req.params;
      const { investorId, eventType, status } = req.query;

      const whereClause: any = { waterfallCalculationId: parseInt(calculationId) };
      
      if (investorId) {
        whereClause.investorEntityId = parseInt(investorId as string);
      }
      
      if (eventType) {
        whereClause.eventType = eventType;
      }
      
      if (status) {
        whereClause.paymentStatus = status;
      }

      const events = await DistributionEvent.findAll({
        where: whereClause,
        include: [
          { model: InvestorEntity, as: 'investor' },
          { model: Commitment, as: 'commitment' },
        ],
        order: [['investorEntityId', 'ASC'], ['eventType', 'ASC']],
      });

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      console.error('Error fetching distribution events:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Update distribution event status
   */
  updateDistributionEventStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;
      const { status, paymentDate, paymentReference, notes } = req.body;

      const validStatuses = ['pending', 'processed', 'paid', 'failed'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      const event = await DistributionEvent.findByPk(eventId);
      if (!event) {
        res.status(404).json({
          error: `Distribution event with ID ${eventId} not found`,
        });
        return;
      }

      const updateData: any = { paymentStatus: status };
      
      if (paymentDate) {
        updateData.paymentDate = new Date(paymentDate);
      }
      
      if (paymentReference) {
        updateData.paymentReference = paymentReference;
      }
      
      if (notes) {
        updateData.processingNotes = notes;
      }

      await event.update(updateData);

      res.json({
        success: true,
        data: event,
        message: 'Distribution event status updated successfully',
      });
    } catch (error) {
      console.error('Error updating distribution event status:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Approve waterfall calculation
   */
  approveCalculation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { calculationId } = req.params;
      const { approvalNotes } = req.body;

      const calculation = await WaterfallCalculation.findByPk(calculationId);
      if (!calculation) {
        res.status(404).json({
          error: `Waterfall calculation with ID ${calculationId} not found`,
        });
        return;
      }

      if (calculation.status !== 'calculated') {
        res.status(400).json({
          error: 'Only calculated waterfall calculations can be approved',
        });
        return;
      }

      // Validate calculation before approval
      const validation = await this.tierAuditService.validateWaterfallCalculation(
        parseInt(calculationId)
      );

      if (!validation.isValid) {
        res.status(400).json({
          error: 'Cannot approve calculation with validation errors',
          validationErrors: validation.issues,
        });
        return;
      }

      await calculation.update({
        status: 'approved',
        approvedBy: req.user?.id || 1,
        approvedAt: new Date(),
        metadata: {
          ...calculation.metadata,
          approvalNotes,
          approvalTimestamp: new Date().toISOString(),
        },
      });

      res.json({
        success: true,
        data: calculation,
        message: 'Waterfall calculation approved successfully',
      });
    } catch (error) {
      console.error('Error approving calculation:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get allocation summary for calculation
   */
  getAllocationSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { calculationId } = req.params;

      const summary = await this.distributionAllocationService.createAllocationSummary(
        parseInt(calculationId)
      );

      const formattedSummary = {
        totalDistributed: summary.totalDistributed.toString(),
        lpTotal: summary.lpTotal.toString(),
        gpTotal: summary.gpTotal.toString(),
        investorBreakdown: summary.investorBreakdown.map(investor => ({
          ...investor,
          totalDistribution: investor.totalDistribution.toString(),
          eventBreakdown: investor.eventBreakdown.map(event => ({
            ...event,
            amount: event.amount.toString(),
            percentage: event.percentage.toString(),
          })),
        })),
        tierSummary: summary.tierSummary.map(tier => ({
          ...tier,
          totalDistributed: tier.totalDistributed.toString(),
          lpAmount: tier.lpAmount.toString(),
          gpAmount: tier.gpAmount.toString(),
        })),
      };

      res.json({
        success: true,
        data: formattedSummary,
      });
    } catch (error) {
      console.error('Error fetching allocation summary:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Calculate preferred return only
   */
  calculatePreferredReturn = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        capitalBase,
        annualRate,
        daysSinceContribution,
        previousPreferredPaid = '0',
        availableAmount,
      } = req.body;

      if (!capitalBase || !annualRate || daysSinceContribution === undefined || !availableAmount) {
        res.status(400).json({
          error: 'Missing required fields: capitalBase, annualRate, daysSinceContribution, availableAmount',
        });
        return;
      }

      const result = await this.preferredReturnService.calculatePreferredReturn(
        new Decimal(capitalBase),
        new Decimal(annualRate),
        parseInt(daysSinceContribution),
        new Decimal(previousPreferredPaid),
        new Decimal(availableAmount)
      );

      res.json({
        success: true,
        data: {
          accruedAmount: result.accruedAmount.toString(),
          amountToDistribute: result.amountToDistribute.toString(),
          remainingAccrual: result.remainingAccrual.toString(),
          calculations: result.calculations,
        },
      });
    } catch (error) {
      console.error('Error calculating preferred return:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Calculate carried interest only
   */
  calculateCarriedInterest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        distributionAmount,
        carriedInterestRate,
        totalReturned,
        totalContributions,
        hurdleRate,
        previousCarriedPaid,
      } = req.body;

      if (!distributionAmount || !carriedInterestRate || !totalReturned || !totalContributions) {
        res.status(400).json({
          error: 'Missing required fields: distributionAmount, carriedInterestRate, totalReturned, totalContributions',
        });
        return;
      }

      const result = await this.carriedInterestService.calculateCarriedInterest(
        new Decimal(distributionAmount),
        new Decimal(carriedInterestRate),
        new Decimal(totalReturned),
        new Decimal(totalContributions),
        hurdleRate ? new Decimal(hurdleRate) : undefined,
        previousCarriedPaid ? new Decimal(previousCarriedPaid) : undefined
      );

      res.json({
        success: true,
        data: {
          carriedInterestEarned: result.carriedInterestEarned.toString(),
          amountToDistribute: result.amountToDistribute.toString(),
          lpAmount: result.lpAmount.toString(),
          gpAmount: result.gpAmount.toString(),
          calculations: result.calculations,
        },
      });
    } catch (error) {
      console.error('Error calculating carried interest:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

// Import required models at the end to avoid circular dependencies
import InvestorEntity from '../models/InvestorEntity';
import Commitment from '../models/Commitment';

export default WaterfallController;