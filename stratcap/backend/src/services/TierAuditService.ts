import { Decimal } from 'decimal.js';
import TierAudit from '../models/TierAudit';
import WaterfallCalculation from '../models/WaterfallCalculation';
import WaterfallTier from '../models/WaterfallTier';

interface AuditStep {
  stepNumber: number;
  stepName: string;
  stepType: 'calculation' | 'allocation' | 'validation' | 'adjustment';
  inputAmount: Decimal;
  outputAmount: Decimal;
  formula: string;
  description: string;
  calculations: Record<string, any>;
  intermediateResults: Record<string, any>;
  allocationBreakdown: Record<string, any>;
  validationResults: Record<string, any>;
  notes?: string;
}

class TierAuditService {
  /**
   * Generate comprehensive audit trail for waterfall calculation
   */
  async generateAuditTrail(
    calculation: WaterfallCalculation,
    tiers: WaterfallTier[]
  ): Promise<TierAudit[]> {
    const auditRecords: TierAudit[] = [];

    for (const tier of tiers) {
      const tierAudits = await this.generateTierAuditSteps(calculation, tier);
      auditRecords.push(...tierAudits);
    }

    return auditRecords;
  }

  /**
   * Generate audit steps for a specific tier
   */
  private async generateTierAuditSteps(
    calculation: WaterfallCalculation,
    tier: WaterfallTier
  ): Promise<TierAudit[]> {
    const auditSteps: AuditStep[] = [];

    // Step 1: Input validation
    auditSteps.push(this.createInputValidationStep(tier));

    // Step 2: Tier-specific calculation
    auditSteps.push(this.createTierCalculationStep(tier));

    // Step 3: Allocation calculation
    auditSteps.push(this.createAllocationStep(tier));

    // Step 4: Distribution validation
    auditSteps.push(this.createDistributionValidationStep(tier));

    // Step 5: Final reconciliation
    auditSteps.push(this.createReconciliationStep(tier));

    // Create audit records
    const auditRecords: TierAudit[] = [];
    for (const step of auditSteps) {
      const auditRecord = await TierAudit.create({
        waterfallCalculationId: calculation.id,
        waterfallTierId: tier.id,
        stepNumber: step.stepNumber,
        stepName: step.stepName,
        stepType: step.stepType,
        inputAmount: step.inputAmount.toString(),
        outputAmount: step.outputAmount.toString(),
        formula: step.formula,
        description: step.description,
        calculations: step.calculations,
        intermediateResults: step.intermediateResults,
        allocationBreakdown: step.allocationBreakdown,
        validationResults: step.validationResults,
        isValidationPassed: this.validateStep(step),
        notes: step.notes,
      });

      auditRecords.push(auditRecord);
    }

    return auditRecords;
  }

  /**
   * Create input validation audit step
   */
  private createInputValidationStep(tier: WaterfallTier): AuditStep {
    const inputAmount = tier.actualAmountDecimal;
    const validationResults: Record<string, any> = {};

    // Validate input amount
    validationResults.inputAmountPositive = {
      test: 'Input amount >= 0',
      result: inputAmount.gte(0),
      value: inputAmount.toString(),
    };

    // Validate allocation percentages
    const totalAllocation = tier.lpAllocationDecimal.plus(tier.gpAllocationDecimal);
    validationResults.allocationSum = {
      test: 'LP + GP allocation = 100%',
      result: totalAllocation.equals(100),
      lpAllocation: tier.lpAllocation,
      gpAllocation: tier.gpAllocation,
      total: totalAllocation.toString(),
    };

    // Validate threshold if applicable
    if (tier.thresholdAmount) {
      validationResults.thresholdCheck = {
        test: 'Threshold amount validation',
        result: tier.thresholdAmountDecimal!.gte(0),
        threshold: tier.thresholdAmount,
      };
    }

    return {
      stepNumber: 1,
      stepName: 'Input Validation',
      stepType: 'validation',
      inputAmount,
      outputAmount: inputAmount,
      formula: 'N/A - Validation step',
      description: `Validate input parameters for ${tier.tierName} tier`,
      calculations: {
        tierType: tier.tierType,
        tierName: tier.tierName,
        inputAmount: inputAmount.toString(),
        lpAllocation: tier.lpAllocation,
        gpAllocation: tier.gpAllocation,
        thresholdAmount: tier.thresholdAmount,
        targetAmount: tier.targetAmount,
      },
      intermediateResults: {},
      allocationBreakdown: {},
      validationResults,
    };
  }

