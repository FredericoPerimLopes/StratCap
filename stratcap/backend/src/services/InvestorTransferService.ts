import InvestorTransfer from '../models/InvestorTransfer';
import Commitment from '../models/Commitment';
import InvestorEntity from '../models/InvestorEntity';
import Fund from '../models/Fund';
import User from '../models/User';
import { DocumentService } from './DocumentService';
import { NotificationService } from './NotificationService';
import { Op } from 'sequelize';

export interface TransferStep {
  step: number;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  requiredFields?: string[];
  completedAt?: Date;
  completedBy?: number;
}

export interface TransferWizardData {
  // Step 1: Transfer Initiation
  transferType: 'full' | 'partial';
  transferAmount?: string;
  transferPercentage?: string;
  transferDate: Date;
  effectiveDate: Date;
  transferReason: string;
  pricePerUnit?: string;
  totalConsideration?: string;
  
  // Step 2: Transferee Details
  transfereeType: 'new' | 'existing';
  transfereeId?: number;
  transfereeDetails?: {
    name: string;
    legalName: string;
    type: 'individual' | 'institution' | 'fund' | 'trust' | 'other';
    entityType?: string;
    taxId?: string;
    domicile: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    primaryContact?: string;
    primaryEmail?: string;
    primaryPhone?: string;
    accreditedInvestor: boolean;
    qualifiedPurchaser: boolean;
  };
  
  // Step 3: Documentation
  documents?: Array<{
    type: 'kyc' | 'aml' | 'transfer_agreement' | 'consent' | 'other';
    name: string;
    required: boolean;
    uploaded: boolean;
    fileId?: string;
    verificationStatus?: 'pending' | 'approved' | 'rejected';
  }>;
  
  // Step 4: Review & Approval
  reviewNotes?: string;
  internalApproval?: boolean;
  gpConsent?: boolean;
  
  // Step 5: Completion
  completionNotes?: string;
}

export interface TransferValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiredActions?: string[];
}

class InvestorTransferService {
  private documentService: DocumentService;
  private notificationService: NotificationService;

  constructor() {
    this.documentService = new DocumentService();
    this.notificationService = new NotificationService();
  }

  /**
   * Initialize a new investor transfer workflow
   */
  async initializeTransfer(
    commitmentId: number,
    transferorId: number,
    userId: number,
    initialData: Partial<TransferWizardData>
  ): Promise<InvestorTransfer> {
    // Validate commitment exists and belongs to transferor
    const commitment = await Commitment.findOne({
      where: {
        id: commitmentId,
        investorEntityId: transferorId,
      },
      include: [
        { model: Fund, as: 'fund' },
        { model: InvestorEntity, as: 'investorEntity' },
      ],
    });

    if (!commitment) {
      throw new Error('Commitment not found or does not belong to transferor');
    }

    // Check if there are any pending transfers for this commitment
    const existingTransfer = await InvestorTransfer.findOne({
      where: {
        commitmentId,
        status: ['draft', 'submitted', 'under_review', 'approved'],
      },
    });

    if (existingTransfer) {
      throw new Error('There is already a pending transfer for this commitment');
    }

    // Initialize transfer steps
    const steps: TransferStep[] = [
      {
        step: 1,
        name: 'Transfer Initiation',
        description: 'Define transfer type, amounts, and basic terms',
        status: 'pending',
        requiredFields: ['transferType', 'transferDate', 'effectiveDate', 'transferReason'],
      },
      {
        step: 2,
        name: 'Transferee Details',
        description: 'Provide transferee information and create entity if new',
        status: 'pending',
        requiredFields: ['transfereeType'],
      },
      {
        step: 3,
        name: 'Documentation',
        description: 'Upload and verify required transfer documents',
        status: 'pending',
      },
      {
        step: 4,
        name: 'Review & Approval',
        description: 'Internal review and GP consent',
        status: 'pending',
      },
      {
        step: 5,
        name: 'Completion',
        description: 'Finalize transfer and update records',
        status: 'pending',
      },
    ];

    const transfer = await InvestorTransfer.create({
      fundId: (commitment as any).fundId,
      transferorId,
      commitmentId,
      transferType: initialData.transferType || 'full',
      transferDate: initialData.transferDate || new Date(),
      effectiveDate: initialData.effectiveDate || new Date(),
      status: 'draft',
      currentStep: 'initiation',
      transferReason: initialData.transferReason || '',
      metadata: {
        wizardData: initialData,
        steps,
        createdBy: userId,
        currentStepNumber: 1,
      },
    });

    return transfer;
  }

