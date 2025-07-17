import { Request, Response } from 'express';
import { Transaction } from 'sequelize';
import { CreditFacilityService, CreditFacilityCreateRequest, CreditFacilityUpdateRequest } from '../services/CreditFacilityService';
import { DrawdownService, DrawdownRequest } from '../services/DrawdownService';
import { PaydownService, PaydownRequest } from '../services/PaydownService';
import { BorrowingBaseService, BorrowingBaseRequest } from '../services/BorrowingBaseService';
import { CreditFacilityFeeService } from '../services/CreditFacilityFeeService';
import sequelize from '../db/database';

export class CreditFacilityController {
  private creditFacilityService: CreditFacilityService;
  private drawdownService: DrawdownService;
  private paydownService: PaydownService;
  private borrowingBaseService: BorrowingBaseService;
  private feeService: CreditFacilityFeeService;

  constructor() {
    this.creditFacilityService = new CreditFacilityService();
    this.drawdownService = new DrawdownService();
    this.paydownService = new PaydownService();
    this.borrowingBaseService = new BorrowingBaseService();
    this.feeService = new CreditFacilityFeeService();
  }

  /**
   * Create a new credit facility
   */
  createFacility = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const request: CreditFacilityCreateRequest = {
        fundId: req.body.fundId,
        facilityName: req.body.facilityName,
        lender: req.body.lender,
        facilityType: req.body.facilityType,
        totalCommitment: req.body.totalCommitment,
        interestRate: req.body.interestRate,
        rateType: req.body.rateType,
        benchmarkRate: req.body.benchmarkRate,
        margin: req.body.margin,
        commitmentFeeRate: req.body.commitmentFeeRate,
        utilizationFeeRate: req.body.utilizationFeeRate,
        maturityDate: new Date(req.body.maturityDate),
        effectiveDate: new Date(req.body.effectiveDate),
        borrowingBaseRequired: req.body.borrowingBaseRequired || false,
        covenants: req.body.covenants,
        securityInterest: req.body.securityInterest,
        guarantors: req.body.guarantors,
        keyTerms: req.body.keyTerms,
      };

      const facility = await this.creditFacilityService.createFacility(request, transaction);
      
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: facility,
        message: 'Credit facility created successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Update an existing credit facility
   */
  updateFacility = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const facilityId = req.params.id;
      const updates: CreditFacilityUpdateRequest = req.body;

