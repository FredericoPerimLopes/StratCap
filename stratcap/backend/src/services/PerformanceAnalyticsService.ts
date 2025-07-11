import { Op } from 'sequelize';
import { 
  Fund,
  Commitment,
  Transaction,
  InvestorEntity,
  WaterfallCalculation,
  DistributionEvent
} from '../models';

interface IRRData {
  date: Date;
  cashFlow: number;
}

interface PerformanceMetrics {
  irr: number;
  moic: number; // Multiple of Invested Capital
  tvpi: number; // Total Value to Paid-In
  dpi: number;  // Distributed to Paid-In
  rvpi: number; // Residual Value to Paid-In
  pme: number;  // Public Market Equivalent
  calledPercentage: number;
  distributedPercentage: number;
  nav: number;  // Net Asset Value
}

interface BenchmarkComparison {
  fundMetrics: PerformanceMetrics;
  benchmarkMetrics: PerformanceMetrics;
  outperformance: number;
  quartileRanking: number;
}

export class PerformanceAnalyticsService {

  /**
   * Calculate comprehensive performance metrics for a fund
   */
  async calculateFundPerformance(
    fundId: string,
    asOfDate?: Date,
    includeUnrealized?: boolean
  ): Promise<PerformanceMetrics> {
    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      throw new Error('Fund not found');
    }

    const commitments = await Commitment.findAll({
      where: { fundId, status: 'active' }
    });

    const transactionWhere: any = { fundId };
    if (asOfDate) {
      transactionWhere.transactionDate = { [Op.lte]: asOfDate };
    }

    const transactions = await Transaction.findAll({
      where: transactionWhere,
      order: [['transactionDate', 'asc']]
    });

    const totalCommitments = commitments.reduce((sum, c) => 
      sum + parseFloat(c.commitmentAmount), 0
    );

    // Calculate cash flows for IRR
    const cashFlows = this.prepareCashFlowsForIRR(transactions, asOfDate);
    
    // Calculate basic metrics
    const { totalCalled, totalDistributed, nav } = this.calculateBasicMetrics(
      transactions, 
      includeUnrealized,
      fundId,
      asOfDate
    );

    const metrics: PerformanceMetrics = {
      irr: this.calculateIRR(cashFlows),
      moic: totalCalled > 0 ? (totalDistributed + nav) / totalCalled : 0,
      tvpi: totalCalled > 0 ? (totalDistributed + nav) / totalCalled : 0,
      dpi: totalCalled > 0 ? totalDistributed / totalCalled : 0,
      rvpi: totalCalled > 0 ? nav / totalCalled : 0,
      pme: await this.calculatePME(cashFlows, asOfDate),
      calledPercentage: totalCommitments > 0 ? (totalCalled / totalCommitments) * 100 : 0,
      distributedPercentage: totalCommitments > 0 ? (totalDistributed / totalCommitments) * 100 : 0,
      nav
    };

