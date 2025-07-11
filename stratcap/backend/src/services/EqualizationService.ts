import Commitment from '../models/Commitment';
import CapitalActivity from '../models/CapitalActivity';
import Transaction from '../models/Transaction';
import InvestorEntity from '../models/InvestorEntity';
import FeeCalculation from '../models/FeeCalculation';
import { Op } from 'sequelize';

export interface EqualizationCalculation {
  investorEntityId: number;
  investorName: string;
  originalCommitmentDate: Date;
  equalizationPeriod: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
  capitalContributions: {
    amount: string;
    weightedDays: number;
    equalizationInterest: string;
  };
  distributions: {
    amount: string;
    weightedDays: number;
    equalizationCredit: string;
  };
  netEqualizationAmount: string;
  details: Array<{
    date: Date;
    type: 'capital_call' | 'distribution';
    amount: string;
    days: number;
    interest: string;
  }>;
}

export interface NonCapitalEqualization {
  investorEntityId: number;
  investorName: string;
  managementFees: {
    accrued: string;
    paid: string;
    equalizationInterest: string;
  };
  carriedInterest: {
    accrued: string;
    distributed: string;
    equalizationAdjustment: string;
  };
  otherFees: {
    amount: string;
    equalizationInterest: string;
  };
  totalNonCapitalEqualization: string;
}

export interface EqualizationSummary {
  fundId: number;
  calculationDate: Date;
  equalizationPeriod: {
    startDate: Date;
    endDate: Date;
    interestRate: number;
  };
  totalInvestors: number;
  capitalEqualization: {
    totalPositive: string;
    totalNegative: string;
    netAmount: string;
    calculations: EqualizationCalculation[];
  };
  nonCapitalEqualization?: {
    totalAdjustment: string;
    calculations: NonCapitalEqualization[];
  };
}

export class EqualizationService {
  /**
   * Calculate capital equalization for all investors in a fund
   */
  async calculateCapitalEqualization(
    fundId: number,
    startDate: Date,
    endDate: Date,
    interestRate: number
  ): Promise<EqualizationSummary['capitalEqualization']> {
    // Get all commitments for the fund
    const commitments = await Commitment.findAll({
      where: { fundId },
      include: [
        { 
          model: InvestorEntity, 
          as: 'investorEntity',
          attributes: ['id', 'name'],
        },
      ],
    });

    const calculations: EqualizationCalculation[] = [];
    let totalPositive = 0;
    let totalNegative = 0;

    for (const commitment of commitments) {
      const calculation = await this.calculateInvestorCapitalEqualization(
        commitment,
        startDate,
        endDate,
        interestRate
      );
      calculations.push(calculation);

      const netAmount = parseFloat(calculation.netEqualizationAmount);
      if (netAmount > 0) {
        totalPositive += netAmount;
      } else {
        totalNegative += Math.abs(netAmount);
      }
    }

    return {
      totalPositive: totalPositive.toFixed(2),
      totalNegative: totalNegative.toFixed(2),
      netAmount: (totalPositive - totalNegative).toFixed(2),
      calculations,
    };
  }

  /**
   * Calculate capital equalization for a single investor
   */
  private async calculateInvestorCapitalEqualization(
    commitment: any,
    startDate: Date,
    endDate: Date,
    interestRate: number
  ): Promise<EqualizationCalculation> {
    const investorEntity = commitment.investorEntity;
    
    // Get all capital activities for this commitment during the period
    const transactions = await Transaction.findAll({
      where: {
        commitmentId: commitment.id,
        transactionDate: {
          [Op.between]: [startDate, endDate],
        },
        type: ['capital_call', 'distribution'],
      },
      order: [['transactionDate', 'ASC']],
    });

    const details: EqualizationCalculation['details'] = [];
    let totalCapitalInterest = 0;
    let totalDistributionCredit = 0;
    let capitalContributions = 0;
    let distributions = 0;
    let capitalWeightedDays = 0;
    let distributionWeightedDays = 0;

    const periodDays = this.calculateDaysBetween(startDate, endDate);

    for (const transaction of transactions) {
      const transactionAmount = parseFloat(transaction.amount);
      const daysFromStart = this.calculateDaysBetween(startDate, transaction.transactionDate);
      const remainingDays = periodDays - daysFromStart;
      
      // Calculate daily interest rate
      const dailyRate = interestRate / 365;
      const interest = transactionAmount * dailyRate * remainingDays;

      if (transaction.type === 'capital_call') {
        capitalContributions += transactionAmount;
        capitalWeightedDays += remainingDays;
        totalCapitalInterest += interest;
      } else if (transaction.type === 'distribution') {
        distributions += transactionAmount;
        distributionWeightedDays += remainingDays;
        totalDistributionCredit += interest;
      }

      details.push({
        date: transaction.transactionDate,
        type: transaction.type as 'capital_call' | 'distribution',
        amount: transactionAmount.toFixed(2),
        days: remainingDays,
        interest: interest.toFixed(2),
      });
    }

    // Net equalization amount (positive means investor owes, negative means fund owes)
    const netEqualizationAmount = totalCapitalInterest - totalDistributionCredit;

    return {
      investorEntityId: investorEntity.id,
      investorName: investorEntity.name,
      originalCommitmentDate: commitment.commitmentDate,
      equalizationPeriod: {
        startDate,
        endDate,
        days: periodDays,
      },
      capitalContributions: {
        amount: capitalContributions.toFixed(2),
        weightedDays: capitalWeightedDays,
        equalizationInterest: totalCapitalInterest.toFixed(2),
      },
      distributions: {
        amount: distributions.toFixed(2),
        weightedDays: distributionWeightedDays,
        equalizationCredit: totalDistributionCredit.toFixed(2),
      },
      netEqualizationAmount: netEqualizationAmount.toFixed(2),
      details,
    };
  }