  /**
   * Update transfer step data
   */
  async updateTransferStep(
    transferId: number,
    stepNumber: number,
    stepData: Partial<TransferWizardData>,
    userId: number
  ): Promise<InvestorTransfer> {
    const transfer = await InvestorTransfer.findByPk(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status === 'completed' || transfer.status === 'cancelled') {
      throw new Error('Cannot modify completed or cancelled transfer');
    }

    const currentMetadata = transfer.metadata || {};
    const wizardData = { ...currentMetadata.wizardData, ...stepData };
    const steps = currentMetadata.steps || [];

    // Update the specific step
    const stepIndex = steps.findIndex((s: TransferStep) => s.step === stepNumber);
    if (stepIndex !== -1) {
      steps[stepIndex] = {
        ...steps[stepIndex],
        status: 'completed',
        completedAt: new Date(),
        completedBy: userId,
      };
    }

    // Determine next step and current step enum
    let currentStepNumber = stepNumber;
    let currentStep = transfer.currentStep;

    if (stepNumber < 5) {
      currentStepNumber = stepNumber + 1;
      const nextStepIndex = steps.findIndex((s: TransferStep) => s.step === currentStepNumber);
      if (nextStepIndex !== -1) {
        steps[nextStepIndex].status = 'in_progress';
      }

      // Update current step enum
      const stepMap: { [key: number]: InvestorTransfer['currentStep'] } = {
        1: 'initiation',
        2: 'transferee_details',
        3: 'documentation',
        4: 'review',
        5: 'completion',
      };
      currentStep = stepMap[currentStepNumber] || 'initiation';
    }

    await transfer.update({
      currentStep,
      metadata: {
        ...currentMetadata,
        wizardData,
        steps,
        currentStepNumber,
        lastUpdatedBy: userId,
        lastUpdatedAt: new Date(),
      },
    });

    // Process step-specific logic
    await this.processStepLogic(transfer, stepNumber, stepData, userId);

    return transfer;
  }

  /**
   * Process step-specific logic
   */
  private async processStepLogic(
    transfer: InvestorTransfer,
    stepNumber: number,
    stepData: Partial<TransferWizardData>,
    userId: number
  ): Promise<void> {
    switch (stepNumber) {
      case 1: // Transfer Initiation
        await this.processTransferInitiation(transfer, stepData);
        break;
      case 2: // Transferee Details
        await this.processTransfereeDetails(transfer, stepData, userId);
        break;
      case 3: // Documentation
        await this.processDocumentation(transfer, stepData);
        break;
      case 4: // Review & Approval
        await this.processReviewApproval(transfer, stepData, userId);
        break;
      case 5: // Completion
        await this.processCompletion(transfer, userId);
        break;
    }
  }

  /**
   * Process transfer initiation
   */
  private async processTransferInitiation(
    transfer: InvestorTransfer,
    stepData: Partial<TransferWizardData>
  ): Promise<void> {
    const updateData: any = {};

    if (stepData.transferType) {
      updateData.transferType = stepData.transferType;
    }

    if (stepData.transferAmount) {
      updateData.transferAmount = stepData.transferAmount;
    }

    if (stepData.transferPercentage) {
      updateData.transferPercentage = stepData.transferPercentage;
    }

    if (stepData.transferDate) {
      updateData.transferDate = stepData.transferDate;
    }

    if (stepData.effectiveDate) {
      updateData.effectiveDate = stepData.effectiveDate;
    }

    if (stepData.transferReason) {
      updateData.transferReason = stepData.transferReason;
    }

    if (stepData.pricePerUnit) {
      updateData.pricePerUnit = stepData.pricePerUnit;
    }

    if (stepData.totalConsideration) {
      updateData.totalConsideration = stepData.totalConsideration;
    }

    if (Object.keys(updateData).length > 0) {
      await transfer.update(updateData);
    }
  }

  /**
   * Process transferee details
   */
  private async processTransfereeDetails(
    transfer: InvestorTransfer,
    stepData: Partial<TransferWizardData>,
    userId: number
  ): Promise<void> {
    if (stepData.transfereeType === 'existing' && stepData.transfereeId) {
      // Validate existing transferee
      const existingTransferee = await InvestorEntity.findByPk(stepData.transfereeId);
      if (!existingTransferee) {
        throw new Error('Selected transferee not found');
      }

      await transfer.update({
        transfereeId: stepData.transfereeId,
        transfereeDetails: stepData.transfereeDetails,
      });
    } else if (stepData.transfereeType === 'new' && stepData.transfereeDetails) {
      // Create new transferee entity
      const newTransferee = await InvestorEntity.create({
        ...stepData.transfereeDetails,
        kycStatus: 'pending',
        amlStatus: 'pending',
        metadata: {
          createdInTransfer: transfer.id,
          createdBy: userId,
        },
      });

      await transfer.update({
        transfereeId: newTransferee.id,
        transfereeDetails: stepData.transfereeDetails,
      });
    }
  }