    return metrics;
  }

  /**
   * Calculate performance metrics for a specific investor's portfolio
   */
  async calculateInvestorPerformance(
    investorId: string,
    fundId?: string,
    asOfDate?: Date
  ): Promise<PerformanceMetrics> {
    const whereClause: any = { investorEntityId: investorId, status: 'active' };
    if (fundId) {
      whereClause.fundId = fundId;
    }

    const commitments = await Commitment.findAll({
      where: whereClause
    });

    if (commitments.length === 0) {
      throw new Error('No active commitments found for investor');
    }

    const commitmentIds = commitments.map(c => c.id);
    const transactionWhere: any = { commitmentId: { [Op.in]: commitmentIds } };
    if (asOfDate) {
      transactionWhere.transactionDate = { [Op.lte]: asOfDate };
    }

    const transactions = await Transaction.findAll({
      where: transactionWhere,
      order: [['transactionDate', 'asc']]
    });

    const totalCommitments = commitments.reduce((sum, c) => 
      sum + parseFloat(c.commitmentAmount), 0
    );

    const cashFlows = this.prepareCashFlowsForIRR(transactions, asOfDate);
    const { totalCalled, totalDistributed, nav } = this.calculateBasicMetrics(
      transactions, 
      true, // Include unrealized for investor view
      null,
      asOfDate
    );

    return {
      irr: this.calculateIRR(cashFlows),
      moic: totalCalled > 0 ? (totalDistributed + nav) / totalCalled : 0,
      tvpi: totalCalled > 0 ? (totalDistributed + nav) / totalCalled : 0,
      dpi: totalCalled > 0 ? totalDistributed / totalCalled : 0,
      rvpi: totalCalled > 0 ? nav / totalCalled : 0,
      pme: await this.calculatePME(cashFlows, asOfDate),
      calledPercentage: totalCommitments > 0 ? (totalCalled / totalCommitments) * 100 : 0,
      distributedPercentage: totalCommitments > 0 ? (totalDistributed / totalCommitments) * 100 : 0,
      nav
    };
  }

  /**
   * Calculate time-weighted returns for performance attribution
   */
  async calculateTimeWeightedReturns(
    fundId: string,
    startDate: Date,
    endDate: Date,
    frequency: 'daily' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<Array<{ date: Date; return: number; cumulativeReturn: number }>> {
    const transactions = await Transaction.findAll({
      where: {
        fundId,
        transactionDate: { [Op.between]: [startDate, endDate] }
      },
      order: [['transactionDate', 'asc']]
    });

    // Group transactions by period
    const periods = this.groupTransactionsByPeriod(transactions, frequency);
    const returns: Array<{ date: Date; return: number; cumulativeReturn: number }> = [];
    let cumulativeReturn = 1;

    for (const [date, periodTransactions] of periods) {
      const periodReturn = this.calculatePeriodReturn(periodTransactions);
      cumulativeReturn *= (1 + periodReturn);
      
      returns.push({
        date,
        return: periodReturn,
        cumulativeReturn: cumulativeReturn - 1
      });
    }

    return returns;
  }

  /**
   * Compare fund performance against benchmarks
   */
  async compareToBenchmark(
    fundId: string,
    benchmarkType: 'sp500' | 'nasdaq' | 'custom',
    benchmarkData?: number[],
    asOfDate?: Date
  ): Promise<BenchmarkComparison> {
    const fundMetrics = await this.calculateFundPerformance(fundId, asOfDate);
    
    // For now, return mock benchmark data
    // In production, this would integrate with market data providers
    const benchmarkMetrics: PerformanceMetrics = {
      irr: 0.08, // 8% benchmark IRR
      moic: 1.5,
      tvpi: 1.5,
      dpi: 1.2,
      rvpi: 0.3,
      pme: 1.0,
      calledPercentage: 100,
      distributedPercentage: 80,
      nav: 0
    };

    const outperformance = fundMetrics.irr - benchmarkMetrics.irr;
    const quartileRanking = this.calculateQuartileRanking(fundMetrics.irr, benchmarkType);

    return {
      fundMetrics,
      benchmarkMetrics,
      outperformance,
      quartileRanking
    };
  }

  /**
   * Calculate rolling performance metrics
   */
  async calculateRollingPerformance(
    fundId: string,
    windowMonths: number = 12,
    asOfDate?: Date
  ): Promise<Array<{ date: Date; metrics: PerformanceMetrics }>> {
    const endDate = asOfDate || new Date();
    const results: Array<{ date: Date; metrics: PerformanceMetrics }> = [];

    // Calculate performance for each rolling window
    for (let i = 0; i <= 36; i += 3) { // Quarterly rolling windows for 3 years
      const windowEndDate = new Date(endDate);
      windowEndDate.setMonth(windowEndDate.getMonth() - i);
      
      const windowStartDate = new Date(windowEndDate);
      windowStartDate.setMonth(windowStartDate.getMonth() - windowMonths);

      try {
        const metrics = await this.calculateFundPerformance(fundId, windowEndDate);
        results.push({
          date: windowEndDate,
          metrics
        });
      } catch (error) {
        // Skip periods with insufficient data
        continue;
      }
    }

    return results.reverse();
  }

  /**
   * Prepare cash flows for IRR calculation
   */
  private prepareCashFlowsForIRR(
    transactions: any[],
    asOfDate?: Date
  ): IRRData[] {
    const cashFlows: IRRData[] = [];
    
    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      let cashFlow = 0;

      switch (transaction.transactionType) {
        case 'capital_call':
          cashFlow = -amount; // Outflow
          break;
        case 'distribution':
          cashFlow = amount; // Inflow
          break;
      }

      if (cashFlow !== 0) {
        cashFlows.push({
          date: transaction.transactionDate,
          cashFlow
        });
      }
    });

    // Add current NAV as final cash flow if calculating to a specific date
    if (asOfDate && cashFlows.length > 0) {
      // This would need to be calculated based on current valuations
      // For now, we'll use a placeholder
      cashFlows.push({
        date: asOfDate,
        cashFlow: 0 // NAV would be added here
      });
    }

    return cashFlows;
  }

  /**
   * Calculate basic financial metrics
   */
  private calculateBasicMetrics(
    transactions: any[],
    includeUnrealized: boolean,
    fundId?: string | null,
    asOfDate?: Date
  ) {
    const metrics = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      switch (transaction.transactionType) {
        case 'capital_call':
          acc.totalCalled += amount;
          break;
        case 'distribution':
          acc.totalDistributed += amount;
          break;
      }
      
      return acc;
    }, {
      totalCalled: 0,
      totalDistributed: 0
    });

    // Calculate NAV (this would integrate with valuation system)
    let nav = 0;
    if (includeUnrealized && fundId) {
      // Placeholder - in production this would pull from valuation models
      nav = metrics.totalCalled * 0.3; // Assume 30% unrealized value
    }

    return {
      ...metrics,
      nav
    };
  }

  /**
   * Calculate Internal Rate of Return using Newton-Raphson method
   */
  private calculateIRR(cashFlows: IRRData[]): number {
    if (cashFlows.length < 2) return 0;

    // Convert to simple array of cash flows with time periods
    const flows = cashFlows.map((cf, index) => ({
      amount: cf.cashFlow,
      period: index === 0 ? 0 : this.calculatePeriodsBetween(cashFlows[0].date, cf.date)
    }));

    let rate = 0.1; // Initial guess: 10%
    let iteration = 0;
    const maxIterations = 100;
    const tolerance = 1e-6;

    while (iteration < maxIterations) {
      const npv = flows.reduce((sum, flow) => 
        sum + flow.amount / Math.pow(1 + rate, flow.period), 0
      );

      const derivative = flows.reduce((sum, flow) => 
        sum - (flow.period * flow.amount) / Math.pow(1 + rate, flow.period + 1), 0
      );

      if (Math.abs(npv) < tolerance) {
        return rate;
      }

      if (derivative === 0) {
        break;
      }

      rate = rate - npv / derivative;
      iteration++;
    }

    return isNaN(rate) || !isFinite(rate) ? 0 : rate;
  }

  /**
   * Calculate Public Market Equivalent (PME)
   */
  private async calculatePME(cashFlows: IRRData[], asOfDate?: Date): Promise<number> {
    // Simplified PME calculation
    // In production, this would use actual market index data
    const marketReturn = 0.08; // Assume 8% market return
    
    let pmeNumerator = 0;
    let pmeDenominator = 0;

    cashFlows.forEach(cf => {
      const yearsFromStart = this.calculateYearsBetween(cashFlows[0].date, cf.date);
      const discountFactor = Math.pow(1 + marketReturn, yearsFromStart);

      if (cf.cashFlow > 0) {
        pmeNumerator += cf.cashFlow / discountFactor;
      } else {
        pmeDenominator += Math.abs(cf.cashFlow) / discountFactor;
      }
    });

    return pmeDenominator > 0 ? pmeNumerator / pmeDenominator : 0;
  }

  /**
   * Group transactions by time period
   */
  private groupTransactionsByPeriod(
    transactions: any[],
    frequency: 'daily' | 'monthly' | 'quarterly'
  ): Map<Date, any[]> {
    const groups = new Map<Date, any[]>();

    transactions.forEach(transaction => {
      const periodDate = this.getPeriodDate(transaction.transactionDate, frequency);
      
      if (!groups.has(periodDate)) {
        groups.set(periodDate, []);
      }
      groups.get(periodDate)!.push(transaction);
    });

    return groups;
  }

  /**
   * Calculate return for a specific period
   */
  private calculatePeriodReturn(transactions: any[]): number {
    let inflows = 0;
    let outflows = 0;

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      if (transaction.transactionType === 'distribution') {
        inflows += amount;
      } else if (transaction.transactionType === 'capital_call') {
        outflows += amount;
      }
    });

    return outflows > 0 ? (inflows - outflows) / outflows : 0;
  }

  /**
   * Calculate quartile ranking based on benchmark
   */
  private calculateQuartileRanking(irr: number, benchmarkType: string): number {
    // Simplified quartile calculation
    // In production, this would use peer group data
    const quartileThresholds = {
      sp500: [0.05, 0.08, 0.12, 0.18],
      nasdaq: [0.06, 0.10, 0.15, 0.22],
      custom: [0.05, 0.08, 0.12, 0.18]
    };

    const thresholds = quartileThresholds[benchmarkType as keyof typeof quartileThresholds] || quartileThresholds.custom;
    
    for (let i = 0; i < thresholds.length; i++) {
      if (irr <= thresholds[i]) {
        return i + 1;
      }
    }
    return 1; // Top quartile
  }

  /**
   * Helper method to calculate periods between dates
   */
  private calculatePeriodsBetween(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return diffTime / (1000 * 60 * 60 * 24 * 365.25); // Years
  }

  /**
   * Helper method to calculate years between dates
   */
  private calculateYearsBetween(startDate: Date, endDate: Date): number {
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }

  /**
   * Get period date for grouping
   */
  private getPeriodDate(date: Date, frequency: 'daily' | 'monthly' | 'quarterly'): Date {
    const periodDate = new Date(date);
    
    switch (frequency) {
      case 'daily':
        return new Date(periodDate.getFullYear(), periodDate.getMonth(), periodDate.getDate());
      case 'monthly':
        return new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
      case 'quarterly':
        const quarter = Math.floor(periodDate.getMonth() / 3);
        return new Date(periodDate.getFullYear(), quarter * 3, 1);
      default:
        return periodDate;
    }
  }
}

export default new PerformanceAnalyticsService();