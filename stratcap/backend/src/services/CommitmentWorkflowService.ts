import Commitment from '../models/Commitment';
import Fund from '../models/Fund';
import InvestorEntity from '../models/InvestorEntity';
import InvestorClass from '../models/InvestorClass';
import Transaction from '../models/Transaction';
import CapitalActivity from '../models/CapitalActivity';
import NotificationService from './NotificationService';
import { Op } from 'sequelize';

export interface CommitmentAnalytics {
  commitmentId: number;
  investorName: string;
  currentMetrics: {
    commitmentAmount: string;
    capitalCalled: string;
    capitalReturned: string;
    unfundedCommitment: string;
    netContributions: string;
    totalDistributions: string;
    currentNAV: string;
    multipleOnInvested: number;
    irr: number;
  };
  projectedMetrics: {
    projectedCalls: string;
    projectedDistributions: string;
    projectedNAV: string;
    projectedMultiple: number;
    projectedIRR: number;
  };
  riskMetrics: {
    concentrationRisk: number;
    liquidityRisk: number;
    performanceRisk: number;
    overallRiskScore: number;
  };
  complianceStatus: {
    kycStatus: string;
    amlStatus: string;
    accreditationStatus: string;
    sideLetterCompliance: boolean;
    taxComplianceStatus: string;
  };
}

export interface SideLetterTerm {
  termType: string;
  description: string;
  value?: string;
  effectiveDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'superseded';
  applicableEvents?: string[];
  metadata?: Record<string, any>;
}

export interface CommitmentRecalculation {
  commitmentId: number;
  recalculationType: 'capital_call' | 'distribution' | 'nav_update' | 'fee_adjustment' | 'side_letter_change';
  previousValues: {
    capitalCalled: string;
    capitalReturned: string;
    unfundedCommitment: string;
    preferredReturn: string;
    carriedInterest: string;
  };
  newValues: {
    capitalCalled: string;
    capitalReturned: string;
    unfundedCommitment: string;
    preferredReturn: string;
    carriedInterest: string;
  };
  adjustments: {
    capitalAdjustment: string;
    distributionAdjustment: string;
    feeAdjustment: string;
    preferredReturnAdjustment: string;
    carriedInterestAdjustment: string;
  };
  recalculationDate: Date;
  triggeredBy: number;
  auditTrail: Array<{
    field: string;
    oldValue: string;
    newValue: string;
    reason: string;
    timestamp: Date;
  }>;
}

export interface CommitmentWorkflowStep {
  step: number;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  requiredFields?: string[];
  completedAt?: Date;
  completedBy?: number;
  validationRules?: Array<{
    field: string;
    rule: string;
    message: string;
  }>;
}

