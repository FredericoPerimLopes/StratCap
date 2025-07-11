import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { 
  Fund, 
  FundFamily, 
  Commitment, 
  Transaction, 
  InvestorEntity, 
  CapitalActivity,
  InvestorClass,
  FeeCalculation,
  WaterfallCalculation
} from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import PerformanceAnalyticsService from '../services/PerformanceAnalyticsService';
import CashFlowAnalyticsService from '../services/CashFlowAnalyticsService';
import ExportService from '../services/ExportService';

export class ReportController {
  async getFundPerformanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { startDate, endDate } = req.query;

      const fund = await Fund.findByPk(fundId, {
        include: [
          {
            model: FundFamily,
            as: 'fundFamily'
          }
        ]
      });

      if (!fund) {
        throw new AppError('Fund not found', 404);
      }

      // Get all active commitments for the fund
      const commitments = await Commitment.findAll({
        where: { 
          fundId,
          status: 'active'
        },
        include: [
          {
            model: InvestorEntity,
            as: 'investorEntity'
          }
        ]
      });

      // Get transactions within the date range
      const whereClause: any = { fundId };
      if (startDate && endDate) {
        whereClause.transactionDate = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }

      const transactions = await Transaction.findAll({
        where: whereClause,
        include: [
          {
            model: Commitment,
            as: 'commitment',
            include: [
              {
                model: InvestorEntity,
                as: 'investorEntity'
              }
            ]
          }
        ],
        order: [['transactionDate', 'asc']]
      });

      // Calculate fund metrics
      const fundMetrics = this.calculateFundMetrics(commitments, transactions);

      // Generate investor performance
      const investorPerformance = this.calculateInvestorPerformance(commitments, transactions);

      // Generate cash flow analysis
      const cashFlowAnalysis = this.generateCashFlowAnalysis(transactions);