  /**
   * Create tier calculation audit step
   */
  private createTierCalculationStep(tier: WaterfallTier): AuditStep {
    const inputAmount = tier.actualAmountDecimal;
    const outputAmount = tier.distributedAmountDecimal;
    
    let formula = '';
    let description = '';
    const calculations: Record<string, any> = {};

    switch (tier.tierType) {
      case 'preferred_return':
        formula = 'min(available_amount, accrued_preferred_return)';
        description = 'Calculate preferred return distribution based on accrued amount';
        calculations.accruedAmount = tier.calculations?.accruedAmount || '0';
        calculations.availableAmount = inputAmount.toString();
        break;

      case 'catch_up':
        formula = 'min(available_amount, catch_up_needed)';
        description = 'Calculate catch-up amount to bring GP to target carried interest percentage';
        calculations.catchUpNeeded = tier.calculations?.catchUpNeeded || '0';
        break;

      case 'carried_interest':
        formula = 'available_amount * (carried_interest_rate / 100)';
        description = 'Calculate carried interest based on carried interest rate';
        calculations.carriedInterestRate = tier.calculations?.carriedInterestRate || '0';
        break;

      case 'distribution':
        formula = 'available_amount * allocation_percentage';
        description = 'Calculate pro-rata distribution based on allocation percentages';
        break;

      default:
        formula = 'custom_calculation';
        description = `Custom calculation for ${tier.tierType}`;
    }

    return {
      stepNumber: 2,
      stepName: 'Tier Calculation',
      stepType: 'calculation',
      inputAmount,
      outputAmount,
      formula,
      description,
      calculations: {
        ...calculations,
        tierType: tier.tierType,
        inputAmount: inputAmount.toString(),
        outputAmount: outputAmount.toString(),
        calculationMethod: tier.allocationMethod,
      },
      intermediateResults: tier.calculations || {},
      allocationBreakdown: {},
      validationResults: {},
    };
  }

  /**
   * Create allocation audit step
   */
  private createAllocationStep(tier: WaterfallTier): AuditStep {
    const distributedAmount = tier.distributedAmountDecimal;
    const lpAmount = distributedAmount.mul(tier.lpAllocationDecimal).div(100);
    const gpAmount = distributedAmount.mul(tier.gpAllocationDecimal).div(100);

    const allocationBreakdown = {
      totalDistributed: distributedAmount.toString(),
      lpAllocation: {
        percentage: tier.lpAllocation,
        amount: lpAmount.toString(),
      },
      gpAllocation: {
        percentage: tier.gpAllocation,
        amount: gpAmount.toString(),
      },
      validation: {
        sum: lpAmount.plus(gpAmount).toString(),
        matches: lpAmount.plus(gpAmount).equals(distributedAmount),
      },
    };

    return {
      stepNumber: 3,
      stepName: 'LP/GP Allocation',
      stepType: 'allocation',
      inputAmount: distributedAmount,
      outputAmount: distributedAmount,
      formula: 'lp_amount = distributed * (lp_percentage / 100); gp_amount = distributed * (gp_percentage / 100)',
      description: 'Allocate tier distribution between LP and GP based on allocation percentages',
      calculations: {
        distributedAmount: distributedAmount.toString(),
        lpPercentage: tier.lpAllocation,
        gpPercentage: tier.gpAllocation,
        lpAmount: lpAmount.toString(),
        gpAmount: gpAmount.toString(),
      },
      intermediateResults: {
        lpCalculation: `${distributedAmount.toString()} * ${tier.lpAllocation}% = ${lpAmount.toString()}`,
        gpCalculation: `${distributedAmount.toString()} * ${tier.gpAllocation}% = ${gpAmount.toString()}`,
      },
      allocationBreakdown,
      validationResults: {},
    };
  }

