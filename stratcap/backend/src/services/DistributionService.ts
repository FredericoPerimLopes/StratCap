import { Decimal } from 'decimal.js';
import CapitalActivity from '../models/CapitalActivity';
import DistributionAllocation from '../models/DistributionAllocation';
import Commitment from '../models/Commitment';
import Fund from '../models/Fund';
import InvestorEntity from '../models/InvestorEntity';
import InvestorClass from '../models/InvestorClass';
import NotificationService from './NotificationService';

export interface DistributionRequest {
  fundId: number;
  eventNumber: string;
  eventDate: Date;
  description: string;
  totalDistributionAmount: string;
  distributionBreakdown: {
    returnOfCapital: string;
    gain: string;
    carriedInterest: string;
    managementFees: string;
    otherFees: string;
    expenses: string;
  };
  waterfallTier?: number;
  includeClasses?: number[];
  excludeInvestors?: number[];
  createdBy: number;
}

export interface WaterfallCalculation {
  investorId: number;
  commitmentId: number;
  tier: number;
  returnOfCapital: string;
  preferredReturn: string;
  catchUp: string;
  carriedInterest: string;
  totalDistribution: string;
  calculation: Record<string, any>;
}

export interface DistributionResult {
  capitalActivity: CapitalActivity;
  allocations: DistributionAllocation[];
  totalDistributed: string;
  waterfallCalculations: WaterfallCalculation[];
  distributionErrors: Array<{
    commitmentId: number;
    error: string;
  }>;
}