      const facility = await this.creditFacilityService.updateFacility(facilityId, updates, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: facility,
        message: 'Credit facility updated successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get facility by ID
   */
  getFacility = async (req: Request, res: Response): Promise<void> => {
    try {
      const facilityId = req.params.id;
      const facility = await this.creditFacilityService.getFacilityById(facilityId);
      
      res.json({
        success: true,
        data: facility,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  /**
   * Get facilities by fund
   */
  getFacilitiesByFund = async (req: Request, res: Response): Promise<void> => {
    try {
      const fundId = req.params.fundId;
      const facilities = await this.creditFacilityService.getFacilitiesByFund(fundId);
      
      res.json({
        success: true,
        data: facilities,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  /**
   * Get facility utilization summary
   */
  getFacilityUtilization = async (req: Request, res: Response): Promise<void> => {
    try {
      const facilityId = req.params.id;
      const utilization = await this.creditFacilityService.getFacilityUtilization(facilityId);
      
      res.json({
        success: true,
        data: utilization,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  /**
   * Get credit metrics for a fund
   */
  getCreditMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const fundId = req.params.fundId;
      const metrics = await this.creditFacilityService.getCreditMetrics(fundId);
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  /**
   * Terminate a credit facility
   */
  terminateFacility = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const facilityId = req.params.id;
      const { terminationDate, reason } = req.body;

      const facility = await this.creditFacilityService.terminateFacility(
        facilityId,
        new Date(terminationDate),
        reason,
        transaction
      );
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: facility,
        message: 'Credit facility terminated successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  // Drawdown endpoints

  /**
   * Request a drawdown
   */
  requestDrawdown = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const request: DrawdownRequest = {
        facilityId: req.body.facilityId,
        requestedBy: req.user?.id?.toString() || '',
        drawdownAmount: req.body.drawdownAmount,
        purpose: req.body.purpose,
        priority: req.body.priority,
        requestedFundingDate: req.body.requestedFundingDate ? new Date(req.body.requestedFundingDate) : undefined,
        interestRate: req.body.interestRate,
        maturityDate: req.body.maturityDate ? new Date(req.body.maturityDate) : undefined,
        requiredDocuments: req.body.requiredDocuments,
        metadata: req.body.metadata,
      };

      const drawdown = await this.drawdownService.requestDrawdown(request, transaction);
      
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: drawdown,
        message: 'Drawdown request submitted successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Approve a drawdown
   */
  approveDrawdown = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const drawdownId = req.params.id;
      const approval = {
        drawdownId,
        approvedBy: req.user?.id?.toString() || '',
        approvalNotes: req.body.approvalNotes,
        approvedAmount: req.body.approvedAmount,
        conditions: req.body.conditions,
      };

      const drawdown = await this.drawdownService.approveDrawdown(approval, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: drawdown,
        message: 'Drawdown approved successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Fund a drawdown
   */
  fundDrawdown = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const drawdownId = req.params.id;
      const funding = {
        drawdownId,
        fundedBy: req.user?.id?.toString() || '',
        fundingReference: req.body.fundingReference,
        actualFundingDate: req.body.actualFundingDate ? new Date(req.body.actualFundingDate) : undefined,
        actualAmount: req.body.actualAmount,
      };

      const drawdown = await this.drawdownService.fundDrawdown(funding, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: drawdown,
        message: 'Drawdown funded successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get drawdowns for a facility
   */
  getDrawdowns = async (req: Request, res: Response): Promise<void> => {
    try {
      const facilityId = req.params.facilityId;
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;

      const drawdowns = await this.drawdownService.getDrawdownsByFacility(facilityId, status, limit);
      
      res.json({
        success: true,
        data: drawdowns,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  // Paydown endpoints

  /**
   * Initiate a paydown
   */
  initiatePaydown = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const request: PaydownRequest = {
        facilityId: req.body.facilityId,
        initiatedBy: req.user?.id?.toString() || '',
        paydownAmount: req.body.paydownAmount,
        paymentDate: new Date(req.body.paymentDate),
        paydownType: req.body.paydownType,
        paymentMethod: req.body.paymentMethod,
        purpose: req.body.purpose,
        principalAmount: req.body.principalAmount,
        interestAmount: req.body.interestAmount,
        feesAmount: req.body.feesAmount,
        metadata: req.body.metadata,
      };

      const paydown = await this.paydownService.initiatePaydown(request, transaction);
      
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: paydown,
        message: 'Paydown initiated successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Process a paydown
   */
  processPaydown = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const paydownId = req.params.id;
      const processing = {
        paydownId,
        processedBy: req.user?.id?.toString() || '',
        paymentReference: req.body.paymentReference,
        actualPaymentDate: req.body.actualPaymentDate ? new Date(req.body.actualPaymentDate) : undefined,
        actualAmount: req.body.actualAmount,
      };

      const paydown = await this.paydownService.processPaydown(processing, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: paydown,
        message: 'Paydown processed successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get paydowns for a facility
   */
  getPaydowns = async (req: Request, res: Response): Promise<void> => {
    try {
      const facilityId = req.params.facilityId;
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;

      const paydowns = await this.paydownService.getPaydownsByFacility(facilityId, status, limit);
      
      res.json({
        success: true,
        data: paydowns,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  // Borrowing Base endpoints

  /**
   * Create borrowing base calculation
   */
  createBorrowingBase = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const request: BorrowingBaseRequest = {
        facilityId: req.body.facilityId,
        calculatedBy: req.user?.id?.toString() || '',
        reportingDate: new Date(req.body.reportingDate),
        eligibleAssets: req.body.eligibleAssets,
        ineligibleAssets: req.body.ineligibleAssets,
        advanceRate: req.body.advanceRate,
        concentrationLimits: req.body.concentrationLimits,
        assetDetails: req.body.assetDetails,
        exceptions: req.body.exceptions,
        nextReviewDate: req.body.nextReviewDate ? new Date(req.body.nextReviewDate) : undefined,
      };

      const borrowingBase = await this.borrowingBaseService.createBorrowingBase(request, transaction);
      
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: borrowingBase,
        message: 'Borrowing base calculation created successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Submit borrowing base for approval
   */
  submitBorrowingBase = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const borrowingBaseId = req.params.id;
      const borrowingBase = await this.borrowingBaseService.submitBorrowingBase(
        borrowingBaseId,
        req.user?.id?.toString() || '',
        transaction
      );
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: borrowingBase,
        message: 'Borrowing base submitted for approval',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get borrowing base summary
   */
  getBorrowingBaseSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const borrowingBaseId = req.params.id;
      const summary = await this.borrowingBaseService.getBorrowingBaseSummary(borrowingBaseId);
      
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  // Fee endpoints

  /**
   * Calculate facility fees for a period
   */
  calculateFees = async (req: Request, res: Response): Promise<void> => {
    try {
      const facilityId = req.params.id;
      const periodStart = new Date(req.query.periodStart as string);
      const periodEnd = new Date(req.query.periodEnd as string);

      const feeCalculation = await this.feeService.calculatePeriodFees(facilityId, periodStart, periodEnd);
      
      res.json({
        success: true,
        data: feeCalculation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  /**
   * Get daily fee accruals
   */
  getDailyAccruals = async (req: Request, res: Response): Promise<void> => {
    try {
      const facilityId = req.params.id;
      const accrualDate = req.query.date ? new Date(req.query.date as string) : new Date();

      const accruals = await this.feeService.calculateDailyAccruals(facilityId, accrualDate);
      
      res.json({
        success: true,
        data: accruals,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  /**
   * Generate fee schedule
   */
  generateFeeSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const facilityId = req.params.id;
      const scheduleType = req.query.scheduleType as 'monthly' | 'quarterly' | 'annual' || 'quarterly';
      const periodsAhead = parseInt(req.query.periodsAhead as string) || 4;

      const schedule = await this.feeService.generateFeeSchedule(facilityId, scheduleType, periodsAhead);
      
      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  /**
   * Calculate effective interest rate
   */
  calculateEffectiveRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const facilityId = req.params.id;
      const periodStart = new Date(req.query.periodStart as string);
      const periodEnd = new Date(req.query.periodEnd as string);

      const rates = await this.feeService.calculateEffectiveRate(facilityId, periodStart, periodEnd);
      
      res.json({
        success: true,
        data: rates,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  /**
   * Get facilities requiring attention
   */
  getFacilitiesRequiringAttention = async (req: Request, res: Response): Promise<void> => {
    try {
      const fundId = req.query.fundId as string;
      const attention = await this.creditFacilityService.getFacilitiesRequiringAttention(fundId);
      
      res.json({
        success: true,
        data: attention,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };
}