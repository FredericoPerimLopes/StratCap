import Closing from '../models/Closing';
import Commitment from '../models/Commitment';
import Fund from '../models/Fund';
import InvestorEntity from '../models/InvestorEntity';
import User from '../models/User';
import CapitalActivity from '../models/CapitalActivity';
import { EqualizationService } from './EqualizationService';
import NotificationService from './NotificationService';
import { Op } from 'sequelize';

export interface ClosingStep {
  step: number;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  requiredFields?: string[];
  completedAt?: Date;
  completedBy?: number;
}

export interface ClosingWizardData {
  // Step 1: Basic Information
  closingType: 'initial' | 'subsequent' | 'final';
  closingDate: Date;
  effectiveDate?: Date;
  
  // Step 2: Commitments
  newInvestors?: Array<{
    investorEntityId: number;
    investorClassId: number;
    commitmentAmount: string;
    commitmentDate: Date;
    sideLetterTerms?: Record<string, any>;
  }>;
  
  // Step 3: Equalization
  equalizationRequired: boolean;
  equalizationSettings?: {
    interestRate: string;
    startDate: Date;
    endDate: Date;
    method: 'capital_only' | 'capital_and_fees' | 'custom';
  };
  
  // Step 4: Fee Calculations
  feeTrueUpRequired: boolean;
  feeCalculations?: Record<string, any>;
  
  // Step 5: Documents
  documents?: Array<{
    type: string;
    name: string;
    required: boolean;
    uploaded: boolean;
    fileId?: string;
  }>;
  
  // Step 6: Review & Approval
  reviewNotes?: string;
  approvalRequired: boolean;
}

export interface ClosingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingDocuments?: string[];
}

class ClosingWorkflowService {
  private equalizationService: EqualizationService;
  private notificationService: NotificationService;

  constructor() {
    this.equalizationService = new EqualizationService();
    this.notificationService = new NotificationService();
  }

  /**
   * Initialize a new closing workflow
   */
  async initializeClosing(fundId: number, userId: number, initialData: Partial<ClosingWizardData>): Promise<Closing> {
    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      throw new Error('Fund not found');
    }

    // Get next closing number
    const lastClosing = await Closing.findOne({
      where: { fundId },
      order: [['closingNumber', 'DESC']],
    });
    const closingNumber = lastClosing ? lastClosing.closingNumber + 1 : 1;

    // Initialize closing steps
    const steps: ClosingStep[] = [
      {
        step: 1,
        name: 'Basic Information',
        description: 'Set closing type, date, and basic parameters',
        status: 'pending',
        requiredFields: ['closingType', 'closingDate'],
      },
      {
        step: 2,
        name: 'Commitments',
        description: 'Add new investor commitments',
        status: 'pending',
      },
      {
        step: 3,
        name: 'Equalization',
        description: 'Calculate capital and fee equalization',
        status: 'pending',
      },
      {
        step: 4,
        name: 'Fee Calculations',
        description: 'Calculate and true-up management fees',
        status: 'pending',
      },
      {
        step: 5,
        name: 'Documentation',
        description: 'Upload and verify closing documents',
        status: 'pending',
      },
      {
        step: 6,
        name: 'Review & Completion',
        description: 'Final review and closing completion',
        status: 'pending',
      },
    ];

    const closing = await Closing.create({
      fundId,
      closingNumber,
      closingDate: initialData.closingDate || new Date(),
      closingType: initialData.closingType || 'subsequent',
      status: 'draft',
      totalCommitments: '0',
      newCommitments: '0',
      metadata: {
        wizardData: initialData,
        steps,
        createdBy: userId,
        currentStep: 1,
      },
    });

