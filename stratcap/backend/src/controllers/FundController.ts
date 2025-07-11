import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Fund, FundFamily, Commitment, CapitalActivity, InvestorClass } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class FundController {
  async createFund(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fund = await Fund.create(req.body);
      
      const createdFund = await Fund.findByPk(fund.id, {
        include: [
          {
            model: FundFamily,
            as: 'fundFamily'
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdFund,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFunds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = 'createdAt', 
        order = 'desc',
        fundFamilyId,
        status,
        vintage,
        search
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      if (fundFamilyId) {
        whereClause.fundFamilyId = fundFamilyId;
      }
      
      if (status) {
        whereClause.status = status;
      }

      if (vintage) {
        whereClause.vintage = vintage;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Fund.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: FundFamily,
            as: 'fundFamily'
          }
        ],
        order: [[sort as string, order as string]],
        limit: Number(limit),
        offset
      });

      res.status(200).json({
        success: true,
        data: {
          funds: rows,
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

  async getFundById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const fund = await Fund.findByPk(id, {
        include: [
          {
            model: FundFamily,
            as: 'fundFamily'
          },
          {
            model: Commitment,
            as: 'commitments',
            include: [
              {
                model: InvestorClass,
                as: 'investorClass'
              }
            ]
          },
          {
            model: CapitalActivity,
            as: 'capitalActivities',
            order: [['eventDate', 'desc']],
            limit: 10
          }
        ]
      });

      if (!fund) {
        throw new AppError('Fund not found', 404);
      }

      res.status(200).json({
        success: true,
        data: fund,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const fund = await Fund.findByPk(id);
      if (!fund) {
        throw new AppError('Fund not found', 404);
      }

      await fund.update(req.body);

      const updatedFund = await Fund.findByPk(id, {
        include: [
          {
            model: FundFamily,
            as: 'fundFamily'
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: updatedFund,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const fund = await Fund.findByPk(id);
      if (!fund) {
        throw new AppError('Fund not found', 404);
      }

      // Check if fund has any commitments
      const commitmentCount = await Commitment.count({
        where: { fundId: id }
      });

      if (commitmentCount > 0) {
        throw new AppError('Cannot delete fund with existing commitments', 400);
      }

      await fund.destroy();

      res.status(200).json({
        success: true,
        message: 'Fund deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getFundMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const fund = await Fund.findByPk(id);
      if (!fund) {
        throw new AppError('Fund not found', 404);
      }

      // Get commitments with calculated fields
      const commitments = await Commitment.findAll({
        where: { fundId: id, status: 'active' }
      });

      // Calculate fund metrics
      const totalCommitments = commitments.reduce((sum, c) => sum + parseFloat(c.commitmentAmount), 0);
      const totalCalled = commitments.reduce((sum, c) => sum + parseFloat(c.capitalCalled), 0);
      const totalReturned = commitments.reduce((sum, c) => sum + parseFloat(c.capitalReturned), 0);
      const totalUnfunded = commitments.reduce((sum, c) => sum + parseFloat(c.unfundedCommitment), 0);

      const metrics = {
        totalCommitments: totalCommitments.toString(),
        totalCalled: totalCalled.toString(),
        totalReturned: totalReturned.toString(),
        totalUnfunded: totalUnfunded.toString(),
        commitmentCount: commitments.length,
        callRate: totalCommitments > 0 ? (totalCalled / totalCommitments) : 0,
        returnRate: totalCalled > 0 ? (totalReturned / totalCalled) : 0
      };

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFundStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['fundraising', 'investing', 'harvesting', 'closed'].includes(status)) {
        throw new AppError('Invalid fund status', 400);
      }

      const fund = await Fund.findByPk(id);
      if (!fund) {
        throw new AppError('Fund not found', 404);
      }

      await fund.update({ status });

      res.status(200).json({
        success: true,
        data: fund,
        message: `Fund status updated to ${status}`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FundController();