  /**
   * Process documentation
   */
  private async processDocumentation(
    transfer: InvestorTransfer,
    stepData: Partial<TransferWizardData>
  ): Promise<void> {
    if (!stepData.documents) {
      return;
    }

    // Categorize documents
    const kycDocs = stepData.documents.filter(d => d.type === 'kyc');
    const amlDocs = stepData.documents.filter(d => d.type === 'aml');
    const transferAgreement = stepData.documents.filter(d => d.type === 'transfer_agreement');
    const consentDocs = stepData.documents.filter(d => d.type === 'consent');
    const otherDocs = stepData.documents.filter(d => d.type === 'other');

    await transfer.update({
      kycDocuments: { documents: kycDocs, uploadedAt: new Date() },
      amlDocuments: { documents: amlDocs, uploadedAt: new Date() },
      transferAgreement: { documents: transferAgreement, uploadedAt: new Date() },
      consentDocuments: { documents: consentDocs, uploadedAt: new Date() },
      otherDocuments: { documents: otherDocs, uploadedAt: new Date() },
    });
  }

  /**
   * Process review and approval
   */
  private async processReviewApproval(
    transfer: InvestorTransfer,
    stepData: Partial<TransferWizardData>,
    userId: number
  ): Promise<void> {
    if (stepData.internalApproval && stepData.gpConsent) {
      await transfer.update({
        status: 'approved',
        reviewedBy: userId,
        reviewedAt: new Date(),
        approvedBy: userId,
        approvedAt: new Date(),
        metadata: {
          ...transfer.metadata,
          reviewNotes: stepData.reviewNotes,
          approvalDetails: {
            internalApproval: stepData.internalApproval,
            gpConsent: stepData.gpConsent,
            approvedBy: userId,
            approvedAt: new Date(),
          },
        },
      });

      // Send approval notifications
      await this.notificationService.sendTransferApprovalNotification(transfer.id);
    } else {
      await transfer.update({
        status: 'under_review',
        reviewedBy: userId,
        reviewedAt: new Date(),
        metadata: {
          ...transfer.metadata,
          reviewNotes: stepData.reviewNotes,
        },
      });
    }
  }

  /**
   * Process transfer completion
   */
  private async processCompletion(transfer: InvestorTransfer, userId: number): Promise<void> {
    // Validate transfer is ready for completion
    const validation = await this.validateTransferCompletion(transfer.id);
    if (!validation.isValid) {
      throw new Error(`Cannot complete transfer: ${validation.errors.join(', ')}`);
    }

    // Get commitment and calculate transfer amounts
    const commitment = await Commitment.findByPk(transfer.commitmentId);
    if (!commitment) {
      throw new Error('Original commitment not found');
    }

    let transferAmount: number;
    if (transfer.transferType === 'full') {
      transferAmount = parseFloat(commitment.commitmentAmount);
    } else {
      if (transfer.transferAmount) {
        transferAmount = parseFloat(transfer.transferAmount);
      } else if (transfer.transferPercentage) {
        const percentage = parseFloat(transfer.transferPercentage) / 100;
        transferAmount = parseFloat(commitment.commitmentAmount) * percentage;
      } else {
        throw new Error('Transfer amount or percentage must be specified for partial transfers');
      }
    }

    if (transfer.transferType === 'full') {
      // Full transfer: update existing commitment to new transferee
      await commitment.update({
        investorEntityId: transfer.transfereeId!,
        metadata: {
          ...commitment.metadata,
          transferHistory: [
            ...(commitment.metadata?.transferHistory || []),
            {
              transferId: transfer.id,
              fromInvestorId: transfer.transferorId,
              toInvestorId: transfer.transfereeId,
              transferDate: transfer.effectiveDate,
              transferType: 'full',
              amount: transferAmount.toFixed(2),
            },
          ],
        },
      });
    } else {
      // Partial transfer: create new commitment for transferee and reduce original
      const remainingAmount = parseFloat(commitment.commitmentAmount) - transferAmount;

      // Create new commitment for transferee
      await Commitment.create({
        fundId: commitment.fundId,
        investorEntityId: transfer.transfereeId!,
        investorClassId: commitment.investorClassId,
        commitmentAmount: transferAmount.toFixed(2),
        commitmentDate: transfer.effectiveDate,
        status: 'active',
        sideLetterTerms: commitment.sideLetterTerms,
        capitalCalled: '0',
        capitalReturned: '0',
        unfundedCommitment: transferAmount.toFixed(2),
        preferredReturn: '0',
        carriedInterest: '0',
        metadata: {
          createdFromTransfer: transfer.id,
          originalCommitmentId: commitment.id,
          transferDetails: {
            transferorId: transfer.transferorId,
            transferDate: transfer.effectiveDate,
            transferAmount: transferAmount.toFixed(2),
          },
        },
      });

      // Update original commitment with reduced amount
      await commitment.update({
        commitmentAmount: remainingAmount.toFixed(2),
        unfundedCommitment: (parseFloat(commitment.unfundedCommitment) - transferAmount).toFixed(2),
        metadata: {
          ...commitment.metadata,
          transferHistory: [
            ...(commitment.metadata?.transferHistory || []),
            {
              transferId: transfer.id,
              toInvestorId: transfer.transfereeId,
              transferDate: transfer.effectiveDate,
              transferType: 'partial',
              amount: transferAmount.toFixed(2),
              remainingAmount: remainingAmount.toFixed(2),
            },
          ],
        },
      });
    }

    // Mark transfer as completed
    await transfer.update({
      status: 'completed',
      completedAt: new Date(),
      metadata: {
        ...transfer.metadata,
        completionDetails: {
          completedBy: userId,
          completedAt: new Date(),
          transferAmount: transferAmount.toFixed(2),
        },
      },
    });

    // Send completion notifications
    await this.notificationService.sendTransferCompletionNotification(transfer.id);
  }

