import { Transaction } from 'sequelize';
import { CreditFacility } from '../models/CreditFacility';
import { Decimal } from 'decimal.js';
import FeeService from './FeeService';
import NotificationService from './NotificationService';

export interface CreditFacilityFeeCalculation {
  facilityId: string;
  calculationDate: Date;
  periodStart: Date;
  periodEnd: Date;
  fees: {
    interestFee: {
      amount: Decimal;
      rate: Decimal;
      principal: Decimal;
      days: number;
    };
    commitmentFee: {
      amount: Decimal;
      rate: Decimal;
      unusedCommitment: Decimal;
      days: number;
    };
    utilizationFee?: {
      amount: Decimal;
      rate: Decimal;
      utilizedAmount: Decimal;
      days: number;
    };
    arrangementFee?: {
      amount: Decimal;
      rate: Decimal;
      principal: Decimal;
    };
    agentFee?: {
      amount: Decimal;
      flatAmount: Decimal;
    };
  };
  totalFees: Decimal;
  metadata: any;
}

export interface FeeAccrualEntry {
  facilityId: string;
  accrualDate: Date;
  feeType: 'interest' | 'commitment' | 'utilization' | 'arrangement' | 'agent';
  amount: Decimal;
  rate?: Decimal;
  principal?: Decimal;
  description: string;
  posted: boolean;
  postingDate?: Date;
  glAccount?: string;
}

export interface CreditFacilityFeeSchedule {
  facilityId: string;
  scheduleType: 'monthly' | 'quarterly' | 'annual';
  paymentDates: Date[];
  feeBreakdown: {
    interestPayment: Decimal;
    commitmentFeePayment: Decimal;
    utilizationFeePayment: Decimal;
    totalPayment: Decimal;
  }[];
}

export class CreditFacilityFeeService {
  private feeService: FeeService;
  private notificationService: NotificationService;

  constructor() {
    this.feeService = new FeeService();
    this.notificationService = new NotificationService();
  }

  /**
   * Calculate fees for a credit facility for a specific period
   */
  async calculatePeriodFees(
    facilityId: string,
    periodStart: Date,
    periodEnd: Date,
    _transaction?: Transaction
  ): Promise<CreditFacilityFeeCalculation> {
    const facility = await this.getFacilityById(facilityId);
    const calculationDate = new Date();
    
    const days = this.calculateDaysBetween(periodStart, periodEnd);
    const principal = facility.getOutstandingBalanceDecimal();
    const totalCommitment = facility.getTotalCommitmentDecimal();
    const unusedCommitment = totalCommitment.minus(principal);

    // Calculate interest fee
    const interestRate = facility.getInterestRateDecimal();
    const dailyInterestRate = interestRate.dividedBy(365).dividedBy(100);
    const interestFee = principal.times(dailyInterestRate).times(days);

    // Calculate commitment fee
    const commitmentFeeRate = facility.getCommitmentFeeRateDecimal();
    const dailyCommitmentRate = commitmentFeeRate.dividedBy(365).dividedBy(100);
    const commitmentFee = unusedCommitment.times(dailyCommitmentRate).times(days);

    // Calculate utilization fee if applicable
    let utilizationFee: Decimal | undefined;
    let utilizationFeeData: any;
    
    if (facility.utilizationFeeRate) {
      const utilizationRate = facility.getUtilizationFeeRateDecimal();
      const dailyUtilizationRate = utilizationRate.dividedBy(365).dividedBy(100);
      utilizationFee = principal.times(dailyUtilizationRate).times(days);
      
      utilizationFeeData = {
        amount: utilizationFee,
        rate: utilizationRate,
        utilizedAmount: principal,
        days,
      };
    }

    // Calculate arrangement fee (one-time fee, typically charged on drawdown)
    let arrangementFee: Decimal | undefined;
    let arrangementFeeData: any;
    
    if (facility.keyTerms?.arrangementFeeRate) {
      const arrangementRate = new Decimal(facility.keyTerms.arrangementFeeRate);
      arrangementFee = principal.times(arrangementRate.dividedBy(100));
      
      arrangementFeeData = {
        amount: arrangementFee,
        rate: arrangementRate,
        principal,
      };
    }

    // Calculate agent fee (typically a flat annual fee)
    let agentFee: Decimal | undefined;
    let agentFeeData: any;
    
    if (facility.keyTerms?.agentFeeAmount) {
      const annualAgentFee = new Decimal(facility.keyTerms.agentFeeAmount);
      agentFee = annualAgentFee.times(days).dividedBy(365);
      
      agentFeeData = {
        amount: agentFee,
        flatAmount: annualAgentFee,
      };
    }

    // Calculate total fees
    let totalFees = interestFee.plus(commitmentFee);
    if (utilizationFee) totalFees = totalFees.plus(utilizationFee);
    if (arrangementFee) totalFees = totalFees.plus(arrangementFee);
    if (agentFee) totalFees = totalFees.plus(agentFee);

    const calculation: CreditFacilityFeeCalculation = {
      facilityId,
      calculationDate,
      periodStart,
      periodEnd,
      fees: {
        interestFee: {
          amount: interestFee,
          rate: interestRate,
          principal,
          days,
        },
        commitmentFee: {
          amount: commitmentFee,
          rate: commitmentFeeRate,
          unusedCommitment,
          days,
        },
        utilizationFee: utilizationFeeData,
        arrangementFee: arrangementFeeData,
        agentFee: agentFeeData,
      },
      totalFees,
      metadata: {
        facilityName: facility.facilityName,
        lender: facility.lender,
        currency: 'USD', // Should come from facility
        calculationMethod: 'actual/365',
      },
    };

    return calculation;
  }

