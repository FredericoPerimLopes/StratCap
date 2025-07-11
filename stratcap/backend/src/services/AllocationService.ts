import { Decimal } from 'decimal.js';
import CapitalAllocation from '../models/CapitalAllocation';
import DistributionAllocation from '../models/DistributionAllocation';
import Commitment from '../models/Commitment';
import InvestorEntity from '../models/InvestorEntity';
import InvestorClass from '../models/InvestorClass';

export interface AllocationSummary {
  totalAllocated: string;
  allocationCount: number;
  byStatus: Record<string, number>;
  byInvestorClass: Record<string, {
    count: number;
    amount: string;
  }>;
}

export interface InvestorAllocationHistory {
  investorEntityId: number;
  investorEntity: InvestorEntity;
  commitments: Array<{
    commitment: Commitment;
    capitalAllocations: CapitalAllocation[];
    distributionAllocations: DistributionAllocation[];
    totalCalled: string;
    totalDistributed: string;
    unfundedBalance: string;
  }>;
  totalCommitment: string;
  totalCalled: string;
  totalDistributed: string;
  totalUnfunded: string;
}

class AllocationService {
  /**
   * Get allocation summary for a capital activity
   */
  async getCapitalAllocationSummary(capitalActivityId: number): Promise<AllocationSummary> {
    const allocations = await CapitalAllocation.findAll({
      where: { capitalActivityId },
      include: [
        {
          model: InvestorClass,
          as: 'investorClass',
        },
      ],
    });

    const totalAllocated = allocations.reduce(
      (sum, allocation) => sum.add(new Decimal(allocation.allocationAmount)),
      new Decimal(0)
    );

    const byStatus = allocations.reduce((summary, allocation) => {
      summary[allocation.status] = (summary[allocation.status] || 0) + 1;
      return summary;
    }, {} as Record<string, number>);

    const byInvestorClass = allocations.reduce((summary, allocation) => {
      const className = allocation.investorClass?.name || 'Unknown';
      if (!summary[className]) {
        summary[className] = { count: 0, amount: '0' };
      }
      summary[className].count += 1;
      summary[className].amount = new Decimal(summary[className].amount)
        .add(new Decimal(allocation.allocationAmount))
        .toString();
      return summary;
    }, {} as Record<string, { count: number; amount: string }>);

    return {
      totalAllocated: totalAllocated.toString(),
      allocationCount: allocations.length,
      byStatus,
      byInvestorClass,
    };
  }

  /**
   * Get distribution allocation summary for a capital activity
   */
  async getDistributionAllocationSummary(capitalActivityId: number): Promise<AllocationSummary> {
    const allocations = await DistributionAllocation.findAll({
      where: { capitalActivityId },
      include: [
        {
          model: InvestorClass,
          as: 'investorClass',
        },
      ],
    });

    const totalAllocated = allocations.reduce(
      (sum, allocation) => sum.add(new Decimal(allocation.totalDistribution)),
      new Decimal(0)
    );

    const byStatus = allocations.reduce((summary, allocation) => {
      summary[allocation.status] = (summary[allocation.status] || 0) + 1;
      return summary;
    }, {} as Record<string, number>);

    const byInvestorClass = allocations.reduce((summary, allocation) => {
      const className = allocation.investorClass?.name || 'Unknown';
      if (!summary[className]) {
        summary[className] = { count: 0, amount: '0' };
      }
      summary[className].count += 1;
      summary[className].amount = new Decimal(summary[className].amount)
        .add(new Decimal(allocation.totalDistribution))
        .toString();
      return summary;
    }, {} as Record<string, { count: number; amount: string }>);

    return {
      totalAllocated: totalAllocated.toString(),
      allocationCount: allocations.length,
      byStatus,
      byInvestorClass,
    };
  }

