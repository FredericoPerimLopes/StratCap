import { Decimal } from 'decimal.js';
import DistributionEvent from '../models/DistributionEvent';
import WaterfallCalculation from '../models/WaterfallCalculation';
import WaterfallTier from '../models/WaterfallTier';
import InvestorEntity from '../models/InvestorEntity';

interface InvestorAllocation {
  investorEntityId: number;
  commitmentId: number;
  allocationPercentage: Decimal;
  allocationAmount: Decimal;
  allocationBasis: 'commitment' | 'contributed_capital' | 'pro_rata' | 'custom';
}


class DistributionAllocationService {
  /**
   * Allocate tier distributions to individual investors
   */
  async allocateToInvestors(
    calculation: WaterfallCalculation,
    tiers: WaterfallTier[],
    commitments: any[]
  ): Promise<DistributionEvent[]> {
    const allDistributionEvents: DistributionEvent[] = [];

    for (const _tier of tiers) {
      const tierEvents = await this.allocateTierToInvestors(calculation, _tier, commitments);
      allDistributionEvents.push(...tierEvents);
    }

    return allDistributionEvents;
  }

  /**
   * Allocate a specific tier to investors
   */
  private async allocateTierToInvestors(
    calculation: WaterfallCalculation,
    tier: WaterfallTier,
    commitments: any[]
  ): Promise<DistributionEvent[]> {
    const distributionEvents: DistributionEvent[] = [];
    
    // Calculate LP and GP amounts for this tier
    const lpAmount = tier.distributedAmountDecimal.mul(tier.lpAllocationDecimal).div(100);
    const gpAmount = tier.distributedAmountDecimal.mul(tier.gpAllocationDecimal).div(100);

    // Allocate LP amount to investors
    if (lpAmount.gt(0)) {
      const lpAllocations = this.calculateInvestorAllocations(commitments, lpAmount, 'contributed_capital');
      const lpEvents = await this.createDistributionEvents(
        calculation,
        tier,
        lpAllocations,
        this.getEventTypeForTier(tier.tierType, 'lp')
      );
      distributionEvents.push(...lpEvents);
    }

    // Allocate GP amount (typically to GP entity or management company)
    if (gpAmount.gt(0)) {
      const gpEvents = await this.createGPDistributionEvents(
        calculation,
        tier,
        gpAmount,
        this.getEventTypeForTier(tier.tierType, 'gp')
      );
      distributionEvents.push(...gpEvents);
    }

    return distributionEvents;
  }

  /**
   * Calculate how to allocate amount among investors
   */
  private calculateInvestorAllocations(
    commitments: any[],
    totalAmount: Decimal,
    allocationBasis: 'commitment' | 'contributed_capital' | 'pro_rata' | 'custom'
  ): InvestorAllocation[] {
    const allocations: InvestorAllocation[] = [];

    // Calculate total basis for percentage calculations
    let totalBasis = new Decimal(0);
    
    commitments.forEach(commitment => {
      const basisAmount = this.getBasisAmount(commitment, allocationBasis);
      totalBasis = totalBasis.plus(basisAmount);
    });

    // Calculate individual allocations
    commitments.forEach(commitment => {
      const basisAmount = this.getBasisAmount(commitment, allocationBasis);
      const allocationPercentage = totalBasis.gt(0) 
        ? basisAmount.div(totalBasis).mul(100)
        : new Decimal(0);
      const allocationAmount = totalAmount.mul(allocationPercentage).div(100);

      if (allocationAmount.gt(0)) {
        allocations.push({
          investorEntityId: commitment.investorEntityId,
          commitmentId: commitment.id,
          allocationPercentage,
          allocationAmount,
          allocationBasis,
        });
      }
    });

    return allocations;
  }

  /**
   * Get basis amount for allocation calculation
   */
  private getBasisAmount(commitment: any, allocationBasis: string): Decimal {
    switch (allocationBasis) {
      case 'commitment':
        return new Decimal(commitment.commitmentAmount || '0');
      case 'contributed_capital':
        return new Decimal(commitment.capitalCalled || '0');
      case 'pro_rata':
        return new Decimal(commitment.commitmentAmount || '0');
      default:
        return new Decimal(commitment.commitmentAmount || '0');
    }
  }