      const report = {
        fund: {
          id: fund.id,
          name: fund.name,
          code: fund.code,
          vintage: fund.vintage,
          status: fund.status,
          fundFamily: fund.fundFamily?.name
        },
        reportPeriod: {
          startDate: startDate || 'inception',
          endDate: endDate || new Date().toISOString().split('T')[0]
        },
        fundMetrics,
        investorPerformance,
        cashFlowAnalysis,
        generatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvestorPortfolioReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { investorId } = req.params;
      const { asOfDate } = req.query;

      const investor = await InvestorEntity.findByPk(investorId);
      if (!investor) {
        throw new AppError('Investor not found', 404);
      }

      const commitments = await Commitment.findAll({
        where: { 
          investorEntityId: investorId,
          status: 'active'
        },
        include: [
          {
            model: Fund,
            as: 'fund',
            include: [
              {
                model: FundFamily,
                as: 'fundFamily'
              }
            ]
          }
        ]
      });

      // Get transactions up to the as-of date
      const whereClause: any = { 
        commitmentId: { 
          [Op.in]: commitments.map(c => c.id) 
        }
      };
      
      if (asOfDate) {
        whereClause.transactionDate = {
          [Op.lte]: new Date(asOfDate as string)
        };
      }

      const transactions = await Transaction.findAll({
        where: whereClause,
        include: [
          {
            model: Commitment,
            as: 'commitment'
          }
        ]
      });

      // Calculate portfolio metrics by fund
      const portfolioByFund = commitments.map(commitment => {
        const fundTransactions = transactions.filter(t => t.commitmentId === commitment.id);
        const metrics = this.calculateCommitmentMetrics(commitment, fundTransactions);
        
        return {
          fund: {
            id: commitment.fund.id,
            name: commitment.fund.name,
            code: commitment.fund.code,
            vintage: commitment.fund.vintage,
            fundFamily: commitment.fund.fundFamily?.name
          },
          commitment: {
            id: commitment.id,
            amount: commitment.commitmentAmount,
            date: commitment.commitmentDate
          },
          metrics
        };
      });

      // Calculate overall portfolio metrics
      const overallMetrics = this.calculatePortfolioMetrics(commitments, transactions);

      const report = {
        investor: {
          id: investor.id,
          name: investor.name,
          legalName: investor.legalName,
          type: investor.type
        },
        asOfDate: asOfDate || new Date().toISOString().split('T')[0],
        overallMetrics,
        portfolioByFund,
        generatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCapitalActivityReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        fundId,
        startDate,
        endDate,
        eventType
      } = req.query;

      const whereClause: any = {};

      if (fundId) {
        whereClause.fundId = fundId;
      }

      if (eventType) {
        whereClause.eventType = eventType;
      }

      if (startDate && endDate) {
        whereClause.eventDate = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }

      const capitalActivities = await CapitalActivity.findAll({
        where: whereClause,
        include: [
          {
            model: Fund,
            as: 'fund',
            include: [
              {
                model: FundFamily,
                as: 'fundFamily'
              }
            ]
          }
        ],
        order: [['eventDate', 'desc']]
      });

      // Get related transactions for each capital activity
      const activitiesWithTransactions = await Promise.all(
        capitalActivities.map(async (activity) => {
          const transactions = await Transaction.findAll({
            where: { capitalActivityId: activity.id },
            include: [
              {
                model: Commitment,
                as: 'commitment',
                include: [
                  {
                    model: InvestorEntity,
                    as: 'investorEntity'
                  }
                ]
              }
            ]
          });

          const transactionSummary = transactions.reduce((acc, transaction) => {
            const amount = parseFloat(transaction.amount);
            acc.totalAmount += amount;
            acc.transactionCount += 1;

            if (!acc.byType[transaction.transactionType]) {
              acc.byType[transaction.transactionType] = 0;
            }
            acc.byType[transaction.transactionType] += amount;

            return acc;
          }, {
            totalAmount: 0,
            transactionCount: 0,
            byType: {} as Record<string, number>
          });

          return {
            capitalActivity: activity,
            transactionSummary,
            transactions: transactions.map(t => ({
              id: t.id,
              amount: t.amount,
              investor: t.commitment?.investorEntity?.name,
              transactionType: t.transactionType
            }))
          };
        })
      );

      // Calculate overall summary
      const overallSummary = activitiesWithTransactions.reduce((acc, item) => {
        const totalAmount = parseFloat(item.capitalActivity.totalAmount);
        acc.totalAmount += totalAmount;
        acc.activityCount += 1;

        if (!acc.byEventType[item.capitalActivity.eventType]) {
          acc.byEventType[item.capitalActivity.eventType] = {
            count: 0,
            amount: 0
          };
        }
        acc.byEventType[item.capitalActivity.eventType].count += 1;
        acc.byEventType[item.capitalActivity.eventType].amount += totalAmount;

        return acc;
      }, {
        totalAmount: 0,
        activityCount: 0,
        byEventType: {} as Record<string, { count: number; amount: number }>
      });

      const report = {
        filters: {
          fundId,
          startDate,
          endDate,
          eventType
        },
        overallSummary,
        capitalActivities: activitiesWithTransactions,
        generatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCommitmentReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        fundId,
        investorId,
        status,
        asOfDate
      } = req.query;

      const whereClause: any = {};

      if (fundId) {
        whereClause.fundId = fundId;
      }

      if (investorId) {
        whereClause.investorEntityId = investorId;
      }

      if (status) {
        whereClause.status = status;
      }

      const commitments = await Commitment.findAll({
        where: whereClause,
        include: [
          {
            model: Fund,
            as: 'fund',
            include: [
              {
                model: FundFamily,
                as: 'fundFamily'
              }
            ]
          },
          {
            model: InvestorEntity,
            as: 'investorEntity'
          },
          {
            model: InvestorClass,
            as: 'investorClass'
          }
        ]
      });

      // Get transactions for all commitments up to as-of date
      const transactionWhereClause: any = {
        commitmentId: { [Op.in]: commitments.map(c => c.id) }
      };
      
      if (asOfDate) {
        transactionWhereClause.transactionDate = {
          [Op.lte]: new Date(asOfDate as string)
        };
      }

      const transactions = await Transaction.findAll({
        where: transactionWhereClause
      });

      // Generate commitment details with calculated metrics
      const commitmentDetails = commitments.map(commitment => {
        const commitmentTransactions = transactions.filter(t => t.commitmentId === commitment.id);
        const metrics = this.calculateCommitmentMetrics(commitment, commitmentTransactions);

        return {
          commitment: {
            id: commitment.id,
            amount: commitment.commitmentAmount,
            date: commitment.commitmentDate,
            status: commitment.status
          },
          fund: {
            id: commitment.fund.id,
            name: commitment.fund.name,
            code: commitment.fund.code,
            vintage: commitment.fund.vintage,
            fundFamily: commitment.fund.fundFamily?.name
          },
          investor: {
            id: commitment.investorEntity.id,
            name: commitment.investorEntity.name,
            type: commitment.investorEntity.type
          },
          investorClass: {
            id: commitment.investorClass?.id,
            name: commitment.investorClass?.name
          },
          metrics
        };
      });

      // Calculate summary statistics
      const summary = commitmentDetails.reduce((acc, detail) => {
        acc.totalCommitments += parseFloat(detail.commitment.amount);
        acc.totalCalled += parseFloat(detail.metrics.capitalCalled);
        acc.totalReturned += parseFloat(detail.metrics.capitalReturned);
        acc.totalUnfunded += parseFloat(detail.metrics.unfundedCommitment);
        acc.commitmentCount += 1;

        // Group by status
        if (!acc.byStatus[detail.commitment.status]) {
          acc.byStatus[detail.commitment.status] = {
            count: 0,
            amount: 0
          };
        }
        acc.byStatus[detail.commitment.status].count += 1;
        acc.byStatus[detail.commitment.status].amount += parseFloat(detail.commitment.amount);

        return acc;
      }, {
        totalCommitments: 0,
        totalCalled: 0,
        totalReturned: 0,
        totalUnfunded: 0,
        commitmentCount: 0,
        byStatus: {} as Record<string, { count: number; amount: number }>
      });

      const report = {
        filters: {
          fundId,
          investorId,
          status,
          asOfDate
        },
        summary,
        commitments: commitmentDetails,
        generatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get total fund count and AUM
      const fundStats = await Fund.findAll({
        attributes: ['status'],
        include: [
          {
            model: Commitment,
            as: 'commitments',
            where: { status: 'active' },
            required: false
          }
        ]
      });

      const fundMetrics = fundStats.reduce((acc, fund) => {
        acc.totalFunds += 1;
        acc.byStatus[fund.status] = (acc.byStatus[fund.status] || 0) + 1;
        
        if (fund.commitments) {
          fund.commitments.forEach((commitment: any) => {
            acc.totalAUM += parseFloat(commitment.commitmentAmount || '0');
          });
        }

        return acc;
      }, {
        totalFunds: 0,
        totalAUM: 0,
        byStatus: {} as Record<string, number>
      });

      // Get investor metrics
      const investorStats = await InvestorEntity.findAll({
        attributes: ['type', 'kycStatus', 'amlStatus']
      });

      const investorMetrics = investorStats.reduce((acc, investor) => {
        acc.totalInvestors += 1;
        acc.byType[investor.type] = (acc.byType[investor.type] || 0) + 1;
        acc.byKycStatus[investor.kycStatus] = (acc.byKycStatus[investor.kycStatus] || 0) + 1;
        acc.byAmlStatus[investor.amlStatus] = (acc.byAmlStatus[investor.amlStatus] || 0) + 1;

        return acc;
      }, {
        totalInvestors: 0,
        byType: {} as Record<string, number>,
        byKycStatus: {} as Record<string, number>,
        byAmlStatus: {} as Record<string, number>
      });

      // Get recent transactions
      const recentTransactions = await Transaction.findAll({
        where: {
          transactionDate: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        include: [
          {
            model: Fund,
            as: 'fund'
          },
          {
            model: Commitment,
            as: 'commitment',
            include: [
              {
                model: InvestorEntity,
                as: 'investorEntity'
              }
            ]
          }
        ],
        order: [['transactionDate', 'desc']],
        limit: 10
      });

      // Get pending capital activities
      const pendingCapitalActivities = await CapitalActivity.findAll({
        where: {
          eventDate: {
            [Op.gte]: new Date()
          }
        },
        include: [
          {
            model: Fund,
            as: 'fund'
          }
        ],
        order: [['eventDate', 'asc']],
        limit: 5
      });

      const dashboard = {
        fundMetrics,
        investorMetrics,
        recentActivity: {
          transactions: recentTransactions.map(t => ({
            id: t.id,
            date: t.transactionDate,
            type: t.transactionType,
            amount: t.amount,
            fund: t.fund?.name,
            investor: t.commitment?.investorEntity?.name
          }))
        },
        upcomingActivities: {
          capitalActivities: pendingCapitalActivities.map(ca => ({
            id: ca.id,
            eventType: ca.eventType,
            eventDate: ca.eventDate,
            description: ca.description,
            fund: ca.fund?.name,
            totalAmount: ca.totalAmount
          }))
        },
        generatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }

  private calculateFundMetrics(commitments: any[], transactions: any[]) {
    const totalCommitments = commitments.reduce((sum, c) => sum + parseFloat(c.commitmentAmount), 0);
    
    const transactionMetrics = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      switch (transaction.transactionType) {
        case 'capital_call':
          acc.totalCalls += amount;
          break;
        case 'distribution':
          acc.totalDistributions += amount;
          break;
        case 'fee':
          acc.totalFees += amount;
          break;
      }
      
      return acc;
    }, {
      totalCalls: 0,
      totalDistributions: 0,
      totalFees: 0
    });

    return {
      totalCommitments: totalCommitments.toString(),
      ...transactionMetrics,
      callRate: totalCommitments > 0 ? (transactionMetrics.totalCalls / totalCommitments) : 0,
      multiple: transactionMetrics.totalCalls > 0 ? (transactionMetrics.totalDistributions / transactionMetrics.totalCalls) : 0,
      netCashFlow: (transactionMetrics.totalDistributions - transactionMetrics.totalCalls).toString()
    };
  }

  private calculateInvestorPerformance(commitments: any[], transactions: any[]) {
    const investorMap = new Map();
    
    // Group by investor
    commitments.forEach(commitment => {
      const investorId = commitment.investorEntityId;
      if (!investorMap.has(investorId)) {
        investorMap.set(investorId, {
          investor: commitment.investorEntity,
          commitments: [],
          transactions: []
        });
      }
      investorMap.get(investorId).commitments.push(commitment);
    });

    // Add transactions
    transactions.forEach(transaction => {
      const investorId = transaction.commitment.investorEntityId;
      if (investorMap.has(investorId)) {
        investorMap.get(investorId).transactions.push(transaction);
      }
    });

    // Calculate metrics for each investor
    return Array.from(investorMap.values()).map(investorData => {
      const metrics = this.calculatePortfolioMetrics(investorData.commitments, investorData.transactions);
      
      return {
        investor: {
          id: investorData.investor.id,
          name: investorData.investor.name,
          type: investorData.investor.type
        },
        metrics
      };
    });
  }

  private generateCashFlowAnalysis(transactions: any[]) {
    const monthlyFlow = new Map();
    
    transactions.forEach(transaction => {
      const month = transaction.transactionDate.toISOString().slice(0, 7);
      const amount = parseFloat(transaction.amount);
      
      if (!monthlyFlow.has(month)) {
        monthlyFlow.set(month, {
          calls: 0,
          distributions: 0,
          net: 0
        });
      }
      
      const monthData = monthlyFlow.get(month);
      
      if (transaction.transactionType === 'capital_call') {
        monthData.calls += amount;
      } else if (transaction.transactionType === 'distribution') {
        monthData.distributions += amount;
      }
      
      monthData.net = monthData.distributions - monthData.calls;
    });

    return Array.from(monthlyFlow.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateCommitmentMetrics(commitment: any, transactions: any[]) {
    const metrics = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      switch (transaction.transactionType) {
        case 'capital_call':
          acc.capitalCalled += amount;
          break;
        case 'distribution':
          acc.capitalReturned += amount;
          break;
      }
      
      return acc;
    }, {
      capitalCalled: 0,
      capitalReturned: 0
    });

    const commitmentAmount = parseFloat(commitment.commitmentAmount);
    const unfundedCommitment = Math.max(0, commitmentAmount - metrics.capitalCalled);

    return {
      capitalCalled: metrics.capitalCalled.toString(),
      capitalReturned: metrics.capitalReturned.toString(),
      unfundedCommitment: unfundedCommitment.toString(),
      callRate: commitmentAmount > 0 ? (metrics.capitalCalled / commitmentAmount) : 0,
      multiple: metrics.capitalCalled > 0 ? (metrics.capitalReturned / metrics.capitalCalled) : 0,
      netCashFlow: (metrics.capitalReturned - metrics.capitalCalled).toString()
    };
  }

  private calculatePortfolioMetrics(commitments: any[], transactions: any[]) {
    const totalCommitments = commitments.reduce((sum, c) => sum + parseFloat(c.commitmentAmount), 0);
    
    const transactionMetrics = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      switch (transaction.transactionType) {
        case 'capital_call':
          acc.totalCalls += amount;
          break;
        case 'distribution':
          acc.totalDistributions += amount;
          break;
      }
      
      return acc;
    }, {
      totalCalls: 0,
      totalDistributions: 0
    });

