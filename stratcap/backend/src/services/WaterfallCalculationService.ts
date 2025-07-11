import { Decimal } from 'decimal.js';
import WaterfallCalculation from '../models/WaterfallCalculation';
import WaterfallTier from '../models/WaterfallTier';
import DistributionEvent from '../models/DistributionEvent';
import TierAudit from '../models/TierAudit';
import Fund from '../models/Fund';
import Commitment from '../models/Commitment';
import PreferredReturnService from './PreferredReturnService';
import CarriedInterestService from './CarriedInterestService';
import TierAuditService from './TierAuditService';
import DistributionAllocationService from './DistributionAllocationService';

interface WaterfallConfig {
  tiers: Array<{
    level: number;
    name: string;
    type: 'preferred_return' | 'catch_up' | 'carried_interest' | 'promote' | 'distribution';
    lpAllocation: Decimal;
    gpAllocation: Decimal;
    threshold?: Decimal;
    target?: Decimal;
  }>;
  preferredReturnRate: Decimal;
  carriedInterestRate: Decimal;
  catchUpPercentage: Decimal;
  distributionFrequency: 'annual' | 'quarterly' | 'as_needed';
}

interface CalculationInputs {
  fundId: number;
  distributionAmount: Decimal;
  distributionDate: Date;
  calculationType: 'distribution' | 'hypothetical' | 'irr_analysis';
  capitalActivityId?: number;
  userId: number;
  customTiers?: Array<any>;
  previousDistributions?: Decimal;
  totalContributions?: Decimal;
}

interface CalculationResult {
  calculation: WaterfallCalculation;
  tiers: WaterfallTier[];
  distributions: DistributionEvent[];
  auditTrail: TierAudit[];
  summary: {
    totalDistributed: Decimal;
    returnOfCapital: Decimal;
    capitalGains: Decimal;
    preferredReturnPaid: Decimal;
    carriedInterestAmount: Decimal;
    lpTotalDistribution: Decimal;
    gpTotalDistribution: Decimal;
    effectiveIRR?: Decimal;
    multiple?: Decimal;
  };
}

class WaterfallCalculationService {
  private preferredReturnService: PreferredReturnService;
  private carriedInterestService: CarriedInterestService;
  private tierAuditService: TierAuditService;
  private distributionAllocationService: DistributionAllocationService;

  constructor() {
    this.preferredReturnService = new PreferredReturnService();
    this.carriedInterestService = new CarriedInterestService();
    this.tierAuditService = new TierAuditService();
    this.distributionAllocationService = new DistributionAllocationService();
  }

  /**
   * Main method to calculate waterfall distribution
   */
  async calculateWaterfall(inputs: CalculationInputs): Promise<CalculationResult> {
    try {
      // 1. Load fund and waterfall configuration
      const fund = await Fund.findByPk(inputs.fundId);
      if (!fund) {
        throw new Error(`Fund with ID ${inputs.fundId} not found`);
      }

      // 2. Get waterfall configuration
      const waterfallConfig = await this.getWaterfallConfig(fund);

      // 3. Get fund historical data
      const fundData = await this.getFundHistoricalData(inputs.fundId, inputs.distributionDate);

      // 4. Create waterfall calculation record
      const calculation = await this.createCalculationRecord(inputs, fundData);

      // 5. Execute tier-by-tier calculations
      const tierResults = await this.executeTierCalculations(
        calculation,
        waterfallConfig,
        inputs.distributionAmount,
        fundData
      );

      // 6. Allocate distributions to investors
      const distributions = await this.allocateDistributionsToInvestors(
        calculation,
        tierResults,
        fundData.commitments
      );

      // 7. Generate audit trail
      const auditTrail = await this.generateAuditTrail(calculation, tierResults);

      // 8. Calculate summary metrics
      const summary = this.calculateSummaryMetrics(tierResults, distributions, fundData);

      // 9. Update calculation with final results
      await this.updateCalculationResults(calculation, summary, tierResults);

      return {
        calculation,
        tiers: tierResults,
        distributions,
        auditTrail,
        summary,
      };
    } catch (error) {
      console.error('Waterfall calculation error:', error);
      throw new Error(`Waterfall calculation failed: ${error.message}`);
    }
  }

