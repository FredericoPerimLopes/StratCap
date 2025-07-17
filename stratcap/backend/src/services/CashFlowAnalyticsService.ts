import { Op } from 'sequelize';
import { 
  Fund,
  Commitment,
  Transaction
} from '../models';

interface CashFlowProjection {
  date: Date;
  capitalCalls: number;
  distributions: number;
  netCashFlow: number;
  cumulativeNetCashFlow: number;
  projectedType: 'actual' | 'projected';
}

interface CashFlowSummary {
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  peakOutstanding: number;
  cashFlowMultiple: number;
  paybackPeriod: number; // Years to payback
}

interface WaterfallCashFlow {
  tier: string;
  description: string;
  amount: number;
  percentage: number;
  cumulativePercentage: number;
}

interface LiquidityAnalysis {
  calledToDate: number;
  distributedToDate: number;
  remainingCommitment: number;
  projectedCalls: CashFlowProjection[];
  projectedDistributions: CashFlowProjection[];
  liquidityRatio: number;
}

export class CashFlowAnalyticsService {

  /**
   * Generate comprehensive cash flow analysis for a fund
   */
  async analyzeFundCashFlows(
    fundId: string,
    startDate?: Date,
    endDate?: Date,
    includeProjections: boolean = true
  ): Promise<{
    summary: CashFlowSummary;
    historicalCashFlows: CashFlowProjection[];
    projectedCashFlows: CashFlowProjection[];
    liquidityAnalysis: LiquidityAnalysis;
  }> {
    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      throw new Error('Fund not found');
    }

