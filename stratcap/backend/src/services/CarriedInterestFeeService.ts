import { Decimal } from 'decimal.js';
import { Op } from 'sequelize';
import FeeCalculation from '../models/FeeCalculation';
import Fund from '../models/Fund';
import Investment from '../models/Investment';
import CapitalActivity from '../models/CapitalActivity';

interface CarriedInterestCalculationParams {
  fundId: number;
  asOfDate: Date;
  distributionAmount?: string;
  useAccrualMethod?: boolean;
}

interface CarriedInterestResult {
  calculation: FeeCalculation;
  totalReturns: Decimal;
  preferredReturn: Decimal;
  excessReturns: Decimal;
  carriedInterestAmount: Decimal;
  carriedInterestRate: Decimal;
}

interface InvestmentPerformance {
  investment: Investment;
  totalInvested: Decimal;
  totalRealized: Decimal;
  unrealizedValue: Decimal;
  totalReturn: Decimal;
  returnMultiple: Decimal;
  irr: Decimal;
}

class CarriedInterestFeeService {
  /**
   * Calculate carried interest fee
   */
  async calculateCarriedInterest(params: CarriedInterestCalculationParams): Promise<CarriedInterestResult> {
    const { fundId, asOfDate, distributionAmount, useAccrualMethod = false } = params;

    // Get fund information
    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      throw new Error(`Fund with ID ${fundId} not found`);
    }

    // Calculate fund performance
    const fundPerformance = await this.calculateFundPerformance(fundId, asOfDate);
    
    // Calculate preferred return
    const preferredReturn = await this.calculatePreferredReturn(fundId, asOfDate);
    
    // Calculate excess returns
    const excessReturns = fundPerformance.totalReturn.minus(preferredReturn);
    
    // Calculate carried interest
    const carriedInterestRate = new Decimal(fund.carriedInterestRate);
    const carriedInterestAmount = excessReturns.isPositive() 
      ? excessReturns.times(carriedInterestRate)
      : new Decimal(0);

    // Create fee calculation record
    const calculation = await FeeCalculation.create({
      fundId,
      periodStartDate: new Date(fund.createdAt), // Fund inception
      periodEndDate: asOfDate,
      calculationDate: new Date(),
      feeType: 'carried_interest',
      basis: 'distributions',
      basisAmount: fundPerformance.totalReturn.toString(),
      feeRate: carriedInterestRate.toString(),
      grossFeeAmount: carriedInterestAmount.toString(),
      netFeeAmount: carriedInterestAmount.toString(),
      isAccrual: useAccrualMethod,
      description: `Carried interest calculation as of ${asOfDate.toISOString().split('T')[0]}`,
      calculationMethod: useAccrualMethod ? 'accrual' : 'cash',
      metadata: {
        totalReturns: fundPerformance.totalReturn.toString(),
        preferredReturn: preferredReturn.toString(),
        excessReturns: excessReturns.toString(),
        distributionAmount: distributionAmount || '0',
        returnMultiple: fundPerformance.returnMultiple.toString(),
        investmentCount: fundPerformance.investments.length,
      },
    });

