import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Commitment, Fund, InvestorEntity, InvestorClass, Transaction, CapitalActivity } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import CommitmentWorkflowService from '../services/CommitmentWorkflowService';

export class CommitmentController {
  private commitmentWorkflowService: CommitmentWorkflowService;

  constructor() {
    this.commitmentWorkflowService = new CommitmentWorkflowService();
  }
  async createCommitment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        fundId,
        investorEntityId,
        investorClassId,
        commitmentAmount,
        commitmentDate,
        closingId,
        sideLetterTerms,
        feeOverrides,
        notes,
        metadata
      } = req.body;

      // Validate that the fund exists
      const fund = await Fund.findByPk(fundId);
      if (!fund) {
        throw new AppError('Fund not found', 404);
      }

      // Validate that the investor exists
      const investor = await InvestorEntity.findByPk(investorEntityId);
      if (!investor) {
        throw new AppError('Investor not found', 404);
      }

      // Validate that the investor class exists and belongs to the fund
      const investorClass = await InvestorClass.findOne({
        where: { 
          id: investorClassId,
          fundId: fundId
        }
      });
      if (!investorClass) {
        throw new AppError('Investor class not found for this fund', 404);
      }

      // Calculate initial unfunded commitment
      const unfundedCommitment = commitmentAmount;

      const commitment = await Commitment.create({
        fundId,
        investorEntityId,
        investorClassId,
        commitmentAmount,
        commitmentDate,
        closingId,
        status: 'active',
        sideLetterTerms,
        feeOverrides,
        capitalCalled: '0',
        capitalReturned: '0',
        unfundedCommitment,
        preferredReturn: '0',
        carriedInterest: '0',
        notes,
        metadata
      });

      const createdCommitment = await Commitment.findByPk(commitment.id, {
        include: [
          {
            model: Fund,
            as: 'fund'
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

      res.status(201).json({
        success: true,
        data: createdCommitment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCommitments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = 'createdAt', 
        order = 'desc',
        fundId,
        investorEntityId,
        status,
        search
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      if (fundId) {
        whereClause.fundId = fundId;
      }
      
      if (investorEntityId) {
        whereClause.investorEntityId = investorEntityId;
      }

      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await Commitment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Fund,
            as: 'fund',
            where: search ? {
              [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } }
              ]
            } : undefined
          },
          {
            model: InvestorEntity,
            as: 'investorEntity',
            where: search ? {
              [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { legalName: { [Op.iLike]: `%${search}%` } }
              ]
            } : undefined
          },
          {
            model: InvestorClass,
            as: 'investorClass'
          }
        ],
        order: [[sort as string, order as string]],
        limit: Number(limit),
        offset
      });

      res.status(200).json({
        success: true,
        data: {
          commitments: rows,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(count / Number(limit)),
            totalItems: count,
            itemsPerPage: Number(limit)
          }
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCommitmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const commitment = await Commitment.findByPk(id, {
        include: [
          {
            model: Fund,
            as: 'fund'
          },
          {
            model: InvestorEntity,
            as: 'investorEntity'
          },
          {
            model: InvestorClass,
            as: 'investorClass'
          },
          {
            model: Transaction,
            as: 'transactions',
            order: [['transactionDate', 'desc']],
            limit: 50
          }
        ]
      });

      if (!commitment) {
        throw new AppError('Commitment not found', 404);
      }

      res.status(200).json({
        success: true,
        data: commitment,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCommitment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const commitment = await Commitment.findByPk(id);
      if (!commitment) {
        throw new AppError('Commitment not found', 404);
      }

      // Don't allow updating critical financial fields directly
      const { 
        capitalCalled, 
        capitalReturned, 
        unfundedCommitment, 
        preferredReturn, 
        carriedInterest,
        ...updateData 
      } = req.body;

      await commitment.update(updateData);

      const updatedCommitment = await Commitment.findByPk(id, {
        include: [
          {
            model: Fund,
            as: 'fund'
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

      res.status(200).json({
        success: true,
        data: updatedCommitment,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCommitmentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      
      if (!['pending', 'active', 'suspended', 'terminated'].includes(status)) {
        throw new AppError('Invalid commitment status', 400);
      }

      const commitment = await Commitment.findByPk(id);
      if (!commitment) {
        throw new AppError('Commitment not found', 404);
      }

      const updateData: any = { status };
      if (reason) {
        updateData.notes = commitment.notes ? 
          `${commitment.notes}\n\nStatus change to ${status}: ${reason}` : 
          `Status change to ${status}: ${reason}`;
      }

      await commitment.update(updateData);

      res.status(200).json({
        success: true,
        data: commitment,
        message: `Commitment status updated to ${status}`,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCommitmentTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        page = 1, 
        limit = 50, 
        transactionType,
        startDate,
        endDate
      } = req.query;

      const commitment = await Commitment.findByPk(id);
      if (!commitment) {
        throw new AppError('Commitment not found', 404);
      }

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = { commitmentId: id };

      if (transactionType) {
        whereClause.transactionType = transactionType;
      }

      if (startDate && endDate) {
        whereClause.transactionDate = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }

      const { count, rows } = await Transaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: CapitalActivity,
            as: 'capitalActivity'
          }
        ],
        order: [['transactionDate', 'desc']],
        limit: Number(limit),
        offset
      });

      res.status(200).json({
        success: true,
        data: {
          commitment,
          transactions: rows,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(count / Number(limit)),
            totalItems: count,
            itemsPerPage: Number(limit)
          }
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCommitmentSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const commitment = await Commitment.findByPk(id, {
        include: [
          {
            model: Fund,
            as: 'fund'
          },
          {
            model: InvestorEntity,
            as: 'investorEntity'
          }
        ]
      });

      if (!commitment) {
        throw new AppError('Commitment not found', 404);
      }

      // Get transaction summaries
      const transactions = await Transaction.findAll({
        where: { commitmentId: id },
        order: [['transactionDate', 'desc']]
      });

      const transactionSummary = transactions.reduce((acc, transaction) => {
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
          case 'expense':
            acc.totalExpenses += amount;
            break;
        }
        
        return acc;
      }, {
        totalCalls: 0,
        totalDistributions: 0,
        totalFees: 0,
        totalExpenses: 0
      });

      const commitmentAmount = parseFloat(commitment.commitmentAmount);
      const capitalCalled = parseFloat(commitment.capitalCalled);
      const capitalReturned = parseFloat(commitment.capitalReturned);
      
      const summary = {
        commitment: {
          id: commitment.id,
          amount: commitment.commitmentAmount,
          date: commitment.commitmentDate,
          status: commitment.status
        },
        fund: {
          id: commitment.fund.id,
          name: commitment.fund.name,
          code: commitment.fund.code
        },
        investor: {
          id: commitment.investorEntity.id,
          name: commitment.investorEntity.name,
          type: commitment.investorEntity.type
        },
        financial: {
          commitmentAmount: commitment.commitmentAmount,
          capitalCalled: commitment.capitalCalled,
          capitalReturned: commitment.capitalReturned,
          unfundedCommitment: commitment.unfundedCommitment,
          netCashFlow: (capitalReturned - capitalCalled).toString(),
          callRate: commitmentAmount > 0 ? (capitalCalled / commitmentAmount) : 0,
          returnRate: capitalCalled > 0 ? (capitalReturned / capitalCalled) : 0
        },
        transactions: {
          ...transactionSummary,
          count: transactions.length,
          lastTransaction: transactions.length > 0 ? transactions[0].transactionDate : null
        }
      };

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async recalculateCommitment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const { reason } = req.body;
      
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const recalculation = await this.commitmentWorkflowService.recalculateCommitment(
        parseInt(id),
        'nav_update',
        userId,
        reason
      );

      res.status(200).json({
        success: true,
        data: recalculation,
        message: 'Commitment recalculated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async generateCommitmentAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const analytics = await this.commitmentWorkflowService.generateCommitmentAnalytics(parseInt(id));

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSideLetterTerms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { terms } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!terms || !Array.isArray(terms)) {
        throw new AppError('Side letter terms array is required', 400);
      }

      const commitment = await this.commitmentWorkflowService.updateSideLetterTerms(
        parseInt(id),
        terms,
        userId
      );

      res.status(200).json({
        success: true,
        data: commitment,
        message: 'Side letter terms updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkRecalculateCommitments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { commitmentIds, recalculationType = 'nav_update' } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const recalculations = await this.commitmentWorkflowService.bulkRecalculateCommitments(
        parseInt(fundId),
        recalculationType,
        userId,
        commitmentIds
      );

      res.status(200).json({
        success: true,
        data: {
          recalculations,
          summary: {
            total: recalculations.length,
            successful: recalculations.length,
          }
        },
        message: `${recalculations.length} commitments recalculated successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCommitmentsRequiringAttention(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.query;
      
      const attentionItems = await this.commitmentWorkflowService.getCommitmentsRequiringAttention(
        fundId ? parseInt(fundId as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: attentionItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCommitmentWorkflowSteps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const steps = this.commitmentWorkflowService.getCommitmentWorkflowSteps();

      res.status(200).json({
        success: true,
        data: steps,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CommitmentController();