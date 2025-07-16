import { Decimal } from 'decimal.js';
import { Op } from 'sequelize';
import FeeCalculation from '../models/FeeCalculation';
import FeeBasis from '../models/FeeBasis';
import FeeOffset from '../models/FeeOffset';
import FeeWaiver from '../models/FeeWaiver';
import Fund from '../models/Fund';
import Commitment from '../models/Commitment';

interface ManagementFeeCalculationParams {
  fundId: number;
  periodStartDate: Date;
  periodEndDate: Date;
  basisType?: 'nav' | 'commitments' | 'invested_capital';
  customBasisAmount?: string;
  isAccrual?: boolean;
}

interface ManagementFeeResult {
  calculation: FeeCalculation;
  basisAmount: Decimal;
  grossFeeAmount: Decimal;
  netFeeAmount: Decimal;
  appliedOffsets: Decimal;
  appliedWaivers: Decimal;
}

class ManagementFeeService {
  /**
   * Calculate management fee for a given period
   */
  async calculateManagementFee(params: ManagementFeeCalculationParams): Promise<ManagementFeeResult> {
    const {
      fundId,
      periodStartDate,
      periodEndDate,
      basisType = 'nav',
      customBasisAmount,
      isAccrual = false
    } = params;

    // Get fund information
    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      throw new Error(`Fund with ID ${fundId} not found`);
    }

    // Determine the basis amount
    const basisAmount = customBasisAmount 
      ? new Decimal(customBasisAmount)
      : await this.getBasisAmount(fundId, basisType, periodEndDate);

    // Calculate gross management fee
    const feeRate = new Decimal(fund.managementFeeRate);
    const periodDays = this.calculatePeriodDays(periodStartDate, periodEndDate);
    const annualizedRate = this.calculateAnnualizedRate(feeRate, periodDays);
    const grossFeeAmount = basisAmount.times(annualizedRate);

    // Create fee calculation record
    const calculation = await FeeCalculation.create({
      fundId,
      periodStartDate,
      periodEndDate,
      calculationDate: new Date(),
      feeType: 'management',
      basis: basisType,
      basisAmount: basisAmount.toString(),
      feeRate: feeRate.toString(),
      grossFeeAmount: grossFeeAmount.toString(),
      netFeeAmount: grossFeeAmount.toString(), // Will be updated after offsets/waivers
      isAccrual,
      description: `Management fee for ${periodStartDate.toISOString().split('T')[0]} to ${periodEndDate.toISOString().split('T')[0]}`,
      calculationMethod: 'time_weighted',
      metadata: {
        periodDays,
        annualizedRate: annualizedRate.toString(),
        basisType,
      },
    });

    // Apply offsets and waivers
    const { netAmount, totalOffsets, totalWaivers } = await this.applyOffsetsAndWaivers(
      calculation.id,
      grossFeeAmount
    );

    // Update net fee amount
    await calculation.update({ netFeeAmount: netAmount.toString() });

