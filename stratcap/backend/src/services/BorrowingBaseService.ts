import { Transaction } from 'sequelize';
import { BorrowingBase, BorrowingBaseCreationAttributes } from '../models/BorrowingBase';
import { CreditFacility } from '../models/CreditFacility';
import { User } from '../models/User';
import { Decimal } from 'decimal.js';
import { CreditFacilityService } from './CreditFacilityService';
import NotificationService from './NotificationService';
import ApprovalWorkflowService from './ApprovalWorkflowService';

export interface BorrowingBaseRequest {
  facilityId: string;
  calculatedBy: string;
  reportingDate: Date;
  eligibleAssets: string;
  ineligibleAssets: string;
  advanceRate: string;
  concentrationLimits?: any;
  assetDetails: any;
  exceptions?: any;
  nextReviewDate?: Date;
}

export interface BorrowingBaseApproval {
  borrowingBaseId: string;
  approvedBy: string;
  approvalNotes?: string;
  adjustments?: any;
}

export interface BorrowingBaseRejection {
  borrowingBaseId: string;
  rejectedBy: string;
  rejectionReason: string;
  requiredChanges?: string[];
}

export interface AssetEligibilityTest {
  assetId: string;
  assetType: string;
  assetValue: Decimal;
  eligibilityTests: {
    creditQuality: boolean;
    maturity: boolean;
    geographic: boolean;
    industry: boolean;
    obligor: boolean;
  };
  eligibleValue: Decimal;
  ineligibilityReasons: string[];
}

export interface ConcentrationTest {
  testType: 'industry' | 'geographic' | 'obligor' | 'rating';
  category: string;
  currentValue: Decimal;
  currentPercentage: Decimal;
  limit: Decimal;
  limitPercentage: Decimal;
  passed: boolean;
  excess?: Decimal;
}

export interface BorrowingBaseSummary {
  borrowingBaseId: string;
  facilityId: string;
  reportingDate: Date;
  status: string;
  version: number;
  totalAssets: Decimal;
  eligibleAssets: Decimal;
  ineligibleAssets: Decimal;
  advanceRate: Decimal;
  totalBorrowingBase: Decimal;
  currentUtilization: Decimal;
  utilizationPercentage: Decimal;
  availableCapacity: Decimal;
  expirationDate?: Date;
  daysUntilExpiry?: number;
  testResults: {
    eligibilityPassed: boolean;
    concentrationPassed: boolean;
    overallPassed: boolean;
  };
}

export class BorrowingBaseService {
  private creditFacilityService: CreditFacilityService;
  private notificationService: NotificationService;
  private approvalWorkflowService: ApprovalWorkflowService;

  constructor() {
    this.creditFacilityService = new CreditFacilityService();
    this.notificationService = new NotificationService();
    this.approvalWorkflowService = new ApprovalWorkflowService();
  }

