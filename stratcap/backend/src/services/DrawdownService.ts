import { Transaction } from 'sequelize';
import { CreditDrawdown, CreditDrawdownAttributes, CreditDrawdownCreationAttributes } from '../models/CreditDrawdown';
import { CreditFacility } from '../models/CreditFacility';
import { BorrowingBase } from '../models/BorrowingBase';
import { User } from '../models/User';
import { Decimal } from 'decimal.js';
import { CreditFacilityService } from './CreditFacilityService';
import NotificationService from './NotificationService';
import ApprovalWorkflowService from './ApprovalWorkflowService';

export interface DrawdownRequest {
  facilityId: string;
  requestedBy: string;
  drawdownAmount: string;
  purpose: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  requestedFundingDate?: Date;
  interestRate?: string;
  maturityDate?: Date;
  requiredDocuments?: string[];
  metadata?: any;
}

export interface DrawdownApproval {
  drawdownId: string;
  approvedBy: string;
  approvalNotes?: string;
  approvedAmount?: string; // If different from requested
  conditions?: string[];
}

export interface DrawdownRejection {
  drawdownId: string;
  rejectedBy: string;
  rejectionReason: string;
}

export interface DrawdownFunding {
  drawdownId: string;
  fundedBy: string;
  fundingReference: string;
  actualFundingDate?: Date;
  actualAmount?: string; // If different from approved
}

export interface DrawdownValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  complianceChecks: {
    facilityAvailability: boolean;
    borrowingBaseCompliance: boolean;
    documentationComplete: boolean;
    covenantCompliance: boolean;
  };
}

export class DrawdownService {
  private creditFacilityService: CreditFacilityService;
  private notificationService: NotificationService;
  private approvalWorkflowService: ApprovalWorkflowService;

  constructor() {
    this.creditFacilityService = new CreditFacilityService();
    this.notificationService = new NotificationService();
    this.approvalWorkflowService = new ApprovalWorkflowService();
  }

  /**
   * Request a new drawdown
   */
  async requestDrawdown(
    request: DrawdownRequest,
    transaction?: Transaction
  ): Promise<CreditDrawdown> {
    // Validate the drawdown request
    const validation = await this.validateDrawdownRequest(request);
    if (!validation.isValid) {
      throw new Error(`Drawdown request validation failed: ${validation.errors.join(', ')}`);
    }

    const facility = await this.creditFacilityService.getFacilityById(request.facilityId);
    const drawdownAmount = new Decimal(request.drawdownAmount);

    // Get current borrowing base if required
    let borrowingBaseAtDrawdown: string | undefined;
    let utilizationAfterDrawdown: string | undefined;

    if (facility.borrowingBaseRequired) {
      const currentBorrowingBase = await this.getCurrentBorrowingBase(request.facilityId);
      if (currentBorrowingBase) {
        borrowingBaseAtDrawdown = currentBorrowingBase.totalBorrowingBase;
      }
    }

    // Calculate utilization after drawdown
    const currentOutstanding = facility.getOutstandingBalanceDecimal();
    const totalCommitment = facility.getTotalCommitmentDecimal();
    const newOutstanding = currentOutstanding.plus(drawdownAmount);
    utilizationAfterDrawdown = totalCommitment.isZero() 
      ? '0' 
      : newOutstanding.dividedBy(totalCommitment).times(100).toString();

    // Prepare compliance checks
    const complianceChecks = {
      facilityStatus: facility.facilityStatus === 'active',
      availabilityCheck: validation.complianceChecks.facilityAvailability,
      borrowingBaseCheck: validation.complianceChecks.borrowingBaseCompliance,
      documentationCheck: validation.complianceChecks.documentationComplete,
      covenantCheck: validation.complianceChecks.covenantCompliance,
      requestedBy: request.requestedBy,
      requestDate: new Date(),
    };

    // Calculate expected fees
    const fees = await this.calculateDrawdownFees(facility, drawdownAmount);

    const drawdownData: CreditDrawdownCreationAttributes = {
      facilityId: request.facilityId,
      requestedBy: request.requestedBy,
      drawdownAmount: request.drawdownAmount,
      requestDate: new Date(),
      purpose: request.purpose,
      priority: request.priority || 'medium',
      status: 'pending',
      interestRate: request.interestRate,
      maturityDate: request.maturityDate,
      fees,
      documents: [],
      complianceChecks,
      borrowingBaseAtDrawdown,
      utilizationAfterDrawdown,
      relatedTransactions: [],
      metadata: request.metadata || {},
    };

    const drawdown = await CreditDrawdown.create(drawdownData, { transaction });

    // Start approval workflow
    await this.approvalWorkflowService.startWorkflow({
      workflowType: 'credit_drawdown',
      entityId: drawdown.id,
      requestedBy: request.requestedBy,
      metadata: {
        facilityId: request.facilityId,
        amount: request.drawdownAmount,
        priority: drawdown.priority,
      },
    });

    // Send notifications
    await this.notificationService.sendNotification({
      type: 'drawdown_requested',
      title: 'New Drawdown Request',
      message: `Drawdown request for ${drawdownAmount.toFixed(2)} submitted for facility "${facility.facilityName}"`,
      recipients: ['credit_team', 'fund_managers'],
      metadata: {
        drawdownId: drawdown.id,
        facilityId: request.facilityId,
        amount: request.drawdownAmount,
        priority: drawdown.priority,
      },
    });

    return drawdown;
  }

