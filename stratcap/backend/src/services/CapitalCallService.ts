import { Decimal } from 'decimal.js';
import CapitalActivity from '../models/CapitalActivity';
import CapitalAllocation from '../models/CapitalAllocation';
import Commitment from '../models/Commitment';
import Fund from '../models/Fund';
import InvestorEntity from '../models/InvestorEntity';
import InvestorClass from '../models/InvestorClass';
import AllocationService from './AllocationService';
import NotificationService from './NotificationService';

export interface CapitalCallRequest {
  fundId: number;
  eventNumber: string;
  eventDate: Date;
  dueDate?: Date;
  description: string;
  totalAmount: string;
  baseAmount?: string;
  feeAmount?: string;
  expenseAmount?: string;
  purpose?: string;
  allocationMethod: 'pro_rata' | 'custom' | 'class_based';
  customAllocations?: Array<{
    commitmentId: number;
    amount: string;
  }>;
  includeClasses?: number[];
  excludeInvestors?: number[];
  createdBy: number;
}

export interface CapitalCallAllocationResult {
  capitalActivity: CapitalActivity;
  allocations: CapitalAllocation[];
  totalAllocated: string;
  allocationErrors: Array<{
    commitmentId: number;
    error: string;
  }>;
}

class CapitalCallService {
  private allocationService: AllocationService;
  private notificationService: NotificationService;