  /**
   * Create distribution events for investor allocations
   */
  private async createDistributionEvents(
    calculation: WaterfallCalculation,
    tier: WaterfallTier,
    allocations: InvestorAllocation[],
    eventType: 'return_of_capital' | 'preferred_return' | 'catch_up' | 'carried_interest' | 'capital_gains'
  ): Promise<DistributionEvent[]> {
    const events: DistributionEvent[] = [];

    for (const allocation of allocations) {
      // Calculate withholding if applicable
      const withholdingAmount = await this.calculateWithholding(
        allocation.investorEntityId,
        allocation.allocationAmount,
        eventType
      );

      const netDistribution = allocation.allocationAmount.minus(withholdingAmount);

      // Determine tax classification
      const taxClassification = this.determineTaxClassification(eventType, tier.tierType);

      // Calculate cumulative amount for this investor
      const cumulativeAmount = await this.calculateCumulativeDistribution(
        allocation.investorEntityId,
        allocation.allocationAmount
      );

      const event = await DistributionEvent.create({
        waterfallCalculationId: calculation.id,
        investorEntityId: allocation.investorEntityId,
        commitmentId: allocation.commitmentId,
        eventType,
        distributionAmount: allocation.allocationAmount.toString(),
        percentageOfTotal: allocation.allocationPercentage.toString(),
        cumulativeAmount: cumulativeAmount.toString(),
        allocationBasis: allocation.allocationBasis,
        allocationPercentage: allocation.allocationPercentage.toString(),
        taxClassification,
        withholdingAmount: withholdingAmount.gt(0) ? withholdingAmount.toString() : undefined,
        netDistribution: netDistribution.toString(),
        paymentStatus: 'pending',
      });

      events.push(event);
    }

    return events;
  }

  /**
   * Create GP distribution events
   */
  private async createGPDistributionEvents(
    calculation: WaterfallCalculation,
    _tier: WaterfallTier,
    gpAmount: Decimal,
    eventType: 'return_of_capital' | 'preferred_return' | 'catch_up' | 'carried_interest' | 'capital_gains'
  ): Promise<DistributionEvent[]> {
    // For now, create a single GP event - in production this would allocate to GP entities
    const gpEvent = await DistributionEvent.create({
      waterfallCalculationId: calculation.id,
      investorEntityId: 1, // TODO: Get actual GP entity ID
      commitmentId: 1, // TODO: Get actual GP commitment ID
      eventType,
      distributionAmount: gpAmount.toString(),
      percentageOfTotal: '100.0000', // 100% of GP allocation
      cumulativeAmount: gpAmount.toString(), // TODO: Calculate actual cumulative
      allocationBasis: 'custom',
      allocationPercentage: '100.0000',
      taxClassification: eventType === 'carried_interest' ? 'ordinary_income' : 'capital_gains',
      netDistribution: gpAmount.toString(),
      paymentStatus: 'pending',
    });

    return [gpEvent];
  }

  /**
   * Calculate withholding tax if applicable
   */
  private async calculateWithholding(
    investorEntityId: number,
    distributionAmount: Decimal,
    eventType: string
  ): Promise<Decimal> {
    // Simplified withholding calculation - in production this would be more complex
    // based on investor tax status, jurisdiction, etc.
    
    try {
      const investor = await InvestorEntity.findByPk(investorEntityId);
      if (!investor) {
        return new Decimal(0);
      }

      // Example: 30% withholding for non-US investors on carried interest
      if (investor.domicile !== 'US' && eventType === 'carried_interest') {
        return distributionAmount.mul(0.30);
      }

      // Example: 15% withholding for non-US investors on capital gains
      if (investor.domicile !== 'US' && eventType === 'capital_gains') {
        return distributionAmount.mul(0.15);
      }

      return new Decimal(0);
    } catch (error) {
      console.error('Error calculating withholding:', error);
      return new Decimal(0);
    }
  }

  /**
   * Determine tax classification based on event type
   */
  private determineTaxClassification(
    eventType: string,
    _tierType: string
  ): 'return_of_capital' | 'capital_gains' | 'ordinary_income' | 'mixed' {
    switch (eventType) {
      case 'return_of_capital':
        return 'return_of_capital';
      case 'preferred_return':
        return 'ordinary_income';
      case 'carried_interest':
        return 'ordinary_income';
      case 'capital_gains':
        return 'capital_gains';
      default:
        return 'mixed';
    }
  }