  /**
   * Create a new borrowing base calculation
   */
  async createBorrowingBase(
    request: BorrowingBaseRequest,
    transaction?: Transaction
  ): Promise<BorrowingBase> {
    const facility = await this.creditFacilityService.getFacilityById(request.facilityId);
    
    if (!facility.borrowingBaseRequired) {
      throw new Error('Facility does not require borrowing base calculations');
    }

    // Calculate total borrowing base
    const eligibleAssets = new Decimal(request.eligibleAssets);
    const advanceRate = new Decimal(request.advanceRate);
    const totalBorrowingBase = eligibleAssets.times(advanceRate.dividedBy(100));

    // Get next version number
    const latestVersion = await this.getLatestVersion(request.facilityId);
    const version = latestVersion + 1;

    // Run eligibility tests
    const eligibilityTests = await this.runEligibilityTests(request.assetDetails);
    
    // Run concentration tests
    const concentrationTests = await this.runConcentrationTests(
      request.assetDetails,
      request.concentrationLimits || {}
    );

    // Calculate next review date if not provided
    const nextReviewDate = request.nextReviewDate || this.calculateNextReviewDate(request.reportingDate);

    const borrowingBaseData: BorrowingBaseCreationAttributes = {
      facilityId: request.facilityId,
      calculatedBy: request.calculatedBy,
      reportingDate: request.reportingDate,
      calculationDate: new Date(),
      totalBorrowingBase: totalBorrowingBase.toString(),
      eligibleAssets: request.eligibleAssets,
      ineligibleAssets: request.ineligibleAssets,
      advanceRate: request.advanceRate,
      concentrationLimits: request.concentrationLimits || {},
      eligibilityTests,
      concentrationTests,
      status: 'draft',
      version,
      nextReviewDate,
      assetDetails: request.assetDetails,
      exceptions: request.exceptions || {},
      complianceChecks: {},
      certifications: {},
      documents: [],
      auditTrail: {
        created: {
          by: request.calculatedBy,
          date: new Date(),
          version,
        },
      },
      notifications: {},
      metadata: {},
    };

    const borrowingBase = await BorrowingBase.create(borrowingBaseData, { transaction });

    // Send notification
    await this.notificationService.sendSimpleNotification({
      type: 'borrowing_base_created',
      title: 'New Borrowing Base Calculation',
      message: `Borrowing base calculation created for facility "${facility.facilityName}"`,
      recipients: ['credit_team', 'risk_management'],
      metadata: {
        borrowingBaseId: borrowingBase.id,
        facilityId: request.facilityId,
        reportingDate: request.reportingDate.toISOString(),
        totalBorrowingBase: totalBorrowingBase.toString(),
      },
    });

    return borrowingBase;
  }

  /**
   * Submit borrowing base for approval
   */
  async submitBorrowingBase(
    borrowingBaseId: string,
    submittedBy: string,
    transaction?: Transaction
  ): Promise<BorrowingBase> {
    const borrowingBase = await this.getBorrowingBaseById(borrowingBaseId);
    
    if (!borrowingBase.canSubmit()) {
      throw new Error('Borrowing base cannot be submitted in current status');
    }

    await borrowingBase.update({
      status: 'submitted',
      auditTrail: {
        ...borrowingBase.auditTrail,
        submitted: {
          by: submittedBy,
          date: new Date(),
        },
      },
    }, { transaction });

    // Start approval workflow
    await this.approvalWorkflowService.startWorkflow({
      workflowType: 'borrowing_base',
      entityId: borrowingBase.id,
      requestedBy: submittedBy,
      metadata: {
        facilityId: borrowingBase.facilityId,
        reportingDate: borrowingBase.reportingDate.toISOString(),
        totalBorrowingBase: borrowingBase.totalBorrowingBase,
      },
    });

    // Send notifications
    await this.notificationService.sendSimpleNotification({
      type: 'borrowing_base_submitted',
      title: 'Borrowing Base Submitted for Approval',
      message: `Borrowing base calculation submitted for approval`,
      recipients: ['credit_committee', 'senior_management'],
      metadata: {
        borrowingBaseId: borrowingBase.id,
        facilityId: borrowingBase.facilityId,
        submittedBy,
      },
    });

    return borrowingBase;
  }