class CommitmentWorkflowService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Recalculate commitment values based on transactions
   */
  async recalculateCommitment(
    commitmentId: number,
    recalculationType: CommitmentRecalculation['recalculationType'],
    triggeredBy: number,
    reason?: string
  ): Promise<CommitmentRecalculation> {
    const commitment = await Commitment.findByPk(commitmentId, {
      include: [
        { model: Transaction, as: 'transactions' },
        { model: InvestorEntity, as: 'investorEntity' },
        { model: Fund, as: 'fund' },
      ],
    });

    if (!commitment) {
      throw new Error('Commitment not found');
    }

    // Store previous values
    const previousValues = {
      capitalCalled: commitment.capitalCalled,
      capitalReturned: commitment.capitalReturned,
      unfundedCommitment: commitment.unfundedCommitment,
      preferredReturn: commitment.preferredReturn,
      carriedInterest: commitment.carriedInterest,
    };

    // Get all transactions for this commitment
    const transactions = (commitment as any).transactions || [];
    
    // Calculate new values
    let capitalCalled = 0;
    let capitalReturned = 0;
    let preferredReturn = 0;
    let carriedInterest = 0;

    for (const transaction of transactions) {
      const amount = parseFloat(transaction.amount);
      
      switch (transaction.type) {
        case 'capital_call':
        case 'subscription':
          capitalCalled += amount;
          break;
        case 'distribution':
          capitalReturned += amount;
          break;
        case 'preferred_return':
          preferredReturn += amount;
          break;
        case 'carried_interest':
          carriedInterest += amount;
          break;
      }
    }

    const commitmentAmount = parseFloat(commitment.commitmentAmount);
    const unfundedCommitment = Math.max(0, commitmentAmount - capitalCalled);

    const newValues = {
      capitalCalled: capitalCalled.toFixed(2),
      capitalReturned: capitalReturned.toFixed(2),
      unfundedCommitment: unfundedCommitment.toFixed(2),
      preferredReturn: preferredReturn.toFixed(2),
      carriedInterest: carriedInterest.toFixed(2),
    };

    // Calculate adjustments
    const adjustments = {
      capitalAdjustment: (capitalCalled - parseFloat(previousValues.capitalCalled)).toFixed(2),
      distributionAdjustment: (capitalReturned - parseFloat(previousValues.capitalReturned)).toFixed(2),
      feeAdjustment: '0.00', // To be calculated based on fee changes
      preferredReturnAdjustment: (preferredReturn - parseFloat(previousValues.preferredReturn)).toFixed(2),
      carriedInterestAdjustment: (carriedInterest - parseFloat(previousValues.carriedInterest)).toFixed(2),
    };

    // Create audit trail
    const auditTrail = [];
    const fields = ['capitalCalled', 'capitalReturned', 'unfundedCommitment', 'preferredReturn', 'carriedInterest'];
    
    for (const field of fields) {
      const oldValue = previousValues[field as keyof typeof previousValues];
      const newValue = newValues[field as keyof typeof newValues];
      
      if (oldValue !== newValue) {
        auditTrail.push({
          field,
          oldValue,
          newValue,
          reason: reason || `Recalculation due to ${recalculationType}`,
          timestamp: new Date(),
        });
      }
    }

    // Update commitment
    await commitment.update({
      ...newValues,
      lastUpdated: new Date(),
      metadata: {
        ...commitment.metadata,
        lastRecalculation: {
          date: new Date(),
          type: recalculationType,
          triggeredBy,
          reason,
        },
        recalculationHistory: [
          ...(commitment.metadata?.recalculationHistory || []),
          {
            date: new Date(),
            type: recalculationType,
            previousValues,
            newValues,
            adjustments,
            triggeredBy,
          },
        ],
      },
    });

    const recalculation: CommitmentRecalculation = {
      commitmentId,
      recalculationType,
      previousValues,
      newValues,
      adjustments,
      recalculationDate: new Date(),
      triggeredBy,
      auditTrail,
    };

    return recalculation;
  }

  /**
   * Bulk recalculate commitments for a fund
   */
  async bulkRecalculateCommitments(
    fundId: number,
    recalculationType: CommitmentRecalculation['recalculationType'],
    triggeredBy: number,
    commitmentIds?: number[]
  ): Promise<CommitmentRecalculation[]> {
    const whereClause: any = { fundId };
    
    if (commitmentIds && commitmentIds.length > 0) {
      whereClause.id = { [Op.in]: commitmentIds };
    }

    const commitments = await Commitment.findAll({
      where: whereClause,
    });

    const recalculations: CommitmentRecalculation[] = [];

    for (const commitment of commitments) {
      try {
        const recalculation = await this.recalculateCommitment(
          commitment.id,
          recalculationType,
          triggeredBy,
          `Bulk recalculation for fund ${fundId}`
        );
        recalculations.push(recalculation);
      } catch (error) {
        console.error(`Failed to recalculate commitment ${commitment.id}:`, error);
      }
    }

    return recalculations;
  }

  /**
   * Manage side letter terms
   */
  async updateSideLetterTerms(
    commitmentId: number,
    terms: SideLetterTerm[],
    updatedBy: number
  ): Promise<Commitment> {
    const commitment = await Commitment.findByPk(commitmentId);
    if (!commitment) {
      throw new Error('Commitment not found');
    }

    // Validate terms
    const validation = this.validateSideLetterTerms(terms);
    if (!validation.isValid) {
      throw new Error(`Invalid side letter terms: ${validation.errors.join(', ')}`);
    }

    // Process terms - mark expired ones as superseded
    const existingTerms = commitment.sideLetterTerms?.terms || [];
    const updatedTerms = [...existingTerms];

    for (const newTerm of terms) {
      // Check for superseding terms
      const conflictingTerms = updatedTerms.filter(
        t => t.termType === newTerm.termType && t.status === 'active'
      );

      // Mark conflicting terms as superseded
      conflictingTerms.forEach(term => {
        term.status = 'superseded';
        term.supersededDate = new Date();
        term.supersededBy = newTerm;
      });

      // Add new term
      updatedTerms.push({
        ...newTerm,
        addedBy: updatedBy,
        addedAt: new Date(),
      });
    }

    await commitment.update({
      sideLetterTerms: {
        terms: updatedTerms,
        lastUpdated: new Date(),
        updatedBy,
      },
      metadata: {
        ...commitment.metadata,
        sideLetterHistory: [
          ...(commitment.metadata?.sideLetterHistory || []),
          {
            date: new Date(),
            action: 'terms_updated',
            termsAdded: terms.length,
            updatedBy,
          },
        ],
      },
    });

    // Trigger recalculation if side letter affects calculations
    if (this.sideLetterAffectsCalculations(terms)) {
      await this.recalculateCommitment(
        commitmentId,
        'side_letter_change',
        updatedBy,
        'Side letter terms updated'
      );
    }

    return commitment;
  }

  /**
   * Validate side letter terms
   */
  private validateSideLetterTerms(terms: SideLetterTerm[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const term of terms) {
      if (!term.termType) {
        errors.push('Term type is required');
      }

      if (!term.description) {
        errors.push('Term description is required');
      }

      if (!term.effectiveDate) {
        errors.push('Effective date is required');
      }

      if (term.expiryDate && term.expiryDate <= term.effectiveDate) {
        errors.push('Expiry date must be after effective date');
      }

      // Validate term type-specific requirements
      if (term.termType === 'fee_override' && !term.value) {
        errors.push('Fee override terms must specify a value');
      }

      if (term.termType === 'distribution_preference' && !term.applicableEvents) {
        errors.push('Distribution preference terms must specify applicable events');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if side letter terms affect calculations
   */
  private sideLetterAffectsCalculations(terms: SideLetterTerm[]): boolean {
    const calculationAffectingTypes = [
      'fee_override',
      'distribution_preference',
      'carried_interest_override',
      'preferred_return_override',
    ];

    return terms.some(term => calculationAffectingTypes.includes(term.termType));
  }

  /**
   * Generate comprehensive commitment analytics
   */
  async generateCommitmentAnalytics(commitmentId: number): Promise<CommitmentAnalytics> {
    const commitment = await Commitment.findByPk(commitmentId, {
      include: [
        { model: InvestorEntity, as: 'investorEntity' },
        { model: Fund, as: 'fund' },
        { model: Transaction, as: 'transactions' },
      ],
    });

    if (!commitment) {
      throw new Error('Commitment not found');
    }

    const investorEntity = (commitment as any).investorEntity;
    const fund = (commitment as any).fund;
    const transactions = (commitment as any).transactions || [];

    // Calculate current metrics
    const currentMetrics = await this.calculateCurrentMetrics(commitment, transactions);
    
    // Calculate projected metrics
    const projectedMetrics = await this.calculateProjectedMetrics(commitment, fund);
    
    // Calculate risk metrics
    const riskMetrics = await this.calculateRiskMetrics(commitment);
    
    // Check compliance status
    const complianceStatus = await this.checkComplianceStatus(commitment, investorEntity);

    return {
      commitmentId,
      investorName: investorEntity.name,
      currentMetrics,
      projectedMetrics,
      riskMetrics,
      complianceStatus,
    };
  }

  /**
   * Calculate current commitment metrics
   */
  private async calculateCurrentMetrics(commitment: any, transactions: any[]): Promise<CommitmentAnalytics['currentMetrics']> {
    const capitalCalled = parseFloat(commitment.capitalCalled);
    const capitalReturned = parseFloat(commitment.capitalReturned);
    const unfundedCommitment = parseFloat(commitment.unfundedCommitment);
    
    let totalDistributions = 0;
    let netContributions = capitalCalled;

    // Calculate from transactions for more accurate values
    for (const transaction of transactions) {
      if (transaction.type === 'distribution') {
        totalDistributions += parseFloat(transaction.amount);
      }
    }

    netContributions = capitalCalled - totalDistributions;

    // Calculate NAV (this would typically come from fund valuations)
    const currentNAV = netContributions > 0 ? netContributions * 1.15 : 0; // Placeholder calculation

    // Calculate multiple and IRR
    const multipleOnInvested = capitalCalled > 0 ? (capitalReturned + currentNAV) / capitalCalled : 0;
    const irr = this.calculateIRR(transactions, currentNAV);

    return {
      commitmentAmount: commitment.commitmentAmount,
      capitalCalled: capitalCalled.toFixed(2),
      capitalReturned: capitalReturned.toFixed(2),
      unfundedCommitment: unfundedCommitment.toFixed(2),
      netContributions: netContributions.toFixed(2),
      totalDistributions: totalDistributions.toFixed(2),
      currentNAV: currentNAV.toFixed(2),
      multipleOnInvested: parseFloat(multipleOnInvested.toFixed(3)),
      irr: parseFloat(irr.toFixed(3)),
    };
  }

  /**
   * Calculate projected metrics
   */
  private async calculateProjectedMetrics(commitment: any, fund: any): Promise<CommitmentAnalytics['projectedMetrics']> {
    // These would typically be based on fund business plan and projections
    const unfundedCommitment = parseFloat(commitment.unfundedCommitment);
    const projectedCallRate = 0.8; // 80% of unfunded commitment
    const projectedDistributionMultiple = 2.5;
    
    const projectedCalls = unfundedCommitment * projectedCallRate;
    const totalProjectedInvestment = parseFloat(commitment.capitalCalled) + projectedCalls;
    const projectedDistributions = totalProjectedInvestment * projectedDistributionMultiple;
    const projectedNAV = 0; // Assuming full exit in projections
    const projectedMultiple = projectedDistributions / totalProjectedInvestment;
    const projectedIRR = 0.15; // 15% target IRR

    return {
      projectedCalls: projectedCalls.toFixed(2),
      projectedDistributions: projectedDistributions.toFixed(2),
      projectedNAV: projectedNAV.toFixed(2),
      projectedMultiple: parseFloat(projectedMultiple.toFixed(3)),
      projectedIRR: parseFloat(projectedIRR.toFixed(3)),
    };
  }

  /**
   * Calculate risk metrics
   */
  private async calculateRiskMetrics(commitment: any): Promise<CommitmentAnalytics['riskMetrics']> {
    // Get fund-level data for concentration calculation
    const fundCommitments = await Commitment.findAll({
      where: { fundId: commitment.fundId },
    });

    const totalFundCommitments = fundCommitments.reduce(
      (sum, c) => sum + parseFloat(c.commitmentAmount),
      0
    );

    const concentrationRisk = parseFloat(commitment.commitmentAmount) / totalFundCommitments;
    
    // Liquidity risk based on unfunded commitment ratio
    const liquidityRisk = parseFloat(commitment.unfundedCommitment) / parseFloat(commitment.commitmentAmount);
    
    // Performance risk based on current performance vs projections
    const currentMultiple = (parseFloat(commitment.capitalReturned) + parseFloat(commitment.capitalCalled) * 1.15) / 
                           Math.max(parseFloat(commitment.capitalCalled), 1);
    const targetMultiple = 2.5;
    const performanceRisk = Math.max(0, (targetMultiple - currentMultiple) / targetMultiple);
    
    // Overall risk score (weighted average)
    const overallRiskScore = (concentrationRisk * 0.3 + liquidityRisk * 0.3 + performanceRisk * 0.4);

    return {
      concentrationRisk: parseFloat((concentrationRisk * 100).toFixed(2)),
      liquidityRisk: parseFloat((liquidityRisk * 100).toFixed(2)),
      performanceRisk: parseFloat((performanceRisk * 100).toFixed(2)),
      overallRiskScore: parseFloat((overallRiskScore * 100).toFixed(2)),
    };
  }

  /**
   * Check compliance status
   */
  private async checkComplianceStatus(commitment: any, investorEntity: any): Promise<CommitmentAnalytics['complianceStatus']> {
    // Check side letter compliance
    const sideLetterTerms = commitment.sideLetterTerms?.terms || [];
    const activeSideLetterTerms = sideLetterTerms.filter((t: any) => t.status === 'active');
    
    let sideLetterCompliance = true;
    for (const term of activeSideLetterTerms) {
      if (term.expiryDate && new Date(term.expiryDate) < new Date()) {
        sideLetterCompliance = false;
        break;
      }
    }

    return {
      kycStatus: investorEntity.kycStatus,
      amlStatus: investorEntity.amlStatus,
      accreditationStatus: investorEntity.accreditedInvestor ? 'approved' : 'pending',
      sideLetterCompliance,
      taxComplianceStatus: 'compliant', // Would be calculated based on tax requirements
    };
  }

  /**
   * Simple IRR calculation
   */
  private calculateIRR(transactions: any[], currentNAV: number): number {
    const cashFlows: Array<{ date: Date; amount: number }> = [];
    
    // Add transaction cash flows
    for (const transaction of transactions) {
      cashFlows.push({
        date: transaction.transactionDate,
        amount: transaction.type === 'capital_call' ? 
          -parseFloat(transaction.amount) : parseFloat(transaction.amount),
      });
    }

    // Add current NAV as final cash flow
    if (currentNAV > 0) {
      cashFlows.push({
        date: new Date(),
        amount: currentNAV,
      });
    }

    // Simple IRR approximation (would use more sophisticated calculation in production)
    if (cashFlows.length < 2) return 0;
    
    return 0.12; // Placeholder 12% IRR
  }

  /**
   * Get commitment workflow steps for new commitment creation
   */
  getCommitmentWorkflowSteps(): CommitmentWorkflowStep[] {
    return [
      {
        step: 1,
        name: 'Investor Information',
        description: 'Verify investor entity and class information',
        status: 'pending',
        requiredFields: ['investorEntityId', 'investorClassId'],
        validationRules: [
          {
            field: 'investorEntityId',
            rule: 'exists',
            message: 'Investor entity must exist and be approved',
          },
        ],
      },
      {
        step: 2,
        name: 'Commitment Details',
        description: 'Set commitment amount, date, and basic terms',
        status: 'pending',
        requiredFields: ['commitmentAmount', 'commitmentDate'],
        validationRules: [
          {
            field: 'commitmentAmount',
            rule: 'min:1000',
            message: 'Minimum commitment amount is $1,000',
          },
        ],
      },
      {
        step: 3,
        name: 'Side Letter Terms',
        description: 'Configure any special terms or fee overrides',
        status: 'pending',
      },
      {
        step: 4,
        name: 'Compliance Check',
        description: 'Verify KYC/AML and accreditation status',
        status: 'pending',
        validationRules: [
          {
            field: 'kycStatus',
            rule: 'equals:approved',
            message: 'KYC must be approved',
          },
          {
            field: 'amlStatus',
            rule: 'equals:approved',
            message: 'AML must be approved',
          },
        ],
      },
      {
        step: 5,
        name: 'Final Review',
        description: 'Review all details and activate commitment',
        status: 'pending',
      },
    ];
  }

  /**
   * Get commitments requiring attention
   */
  async getCommitmentsRequiringAttention(fundId?: number) {
    const whereClause: any = {};
    if (fundId) {
      whereClause.fundId = fundId;
    }

    const commitments = await Commitment.findAll({
      where: whereClause,
      include: [
        { model: InvestorEntity, as: 'investorEntity' },
        { model: Fund, as: 'fund' },
      ],
    });

    const attentionItems = [];

    for (const commitment of commitments) {
      const investorEntity = (commitment as any).investorEntity;
      
      // Check for expired KYC/AML
      if (investorEntity.kycStatus === 'expired' || investorEntity.amlStatus === 'expired') {
        attentionItems.push({
          commitmentId: commitment.id,
          investorName: investorEntity.name,
          issue: 'Expired compliance documents',
          priority: 'high',
          dueDate: null,
        });
      }

      // Check for large unfunded commitments
      const unfundedRatio = parseFloat(commitment.unfundedCommitment) / parseFloat(commitment.commitmentAmount);
      if (unfundedRatio > 0.8) {
        attentionItems.push({
          commitmentId: commitment.id,
          investorName: investorEntity.name,
          issue: 'Large unfunded commitment',
          priority: 'medium',
          dueDate: null,
        });
      }

      // Check for overdue recalculations
      const lastRecalc = commitment.metadata?.lastRecalculation?.date;
      if (!lastRecalc || new Date(lastRecalc) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        attentionItems.push({
          commitmentId: commitment.id,
          investorName: investorEntity.name,
          issue: 'Overdue recalculation',
          priority: 'low',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
    }

    return attentionItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });
  }
}

export default CommitmentWorkflowService;