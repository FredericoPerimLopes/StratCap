import { Request, Response } from 'express';
import { Decimal } from 'decimal.js';
import ManagementFeeService from '../services/ManagementFeeService';
import CarriedInterestFeeService from '../services/CarriedInterestFeeService';
import FeeOffsetService from '../services/FeeOffsetService';
import FeeCalculation from '../models/FeeCalculation';
import FeeCharge from '../models/FeeCharge';
import FeeOffset from '../models/FeeOffset';
import FeeWaiver from '../models/FeeWaiver';
import FeeBasis from '../models/FeeBasis';

class FeeController {
  private managementFeeService: ManagementFeeService;
  private carriedInterestService: CarriedInterestFeeService;
  private offsetService: FeeOffsetService;

  constructor() {
    this.managementFeeService = new ManagementFeeService();
    this.carriedInterestService = new CarriedInterestFeeService();
    this.offsetService = new FeeOffsetService();
  }

  /**
   * Calculate management fee
   */
  calculateManagementFee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const {
        periodStartDate,
        periodEndDate,
        basisType = 'nav',
        customBasisAmount,
        isAccrual = false,
        useTimeWeighted = false,
      } = req.body;

      if (!periodStartDate || !periodEndDate) {
        res.status(400).json({
          success: false,
          message: 'Period start date and end date are required',
        });
        return;
      }

      const params = {
        fundId: parseInt(fundId),
        periodStartDate: new Date(periodStartDate),
        periodEndDate: new Date(periodEndDate),
        basisType,
        customBasisAmount,
        isAccrual,
      };

      const result = useTimeWeighted
        ? await this.managementFeeService.calculateTimeWeightedManagementFee(params)
        : await this.managementFeeService.calculateManagementFee(params);