    return {
      calculation,
      totalReturns: fundPerformance.totalReturn,
      preferredReturn,
      excessReturns,
      carriedInterestAmount,
      carriedInterestRate,
    };
  }

  /**
   * Calculate carried interest on distribution
   */
  async calculateCarriedInterestOnDistribution(
    fundId: number,
    distributionAmount: string,
    distributionDate: Date
  ): Promise<CarriedInterestResult> {
    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      throw new Error(`Fund with ID ${fundId} not found`);
    }

    // Get current fund performance
    const fundPerformance = await this.calculateFundPerformance(fundId, distributionDate);
    
    // Add the distribution to total returns
    const distributionDecimal = new Decimal(distributionAmount);
    const totalReturnsWithDistribution = fundPerformance.totalReturn.plus(distributionDecimal);
    
    // Calculate preferred return
    const preferredReturn = await this.calculatePreferredReturn(fundId, distributionDate);
    
    // Calculate excess returns
    const excessReturns = totalReturnsWithDistribution.minus(preferredReturn);
    
    // Calculate carried interest
    const carriedInterestRate = new Decimal(fund.carriedInterestRate);
    const carriedInterestAmount = excessReturns.isPositive() 
      ? excessReturns.times(carriedInterestRate)
      : new Decimal(0);

    // Create fee calculation record
    const calculation = await FeeCalculation.create({
      fundId,
      periodStartDate: new Date(fund.createdAt),
      periodEndDate: distributionDate,
      calculationDate: new Date(),
      feeType: 'carried_interest',
      basis: 'distributions',
      basisAmount: totalReturnsWithDistribution.toString(),
      feeRate: carriedInterestRate.toString(),
      grossFeeAmount: carriedInterestAmount.toString(),
      netFeeAmount: carriedInterestAmount.toString(),
      isAccrual: false,
      description: `Carried interest on distribution of ${distributionAmount}`,
      calculationMethod: 'distribution_triggered',
      metadata: {
        distributionAmount: distributionAmount,
        totalReturnsWithDistribution: totalReturnsWithDistribution.toString(),
        preferredReturn: preferredReturn.toString(),
        excessReturns: excessReturns.toString(),
      },
    });

    return {
      calculation,
      totalReturns: totalReturnsWithDistribution,
      preferredReturn,
      excessReturns,
      carriedInterestAmount,
      carriedInterestRate,
    };
  }

  /**
   * Calculate fund performance metrics
   */
  private async calculateFundPerformance(fundId: number, asOfDate: Date): Promise<{
    totalInvested: Decimal;
    totalRealized: Decimal;
    unrealizedValue: Decimal;
    totalReturn: Decimal;
    returnMultiple: Decimal;
    investments: InvestmentPerformance[];
  }> {
    const investments = await Investment.findAll({
      where: {
        fundId,
        createdAt: { [Op.lte]: asOfDate },
      },
      include: [
        {
          model: CapitalActivity,
          as: 'capitalActivities',
          where: {
            activityDate: { [Op.lte]: asOfDate },
          },
          required: false,
        },
      ],
    });

    let totalInvested = new Decimal(0);
    let totalRealized = new Decimal(0);
    let unrealizedValue = new Decimal(0);
    const investmentPerformances: InvestmentPerformance[] = [];

    for (const investment of investments) {
      const performance = await this.calculateInvestmentPerformance(investment, asOfDate);
      investmentPerformances.push(performance);
      
      totalInvested = totalInvested.plus(performance.totalInvested);
      totalRealized = totalRealized.plus(performance.totalRealized);
      unrealizedValue = unrealizedValue.plus(performance.unrealizedValue);
    }

    const totalReturn = totalRealized.plus(unrealizedValue);
    const returnMultiple = totalInvested.isZero() ? new Decimal(0) : totalReturn.dividedBy(totalInvested);

    return {
      totalInvested,
      totalRealized,
      unrealizedValue,
      totalReturn,
      returnMultiple,
      investments: investmentPerformances,
    };
  }

  /**
   * Calculate individual investment performance
   */
  private async calculateInvestmentPerformance(
    investment: Investment,
    asOfDate: Date
  ): Promise<InvestmentPerformance> {
    const capitalActivities = await CapitalActivity.findAll({
      where: {
        investmentId: investment.id,
        activityDate: { [Op.lte]: asOfDate },
      },
      order: [['activity_date', 'ASC']],
    });

    let totalInvested = new Decimal(0);
    let totalRealized = new Decimal(0);

    for (const activity of capitalActivities) {
      if (activity.type === 'investment' || activity.type === 'follow_on') {
        totalInvested = totalInvested.plus(activity.amountDecimal);
      } else if (activity.type === 'distribution' || activity.type === 'exit') {
        totalRealized = totalRealized.plus(activity.amountDecimal);
      }
    }

    // Get current unrealized value (this would typically come from valuation data)
    const unrealizedValue = investment.currentValueDecimal || new Decimal(0);
    const totalReturn = totalRealized.plus(unrealizedValue);
    const returnMultiple = totalInvested.isZero() ? new Decimal(0) : totalReturn.dividedBy(totalInvested);

    // Calculate IRR (simplified calculation - in practice would use XIRR)
    const irr = this.calculateSimpleIRR(capitalActivities, unrealizedValue, asOfDate);

    return {
      investment,
      totalInvested,
      totalRealized,
      unrealizedValue,
      totalReturn,
      returnMultiple,
      irr,
    };
  }

  /**
   * Calculate preferred return for the fund
   */
  private async calculatePreferredReturn(fundId: number, asOfDate: Date): Promise<Decimal> {
    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      throw new Error(`Fund with ID ${fundId} not found`);
    }

    // Get all capital calls (investor contributions)
    const capitalCalls = await CapitalActivity.findAll({
      where: {
        fundId,
        type: ['capital_call', 'initial_closing'],
        activityDate: { [Op.lte]: asOfDate },
      },
      order: [['activity_date', 'ASC']],
    });

    const preferredReturnRate = new Decimal(fund.preferredReturnRate);
    let preferredReturn = new Decimal(0);

    for (const capitalCall of capitalCalls) {
      const capitalAmount = capitalCall.amountDecimal;
      const daysInvested = this.calculateDaysBetween(capitalCall.activityDate, asOfDate);
      const yearlyReturn = capitalAmount.times(preferredReturnRate);
      const periodReturn = yearlyReturn.times(daysInvested).dividedBy(365);
      
      preferredReturn = preferredReturn.plus(periodReturn);
    }

    return preferredReturn;
  }

  /**
   * Calculate simple IRR (basic approximation)
   */
  private calculateSimpleIRR(
    capitalActivities: CapitalActivity[],
    unrealizedValue: Decimal,
    asOfDate: Date
  ): Decimal {
    if (capitalActivities.length === 0) {
      return new Decimal(0);
    }

    let totalInvested = new Decimal(0);
    let totalRealized = new Decimal(0);
    let weightedDays = new Decimal(0);

    for (const activity of capitalActivities) {
      const days = this.calculateDaysBetween(activity.activityDate, asOfDate);
      
      if (activity.type === 'investment' || activity.type === 'follow_on') {
        totalInvested = totalInvested.plus(activity.amountDecimal);
        weightedDays = weightedDays.plus(new Decimal(days).times(activity.amountDecimal));
      } else if (activity.type === 'distribution' || activity.type === 'exit') {
        totalRealized = totalRealized.plus(activity.amountDecimal);
      }
    }

    if (totalInvested.isZero()) {
      return new Decimal(0);
    }

    const averageDays = weightedDays.dividedBy(totalInvested);
    const totalValue = totalRealized.plus(unrealizedValue);
    const returnMultiple = totalValue.dividedBy(totalInvested);
    
    // Simple annualized return approximation
    const years = averageDays.dividedBy(365);
    const irr = years.isZero() ? new Decimal(0) : returnMultiple.pow(new Decimal(1).dividedBy(years)).minus(1);

    return irr;
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
  }

  /**
   * Get historical carried interest calculations
   */
  async getCarriedInterestHistory(
    fundId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<FeeCalculation[]> {
    const whereClause: any = {
      fundId,
      feeType: 'carried_interest',
    };

    if (startDate || endDate) {
      whereClause.calculationDate = {};
      if (startDate) whereClause.calculationDate[Op.gte] = startDate;
      if (endDate) whereClause.calculationDate[Op.lte] = endDate;
    }

    return await FeeCalculation.findAll({
      where: whereClause,
      order: [['calculation_date', 'DESC']],
    });
  }

  /**
   * Calculate carried interest catch-up
   */
  async calculateCatchUp(
    fundId: number,
    totalDistributions: string,
    asOfDate: Date
  ): Promise<{
    catchUpAmount: Decimal;
    carriedInterestAmount: Decimal;
    totalCarried: Decimal;
  }> {
    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      throw new Error(`Fund with ID ${fundId} not found`);
    }

    const distributions = new Decimal(totalDistributions);
    const carriedInterestRate = new Decimal(fund.carriedInterestRate);
    const preferredReturn = await this.calculatePreferredReturn(fundId, asOfDate);

    // After preferred return, GP gets catch-up until reaching carried interest percentage
    const excessOverPreferred = distributions.minus(preferredReturn);
    
    if (excessOverPreferred.isPositive()) {
      // Calculate catch-up amount to bring GP to carried interest percentage of total distributions
      const targetCarriedInterest = distributions.times(carriedInterestRate);
      const catchUpAmount = targetCarriedInterest.minus(excessOverPreferred.times(carriedInterestRate));
      
      // Ensure catch-up doesn't exceed available excess
      const actualCatchUp = Decimal.min(catchUpAmount, excessOverPreferred);
      const carriedInterestAmount = excessOverPreferred.minus(actualCatchUp).times(carriedInterestRate);
      
      return {
        catchUpAmount: actualCatchUp,
        carriedInterestAmount,
        totalCarried: actualCatchUp.plus(carriedInterestAmount),
      };
    }

    return {
      catchUpAmount: new Decimal(0),
      carriedInterestAmount: new Decimal(0),
      totalCarried: new Decimal(0),
    };
  }

  /**
   * Post carried interest calculation
   */
  async postCarriedInterestCalculation(calculationId: number): Promise<FeeCalculation> {
    const calculation = await FeeCalculation.findByPk(calculationId);
    if (!calculation) {
      throw new Error('Carried interest calculation not found');
    }

    if (calculation.status !== 'calculated') {
      throw new Error('Carried interest calculation has already been posted');
    }

    await calculation.update({ status: 'posted' });
    return calculation;
  }
}

export default CarriedInterestFeeService;