    return {
      totalCommitments: totalCommitments.toString(),
      totalCalled: transactionMetrics.totalCalls.toString(),
      totalReturned: transactionMetrics.totalDistributions.toString(),
      totalUnfunded: (totalCommitments - transactionMetrics.totalCalls).toString(),
      callRate: totalCommitments > 0 ? (transactionMetrics.totalCalls / totalCommitments) : 0,
      multiple: transactionMetrics.totalCalls > 0 ? (transactionMetrics.totalDistributions / transactionMetrics.totalCalls) : 0,
      netCashFlow: (transactionMetrics.totalDistributions - transactionMetrics.totalCalls).toString()
    };
  }

  /**
   * Get comprehensive fund analytics report
   */
  async getComprehensiveFundReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { asOfDate, includeProjections } = req.query;

      const asOf = asOfDate ? new Date(asOfDate as string) : new Date();
      const includeProj = includeProjections !== 'false';

      // Get enhanced performance metrics
      const performanceMetrics = await PerformanceAnalyticsService.calculateFundPerformance(
        fundId,
        asOf,
        true
      );

      // Get cash flow analysis
      const cashFlowAnalysis = await CashFlowAnalyticsService.analyzeFundCashFlows(
        fundId,
        undefined,
        asOf,
        includeProj
      );

      // Get benchmark comparison
      const benchmarkComparison = await PerformanceAnalyticsService.compareToBenchmark(
        fundId,
        'sp500',
        undefined,
        asOf
      );

      // Get rolling performance
      const rollingPerformance = await PerformanceAnalyticsService.calculateRollingPerformance(
        fundId,
        12,
        asOf
      );

      // Get basic fund information
      const fund = await Fund.findByPk(fundId, {
        include: [{ model: FundFamily, as: 'fundFamily' }]
      });

      if (!fund) {
        throw new AppError('Fund not found', 404);
      }

      const report = {
        fund: {
          id: fund.id,
          name: fund.name,
          code: fund.code,
          vintage: fund.vintage,
          status: fund.status,
          fundFamily: fund.fundFamily?.name
        },
        asOfDate: asOf.toISOString(),
        performanceMetrics,
        cashFlowAnalysis,
        benchmarkComparison,
        rollingPerformance,
        generatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fund family consolidation report
   */
  async getFundFamilyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundFamilyId } = req.params;
      const { asOfDate } = req.query;

      const asOf = asOfDate ? new Date(asOfDate as string) : new Date();

      const fundFamily = await FundFamily.findByPk(fundFamilyId, {
        include: [{ model: Fund, as: 'funds' }]
      });

      if (!fundFamily) {
        throw new AppError('Fund family not found', 404);
      }

      const fundReports = [];
      let consolidatedMetrics = {
        totalCommitments: 0,
        totalCalled: 0,
        totalDistributed: 0,
        totalNAV: 0,
        weightedIRR: 0,
        averageMOIC: 0
      };

      // Generate report for each fund in the family
      for (const fund of fundFamily.funds) {
        try {
          const performanceMetrics = await PerformanceAnalyticsService.calculateFundPerformance(
            fund.id,
            asOf,
            true
          );

          const commitments = await Commitment.findAll({
            where: { fundId: fund.id, status: 'active' }
          });

          const totalCommitments = commitments.reduce((sum, c) => 
            sum + parseFloat(c.commitmentAmount), 0
          );

          fundReports.push({
            fund: {
              id: fund.id,
              name: fund.name,
              code: fund.code,
              vintage: fund.vintage,
              status: fund.status
            },
            totalCommitments,
            performanceMetrics
          });

          // Add to consolidated metrics
          consolidatedMetrics.totalCommitments += totalCommitments;
          consolidatedMetrics.totalCalled += totalCommitments * performanceMetrics.calledPercentage / 100;
          consolidatedMetrics.totalDistributed += totalCommitments * performanceMetrics.distributedPercentage / 100;
          consolidatedMetrics.totalNAV += performanceMetrics.nav;

        } catch (error) {
          console.error(`Error processing fund ${fund.id}:`, error);
        }
      }

      // Calculate weighted averages
      if (consolidatedMetrics.totalCommitments > 0) {
        consolidatedMetrics.weightedIRR = fundReports.reduce((sum, report) => {
          const weight = report.totalCommitments / consolidatedMetrics.totalCommitments;
          return sum + (report.performanceMetrics.irr * weight);
        }, 0);

        consolidatedMetrics.averageMOIC = fundReports.reduce((sum, report) => {
          const weight = report.totalCommitments / consolidatedMetrics.totalCommitments;
          return sum + (report.performanceMetrics.moic * weight);
        }, 0);
      }

      const report = {
        fundFamily: {
          id: fundFamily.id,
          name: fundFamily.name,
          description: fundFamily.description
        },
        asOfDate: asOf.toISOString(),
        consolidatedMetrics,
        fundReports,
        fundCount: fundReports.length,
        generatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get investor position report across all funds
   */
  async getInvestorPositionReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { investorId } = req.params;
      const { asOfDate } = req.query;

      const asOf = asOfDate ? new Date(asOfDate as string) : new Date();

      const investor = await InvestorEntity.findByPk(investorId);
      if (!investor) {
        throw new AppError('Investor not found', 404);
      }

      const commitments = await Commitment.findAll({
        where: { 
          investorEntityId: investorId,
          status: 'active'
        },
        include: [
          { 
            model: Fund, 
            as: 'fund',
            include: [{ model: FundFamily, as: 'fundFamily' }]
          }
        ]
      });

      const positionReports = [];
      let portfolioMetrics = {
        totalCommitments: 0,
        totalCalled: 0,
        totalDistributed: 0,
        totalNAV: 0,
        portfolioIRR: 0,
        portfolioMOIC: 0
      };

      // Calculate position for each fund
      for (const commitment of commitments) {
        try {
          const performanceMetrics = await PerformanceAnalyticsService.calculateInvestorPerformance(
            investorId,
            commitment.fundId,
            asOf
          );

          const commitmentAmount = parseFloat(commitment.commitmentAmount);
          const calledAmount = commitmentAmount * performanceMetrics.calledPercentage / 100;
          const distributedAmount = commitmentAmount * performanceMetrics.distributedPercentage / 100;

          positionReports.push({
            fund: {
              id: commitment.fund.id,
              name: commitment.fund.name,
              code: commitment.fund.code,
              vintage: commitment.fund.vintage,
              fundFamily: commitment.fund.fundFamily?.name
            },
            commitment: {
              id: commitment.id,
              amount: commitmentAmount,
              date: commitment.commitmentDate,
              status: commitment.status
            },
            performanceMetrics,
            amounts: {
              committed: commitmentAmount,
              called: calledAmount,
              distributed: distributedAmount,
              unfunded: commitmentAmount - calledAmount,
              nav: performanceMetrics.nav
            }
          });

          // Add to portfolio totals
          portfolioMetrics.totalCommitments += commitmentAmount;
          portfolioMetrics.totalCalled += calledAmount;
          portfolioMetrics.totalDistributed += distributedAmount;
          portfolioMetrics.totalNAV += performanceMetrics.nav;

        } catch (error) {
          console.error(`Error processing commitment ${commitment.id}:`, error);
        }
      }

      // Calculate portfolio-level metrics
      if (portfolioMetrics.totalCalled > 0) {
        portfolioMetrics.portfolioMOIC = 
          (portfolioMetrics.totalDistributed + portfolioMetrics.totalNAV) / portfolioMetrics.totalCalled;
      }

      // Calculate portfolio IRR (simplified)
      portfolioMetrics.portfolioIRR = positionReports.reduce((sum, position) => {
        const weight = position.amounts.committed / portfolioMetrics.totalCommitments;
        return sum + (position.performanceMetrics.irr * weight);
      }, 0);

      const report = {
        investor: {
          id: investor.id,
          name: investor.name,
          legalName: investor.legalName,
          type: investor.type
        },
        asOfDate: asOf.toISOString(),
        portfolioMetrics,
        positionReports,
        positionCount: positionReports.length,
        generatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fee summary report
   */
  async getFeeSummaryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { startDate, endDate, feeType } = req.query;

      const whereClause: any = {};
      
      if (fundId) {
        whereClause.fundId = fundId;
      }
      
      if (feeType) {
        whereClause.feeType = feeType;
      }
      
      if (startDate && endDate) {
        whereClause.calculationDate = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }

      const feeCalculations = await FeeCalculation.findAll({
        where: whereClause,
        include: [
          { model: Fund, as: 'fund' },
          {
            model: Commitment,
            as: 'commitment',
            include: [{ model: InvestorEntity, as: 'investorEntity' }]
          }
        ],
        order: [['calculationDate', 'desc']]
      });

      // Group by fee type
      const feesByType = feeCalculations.reduce((acc, fee) => {
        const type = fee.feeType;
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            totalAmount: 0,
            fees: []
          };
        }
        
        acc[type].count += 1;
        acc[type].totalAmount += parseFloat(fee.totalAmount);
        acc[type].fees.push({
          id: fee.id,
          calculationDate: fee.calculationDate,
          fund: fee.fund?.name,
          investor: fee.commitment?.investorEntity?.name,
          basis: parseFloat(fee.basis),
          rate: parseFloat(fee.rate),
          amount: parseFloat(fee.totalAmount),
          status: fee.status
        });
        
        return acc;
      }, {} as Record<string, any>);

      // Calculate summary statistics
      const summary = {
        totalFees: feeCalculations.reduce((sum, fee) => sum + parseFloat(fee.totalAmount), 0),
        feeCount: feeCalculations.length,
        periodStart: startDate,
        periodEnd: endDate,
        byStatus: feeCalculations.reduce((acc, fee) => {
          acc[fee.status] = (acc[fee.status] || 0) + parseFloat(fee.totalAmount);
          return acc;
        }, {} as Record<string, number>)
      };

      const report = {
        filters: {
          fundId,
          startDate,
          endDate,
          feeType
        },
        summary,
        feesByType,
        generatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export report to various formats
   */
  async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportType } = req.params;
      const { format, fundId, investorId, startDate, endDate } = req.query;

      const exportOptions = {
        format: (format as string) || 'excel',
        includeHeaders: true,
        includeSummary: true
      };

      let exportResult;

      switch (reportType) {
        case 'fund_performance':
          if (!fundId) {
            throw new AppError('Fund ID is required for fund performance export', 400);
          }
          exportResult = await ExportService.exportFundPerformance(fundId as string, exportOptions);
          break;

        case 'investor_portfolio':
          if (!investorId) {
            throw new AppError('Investor ID is required for investor portfolio export', 400);
          }
          exportResult = await ExportService.exportInvestorPortfolio(investorId as string, exportOptions);
          break;

        case 'capital_activity':
          const start = startDate ? new Date(startDate as string) : undefined;
          const end = endDate ? new Date(endDate as string) : undefined;
          exportResult = await ExportService.exportCapitalActivity(
            fundId as string,
            start,
            end,
            exportOptions
          );
          break;

        case 'fee_calculations':
          const feeStart = startDate ? new Date(startDate as string) : undefined;
          const feeEnd = endDate ? new Date(endDate as string) : undefined;
          exportResult = await ExportService.exportFeeCalculations(
            fundId as string,
            feeStart,
            feeEnd,
            exportOptions
          );
          break;

        default:
          throw new AppError(`Unsupported report type: ${reportType}`, 400);
      }

      res.status(200).json({
        success: true,
        data: {
          reportType,
          exportFormat: exportOptions.format,
          parameters: {
            fundId,
            investorId,
            startDate,
            endDate
          },
          ...exportResult
        }
      });
    } catch (error) {
      next(error);
    }
  }

  private calculateFundMetrics(commitments: any[], transactions: any[]) {
    const totalCommitments = commitments.reduce((sum, c) => sum + parseFloat(c.commitmentAmount), 0);
    
    const transactionMetrics = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      switch (transaction.transactionType) {
        case 'capital_call':
          acc.totalCalls += amount;
          break;
        case 'distribution':
          acc.totalDistributions += amount;
          break;
        case 'fee':
          acc.totalFees += amount;
          break;
      }
      
      return acc;
    }, {
      totalCalls: 0,
      totalDistributions: 0,
      totalFees: 0
    });

    return {
      totalCommitments: totalCommitments.toString(),
      ...transactionMetrics,
      callRate: totalCommitments > 0 ? (transactionMetrics.totalCalls / totalCommitments) : 0,
      multiple: transactionMetrics.totalCalls > 0 ? (transactionMetrics.totalDistributions / transactionMetrics.totalCalls) : 0,
      netCashFlow: (transactionMetrics.totalDistributions - transactionMetrics.totalCalls).toString()
    };
  }

  private calculateInvestorPerformance(commitments: any[], transactions: any[]) {
    const investorMap = new Map();
    
    // Group by investor
    commitments.forEach(commitment => {
      const investorId = commitment.investorEntityId;
      if (!investorMap.has(investorId)) {
        investorMap.set(investorId, {
          investor: commitment.investorEntity,
          commitments: [],
          transactions: []
        });
      }
      investorMap.get(investorId).commitments.push(commitment);
    });

    // Add transactions
    transactions.forEach(transaction => {
      const investorId = transaction.commitment.investorEntityId;
      if (investorMap.has(investorId)) {
        investorMap.get(investorId).transactions.push(transaction);
      }
    });

    // Calculate metrics for each investor
    return Array.from(investorMap.values()).map(investorData => {
      const metrics = this.calculatePortfolioMetrics(investorData.commitments, investorData.transactions);
      
      return {
        investor: {
          id: investorData.investor.id,
          name: investorData.investor.name,
          type: investorData.investor.type
        },
        metrics
      };
    });
  }

  private generateCashFlowAnalysis(transactions: any[]) {
    const monthlyFlow = new Map();
    
    transactions.forEach(transaction => {
      const month = transaction.transactionDate.toISOString().slice(0, 7);
      const amount = parseFloat(transaction.amount);
      
      if (!monthlyFlow.has(month)) {
        monthlyFlow.set(month, {
          calls: 0,
          distributions: 0,
          net: 0
        });
      }
      
      const monthData = monthlyFlow.get(month);
      
      if (transaction.transactionType === 'capital_call') {
        monthData.calls += amount;
      } else if (transaction.transactionType === 'distribution') {
        monthData.distributions += amount;
      }
      
      monthData.net = monthData.distributions - monthData.calls;
    });

    return Array.from(monthlyFlow.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateCommitmentMetrics(commitment: any, transactions: any[]) {
    const metrics = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      switch (transaction.transactionType) {
        case 'capital_call':
          acc.capitalCalled += amount;
          break;
        case 'distribution':
          acc.capitalReturned += amount;
          break;
      }
      
      return acc;
    }, {
      capitalCalled: 0,
      capitalReturned: 0
    });

    const commitmentAmount = parseFloat(commitment.commitmentAmount);
    const unfundedCommitment = Math.max(0, commitmentAmount - metrics.capitalCalled);

    return {
      capitalCalled: metrics.capitalCalled.toString(),
      capitalReturned: metrics.capitalReturned.toString(),
      unfundedCommitment: unfundedCommitment.toString(),
      callRate: commitmentAmount > 0 ? (metrics.capitalCalled / commitmentAmount) : 0,
      multiple: metrics.capitalCalled > 0 ? (metrics.capitalReturned / metrics.capitalCalled) : 0,
      netCashFlow: (metrics.capitalReturned - metrics.capitalCalled).toString()
    };
  }

  private calculatePortfolioMetrics(commitments: any[], transactions: any[]) {
    const totalCommitments = commitments.reduce((sum, c) => sum + parseFloat(c.commitmentAmount), 0);
    
    const transactionMetrics = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      switch (transaction.transactionType) {
        case 'capital_call':
          acc.totalCalls += amount;
          break;
        case 'distribution':
          acc.totalDistributions += amount;
          break;
      }
      
      return acc;
    }, {
      totalCalls: 0,
      totalDistributions: 0
    });

    return {
      totalCommitments: totalCommitments.toString(),
      totalCalled: transactionMetrics.totalCalls.toString(),
      totalReturned: transactionMetrics.totalDistributions.toString(),
      totalUnfunded: (totalCommitments - transactionMetrics.totalCalls).toString(),
      callRate: totalCommitments > 0 ? (transactionMetrics.totalCalls / totalCommitments) : 0,
      multiple: transactionMetrics.totalCalls > 0 ? (transactionMetrics.totalDistributions / transactionMetrics.totalCalls) : 0,
      netCashFlow: (transactionMetrics.totalDistributions - transactionMetrics.totalCalls).toString()
    };
  }
}

export default new ReportController();