class DistributionService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new distribution with waterfall calculations
   */
  async createDistribution(request: DistributionRequest): Promise<DistributionResult> {
    // Validate fund exists and is active
    const fund = await Fund.findByPk(request.fundId);
    if (!fund) {
      throw new Error('Fund not found');
    }

    // Create the capital activity
    const capitalActivity = await CapitalActivity.create({
      fundId: request.fundId,
      eventType: 'distribution',
      eventNumber: request.eventNumber,
      eventDate: request.eventDate,
      description: request.description,
      status: 'draft',
      totalAmount: request.totalDistributionAmount,
      currency: fund.currency,
      calculations: {
        distributionBreakdown: request.distributionBreakdown,
        waterfallTier: request.waterfallTier,
      },
      metadata: {
        createdBy: request.createdBy,
      },
    });

    // Get eligible commitments
    const commitments = await this.getEligibleCommitments(
      request.fundId,
      request.includeClasses,
      request.excludeInvestors
    );

    if (commitments.length === 0) {
      throw new Error('No eligible commitments found for this distribution');
    }

    // Calculate waterfall distributions
    const waterfallResult = await this.calculateWaterfallDistributions(
      commitments,
      request.distributionBreakdown,
      fund
    );

    // Create distribution allocations
    const allocations = await this.createDistributionAllocations(
      capitalActivity,
      waterfallResult,
      request.distributionBreakdown
    );

    const totalDistributed = allocations.reduce(
      (sum, allocation) => sum.add(new Decimal(allocation.totalDistribution)),
      new Decimal(0)
    );

    return {
      capitalActivity,
      allocations,
      totalDistributed: totalDistributed.toString(),
      waterfallCalculations: waterfallResult,
      distributionErrors: [],
    };
  }

  /**
   * Get eligible commitments for distribution
   */
  private async getEligibleCommitments(
    fundId: number,
    includeClasses?: number[],
    excludeInvestors?: number[]
  ): Promise<Commitment[]> {
    const whereClause: any = {
      fundId,
      status: 'active',
    };

    if (includeClasses && includeClasses.length > 0) {
      whereClause.investorClassId = includeClasses;
    }

    if (excludeInvestors && excludeInvestors.length > 0) {
      whereClause.investorEntityId = {
        [require('sequelize').Op.notIn]: excludeInvestors,
      };
    }

    return Commitment.findAll({
      where: whereClause,
      include: [
        {
          model: InvestorEntity,
          as: 'investorEntity',
        },
        {
          model: InvestorClass,
          as: 'investorClass',
        },
      ],
    });
  }

  /**
   * Calculate waterfall distributions based on fund terms
   */
  private async calculateWaterfallDistributions(
    commitments: Commitment[],
    distributionBreakdown: DistributionRequest['distributionBreakdown'],
    fund: Fund
  ): Promise<WaterfallCalculation[]> {
    const calculations: WaterfallCalculation[] = [];
    
    // Total amounts to distribute
    const totalReturnOfCapital = new Decimal(distributionBreakdown.returnOfCapital);
    const totalGain = new Decimal(distributionBreakdown.gain);
    const totalCarriedInterest = new Decimal(distributionBreakdown.carriedInterest);

    // Calculate total capital called and commitment amounts
    const totalCapitalCalled = commitments.reduce(
      (sum, commitment) => sum.add(new Decimal(commitment.capitalCalled)),
      new Decimal(0)
    );

    const totalCommitments = commitments.reduce(
      (sum, commitment) => sum.add(new Decimal(commitment.commitmentAmount)),
      new Decimal(0)
    );

    // Calculate distributions for each commitment
    for (const commitment of commitments) {
      const capitalCalled = new Decimal(commitment.capitalCalled);
      const commitmentAmount = new Decimal(commitment.commitmentAmount);
      
      // Pro-rata share based on capital called
      const capitalCalledShare = totalCapitalCalled.isZero() 
        ? new Decimal(0) 
        : capitalCalled.div(totalCapitalCalled);

      // Pro-rata share based on commitment
      const commitmentShare = totalCommitments.isZero() 
        ? new Decimal(0) 
        : commitmentAmount.div(totalCommitments);

      // Calculate return of capital (based on capital called)
      const returnOfCapital = totalReturnOfCapital.mul(capitalCalledShare);

      // Calculate preferred return (simplified - using preferred return rate)
      const preferredReturnRate = new Decimal(fund.preferredReturnRate);
      const preferredReturn = capitalCalled.mul(preferredReturnRate);

      // Calculate gain distribution (after preferred return)
      let gainDistribution = new Decimal(0);
      const catchUp = new Decimal(0);
      const carriedInterestRate = new Decimal(fund.carriedInterestRate || 0);

      if (totalGain.greaterThan(0)) {
        // First, satisfy remaining preferred return (calculated but not used in this simplified version)
        // const _remainingPreferredReturn = Decimal.max(
        //   preferredReturn.sub(returnOfCapital),
        //   new Decimal(0)
        // );

        // Then distribute catch-up to GP (if applicable)
        
        // Distribute remaining gain pro-rata
        gainDistribution = totalGain.mul(commitmentShare);
      }

      // Calculate carried interest allocation
      const carriedInterestAllocation = totalCarriedInterest.mul(commitmentShare);

      const totalDistribution = returnOfCapital
        .add(gainDistribution)
        .add(carriedInterestAllocation);

      calculations.push({
        investorId: commitment.investorEntityId,
        commitmentId: commitment.id,
        tier: 1, // Simplified - single tier
        returnOfCapital: returnOfCapital.toString(),
        preferredReturn: preferredReturn.toString(),
        catchUp: catchUp.toString(),
        carriedInterest: carriedInterestAllocation.toString(),
        totalDistribution: totalDistribution.toString(),
        calculation: {
          capitalCalled: capitalCalled.toString(),
          capitalCalledShare: capitalCalledShare.toString(),
          commitmentShare: commitmentShare.toString(),
          preferredReturnRate: preferredReturnRate.toString(),
          carriedInterestRate: carriedInterestRate.toString(),
        },
      });
    }

    return calculations;
  }

  /**
   * Create distribution allocation records
   */
  private async createDistributionAllocations(
    capitalActivity: CapitalActivity,
    waterfallCalculations: WaterfallCalculation[],
    distributionBreakdown: DistributionRequest['distributionBreakdown']
  ): Promise<DistributionAllocation[]> {
    const allocations: DistributionAllocation[] = [];

    const totalDistributionAmount = new Decimal(capitalActivity.totalAmount);
    const totalFees = new Decimal(distributionBreakdown.managementFees)
      .add(new Decimal(distributionBreakdown.otherFees));
    const totalExpenses = new Decimal(distributionBreakdown.expenses);

    for (const calculation of waterfallCalculations) {
      const commitment = await Commitment.findByPk(calculation.commitmentId);
      if (!commitment) continue;

      const totalDistribution = new Decimal(calculation.totalDistribution);
      const returnOfCapital = new Decimal(calculation.returnOfCapital);
      const gain = totalDistribution.sub(returnOfCapital);
      const carriedInterest = new Decimal(calculation.carriedInterest);

      // Pro-rata allocation of fees and expenses
      const distributionShare = totalDistributionAmount.isZero() 
        ? new Decimal(0) 
        : totalDistribution.div(totalDistributionAmount);
      
      const managementFees = totalFees.mul(distributionShare);
      const expenses = totalExpenses.mul(distributionShare);
      const netDistribution = totalDistribution.sub(managementFees).sub(expenses);

      const allocation = await DistributionAllocation.create({
        capitalActivityId: capitalActivity.id,
        commitmentId: calculation.commitmentId,
        fundId: commitment.fundId,
        investorEntityId: commitment.investorEntityId,
        investorClassId: commitment.investorClassId,
        totalDistribution: totalDistribution.toString(),
        returnOfCapital: returnOfCapital.toString(),
        gain: gain.toString(),
        carriedInterest: carriedInterest.toString(),
        managementFees: managementFees.toString(),
        otherFees: new Decimal(0).toString(), // Allocated in managementFees for simplicity
        expenses: expenses.toString(),
        netDistribution: netDistribution.toString(),
        percentageOfTotal: distributionShare.toString(),
        distributionDate: capitalActivity.eventDate,
        status: 'pending',
        waterfallTier: calculation.tier,
        waterfallCalculations: calculation.calculation,
      });

      allocations.push(allocation);
    }

    return allocations;
  }

  /**
   * Approve a distribution and send notifications
   */
  async approveDistribution(capitalActivityId: number, approvedBy: number): Promise<void> {
    const capitalActivity = await CapitalActivity.findByPk(capitalActivityId);
    if (!capitalActivity) {
      throw new Error('Capital activity not found');
    }

    if (capitalActivity.status !== 'draft') {
      throw new Error('Distribution must be in draft status to approve');
    }

    // Update capital activity status
    await capitalActivity.update({
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    });

    // Update all allocations to approved status and send notifications
    const allocations = await DistributionAllocation.findAll({
      where: { capitalActivityId },
      include: [
        {
          model: InvestorEntity,
          as: 'investorEntity',
        },
      ],
    });

    for (const allocation of allocations) {
      await allocation.update({ status: 'approved' });
      
      // Send notification
      await this.notificationService.sendDistributionNotification(
        allocation,
        capitalActivity
      );
    }
  }

  /**
   * Process distribution payments
   */
  async processDistributionPayments(
    capitalActivityId: number,
    paymentDate: Date
  ): Promise<void> {
    const allocations = await DistributionAllocation.findAll({
      where: { 
        capitalActivityId,
        status: 'approved'
      },
    });

    for (const allocation of allocations) {
      await allocation.update({
        status: 'paid',
        paymentDate,
      });

      // Update commitment balances
      const commitment = await Commitment.findByPk(allocation.commitmentId);
      if (commitment) {
        const currentCapitalReturned = new Decimal(commitment.capitalReturned);
        const newCapitalReturned = currentCapitalReturned.add(new Decimal(allocation.returnOfCapital));
        
        await commitment.update({
          capitalReturned: newCapitalReturned.toString(),
          lastUpdated: new Date(),
        });
      }
    }

    // Update capital activity status
    await CapitalActivity.update(
      { 
        status: 'completed',
        completedAt: new Date(),
      },
      { where: { id: capitalActivityId } }
    );
  }

  /**
   * Get distribution summary with allocation details
   */
  async getDistributionSummary(capitalActivityId: number) {
    const capitalActivity = await CapitalActivity.findByPk(capitalActivityId, {
      include: [
        {
          model: Fund,
          as: 'fund',
        },
      ],
    });

    if (!capitalActivity) {
      throw new Error('Capital activity not found');
    }

    const allocations = await DistributionAllocation.findAll({
      where: { capitalActivityId },
      include: [
        {
          model: InvestorEntity,
          as: 'investorEntity',
        },
        {
          model: InvestorClass,
          as: 'investorClass',
        },
        {
          model: Commitment,
          as: 'commitment',
        },
      ],
    });

    const totalDistributed = allocations.reduce(
      (sum, allocation) => sum.add(new Decimal(allocation.totalDistribution)),
      new Decimal(0)
    );

    const totalReturnOfCapital = allocations.reduce(
      (sum, allocation) => sum.add(new Decimal(allocation.returnOfCapital)),
      new Decimal(0)
    );

    const totalGain = allocations.reduce(
      (sum, allocation) => sum.add(new Decimal(allocation.gain)),
      new Decimal(0)
    );

    const statusSummary = allocations.reduce((summary, allocation) => {
      summary[allocation.status] = (summary[allocation.status] || 0) + 1;
      return summary;
    }, {} as Record<string, number>);

    return {
      capitalActivity,
      allocations,
      totalDistributed: totalDistributed.toString(),
      totalReturnOfCapital: totalReturnOfCapital.toString(),
      totalGain: totalGain.toString(),
      allocationCount: allocations.length,
      statusSummary,
    };
  }
}

export default DistributionService;