  /**
   * Approve borrowing base
   */
  async approveBorrowingBase(
    approval: BorrowingBaseApproval,
    transaction?: Transaction
  ): Promise<BorrowingBase> {
    const borrowingBase = await this.getBorrowingBaseById(approval.borrowingBaseId);
    
    if (!borrowingBase.canApprove()) {
      throw new Error('Borrowing base cannot be approved in current status');
    }

    await borrowingBase.update({
      status: 'approved',
      approvedBy: approval.approvedBy,
      approvalDate: new Date(),
      auditTrail: {
        ...borrowingBase.auditTrail,
        approved: {
          by: approval.approvedBy,
          date: new Date(),
          notes: approval.approvalNotes,
          adjustments: approval.adjustments,
        },
      },
    }, { transaction });

    // Update facility borrowing base limit
    const newLimit = borrowingBase.getTotalBorrowingBaseDecimal();
    await this.creditFacilityService.updateBorrowingBaseLimit(
      borrowingBase.facilityId,
      newLimit,
      transaction
    );

    // Expire previous borrowing base versions
    await this.expirePreviousVersions(borrowingBase.facilityId, borrowingBase.id, transaction);

    // Complete approval workflow
    await this.approvalWorkflowService.completeWorkflow(borrowingBase.id, {
      approvedBy: approval.approvedBy,
      status: 'approved',
      notes: approval.approvalNotes,
    });

    // Send notifications
    await this.notificationService.sendSimpleNotification({
      type: 'borrowing_base_approved',
      title: 'Borrowing Base Approved',
      message: `Borrowing base calculation has been approved`,
      recipients: ['credit_team', 'fund_managers', borrowingBase.calculatedBy],
      metadata: {
        borrowingBaseId: borrowingBase.id,
        facilityId: borrowingBase.facilityId,
        approvedAmount: borrowingBase.totalBorrowingBase,
        approvedBy: approval.approvedBy,
      },
    });

    return borrowingBase;
  }

  /**
   * Reject borrowing base
   */
  async rejectBorrowingBase(
    rejection: BorrowingBaseRejection,
    transaction?: Transaction
  ): Promise<BorrowingBase> {
    const borrowingBase = await this.getBorrowingBaseById(rejection.borrowingBaseId);
    
    if (!borrowingBase.canReject()) {
      throw new Error('Borrowing base cannot be rejected in current status');
    }

    await borrowingBase.update({
      status: 'rejected',
      auditTrail: {
        ...borrowingBase.auditTrail,
        rejected: {
          by: rejection.rejectedBy,
          date: new Date(),
          reason: rejection.rejectionReason,
          requiredChanges: rejection.requiredChanges,
        },
      },
    }, { transaction });

    // Complete approval workflow
    await this.approvalWorkflowService.completeWorkflow(borrowingBase.id, {
      approvedBy: rejection.rejectedBy,
      status: 'rejected',
      notes: rejection.rejectionReason,
    });

    // Send notifications
    await this.notificationService.sendSimpleNotification({
      type: 'borrowing_base_rejected',
      title: 'Borrowing Base Rejected',
      message: `Borrowing base calculation has been rejected`,
      recipients: ['credit_team', borrowingBase.calculatedBy],
      metadata: {
        borrowingBaseId: borrowingBase.id,
        facilityId: borrowingBase.facilityId,
        rejectionReason: rejection.rejectionReason,
        rejectedBy: rejection.rejectedBy,
      },
    });

    return borrowingBase;
  }

  /**
   * Get borrowing base by ID
   */
  async getBorrowingBaseById(borrowingBaseId: string): Promise<BorrowingBase> {
    const borrowingBase = await BorrowingBase.findByPk(borrowingBaseId, {
      include: [
        { model: CreditFacility, as: 'facility' },
        { model: User, as: 'calculatedByUser' },
        { model: User, as: 'approvedByUser' },
      ],
    });
    
    if (!borrowingBase) {
      throw new Error(`Borrowing base with ID ${borrowingBaseId} not found`);
    }
    
    return borrowingBase;
  }

  /**
   * Get current active borrowing base for facility
   */
  async getCurrentBorrowingBase(facilityId: string): Promise<BorrowingBase | null> {
    return await BorrowingBase.findOne({
      where: {
        facilityId,
        status: 'approved',
      },
      order: [['reportingDate', 'DESC']],
    });
  }

  /**
   * Get borrowing base history for facility
   */
  async getBorrowingBaseHistory(
    facilityId: string,
    limit: number = 20
  ): Promise<BorrowingBase[]> {
    return await BorrowingBase.findAll({
      where: { facilityId },
      order: [['reportingDate', 'DESC']],
      limit,
      include: [
        { model: User, as: 'calculatedByUser' },
        { model: User, as: 'approvedByUser' },
      ],
    });
  }

