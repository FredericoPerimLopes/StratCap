import { Transaction } from 'sequelize';
import { CreditPaydown, CreditPaydownAttributes, CreditPaydownCreationAttributes } from '../models/CreditPaydown';
import { CreditFacility } from '../models/CreditFacility';
import { User } from '../models/User';
import { Decimal } from 'decimal.js';
import { CreditFacilityService } from './CreditFacilityService';
import { NotificationService } from './NotificationService';
import { ApprovalWorkflowService } from './ApprovalWorkflowService';

export interface PaydownRequest {
  facilityId: string;
  initiatedBy: string;
  paydownAmount: string;
  paymentDate: Date;
  paydownType: 'scheduled' | 'voluntary' | 'mandatory' | 'prepayment';
  paymentMethod: 'wire' | 'ach' | 'check' | 'internal_transfer';
  purpose?: string;
  principalAmount?: string; // If not provided, will be calculated
  interestAmount?: string; // If not provided, will be calculated
  feesAmount?: string; // If not provided, will be calculated
  metadata?: any;
}

export interface PaydownAllocation {
  totalPayment: Decimal;
  principal: Decimal;
  interest: Decimal;
  fees: Decimal;
  prepaymentPenalty?: Decimal;
}

export interface PaydownProcessing {
  paydownId: string;
  processedBy: string;
  paymentReference: string;
  actualPaymentDate?: Date;
  actualAmount?: string;
}

export interface PaydownValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedAllocation: PaydownAllocation;
}

export class PaydownService {
  private creditFacilityService: CreditFacilityService;
  private notificationService: NotificationService;
  private approvalWorkflowService: ApprovalWorkflowService;

  constructor() {
    this.creditFacilityService = new CreditFacilityService();
    this.notificationService = new NotificationService();
    this.approvalWorkflowService = new ApprovalWorkflowService();
  }

  /**
   * Initiate a new paydown
   */
  async initiatePaydown(
    request: PaydownRequest,
    transaction?: Transaction
  ): Promise<CreditPaydown> {
    // Validate the paydown request
    const validation = await this.validatePaydownRequest(request);
    if (!validation.isValid) {
      throw new Error(`Paydown request validation failed: ${validation.errors.join(', ')}`);
    }

    const facility = await this.creditFacilityService.getFacilityById(request.facilityId);
    const paydownAmount = new Decimal(request.paydownAmount);

    // Calculate payment allocation if not provided
    const allocation = await this.calculatePaymentAllocation(
      facility,
      paydownAmount,
      request.paydownType,
      request.paymentDate
    );

    const principalAmount = request.principalAmount || allocation.principal.toString();
    const interestAmount = request.interestAmount || allocation.interest.toString();
    const feesAmount = request.feesAmount || allocation.fees.toString();

    // Calculate balances after paydown
    const currentOutstanding = facility.getOutstandingBalanceDecimal();
    const currentAvailable = facility.getAvailableAmountDecimal();
    const totalCommitment = facility.getTotalCommitmentDecimal();
    
    const newBalances = this.calculateNewBalances(
      currentOutstanding,
      currentAvailable,
      totalCommitment,
      new Decimal(principalAmount)
    );

    // Calculate prepayment penalty if applicable
    let prepaymentPenalty: string | undefined;
    if (request.paydownType === 'prepayment') {
      const penalty = await this.calculatePrepaymentPenalty(facility, new Decimal(principalAmount));
      if (penalty.greaterThan(0)) {
        prepaymentPenalty = penalty.toString();
      }
    }

    // Prepare allocation breakdown
    const allocations = {
      principal: allocation.principal.toString(),
      interest: allocation.interest.toString(),
      fees: allocation.fees.toString(),
      prepaymentPenalty: prepaymentPenalty || '0',
      total: paydownAmount.toString(),
    };

    // Generate accounting entries
    const accountingEntries = this.generateAccountingEntries(facility, allocation);

    // Prepare approvals
    const approvals = await this.getRequiredApprovals(request, allocation);

    const paydownData: CreditPaydownCreationAttributes = {
      facilityId: request.facilityId,
      initiatedBy: request.initiatedBy,
      paydownAmount: request.paydownAmount,
      principalAmount,
      interestAmount,
      feesAmount,
      paymentDate: request.paymentDate,
      initiatedDate: new Date(),
      paydownType: request.paydownType,
      paymentMethod: request.paymentMethod,
      status: 'pending',
      purpose: request.purpose,
      prepaymentPenalty,
      outstandingAfterPaydown: newBalances.outstanding.toString(),
      availableAfterPaydown: newBalances.available.toString(),
      allocations,
      accountingEntries,
      documents: [],
      approvals,
      notifications: {},
      metadata: request.metadata || {},
    };

    const paydown = await CreditPaydown.create(paydownData, { transaction });

    // Start approval workflow if required
    if (approvals.required.length > 0) {
      await this.approvalWorkflowService.startWorkflow({
        workflowType: 'credit_paydown',
        entityId: paydown.id,
        requestedBy: request.initiatedBy,
        metadata: {
          facilityId: request.facilityId,
          amount: request.paydownAmount,
          paydownType: request.paydownType,
        },
      });
    }

    // Send notifications
    await this.notificationService.sendNotification({
      type: 'paydown_initiated',
      title: 'Credit Paydown Initiated',
      message: `Paydown of ${paydownAmount.toFixed(2)} initiated for facility "${facility.facilityName}"`,
      recipients: ['credit_team', 'fund_managers'],
      metadata: {
        paydownId: paydown.id,
        facilityId: request.facilityId,
        amount: request.paydownAmount,
        paydownType: request.paydownType,
      },
    });

    return paydown;
  }