  /**
   * Calculate daily fee accruals for a facility
   */
  async calculateDailyAccruals(
    facilityId: string,
    accrualDate: Date = new Date(),
    _transaction?: Transaction
  ): Promise<FeeAccrualEntry[]> {
    const facility = await this.getFacilityById(facilityId);
    const accruals: FeeAccrualEntry[] = [];

    const principal = facility.getOutstandingBalanceDecimal();
    const totalCommitment = facility.getTotalCommitmentDecimal();
    const unusedCommitment = totalCommitment.minus(principal);

    // Daily interest accrual
    if (principal.greaterThan(0)) {
      const interestRate = facility.getInterestRateDecimal();
      const dailyInterestRate = interestRate.dividedBy(365).dividedBy(100);
      const dailyInterest = principal.times(dailyInterestRate);

      accruals.push({
        facilityId,
        accrualDate,
        feeType: 'interest',
        amount: dailyInterest,
        rate: interestRate,
        principal,
        description: `Daily interest accrual on ${facility.facilityName}`,
        posted: false,
        glAccount: 'InterestExpense',
      });
    }

    // Daily commitment fee accrual
    if (unusedCommitment.greaterThan(0) && facility.commitmentFeeRate) {
      const commitmentFeeRate = facility.getCommitmentFeeRateDecimal();
      const dailyCommitmentRate = commitmentFeeRate.dividedBy(365).dividedBy(100);
      const dailyCommitmentFee = unusedCommitment.times(dailyCommitmentRate);

      accruals.push({
        facilityId,
        accrualDate,
        feeType: 'commitment',
        amount: dailyCommitmentFee,
        rate: commitmentFeeRate,
        principal: unusedCommitment,
        description: `Daily commitment fee accrual on ${facility.facilityName}`,
        posted: false,
        glAccount: 'CommitmentFeeExpense',
      });
    }

    // Daily utilization fee accrual
    if (principal.greaterThan(0) && facility.utilizationFeeRate) {
      const utilizationRate = facility.getUtilizationFeeRateDecimal();
      const dailyUtilizationRate = utilizationRate.dividedBy(365).dividedBy(100);
      const dailyUtilizationFee = principal.times(dailyUtilizationRate);

      accruals.push({
        facilityId,
        accrualDate,
        feeType: 'utilization',
        amount: dailyUtilizationFee,
        rate: utilizationRate,
        principal,
        description: `Daily utilization fee accrual on ${facility.facilityName}`,
        posted: false,
        glAccount: 'UtilizationFeeExpense',
      });
    }

    return accruals;
  }

  /**
   * Generate fee payment schedule for a facility
   */
  async generateFeeSchedule(
    facilityId: string,
    scheduleType: 'monthly' | 'quarterly' | 'annual' = 'quarterly',
    periodsAhead: number = 4
  ): Promise<CreditFacilityFeeSchedule> {
    const paymentDates = this.generatePaymentDates(scheduleType, periodsAhead);
    const feeBreakdown: any[] = [];

    for (let i = 0; i < paymentDates.length - 1; i++) {
      const periodStart = i === 0 ? new Date() : paymentDates[i - 1];
      const periodEnd = paymentDates[i];

      const feeCalculation = await this.calculatePeriodFees(
        facilityId,
        periodStart,
        periodEnd
      );

      feeBreakdown.push({
        interestPayment: feeCalculation.fees.interestFee.amount,
        commitmentFeePayment: feeCalculation.fees.commitmentFee.amount,
        utilizationFeePayment: feeCalculation.fees.utilizationFee?.amount || new Decimal(0),
        totalPayment: feeCalculation.totalFees,
      });
    }

    return {
      facilityId,
      scheduleType,
      paymentDates: paymentDates.slice(0, -1), // Remove the last date as it's just for calculation
      feeBreakdown,
    };
  }