  /**
   * Approve a drawdown request
   */
  async approveDrawdown(
    approval: DrawdownApproval,
    transaction?: Transaction
  ): Promise<CreditDrawdown> {
    const drawdown = await this.getDrawdownById(approval.drawdownId);
    
    if (!drawdown.canApprove()) {
      throw new Error('Drawdown cannot be approved in current status');
    }

    const approvalData: Partial<CreditDrawdownAttributes> = {
      status: 'approved',
      approvedBy: approval.approvedBy,
      approvalDate: new Date(),
      approvalNotes: approval.approvalNotes,
    };

    // If approved amount is different from requested
    if (approval.approvedAmount && approval.approvedAmount !== drawdown.drawdownAmount) {
      approvalData.drawdownAmount = approval.approvedAmount;
      
      // Recalculate fees and utilization
      const facility = await this.creditFacilityService.getFacilityById(drawdown.facilityId);
      const newAmount = new Decimal(approval.approvedAmount);
      approvalData.fees = await this.calculateDrawdownFees(facility, newAmount);
    }

    await drawdown.update(approvalData, { transaction });

    // Update approval workflow
    await this.approvalWorkflowService.completeWorkflow(drawdown.id, {
      approvedBy: approval.approvedBy,
      status: 'approved',
      notes: approval.approvalNotes,
    });

    // Send notifications
    const facility = await this.creditFacilityService.getFacilityById(drawdown.facilityId);
    await this.notificationService.sendNotification({
      type: 'drawdown_approved',
      title: 'Drawdown Request Approved',
      message: `Drawdown request for ${drawdown.drawdownAmount} approved for facility "${facility.facilityName}"`,
      recipients: ['credit_team', 'fund_managers', drawdown.requestedBy],
      metadata: {
        drawdownId: drawdown.id,
        facilityId: drawdown.facilityId,
        approvedAmount: drawdown.drawdownAmount,
        approvedBy: approval.approvedBy,
      },
    });

    return drawdown;
  }

  /**
   * Reject a drawdown request
   */
  async rejectDrawdown(
    rejection: DrawdownRejection,
    transaction?: Transaction
  ): Promise<CreditDrawdown> {
    const drawdown = await this.getDrawdownById(rejection.drawdownId);
    
    if (!drawdown.canReject()) {
      throw new Error('Drawdown cannot be rejected in current status');
    }

    await drawdown.update({
      status: 'rejected',
      approvedBy: rejection.rejectedBy,
      approvalDate: new Date(),
      rejectionReason: rejection.rejectionReason,
    }, { transaction });

    // Update approval workflow
    await this.approvalWorkflowService.completeWorkflow(drawdown.id, {
      approvedBy: rejection.rejectedBy,
      status: 'rejected',
      notes: rejection.rejectionReason,
    });

    // Send notifications
    const facility = await this.creditFacilityService.getFacilityById(drawdown.facilityId);
    await this.notificationService.sendNotification({
      type: 'drawdown_rejected',
      title: 'Drawdown Request Rejected',
      message: `Drawdown request for ${drawdown.drawdownAmount} rejected for facility "${facility.facilityName}"`,
      recipients: ['credit_team', drawdown.requestedBy],
      metadata: {
        drawdownId: drawdown.id,
        facilityId: drawdown.facilityId,
        rejectionReason: rejection.rejectionReason,
        rejectedBy: rejection.rejectedBy,
      },
    });

    return drawdown;
  }