  /**
   * Execute calculations for each waterfall tier
   */
  private async executeTierCalculations(
    calculation: WaterfallCalculation,
    config: WaterfallConfig,
    distributionAmount: Decimal,
    fundData: any
  ): Promise<WaterfallTier[]> {
    const tiers: WaterfallTier[] = [];
    let remainingAmount = distributionAmount;
    let cumulativeDistributed = new Decimal(0);

    // Sort tiers by priority/level
    const sortedTiers = config.tiers.sort((a, b) => a.level - b.level);

    for (const tierConfig of sortedTiers) {
      const tier = await this.calculateTier(
        calculation,
        tierConfig,
        remainingAmount,
        cumulativeDistributed,
        fundData
      );

      tiers.push(tier);
      remainingAmount = remainingAmount.minus(tier.distributedAmountDecimal);
      cumulativeDistributed = cumulativeDistributed.plus(tier.distributedAmountDecimal);

      // If no more amount to distribute, break
      if (remainingAmount.lte(0)) {
        break;
      }
    }

    return tiers;
  }

  /**
   * Calculate individual tier distribution
   */
  private async calculateTier(
    calculation: WaterfallCalculation,
    tierConfig: any,
    availableAmount: Decimal,
    cumulativeDistributed: Decimal,
    fundData: any
  ): Promise<WaterfallTier> {
    let distributedAmount = new Decimal(0);
    let calculations: Record<string, any> = {};

    switch (tierConfig.type) {
      case 'preferred_return':
        const preferredResult = await this.preferredReturnService.calculatePreferredReturn(
          fundData.totalContributions,
          fundData.preferredReturnRate,
          fundData.daysSinceFirstContribution,
          fundData.previousPreferredPaid,
          availableAmount
        );
        distributedAmount = preferredResult.amountToDistribute;
        calculations = preferredResult.calculations;
        break;

      case 'catch_up':
        const catchUpResult = this.calculateCatchUp(
          cumulativeDistributed,
          fundData.carriedInterestRate,
          availableAmount,
          tierConfig
        );
        distributedAmount = catchUpResult.amountToDistribute;
        calculations = catchUpResult.calculations;
        break;

      case 'carried_interest':
        const carriedResult = await this.carriedInterestService.calculateCarriedInterest(
          availableAmount,
          fundData.carriedInterestRate,
          fundData.totalReturned,
          fundData.totalContributions
        );
        distributedAmount = carriedResult.amountToDistribute;
        calculations = carriedResult.calculations;
        break;

      case 'distribution':
        // Standard pro-rata distribution
        distributedAmount = availableAmount;
        calculations = {
          type: 'pro_rata_distribution',
          lpAllocation: availableAmount.mul(tierConfig.lpAllocation).div(100),
          gpAllocation: availableAmount.mul(tierConfig.gpAllocation).div(100),
        };
        break;

      default:
        throw new Error(`Unknown tier type: ${tierConfig.type}`);
    }

    // Create tier record
    const tier = await WaterfallTier.create({
      waterfallCalculationId: calculation.id,
      tierLevel: tierConfig.level,
      tierName: tierConfig.name,
      tierType: tierConfig.type,
      priority: tierConfig.level,
      lpAllocation: tierConfig.lpAllocation.toString(),
      gpAllocation: tierConfig.gpAllocation.toString(),
      thresholdAmount: tierConfig.threshold?.toString(),
      targetAmount: tierConfig.target?.toString(),
      actualAmount: availableAmount.toString(),
      distributedAmount: distributedAmount.toString(),
      remainingAmount: availableAmount.minus(distributedAmount).toString(),
      isFullyAllocated: distributedAmount.gte(availableAmount),
      allocationMethod: 'waterfall',
      calculations,
      investorAllocations: {},
    });

    return tier;
  }

  /**
   * Calculate catch-up provision
   */
  private calculateCatchUp(
    cumulativeDistributed: Decimal,
    carriedInterestRate: Decimal,
    availableAmount: Decimal,
    tierConfig: any
  ): { amountToDistribute: Decimal; calculations: Record<string, any> } {
    // Catch-up allows GP to receive distributions until they have their carried interest percentage
    const targetGPAmount = cumulativeDistributed.mul(carriedInterestRate).div(100);
    const currentGPAmount = cumulativeDistributed.mul(tierConfig.gpAllocation).div(100);
    const catchUpNeeded = targetGPAmount.minus(currentGPAmount);

    const amountToDistribute = Decimal.min(availableAmount, catchUpNeeded.gt(0) ? catchUpNeeded : new Decimal(0));

    return {
      amountToDistribute,
      calculations: {
        type: 'catch_up',
        targetGPAmount: targetGPAmount.toString(),
        currentGPAmount: currentGPAmount.toString(),
        catchUpNeeded: catchUpNeeded.toString(),
        cumulativeDistributed: cumulativeDistributed.toString(),
        carriedInterestRate: carriedInterestRate.toString(),
      },
    };
  }

  /**
   * Allocate tier distributions to individual investors
   */
  private async allocateDistributionsToInvestors(
    calculation: WaterfallCalculation,
    tiers: WaterfallTier[],
    commitments: any[]
  ): Promise<DistributionEvent[]> {
    return await this.distributionAllocationService.allocateToInvestors(
      calculation,
      tiers,
      commitments
    );
  }

