import { Decimal } from 'decimal.js';

interface PreferredReturnCalculation {
  accruedAmount: Decimal;
  amountToDistribute: Decimal;
  remainingAccrual: Decimal;
  calculations: Record<string, any>;
}

interface PreferredReturnPeriod {
  startDate: Date;
  endDate: Date;
  capitalBase: Decimal;
  rate: Decimal;
  dayCount: number;
  accruedAmount: Decimal;
}

class PreferredReturnService {
  private readonly DAYS_PER_YEAR = new Decimal(365);

  /**
   * Calculate preferred return for a distribution
   */
  async calculatePreferredReturn(
    capitalBase: Decimal,
    annualRate: Decimal,
    daysSinceContribution: number,
    previousPreferredPaid: Decimal,
    availableAmount: Decimal
  ): Promise<PreferredReturnCalculation> {
    try {
      // Calculate total accrued preferred return
      const accruedAmount = this.calculateAccruedPreferredReturn(
        capitalBase,
        annualRate,
        daysSinceContribution
      );

      // Subtract previously paid preferred return
      const unpaidAccrual = accruedAmount.minus(previousPreferredPaid);

      // Determine amount to distribute (limited by available amount)
      const amountToDistribute = Decimal.min(unpaidAccrual, availableAmount);

      // Calculate remaining accrual after distribution
      const remainingAccrual = unpaidAccrual.minus(amountToDistribute);

      const calculations = {
        inputs: {
          capitalBase: capitalBase.toString(),
          annualRate: annualRate.toString(),
          daysSinceContribution,
          previousPreferredPaid: previousPreferredPaid.toString(),
          availableAmount: availableAmount.toString(),
        },
        calculations: {
          dailyRate: annualRate.div(this.DAYS_PER_YEAR).toString(),
          totalAccrued: accruedAmount.toString(),
          unpaidAccrual: unpaidAccrual.toString(),
          amountToDistribute: amountToDistribute.toString(),
          remainingAccrual: remainingAccrual.toString(),
        },
        formulas: {
          dailyRate: 'annualRate / 365',
          accruedAmount: 'capitalBase * dailyRate * daysSinceContribution',
          unpaidAccrual: 'accruedAmount - previousPreferredPaid',
          amountToDistribute: 'min(unpaidAccrual, availableAmount)',
        },
      };

      return {
        accruedAmount,
        amountToDistribute,
        remainingAccrual,
        calculations,
      };
    } catch (error) {
      throw new Error(`Preferred return calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate accrued preferred return for a period
   */
  private calculateAccruedPreferredReturn(
    capitalBase: Decimal,
    annualRate: Decimal,
    days: number
  ): Decimal {
    const dailyRate = annualRate.div(this.DAYS_PER_YEAR);
    return capitalBase.mul(dailyRate).mul(days).div(100);
  }

  /**
   * Calculate preferred return for multiple periods with different capital bases
   */
  async calculatePreferredReturnByPeriods(
    periods: PreferredReturnPeriod[]
  ): Promise<{
    totalAccrued: Decimal;
    periodBreakdown: Array<{
      period: PreferredReturnPeriod;
      accruedAmount: Decimal;
    }>;
    calculations: Record<string, any>;
  }> {
    let totalAccrued = new Decimal(0);
    const periodBreakdown: Array<{
      period: PreferredReturnPeriod;
      accruedAmount: Decimal;
    }> = [];

    for (const period of periods) {
      const accruedAmount = this.calculateAccruedPreferredReturn(
        period.capitalBase,
        period.rate,
        period.dayCount
      );

      totalAccrued = totalAccrued.plus(accruedAmount);
      periodBreakdown.push({
        period,
        accruedAmount,
      });
    }

    const calculations = {
      totalPeriods: periods.length,
      totalAccrued: totalAccrued.toString(),
      periods: periodBreakdown.map(p => ({
        startDate: p.period.startDate.toISOString(),
        endDate: p.period.endDate.toISOString(),
        capitalBase: p.period.capitalBase.toString(),
        rate: p.period.rate.toString(),
        dayCount: p.period.dayCount,
        accruedAmount: p.accruedAmount.toString(),
      })),
    };

    return {
      totalAccrued,
      periodBreakdown,
      calculations,
    };
  }

  /**
   * Calculate compound preferred return (if preferred return compounds)
   */
  async calculateCompoundPreferredReturn(
    initialCapital: Decimal,
    annualRate: Decimal,
    years: Decimal,
    compoundingFrequency: 'daily' | 'monthly' | 'quarterly' | 'annually' = 'annually'
  ): Promise<{
    finalAmount: Decimal;
    accruedPreferred: Decimal;
    calculations: Record<string, any>;
  }> {
    let periodsPerYear: Decimal;
    
    switch (compoundingFrequency) {
      case 'daily':
        periodsPerYear = new Decimal(365);
        break;
      case 'monthly':
        periodsPerYear = new Decimal(12);
        break;
      case 'quarterly':
        periodsPerYear = new Decimal(4);
        break;
      case 'annually':
        periodsPerYear = new Decimal(1);
        break;
    }

    const ratePerPeriod = annualRate.div(100).div(periodsPerYear);
    const totalPeriods = years.mul(periodsPerYear);

    // A = P(1 + r/n)^(nt)
    const finalAmount = initialCapital.mul(
      ratePerPeriod.plus(1).pow(totalPeriods.toNumber())
    );

    const accruedPreferred = finalAmount.minus(initialCapital);

    const calculations = {
      inputs: {
        initialCapital: initialCapital.toString(),
        annualRate: annualRate.toString(),
        years: years.toString(),
        compoundingFrequency,
      },
      calculations: {
        periodsPerYear: periodsPerYear.toString(),
        ratePerPeriod: ratePerPeriod.toString(),
        totalPeriods: totalPeriods.toString(),
        finalAmount: finalAmount.toString(),
        accruedPreferred: accruedPreferred.toString(),
      },
      formula: 'A = P(1 + r/n)^(nt)',
    };

    return {
      finalAmount,
      accruedPreferred,
      calculations,
    };
  }

  /**
   * Calculate preferred return with capital additions/withdrawals
   */
  async calculatePreferredReturnWithCapitalChanges(
    capitalEvents: Array<{
      date: Date;
      amount: Decimal; // Positive for contributions, negative for distributions
      type: 'contribution' | 'distribution';
    }>,
    annualRate: Decimal,
    endDate: Date
  ): Promise<{
    totalAccrued: Decimal;
    capitalHistory: Array<{
      date: Date;
      capitalBalance: Decimal;
      accruedFromPrevious: Decimal;
    }>;
    calculations: Record<string, any>;
  }> {
    // Sort events by date
    const sortedEvents = capitalEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    let currentCapital = new Decimal(0);
    let totalAccrued = new Decimal(0);
    const capitalHistory: Array<{
      date: Date;
      capitalBalance: Decimal;
      accruedFromPrevious: Decimal;
    }> = [];

    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const nextDate = i < sortedEvents.length - 1 ? sortedEvents[i + 1].date : endDate;
      
      // Update capital balance
      currentCapital = currentCapital.plus(event.amount);
      
      // Calculate days until next event or end date
      const daysToPeriodEnd = Math.floor(
        (nextDate.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate accrued preferred return for this period
      const accruedForPeriod = this.calculateAccruedPreferredReturn(
        currentCapital,
        annualRate,
        daysToPeriodEnd
      );

      totalAccrued = totalAccrued.plus(accruedForPeriod);

      capitalHistory.push({
        date: event.date,
        capitalBalance: currentCapital,
        accruedFromPrevious: accruedForPeriod,
      });
    }

    const calculations = {
      totalEvents: sortedEvents.length,
      finalCapitalBalance: currentCapital.toString(),
      totalAccrued: totalAccrued.toString(),
      annualRate: annualRate.toString(),
      periodStart: sortedEvents[0]?.date.toISOString(),
      periodEnd: endDate.toISOString(),
      events: sortedEvents.map(e => ({
        date: e.date.toISOString(),
        amount: e.amount.toString(),
        type: e.type,
      })),
    };

    return {
      totalAccrued,
      capitalHistory,
      calculations,
    };
  }

  /**
   * Validate preferred return calculation inputs
   */
  validateInputs(
    capitalBase: Decimal,
    annualRate: Decimal,
    days: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (capitalBase.lt(0)) {
      errors.push('Capital base cannot be negative');
    }

    if (annualRate.lt(0) || annualRate.gt(100)) {
      errors.push('Annual rate must be between 0% and 100%');
    }

    if (days < 0) {
      errors.push('Days cannot be negative');
    }

    if (days > 3650) { // 10 years
      errors.push('Days cannot exceed 10 years (3650 days)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate effective preferred return rate with compounding
   */
  calculateEffectiveRate(
    nominalRate: Decimal,
    compoundingFrequency: 'daily' | 'monthly' | 'quarterly' | 'annually'
  ): Decimal {
    let periodsPerYear: number;
    
    switch (compoundingFrequency) {
      case 'daily':
        periodsPerYear = 365;
        break;
      case 'monthly':
        periodsPerYear = 12;
        break;
      case 'quarterly':
        periodsPerYear = 4;
        break;
      case 'annually':
        periodsPerYear = 1;
        break;
    }

    const ratePerPeriod = nominalRate.div(100).div(periodsPerYear);
    const effectiveRate = ratePerPeriod.plus(1).pow(periodsPerYear).minus(1).mul(100);

    return effectiveRate;
  }

  /**
   * Create periods from capital activity history
   */
  createPeriodsFromCapitalActivity(
    activities: Array<{
      date: Date;
      amount: Decimal;
      type: 'contribution' | 'distribution';
    }>,
    preferredRate: Decimal,
    endDate: Date
  ): PreferredReturnPeriod[] {
    const sortedActivities = activities.sort((a, b) => a.date.getTime() - b.date.getTime());
    const periods: PreferredReturnPeriod[] = [];
    
    let currentCapital = new Decimal(0);
    
    for (let i = 0; i < sortedActivities.length; i++) {
      const activity = sortedActivities[i];
      const nextDate = i < sortedActivities.length - 1 ? sortedActivities[i + 1].date : endDate;
      
      // Update capital base
      if (activity.type === 'contribution') {
        currentCapital = currentCapital.plus(activity.amount);
      } else {
        currentCapital = currentCapital.minus(activity.amount);
      }
      
      // Create period
      const dayCount = Math.floor(
        (nextDate.getTime() - activity.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (dayCount > 0 && currentCapital.gt(0)) {
        periods.push({
          startDate: activity.date,
          endDate: nextDate,
          capitalBase: currentCapital,
          rate: preferredRate,
          dayCount,
          accruedAmount: new Decimal(0), // Will be calculated separately
        });
      }
    }
    
    return periods;
  }
}

export default PreferredReturnService;