  /**
   * Fund an approved drawdown
   */
  async fundDrawdown(
    funding: DrawdownFunding,
    transaction?: Transaction
  ): Promise<CreditDrawdown> {
    const drawdown = await this.getDrawdownById(funding.drawdownId);
    
    if (!drawdown.canFund()) {
      throw new Error('Drawdown cannot be funded in current status');
    }

    const fundingDate = funding.actualFundingDate || new Date();
    const fundedAmount = funding.actualAmount || drawdown.drawdownAmount;

    // Update facility balances
    await this.creditFacilityService.updateBalancesAfterDrawdown(
      drawdown.facilityId,
      new Decimal(fundedAmount),
      transaction
    );

    await drawdown.update({
      status: 'funded',
      fundingDate,
      fundingReference: funding.fundingReference,
      drawdownAmount: fundedAmount,
      interestStartDate: fundingDate,
    }, { transaction });

    // Send notifications
    const facility = await this.creditFacilityService.getFacilityById(drawdown.facilityId);
    await this.notificationService.sendNotification({
      type: 'drawdown_funded',
      title: 'Drawdown Funded',
      message: `Drawdown of ${fundedAmount} has been funded for facility "${facility.facilityName}"`,
      recipients: ['credit_team', 'fund_managers', drawdown.requestedBy],
      metadata: {
        drawdownId: drawdown.id,
        facilityId: drawdown.facilityId,
        fundedAmount,
        fundingReference: funding.fundingReference,
        fundedBy: funding.fundedBy,
      },
    });

    return drawdown;
  }

  /**
   * Cancel a drawdown request
   */
  async cancelDrawdown(
    drawdownId: string,
    cancelledBy: string,
    reason?: string,
    transaction?: Transaction
  ): Promise<CreditDrawdown> {
    const drawdown = await this.getDrawdownById(drawdownId);
    
    if (!drawdown.canCancel()) {
      throw new Error('Drawdown cannot be cancelled in current status');
    }

    await drawdown.update({
      status: 'cancelled',
      metadata: {
        ...drawdown.metadata,
        cancelledBy,
        cancellationReason: reason,
        cancelledDate: new Date(),
      },
    }, { transaction });

    // Cancel approval workflow
    await this.approvalWorkflowService.cancelWorkflow(drawdownId, {
      cancelledBy,
      reason,
    });

    // Send notifications
    await this.notificationService.sendNotification({
      type: 'drawdown_cancelled',
      title: 'Drawdown Request Cancelled',
      message: `Drawdown request has been cancelled`,
      recipients: ['credit_team'],
      metadata: {
        drawdownId: drawdown.id,
        cancelledBy,
        reason,
      },
    });

    return drawdown;
  }

  /**
   * Get drawdown by ID
   */
  async getDrawdownById(drawdownId: string): Promise<CreditDrawdown> {
    const drawdown = await CreditDrawdown.findByPk(drawdownId, {
      include: [
        { model: CreditFacility, as: 'facility' },
        { model: User, as: 'requestedByUser' },
        { model: User, as: 'approvedByUser' },
      ],
    });
    
    if (!drawdown) {
      throw new Error(`Drawdown with ID ${drawdownId} not found`);
    }
    
    return drawdown;
  }

  /**
   * Get drawdowns for a facility
   */
  async getDrawdownsByFacility(
    facilityId: string,
    status?: string,
    limit: number = 50
  ): Promise<CreditDrawdown[]> {
    const whereClause: any = { facilityId };
    if (status) {
      whereClause.status = status;
    }

    return await CreditDrawdown.findAll({
      where: whereClause,
      order: [['requestDate', 'DESC']],
      limit,
      include: [
        { model: User, as: 'requestedByUser' },
        { model: User, as: 'approvedByUser' },
      ],
    });
  }