      res.json({
        success: true,
        data: {
          calculationId: result.calculation.id,
          basisAmount: result.basisAmount.toString(),
          grossFeeAmount: result.grossFeeAmount.toString(),
          netFeeAmount: result.netFeeAmount.toString(),
          appliedOffsets: result.appliedOffsets.toString(),
          appliedWaivers: result.appliedWaivers.toString(),
          calculation: result.calculation,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Calculate carried interest
   */
  calculateCarriedInterest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const {
        asOfDate,
        distributionAmount,
        useAccrualMethod = false,
        onDistribution = false,
      } = req.body;

      if (!asOfDate) {
        res.status(400).json({
          success: false,
          message: 'As of date is required',
        });
        return;
      }

      const result = onDistribution && distributionAmount
        ? await this.carriedInterestService.calculateCarriedInterestOnDistribution(
            parseInt(fundId),
            distributionAmount,
            new Date(asOfDate)
          )
        : await this.carriedInterestService.calculateCarriedInterest({
            fundId: parseInt(fundId),
            asOfDate: new Date(asOfDate),
            distributionAmount,
            useAccrualMethod,
          });

      res.json({
        success: true,
        data: {
          calculationId: result.calculation.id,
          totalReturns: result.totalReturns.toString(),
          preferredReturn: result.preferredReturn.toString(),
          excessReturns: result.excessReturns.toString(),
          carriedInterestAmount: result.carriedInterestAmount.toString(),
          carriedInterestRate: result.carriedInterestRate.toString(),
          calculation: result.calculation,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Create management fee true-up
   */
  createManagementFeetrueUp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { calculationId } = req.params;
      const { actualBasisAmount, reason } = req.body;

      if (!actualBasisAmount || !reason) {
        res.status(400).json({
          success: false,
          message: 'Actual basis amount and reason are required',
        });
        return;
      }

      const trueUpCalculation = await this.managementFeeService.createTrueUp(
        parseInt(calculationId),
        actualBasisAmount,
        reason
      );

      res.json({
        success: true,
        data: trueUpCalculation,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Get fee calculations for a fund
   */
  getFeeCalculations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { startDate, endDate, feeType } = req.query;

      const whereClause: any = {
        fundId: parseInt(fundId),
      };

      if (feeType) {
        whereClause.feeType = feeType;
      }

      if (startDate || endDate) {
        whereClause.periodStartDate = {};
        if (startDate) whereClause.periodStartDate.gte = new Date(startDate as string);
        if (endDate) whereClause.periodStartDate.lte = new Date(endDate as string);
      }

      const calculations = await FeeCalculation.findAll({
        where: whereClause,
        include: [
          { model: FeeOffset, as: 'offsets' },
          { model: FeeWaiver, as: 'waivers' },
          { model: FeeCharge, as: 'charges' },
        ],
        order: [['period_start_date', 'DESC']],
      });

      res.json({
        success: true,
        data: calculations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Post fee calculation
   */
  postFeeCalculation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { calculationId } = req.params;

      const calculation = await this.managementFeeService.postFeeCalculation(
        parseInt(calculationId)
      );

      res.json({
        success: true,
        data: calculation,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Reverse fee calculation
   */
  reverseFeeCalculation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { calculationId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Reversal reason is required',
        });
        return;
      }

      const calculation = await this.managementFeeService.reverseFeeCalculation(
        parseInt(calculationId),
        reason
      );

      res.json({
        success: true,
        data: calculation,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Create fee offset
   */
  createFeeOffset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { calculationId } = req.params;
      const offsetData = {
        ...req.body,
        feeCalculationId: parseInt(calculationId),
      };

      const offset = await this.offsetService.createOffset(offsetData);

      res.status(201).json({
        success: true,
        data: offset,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Approve fee offset
   */
  approveFeeOffset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { offsetId } = req.params;
      const { userId } = req.body; // Should come from auth middleware in real implementation

      const offset = await this.offsetService.approveOffset(
        parseInt(offsetId),
        userId || 1 // Default user ID for demo
      );

      res.json({
        success: true,
        data: offset,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Get pending offsets
   */
  getPendingOffsets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.query;

      const offsets = await this.offsetService.getPendingOffsets(
        fundId ? parseInt(fundId as string) : undefined
      );

      res.json({
        success: true,
        data: offsets,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Get offset summary
   */
  getOffsetSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { year } = req.query;

      const summary = await this.offsetService.getOffsetSummary(
        parseInt(fundId),
        year ? parseInt(year as string) : undefined
      );

      // Convert Decimal objects to strings for JSON serialization
      const serializedSummary = {
        totalOffsets: summary.totalOffsets.toString(),
        offsetsByType: Object.fromEntries(
          Object.entries(summary.offsetsByType).map(([key, value]) => [key, value.toString()])
        ),
        offsetsByMonth: Object.fromEntries(
          Object.entries(summary.offsetsByMonth).map(([key, value]) => [key, value.toString()])
        ),
        offsetCount: summary.offsetCount,
      };

      res.json({
        success: true,
        data: serializedSummary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Create fee basis snapshot
   */
  createFeeBasisSnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { asOfDate, basisData, currency = 'USD' } = req.body;

      if (!asOfDate || !basisData) {
        res.status(400).json({
          success: false,
          message: 'As of date and basis data are required',
        });
        return;
      }

      const snapshots = await FeeBasis.createSnapshot(
        parseInt(fundId),
        new Date(asOfDate),
        basisData,
        currency
      );

      res.status(201).json({
        success: true,
        data: snapshots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Get fee basis history
   */
  getFeeBasisHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { basisType, startDate, endDate } = req.query;

      const whereClause: any = {
        fundId: parseInt(fundId),
      };

      if (basisType) {
        whereClause.basisType = basisType;
      }

      if (startDate || endDate) {
        whereClause.asOfDate = {};
        if (startDate) whereClause.asOfDate.gte = new Date(startDate as string);
        if (endDate) whereClause.asOfDate.lte = new Date(endDate as string);
      }

      const basisHistory = await FeeBasis.findAll({
        where: whereClause,
        order: [['as_of_date', 'DESC']],
      });

      res.json({
        success: true,
        data: basisHistory,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Get fee summary for dashboard
   */
  getFeeSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { year = new Date().getFullYear() } = req.query;

      const startDate = new Date(parseInt(year as string), 0, 1);
      const endDate = new Date(parseInt(year as string) + 1, 0, 1);

      // Get all fee calculations for the year
      const calculations = await FeeCalculation.findAll({
        where: {
          fundId: parseInt(fundId),
          calculationDate: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: [
          { model: FeeOffset, as: 'offsets', where: { isApproved: true }, required: false },
          { model: FeeWaiver, as: 'waivers', where: { isApproved: true }, required: false },
        ],
      });

      // Calculate summary statistics
      let totalManagementFees = new Decimal(0);
      let totalCarriedInterest = new Decimal(0);
      let totalOffsets = new Decimal(0);
      let totalWaivers = new Decimal(0);

      const monthlyData: Record<string, any> = {};

      for (const calc of calculations) {
        const amount = calc.netFeeAmountDecimal;
        const month = calc.calculationDate.toISOString().substring(0, 7);

        if (!monthlyData[month]) {
          monthlyData[month] = {
            managementFees: new Decimal(0),
            carriedInterest: new Decimal(0),
            offsets: new Decimal(0),
            waivers: new Decimal(0),
          };
        }

        if (calc.feeType === 'management') {
          totalManagementFees = totalManagementFees.plus(amount);
          monthlyData[month].managementFees = monthlyData[month].managementFees.plus(amount);
        } else if (calc.feeType === 'carried_interest') {
          totalCarriedInterest = totalCarriedInterest.plus(amount);
          monthlyData[month].carriedInterest = monthlyData[month].carriedInterest.plus(amount);
        }

        // Sum offsets and waivers
        if (calc.offsets) {
          for (const offset of calc.offsets) {
            const offsetAmount = offset.offsetAmountDecimal;
            totalOffsets = totalOffsets.plus(offsetAmount);
            monthlyData[month].offsets = monthlyData[month].offsets.plus(offsetAmount);
          }
        }

        if (calc.waivers) {
          for (const waiver of calc.waivers) {
            const waiverAmount = waiver.calculateWaiverAmount(calc.grossFeeAmount);
            totalWaivers = totalWaivers.plus(waiverAmount);
            monthlyData[month].waivers = monthlyData[month].waivers.plus(waiverAmount);
          }
        }
      }

      // Convert monthly data to strings for JSON serialization
      const serializedMonthlyData = Object.fromEntries(
        Object.entries(monthlyData).map(([month, data]) => [
          month,
          {
            managementFees: data.managementFees.toString(),
            carriedInterest: data.carriedInterest.toString(),
            offsets: data.offsets.toString(),
            waivers: data.waivers.toString(),
          },
        ])
      );

      res.json({
        success: true,
        data: {
          year: parseInt(year as string),
          summary: {
            totalManagementFees: totalManagementFees.toString(),
            totalCarriedInterest: totalCarriedInterest.toString(),
            totalOffsets: totalOffsets.toString(),
            totalWaivers: totalWaivers.toString(),
            totalNetFees: totalManagementFees.plus(totalCarriedInterest).toString(),
            calculationCount: calculations.length,
          },
          monthlyData: serializedMonthlyData,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };
}

export default FeeController;