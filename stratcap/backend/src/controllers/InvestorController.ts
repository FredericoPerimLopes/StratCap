import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { InvestorEntity, Commitment, Fund, FundFamily } from '../models';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class InvestorController {
  async createInvestor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const investor = await InvestorEntity.create(req.body);
      
      res.status(201).json({
        success: true,
        data: investor,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvestors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = 'createdAt', 
        order = 'desc',
        type,
        kycStatus,
        amlStatus,
        search
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      if (type) {
        whereClause.type = type;
      }
      
      if (kycStatus) {
        whereClause.kycStatus = kycStatus;
      }

      if (amlStatus) {
        whereClause.amlStatus = amlStatus;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { legalName: { [Op.iLike]: `%${search}%` } },
          { primaryEmail: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await InvestorEntity.findAndCountAll({
        where: whereClause,
        order: [[sort as string, order as string]],
        limit: Number(limit),
        offset
      });

      res.status(200).json({
        success: true,
        data: {
          investors: rows,
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

  async getInvestorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const investor = await InvestorEntity.findByPk(id, {
        include: [
          {
            model: Commitment,
            as: 'commitments',
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
          }
        ]
      });

      if (!investor) {
        throw new AppError('Investor not found', 404);
      }

      res.status(200).json({
        success: true,
        data: investor,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInvestor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const investor = await InvestorEntity.findByPk(id);
      if (!investor) {
        throw new AppError('Investor not found', 404);
      }

      await investor.update(req.body);

      res.status(200).json({
        success: true,
        data: investor,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteInvestor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const investor = await InvestorEntity.findByPk(id);
      if (!investor) {
        throw new AppError('Investor not found', 404);
      }

      // Check if investor has any active commitments
      const commitmentCount = await Commitment.count({
        where: { 
          investorEntityId: id,
          status: { [Op.in]: ['active', 'pending'] }
        }
      });

      if (commitmentCount > 0) {
        throw new AppError('Cannot delete investor with active commitments', 400);
      }

      await investor.destroy();

      res.status(200).json({
        success: true,
        message: 'Investor deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvestorPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const investor = await InvestorEntity.findByPk(id);
      if (!investor) {
        throw new AppError('Investor not found', 404);
      }

      const commitments = await Commitment.findAll({
        where: { 
          investorEntityId: id,
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

      // Calculate portfolio metrics
      const portfolioMetrics = commitments.reduce((acc, commitment) => {
        const commitmentAmount = parseFloat(commitment.commitmentAmount);
        const capitalCalled = parseFloat(commitment.capitalCalled);
        const capitalReturned = parseFloat(commitment.capitalReturned);
        const unfundedCommitment = parseFloat(commitment.unfundedCommitment);

        return {
          totalCommitments: acc.totalCommitments + commitmentAmount,
          totalCalled: acc.totalCalled + capitalCalled,
          totalReturned: acc.totalReturned + capitalReturned,
          totalUnfunded: acc.totalUnfunded + unfundedCommitment,
          fundCount: acc.fundCount + 1
        };
      }, {
        totalCommitments: 0,
        totalCalled: 0,
        totalReturned: 0,
        totalUnfunded: 0,
        fundCount: 0
      });

      res.status(200).json({
        success: true,
        data: {
          investor,
          commitments,
          portfolioMetrics: {
            ...portfolioMetrics,
            totalCommitments: portfolioMetrics.totalCommitments.toString(),
            totalCalled: portfolioMetrics.totalCalled.toString(),
            totalReturned: portfolioMetrics.totalReturned.toString(),
            totalUnfunded: portfolioMetrics.totalUnfunded.toString(),
            callRate: portfolioMetrics.totalCommitments > 0 ? 
              (portfolioMetrics.totalCalled / portfolioMetrics.totalCommitments) : 0,
            returnRate: portfolioMetrics.totalCalled > 0 ? 
              (portfolioMetrics.totalReturned / portfolioMetrics.totalCalled) : 0
          }
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateKYCStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { kycStatus, kycDate } = req.body;
      
      if (!['pending', 'approved', 'rejected', 'expired'].includes(kycStatus)) {
        throw new AppError('Invalid KYC status', 400);
      }

      const investor = await InvestorEntity.findByPk(id);
      if (!investor) {
        throw new AppError('Investor not found', 404);
      }

      await investor.update({ 
        kycStatus,
        kycDate: kycDate || new Date()
      });

      res.status(200).json({
        success: true,
        data: investor,
        message: `KYC status updated to ${kycStatus}`,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAMLStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { amlStatus, amlDate } = req.body;
      
      if (!['pending', 'approved', 'rejected', 'expired'].includes(amlStatus)) {
        throw new AppError('Invalid AML status', 400);
      }

      const investor = await InvestorEntity.findByPk(id);
      if (!investor) {
        throw new AppError('Investor not found', 404);
      }

      await investor.update({ 
        amlStatus,
        amlDate: amlDate || new Date()
      });

      res.status(200).json({
        success: true,
        data: investor,
        message: `AML status updated to ${amlStatus}`,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDueDiligenceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const investor = await InvestorEntity.findByPk(id);
      if (!investor) {
        throw new AppError('Investor not found', 404);
      }

      const dueDiligenceStatus = {
        investor: {
          id: investor.id,
          name: investor.name,
          type: investor.type
        },
        kyc: {
          status: investor.kycStatus,
          date: investor.kycDate,
          isValid: investor.kycStatus === 'approved' && 
                  (!investor.kycDate || 
                   new Date().getTime() - investor.kycDate.getTime() < 365 * 24 * 60 * 60 * 1000)
        },
        aml: {
          status: investor.amlStatus,
          date: investor.amlDate,
          isValid: investor.amlStatus === 'approved' && 
                  (!investor.amlDate || 
                   new Date().getTime() - investor.amlDate.getTime() < 365 * 24 * 60 * 60 * 1000)
        },
        accreditation: {
          accreditedInvestor: investor.accreditedInvestor,
          qualifiedPurchaser: investor.qualifiedPurchaser
        }
      };

      const overallStatus = dueDiligenceStatus.kyc.isValid && 
                           dueDiligenceStatus.aml.isValid ? 'compliant' : 'non-compliant';

      res.status(200).json({
        success: true,
        data: {
          ...dueDiligenceStatus,
          overallStatus
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new InvestorController();