  /**
   * Get comprehensive allocation history for an investor
   */
  async getInvestorAllocationHistory(
    investorEntityId: number,
    fundId?: number
  ): Promise<InvestorAllocationHistory> {
    const whereClause: any = { investorEntityId };
    if (fundId) {
      whereClause.fundId = fundId;
    }

    const commitments = await Commitment.findAll({
      where: whereClause,
      include: [
        {
          model: InvestorEntity,
          as: 'investorEntity',
        },
      ],
    });

    if (commitments.length === 0) {
      throw new Error('No commitments found for this investor');
    }

    const investorEntity = commitments[0].investorEntity;
    const commitmentDetails = [];

    let totalCommitment = new Decimal(0);
    let totalCalled = new Decimal(0);
    let totalDistributed = new Decimal(0);

    for (const commitment of commitments) {
      // Get capital allocations
      const capitalAllocations = await CapitalAllocation.findAll({
        where: { commitmentId: commitment.id },
      });

      // Get distribution allocations
      const distributionAllocations = await DistributionAllocation.findAll({
        where: { commitmentId: commitment.id },
      });

      const commitmentAmount = new Decimal(commitment.commitmentAmount);
      const calledAmount = capitalAllocations.reduce(
        (sum, allocation) => sum.add(new Decimal(allocation.allocationAmount)),
        new Decimal(0)
      );
      const distributedAmount = distributionAllocations.reduce(
        (sum, allocation) => sum.add(new Decimal(allocation.totalDistribution)),
        new Decimal(0)
      );
      const unfundedBalance = commitmentAmount.sub(calledAmount);

      commitmentDetails.push({
        commitment,
        capitalAllocations,
        distributionAllocations,
        totalCalled: calledAmount.toString(),
        totalDistributed: distributedAmount.toString(),
        unfundedBalance: unfundedBalance.toString(),
      });

      totalCommitment = totalCommitment.add(commitmentAmount);
      totalCalled = totalCalled.add(calledAmount);
      totalDistributed = totalDistributed.add(distributedAmount);
    }

    const totalUnfunded = totalCommitment.sub(totalCalled);

    return {
      investorEntityId,
      investorEntity,
      commitments: commitmentDetails,
      totalCommitment: totalCommitment.toString(),
      totalCalled: totalCalled.toString(),
      totalDistributed: totalDistributed.toString(),
      totalUnfunded: totalUnfunded.toString(),
    };
  }