  /**
   * Get borrowing base summary
   */
  async getBorrowingBaseSummary(borrowingBaseId: string): Promise<BorrowingBaseSummary> {
    const borrowingBase = await this.getBorrowingBaseById(borrowingBaseId);
    const facility = await this.creditFacilityService.getFacilityById(borrowingBase.facilityId);
    
    const totalAssets = borrowingBase.getEligibleAssetsDecimal().plus(borrowingBase.getIneligibleAssetsDecimal());
    const currentUtilization = facility.getOutstandingBalanceDecimal();
    const totalBorrowingBase = borrowingBase.getTotalBorrowingBaseDecimal();
    
    const utilizationPercentage = totalBorrowingBase.isZero() 
      ? new Decimal(0) 
      : currentUtilization.dividedBy(totalBorrowingBase).times(100);
    
    const availableCapacity = totalBorrowingBase.minus(currentUtilization);

    return {
      borrowingBaseId: borrowingBase.id,
      facilityId: borrowingBase.facilityId,
      reportingDate: borrowingBase.reportingDate,
      status: borrowingBase.status,
      version: borrowingBase.version,
      totalAssets,
      eligibleAssets: borrowingBase.getEligibleAssetsDecimal(),
      ineligibleAssets: borrowingBase.getIneligibleAssetsDecimal(),
      advanceRate: borrowingBase.getAdvanceRateDecimal(),
      totalBorrowingBase,
      currentUtilization,
      utilizationPercentage,
      availableCapacity,
      expirationDate: borrowingBase.nextReviewDate,
      daysUntilExpiry: borrowingBase.getDaysUntilExpiry() ?? undefined,
      testResults: {
        eligibilityPassed: borrowingBase.passesEligibilityTests(),
        concentrationPassed: borrowingBase.passesConcentrationTests(),
        overallPassed: borrowingBase.passesAllTests(),
      },
    };
  }

  /**
   * Run asset eligibility tests
   */
  private async runEligibilityTests(assetDetails: any): Promise<any> {
    const tests: any = {};
    
    // Credit quality test
    tests.credit_quality = this.testCreditQuality(assetDetails);
    
    // Asset type test
    tests.asset_type = this.testAssetType(assetDetails);
    
    // Maturity test
    tests.maturity = this.testMaturity(assetDetails);
    
    // Geographic test
    tests.geographic = this.testGeographic(assetDetails);
    
    return tests;
  }

  /**
   * Run concentration tests
   */
  private async runConcentrationTests(
    assetDetails: any,
    concentrationLimits: any
  ): Promise<ConcentrationTest[]> {
    const tests: ConcentrationTest[] = [];
    
    // Industry concentration test
    if (concentrationLimits.industryLimit && assetDetails.byIndustry) {
      for (const [industry, value] of Object.entries(assetDetails.byIndustry)) {
        const currentValue = new Decimal(value as string);
        const totalEligible = new Decimal(assetDetails.totalEligible || 0);
        const percentage = totalEligible.isZero() ? new Decimal(0) : currentValue.dividedBy(totalEligible).times(100);
        const limit = new Decimal(concentrationLimits.industryLimit);
        
        tests.push({
          testType: 'industry',
          category: industry,
          currentValue,
          currentPercentage: percentage,
          limit: currentValue,
          limitPercentage: limit,
          passed: percentage.lessThanOrEqualTo(limit),
          excess: percentage.greaterThan(limit) ? percentage.minus(limit) : undefined,
        });
      }
    }
    
    // Geographic concentration test
    if (concentrationLimits.geographicLimit && assetDetails.byGeography) {
      for (const [region, value] of Object.entries(assetDetails.byGeography)) {
        const currentValue = new Decimal(value as string);
        const totalEligible = new Decimal(assetDetails.totalEligible || 0);
        const percentage = totalEligible.isZero() ? new Decimal(0) : currentValue.dividedBy(totalEligible).times(100);
        const limit = new Decimal(concentrationLimits.geographicLimit);
        
        tests.push({
          testType: 'geographic',
          category: region,
          currentValue,
          currentPercentage: percentage,
          limit: currentValue,
          limitPercentage: limit,
          passed: percentage.lessThanOrEqualTo(limit),
          excess: percentage.greaterThan(limit) ? percentage.minus(limit) : undefined,
        });
      }
    }
    
    return tests;
  }