  /**
   * Validate drawdown request
   */
  private async validateDrawdownRequest(request: DrawdownRequest): Promise<DrawdownValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const complianceChecks = {
      facilityAvailability: false,
      borrowingBaseCompliance: false,
      documentationComplete: false,
      covenantCompliance: false,
    };

    try {
      const facility = await this.creditFacilityService.getFacilityById(request.facilityId);
      const requestedAmount = new Decimal(request.drawdownAmount);

      // Check facility status
      if (facility.facilityStatus !== 'active') {
        errors.push('Facility is not active');
      }

      // Check facility availability
      const canDrawdown = facility.canDrawdown(requestedAmount);
      complianceChecks.facilityAvailability = canDrawdown;
      
      if (!canDrawdown) {
        errors.push('Requested amount exceeds available facility capacity');
      }

      // Check borrowing base compliance if required
      if (facility.borrowingBaseRequired) {
        const currentBorrowingBase = await this.getCurrentBorrowingBase(request.facilityId);
        if (currentBorrowingBase) {
          const newOutstanding = facility.getOutstandingBalanceDecimal().plus(requestedAmount);
          const borrowingBaseLimit = new Decimal(currentBorrowingBase.totalBorrowingBase);
          
          complianceChecks.borrowingBaseCompliance = newOutstanding.lessThanOrEqualTo(borrowingBaseLimit);
          
          if (!complianceChecks.borrowingBaseCompliance) {
            errors.push('Drawdown would exceed borrowing base limit');
          }
        } else {
          warnings.push('No current borrowing base certificate available');
        }
      } else {
        complianceChecks.borrowingBaseCompliance = true;
      }

      // Check documentation requirements
      const requiredDocs = request.requiredDocuments || [];
      complianceChecks.documentationComplete = requiredDocs.length === 0; // Simplified check
      
      // Check covenant compliance (simplified)
      complianceChecks.covenantCompliance = true;

      // Additional validations
      if (requestedAmount.lessThanOrEqualTo(0)) {
        errors.push('Drawdown amount must be greater than zero');
      }

      if (!request.purpose || request.purpose.trim().length === 0) {
        errors.push('Purpose is required');
      }

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      complianceChecks,
    };
  }

  /**
   * Calculate drawdown fees
   */
  private async calculateDrawdownFees(facility: CreditFacility, amount: Decimal): Promise<any> {
    const fees: any = {};

    // Arrangement fee (one-time fee on drawdown)
    if (facility.keyTerms?.arrangementFeeRate) {
      const arrangementRate = new Decimal(facility.keyTerms.arrangementFeeRate);
      fees.arrangementFee = amount.times(arrangementRate.dividedBy(100)).toString();
    }

    // Utilization fee calculation
    if (facility.utilizationFeeRate) {
      const utilizationRate = facility.getUtilizationFeeRateDecimal();
      fees.utilizationFeeRate = utilizationRate.toString();
    }

    // Commitment fee calculation (on unused portion)
    if (facility.commitmentFeeRate) {
      const commitmentRate = facility.getCommitmentFeeRateDecimal();
      fees.commitmentFeeRate = commitmentRate.toString();
    }

    return fees;
  }

  /**
   * Get current borrowing base for facility
   */
  private async getCurrentBorrowingBase(facilityId: string): Promise<BorrowingBase | null> {
    return await BorrowingBase.findOne({
      where: {
        facilityId,
        status: 'approved',
      },
      order: [['reportingDate', 'DESC']],
    });
  }

  /**
   * Get pending drawdowns requiring attention
   */
  async getPendingDrawdowns(facilityId?: string): Promise<CreditDrawdown[]> {
    const whereClause: any = { status: 'pending' };
    if (facilityId) {
      whereClause.facilityId = facilityId;
    }

    const pendingDrawdowns = await CreditDrawdown.findAll({
      where: whereClause,
      order: [['priority', 'DESC'], ['requestDate', 'ASC']],
      include: [
        { model: CreditFacility, as: 'facility' },
        { model: User, as: 'requestedByUser' },
      ],
    });

    // Filter overdue drawdowns
    return pendingDrawdowns.filter(drawdown => drawdown.isOverdue());
  }
}