  /**
   * Update capital allocation payment status
   */
  async updateCapitalAllocationPayment(
    allocationId: number,
    paidAmount: string,
    paidDate: Date,
    notes?: string
  ): Promise<void> {
    const allocation = await CapitalAllocation.findByPk(allocationId);
    if (!allocation) {
      throw new Error('Capital allocation not found');
    }

    const paidAmountDecimal = new Decimal(paidAmount);
    const allocationAmountDecimal = new Decimal(allocation.allocationAmount);

    if (paidAmountDecimal.greaterThan(allocationAmountDecimal)) {
      throw new Error('Paid amount cannot exceed allocation amount');
    }

    let status: 'paid' | 'partial' = 'paid';
    if (paidAmountDecimal.lessThan(allocationAmountDecimal)) {
      status = 'partial';
    }

    await allocation.update({
      paidAmount: paidAmount,
      paidDate: paidDate,
      status: status as any, // TypeScript workaround for enum
      notes: notes || allocation.notes,
    });

    // Update commitment capital called balance
    const commitment = await Commitment.findByPk(allocation.commitmentId);
    if (commitment) {
      const currentCapitalCalled = new Decimal(commitment.capitalCalled);
      const newCapitalCalled = currentCapitalCalled.add(paidAmountDecimal);
      const commitmentAmount = new Decimal(commitment.commitmentAmount);
      const newUnfundedCommitment = commitmentAmount.sub(newCapitalCalled);

      await commitment.update({
        capitalCalled: newCapitalCalled.toString(),
        unfundedCommitment: newUnfundedCommitment.toString(),
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Update distribution allocation payment status
   */
  async updateDistributionAllocationPayment(
    allocationId: number,
    paymentDate: Date,
    notes?: string
  ): Promise<void> {
    const allocation = await DistributionAllocation.findByPk(allocationId);
    if (!allocation) {
      throw new Error('Distribution allocation not found');
    }

    await allocation.update({
      paymentDate: paymentDate,
      status: 'paid',
      notes: notes || allocation.notes,
    });

    // Update commitment capital returned balance
    const commitment = await Commitment.findByPk(allocation.commitmentId);
    if (commitment) {
      const currentCapitalReturned = new Decimal(commitment.capitalReturned);
      const returnOfCapital = new Decimal(allocation.returnOfCapital);
      const newCapitalReturned = currentCapitalReturned.add(returnOfCapital);

      await commitment.update({
        capitalReturned: newCapitalReturned.toString(),
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Calculate fund-level allocation metrics
   */
  async getFundAllocationMetrics(fundId: number) {
    // Get all commitments for the fund
    const commitments = await Commitment.findAll({
      where: { fundId, status: 'active' },
    });

    const totalCommitments = commitments.reduce(
      (sum, commitment) => sum.add(new Decimal(commitment.commitmentAmount)),
      new Decimal(0)
    );

    const totalCalled = commitments.reduce(
      (sum, commitment) => sum.add(new Decimal(commitment.capitalCalled)),
      new Decimal(0)
    );

    const totalReturned = commitments.reduce(
      (sum, commitment) => sum.add(new Decimal(commitment.capitalReturned)),
      new Decimal(0)
    );

    const totalUnfunded = commitments.reduce(
      (sum, commitment) => sum.add(new Decimal(commitment.unfundedCommitment)),
      new Decimal(0)
    );

    // Calculate percentages
    const calledPercentage = totalCommitments.isZero() 
      ? new Decimal(0) 
      : totalCalled.div(totalCommitments).mul(100);
    
    const returnedPercentage = totalCalled.isZero() 
      ? new Decimal(0) 
      : totalReturned.div(totalCalled).mul(100);

    // Get pending allocations
    const pendingCapitalAllocations = await CapitalAllocation.count({
      where: { 
        fundId,
        status: ['pending', 'notified'],
      },
    });

    const pendingDistributionAllocations = await DistributionAllocation.count({
      where: { 
        fundId,
        status: ['pending', 'approved'],
      },
    });

    return {
      totalCommitments: totalCommitments.toString(),
      totalCalled: totalCalled.toString(),
      totalReturned: totalReturned.toString(),
      totalUnfunded: totalUnfunded.toString(),
      calledPercentage: calledPercentage.toString(),
      returnedPercentage: returnedPercentage.toString(),
      commitmentCount: commitments.length,
      pendingCapitalAllocations,
      pendingDistributionAllocations,
    };
  }

  /**
   * Validate allocation amounts against commitments
   */
  async validateAllocations(
    allocations: Array<{ commitmentId: number; amount: string }>
  ): Promise<Array<{ commitmentId: number; isValid: boolean; error?: string }>> {
    const results = [];

    for (const allocation of allocations) {
      const commitment = await Commitment.findByPk(allocation.commitmentId);
      
      if (!commitment) {
        results.push({
          commitmentId: allocation.commitmentId,
          isValid: false,
          error: 'Commitment not found',
        });
        continue;
      }

      if (commitment.status !== 'active') {
        results.push({
          commitmentId: allocation.commitmentId,
          isValid: false,
          error: 'Commitment is not active',
        });
        continue;
      }

      const allocationAmount = new Decimal(allocation.amount);
      const unfundedAmount = new Decimal(commitment.unfundedCommitment);

      if (allocationAmount.greaterThan(unfundedAmount)) {
        results.push({
          commitmentId: allocation.commitmentId,
          isValid: false,
          error: 'Allocation exceeds unfunded commitment',
        });
        continue;
      }

      if (allocationAmount.lessThanOrEqualTo(0)) {
        results.push({
          commitmentId: allocation.commitmentId,
          isValid: false,
          error: 'Allocation amount must be positive',
        });
        continue;
      }

      results.push({
        commitmentId: allocation.commitmentId,
        isValid: true,
      });
    }

    return results;
  }
}

export default AllocationService;