    return closing;
  }

  /**
   * Get closing workflow steps
   */
  async getClosingSteps(closingId: number): Promise<ClosingStep[]> {
    const closing = await Closing.findByPk(closingId);
    if (!closing) {
      throw new Error('Closing not found');
    }

    return closing.metadata?.steps || [];
  }

  /**
   * Update closing wizard data for a specific step
   */
  async updateClosingStep(
    closingId: number, 
    stepNumber: number, 
    stepData: Partial<ClosingWizardData>,
    userId: number
  ): Promise<Closing> {
    const closing = await Closing.findByPk(closingId);
    if (!closing) {
      throw new Error('Closing not found');
    }

    if (closing.status === 'completed') {
      throw new Error('Cannot modify completed closing');
    }

    const currentMetadata = closing.metadata || {};
    const wizardData = { ...currentMetadata.wizardData, ...stepData };
    const steps = currentMetadata.steps || [];

    // Update the specific step
    const stepIndex = steps.findIndex((s: ClosingStep) => s.step === stepNumber);
    if (stepIndex !== -1) {
      steps[stepIndex] = {
        ...steps[stepIndex],
        status: 'completed',
        completedAt: new Date(),
        completedBy: userId,
      };
    }

    // Update current step
    let currentStep = stepNumber;
    if (stepNumber < 6) {
      currentStep = stepNumber + 1;
      const nextStepIndex = steps.findIndex((s: ClosingStep) => s.step === currentStep);
      if (nextStepIndex !== -1) {
        steps[nextStepIndex].status = 'in_progress';
      }
    }

    await closing.update({
      metadata: {
        ...currentMetadata,
        wizardData,
        steps,
        currentStep,
        lastUpdatedBy: userId,
        lastUpdatedAt: new Date(),
      },
    });

    // Process step-specific logic
    await this.processStepLogic(closing, stepNumber, stepData, userId);

    return closing;
  }

  /**
   * Process step-specific logic
   */
  private async processStepLogic(
    closing: Closing, 
    stepNumber: number, 
    stepData: Partial<ClosingWizardData>,
    userId: number
  ): Promise<void> {
    switch (stepNumber) {
      case 2: // Commitments
        await this.processCommitments(closing, stepData, userId);
        break;
      case 3: // Equalization
        await this.processEqualization(closing, stepData);
        break;
      case 4: // Fee Calculations
        await this.processFeeCalculations(closing, stepData);
        break;
      case 5: // Documentation
        await this.processDocumentation(closing, stepData);
        break;
      case 6: // Review & Completion
        await this.processCompletion(closing, userId);
        break;
    }
  }

  /**
   * Process new commitments
   */
  private async processCommitments(
    closing: Closing, 
    stepData: Partial<ClosingWizardData>,
    userId: number
  ): Promise<void> {
    if (!stepData.newInvestors || stepData.newInvestors.length === 0) {
      return;
    }

    let totalNewCommitments = 0;

    for (const investor of stepData.newInvestors) {
      // Create new commitment
      await Commitment.create({
        fundId: closing.fundId,
        investorEntityId: investor.investorEntityId,
        investorClassId: investor.investorClassId,
        commitmentAmount: investor.commitmentAmount,
        commitmentDate: investor.commitmentDate,
        closingId: closing.id,
        status: 'active',
        sideLetterTerms: investor.sideLetterTerms,
        capitalCalled: '0',
        capitalReturned: '0',
        unfundedCommitment: investor.commitmentAmount,
        preferredReturn: '0',
        carriedInterest: '0',
        metadata: {
          createdInClosing: closing.id,
          createdBy: userId,
        },
      });

      totalNewCommitments += parseFloat(investor.commitmentAmount);
    }

    // Update closing totals
    const existingCommitments = await Commitment.sum('commitmentAmount', {
      where: { 
        fundId: closing.fundId,
        closingId: { [Op.not]: closing.id },
      },
    }) || 0;

    await closing.update({
      newCommitments: totalNewCommitments.toString(),
      totalCommitments: (existingCommitments + totalNewCommitments).toString(),
    });
  }

  /**
   * Process equalization calculations
   */
  private async processEqualization(
    closing: Closing, 
    stepData: Partial<ClosingWizardData>
  ): Promise<void> {
    if (!stepData.equalizationRequired || !stepData.equalizationSettings) {
      return;
    }

    const { interestRate, startDate, endDate, method } = stepData.equalizationSettings;

    // Calculate capital equalization
    const capitalEqualization = await this.equalizationService.calculateCapitalEqualization(
      closing.fundId,
      startDate,
      endDate,
      parseFloat(interestRate)
    );

    let nonCapitalEqualization = null;
    if (method === 'capital_and_fees') {
      nonCapitalEqualization = await this.equalizationService.calculateNonCapitalEqualization(
        closing.fundId,
        startDate,
        endDate,
        parseFloat(interestRate)
      );
    }

    await closing.update({
      equalizationInterestRate: interestRate,
      equalizationStartDate: startDate,
      equalizationEndDate: endDate,
      capitalEqualization,
      nonCapitalEqualization: nonCapitalEqualization || undefined,
    });
  }

  /**
   * Process fee calculations
   */
  private async processFeeCalculations(
    closing: Closing, 
    stepData: Partial<ClosingWizardData>
  ): Promise<void> {
    if (!stepData.feeTrueUpRequired) {
      return;
    }

    // Get all capital activities since last closing
    const lastClosing = await Closing.findOne({
      where: { 
        fundId: closing.fundId,
        id: { [Op.not]: closing.id },
        status: 'completed',
      },
      order: [['closingDate', 'DESC']],
    });

    const startDate = lastClosing ? lastClosing.closingDate : new Date(2000, 0, 1);
    
    const capitalActivities = await CapitalActivity.findAll({
      where: {
        fundId: closing.fundId,
        eventDate: {
          [Op.between]: [startDate, closing.closingDate],
        },
        status: 'approved',
      },
    });

    // Calculate fee true-ups
    const feeTrueUp = {
      calculatedAt: new Date(),
      period: { start: startDate, end: closing.closingDate },
      activities: capitalActivities.length,
      managementFees: 0,
      carriedInterest: 0,
      otherFees: 0,
      totalAdjustment: 0,
    };

    await closing.update({ feeTrueUp });
  }

  /**
   * Process documentation
   */
  private async processDocumentation(
    closing: Closing, 
    stepData: Partial<ClosingWizardData>
  ): Promise<void> {
    if (!stepData.documents) {
      return;
    }

    const documents = {
      uploadedAt: new Date(),
      documents: stepData.documents,
      requiredDocuments: stepData.documents.filter(d => d.required),
      uploadedDocuments: stepData.documents.filter(d => d.uploaded),
    };

    await closing.update({ documents });
  }

  /**
   * Process closing completion
   */
  private async processCompletion(closing: Closing, userId: number): Promise<void> {
    // Validate closing is ready for completion
    const validation = await this.validateClosingCompletion(closing.id);
    
    if (!validation.isValid) {
      throw new Error(`Cannot complete closing: ${validation.errors.join(', ')}`);
    }

    await closing.update({
      status: 'completed',
      completedAt: new Date(),
      approvedBy: userId,
      approvedAt: new Date(),
    });

    // Send completion notifications
    await this.notificationService.sendSimpleNotification({
      type: 'closing_completed',
      title: 'Closing Completed',
      message: `Closing ${closing.id} has been completed successfully`,
      recipients: ['operations_team'],
      metadata: { closingId: closing.id }
    });
  }

  /**
   * Validate closing for completion
   */
  async validateClosingCompletion(closingId: number): Promise<ClosingValidationResult> {
    const closing = await Closing.findByPk(closingId, {
      include: [
        { model: Commitment, as: 'commitments' },
        { model: Fund, as: 'fund' },
      ],
    });

    if (!closing) {
      return {
        isValid: false,
        errors: ['Closing not found'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const missingDocuments: string[] = [];

    // Check all steps are completed
    const steps = closing.metadata?.steps || [];
    const incompleteSteps = steps.filter((s: ClosingStep) => s.status !== 'completed' && s.status !== 'skipped');
    
    if (incompleteSteps.length > 0) {
      errors.push(`Incomplete steps: ${incompleteSteps.map((s: ClosingStep) => s.name).join(', ')}`);
    }

    // Check required documents
    const documents = closing.documents?.documents || [];
    const requiredDocs = documents.filter((d: any) => d.required && !d.uploaded);
    
    if (requiredDocs.length > 0) {
      requiredDocs.forEach((doc: any) => missingDocuments.push(doc.name));
      errors.push(`Missing required documents: ${requiredDocs.map((d: any) => d.name).join(', ')}`);
    }

    // Check commitments have valid data
    const commitments = (closing as any).commitments || [];
    const invalidCommitments = commitments.filter((c: any) => 
      !c.commitmentAmount || parseFloat(c.commitmentAmount) <= 0
    );
    
    if (invalidCommitments.length > 0) {
      errors.push(`Invalid commitment amounts for ${invalidCommitments.length} commitments`);
    }

    // Warnings for best practices
    if (!closing.equalizationInterestRate && closing.closingType !== 'initial') {
      warnings.push('No equalization interest rate set for subsequent closing');
    }

    if (!closing.feeTrueUp && commitments.length > 0) {
      warnings.push('Fee true-up calculations not performed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingDocuments: missingDocuments.length > 0 ? missingDocuments : undefined,
    };
  }

  /**
   * Get closing summary for dashboard
   */
  async getClosingSummary(closingId: number) {
    const closing = await Closing.findByPk(closingId, {
      include: [
        { model: Fund, as: 'fund' },
        { model: Commitment, as: 'commitments', include: [
          { model: InvestorEntity, as: 'investorEntity' },
        ]},
        { model: User, as: 'approver' },
      ],
    });

    if (!closing) {
      throw new Error('Closing not found');
    }

    const steps = closing.metadata?.steps || [];
    const completedSteps = steps.filter((s: ClosingStep) => s.status === 'completed').length;
    const totalSteps = steps.length;

    return {
      closing,
      progress: {
        completedSteps,
        totalSteps,
        percentage: Math.round((completedSteps / totalSteps) * 100),
        currentStep: closing.metadata?.currentStep || 1,
      },
      validation: await this.validateClosingCompletion(closingId),
    };
  }

  /**
   * Clone closing for amendment
   */
  async cloneClosing(closingId: number, userId: number): Promise<Closing> {
    const originalClosing = await Closing.findByPk(closingId);
    if (!originalClosing) {
      throw new Error('Original closing not found');
    }

    const newClosingNumber = await this.getNextClosingNumber(originalClosing.fundId);
    
    const clonedClosing = await Closing.create({
      fundId: originalClosing.fundId,
      closingNumber: newClosingNumber,
      closingDate: new Date(),
      closingType: originalClosing.closingType,
      status: 'draft',
      totalCommitments: originalClosing.totalCommitments,
      newCommitments: '0',
      equalizationInterestRate: originalClosing.equalizationInterestRate,
      metadata: {
        ...originalClosing.metadata,
        clonedFrom: closingId,
        clonedBy: userId,
        clonedAt: new Date(),
        currentStep: 1,
      },
    });

    return clonedClosing;
  }

  /**
   * Get next closing number for fund
   */
  private async getNextClosingNumber(fundId: number): Promise<number> {
    const lastClosing = await Closing.findOne({
      where: { fundId },
      order: [['closingNumber', 'DESC']],
    });
    
    return lastClosing ? lastClosing.closingNumber + 1 : 1;
  }

  /**
   * Get closings for fund with filtering
   */
  async getClosingsForFund(
    fundId: number, 
    filters: {
      status?: string;
      closingType?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ) {
    const whereClause: any = { fundId };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.closingType) {
      whereClause.closingType = filters.closingType;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.closingDate = {};
      if (filters.dateFrom) {
        whereClause.closingDate[Op.gte] = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause.closingDate[Op.lte] = filters.dateTo;
      }
    }

    return await Closing.findAll({
      where: whereClause,
      include: [
        { model: Fund, as: 'fund' },
        { model: User, as: 'approver' },
      ],
      order: [['closingNumber', 'DESC']],
    });
  }
}

export default ClosingWorkflowService;