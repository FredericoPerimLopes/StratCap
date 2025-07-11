import { Op } from 'sequelize';
import { 
  Fund,
  Commitment,
  Transaction,
  Investment
} from '../models';
import PerformanceAnalyticsService from './PerformanceAnalyticsService';
import CashFlowAnalyticsService from './CashFlowAnalyticsService';

interface ScenarioAssumptions {
  deploymentSchedule?: {
    totalDeploymentMonths: number;
    deploymentCurve: 'linear' | 'front_loaded' | 'back_loaded' | 'bell_curve';
    finalDeploymentRate: number; // 0.0 to 1.0
  };
  exitAssumptions?: {
    averageHoldingPeriod: number; // years
    exitMultiples: {
      percentile25: number;
      percentile50: number;
      percentile75: number;
    };
    exitTiming: 'linear' | 'j_curve' | 'back_loaded';
  };
  marketConditions?: {
    baseIRR: number;
    volatility: number;
    marketCorrectionProbability: number;
    marketCorrectionImpact: number; // -0.5 = 50% decline
  };
  feeAssumptions?: {
    managementFeeRate: number;
    carriedInterestRate: number;
    preferredReturnRate: number;
    catchupPercentage: number;
  };
  customVariables?: Record<string, number>;
}

interface ScenarioResult {
  scenarioId: string;
  name: string;
  assumptions: ScenarioAssumptions;
  projectedMetrics: {
    irr: number;
    moic: number;
    tvpi: number;
    dpi: number;
    peakOutstanding: number;
    paybackPeriod: number;
  };
  cashFlowProjections: Array<{
    date: Date;
    capitalCalls: number;
    distributions: number;
    netCashFlow: number;
    nav: number;
  }>;
  riskMetrics: {
    probability95thPercentile: number;
    probability75thPercentile: number;
    probability25thPercentile: number;
    probability5thPercentile: number;
    expectedValue: number;
    standardDeviation: number;
  };
  sensitivityAnalysis: Array<{
    variable: string;
    baseValue: number;
    impact10Percent: number;
    impact25Percent: number;
    elasticity: number;
  }>;
}

interface MonteCarloParameters {
  simulations: number;
  confidenceIntervals: number[];
  randomSeed?: number;
  correlationMatrix?: number[][];
}

interface PortfolioScenario {
  portfolioName: string;
  funds: Array<{
    fundId: string;
    allocation: number;
    scenario: ScenarioResult;
  }>;
  portfolioMetrics: {
    weightedIRR: number;
    diversificationBenefit: number;
    correlationRisk: number;
    concentrationRisk: number;
  };
}

export class HypotheticalScenarioService {

  /**
   * Create and analyze a hypothetical scenario for a fund
   */
  async createScenario(
    fundId: string,
    scenarioName: string,
    assumptions: ScenarioAssumptions
  ): Promise<ScenarioResult> {
    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      throw new Error('Fund not found');
    }

    const commitments = await Commitment.findAll({
      where: { fundId, status: 'active' }
    });

    const totalCommitments = commitments.reduce((sum, c) => 
      sum + parseFloat(c.commitmentAmount), 0
    );

    // Generate scenario ID
    const scenarioId = this.generateScenarioId(fundId, scenarioName);

    // Project cash flows based on assumptions
    const cashFlowProjections = await this.projectCashFlows(
      fundId,
      totalCommitments,
      assumptions
    );

    // Calculate projected metrics
    const projectedMetrics = this.calculateProjectedMetrics(cashFlowProjections);

    // Perform risk analysis
    const riskMetrics = await this.performRiskAnalysis(
      fundId,
      assumptions,
      { simulations: 1000, confidenceIntervals: [5, 25, 75, 95] }
    );

    // Perform sensitivity analysis
    const sensitivityAnalysis = this.performSensitivityAnalysis(
      fundId,
      assumptions,
      projectedMetrics
    );