  /**
   * Calculate prepayment penalty
   */
  async calculatePrepaymentPenalty(
    facilityId: string,
    prepaymentAmount: Decimal,
    prepaymentDate: Date = new Date()
  ): Promise<Decimal> {
    const facility = await this.getFacilityById(facilityId);
    const keyTerms = facility.keyTerms || {};

    if (!keyTerms.prepaymentPenalty) {
      return new Decimal(0);
    }

    const penaltyConfig = keyTerms.prepaymentPenalty;
    const penaltyType = penaltyConfig.type || 'percentage';

    switch (penaltyType) {
      case 'percentage':
        const penaltyRate = new Decimal(penaltyConfig.rate || 0);
        return prepaymentAmount.times(penaltyRate.dividedBy(100));

      case 'months_interest':
        const interestRate = facility.getInterestRateDecimal();
        const monthlyRate = interestRate.dividedBy(12).dividedBy(100);
        const months = new Decimal(penaltyConfig.months || 1);
        return prepaymentAmount.times(monthlyRate).times(months);

      case 'yield_maintenance':
        // Simplified yield maintenance calculation
        // In practice, this would involve complex present value calculations
        const currentRate = facility.getInterestRateDecimal();
        const marketRate = new Decimal(penaltyConfig.marketRate || currentRate.toString());
        const rateDifferential = Decimal.max(currentRate.minus(marketRate), new Decimal(0));
        const remainingYears = this.calculateRemainingYears(facility.maturityDate, prepaymentDate);
        return prepaymentAmount.times(rateDifferential.dividedBy(100)).times(remainingYears);

      default:
        return new Decimal(0);
    }
  }

  /**
   * Post fee accruals to general ledger
   */
  async postFeeAccruals(
    accruals: FeeAccrualEntry[],
    postedBy: string,
    transaction?: Transaction
  ): Promise<void> {
    for (const accrual of accruals) {
      // Create GL entry using FeeService
      await this.feeService.createFee({
        entityType: 'credit_facility',
        entityId: accrual.facilityId,
        feeType: accrual.feeType,
        amount: accrual.amount.toString(),
        description: accrual.description,
        dueDate: accrual.accrualDate,
        status: 'accrued',
        calculationBasis: {
          rate: accrual.rate?.toString(),
          principal: accrual.principal?.toString(),
          period: 'daily',
        },
      }, transaction);

      // Mark accrual as posted
      accrual.posted = true;
      accrual.postingDate = new Date();
    }

    // Send notification for significant fee postings
    const totalAccrual = accruals.reduce((sum, accrual) => sum.plus(accrual.amount), new Decimal(0));
    
    if (totalAccrual.greaterThan(new Decimal(10000))) {
      await this.notificationService.sendSimpleNotification({
        type: 'credit_facility_fees_posted',
        title: 'Credit Facility Fees Posted',
        message: `Daily fee accruals of ${totalAccrual.toFixed(2)} posted for credit facilities`,
        recipients: ['accounting_team', 'credit_team'],
        metadata: {
          totalAmount: totalAccrual.toString(),
          facilityCount: new Set(accruals.map(a => a.facilityId)).size,
          postingDate: new Date().toISOString(),
          postedBy,
        },
      });
    }
  }

  /**
   * Calculate effective interest rate including all fees
   */
  async calculateEffectiveRate(
    facilityId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    nominalRate: Decimal;
    effectiveRate: Decimal;
    allInRate: Decimal;
    feeComponents: {
      interestRate: Decimal;
      commitmentFeeRate: Decimal;
      utilizationFeeRate: Decimal;
      otherFeesRate: Decimal;
    };
  }> {
    const facility = await this.getFacilityById(facilityId);
    const feeCalculation = await this.calculatePeriodFees(facilityId, periodStart, periodEnd);
    
    const principal = facility.getOutstandingBalanceDecimal();
    const days = this.calculateDaysBetween(periodStart, periodEnd);
    const annualizationFactor = new Decimal(365).dividedBy(days);

    const nominalRate = facility.getInterestRateDecimal();
    
    // Calculate effective rate including commitment fees
    const totalInterestAndCommitmentFees = feeCalculation.fees.interestFee.amount
      .plus(feeCalculation.fees.commitmentFee.amount);
    
    const effectiveRate = principal.isZero() 
      ? new Decimal(0)
      : totalInterestAndCommitmentFees.dividedBy(principal).times(annualizationFactor).times(100);

    // Calculate all-in rate including all fees
    const allInRate = principal.isZero() 
      ? new Decimal(0)
      : feeCalculation.totalFees.dividedBy(principal).times(annualizationFactor).times(100);

    // Break down fee components as annualized rates
    const feeComponents = {
      interestRate: nominalRate,
      commitmentFeeRate: facility.getCommitmentFeeRateDecimal(),
      utilizationFeeRate: facility.getUtilizationFeeRateDecimal(),
      otherFeesRate: allInRate.minus(nominalRate).minus(facility.getCommitmentFeeRateDecimal()).minus(facility.getUtilizationFeeRateDecimal()),
    };

    return {
      nominalRate,
      effectiveRate,
      allInRate,
      feeComponents,
    };
  }

