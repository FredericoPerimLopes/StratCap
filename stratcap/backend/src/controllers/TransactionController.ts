import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Transaction, Fund, Commitment, CapitalActivity, InvestorEntity } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class TransactionController {
  async createTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        fundId,
        commitmentId,
        capitalActivityId,
        transactionDate,
        effectiveDate,
        transactionType,
        transactionCode,
        description,
        amount,
        currency = 'USD',
        baseAmount,
        exchangeRate,
        direction,
        category,
        subCategory,
        glAccountCode,
        batchId,
        referenceNumber,
        notes,
        metadata
      } = req.body;

      // Validate that the fund exists
      const fund = await Fund.findByPk(fundId);
      if (!fund) {
        throw new AppError('Fund not found', 404);
      }

      // Validate that the commitment exists and belongs to the fund
      const commitment = await Commitment.findOne({
        where: { 
          id: commitmentId,
          fundId: fundId
        }
      });
      if (!commitment) {
        throw new AppError('Commitment not found for this fund', 404);
      }

      // Validate capital activity if provided
      if (capitalActivityId) {
        const capitalActivity = await CapitalActivity.findOne({
          where: { 
            id: capitalActivityId,
            fundId: fundId
          }
        });
        if (!capitalActivity) {
          throw new AppError('Capital activity not found for this fund', 404);
        }
      }

      const transaction = await Transaction.create({
        fundId,
        commitmentId,
        capitalActivityId,
        transactionDate,
        effectiveDate: effectiveDate || transactionDate,
        transactionType,
        transactionCode,
        description,
        amount,
        currency,
        baseAmount,
        exchangeRate,
        direction,
        category,
        subCategory,
        glAccountCode,
        isReversed: false,
        batchId,
        referenceNumber,
        notes,
        metadata
      });

      // Update commitment calculations
      await this.updateCommitmentCalculations(commitmentId);

      const createdTransaction = await Transaction.findByPk(transaction.id, {
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
          },
          {
            model: CapitalActivity,
            as: 'capitalActivity'
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdTransaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = 'transactionDate', 
        order = 'desc',
        fundId,
        commitmentId,
        capitalActivityId,
        transactionType,
        startDate,
        endDate,
        batchId,
        search
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      if (fundId) {
        whereClause.fundId = fundId;
      }
      
      if (commitmentId) {
        whereClause.commitmentId = commitmentId;
      }

      if (capitalActivityId) {
        whereClause.capitalActivityId = capitalActivityId;
      }

      if (transactionType) {
        whereClause.transactionType = transactionType;
      }

      if (batchId) {
        whereClause.batchId = batchId;
      }

      if (startDate && endDate) {
        whereClause.transactionDate = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }

      if (search) {
        whereClause[Op.or] = [
          { description: { [Op.iLike]: `%${search}%` } },
          { transactionCode: { [Op.iLike]: `%${search}%` } },
          { referenceNumber: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Transaction.findAndCountAll({
        where: whereClause,
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
          },
          {
            model: CapitalActivity,
            as: 'capitalActivity'
          }
        ],
        order: [[sort as string, order as string]],
        limit: Number(limit),
        offset
      });

      res.status(200).json({
        success: true,
        data: {
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

  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const transaction = await Transaction.findByPk(id, {
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
          },
          {
            model: CapitalActivity,
            as: 'capitalActivity'
          },
          {
            model: Transaction,
            as: 'originalTransaction'
          }
        ]
      });

      if (!transaction) {
        throw new AppError('Transaction not found', 404);
      }

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const transaction = await Transaction.findByPk(id);
      if (!transaction) {
        throw new AppError('Transaction not found', 404);
      }

      if (transaction.isReversed) {
        throw new AppError('Cannot update a reversed transaction', 400);
      }

      // Don't allow updating critical fields
      const { 
        fundId, 
        commitmentId, 
        transactionDate,
        transactionType,
        amount,
        direction,
        ...updateData 
      } = req.body;

      await transaction.update(updateData);

      const updatedTransaction = await Transaction.findByPk(id, {
        include: [
          {
            model: Fund,
            as: 'fund'
          },
          {
            model: Commitment,
            as: 'commitment'
          },
          {
            model: CapitalActivity,
            as: 'capitalActivity'
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: updatedTransaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async reverseTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const transaction = await Transaction.findByPk(id);
      if (!transaction) {
        throw new AppError('Transaction not found', 404);
      }

      if (transaction.isReversed) {
        throw new AppError('Transaction is already reversed', 400);
      }

      // Create reversal transaction
      const reversalAmount = transaction.direction === 'debit' ? 
        parseFloat(transaction.amount) : -parseFloat(transaction.amount);

      const reversalTransaction = await Transaction.create({
        fundId: transaction.fundId,
        commitmentId: transaction.commitmentId,
        capitalActivityId: transaction.capitalActivityId,
        transactionDate: new Date(),
        effectiveDate: new Date(),
        transactionType: transaction.transactionType,
        transactionCode: `REV-${transaction.transactionCode}`,
        description: `Reversal of: ${transaction.description}`,
        amount: Math.abs(reversalAmount).toString(),
        currency: transaction.currency,
        direction: transaction.direction === 'debit' ? 'credit' : 'debit',
        category: transaction.category,
        subCategory: transaction.subCategory,
        glAccountCode: transaction.glAccountCode,
        isReversed: false,
        reversalOfId: transaction.id,
        batchId: transaction.batchId,
        notes: reason ? `Reversal reason: ${reason}` : 'Transaction reversal',
        metadata: { reversalReason: reason }
      });

      // Mark original transaction as reversed
      await transaction.update({ isReversed: true });

      // Update commitment calculations
      await this.updateCommitmentCalculations(transaction.commitmentId);

      res.status(200).json({
        success: true,
        data: {
          originalTransaction: transaction,
          reversalTransaction
        },
        message: 'Transaction reversed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactionSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        fundId,
        commitmentId,
        startDate,
        endDate,
        groupBy = 'transactionType'
      } = req.query;

      const whereClause: any = { isReversed: false };

      if (fundId) {
        whereClause.fundId = fundId;
      }

      if (commitmentId) {
        whereClause.commitmentId = commitmentId;
      }

      if (startDate && endDate) {
        whereClause.transactionDate = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }

      const transactions = await Transaction.findAll({
        where: whereClause,
        include: [
          {
            model: Fund,
            as: 'fund'
          },
          {
            model: Commitment,
            as: 'commitment'
          }
        ]
      });

      // Group transactions
      const summary = transactions.reduce((acc: any, transaction) => {
        const groupKey = groupBy === 'transactionType' ? transaction.transactionType :
                        groupBy === 'month' ? transaction.transactionDate.toISOString().slice(0, 7) :
                        groupBy === 'fund' ? transaction.fundId.toString() :
                        'all';

        if (!acc[groupKey]) {
          acc[groupKey] = {
            totalAmount: 0,
            count: 0,
            debits: 0,
            credits: 0,
            transactions: []
          };
        }

        const amount = parseFloat(transaction.amount);
        acc[groupKey].totalAmount += amount;
        acc[groupKey].count += 1;
        
        if (transaction.direction === 'debit') {
          acc[groupKey].debits += amount;
        } else {
          acc[groupKey].credits += amount;
        }

        acc[groupKey].transactions.push({
          id: transaction.id,
          date: transaction.transactionDate,
          type: transaction.transactionType,
          amount: transaction.amount,
          direction: transaction.direction
        });

        return acc;
      }, {});

      res.status(200).json({
        success: true,
        data: {
          summary,
          totalTransactions: transactions.length,
          groupBy
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getBatchTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { batchId } = req.params;
      
      const transactions = await Transaction.findAll({
        where: { batchId },
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
          },
          {
            model: CapitalActivity,
            as: 'capitalActivity'
          }
        ],
        order: [['transactionDate', 'asc']]
      });

      if (transactions.length === 0) {
        throw new AppError('No transactions found for this batch', 404);
      }

      // Calculate batch summary
      const batchSummary = transactions.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.amount);
        acc.totalAmount += amount;
        acc.count += 1;
        
        if (transaction.direction === 'debit') {
          acc.totalDebits += amount;
        } else {
          acc.totalCredits += amount;
        }

        if (!acc.transactionTypes[transaction.transactionType]) {
          acc.transactionTypes[transaction.transactionType] = 0;
        }
        acc.transactionTypes[transaction.transactionType] += amount;

        return acc;
      }, {
        totalAmount: 0,
        totalDebits: 0,
        totalCredits: 0,
        count: 0,
        transactionTypes: {} as Record<string, number>
      });

      res.status(200).json({
        success: true,
        data: {
          batchId,
          transactions,
          summary: batchSummary
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private async updateCommitmentCalculations(commitmentId: number): Promise<void> {
    const commitment = await Commitment.findByPk(commitmentId);
    if (!commitment) return;

    const transactions = await Transaction.findAll({
      where: { 
        commitmentId,
        isReversed: false
      }
    });

    const calculations = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      if (transaction.direction === 'debit') {
        switch (transaction.transactionType) {
          case 'capital_call':
            acc.capitalCalled += amount;
            break;
        }
      } else {
        switch (transaction.transactionType) {
          case 'distribution':
            acc.capitalReturned += amount;
            break;
        }
      }
      
      return acc;
    }, {
      capitalCalled: 0,
      capitalReturned: 0
    });

    const commitmentAmount = parseFloat(commitment.commitmentAmount);
    const unfundedCommitment = Math.max(0, commitmentAmount - calculations.capitalCalled);

    await commitment.update({
      capitalCalled: calculations.capitalCalled.toString(),
      capitalReturned: calculations.capitalReturned.toString(),
      unfundedCommitment: unfundedCommitment.toString(),
      lastUpdated: new Date()
    });
  }
}

export default new TransactionController();