  /**
   * Create distribution validation audit step
   */
  private createDistributionValidationStep(tier: WaterfallTier): AuditStep {
    const distributedAmount = tier.distributedAmountDecimal;
    const actualAmount = tier.actualAmountDecimal;
    const remainingAmount = tier.remainingAmountDecimal;

    const validationResults: Record<string, any> = {};

    // Validate distribution amount doesn't exceed available amount
    validationResults.distributionWithinAvailable = {
      test: 'Distributed amount <= Available amount',
      result: distributedAmount.lte(actualAmount),
      distributed: distributedAmount.toString(),
      available: actualAmount.toString(),
    };

    // Validate remaining amount calculation
    const calculatedRemaining = actualAmount.minus(distributedAmount);
    validationResults.remainingCalculation = {
      test: 'Remaining = Available - Distributed',
      result: remainingAmount.equals(calculatedRemaining),
      calculated: calculatedRemaining.toString(),
      stored: remainingAmount.toString(),
    };

    // Validate tier is marked as fully allocated if no remaining amount
    validationResults.fullyAllocatedFlag = {
      test: 'Fully allocated flag matches remaining amount',
      result: tier.isFullyAllocated === remainingAmount.isZero(),
      isFullyAllocated: tier.isFullyAllocated,
      remainingAmount: remainingAmount.toString(),
    };

    return {
      stepNumber: 4,
      stepName: 'Distribution Validation',
      stepType: 'validation',
      inputAmount: actualAmount,
      outputAmount: distributedAmount,
      formula: 'remaining = available - distributed',
      description: 'Validate distribution calculations and remaining amounts',
      calculations: {
        actualAmount: actualAmount.toString(),
        distributedAmount: distributedAmount.toString(),
        remainingAmount: remainingAmount.toString(),
        isFullyAllocated: tier.isFullyAllocated,
      },
      intermediateResults: {
        remainingCalculation: `${actualAmount.toString()} - ${distributedAmount.toString()} = ${calculatedRemaining.toString()}`,
      },
      allocationBreakdown: {},
      validationResults,
    };
  }

  /**
   * Create reconciliation audit step
   */
  private createReconciliationStep(tier: WaterfallTier): AuditStep {
    const distributedAmount = tier.distributedAmountDecimal;
    const lpAmount = distributedAmount.mul(tier.lpAllocationDecimal).div(100);
    const gpAmount = distributedAmount.mul(tier.gpAllocationDecimal).div(100);
    const reconciledTotal = lpAmount.plus(gpAmount);

    const validationResults: Record<string, any> = {};

    // Reconcile total amounts
    validationResults.totalReconciliation = {
      test: 'LP + GP amounts = Total distributed',
      result: reconciledTotal.equals(distributedAmount),
      lpAmount: lpAmount.toString(),
      gpAmount: gpAmount.toString(),
      reconciledTotal: reconciledTotal.toString(),
      distributedAmount: distributedAmount.toString(),
      difference: reconciledTotal.minus(distributedAmount).toString(),
    };

    // Check for rounding issues
    const roundingTolerance = new Decimal('0.01'); // 1 cent tolerance
    const roundingDifference = reconciledTotal.minus(distributedAmount).abs();
    validationResults.roundingCheck = {
      test: 'Rounding difference within tolerance',
      result: roundingDifference.lte(roundingTolerance),
      difference: roundingDifference.toString(),
      tolerance: roundingTolerance.toString(),
    };

    return {
      stepNumber: 5,
      stepName: 'Final Reconciliation',
      stepType: 'validation',
      inputAmount: distributedAmount,
      outputAmount: reconciledTotal,
      formula: 'total_check = lp_amount + gp_amount',
      description: 'Final reconciliation of all tier calculations and allocations',
      calculations: {
        tierName: tier.tierName,
        tierType: tier.tierType,
        distributedAmount: distributedAmount.toString(),
        lpAmount: lpAmount.toString(),
        gpAmount: gpAmount.toString(),
        reconciledTotal: reconciledTotal.toString(),
        roundingDifference: roundingDifference.toString(),
      },
      intermediateResults: {
        reconciliationFormula: `${lpAmount.toString()} + ${gpAmount.toString()} = ${reconciledTotal.toString()}`,
        comparisonResult: reconciledTotal.equals(distributedAmount) ? 'MATCH' : 'MISMATCH',
      },
      allocationBreakdown: {
        lpFinal: lpAmount.toString(),
        gpFinal: gpAmount.toString(),
        totalFinal: reconciledTotal.toString(),
      },
      validationResults,
    };
  }