  /**
   * Calculate cumulative distribution for investor
   */
  private async calculateCumulativeDistribution(
    investorEntityId: number,
    currentDistribution: Decimal
  ): Promise<Decimal> {
    try {
      const previousDistributions = await DistributionEvent.findAll({
        where: {
          investorEntityId,
          paymentStatus: ['processed', 'paid'],
        },
      });

      const previousTotal = previousDistributions.reduce((sum, dist) => {
        return sum.plus(new Decimal(dist.distributionAmount));
      }, new Decimal(0));

      return previousTotal.plus(currentDistribution);
    } catch (error) {
      console.error('Error calculating cumulative distribution:', error);
      return currentDistribution;
    }
  }

  /**
   * Get event type for tier and party
   */
  private getEventTypeForTier(
    tierType: string,
    party: 'lp' | 'gp'
  ): 'return_of_capital' | 'preferred_return' | 'catch_up' | 'carried_interest' | 'capital_gains' {
    switch (tierType) {
      case 'preferred_return':
        return 'preferred_return';
      case 'catch_up':
        return party === 'gp' ? 'catch_up' : 'capital_gains';
      case 'carried_interest':
        return party === 'gp' ? 'carried_interest' : 'capital_gains';
      case 'distribution':
        return 'capital_gains';
      case 'promote':
        return party === 'gp' ? 'carried_interest' : 'capital_gains';
      default:
        return 'capital_gains';
    }
  }

  /**
   * Allocate distributions with custom investor classes
   */
  async allocateWithInvestorClasses(
    calculation: WaterfallCalculation,
    tiers: WaterfallTier[],
    investorClasses: Array<{
      className: string;
      commitments: any[];
      allocationRights: {
        priority: number;
        preferredReturnRate?: Decimal;
        carriedInterestRate?: Decimal;
        managementFeeRate?: Decimal;
      };
    }>
  ): Promise<DistributionEvent[]> {
    const allEvents: DistributionEvent[] = [];

    // Sort investor classes by priority
    const sortedClasses = investorClasses.sort((a, b) => a.allocationRights.priority - b.allocationRights.priority);

    for (const tier of tiers) {
      for (const investorClass of sortedClasses) {
        const classEvents = await this.allocateTierToInvestorClass(
          calculation,
          tier,
          investorClass
        );
        allEvents.push(...classEvents);
      }
    }

    return allEvents;
  }

  /**
   * Allocate tier to specific investor class
   */
  private async allocateTierToInvestorClass(
    calculation: WaterfallCalculation,
    tier: WaterfallTier,
    investorClass: any
  ): Promise<DistributionEvent[]> {
    const events: DistributionEvent[] = [];

    // Calculate class-specific allocation
    const classAllocation = this.calculateClassAllocation(tier, investorClass);
    
    if (classAllocation.gt(0)) {
      const allocations = this.calculateInvestorAllocations(
        investorClass.commitments,
        classAllocation,
        'contributed_capital'
      );

      const classEvents = await this.createDistributionEvents(
        calculation,
        tier,
        allocations,
        this.getEventTypeForTier(tier.tierType, 'lp')
      );

      events.push(...classEvents);
    }

    return events;
  }

  /**
   * Calculate allocation for investor class
   */
  private calculateClassAllocation(tier: WaterfallTier, _investorClass: any): Decimal {
    // Simplified - in production this would consider class-specific rights
    const tierDistribution = tier.distributedAmountDecimal;
    const lpAmount = tierDistribution.mul(tier.lpAllocationDecimal).div(100);
    
    // For now, assume equal allocation - in production this would be based on class rights
    return lpAmount;
  }