  /**
   * Get facility by ID
   */
  private async getFacilityById(facilityId: string): Promise<CreditFacility> {
    const facility = await CreditFacility.findByPk(facilityId);
    if (!facility) {
      throw new Error(`Credit facility with ID ${facilityId} not found`);
    }
    return facility;
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate payment dates for fee schedule
   */
  private generatePaymentDates(
    scheduleType: 'monthly' | 'quarterly' | 'annual',
    periodsAhead: number
  ): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    
    let increment: number;
    switch (scheduleType) {
      case 'monthly':
        increment = 1;
        break;
      case 'quarterly':
        increment = 3;
        break;
      case 'annual':
        increment = 12;
        break;
    }

    for (let i = 0; i <= periodsAhead; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() + (i * increment));
      // Set to end of month
      date.setDate(0);
      dates.push(date);
    }

    return dates;
  }

  /**
   * Calculate remaining years to maturity
   */
  private calculateRemainingYears(maturityDate: Date, currentDate: Date): Decimal {
    const timeDiff = maturityDate.getTime() - currentDate.getTime();
    const yearsDiff = timeDiff / (1000 * 60 * 60 * 24 * 365);
    return new Decimal(Math.max(0, yearsDiff));
  }

  /**
   * Get fee summary for all facilities
   */
  async getAllFacilitiesFeeSummary(fundId?: string): Promise<{
    totalAccruedFees: Decimal;
    facilitiesCount: number;
    feeBreakdown: {
      interestFees: Decimal;
      commitmentFees: Decimal;
      utilizationFees: Decimal;
      otherFees: Decimal;
    };
    upcomingPayments: {
      facilityId: string;
      facilityName: string;
      amount: Decimal;
      dueDate: Date;
    }[];
  }> {
    const whereClause = fundId ? { fundId } : {};
    const facilities = await CreditFacility.findAll({ where: whereClause });

    let totalAccruedFees = new Decimal(0);
    let totalInterestFees = new Decimal(0);
    let totalCommitmentFees = new Decimal(0);
    let totalUtilizationFees = new Decimal(0);
    let totalOtherFees = new Decimal(0);

    const upcomingPayments: any[] = [];

    for (const facility of facilities) {
      const accruals = await this.calculateDailyAccruals(facility.id);
      
      for (const accrual of accruals) {
        totalAccruedFees = totalAccruedFees.plus(accrual.amount);
        
        switch (accrual.feeType) {
          case 'interest':
            totalInterestFees = totalInterestFees.plus(accrual.amount);
            break;
          case 'commitment':
            totalCommitmentFees = totalCommitmentFees.plus(accrual.amount);
            break;
          case 'utilization':
            totalUtilizationFees = totalUtilizationFees.plus(accrual.amount);
            break;
          default:
            totalOtherFees = totalOtherFees.plus(accrual.amount);
        }
      }

      // Add to upcoming payments if significant accrual
      const facilityTotalAccrual = accruals.reduce((sum, accrual) => sum.plus(accrual.amount), new Decimal(0));
      
      if (facilityTotalAccrual.greaterThan(new Decimal(1000))) {
        const nextPaymentDate = new Date();
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 30); // Assume monthly payments
        
        upcomingPayments.push({
          facilityId: facility.id,
          facilityName: facility.facilityName,
          amount: facilityTotalAccrual.times(30), // Estimated monthly amount
          dueDate: nextPaymentDate,
        });
      }
    }

    return {
      totalAccruedFees,
      facilitiesCount: facilities.length,
      feeBreakdown: {
        interestFees: totalInterestFees,
        commitmentFees: totalCommitmentFees,
        utilizationFees: totalUtilizationFees,
        otherFees: totalOtherFees,
      },
      upcomingPayments: upcomingPayments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
    };
  }
}