  /**
   * Process an approved paydown
   */
  async processPaydown(
    processing: PaydownProcessing,
    transaction?: Transaction
  ): Promise<CreditPaydown> {
    const paydown = await this.getPaydownById(processing.paydownId);
    
    if (!paydown.canProcess()) {
      throw new Error('Paydown cannot be processed in current status');
    }

    const actualPaymentDate = processing.actualPaymentDate || new Date();
    const actualAmount = processing.actualAmount || paydown.paydownAmount;

    // Update facility balances
    const principalAmount = new Decimal(paydown.principalAmount);
    await this.creditFacilityService.updateBalancesAfterPaydown(
      paydown.facilityId,
      principalAmount,
      transaction
    );

    await paydown.update({
      status: 'completed',
      processedBy: processing.processedBy,
      processedDate: actualPaymentDate,
      paymentReference: processing.paymentReference,
      paydownAmount: actualAmount,
    }, { transaction });

    // Send notifications
    const facility = await this.creditFacilityService.getFacilityById(paydown.facilityId);
    await this.notificationService.sendNotification({
      type: 'paydown_processed',
      title: 'Credit Paydown Processed',
      message: `Paydown of ${actualAmount} has been processed for facility "${facility.facilityName}"`,
      recipients: ['credit_team', 'fund_managers', paydown.initiatedBy],
      metadata: {
        paydownId: paydown.id,
        facilityId: paydown.facilityId,
        amount: actualAmount,
        paymentReference: processing.paymentReference,
        processedBy: processing.processedBy,
      },
    });

    return paydown;
  }

  /**
   * Cancel a paydown
   */
  async cancelPaydown(
    paydownId: string,
    cancelledBy: string,
    reason?: string,
    transaction?: Transaction
  ): Promise<CreditPaydown> {
    const paydown = await this.getPaydownById(paydownId);
    
    if (!paydown.canCancel()) {
      throw new Error('Paydown cannot be cancelled in current status');
    }

    await paydown.update({
      status: 'cancelled',
      metadata: {
        ...paydown.metadata,
        cancelledBy,
        cancellationReason: reason,
        cancelledDate: new Date(),
      },
    }, { transaction });

    // Cancel approval workflow if exists
    await this.approvalWorkflowService.cancelWorkflow(paydownId, {
      cancelledBy,
      reason,
    });

    // Send notifications
    await this.notificationService.sendNotification({
      type: 'paydown_cancelled',
      title: 'Credit Paydown Cancelled',
      message: `Paydown has been cancelled`,
      recipients: ['credit_team'],
      metadata: {
        paydownId: paydown.id,
        cancelledBy,
        reason,
      },
    });

    return paydown;
  }

  /**
   * Reverse a completed paydown
   */
  async reversePaydown(
    paydownId: string,
    reversedBy: string,
    reason: string,
    transaction?: Transaction
  ): Promise<CreditPaydown> {
    const paydown = await this.getPaydownById(paydownId);
    
    if (!paydown.canReverse()) {
      throw new Error('Paydown cannot be reversed');
    }

    // Reverse facility balance changes
    const principalAmount = new Decimal(paydown.principalAmount);
    await this.creditFacilityService.updateBalancesAfterDrawdown(
      paydown.facilityId,
      principalAmount,
      transaction
    );

    const reversalReference = `REV-${Date.now()}`;

    await paydown.update({
      status: 'cancelled',
      reversalReference,
      metadata: {
        ...paydown.metadata,
        reversedBy,
        reversalReason: reason,
        reversalDate: new Date(),
      },
    }, { transaction });

    // Send notifications
    const facility = await this.creditFacilityService.getFacilityById(paydown.facilityId);
    await this.notificationService.sendNotification({
      type: 'paydown_reversed',
      title: 'Credit Paydown Reversed',
      message: `Paydown of ${paydown.paydownAmount} has been reversed for facility "${facility.facilityName}"`,
      recipients: ['credit_team', 'fund_managers'],
      metadata: {
        paydownId: paydown.id,
        facilityId: paydown.facilityId,
        amount: paydown.paydownAmount,
        reversalReference,
        reversedBy,
        reason,
      },
    });

    return paydown;
  }