  /**
   * Validate distribution allocations
   */
  validateAllocations(
    tiers: WaterfallTier[],
    distributionEvents: DistributionEvent[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that total distribution events equal tier distributions
    const totalTierDistribution = tiers.reduce((sum, tier) => {
      return sum.plus(tier.distributedAmountDecimal);
    }, new Decimal(0));

    const totalEventDistribution = distributionEvents.reduce((sum, event) => {
      return sum.plus(event.distributionAmountDecimal);
    }, new Decimal(0));

    if (!totalTierDistribution.equals(totalEventDistribution)) {
      errors.push(`Total tier distribution (${totalTierDistribution.toString()}) does not match total event distribution (${totalEventDistribution.toString()})`);
    }

    // Check that percentages add up to 100% for each tier
    for (const tier of tiers) {
      const tierEvents = distributionEvents.filter(e => 
        e.waterfallCalculationId === tier.waterfallCalculationId
      );

      const totalPercentage = tierEvents.reduce((sum, event) => {
        return sum.plus(event.percentageOfTotalDecimal);
      }, new Decimal(0));

      // Allow small rounding differences
      if (totalPercentage.minus(100).abs().gt(0.01)) {
        errors.push(`Tier ${tier.tierName} allocation percentages do not sum to 100% (${totalPercentage.toString()}%)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create allocation summary report
   */
  async createAllocationSummary(calculationId: number): Promise<{
    totalDistributed: Decimal;
    lpTotal: Decimal;
    gpTotal: Decimal;
    investorBreakdown: Array<{
      investorId: number;
      investorName: string;
      totalDistribution: Decimal;
      eventBreakdown: Array<{
        eventType: string;
        amount: Decimal;
        percentage: Decimal;
      }>;
    }>;
    tierSummary: Array<{
      tierName: string;
      tierType: string;
      totalDistributed: Decimal;
      lpAmount: Decimal;
      gpAmount: Decimal;
    }>;
  }> {
    const distributionEvents = await DistributionEvent.findAll({
      where: { waterfallCalculationId: calculationId },
      include: [
        { model: InvestorEntity, as: 'investor' },
        { model: WaterfallCalculation, as: 'waterfallCalculation', include: [
          { model: WaterfallTier, as: 'tiers' }
        ]}
      ],
    });

    const totalDistributed = distributionEvents.reduce((sum, event) => {
      return sum.plus(event.distributionAmountDecimal);
    }, new Decimal(0));

    // Calculate LP vs GP totals
    const lpTotal = distributionEvents
      .filter(e => e.eventType !== 'carried_interest')
      .reduce((sum, event) => sum.plus(event.distributionAmountDecimal), new Decimal(0));

    const gpTotal = distributionEvents
      .filter(e => e.eventType === 'carried_interest')
      .reduce((sum, event) => sum.plus(event.distributionAmountDecimal), new Decimal(0));

    // Group by investor
    const investorGroups = distributionEvents.reduce((groups, event) => {
      const investorId = event.investorEntityId;
      if (!groups[investorId]) {
        groups[investorId] = {
          investorId,
          investorName: (event as any).investor?.name || 'Unknown',
          events: [],
        };
      }
      groups[investorId].events.push(event);
      return groups;
    }, {} as Record<number, any>);

    const investorBreakdown = Object.values(investorGroups).map((group: any) => {
      const totalDistribution = group.events.reduce((sum: Decimal, event: any) => {
        return sum.plus(event.distributionAmountDecimal);
      }, new Decimal(0));

      const eventBreakdown = group.events.map((event: any) => ({
        eventType: event.eventType,
        amount: event.distributionAmountDecimal,
        percentage: event.percentageOfTotalDecimal,
      }));

      return {
        investorId: group.investorId,
        investorName: group.investorName,
        totalDistribution,
        eventBreakdown,
      };
    });

    // Create tier summary
    const tiers = (distributionEvents[0] as any)?.waterfallCalculation?.tiers || [];
    const tierSummary = tiers.map((tier: any) => ({
      tierName: tier.tierName,
      tierType: tier.tierType,
      totalDistributed: tier.distributedAmountDecimal,
      lpAmount: tier.distributedAmountDecimal.mul(tier.lpAllocationDecimal).div(100),
      gpAmount: tier.distributedAmountDecimal.mul(tier.gpAllocationDecimal).div(100),
    }));

    return {
      totalDistributed,
      lpTotal,
      gpTotal,
      investorBreakdown,
      tierSummary,
    };
  }
}

export default DistributionAllocationService;