    // Get historical transactions
    const whereClause: any = { fundId };
    if (startDate) {
      whereClause.transactionDate = { [Op.gte]: startDate };
    }
    if (endDate) {
      whereClause.transactionDate = { 
        ...whereClause.transactionDate,
        [Op.lte]: endDate 
      };
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      order: [['transactionDate', 'asc']]
    });

    const commitments = await Commitment.findAll({
      where: { fundId, status: 'active' }
    });

    // Generate historical cash flows
    const historicalCashFlows = this.generateHistoricalCashFlows(transactions);
    
    // Calculate summary metrics
    const summary = this.calculateCashFlowSummary(historicalCashFlows);

    // Generate projections if requested
    let projectedCashFlows: CashFlowProjection[] = [];
    if (includeProjections) {
      projectedCashFlows = await this.generateCashFlowProjections(fundId, commitments);
    }

    // Perform liquidity analysis
    const liquidityAnalysis = await this.performLiquidityAnalysis(fundId, commitments, transactions);

    return {
      summary,
      historicalCashFlows,
      projectedCashFlows,
      liquidityAnalysis
    };
  }

  /**
   * Analyze cash flows by investor
   */
  async analyzeInvestorCashFlows(
    investorId: string,
    fundId?: string,
    asOfDate?: Date
  ): Promise<{
    summary: CashFlowSummary;
    cashFlowsByFund: Array<{
      fund: any;
      cashFlows: CashFlowProjection[];
      summary: CashFlowSummary;
    }>;
  }> {
    const whereClause: any = { investorEntityId: investorId, status: 'active' };
    if (fundId) {
      whereClause.fundId = fundId;
    }

    const commitments = await Commitment.findAll({
      where: whereClause,
      include: [
        { model: Fund, as: 'fund' }
      ]
    });

    const commitmentIds = commitments.map(c => c.id);
    const transactionWhere: any = { commitmentId: { [Op.in]: commitmentIds } };
    if (asOfDate) {
      transactionWhere.transactionDate = { [Op.lte]: asOfDate };
    }

    const transactions = await Transaction.findAll({
      where: transactionWhere,
      order: [['transactionDate', 'asc']]
    });

    // Group by fund
    const fundGroups = new Map();
    commitments.forEach(commitment => {
      const fundKey = commitment.fundId;
      if (!fundGroups.has(fundKey)) {
        fundGroups.set(fundKey, {
          fund: commitment.fund,
          commitments: [],
          transactions: []
        });
      }
      fundGroups.get(fundKey).commitments.push(commitment);
    });

    transactions.forEach(transaction => {
      const commitment = commitments.find(c => c.id === transaction.commitmentId);
      if (commitment) {
        const fundKey = commitment.fundId;
        if (fundGroups.has(fundKey)) {
          fundGroups.get(fundKey).transactions.push(transaction);
        }
      }
    });

    // Analyze each fund
    const cashFlowsByFund = Array.from(fundGroups.values()).map(group => {
      const cashFlows = this.generateHistoricalCashFlows(group.transactions);
      const summary = this.calculateCashFlowSummary(cashFlows);
      
      return {
        fund: group.fund,
        cashFlows,
        summary
      };
    });

    // Calculate overall summary
    const allCashFlows = this.generateHistoricalCashFlows(transactions);
    const overallSummary = this.calculateCashFlowSummary(allCashFlows);

    return {
      summary: overallSummary,
      cashFlowsByFund
    };
  }

  /**
   * Generate waterfall cash flow analysis
   */
  async analyzeWaterfallCashFlows(
    fundId: string,
    distributionEventId?: string,
    asOfDate?: Date
  ): Promise<WaterfallCashFlow[]> {
    const whereClause: any = { fundId };
    if (distributionEventId) {
      whereClause.distributionEventId = distributionEventId;
    }
    if (asOfDate) {
      whereClause.transactionDate = { [Op.lte]: asOfDate };
    }

    const transactions = await Transaction.findAll({
      where: {
        ...whereClause,
        transactionType: 'distribution'
      },
      order: [['transactionDate', 'asc']]
    });

    const totalDistributions = transactions.reduce((sum, t) => 
      sum + parseFloat(t.amount), 0
    );

    // Simplified waterfall analysis
    // In production, this would integrate with WaterfallCalculationService
    const waterfallTiers: WaterfallCashFlow[] = [
      {
        tier: 'Return of Capital',
        description: 'Return of invested capital to LPs',
        amount: totalDistributions * 0.6, // Example allocation
        percentage: 60,
        cumulativePercentage: 60
      },
      {
        tier: 'Preferred Return',
        description: '8% preferred return to LPs',
        amount: totalDistributions * 0.2,
        percentage: 20,
        cumulativePercentage: 80
      },
      {
        tier: 'Catch-up',
        description: 'GP catch-up to 20% of profits',
        amount: totalDistributions * 0.1,
        percentage: 10,
        cumulativePercentage: 90
      },
      {
        tier: 'Carried Interest',
        description: '80/20 split of remaining profits',
        amount: totalDistributions * 0.1,
        percentage: 10,
        cumulativePercentage: 100
      }
    ];

    return waterfallTiers;
  }

  /**
   * Generate cash flow projections based on fund lifecycle
   */
  async generateCashFlowProjections(
    fundId: string,
    commitments: any[],
    projectionYears: number = 10
  ): Promise<CashFlowProjection[]> {
    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      throw new Error('Fund not found');
    }

    const totalCommitments = commitments.reduce((sum, c) => 
      sum + parseFloat(c.commitmentAmount), 0
    );

    // Get current deployment rate
    const existingTransactions = await Transaction.findAll({
      where: { fundId }
    });

    const totalCalled = existingTransactions
      .filter(t => t.transactionType === 'capital_call')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const deploymentRate = totalCommitments > 0 ? totalCalled / totalCommitments : 0;

    const projections: CashFlowProjection[] = [];
    const startDate = new Date();
    let cumulativeNetCashFlow = this.calculateCurrentCumulativeNetCashFlow(existingTransactions);

    // Generate monthly projections
    for (let month = 1; month <= projectionYears * 12; month++) {
      const projectionDate = new Date(startDate);
      projectionDate.setMonth(projectionDate.getMonth() + month);

      const { capitalCalls, distributions } = this.calculateMonthlyProjection(
        totalCommitments,
        deploymentRate,
        month,
        fund.vintage
      );

      const netCashFlow = distributions - capitalCalls;
      cumulativeNetCashFlow += netCashFlow;

      projections.push({
        date: projectionDate,
        capitalCalls,
        distributions,
        netCashFlow,
        cumulativeNetCashFlow,
        projectedType: 'projected'
      });
    }

    return projections;
  }

  /**
   * Perform liquidity analysis
   */
  private async performLiquidityAnalysis(
    fundId: string,
    commitments: any[],
    transactions: any[]
  ): Promise<LiquidityAnalysis> {
    const totalCommitments = commitments.reduce((sum, c) => 
      sum + parseFloat(c.commitmentAmount), 0
    );

    const calledToDate = transactions
      .filter(t => t.transactionType === 'capital_call')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const distributedToDate = transactions
      .filter(t => t.transactionType === 'distribution')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const remainingCommitment = totalCommitments - calledToDate;

    // Generate projected calls and distributions
    const projectedCalls = await this.generateCashFlowProjections(fundId, commitments, 5);
    const projectedDistributions = projectedCalls.map(p => ({
      ...p,
      capitalCalls: 0,
      distributions: p.distributions,
      netCashFlow: p.distributions
    }));

    const liquidityRatio = calledToDate > 0 ? distributedToDate / calledToDate : 0;

    return {
      calledToDate,
      distributedToDate,
      remainingCommitment,
      projectedCalls: projectedCalls.filter(p => p.capitalCalls > 0),
      projectedDistributions: projectedDistributions.filter(p => p.distributions > 0),
      liquidityRatio
    };
  }

  /**
   * Generate historical cash flows from transactions
   */
  private generateHistoricalCashFlows(transactions: any[]): CashFlowProjection[] {
    const monthlyFlows = new Map<string, CashFlowProjection>();

    transactions.forEach(transaction => {
      const monthKey = transaction.transactionDate.toISOString().slice(0, 7); // YYYY-MM
      const amount = parseFloat(transaction.amount);

      if (!monthlyFlows.has(monthKey)) {
        monthlyFlows.set(monthKey, {
          date: new Date(monthKey + '-01'),
          capitalCalls: 0,
          distributions: 0,
          netCashFlow: 0,
          cumulativeNetCashFlow: 0,
          projectedType: 'actual'
        });
      }

      const monthData = monthlyFlows.get(monthKey)!;

      if (transaction.transactionType === 'capital_call') {
        monthData.capitalCalls += amount;
      } else if (transaction.transactionType === 'distribution') {
        monthData.distributions += amount;
      }

      monthData.netCashFlow = monthData.distributions - monthData.capitalCalls;
    });

    // Sort by date and calculate cumulative
    const sortedFlows = Array.from(monthlyFlows.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let cumulative = 0;
    sortedFlows.forEach(flow => {
      cumulative += flow.netCashFlow;
      flow.cumulativeNetCashFlow = cumulative;
    });

    return sortedFlows;
  }

  /**
   * Calculate cash flow summary metrics
   */
  private calculateCashFlowSummary(cashFlows: CashFlowProjection[]): CashFlowSummary {
    const totals = cashFlows.reduce((acc, flow) => {
      acc.totalInflows += flow.distributions;
      acc.totalOutflows += flow.capitalCalls;
      return acc;
    }, { totalInflows: 0, totalOutflows: 0 });

    const netCashFlow = totals.totalInflows - totals.totalOutflows;
    
    // Find peak outstanding (most negative cumulative)
    const peakOutstanding = Math.min(
      ...cashFlows.map(cf => cf.cumulativeNetCashFlow),
      0
    );

    const cashFlowMultiple = totals.totalOutflows > 0 ? 
      totals.totalInflows / totals.totalOutflows : 0;

    // Calculate payback period
    const paybackPeriod = this.calculatePaybackPeriod(cashFlows);

    return {
      totalInflows: totals.totalInflows,
      totalOutflows: totals.totalOutflows,
      netCashFlow,
      peakOutstanding: Math.abs(peakOutstanding),
      cashFlowMultiple,
      paybackPeriod
    };
  }

  /**
   * Calculate payback period in years
   */
  private calculatePaybackPeriod(cashFlows: CashFlowProjection[]): number {
    let cumulativeNet = 0;
    const startDate = cashFlows[0]?.date;

    for (const flow of cashFlows) {
      cumulativeNet += flow.netCashFlow;
      if (cumulativeNet >= 0) {
        const years = (flow.date.getTime() - startDate.getTime()) / 
          (1000 * 60 * 60 * 24 * 365.25);
        return years;
      }
    }

    return -1; // No payback achieved
  }

  /**
   * Calculate monthly projections based on fund characteristics
   */
  private calculateMonthlyProjection(
    totalCommitments: number,
    currentDeploymentRate: number,
    monthFromNow: number,
    fundVintage: number
  ): { capitalCalls: number; distributions: number } {
    const fundAge = new Date().getFullYear() - fundVintage;
    
    // Investment period typically 4-5 years
    const investmentPeriodEnd = 5 * 12; // 5 years in months
    
    let capitalCalls = 0;
    let distributions = 0;

    // Capital calls during investment period
    if (monthFromNow <= investmentPeriodEnd && currentDeploymentRate < 0.95) {
      const remainingToCall = totalCommitments * (0.95 - currentDeploymentRate);
      const monthsRemaining = investmentPeriodEnd - monthFromNow + 1;
      capitalCalls = remainingToCall / monthsRemaining * 0.8; // Deploy 80% of remaining
    }

    // Distributions start after 2-3 years, peak around years 5-8
    if (fundAge >= 2 || monthFromNow >= 24) {
      const distributionPeakMonth = 7 * 12; // Peak at year 7
      const timeToPeak = Math.abs(monthFromNow - distributionPeakMonth);
      const distributionFactor = Math.exp(-timeToPeak / (2 * 12)); // Bell curve
      
      distributions = totalCommitments * currentDeploymentRate * 0.15 * distributionFactor / 12;
    }

    return { capitalCalls, distributions };
  }

  /**
   * Calculate current cumulative net cash flow
   */
  private calculateCurrentCumulativeNetCashFlow(transactions: any[]): number {
    return transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      if (transaction.transactionType === 'distribution') {
        acc += amount;
      } else if (transaction.transactionType === 'capital_call') {
        acc -= amount;
      }
      return acc;
    }, 0);
  }
}

export default new CashFlowAnalyticsService();