  constructor() {
    this.allocationService = new AllocationService();
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new capital call with automatic allocation to investors
   */
  async createCapitalCall(request: CapitalCallRequest): Promise<CapitalCallAllocationResult> {
    // Validate fund exists and is active
    const fund = await Fund.findByPk(request.fundId);
    if (!fund) {
      throw new Error('Fund not found');
    }

    if (fund.status === 'closed') {
      throw new Error('Cannot create capital call for closed fund');
    }

    // Create the capital activity
    const capitalActivity = await CapitalActivity.create({
      fundId: request.fundId,
      eventType: 'capital_call',
      eventNumber: request.eventNumber,
      eventDate: request.eventDate,
      dueDate: request.dueDate,
      description: request.description,
      status: 'draft',
      totalAmount: request.totalAmount,
      baseAmount: request.baseAmount,
      feeAmount: request.feeAmount,
      expenseAmount: request.expenseAmount,
      currency: fund.currency,
      purpose: request.purpose,
      metadata: {
        allocationMethod: request.allocationMethod,
        createdBy: request.createdBy,
      },
    });

    // Generate allocations based on method
    const allocationResult = await this.generateAllocations(
      capitalActivity,
      request
    );

    return {
      capitalActivity,
      allocations: allocationResult.allocations,
      totalAllocated: allocationResult.totalAllocated,
      allocationErrors: allocationResult.errors,
    };
  }

  /**
   * Generate allocations for a capital call
   */
  private async generateAllocations(
    capitalActivity: CapitalActivity,
    request: CapitalCallRequest
  ): Promise<{
    allocations: CapitalAllocation[];
    totalAllocated: string;
    errors: Array<{ commitmentId: number; error: string }>;
  }> {
    const allocations: CapitalAllocation[] = [];
    const errors: Array<{ commitmentId: number; error: string }> = [];
    let totalAllocated = new Decimal(0);

    // Get eligible commitments
    const commitments = await this.getEligibleCommitments(
      request.fundId,
      request.includeClasses,
      request.excludeInvestors
    );

    if (commitments.length === 0) {
      throw new Error('No eligible commitments found for this capital call');
    }

    switch (request.allocationMethod) {
      case 'pro_rata':
        const proRataResult = await this.generateProRataAllocations(
          capitalActivity,
          commitments,
          new Decimal(request.totalAmount)
        );
        allocations.push(...proRataResult.allocations);
        totalAllocated = proRataResult.totalAllocated;
        errors.push(...proRataResult.errors);
        break;

      case 'custom':
        if (!request.customAllocations) {
          throw new Error('Custom allocations required for custom allocation method');
        }
        const customResult = await this.generateCustomAllocations(
          capitalActivity,
          commitments,
          request.customAllocations
        );
        allocations.push(...customResult.allocations);
        totalAllocated = customResult.totalAllocated;
        errors.push(...customResult.errors);
        break;

      case 'class_based':
        const classBasedResult = await this.generateClassBasedAllocations(
          capitalActivity,
          commitments,
          new Decimal(request.totalAmount)
        );
        allocations.push(...classBasedResult.allocations);
        totalAllocated = classBasedResult.totalAllocated;
        errors.push(...classBasedResult.errors);
        break;

      default:
        throw new Error('Invalid allocation method');
    }

    return {
      allocations,
      totalAllocated: totalAllocated.toString(),
      errors,
    };
  }

  /**
   * Get eligible commitments for capital call
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
   * Generate pro-rata allocations based on unfunded commitments
   */
  private async generateProRataAllocations(
    capitalActivity: CapitalActivity,
    commitments: Commitment[],
    totalAmount: Decimal
  ): Promise<{
    allocations: CapitalAllocation[];
    totalAllocated: Decimal;
    errors: Array<{ commitmentId: number; error: string }>;
  }> {
    const allocations: CapitalAllocation[] = [];
    const errors: Array<{ commitmentId: number; error: string }> = [];

    // Calculate total unfunded commitments
    const totalUnfunded = commitments.reduce(
      (sum, commitment) => sum.add(new Decimal(commitment.unfundedCommitment)),
      new Decimal(0)
    );

    if (totalUnfunded.isZero()) {
      throw new Error('No unfunded commitments available for allocation');
    }

    let totalAllocated = new Decimal(0);

    for (const commitment of commitments) {
      try {
        const unfundedAmount = new Decimal(commitment.unfundedCommitment);
        
        if (unfundedAmount.isZero()) {
          continue; // Skip fully funded commitments
        }

        // Calculate pro-rata allocation
        const allocationPercentage = unfundedAmount.div(totalUnfunded);
        const allocationAmount = totalAmount.mul(allocationPercentage);

        // Ensure allocation doesn't exceed unfunded commitment
        const finalAllocationAmount = Decimal.min(allocationAmount, unfundedAmount);

        const allocation = await CapitalAllocation.create({
          capitalActivityId: capitalActivity.id,
          commitmentId: commitment.id,
          fundId: commitment.fundId,
          investorEntityId: commitment.investorEntityId,
          investorClassId: commitment.investorClassId,
          allocationAmount: finalAllocationAmount.toString(),
          percentageOfCommitment: finalAllocationAmount.div(new Decimal(commitment.commitmentAmount)).toString(),
          percentageOfTotal: finalAllocationAmount.div(totalAmount).toString(),
          allocationDate: capitalActivity.eventDate,
          dueDate: capitalActivity.dueDate,
          status: 'pending',
          calculations: {
            unfundedCommitment: unfundedAmount.toString(),
            proRataPercentage: allocationPercentage.toString(),
            totalUnfunded: totalUnfunded.toString(),
          },
        });

        allocations.push(allocation);
        totalAllocated = totalAllocated.add(finalAllocationAmount);
      } catch (error) {
        errors.push({
          commitmentId: commitment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { allocations, totalAllocated, errors };
  }

  /**
   * Generate custom allocations based on specified amounts
   */
  private async generateCustomAllocations(
    capitalActivity: CapitalActivity,
    commitments: Commitment[],
    customAllocations: Array<{ commitmentId: number; amount: string }>
  ): Promise<{
    allocations: CapitalAllocation[];
    totalAllocated: Decimal;
    errors: Array<{ commitmentId: number; error: string }>;
  }> {
    const allocations: CapitalAllocation[] = [];
    const errors: Array<{ commitmentId: number; error: string }> = [];
    let totalAllocated = new Decimal(0);

    const commitmentMap = new Map(commitments.map(c => [c.id, c]));
    const totalCustomAmount = customAllocations.reduce(
      (sum, custom) => sum.add(new Decimal(custom.amount)),
      new Decimal(0)
    );

    for (const customAllocation of customAllocations) {
      try {
        const commitment = commitmentMap.get(customAllocation.commitmentId);
        if (!commitment) {
          errors.push({
            commitmentId: customAllocation.commitmentId,
            error: 'Commitment not found or not eligible',
          });
          continue;
        }

        const allocationAmount = new Decimal(customAllocation.amount);
        const unfundedAmount = new Decimal(commitment.unfundedCommitment);

        if (allocationAmount.greaterThan(unfundedAmount)) {
          errors.push({
            commitmentId: customAllocation.commitmentId,
            error: 'Allocation amount exceeds unfunded commitment',
          });
          continue;
        }

        const allocation = await CapitalAllocation.create({
          capitalActivityId: capitalActivity.id,
          commitmentId: commitment.id,
          fundId: commitment.fundId,
          investorEntityId: commitment.investorEntityId,
          investorClassId: commitment.investorClassId,
          allocationAmount: allocationAmount.toString(),
          percentageOfCommitment: allocationAmount.div(new Decimal(commitment.commitmentAmount)).toString(),
          percentageOfTotal: allocationAmount.div(totalCustomAmount).toString(),
          allocationDate: capitalActivity.eventDate,
          dueDate: capitalActivity.dueDate,
          status: 'pending',
          calculations: {
            customAmount: allocationAmount.toString(),
            unfundedCommitment: unfundedAmount.toString(),
          },
        });

        allocations.push(allocation);
        totalAllocated = totalAllocated.add(allocationAmount);
      } catch (error) {
        errors.push({
          commitmentId: customAllocation.commitmentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { allocations, totalAllocated, errors };
  }

  /**
   * Generate class-based allocations with different allocation percentages per class
   */
  private async generateClassBasedAllocations(
    capitalActivity: CapitalActivity,
    commitments: Commitment[],
    totalAmount: Decimal
  ): Promise<{
    allocations: CapitalAllocation[];
    totalAllocated: Decimal;
    errors: Array<{ commitmentId: number; error: string }>;
  }> {
    const allocations: CapitalAllocation[] = [];
    const errors: Array<{ commitmentId: number; error: string }> = [];
    let totalAllocated = new Decimal(0);

    // Group commitments by class
    const commitmentsByClass = new Map<number, Commitment[]>();
    commitments.forEach(commitment => {
      const classId = commitment.investorClassId;
      if (!commitmentsByClass.has(classId)) {
        commitmentsByClass.set(classId, []);
      }
      commitmentsByClass.get(classId)!.push(commitment);
    });

    // For now, allocate equally across classes (can be enhanced with class-specific rules)
    const numberOfClasses = commitmentsByClass.size;
    const amountPerClass = totalAmount.div(numberOfClasses);

    for (const [classId, classCommitments] of commitmentsByClass) {
      try {
        const proRataResult = await this.generateProRataAllocations(
          capitalActivity,
          classCommitments,
          amountPerClass
        );
        
        allocations.push(...proRataResult.allocations);
        totalAllocated = totalAllocated.add(proRataResult.totalAllocated);
        errors.push(...proRataResult.errors);
      } catch (error) {
        classCommitments.forEach(commitment => {
          errors.push({
            commitmentId: commitment.id,
            error: error instanceof Error ? error.message : 'Class allocation error',
          });
        });
      }
    }

    return { allocations, totalAllocated, errors };
  }

  /**
   * Approve a capital call and send notifications
   */
  async approveCapitalCall(capitalActivityId: number, approvedBy: number): Promise<void> {
    const capitalActivity = await CapitalActivity.findByPk(capitalActivityId, {
      include: [
        {
          model: CapitalAllocation,
          as: 'allocations',
        },
      ],
    });

    if (!capitalActivity) {
      throw new Error('Capital activity not found');
    }

    if (capitalActivity.status !== 'draft') {
      throw new Error('Capital call must be in draft status to approve');
    }

    // Update capital activity status
    await capitalActivity.update({
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    });

    // Update all allocations to notified status and send notifications
    const allocations = await CapitalAllocation.findAll({
      where: { capitalActivityId },
      include: [
        {
          model: InvestorEntity,
          as: 'investorEntity',
        },
      ],
    });

    for (const allocation of allocations) {
      await allocation.update({ status: 'notified' });
      
      // Send notification
      await this.notificationService.sendCapitalCallNotification(
        allocation,
        capitalActivity
      );
    }
  }

  /**
   * Get capital call summary with allocation details
   */
  async getCapitalCallSummary(capitalActivityId: number) {
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

    const allocations = await CapitalAllocation.findAll({
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

    const totalAllocated = allocations.reduce(
      (sum, allocation) => sum.add(new Decimal(allocation.allocationAmount)),
      new Decimal(0)
    );

    const statusSummary = allocations.reduce((summary, allocation) => {
      summary[allocation.status] = (summary[allocation.status] || 0) + 1;
      return summary;
    }, {} as Record<string, number>);

    return {
      capitalActivity,
      allocations,
      totalAllocated: totalAllocated.toString(),
      allocationCount: allocations.length,
      statusSummary,
    };
  }
}

export default CapitalCallService;