  /**
   * Generate comprehensive audit trail
   */
  private async generateAuditTrail(
    calculation: WaterfallCalculation,
    tiers: WaterfallTier[]
  ): Promise<TierAudit[]> {
    return await this.tierAuditService.generateAuditTrail(calculation, tiers);
  }

  /**
   * Create calculation record
   */
  private async createCalculationRecord(
    inputs: CalculationInputs,
    fundData: any
  ): Promise<WaterfallCalculation> {
    return await WaterfallCalculation.create({
      fundId: inputs.fundId,
      capitalActivityId: inputs.capitalActivityId,
      calculationType: inputs.calculationType,
      calculationDate: inputs.distributionDate,
      totalDistribution: inputs.distributionAmount.toString(),
      totalDistributed: '0',
      returnOfCapital: '0',
      capitalGains: '0',
      preferredReturnAccrued: '0',
      preferredReturnPaid: '0',
      catchUpAmount: '0',
      carriedInterestAmount: '0',
      cumulativeDistributions: fundData.cumulativeDistributions.toString(),
      cumulativeReturned: fundData.cumulativeReturned.toString(),
      remainingCapital: fundData.remainingCapital.toString(),
      status: 'calculated',
      tierResults: {},
      allocationResults: {},
      auditTrail: {
        calculationStart: new Date().toISOString(),
        inputs: inputs,
        fundData: fundData,
        calculations: [],
        decisions: [],
        allocations: [],
      },
      calculationInputs: {
        distributionAmount: inputs.distributionAmount.toString(),
        distributionDate: inputs.distributionDate.toISOString(),
        calculationType: inputs.calculationType,
        fundId: inputs.fundId,
      },
      createdBy: inputs.userId,
    });
  }

  /**
   * Get waterfall configuration for fund
   */
  private async getWaterfallConfig(fund: Fund): Promise<WaterfallConfig> {
    // Default waterfall structure - in production this would come from fund settings
    const defaultConfig: WaterfallConfig = {
      tiers: [
        {
          level: 1,
          name: 'Return of Capital',
          type: 'distribution',
          lpAllocation: new Decimal(100),
          gpAllocation: new Decimal(0),
        },
        {
          level: 2,
          name: 'Preferred Return',
          type: 'preferred_return',
          lpAllocation: new Decimal(100),
          gpAllocation: new Decimal(0),
        },
        {
          level: 3,
          name: 'Catch-Up',
          type: 'catch_up',
          lpAllocation: new Decimal(0),
          gpAllocation: new Decimal(100),
        },
        {
          level: 4,
          name: 'Carried Interest Split',
          type: 'carried_interest',
          lpAllocation: new Decimal(80),
          gpAllocation: new Decimal(20),
        },
      ],
      preferredReturnRate: new Decimal(fund.preferredReturnRate),
      carriedInterestRate: new Decimal(fund.carriedInterestRate),
      catchUpPercentage: new Decimal(100), // 100% catch-up to GP
      distributionFrequency: 'as_needed',
    };

    // TODO: Load from fund.settings.waterfallStructure if customized
    return defaultConfig;
  }