  /**
   * Get paydown by ID
   */
  async getPaydownById(paydownId: string): Promise<CreditPaydown> {
    const paydown = await CreditPaydown.findByPk(paydownId, {
      include: [
        { model: CreditFacility, as: 'facility' },
        { model: User, as: 'initiatedByUser' },
        { model: User, as: 'processedByUser' },
      ],
    });
    
    if (!paydown) {
      throw new Error(`Paydown with ID ${paydownId} not found`);
    }
    
    return paydown;
  }

  /**
   * Get paydowns for a facility
   */
  async getPaydownsByFacility(
    facilityId: string,
    status?: string,
    limit: number = 50
  ): Promise<CreditPaydown[]> {
    const whereClause: any = { facilityId };
    if (status) {
      whereClause.status = status;
    }

    return await CreditPaydown.findAll({
      where: whereClause,
      order: [['paymentDate', 'DESC']],
      limit,
      include: [
        { model: User, as: 'initiatedByUser' },
        { model: User, as: 'processedByUser' },
      ],
    });
  }

  /**
   * Calculate payment allocation
   */
  async calculatePaymentAllocation(
    facility: CreditFacility,
    paymentAmount: Decimal,
    paydownType: string,
    paymentDate: Date
  ): Promise<PaydownAllocation> {
    // Calculate accrued interest
    const outstanding = facility.getOutstandingBalanceDecimal();
    const interestRate = facility.getInterestRateDecimal();
    
    // Simple daily interest calculation (in practice, would be more complex)
    const dailyRate = interestRate.dividedBy(365).dividedBy(100);
    const daysAccrued = this.calculateDaysAccrued(facility, paymentDate);
    const accruedInterest = outstanding.times(dailyRate).times(daysAccrued);

    // Calculate fees
    let fees = new Decimal(0);
    if (facility.utilizationFeeRate) {
      const utilizationFee = outstanding.times(facility.getUtilizationFeeRateDecimal().dividedBy(365).dividedBy(100));
      fees = fees.plus(utilizationFee);
    }

    // Calculate prepayment penalty if applicable
    let prepaymentPenalty = new Decimal(0);
    if (paydownType === 'prepayment') {
      prepaymentPenalty = await this.calculatePrepaymentPenalty(facility, paymentAmount);
    }

    // Allocate payment (interest and fees first, then principal)
    let remainingPayment = paymentAmount;
    
    // First, pay interest
    const interestPayment = Decimal.min(accruedInterest, remainingPayment);
    remainingPayment = remainingPayment.minus(interestPayment);

    // Then, pay fees
    const feePayment = Decimal.min(fees, remainingPayment);
    remainingPayment = remainingPayment.minus(feePayment);

    // Then, pay prepayment penalty
    const penaltyPayment = Decimal.min(prepaymentPenalty, remainingPayment);
    remainingPayment = remainingPayment.minus(penaltyPayment);

    // Finally, pay principal
    const principalPayment = Decimal.min(outstanding, remainingPayment);

    return {
      totalPayment: paymentAmount,
      principal: principalPayment,
      interest: interestPayment,
      fees: feePayment,
      prepaymentPenalty: penaltyPayment.greaterThan(0) ? penaltyPayment : undefined,
    };
  }

  /**
   * Calculate prepayment penalty
   */
  private async calculatePrepaymentPenalty(
    facility: CreditFacility,
    principalAmount: Decimal
  ): Promise<Decimal> {
    const keyTerms = facility.keyTerms || {};
    
    if (!keyTerms.prepaymentPenalty) {
      return new Decimal(0);
    }

    // Example penalty calculation (varies by facility terms)
    const penaltyRate = new Decimal(keyTerms.prepaymentPenalty.rate || 0);
    const penaltyType = keyTerms.prepaymentPenalty.type || 'percentage';

    if (penaltyType === 'percentage') {
      return principalAmount.times(penaltyRate.dividedBy(100));
    } else if (penaltyType === 'months_interest') {
      const interestRate = facility.getInterestRateDecimal();
      const monthlyRate = interestRate.dividedBy(12).dividedBy(100);
      const months = new Decimal(keyTerms.prepaymentPenalty.months || 1);
      return principalAmount.times(monthlyRate).times(months);
    }

    return new Decimal(0);
  }