  /**
   * Validate transfer for completion
   */
  async validateTransferCompletion(transferId: number): Promise<TransferValidationResult> {
    const transfer = await InvestorTransfer.findByPk(transferId, {
      include: [
        { model: InvestorEntity, as: 'transferor' },
        { model: InvestorEntity, as: 'transferee' },
        { model: Commitment, as: 'commitment' },
      ],
    });

    if (!transfer) {
      return {
        isValid: false,
        errors: ['Transfer not found'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredActions: string[] = [];

    // Check transfer status
    if (transfer.status !== 'approved') {
      errors.push('Transfer must be approved before completion');
    }

    // Check transferee exists
    if (!transfer.transfereeId) {
      errors.push('Transferee must be specified');
    }

    // Check transferee KYC/AML status
    const transferee = (transfer as any).transferee;
    if (transferee) {
      if (transferee.kycStatus !== 'approved') {
        errors.push('Transferee KYC must be approved');
        requiredActions.push('Complete transferee KYC approval');
      }
      if (transferee.amlStatus !== 'approved') {
        errors.push('Transferee AML must be approved');
        requiredActions.push('Complete transferee AML approval');
      }
    }

    // Check required documents
    const docs = transfer.metadata?.wizardData?.documents || [];
    const requiredDocs = docs.filter((d: any) => d.required);
    const uploadedRequiredDocs = requiredDocs.filter((d: any) => d.uploaded);
    
    if (uploadedRequiredDocs.length < requiredDocs.length) {
      const missingDocs = requiredDocs.filter((d: any) => !d.uploaded);
      errors.push(`Missing required documents: ${missingDocs.map((d: any) => d.name).join(', ')}`);
    }

    // Check transfer agreement
    const transferAgreementDocs = docs.filter((d: any) => d.type === 'transfer_agreement' && d.uploaded);
    if (transferAgreementDocs.length === 0) {
      errors.push('Transfer agreement must be uploaded');
    }

    // Check consent documents for GP consent requirement
    const consentDocs = docs.filter((d: any) => d.type === 'consent' && d.uploaded);
    if (consentDocs.length === 0) {
      warnings.push('No GP consent documents uploaded');
    }

    // Validate transfer amounts for partial transfers
    if (transfer.transferType === 'partial') {
      if (!transfer.transferAmount && !transfer.transferPercentage) {
        errors.push('Transfer amount or percentage must be specified for partial transfers');
      }

      const commitment = (transfer as any).commitment;
      if (commitment && transfer.transferAmount) {
        const transferAmount = parseFloat(transfer.transferAmount);
        const commitmentAmount = parseFloat(commitment.commitmentAmount);
        
        if (transferAmount <= 0 || transferAmount >= commitmentAmount) {
          errors.push('Transfer amount must be greater than 0 and less than total commitment');
        }
      }
    }

    // Check effective date
    if (transfer.effectiveDate > new Date()) {
      warnings.push('Transfer effective date is in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredActions: requiredActions.length > 0 ? requiredActions : undefined,
    };
  }

  /**
   * Get transfer summary
   */
  async getTransferSummary(transferId: number) {
    const transfer = await InvestorTransfer.findByPk(transferId, {
      include: [
        { model: Fund, as: 'fund' },
        { model: InvestorEntity, as: 'transferor' },
        { model: InvestorEntity, as: 'transferee' },
        { model: Commitment, as: 'commitment' },
        { model: User, as: 'submitter' },
        { model: User, as: 'reviewer' },
        { model: User, as: 'approver' },
      ],
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    const steps = transfer.metadata?.steps || [];
    const completedSteps = steps.filter((s: TransferStep) => s.status === 'completed').length;
    const totalSteps = steps.length;

    return {
      transfer,
      progress: {
        completedSteps,
        totalSteps,
        percentage: Math.round((completedSteps / totalSteps) * 100),
        currentStep: transfer.metadata?.currentStepNumber || 1,
      },
      validation: await this.validateTransferCompletion(transferId),
    };
  }

  /**
   * Submit transfer for review
   */
  async submitTransfer(transferId: number, userId: number): Promise<InvestorTransfer> {
    const transfer = await InvestorTransfer.findByPk(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'draft') {
      throw new Error('Only draft transfers can be submitted');
    }

    // Basic validation before submission
    const validation = await this.validateTransferForSubmission(transferId);
    if (!validation.isValid) {
      throw new Error(`Cannot submit transfer: ${validation.errors.join(', ')}`);
    }

    await transfer.update({
      status: 'submitted',
      submittedBy: userId,
      submittedAt: new Date(),
    });

    // Send submission notifications
    await this.notificationService.sendTransferSubmissionNotification(transferId);

    return transfer;
  }

  /**
   * Validate transfer for submission
   */
  private async validateTransferForSubmission(transferId: number): Promise<TransferValidationResult> {
    const transfer = await InvestorTransfer.findByPk(transferId);
    if (!transfer) {
      return {
        isValid: false,
        errors: ['Transfer not found'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic required fields
    if (!transfer.transferType) {
      errors.push('Transfer type must be specified');
    }

    if (!transfer.transferReason) {
      errors.push('Transfer reason must be provided');
    }

    if (!transfer.transferDate || !transfer.effectiveDate) {
      errors.push('Transfer dates must be specified');
    }

    // Check transferee
    if (!transfer.transfereeId && !transfer.transfereeDetails) {
      errors.push('Transferee information must be provided');
    }

    // Check partial transfer amounts
    if (transfer.transferType === 'partial' && !transfer.transferAmount && !transfer.transferPercentage) {
      errors.push('Transfer amount or percentage must be specified for partial transfers');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Cancel transfer
   */
  async cancelTransfer(transferId: number, userId: number, reason: string): Promise<InvestorTransfer> {
    const transfer = await InvestorTransfer.findByPk(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status === 'completed') {
      throw new Error('Cannot cancel completed transfer');
    }

    await transfer.update({
      status: 'cancelled',
      rejectionReason: reason,
      metadata: {
        ...transfer.metadata,
        cancellation: {
          cancelledBy: userId,
          cancelledAt: new Date(),
          reason,
        },
      },
    });

    return transfer;
  }

  /**
   * Get transfers for fund with filtering
   */
  async getTransfersForFund(
    fundId: number,
    filters: {
      status?: string;
      transferType?: string;
      transferorId?: number;
      transfereeId?: number;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ) {
    const whereClause: any = { fundId };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.transferType) {
      whereClause.transferType = filters.transferType;
    }

    if (filters.transferorId) {
      whereClause.transferorId = filters.transferorId;
    }

    if (filters.transfereeId) {
      whereClause.transfereeId = filters.transfereeId;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.transferDate = {};
      if (filters.dateFrom) {
        whereClause.transferDate[Op.gte] = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause.transferDate[Op.lte] = filters.dateTo;
      }
    }

    return await InvestorTransfer.findAll({
      where: whereClause,
      include: [
        { model: Fund, as: 'fund' },
        { model: InvestorEntity, as: 'transferor' },
        { model: InvestorEntity, as: 'transferee' },
        { model: Commitment, as: 'commitment' },
        { model: User, as: 'submitter' },
        { model: User, as: 'approver' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}

export default InvestorTransferService;