    return {
      scenarioId,
      name: scenarioName,
      assumptions,
      projectedMetrics,
      cashFlowProjections,
      riskMetrics,
      sensitivityAnalysis
    };
  }

  /**
   * Compare multiple scenarios side by side
   */
  async compareScenarios(
    scenarios: ScenarioResult[]
  ): Promise<{
    comparison: Array<{
      metric: string;
      scenarios: Array<{ scenarioId: string; value: number; rank: number }>;
      variance: number;
    }>;
    riskReturnAnalysis: Array<{
      scenarioId: string;
      riskAdjustedReturn: number;
      sharpeRatio: number;
      downside_risk: number;
    }>;
  }> {
    const metrics = ['irr', 'moic', 'tvpi', 'dpi', 'peakOutstanding', 'paybackPeriod'];
    const comparison = metrics.map(metric => {
      const values = scenarios.map(s => ({
        scenarioId: s.scenarioId,
        value: s.projectedMetrics[metric as keyof typeof s.projectedMetrics] as number
      }));

      // Rank scenarios for this metric (higher is better except for peakOutstanding and paybackPeriod)
      const shouldReverse = ['peakOutstanding', 'paybackPeriod'].includes(metric);
      values.sort((a, b) => shouldReverse ? a.value - b.value : b.value - a.value);
      
      const rankedValues = values.map((v, index) => ({
        ...v,
        rank: index + 1
      }));

      const variance = this.calculateVariance(values.map(v => v.value));

      return {
        metric,
        scenarios: rankedValues,
        variance
      };
    });

    // Risk-return analysis
    const riskReturnAnalysis = scenarios.map(scenario => {
      const expectedReturn = scenario.projectedMetrics.irr;
      const volatility = scenario.riskMetrics.standardDeviation;
      const riskFreeRate = 0.02; // 2% risk-free rate
      
      const sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;
      const downsideRisk = this.calculateDownsideRisk(scenario);

      return {
        scenarioId: scenario.scenarioId,
        riskAdjustedReturn: expectedReturn / Math.max(volatility, 0.01),
        sharpeRatio,
        downside_risk: downsideRisk
      };
    });

    return {
      comparison,
      riskReturnAnalysis
    };
  }

  /**
   * Run Monte Carlo simulation for risk analysis
   */
  async runMonteCarloSimulation(
    fundId: string,
    baseAssumptions: ScenarioAssumptions,
    parameters: MonteCarloParameters
  ): Promise<{
    results: Array<{
      simulation: number;
      irr: number;
      moic: number;
      finalNav: number;
    }>;
    statistics: {
      mean: { irr: number; moic: number; finalNav: number };
      median: { irr: number; moic: number; finalNav: number };
      percentiles: Array<{
        percentile: number;
        irr: number;
        moic: number;
        finalNav: number;
      }>;
      probability: {
        positiveIRR: number;
        exceedsTargetIRR: number;
        totalLoss: number;
      };
    };
  }> {
    const results: Array<{
      simulation: number;
      irr: number;
      moic: number;
      finalNav: number;
    }> = [];

    // Set random seed for reproducibility
    if (parameters.randomSeed) {
      this.setSeed(parameters.randomSeed);
    }

    for (let i = 0; i < parameters.simulations; i++) {
      // Generate random variations of assumptions
      const simulationAssumptions = this.generateRandomAssumptions(baseAssumptions);
      
      // Run scenario
      const scenario = await this.createScenario(
        fundId,
        `Monte Carlo Simulation ${i + 1}`,
        simulationAssumptions
      );

      const finalNav = scenario.cashFlowProjections[scenario.cashFlowProjections.length - 1]?.nav || 0;

      results.push({
        simulation: i + 1,
        irr: scenario.projectedMetrics.irr,
        moic: scenario.projectedMetrics.moic,
        finalNav
      });
    }

    // Calculate statistics
    const statistics = this.calculateMonteCarloStatistics(results, parameters.confidenceIntervals);

    return {
      results,
      statistics
    };
  }

  /**
   * Create portfolio-level scenarios
   */
  async createPortfolioScenario(
    portfolioName: string,
    fundAllocations: Array<{ fundId: string; allocation: number; assumptions: ScenarioAssumptions }>,
    correlationAssumptions?: number[][]
  ): Promise<PortfolioScenario> {
    const funds: Array<{
      fundId: string;
      allocation: number;
      scenario: ScenarioResult;
    }> = [];

    // Create scenarios for each fund
    for (const allocation of fundAllocations) {
      const scenario = await this.createScenario(
        allocation.fundId,
        `Portfolio Component - ${allocation.fundId}`,
        allocation.assumptions
      );

      funds.push({
        fundId: allocation.fundId,
        allocation: allocation.allocation,
        scenario
      });
    }

    // Calculate portfolio metrics
    const portfolioMetrics = this.calculatePortfolioMetrics(funds, correlationAssumptions);

    return {
      portfolioName,
      funds,
      portfolioMetrics
    };
  }

  /**
   * Stress test scenarios under extreme conditions
   */
  async runStressTest(
    fundId: string,
    baseAssumptions: ScenarioAssumptions,
    stressScenarios: Array<{
      name: string;
      adjustments: Partial<ScenarioAssumptions>;
    }>
  ): Promise<Array<{
    stressTestName: string;
    scenario: ScenarioResult;
    impactAnalysis: {
      irrImpact: number;
      moicImpact: number;
      maxDrawdown: number;
      recoveryTime: number; // months
    };
  }>> {
    const results = [];

    for (const stressTest of stressScenarios) {
      // Merge base assumptions with stress test adjustments
      const stressAssumptions = this.mergeAssumptions(baseAssumptions, stressTest.adjustments);
      
      const scenario = await this.createScenario(
        fundId,
        `Stress Test: ${stressTest.name}`,
        stressAssumptions
      );

      // Create base scenario for comparison
      const baseScenario = await this.createScenario(
        fundId,
        'Base Case',
        baseAssumptions
      );

      const impactAnalysis = {
        irrImpact: scenario.projectedMetrics.irr - baseScenario.projectedMetrics.irr,
        moicImpact: scenario.projectedMetrics.moic - baseScenario.projectedMetrics.moic,
        maxDrawdown: this.calculateMaxDrawdown(scenario.cashFlowProjections),
        recoveryTime: this.calculateRecoveryTime(scenario.cashFlowProjections)
      };

      results.push({
        stressTestName: stressTest.name,
        scenario,
        impactAnalysis
      });
    }

    return results;
  }

  /**
   * Project cash flows based on scenario assumptions
   */
  private async projectCashFlows(
    fundId: string,
    totalCommitments: number,
    assumptions: ScenarioAssumptions
  ): Promise<Array<{
    date: Date;
    capitalCalls: number;
    distributions: number;
    netCashFlow: number;
    nav: number;
  }>> {
    const projectionMonths = 15 * 12; // 15 years
    const projections = [];
    const startDate = new Date();

    let cumulativeCalls = 0;
    let cumulativeDistributions = 0;
    let nav = 0;

    for (let month = 1; month <= projectionMonths; month++) {
      const projectionDate = new Date(startDate);
      projectionDate.setMonth(projectionDate.getMonth() + month);

      // Calculate capital calls based on deployment schedule
      const capitalCalls = this.calculateMonthlyCapitalCall(
        totalCommitments,
        month,
        assumptions.deploymentSchedule
      );

      // Calculate distributions based on exit assumptions
      const distributions = this.calculateMonthlyDistribution(
        totalCommitments,
        cumulativeCalls,
        month,
        assumptions.exitAssumptions,
        assumptions.marketConditions
      );

      cumulativeCalls += capitalCalls;
      cumulativeDistributions += distributions;

      // Calculate NAV (simplified model)
      nav = this.calculateNAV(
        cumulativeCalls,
        cumulativeDistributions,
        month,
        assumptions.exitAssumptions,
        assumptions.marketConditions
      );

      const netCashFlow = distributions - capitalCalls;

      projections.push({
        date: projectionDate,
        capitalCalls,
        distributions,
        netCashFlow,
        nav
      });
    }

    return projections;
  }

  /**
   * Calculate projected metrics from cash flow projections
   */
  private calculateProjectedMetrics(cashFlowProjections: any[]): any {
    const totalCalls = cashFlowProjections.reduce((sum, p) => sum + p.capitalCalls, 0);
    const totalDistributions = cashFlowProjections.reduce((sum, p) => sum + p.distributions, 0);
    const finalNav = cashFlowProjections[cashFlowProjections.length - 1]?.nav || 0;

    // Calculate IRR using cash flows
    const irr = this.calculateIRRFromProjections(cashFlowProjections);
    
    const totalValue = totalDistributions + finalNav;
    const moic = totalCalls > 0 ? totalValue / totalCalls : 0;
    const tvpi = moic; // Same as MOIC for projected scenarios
    const dpi = totalCalls > 0 ? totalDistributions / totalCalls : 0;

    // Calculate peak outstanding
    let cumulativeNet = 0;
    let peakOutstanding = 0;
    cashFlowProjections.forEach(p => {
      cumulativeNet += p.netCashFlow;
      peakOutstanding = Math.min(peakOutstanding, cumulativeNet);
    });

    // Calculate payback period
    const paybackPeriod = this.calculatePaybackPeriodFromProjections(cashFlowProjections);

    return {
      irr,
      moic,
      tvpi,
      dpi,
      peakOutstanding: Math.abs(peakOutstanding),
      paybackPeriod
    };
  }

  /**
   * Perform risk analysis using Monte Carlo methods
   */
  private async performRiskAnalysis(
    fundId: string,
    assumptions: ScenarioAssumptions,
    parameters: MonteCarloParameters
  ): Promise<any> {
    const monteCarloResult = await this.runMonteCarloSimulation(
      fundId,
      assumptions,
      parameters
    );

    const irrValues = monteCarloResult.results.map(r => r.irr).sort((a, b) => a - b);
    
    return {
      probability95thPercentile: this.getPercentile(irrValues, 95),
      probability75thPercentile: this.getPercentile(irrValues, 75),
      probability25thPercentile: this.getPercentile(irrValues, 25),
      probability5thPercentile: this.getPercentile(irrValues, 5),
      expectedValue: this.calculateMean(irrValues),
      standardDeviation: this.calculateStandardDeviation(irrValues)
    };
  }

  /**
   * Perform sensitivity analysis
   */
  private performSensitivityAnalysis(
    fundId: string,
    baseAssumptions: ScenarioAssumptions,
    baseMetrics: any
  ): Promise<any[]> {
    const variables = [
      'deploymentSchedule.finalDeploymentRate',
      'exitAssumptions.averageHoldingPeriod',
      'exitAssumptions.exitMultiples.percentile50',
      'marketConditions.baseIRR',
      'feeAssumptions.managementFeeRate'
    ];

    return Promise.all(variables.map(async variable => {
      const impact10 = await this.calculateVariableImpact(fundId, baseAssumptions, variable, 0.1);
      const impact25 = await this.calculateVariableImpact(fundId, baseAssumptions, variable, 0.25);
      
      const elasticity = impact10 !== 0 ? (impact10 / baseMetrics.irr) / 0.1 : 0;

      return {
        variable,
        baseValue: this.getNestedValue(baseAssumptions, variable),
        impact10Percent: impact10,
        impact25Percent: impact25,
        elasticity
      };
    }));
  }

  // Helper methods for calculations

  private calculateMonthlyCapitalCall(
    totalCommitments: number,
    month: number,
    deploymentSchedule?: ScenarioAssumptions['deploymentSchedule']
  ): number {
    if (!deploymentSchedule) return 0;

    const { totalDeploymentMonths, deploymentCurve, finalDeploymentRate } = deploymentSchedule;
    
    if (month > totalDeploymentMonths) return 0;

    const totalToDeploy = totalCommitments * finalDeploymentRate;
    const deploymentRatio = month / totalDeploymentMonths;

    let curveMultiplier = 1;
    switch (deploymentCurve) {
      case 'front_loaded':
        curveMultiplier = 2 * (1 - deploymentRatio);
        break;
      case 'back_loaded':
        curveMultiplier = 2 * deploymentRatio;
        break;
      case 'bell_curve':
        curveMultiplier = 4 * deploymentRatio * (1 - deploymentRatio);
        break;
      default: // linear
        curveMultiplier = 1;
    }

    return (totalToDeploy / totalDeploymentMonths) * curveMultiplier;
  }

  private calculateMonthlyDistribution(
    totalCommitments: number,
    cumulativeCalls: number,
    month: number,
    exitAssumptions?: ScenarioAssumptions['exitAssumptions'],
    marketConditions?: ScenarioAssumptions['marketConditions']
  ): number {
    if (!exitAssumptions || month < 24) return 0; // No distributions in first 2 years

    const holdingPeriodMonths = exitAssumptions.averageHoldingPeriod * 12;
    const distributionStartMonth = holdingPeriodMonths * 0.6; // Start distributing at 60% of holding period

    if (month < distributionStartMonth) return 0;

    const exitMultiple = exitAssumptions.exitMultiples.percentile50;
    const totalDistributions = cumulativeCalls * exitMultiple;
    
    // Apply market conditions
    let marketAdjustment = 1;
    if (marketConditions) {
      marketAdjustment = 1 + (Math.random() - 0.5) * marketConditions.volatility;
    }

    const distributionPeriodMonths = holdingPeriodMonths * 0.8; // Distribute over 80% of holding period
    const monthlyDistribution = totalDistributions / distributionPeriodMonths * marketAdjustment;

    return Math.max(0, monthlyDistribution * 0.1); // 10% per month during distribution period
  }

  private calculateNAV(
    cumulativeCalls: number,
    cumulativeDistributions: number,
    month: number,
    exitAssumptions?: ScenarioAssumptions['exitAssumptions'],
    marketConditions?: ScenarioAssumptions['marketConditions']
  ): number {
    if (!exitAssumptions) return 0;

    const unrealizedMultiple = exitAssumptions.exitMultiples.percentile50 * 0.8; // 80% of expected exit multiple
    const unrealizedValue = cumulativeCalls * unrealizedMultiple - cumulativeDistributions;

    // Apply time decay as investments mature
    const timeDecayFactor = Math.max(0.1, 1 - (month / (15 * 12))); // Decay over 15 years

    return Math.max(0, unrealizedValue * timeDecayFactor);
  }

  private calculateIRRFromProjections(projections: any[]): number {
    const cashFlows = projections.map((p, index) => ({
      period: index,
      amount: p.netCashFlow
    }));

    // Add final NAV as terminal cash flow
    if (projections.length > 0) {
      const lastProjection = projections[projections.length - 1];
      cashFlows[cashFlows.length - 1].amount += lastProjection.nav;
    }

    return this.calculateIRRFromCashFlows(cashFlows);
  }

  private calculateIRRFromCashFlows(cashFlows: Array<{ period: number; amount: number }>): number {
    // Simplified IRR calculation using trial and error
    let rate = 0.1;
    let iteration = 0;
    const maxIterations = 100;
    const tolerance = 1e-6;

    while (iteration < maxIterations) {
      const npv = cashFlows.reduce((sum, cf) => 
        sum + cf.amount / Math.pow(1 + rate, cf.period / 12), 0
      );

      if (Math.abs(npv) < tolerance) break;

      const derivative = cashFlows.reduce((sum, cf) => 
        sum - (cf.period / 12 * cf.amount) / Math.pow(1 + rate, cf.period / 12 + 1), 0
      );

      if (derivative === 0) break;

      rate = rate - npv / derivative;
      iteration++;
    }

    return isNaN(rate) || !isFinite(rate) ? 0 : rate;
  }

  private calculatePaybackPeriodFromProjections(projections: any[]): number {
    let cumulativeNet = 0;
    
    for (let i = 0; i < projections.length; i++) {
      cumulativeNet += projections[i].netCashFlow;
      if (cumulativeNet >= 0) {
        return i / 12; // Convert months to years
      }
    }
    
    return -1; // No payback achieved
  }

  // Statistical helper methods
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return this.calculateMean(squaredDiffs);
  }

  private calculateStandardDeviation(values: number[]): number {
    return Math.sqrt(this.calculateVariance(values));
  }

  private getPercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  private generateScenarioId(fundId: string, scenarioName: string): string {
    const timestamp = Date.now();
    return `${fundId}_${scenarioName.replace(/\s+/g, '_')}_${timestamp}`;
  }

  private generateRandomAssumptions(baseAssumptions: ScenarioAssumptions): ScenarioAssumptions {
    // Create variations within reasonable bounds
    const randomAssumptions = JSON.parse(JSON.stringify(baseAssumptions));
    
    // Add random variations (simplified)
    if (randomAssumptions.marketConditions) {
      randomAssumptions.marketConditions.baseIRR *= (0.8 + Math.random() * 0.4); // ±20% variation
    }
    
    return randomAssumptions;
  }

  private calculateMonteCarloStatistics(results: any[], confidenceIntervals: number[]): any {
    const irrValues = results.map(r => r.irr).sort((a, b) => a - b);
    const moicValues = results.map(r => r.moic).sort((a, b) => a - b);
    const navValues = results.map(r => r.finalNav).sort((a, b) => a - b);

    const mean = {
      irr: this.calculateMean(irrValues),
      moic: this.calculateMean(moicValues),
      finalNav: this.calculateMean(navValues)
    };

    const median = {
      irr: this.getPercentile(irrValues, 50),
      moic: this.getPercentile(moicValues, 50),
      finalNav: this.getPercentile(navValues, 50)
    };

    const percentiles = confidenceIntervals.map(p => ({
      percentile: p,
      irr: this.getPercentile(irrValues, p),
      moic: this.getPercentile(moicValues, p),
      finalNav: this.getPercentile(navValues, p)
    }));

    const probability = {
      positiveIRR: irrValues.filter(irr => irr > 0).length / irrValues.length,
      exceedsTargetIRR: irrValues.filter(irr => irr > 0.15).length / irrValues.length, // 15% target
      totalLoss: moicValues.filter(moic => moic < 0.1).length / moicValues.length
    };

    return {
      mean,
      median,
      percentiles,
      probability
    };
  }

  private calculatePortfolioMetrics(funds: any[], correlationMatrix?: number[][]): any {
    const weightedIRR = funds.reduce((sum, fund) => 
      sum + fund.scenario.projectedMetrics.irr * fund.allocation, 0
    );

    // Simplified correlation and diversification calculations
    const diversificationBenefit = 0.05; // 5% benefit from diversification
    const correlationRisk = 0.02; // 2% correlation risk
    const concentrationRisk = this.calculateConcentrationRisk(funds);

    return {
      weightedIRR,
      diversificationBenefit,
      correlationRisk,
      concentrationRisk
    };
  }

  private calculateConcentrationRisk(funds: any[]): number {
    const allocations = funds.map(f => f.allocation);
    const herfindahlIndex = allocations.reduce((sum, allocation) => 
      sum + allocation * allocation, 0
    );
    
    return herfindahlIndex; // Higher values indicate more concentration
  }

  private calculateDownsideRisk(scenario: ScenarioResult): number {
    // Simplified downside risk calculation
    const targetReturn = 0.08; // 8% target
    const actualReturn = scenario.projectedMetrics.irr;
    return Math.max(0, targetReturn - actualReturn);
  }

  private calculateMaxDrawdown(cashFlowProjections: any[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    cashFlowProjections.forEach(projection => {
      cumulative += projection.netCashFlow;
      peak = Math.max(peak, cumulative);
      const drawdown = (peak - cumulative) / Math.max(peak, 1);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return maxDrawdown;
  }

  private calculateRecoveryTime(cashFlowProjections: any[]): number {
    // Simplified recovery time calculation
    let inDrawdown = false;
    let drawdownStart = 0;
    let cumulative = 0;

    for (let i = 0; i < cashFlowProjections.length; i++) {
      cumulative += cashFlowProjections[i].netCashFlow;
      
      if (!inDrawdown && cumulative < 0) {
        inDrawdown = true;
        drawdownStart = i;
      } else if (inDrawdown && cumulative >= 0) {
        return i - drawdownStart; // Recovery time in months
      }
    }

    return -1; // No recovery
  }

  private mergeAssumptions(
    base: ScenarioAssumptions, 
    adjustments: Partial<ScenarioAssumptions>
  ): ScenarioAssumptions {
    return {
      ...base,
      ...adjustments,
      deploymentSchedule: {
        ...base.deploymentSchedule,
        ...adjustments.deploymentSchedule
      },
      exitAssumptions: {
        ...base.exitAssumptions,
        ...adjustments.exitAssumptions
      },
      marketConditions: {
        ...base.marketConditions,
        ...adjustments.marketConditions
      },
      feeAssumptions: {
        ...base.feeAssumptions,
        ...adjustments.feeAssumptions
      }
    };
  }

  private async calculateVariableImpact(
    fundId: string,
    baseAssumptions: ScenarioAssumptions,
    variable: string,
    adjustment: number
  ): Promise<number> {
    const adjustedAssumptions = JSON.parse(JSON.stringify(baseAssumptions));
    const currentValue = this.getNestedValue(adjustedAssumptions, variable);
    this.setNestedValue(adjustedAssumptions, variable, currentValue * (1 + adjustment));

    const scenario = await this.createScenario(fundId, 'Sensitivity Test', adjustedAssumptions);
    const baseScenario = await this.createScenario(fundId, 'Base Case', baseAssumptions);

    return scenario.projectedMetrics.irr - baseScenario.projectedMetrics.irr;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private setSeed(seed: number): void {
    // Simple pseudo-random number generator seeding
    Math.random = this.seededRandom(seed);
  }

  private seededRandom(seed: number): () => number {
    let current = seed;
    return function() {
      current = (current * 9301 + 49297) % 233280;
      return current / 233280;
    };
  }
}

export default new HypotheticalScenarioService();