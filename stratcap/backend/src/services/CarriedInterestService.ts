import { Decimal } from 'decimal.js';

interface CarriedInterestCalculation {
  carriedInterestEarned: Decimal;
  amountToDistribute: Decimal;
  lpAmount: Decimal;
  gpAmount: Decimal;
  calculations: Record<string, any>;
}

interface HurdleCalculation {
  hurdleAmount: Decimal;
  hurdleMet: boolean;
  excessAmount: Decimal;
  calculations: Record<string, any>;
}

interface ClawbackCalculation {
  clawbackRequired: Decimal;
  currentOverdistribution: Decimal;
  netCarriedInterest: Decimal;
  calculations: Record<string, any>;
}

class CarriedInterestService {
  /**
   * Calculate carried interest distribution
   */
  async calculateCarriedInterest(
    distributionAmount: Decimal,
    carriedInterestRate: Decimal,
    totalReturned: Decimal,
    totalContributions: Decimal,
    hurdleRate?: Decimal,
    previousCarriedPaid?: Decimal
  ): Promise<CarriedInterestCalculation> {
    try {
      // Check if hurdle rate is met (if applicable)
      let hurdleResult: HurdleCalculation | null = null;
      if (hurdleRate) {
        hurdleResult = this.calculateHurdle(totalReturned, totalContributions, hurdleRate);
        if (!hurdleResult.hurdleMet) {
          return this.createZeroCarriedInterestResult(distributionAmount, hurdleResult);
        }
      }

      // Calculate carried interest on the distribution
      const carriedInterestEarned = distributionAmount.mul(carriedInterestRate).div(100);
      
      // Split between LP and GP
      const gpAmount = carriedInterestEarned;
      const lpAmount = distributionAmount.minus(gpAmount);

      const calculations = {
        inputs: {
          distributionAmount: distributionAmount.toString(),
          carriedInterestRate: carriedInterestRate.toString(),
          totalReturned: totalReturned.toString(),
          totalContributions: totalContributions.toString(),
          hurdleRate: hurdleRate?.toString() || null,
          previousCarriedPaid: previousCarriedPaid?.toString() || '0',
        },
        hurdleCalculation: hurdleResult?.calculations || null,
        carriedInterestCalculation: {
          carriedInterestEarned: carriedInterestEarned.toString(),
          gpAmount: gpAmount.toString(),
          lpAmount: lpAmount.toString(),
          formula: 'distributionAmount * (carriedInterestRate / 100)',
        },
      };

      return {
        carriedInterestEarned,
        amountToDistribute: distributionAmount,
        lpAmount,
        gpAmount,
        calculations,
      };
    } catch (error) {
      throw new Error(`Carried interest calculation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate hurdle requirement
   */
  private calculateHurdle(
    totalReturned: Decimal,
    totalContributions: Decimal,
    hurdleRate: Decimal
  ): HurdleCalculation {
    const hurdleAmount = totalContributions.mul(hurdleRate).div(100);
    const hurdleMet = totalReturned.gte(hurdleAmount);
    const excessAmount = totalReturned.minus(hurdleAmount);

    const calculations = {
      totalReturned: totalReturned.toString(),
      totalContributions: totalContributions.toString(),
      hurdleRate: hurdleRate.toString(),
      hurdleAmount: hurdleAmount.toString(),
      hurdleMet,
      excessAmount: excessAmount.toString(),
      formula: 'hurdleAmount = totalContributions * (hurdleRate / 100)',
    };

    return {
      hurdleAmount,
      hurdleMet,
      excessAmount: excessAmount.gt(0) ? excessAmount : new Decimal(0),
      calculations,
    };
  }

  /**
   * Create zero carried interest result when hurdle not met
   */
  private createZeroCarriedInterestResult(
    distributionAmount: Decimal,
    hurdleResult: HurdleCalculation
  ): CarriedInterestCalculation {
    return {
      carriedInterestEarned: new Decimal(0),
      amountToDistribute: distributionAmount,
      lpAmount: distributionAmount,
      gpAmount: new Decimal(0),
      calculations: {
        hurdleCalculation: hurdleResult.calculations,
        carriedInterestCalculation: {
          carriedInterestEarned: '0',
          gpAmount: '0',
          lpAmount: distributionAmount.toString(),
          reason: 'Hurdle rate not met',
        },
      },
    };
  }

  /**
   * Calculate European waterfall carried interest
   */
  async calculateEuropeanCarriedInterest(
    totalFundProceeds: Decimal,
    totalContributions: Decimal,
    carriedInterestRate: Decimal,
    hurdleRate?: Decimal
  ): Promise<CarriedInterestCalculation> {
    // European waterfall: carried interest only on total profits at end
    const totalProfit = totalFundProceeds.minus(totalContributions);
    
    if (totalProfit.lte(0)) {
      return {
        carriedInterestEarned: new Decimal(0),
        amountToDistribute: new Decimal(0),
        lpAmount: new Decimal(0),
        gpAmount: new Decimal(0),
        calculations: {
          reason: 'No profits available for carried interest',
          totalProfit: totalProfit.toString(),
        },
      };
    }

    let carriedInterestBase = totalProfit;

    // Apply hurdle if specified
    if (hurdleRate) {
      const hurdleResult = this.calculateHurdle(totalFundProceeds, totalContributions, hurdleRate);
      if (!hurdleResult.hurdleMet) {
        return this.createZeroCarriedInterestResult(new Decimal(0), hurdleResult);
      }
      carriedInterestBase = hurdleResult.excessAmount;
    }

    const carriedInterestEarned = carriedInterestBase.mul(carriedInterestRate).div(100);
    const lpAmount = totalProfit.minus(carriedInterestEarned);

    const calculations = {
      methodology: 'European Waterfall',
      inputs: {
        totalFundProceeds: totalFundProceeds.toString(),
        totalContributions: totalContributions.toString(),
        carriedInterestRate: carriedInterestRate.toString(),
        hurdleRate: hurdleRate?.toString() || null,
      },
      calculations: {
        totalProfit: totalProfit.toString(),
        carriedInterestBase: carriedInterestBase.toString(),
        carriedInterestEarned: carriedInterestEarned.toString(),
        lpAmount: lpAmount.toString(),
        formula: 'carriedInterest = totalProfit * (carriedInterestRate / 100)',
      },
    };

    return {
      carriedInterestEarned,
      amountToDistribute: totalProfit,
      lpAmount,
      gpAmount: carriedInterestEarned,
      calculations,
    };
  }

  /**
   * Calculate American waterfall carried interest with catch-up
   */
  async calculateAmericanCarriedInterestWithCatchUp(
    distributionAmount: Decimal,
    carriedInterestRate: Decimal,
    cumulativeDistributions: Decimal,
    cumulativeCarriedPaid: Decimal,
    catchUpPercentage: Decimal = new Decimal(100)
  ): Promise<{
    carriedInterest: CarriedInterestCalculation;
    catchUpAmount: Decimal;
    calculations: Record<string, any>;
  }> {
    // Calculate target carried interest based on cumulative distributions
    const targetCarriedInterest = cumulativeDistributions.mul(carriedInterestRate).div(100);
    
    // Calculate catch-up needed
    const catchUpNeeded = targetCarriedInterest.minus(cumulativeCarriedPaid);
    const catchUpAmount = Decimal.min(distributionAmount, catchUpNeeded.gt(0) ? catchUpNeeded : new Decimal(0));
    
    // Remaining amount after catch-up goes to normal split
    const remainingAmount = distributionAmount.minus(catchUpAmount);
    const normalCarriedInterest = remainingAmount.mul(carriedInterestRate).div(100);
    
    const totalGPAmount = catchUpAmount.plus(normalCarriedInterest);
    const totalLPAmount = distributionAmount.minus(totalGPAmount);

    const calculations = {
      methodology: 'American Waterfall with Catch-Up',
      inputs: {
        distributionAmount: distributionAmount.toString(),
        carriedInterestRate: carriedInterestRate.toString(),
        cumulativeDistributions: cumulativeDistributions.toString(),
        cumulativeCarriedPaid: cumulativeCarriedPaid.toString(),
        catchUpPercentage: catchUpPercentage.toString(),
      },
      calculations: {
        targetCarriedInterest: targetCarriedInterest.toString(),
        catchUpNeeded: catchUpNeeded.toString(),
        catchUpAmount: catchUpAmount.toString(),
        remainingAmount: remainingAmount.toString(),
        normalCarriedInterest: normalCarriedInterest.toString(),
        totalGPAmount: totalGPAmount.toString(),
        totalLPAmount: totalLPAmount.toString(),
      },
    };

    const carriedInterest: CarriedInterestCalculation = {
      carriedInterestEarned: totalGPAmount,
      amountToDistribute: distributionAmount,
      lpAmount: totalLPAmount,
      gpAmount: totalGPAmount,
      calculations,
    };

    return {
      carriedInterest,
      catchUpAmount,
      calculations,
    };
  }

  /**
   * Calculate clawback provisions
   */
  async calculateClawback(
    totalDistributions: Decimal,
    totalContributions: Decimal,
    totalCarriedInterestPaid: Decimal,
    carriedInterestRate: Decimal
  ): Promise<ClawbackCalculation> {
    // Calculate what carried interest should have been based on final results
    const finalProfit = totalDistributions.minus(totalContributions);
    const correctCarriedInterest = finalProfit.gt(0) 
      ? finalProfit.mul(carriedInterestRate).div(100) 
      : new Decimal(0);

    // Calculate overdistribution
    const currentOverdistribution = totalCarriedInterestPaid.minus(correctCarriedInterest);
    const clawbackRequired = currentOverdistribution.gt(0) ? currentOverdistribution : new Decimal(0);
    
    const netCarriedInterest = totalCarriedInterestPaid.minus(clawbackRequired);

    const calculations = {
      inputs: {
        totalDistributions: totalDistributions.toString(),
        totalContributions: totalContributions.toString(),
        totalCarriedInterestPaid: totalCarriedInterestPaid.toString(),
        carriedInterestRate: carriedInterestRate.toString(),
      },
      calculations: {
        finalProfit: finalProfit.toString(),
        correctCarriedInterest: correctCarriedInterest.toString(),
        currentOverdistribution: currentOverdistribution.toString(),
        clawbackRequired: clawbackRequired.toString(),
        netCarriedInterest: netCarriedInterest.toString(),
      },
      formulas: {
        finalProfit: 'totalDistributions - totalContributions',
        correctCarriedInterest: 'finalProfit * (carriedInterestRate / 100)',
        clawbackRequired: 'max(0, totalCarriedInterestPaid - correctCarriedInterest)',
      },
    };

    return {
      clawbackRequired,
      currentOverdistribution,
      netCarriedInterest,
      calculations,
    };
  }

  /**
   * Calculate carried interest with performance hurdles
   */
  async calculateCarriedInterestWithHurdles(
    distributionAmount: Decimal,
    totalReturned: Decimal,
    totalContributions: Decimal,
    hurdleStructure: Array<{
      threshold: Decimal; // Multiple of money (e.g., 1.5x)
      carriedInterestRate: Decimal;
    }>
  ): Promise<CarriedInterestCalculation> {
    // Calculate current multiple
    const currentMultiple = totalContributions.gt(0) 
      ? totalReturned.div(totalContributions) 
      : new Decimal(0);

    // Find applicable hurdle rate
    let applicableRate = new Decimal(0);
    let applicableHurdle: any = null;

    for (const hurdle of hurdleStructure.sort((a, b) => a.threshold.cmp(b.threshold))) {
      if (currentMultiple.gte(hurdle.threshold)) {
        applicableRate = hurdle.carriedInterestRate;
        applicableHurdle = hurdle;
      }
    }

    if (applicableRate.isZero()) {
      return {
        carriedInterestEarned: new Decimal(0),
        amountToDistribute: distributionAmount,
        lpAmount: distributionAmount,
        gpAmount: new Decimal(0),
        calculations: {
          reason: 'No performance hurdle met',
          currentMultiple: currentMultiple.toString(),
          hurdleStructure: hurdleStructure.map(h => ({
            threshold: h.threshold.toString(),
            rate: h.carriedInterestRate.toString(),
          })),
        },
      };
    }

    const carriedInterestEarned = distributionAmount.mul(applicableRate).div(100);
    const lpAmount = distributionAmount.minus(carriedInterestEarned);

    const calculations = {
      inputs: {
        distributionAmount: distributionAmount.toString(),
        totalReturned: totalReturned.toString(),
        totalContributions: totalContributions.toString(),
      },
      hurdleAnalysis: {
        currentMultiple: currentMultiple.toString(),
        applicableHurdle: applicableHurdle ? {
          threshold: applicableHurdle.threshold.toString(),
          rate: applicableHurdle.carriedInterestRate.toString(),
        } : null,
        hurdleStructure: hurdleStructure.map(h => ({
          threshold: h.threshold.toString(),
          rate: h.carriedInterestRate.toString(),
          met: currentMultiple.gte(h.threshold),
        })),
      },
      carriedInterestCalculation: {
        applicableRate: applicableRate.toString(),
        carriedInterestEarned: carriedInterestEarned.toString(),
        lpAmount: lpAmount.toString(),
        gpAmount: carriedInterestEarned.toString(),
      },
    };

    return {
      carriedInterestEarned,
      amountToDistribute: distributionAmount,
      lpAmount,
      gpAmount: carriedInterestEarned,
      calculations,
    };
  }

  /**
   * Validate carried interest calculation inputs
   */
  validateInputs(
    distributionAmount: Decimal,
    carriedInterestRate: Decimal,
    totalReturned: Decimal,
    totalContributions: Decimal
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (distributionAmount.lt(0)) {
      errors.push('Distribution amount cannot be negative');
    }

    if (carriedInterestRate.lt(0) || carriedInterestRate.gt(100)) {
      errors.push('Carried interest rate must be between 0% and 100%');
    }

    if (totalReturned.lt(0)) {
      errors.push('Total returned cannot be negative');
    }

    if (totalContributions.lt(0)) {
      errors.push('Total contributions cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default CarriedInterestService;