  /**
   * Test credit quality eligibility
   */
  private testCreditQuality(assetDetails: any): boolean {
    // Simplified credit quality test
    const minimumRating = 'BB-';
    const assets = assetDetails.assets || [];
    
    return assets.every((asset: any) => {
      const rating = asset.creditRating || 'NR';
      return this.isRatingAcceptable(rating, minimumRating);
    });
  }

  /**
   * Test asset type eligibility
   */
  private testAssetType(assetDetails: any): boolean {
    const eligibleTypes = ['corporate_loan', 'bond', 'note'];
    const assets = assetDetails.assets || [];
    
    return assets.every((asset: any) => {
      return eligibleTypes.includes(asset.assetType);
    });
  }

  /**
   * Test maturity eligibility
   */
  private testMaturity(assetDetails: any): boolean {
    const maxMaturityYears = 7;
    const assets = assetDetails.assets || [];
    const today = new Date();
    
    return assets.every((asset: any) => {
      if (!asset.maturityDate) return false;
      
      const maturityDate = new Date(asset.maturityDate);
      const yearsToMaturity = (maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 365);
      
      return yearsToMaturity <= maxMaturityYears;
    });
  }

  /**
   * Test geographic eligibility
   */
  private testGeographic(assetDetails: any): boolean {
    const eligibleCountries = ['US', 'CA', 'GB', 'DE', 'FR'];
    const assets = assetDetails.assets || [];
    
    return assets.every((asset: any) => {
      return eligibleCountries.includes(asset.country);
    });
  }

  /**
   * Check if credit rating is acceptable
   */
  private isRatingAcceptable(rating: string, minimumRating: string): boolean {
    const ratingOrder = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'];
    
    const currentIndex = ratingOrder.indexOf(rating);
    const minimumIndex = ratingOrder.indexOf(minimumRating);
    
    return currentIndex !== -1 && minimumIndex !== -1 && currentIndex <= minimumIndex;
  }

  /**
   * Get latest version number for facility
   */
  private async getLatestVersion(facilityId: string): Promise<number> {
    const latest = await BorrowingBase.findOne({
      where: { facilityId },
      order: [['version', 'DESC']],
    });
    
    return latest ? latest.version : 0;
  }

  /**
   * Calculate next review date
   */
  private calculateNextReviewDate(reportingDate: Date): Date {
    const nextReview = new Date(reportingDate);
    nextReview.setMonth(nextReview.getMonth() + 3); // Quarterly review
    return nextReview;
  }

  /**
   * Expire previous borrowing base versions
   */
  private async expirePreviousVersions(
    facilityId: string,
    excludeId: string,
    transaction?: Transaction
  ): Promise<void> {
    await BorrowingBase.update(
      { status: 'expired' },
      {
        where: {
          facilityId,
          status: 'approved',
          id: { $ne: excludeId },
        },
        transaction,
      }
    );
  }

  /**
   * Get expired borrowing bases requiring update
   */
  async getExpiredBorrowingBases(): Promise<BorrowingBase[]> {
    const today = new Date();
    
    return await BorrowingBase.findAll({
      where: {
        status: 'approved',
        nextReviewDate: { $lt: today },
      },
      include: [
        { model: CreditFacility, as: 'facility' },
      ],
    });
  }
}