  /**
   * Calculate non-capital equalization (fees, carried interest)
   */
  async calculateNonCapitalEqualization(
    fundId: number,
    startDate: Date,
    endDate: Date,
    interestRate: number
  ): Promise<EqualizationSummary['nonCapitalEqualization']> {
    // Get all commitments for the fund
    const commitments = await Commitment.findAll({
      where: { fundId },
      include: [
        { 
          model: InvestorEntity, 
          as: 'investorEntity',
          attributes: ['id', 'name'],
        },
      ],
    });

    const calculations: NonCapitalEqualization[] = [];
    let totalAdjustment = 0;

    for (const commitment of commitments) {
      const calculation = await this.calculateInvestorNonCapitalEqualization(
        commitment,
        startDate,
        endDate,
        interestRate
      );
      calculations.push(calculation);
      totalAdjustment += parseFloat(calculation.totalNonCapitalEqualization);
    }

    return {
      totalAdjustment: totalAdjustment.toFixed(2),
      calculations,
    };
  }

  /**
   * Calculate non-capital equalization for a single investor
   */
  private async calculateInvestorNonCapitalEqualization(
    commitment: any,
    startDate: Date,
    endDate: Date,
    interestRate: number
  ): Promise<NonCapitalEqualization> {
    const investorEntity = commitment.investorEntity;

    // Get fee calculations for this commitment during the period
    const feeCalculations = await FeeCalculation.findAll({
      where: {
        commitmentId: commitment.id,
        calculationDate: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    let managementFeeAccrued = 0;
    let managementFeePaid = 0;
    let carriedInterestAccrued = 0;
    let carriedInterestDistributed = 0;
    let otherFeesAmount = 0;

    // Aggregate fee data
    for (const feeCalc of feeCalculations) {
      const feeAmount = parseFloat(feeCalc.feeAmount);
      
      switch (feeCalc.feeType) {
        case 'management':
          managementFeeAccrued += feeAmount;
          if (feeCalc.status === 'paid') {
            managementFeePaid += feeAmount;
          }
          break;
        case 'carried_interest':
          carriedInterestAccrued += feeAmount;
          if (feeCalc.status === 'distributed') {
            carriedInterestDistributed += feeAmount;
          }
          break;
        default:
          otherFeesAmount += feeAmount;
          break;
      }
    }

    // Calculate equalization interest on unpaid fees
    const periodDays = this.calculateDaysBetween(startDate, endDate);
    const dailyRate = interestRate / 365;

    const managementFeeEqualization = (managementFeeAccrued - managementFeePaid) * dailyRate * periodDays;
    const carriedInterestEqualization = (carriedInterestAccrued - carriedInterestDistributed) * dailyRate * (periodDays / 2); // Average holding period
    const otherFeesEqualization = otherFeesAmount * dailyRate * periodDays;

    const totalNonCapitalEqualization = managementFeeEqualization + carriedInterestEqualization + otherFeesEqualization;

    return {
      investorEntityId: investorEntity.id,
      investorName: investorEntity.name,
      managementFees: {
        accrued: managementFeeAccrued.toFixed(2),
        paid: managementFeePaid.toFixed(2),
        equalizationInterest: managementFeeEqualization.toFixed(2),
      },
      carriedInterest: {
        accrued: carriedInterestAccrued.toFixed(2),
        distributed: carriedInterestDistributed.toFixed(2),
        equalizationAdjustment: carriedInterestEqualization.toFixed(2),
      },
      otherFees: {
        amount: otherFeesAmount.toFixed(2),
        equalizationInterest: otherFeesEqualization.toFixed(2),
      },
      totalNonCapitalEqualization: totalNonCapitalEqualization.toFixed(2),
    };
  }

  /**
   * Generate comprehensive equalization report
   */
  async generateEqualizationReport(
    fundId: number,
    startDate: Date,
    endDate: Date,
    interestRate: number,
    includeNonCapital: boolean = false
  ): Promise<EqualizationSummary> {
    const capitalEqualization = await this.calculateCapitalEqualization(
      fundId,
      startDate,
      endDate,
      interestRate
    );

    let nonCapitalEqualization;
    if (includeNonCapital) {
      nonCapitalEqualization = await this.calculateNonCapitalEqualization(
        fundId,
        startDate,
        endDate,
        interestRate
      );
    }

    return {
      fundId,
      calculationDate: new Date(),
      equalizationPeriod: {
        startDate,
        endDate,
        interestRate,
      },
      totalInvestors: capitalEqualization.calculations.length,
      capitalEqualization,
      nonCapitalEqualization,
    };
  }

  /**
   * Calculate equalization interest for a specific amount and period
   */
  calculateEqualizationInterest(
    principal: number,
    interestRate: number,
    startDate: Date,
    endDate: Date
  ): number {
    const days = this.calculateDaysBetween(startDate, endDate);
    const dailyRate = interestRate / 365;
    return principal * dailyRate * days;
  }

  /**
   * Get recommended equalization interest rate based on market conditions
   */
  getRecommendedInterestRate(effectiveDate: Date): number {
    // This would typically integrate with financial data services
    // For now, return a base rate plus spread
    const baseRate = 0.02; // 2% base rate
    const spread = 0.015;   // 1.5% spread
    return baseRate + spread; // 3.5% total
  }

  /**
   * Validate equalization parameters
   */
  validateEqualizationParameters(
    startDate: Date,
    endDate: Date,
    interestRate: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (startDate >= endDate) {
      errors.push('Start date must be before end date');
    }

    if (interestRate < 0 || interestRate > 0.25) {
      errors.push('Interest rate must be between 0% and 25%');
    }

    const periodDays = this.calculateDaysBetween(startDate, endDate);
    if (periodDays > 730) { // 2 years
      errors.push('Equalization period cannot exceed 2 years');
    }

    if (periodDays < 1) {
      errors.push('Equalization period must be at least 1 day');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Apply equalization adjustments to investor accounts
   */
  async applyEqualizationAdjustments(
    fundId: number,
    equalizationSummary: EqualizationSummary,
    appliedBy: number
  ): Promise<void> {
    // Create adjustment transactions for each investor
    for (const calc of equalizationSummary.capitalEqualization.calculations) {
      const netAmount = parseFloat(calc.netEqualizationAmount);
      
      if (Math.abs(netAmount) < 0.01) {
        continue; // Skip minimal amounts
      }

      // Find the commitment
      const commitment = await Commitment.findOne({
        where: {
          fundId,
          investorEntityId: calc.investorEntityId,
        },
      });

      if (!commitment) {
        continue;
      }

      // Create equalization transaction
      await Transaction.create({
        commitmentId: commitment.id,
        type: netAmount > 0 ? 'equalization_charge' : 'equalization_credit',
        amount: Math.abs(netAmount).toFixed(2),
        transactionDate: new Date(),
        settleDate: new Date(),
        status: 'pending',
        description: `Capital equalization adjustment for period ${equalizationSummary.equalizationPeriod.startDate.toISOString().split('T')[0]} to ${equalizationSummary.equalizationPeriod.endDate.toISOString().split('T')[0]}`,
        metadata: {
          equalizationType: 'capital',
          equalizationPeriod: equalizationSummary.equalizationPeriod,
          interestRate: equalizationSummary.equalizationPeriod.interestRate,
          appliedBy,
          appliedAt: new Date(),
        },
      });
    }

    // Apply non-capital equalization if included
    if (equalizationSummary.nonCapitalEqualization) {
      for (const calc of equalizationSummary.nonCapitalEqualization.calculations) {
        const totalAmount = parseFloat(calc.totalNonCapitalEqualization);
        
        if (Math.abs(totalAmount) < 0.01) {
          continue;
        }

        const commitment = await Commitment.findOne({
          where: {
            fundId,
            investorEntityId: calc.investorEntityId,
          },
        });

        if (!commitment) {
          continue;
        }

        await Transaction.create({
          commitmentId: commitment.id,
          type: totalAmount > 0 ? 'fee_equalization_charge' : 'fee_equalization_credit',
          amount: Math.abs(totalAmount).toFixed(2),
          transactionDate: new Date(),
          settleDate: new Date(),
          status: 'pending',
          description: `Fee equalization adjustment for period ${equalizationSummary.equalizationPeriod.startDate.toISOString().split('T')[0]} to ${equalizationSummary.equalizationPeriod.endDate.toISOString().split('T')[0]}`,
          metadata: {
            equalizationType: 'fees',
            equalizationPeriod: equalizationSummary.equalizationPeriod,
            appliedBy,
            appliedAt: new Date(),
          },
        });
      }
    }
  }
}

export default EqualizationService;