    return {
      calculation,
      basisAmount,
      grossFeeAmount,
      netFeeAmount: netAmount,
      appliedOffsets: totalOffsets,
      appliedWaivers: totalWaivers,
    };
  }

  /**
   * Calculate management fee with time-weighted basis
   */
  async calculateTimeWeightedManagementFee(params: ManagementFeeCalculationParams): Promise<ManagementFeeResult> {
    const { fundId, periodStartDate, periodEndDate, basisType = 'nav' } = params;

    // Get basis amounts at different points in the period
    const basisPoints = await this.getBasisPointsForPeriod(fundId, basisType, periodStartDate, periodEndDate);
    
    if (basisPoints.length === 0) {
      throw new Error('No basis data available for the specified period');
    }

    let timeWeightedBasis = new Decimal(0);
    const totalPeriodDays = this.calculatePeriodDays(periodStartDate, periodEndDate);

    // Calculate time-weighted average basis
    for (let i = 0; i < basisPoints.length; i++) {
      const currentPoint = basisPoints[i];
      const nextPoint = basisPoints[i + 1];
      
      const endDate = nextPoint ? nextPoint.asOfDate : periodEndDate;
      const days = this.calculatePeriodDays(currentPoint.asOfDate, endDate);
      const weight = new Decimal(days).dividedBy(totalPeriodDays);
      
      timeWeightedBasis = timeWeightedBasis.plus(
        currentPoint.adjustedBasisAmountDecimal.times(weight)
      );
    }

    return this.calculateManagementFee({
      ...params,
      customBasisAmount: timeWeightedBasis.toString(),
    });
  }

  /**
   * Create management fee true-up calculation
   */
  async createTrueUp(
    originalCalculationId: number,
    actualBasisAmount: string,
    reason: string
  ): Promise<FeeCalculation> {
    const originalCalculation = await FeeCalculation.findByPk(originalCalculationId);
    if (!originalCalculation) {
      throw new Error('Original calculation not found');
    }

    const originalBasis = originalCalculation.basisAmountDecimal;
    const actualBasis = new Decimal(actualBasisAmount);
    const feeRate = originalCalculation.feeRateDecimal;

    const basisDifference = actualBasis.minus(originalBasis);
    const periodDays = this.calculatePeriodDays(
      originalCalculation.periodStartDate,
      originalCalculation.periodEndDate
    );
    const annualizedRate = this.calculateAnnualizedRate(feeRate, periodDays);
    const trueUpAmount = basisDifference.times(annualizedRate);

    return await FeeCalculation.create({
      fundId: originalCalculation.fundId,
      periodStartDate: originalCalculation.periodStartDate,
      periodEndDate: originalCalculation.periodEndDate,
      calculationDate: new Date(),
      feeType: 'management',
      basis: originalCalculation.basis,
      basisAmount: basisDifference.toString(),
      feeRate: feeRate.toString(),
      grossFeeAmount: trueUpAmount.toString(),
      netFeeAmount: trueUpAmount.toString(),
      isAccrual: originalCalculation.isAccrual,
      description: `Management fee true-up: ${reason}`,
      calculationMethod: 'true_up',
      metadata: {
        originalCalculationId,
        originalBasis: originalBasis.toString(),
        actualBasis: actualBasis.toString(),
        reason,
      },
    });
  }

  /**
   * Get basis amount for fee calculation
   */
  private async getBasisAmount(
    fundId: number,
    basisType: 'nav' | 'commitments' | 'invested_capital',
    asOfDate: Date
  ): Promise<Decimal> {
    let basisAmount: Decimal;

    if (basisType === 'commitments') {
      // Calculate total commitments as of date
      const commitments = await Commitment.findAll({
        where: {
          fundId,
          createdAt: { [Op.lte]: asOfDate },
        },
      });

      basisAmount = commitments.reduce(
        (sum, commitment) => sum.plus(new Decimal(commitment.commitmentAmount)),
        new Decimal(0)
      );
    } else {
      // Get from fee basis table
      const feeBasis = await FeeBasis.getLatestBasis(fundId, basisType, asOfDate);
      
      if (!feeBasis) {
        throw new Error(`No ${basisType} basis data found for fund ${fundId} as of ${asOfDate}`);
      }

      basisAmount = feeBasis.adjustedBasisAmountDecimal;
    }

    return basisAmount;
  }

  /**
   * Get basis points for time-weighted calculation
   */
  private async getBasisPointsForPeriod(
    fundId: number,
    basisType: 'nav' | 'commitments' | 'invested_capital',
    startDate: Date,
    endDate: Date
  ): Promise<FeeBasis[]> {
    return await FeeBasis.findAll({
      where: {
        fundId,
        basisType,
        asOfDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['as_of_date', 'ASC']],
    });
  }

  /**
   * Apply fee offsets and waivers
   */
  private async applyOffsetsAndWaivers(
    calculationId: number,
    grossAmount: Decimal
  ): Promise<{ netAmount: Decimal; totalOffsets: Decimal; totalWaivers: Decimal }> {
    const offsets = await FeeOffset.findAll({
      where: {
        feeCalculationId: calculationId,
        isApproved: true,
      },
    });

    const waivers = await FeeWaiver.findAll({
      where: {
        feeCalculationId: calculationId,
        isApproved: true,
        isActive: true,
      },
    });

    const totalOffsets = offsets.reduce(
      (sum, offset) => sum.plus(offset.offsetAmountDecimal),
      new Decimal(0)
    );

    const totalWaivers = waivers.reduce(
      (sum, waiver) => sum.plus(waiver.calculateWaiverAmount(grossAmount.toString())),
      new Decimal(0)
    );

    const netAmount = grossAmount.minus(totalOffsets).minus(totalWaivers);

    return {
      netAmount: netAmount.isPositive() ? netAmount : new Decimal(0),
      totalOffsets,
      totalWaivers,
    };
  }

  /**
   * Calculate number of days in period
   */
  private calculatePeriodDays(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Calculate annualized rate for period
   */
  private calculateAnnualizedRate(annualRate: Decimal, periodDays: number): Decimal {
    return annualRate.times(periodDays).dividedBy(365);
  }

  /**
   * Get management fee calculations for a fund
   */
  async getFeeCalculations(
    fundId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<FeeCalculation[]> {
    const whereClause: any = {
      fundId,
      feeType: 'management',
    };

    if (startDate || endDate) {
      whereClause.periodStartDate = {};
      if (startDate) whereClause.periodStartDate[Op.gte] = startDate;
      if (endDate) whereClause.periodStartDate[Op.lte] = endDate;
    }

    return await FeeCalculation.findAll({
      where: whereClause,
      include: [
        { model: FeeOffset, as: 'offsets' },
        { model: FeeWaiver, as: 'waivers' },
      ],
      order: [['period_start_date', 'DESC']],
    });
  }

  /**
   * Post management fee calculation
   */
  async postFeeCalculation(calculationId: number): Promise<FeeCalculation> {
    const calculation = await FeeCalculation.findByPk(calculationId);
    if (!calculation) {
      throw new Error('Fee calculation not found');
    }

    if (calculation.status !== 'calculated') {
      throw new Error('Fee calculation has already been posted');
    }

    await calculation.update({ status: 'posted' });
    return calculation;
  }

  /**
   * Reverse management fee calculation
   */
  async reverseFeeCalculation(
    calculationId: number,
    reason: string
  ): Promise<FeeCalculation> {
    const calculation = await FeeCalculation.findByPk(calculationId);
    if (!calculation) {
      throw new Error('Fee calculation not found');
    }

    await calculation.update({
      status: 'reversed',
      metadata: {
        ...calculation.metadata,
        reversalReason: reason,
        reversedAt: new Date().toISOString(),
      },
    });

    return calculation;
  }
}

export default ManagementFeeService;