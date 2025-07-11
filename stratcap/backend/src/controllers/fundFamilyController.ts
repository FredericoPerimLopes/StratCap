import { Request, Response, NextFunction } from 'express';
import { FundFamily, Fund, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

export class FundFamilyController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fundFamily = await FundFamily.create(req.body);

      // Add the creating user to the fund family
      if (req.user) {
        await (fundFamily as any).addUser(req.user.id);
      }

      res.status(201).json({
        success: true,
        data: fundFamily,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { managementCompany: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const { count, rows } = await FundFamily.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Fund,
            as: 'funds',
            attributes: ['id', 'name', 'code', 'status'],
          },
        ],
      });

      res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const fundFamily = await FundFamily.findByPk(id, {
        include: [
          {
            model: Fund,
            as: 'funds',
            attributes: ['id', 'name', 'code', 'type', 'vintage', 'status'],
          },
          {
            model: User,
            as: 'users',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
            through: { attributes: [] },
          },
        ],
      });

      if (!fundFamily) {
        throw new AppError('Fund family not found', 404);
      }

      res.status(200).json({
        success: true,
        data: fundFamily,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const fundFamily = await FundFamily.findByPk(id);
      if (!fundFamily) {
        throw new AppError('Fund family not found', 404);
      }

      await fundFamily.update(req.body);

      res.status(200).json({
        success: true,
        data: fundFamily,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const fundFamily = await FundFamily.findByPk(id);
      if (!fundFamily) {
        throw new AppError('Fund family not found', 404);
      }

      // Check if there are any funds
      const fundCount = await Fund.count({ where: { fundFamilyId: id } });
      if (fundCount > 0) {
        throw new AppError('Cannot delete fund family with existing funds', 400);
      }

      await fundFamily.destroy();

      res.status(200).json({
        success: true,
        message: 'Fund family deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async addUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const fundFamily = await FundFamily.findByPk(id);
      if (!fundFamily) {
        throw new AppError('Fund family not found', 404);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      await (fundFamily as any).addUser(userId);

      res.status(200).json({
        success: true,
        message: 'User added to fund family successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async removeUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, userId } = req.params;

      const fundFamily = await FundFamily.findByPk(id);
      if (!fundFamily) {
        throw new AppError('Fund family not found', 404);
      }

      await (fundFamily as any).removeUser(userId);

      res.status(200).json({
        success: true,
        message: 'User removed from fund family successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const fundFamily = await FundFamily.findByPk(id, {
        include: [
          {
            model: Fund,
            as: 'funds',
            include: [
              {
                model: require('../models').Commitment,
                as: 'commitments',
                attributes: ['commitmentAmount', 'capitalCalled', 'capitalReturned'],
              },
              {
                model: require('../models').Investment,
                as: 'investments',
                attributes: ['initialCost', 'currentValue', 'realizedValue'],
              },
            ],
          },
        ],
      });

      if (!fundFamily) {
        throw new AppError('Fund family not found', 404);
      }

      // Calculate summary statistics
      const summary = {
        fundFamily: {
          id: fundFamily.id,
          name: fundFamily.name,
          code: fundFamily.code,
        },
        statistics: {
          totalFunds: 0,
          totalCommitments: '0',
          totalCalled: '0',
          totalDistributed: '0',
          totalInvested: '0',
          totalValue: '0',
          activeInvestments: 0,
        },
      };

      // This would include complex calculations in a real implementation
      // For now, returning basic structure

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FundFamilyController();