  /**
   * Validate paydown request
   */
  private async validatePaydownRequest(request: PaydownRequest): Promise<PaydownValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const facility = await this.creditFacilityService.getFacilityById(request.facilityId);
      const paymentAmount = new Decimal(request.paydownAmount);

      // Check facility status
      if (facility.facilityStatus !== 'active') {
        errors.push('Facility is not active');
      }

      // Check payment amount
      if (paymentAmount.lessThanOrEqualTo(0)) {
        errors.push('Payment amount must be greater than zero');
      }

      // Check if payment exceeds outstanding balance
      const outstanding = facility.getOutstandingBalanceDecimal();
      if (paymentAmount.greaterThan(outstanding.times(1.1))) { // Allow 10% buffer for fees
        warnings.push('Payment amount significantly exceeds outstanding balance');
      }

      // Check payment date
      if (request.paymentDate < new Date()) {
        warnings.push('Payment date is in the past');
      }

      // Calculate suggested allocation
      const suggestedAllocation = await this.calculatePaymentAllocation(
        facility,
        paymentAmount,
        request.paydownType,
        request.paymentDate
      );

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestedAllocation,
      };

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      
      return {
        isValid: false,
        errors,
        warnings,
        suggestedAllocation: {
          totalPayment: new Decimal(0),
          principal: new Decimal(0),
          interest: new Decimal(0),
          fees: new Decimal(0),
        },
      };
    }
  }

  /**
   * Calculate new facility balances after paydown
   */
  private calculateNewBalances(
    currentOutstanding: Decimal,
    currentAvailable: Decimal,
    totalCommitment: Decimal,
    principalReduction: Decimal
  ): { outstanding: Decimal; available: Decimal } {
    const newOutstanding = currentOutstanding.minus(principalReduction);
    const newAvailable = totalCommitment.minus(newOutstanding);

    return {
      outstanding: newOutstanding,
      available: newAvailable,
    };
  }

  /**
   * Generate accounting entries for paydown
   */
  private generateAccountingEntries(facility: CreditFacility, allocation: PaydownAllocation): any {
    return {
      entries: [
        {
          account: 'Cash',
          debit: allocation.totalPayment,
          credit: new Decimal(0),
          description: `Credit facility paydown`,
        },
        {
          account: 'Credit Facility Payable',
          debit: new Decimal(0),
          credit: allocation.principal,
          description: `Principal paydown - ${facility.facilityName}`,
        },
        {
          account: 'Interest Expense',
          debit: new Decimal(0),
          credit: allocation.interest,
          description: `Interest payment - ${facility.facilityName}`,
        },
        {
          account: 'Fee Expense',
          debit: new Decimal(0),
          credit: allocation.fees,
          description: `Fee payment - ${facility.facilityName}`,
        },
      ],
    };
  }

  /**
   * Get required approvals for paydown
   */
  private async getRequiredApprovals(request: PaydownRequest, allocation: PaydownAllocation): Promise<any> {
    const required: string[] = [];

    // Large payments require additional approval
    if (allocation.totalPayment.greaterThan(new Decimal(1000000))) {
      required.push('senior_management');
    }

    // Prepayments require approval
    if (request.paydownType === 'prepayment') {
      required.push('credit_committee');
    }

    return {
      required,
      completed: [],
    };
  }

  /**
   * Calculate days accrued for interest
   */
  private calculateDaysAccrued(facility: CreditFacility, paymentDate: Date): number {
    // This is a simplified calculation
    // In practice, would track last interest payment date
    const lastPaymentDate = new Date(facility.createdAt);
    return Math.ceil((paymentDate.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get overdue paydowns
   */
  async getOverduePaydowns(facilityId?: string): Promise<CreditPaydown[]> {
    const whereClause: any = { status: 'pending' };
    if (facilityId) {
      whereClause.facilityId = facilityId;
    }

    const paydowns = await CreditPaydown.findAll({
      where: whereClause,
      include: [
        { model: CreditFacility, as: 'facility' },
        { model: User, as: 'initiatedByUser' },
      ],
    });

    return paydowns.filter(paydown => paydown.isOverdue());
  }
}