  /**
   * Validate audit step
   */
  private validateStep(step: AuditStep): boolean {
    const validationResults = step.validationResults;
    
    for (const [key, validation] of Object.entries(validationResults)) {
      if (typeof validation === 'object' && validation.result === false) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Generate summary audit report
   */
  async generateAuditSummary(calculationId: number): Promise<{
    totalSteps: number;
    passedSteps: number;
    failedSteps: number;
    issues: Array<{
      tierId: number;
      tierName: string;
      stepName: string;
      issue: string;
    }>;
    calculations: Record<string, any>;
  }> {
    const audits = await TierAudit.findAll({
      where: { waterfallCalculationId: calculationId },
      include: [{ model: WaterfallTier, as: 'waterfallTier' }],
      order: [['waterfallTierId', 'ASC'], ['stepNumber', 'ASC']],
    });

    const totalSteps = audits.length;
    const passedSteps = audits.filter(a => a.isValidationPassed).length;
    const failedSteps = totalSteps - passedSteps;

    const issues: Array<{
      tierId: number;
      tierName: string;
      stepName: string;
      issue: string;
    }> = [];

    for (const audit of audits) {
      if (!audit.isValidationPassed) {
        const tier = audit.waterfallTier;
        for (const [key, validation] of Object.entries(audit.validationResults)) {
          if (typeof validation === 'object' && validation.result === false) {
            issues.push({
              tierId: audit.waterfallTierId,
              tierName: tier?.tierName || 'Unknown',
              stepName: audit.stepName,
              issue: `${key}: ${validation.test || 'Validation failed'}`,
            });
          }
        }
      }
    }

    const calculations = {
      totalSteps,
      passedSteps,
      failedSteps,
      passRate: totalSteps > 0 ? (passedSteps / totalSteps * 100).toFixed(2) + '%' : '0%',
      issues: issues.length,
    };

    return {
      totalSteps,
      passedSteps,
      failedSteps,
      issues,
      calculations,
    };
  }

  /**
   * Validate entire waterfall calculation
   */
  async validateWaterfallCalculation(calculationId: number): Promise<{
    isValid: boolean;
    validationScore: number;
    issues: string[];
    recommendations: string[];
  }> {
    const summary = await this.generateAuditSummary(calculationId);
    const isValid = summary.failedSteps === 0;
    const validationScore = summary.totalSteps > 0 ? (summary.passedSteps / summary.totalSteps) * 100 : 0;

    const issues = summary.issues.map(issue => 
      `${issue.tierName} - ${issue.stepName}: ${issue.issue}`
    );

    const recommendations: string[] = [];
    
    if (summary.failedSteps > 0) {
      recommendations.push('Review and correct failed validation steps');
    }
    
    if (validationScore < 95) {
      recommendations.push('Consider reviewing calculation methodology');
    }

    if (summary.issues.length > 0) {
      recommendations.push('Address all identified issues before finalizing calculation');
    }

    return {
      isValid,
      validationScore,
      issues,
      recommendations,
    };
  }

  /**
   * Export audit trail to structured format
   */
  async exportAuditTrail(calculationId: number): Promise<{
    calculation: any;
    tiers: Array<{
      tier: any;
      auditSteps: any[];
    }>;
    summary: any;
  }> {
    const calculation = await WaterfallCalculation.findByPk(calculationId);
    const audits = await TierAudit.findAll({
      where: { waterfallCalculationId: calculationId },
      include: [{ model: WaterfallTier, as: 'waterfallTier' }],
      order: [['waterfallTierId', 'ASC'], ['stepNumber', 'ASC']],
    });

    const summary = await this.generateAuditSummary(calculationId);

    // Group audits by tier
    const tierGroups = audits.reduce((groups, audit) => {
      const tierId = audit.waterfallTierId;
      if (!groups[tierId]) {
        groups[tierId] = {
          tier: audit.waterfallTier,
          auditSteps: [],
        };
      }
      groups[tierId].auditSteps.push(audit);
      return groups;
    }, {} as Record<number, any>);

    return {
      calculation,
      tiers: Object.values(tierGroups),
      summary,
    };
  }
}

export default TierAuditService;