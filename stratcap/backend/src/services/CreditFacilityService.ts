import { Transaction } from 'sequelize';
import { CreditFacility, CreditFacilityAttributes, CreditFacilityCreationAttributes } from '../models/CreditFacility';
import { CreditDrawdown } from '../models/CreditDrawdown';
import { CreditPaydown } from '../models/CreditPaydown';
import { BorrowingBase } from '../models/BorrowingBase';
import { Decimal } from 'decimal.js';
import { NotificationService } from './NotificationService';

export interface CreditFacilityCreateRequest {
  fundId: string;
  facilityName: string;
  lender: string;
  facilityType: 'revolving' | 'term_loan' | 'bridge' | 'subscription_line';
  totalCommitment: string;
  interestRate: string;
  rateType: 'fixed' | 'floating';
  benchmarkRate?: string;
  margin?: string;
  commitmentFeeRate?: string;
  utilizationFeeRate?: string;
  maturityDate: Date;
  effectiveDate: Date;
  borrowingBaseRequired: boolean;
  covenants?: any;
  securityInterest?: any;
  guarantors?: string[];
  keyTerms?: any;
}

export interface CreditFacilityUpdateRequest {
  facilityName?: string;
  lender?: string;
  totalCommitment?: string;
  interestRate?: string;
  rateType?: 'fixed' | 'floating';
  benchmarkRate?: string;
  margin?: string;
  commitmentFeeRate?: string;
  utilizationFeeRate?: string;
  maturityDate?: Date;
  terminationDate?: Date;
  facilityStatus?: 'active' | 'terminated' | 'matured' | 'suspended';
  borrowingBaseRequired?: boolean;
  borrowingBaseLimit?: string;
  covenants?: any;
  securityInterest?: any;
  guarantors?: string[];
  keyTerms?: any;
}

export interface FacilityUtilizationSummary {
  facilityId: string;
  facilityName: string;
  totalCommitment: Decimal;
  outstandingBalance: Decimal;
  availableAmount: Decimal;
  utilizationPercentage: Decimal;
  borrowingBaseLimit?: Decimal;
  borrowingBaseUtilization?: Decimal;
  status: string;
  maturityDate: Date;
  daysToMaturity: number;
  isOverdue: boolean;
  isNearMaturity: boolean;
}

export interface CreditMetrics {
  totalFacilities: number;
  totalCommitment: Decimal;
  totalOutstanding: Decimal;
  totalAvailable: Decimal;
  averageUtilization: Decimal;
  facilitiesByStatus: Record<string, number>;
  facilitiesByType: Record<string, number>;
  upcomingMaturities: CreditFacility[];
  overduePayments: CreditPaydown[];
  recentActivity: {
    drawdowns: CreditDrawdown[];
    paydowns: CreditPaydown[];
  };
}