  /**
   * Get fund historical data for calculations
   */
  private async getFundHistoricalData(fundId: number, asOfDate: Date): Promise<any> {
    // Load commitments
    const commitments = await Commitment.findAll({
      where: { fundId },
      include: ['investorEntity'],
    });

    // Calculate total contributions
    const totalContributions = commitments.reduce((sum, commitment) => {
      return sum.plus(new Decimal(commitment.capitalCalled || '0'));
    }, new Decimal(0));

    // Get previous distributions
    const previousCalculations = await WaterfallCalculation.findAll({
      where: {
        fundId,
        calculationDate: { [Op.lt]: asOfDate },
        status: 'distributed',
      },
      order: [['calculationDate', 'DESC']],
    });

    const cumulativeDistributions = previousCalculations.reduce((sum, calc) => {
      return sum.plus(new Decimal(calc.totalDistributed));
    }, new Decimal(0));

    // Calculate preferred return data
    const fund = await Fund.findByPk(fundId);
    const preferredReturnRate = new Decimal(fund!.preferredReturnRate);
    const carriedInterestRate = new Decimal(fund!.carriedInterestRate);

    // Calculate days since first contribution
    const firstContribution = commitments
      .filter(c => c.commitmentDate)
      .sort((a, b) => a.commitmentDate!.getTime() - b.commitmentDate!.getTime())[0];

    const daysSinceFirstContribution = firstContribution
      ? Math.floor((asOfDate.getTime() - firstContribution.commitmentDate!.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      commitments,
      totalContributions,
      cumulativeDistributions,
      cumulativeReturned: cumulativeDistributions, // Simplified
      remainingCapital: totalContributions.minus(cumulativeDistributions),
      preferredReturnRate,
      carriedInterestRate,
      daysSinceFirstContribution,
      previousPreferredPaid: new Decimal(0), // TODO: Calculate from previous distributions
      totalReturned: cumulativeDistributions,
    };
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummaryMetrics(
    tiers: WaterfallTier[],
    distributions: DistributionEvent[],
    fundData: any
  ): any {
    const totalDistributed = tiers.reduce((sum, tier) => {
      return sum.plus(tier.distributedAmountDecimal);
    }, new Decimal(0));

    const lpTotalDistribution = distributions
      .filter(d => d.eventType !== 'carried_interest')
      .reduce((sum, dist) => sum.plus(dist.distributionAmountDecimal), new Decimal(0));

    const gpTotalDistribution = distributions
      .filter(d => d.eventType === 'carried_interest')
      .reduce((sum, dist) => sum.plus(dist.distributionAmountDecimal), new Decimal(0));

    const returnOfCapital = distributions
      .filter(d => d.eventType === 'return_of_capital')
      .reduce((sum, dist) => sum.plus(dist.distributionAmountDecimal), new Decimal(0));

    const capitalGains = distributions
      .filter(d => d.eventType === 'capital_gains')
      .reduce((sum, dist) => sum.plus(dist.distributionAmountDecimal), new Decimal(0));

    const preferredReturnPaid = distributions
      .filter(d => d.eventType === 'preferred_return')
      .reduce((sum, dist) => sum.plus(dist.distributionAmountDecimal), new Decimal(0));

    const carriedInterestAmount = distributions
      .filter(d => d.eventType === 'carried_interest')
      .reduce((sum, dist) => sum.plus(dist.distributionAmountDecimal), new Decimal(0));

    return {
      totalDistributed,
      returnOfCapital,
      capitalGains,
      preferredReturnPaid,
      carriedInterestAmount,
      lpTotalDistribution,
      gpTotalDistribution,
    };
  }

  /**
   * Update calculation with final results
   */
  private async updateCalculationResults(
    calculation: WaterfallCalculation,
    summary: any,
    tiers: WaterfallTier[]
  ): Promise<void> {
    await calculation.update({
      totalDistributed: summary.totalDistributed.toString(),
      returnOfCapital: summary.returnOfCapital.toString(),
      capitalGains: summary.capitalGains.toString(),
      preferredReturnPaid: summary.preferredReturnPaid.toString(),
      carriedInterestAmount: summary.carriedInterestAmount.toString(),
      tierResults: {
        tiers: tiers.map(t => ({
          level: t.tierLevel,
          name: t.tierName,
          type: t.tierType,
          distributed: t.distributedAmount,
          remaining: t.remainingAmount,
        })),
        summary: {
          lpTotal: summary.lpTotalDistribution.toString(),
          gpTotal: summary.gpTotalDistribution.toString(),
        },
      },
      allocationResults: summary,
    });
  }

  /**
   * Create hypothetical waterfall scenario
   */
  async createHypotheticalScenario(
    fundId: number,
    scenarios: Array<{ distributionAmount: Decimal; date: Date }>,
    userId: number
  ): Promise<CalculationResult[]> {
    const results: CalculationResult[] = [];

    for (const scenario of scenarios) {
      const result = await this.calculateWaterfall({
        fundId,
        distributionAmount: scenario.distributionAmount,
        distributionDate: scenario.date,
        calculationType: 'hypothetical',
        userId,
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Validate waterfall calculation
   */
  validateCalculation(result: CalculationResult): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that total distributed equals sum of tier distributions
    const tierSum = result.tiers.reduce((sum, tier) => {
      return sum.plus(tier.distributedAmountDecimal);
    }, new Decimal(0));

    if (!tierSum.equals(result.summary.totalDistributed)) {
      errors.push('Tier distribution sum does not match total distributed amount');
    }

    // Check that LP + GP allocations equal 100%
    for (const tier of result.tiers) {
      const totalAllocation = tier.lpAllocationDecimal.plus(tier.gpAllocationDecimal);
      if (!totalAllocation.equals(100)) {
        errors.push(`Tier ${tier.tierName} allocations do not sum to 100%`);
      }
    }

    // Check that distribution events sum matches tier distributions
    const distributionSum = result.distributions.reduce((sum, dist) => {
      return sum.plus(dist.distributionAmountDecimal);
    }, new Decimal(0));

    if (!distributionSum.equals(result.summary.totalDistributed)) {
      errors.push('Distribution events sum does not match total distributed amount');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Import Op for Sequelize operators
const { Op } = require('sequelize');

export default WaterfallCalculationService;