export class CreditFacilityService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new credit facility
   */
  async createFacility(
    request: CreditFacilityCreateRequest,
    transaction?: Transaction
  ): Promise<CreditFacility> {
    // Calculate initial available amount
    const totalCommitment = new Decimal(request.totalCommitment);
    const availableAmount = totalCommitment; // Initially fully available

    const facilityData: CreditFacilityCreationAttributes = {
      ...request,
      outstandingBalance: '0.00',
      availableAmount: availableAmount.toString(),
      facilityStatus: 'active',
      covenants: request.covenants || {},
      securityInterest: request.securityInterest || {},
      guarantors: request.guarantors || [],
      keyTerms: request.keyTerms || {},
    };

    const facility = await CreditFacility.create(facilityData, { transaction });

    // Send notification for new facility
    await this.notificationService.sendNotification({
      type: 'credit_facility_created',
      title: 'New Credit Facility Created',
      message: `Credit facility "${request.facilityName}" has been created with ${request.lender}`,
      recipients: ['credit_team', 'fund_managers'],
      metadata: {
        facilityId: facility.id,
        fundId: request.fundId,
        totalCommitment: request.totalCommitment,
        lender: request.lender,
      },
    });

    return facility;
  }

  /**
   * Update an existing credit facility
   */
  async updateFacility(
    facilityId: string,
    updates: CreditFacilityUpdateRequest,
    transaction?: Transaction
  ): Promise<CreditFacility> {
    const facility = await this.getFacilityById(facilityId);

    // If updating total commitment, recalculate available amount
    if (updates.totalCommitment) {
      const newTotalCommitment = new Decimal(updates.totalCommitment);
      const currentOutstanding = facility.getOutstandingBalanceDecimal();
      const newAvailable = newTotalCommitment.minus(currentOutstanding);
      
      updates.availableAmount = newAvailable.toString();
    }

    await facility.update(updates, { transaction });
    await facility.reload();

    // Send notification for significant changes
    if (updates.facilityStatus || updates.totalCommitment || updates.maturityDate) {
      await this.notificationService.sendNotification({
        type: 'credit_facility_updated',
        title: 'Credit Facility Updated',
        message: `Credit facility "${facility.facilityName}" has been updated`,
        recipients: ['credit_team', 'fund_managers'],
        metadata: {
          facilityId: facility.id,
          updates: Object.keys(updates),
        },
      });
    }

    return facility;
  }

  /**
   * Get facility by ID with related data
   */
  async getFacilityById(facilityId: string): Promise<CreditFacility> {
    const facility = await CreditFacility.findByPk(facilityId);
    if (!facility) {
      throw new Error(`Credit facility with ID ${facilityId} not found`);
    }
    return facility;
  }

  /**
   * Get all facilities for a fund
   */
  async getFacilitiesByFund(fundId: string): Promise<CreditFacility[]> {
    return await CreditFacility.findAll({
      where: { fundId },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get facility utilization summary
   */
  async getFacilityUtilization(facilityId: string): Promise<FacilityUtilizationSummary> {
    const facility = await this.getFacilityById(facilityId);
    
    const totalCommitment = facility.getTotalCommitmentDecimal();
    const outstandingBalance = facility.getOutstandingBalanceDecimal();
    const availableAmount = facility.getAvailableAmountDecimal();
    const utilizationPercentage = totalCommitment.isZero() 
      ? new Decimal(0) 
      : outstandingBalance.dividedBy(totalCommitment).times(100);

    const today = new Date();
    const daysToMaturity = Math.ceil((facility.maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let borrowingBaseLimit: Decimal | undefined;
    let borrowingBaseUtilization: Decimal | undefined;

    if (facility.borrowingBaseRequired && facility.borrowingBaseLimit) {
      borrowingBaseLimit = facility.getBorrowingBaseLimitDecimal();
      borrowingBaseUtilization = borrowingBaseLimit.isZero() 
        ? new Decimal(0) 
        : outstandingBalance.dividedBy(borrowingBaseLimit).times(100);
    }

    return {
      facilityId: facility.id,
      facilityName: facility.facilityName,
      totalCommitment,
      outstandingBalance,
      availableAmount,
      utilizationPercentage,
      borrowingBaseLimit,
      borrowingBaseUtilization,
      status: facility.facilityStatus,
      maturityDate: facility.maturityDate,
      daysToMaturity,
      isOverdue: facility.isOverdue(),
      isNearMaturity: facility.isNearMaturity(),
    };
  }

  /**
   * Calculate current interest and fees for a facility
   */
  async calculateCurrentInterestAndFees(facilityId: string, asOfDate: Date = new Date()): Promise<{
    dailyInterest: Decimal;
    commitmentFee: Decimal;
    utilizationFee: Decimal;
    totalDailyFees: Decimal;
  }> {
    const facility = await this.getFacilityById(facilityId);
    
    const dailyInterest = facility.calculateDailyInterest(asOfDate);
    const commitmentFee = facility.calculateCommitmentFee(asOfDate);
    
    // Calculate utilization fee if applicable
    let utilizationFee = new Decimal(0);
    if (facility.utilizationFeeRate) {
      const outstanding = facility.getOutstandingBalanceDecimal();
      const annualRate = facility.getUtilizationFeeRateDecimal().dividedBy(100);
      const dailyRate = annualRate.dividedBy(365);
      utilizationFee = outstanding.times(dailyRate);
    }

    const totalDailyFees = dailyInterest.plus(commitmentFee).plus(utilizationFee);

    return {
      dailyInterest,
      commitmentFee,
      utilizationFee,
      totalDailyFees,
    };
  }

  /**
   * Update facility balances after drawdown
   */
  async updateBalancesAfterDrawdown(
    facilityId: string,
    drawdownAmount: Decimal,
    transaction?: Transaction
  ): Promise<void> {
    const facility = await this.getFacilityById(facilityId);
    
    const currentOutstanding = facility.getOutstandingBalanceDecimal();
    const totalCommitment = facility.getTotalCommitmentDecimal();
    
    const newOutstanding = currentOutstanding.plus(drawdownAmount);
    const newAvailable = totalCommitment.minus(newOutstanding);

    await facility.update({
      outstandingBalance: newOutstanding.toString(),
      availableAmount: newAvailable.toString(),
    }, { transaction });
  }

  /**
   * Update facility balances after paydown
   */
  async updateBalancesAfterPaydown(
    facilityId: string,
    principalAmount: Decimal,
    transaction?: Transaction
  ): Promise<void> {
    const facility = await this.getFacilityById(facilityId);
    
    const currentOutstanding = facility.getOutstandingBalanceDecimal();
    const totalCommitment = facility.getTotalCommitmentDecimal();
    
    const newOutstanding = currentOutstanding.minus(principalAmount);
    const newAvailable = totalCommitment.minus(newOutstanding);

    await facility.update({
      outstandingBalance: newOutstanding.toString(),
      availableAmount: newAvailable.toString(),
    }, { transaction });
  }

  /**
   * Update borrowing base limit
   */
  async updateBorrowingBaseLimit(
    facilityId: string,
    newLimit: Decimal,
    transaction?: Transaction
  ): Promise<void> {
    const facility = await this.getFacilityById(facilityId);
    
    await facility.update({
      borrowingBaseLimit: newLimit.toString(),
    }, { transaction });

    // Check if current outstanding exceeds new borrowing base
    const currentOutstanding = facility.getOutstandingBalanceDecimal();
    if (currentOutstanding.greaterThan(newLimit)) {
      await this.notificationService.sendNotification({
        type: 'borrowing_base_violation',
        title: 'Borrowing Base Limit Exceeded',
        message: `Facility "${facility.facilityName}" outstanding balance exceeds new borrowing base limit`,
        recipients: ['credit_team', 'risk_management'],
        metadata: {
          facilityId: facility.id,
          outstanding: currentOutstanding.toString(),
          borrowingBase: newLimit.toString(),
          excess: currentOutstanding.minus(newLimit).toString(),
        },
      });
    }
  }

  /**
   * Get credit metrics for a fund
   */
  async getCreditMetrics(fundId: string): Promise<CreditMetrics> {
    const facilities = await this.getFacilitiesByFund(fundId);
    
    const totalCommitment = facilities.reduce(
      (sum, facility) => sum.plus(facility.getTotalCommitmentDecimal()),
      new Decimal(0)
    );
    
    const totalOutstanding = facilities.reduce(
      (sum, facility) => sum.plus(facility.getOutstandingBalanceDecimal()),
      new Decimal(0)
    );
    
    const totalAvailable = facilities.reduce(
      (sum, facility) => sum.plus(facility.getAvailableAmountDecimal()),
      new Decimal(0)
    );

    const averageUtilization = totalCommitment.isZero() 
      ? new Decimal(0) 
      : totalOutstanding.dividedBy(totalCommitment).times(100);

    // Group facilities by status and type
    const facilitiesByStatus = facilities.reduce((acc, facility) => {
      acc[facility.facilityStatus] = (acc[facility.facilityStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const facilitiesByType = facilities.reduce((acc, facility) => {
      acc[facility.facilityType] = (acc[facility.facilityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get upcoming maturities (within 90 days)
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    
    const upcomingMaturities = facilities.filter(facility => 
      facility.maturityDate <= ninetyDaysFromNow && 
      facility.facilityStatus === 'active'
    );

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDrawdowns = await CreditDrawdown.findAll({
      include: [{
        model: CreditFacility,
        where: { fundId },
      }],
      where: {
        createdAt: { $gte: thirtyDaysAgo }
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    const recentPaydowns = await CreditPaydown.findAll({
      include: [{
        model: CreditFacility,
        where: { fundId },
      }],
      where: {
        createdAt: { $gte: thirtyDaysAgo }
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    // Get overdue payments
    const today = new Date();
    const overduePayments = await CreditPaydown.findAll({
      include: [{
        model: CreditFacility,
        where: { fundId },
      }],
      where: {
        status: 'pending',
        paymentDate: { $lt: today }
      },
    });

    return {
      totalFacilities: facilities.length,
      totalCommitment,
      totalOutstanding,
      totalAvailable,
      averageUtilization,
      facilitiesByStatus,
      facilitiesByType,
      upcomingMaturities,
      overduePayments,
      recentActivity: {
        drawdowns: recentDrawdowns,
        paydowns: recentPaydowns,
      },
    };
  }

  /**
   * Terminate a credit facility
   */
  async terminateFacility(
    facilityId: string,
    terminationDate: Date,
    reason?: string,
    transaction?: Transaction
  ): Promise<CreditFacility> {
    const facility = await this.getFacilityById(facilityId);
    
    // Check if facility can be terminated
    const currentOutstanding = facility.getOutstandingBalanceDecimal();
    if (currentOutstanding.greaterThan(0)) {
      throw new Error('Cannot terminate facility with outstanding balance');
    }

    await facility.update({
      facilityStatus: 'terminated',
      terminationDate,
      keyTerms: {
        ...facility.keyTerms,
        terminationReason: reason,
      },
    }, { transaction });

    await this.notificationService.sendNotification({
      type: 'credit_facility_terminated',
      title: 'Credit Facility Terminated',
      message: `Credit facility "${facility.facilityName}" has been terminated`,
      recipients: ['credit_team', 'fund_managers'],
      metadata: {
        facilityId: facility.id,
        terminationDate: terminationDate.toISOString(),
        reason,
      },
    });

    return facility;
  }

  /**
   * Get facilities requiring attention (near maturity, covenant violations, etc.)
   */
  async getFacilitiesRequiringAttention(fundId?: string): Promise<{
    nearMaturity: CreditFacility[];
    overdue: CreditFacility[];
    covenantViolations: CreditFacility[];
    borrowingBaseExceeded: CreditFacility[];
  }> {
    const whereClause = fundId ? { fundId } : {};
    const facilities = await CreditFacility.findAll({
      where: whereClause,
    });

    const nearMaturity = facilities.filter(facility => facility.isNearMaturity());
    const overdue = facilities.filter(facility => facility.isOverdue());
    
    // Note: Covenant violations and borrowing base checks would require 
    // additional logic based on specific covenant definitions
    const covenantViolations: CreditFacility[] = [];
    const borrowingBaseExceeded: CreditFacility[] = [];

    return {
      nearMaturity,
      overdue,
      covenantViolations,
      borrowingBaseExceeded,
    };
  }
}