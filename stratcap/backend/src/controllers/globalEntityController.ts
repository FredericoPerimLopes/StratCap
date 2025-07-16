import { Request, Response } from 'express';
import { GlobalEntityService, EntitySearchFilters } from '../services/GlobalEntityService';
import { Decimal } from 'decimal.js';

export class GlobalEntityController {
  private globalEntityService: GlobalEntityService;

  constructor() {
    this.globalEntityService = new GlobalEntityService();
  }

  /**
   * Get global investor summary
   */
  getInvestorSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const investorId = req.params.investorId;
      const summary = await this.globalEntityService.getGlobalInvestorSummary(investorId);
      
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Get global fund summary
   */
  getFundSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const fundId = req.params.fundId;
      const summary = await this.globalEntityService.getGlobalFundSummary(fundId);
      
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Get global investment summary
   */
  getInvestmentSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const investmentId = req.params.investmentId;
      const summary = await this.globalEntityService.getGlobalInvestmentSummary(investmentId);
      
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Get global entity metrics
   */
  getGlobalMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = await this.globalEntityService.getGlobalEntityMetrics();
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve global metrics',
      });
    }
  };

  /**
   * Search entities with filters
   */
  searchEntities = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: EntitySearchFilters = {
        entityType: req.query.entityType as any,
        geography: req.query.geography ? 
          (Array.isArray(req.query.geography) ? req.query.geography as string[] : [req.query.geography as string]) : 
          undefined,
        sector: req.query.sector ? 
          (Array.isArray(req.query.sector) ? req.query.sector as string[] : [req.query.sector as string]) : 
          undefined,
        vintage: req.query.vintage ? 
          (Array.isArray(req.query.vintage) ? 
            (req.query.vintage as string[]).map(v => parseInt(v)) : 
            [parseInt(req.query.vintage as string)]) : 
          undefined,
        minCommitment: req.query.minCommitment as string,
        maxCommitment: req.query.maxCommitment as string,
        status: req.query.status ? 
          (Array.isArray(req.query.status) ? req.query.status as string[] : [req.query.status as string]) : 
          undefined,
        investorType: req.query.investorType ? 
          (Array.isArray(req.query.investorType) ? req.query.investorType as string[] : [req.query.investorType as string]) : 
          undefined,
        fundType: req.query.fundType ? 
          (Array.isArray(req.query.fundType) ? req.query.fundType as string[] : [req.query.fundType as string]) : 
          undefined,
        searchTerm: req.query.searchTerm as string,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const results = await this.globalEntityService.searchEntities(filters);
      
      res.json({
        success: true,
        data: results,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          totalCount: results.totalCount,
          hasMore: results.hasMore,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Get relationship map
   */
  getRelationshipMap = async (req: Request, res: Response): Promise<void> => {
    try {
      const relationshipMap = await this.globalEntityService.getRelationshipMap();
      
      res.json({
        success: true,
        data: relationshipMap,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve relationship map',
      });
    }
  };

  /**
   * Get investor portfolio across all funds
   */
  getInvestorPortfolio = async (req: Request, res: Response): Promise<void> => {
    try {
      const investorId = req.params.investorId;
      const includeDetail = req.query.includeDetail === 'true';
      
      const summary = await this.globalEntityService.getGlobalInvestorSummary(investorId);
      
      // Filter data based on detail level
      const portfolio = {
        investorId: summary.investorId,
        investorName: summary.investorName,
        totalCommitments: summary.totalCommitments,
        totalContributions: summary.totalContributions,
        totalDistributions: summary.totalDistributions,
        currentNAV: summary.currentNAV,
        totalValue: summary.totalValue,
        multipleOfMoney: summary.multipleOfMoney,
        irr: summary.irr,
        fundCount: summary.fundCount,
        funds: includeDetail ? summary.funds : summary.funds.map(fund => ({
          fundId: fund.fundId,
          fundName: fund.fundName,
          vintage: fund.vintage,
          commitment: fund.commitment,
          totalValue: fund.totalValue,
          multiple: fund.multiple,
        })),
      };
      
      res.json({
        success: true,
        data: portfolio,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Get fund's investor base
   */
  getFundInvestorBase = async (req: Request, res: Response): Promise<void> => {
    try {
      const fundId = req.params.fundId;
      const includeDetail = req.query.includeDetail === 'true';
      
      const summary = await this.globalEntityService.getGlobalFundSummary(fundId);
      
      const investorBase = {
        fundId: summary.fundId,
        fundName: summary.fundName,
        vintage: summary.vintage,
        totalCommitments: summary.totalCommitments,
        investorCount: summary.investorCount,
        topInvestors: includeDetail ? summary.topInvestors : summary.topInvestors.slice(0, 5),
        geographyDistribution: summary.geography,
        sectorDistribution: summary.sectors,
      };
      
      res.json({
        success: true,
        data: investorBase,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Get cross-fund analytics
   */
  getCrossFundAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = await this.globalEntityService.getGlobalEntityMetrics();
      const relationshipMap = await this.globalEntityService.getRelationshipMap();
      
      // Calculate cross-fund insights
      const analytics = {
        overview: {
          totalFunds: metrics.totalFunds,
          totalInvestors: metrics.totalInvestors,
          averageInvestorsPerFund: metrics.totalInvestors / metrics.totalFunds,
          averageFundsPerInvestor: relationshipMap.investors.reduce((sum, inv) => sum + inv.funds.length, 0) / relationshipMap.investors.length,
        },
        investorLoyalty: {
          multipleCommitments: relationshipMap.investors.filter(inv => inv.funds.length > 1).length,
          loyaltyRate: (relationshipMap.investors.filter(inv => inv.funds.length > 1).length / relationshipMap.investors.length) * 100,
          strongRelationships: relationshipMap.investors.filter(inv => inv.relationshipStrength === 'strong').length,
        },
        fundOverlaps: relationshipMap.funds.map(fund => ({
          fundId: fund.fundId,
          fundName: fund.fundName,
          vintage: fund.vintage,
          sharedInvestorCount: fund.sharedInvestors.length,
          overlapPercentage: (fund.sharedInvestors.length / relationshipMap.investors.length) * 100,
        })),
        geographyInsights: metrics.geographyBreakdown,
        vintageProgression: metrics.vintageBreakdown,
      };
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cross-fund analytics',
      });
    }
  };

  /**
   * Get entity performance comparison
   */
  getPerformanceComparison = async (req: Request, res: Response): Promise<void> => {
    try {
      const entityType = req.query.entityType as 'fund' | 'investor' | 'investment';
      const entityIds = req.query.entityIds as string | string[];
      
      if (!entityType || !entityIds) {
        res.status(400).json({
          success: false,
          message: 'entityType and entityIds are required',
        });
        return;
      }

      const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
      const comparisons: any[] = [];

      for (const id of ids) {
        try {
          let summary;
          switch (entityType) {
            case 'fund':
              summary = await this.globalEntityService.getGlobalFundSummary(id);
              comparisons.push({
                id: summary.fundId,
                name: summary.fundName,
                vintage: summary.vintage,
                totalValue: summary.totalValue,
                multiple: summary.multipleOfMoney,
                irr: summary.irr,
                type: summary.type,
              });
              break;
            case 'investor':
              summary = await this.globalEntityService.getGlobalInvestorSummary(id);
              comparisons.push({
                id: summary.investorId,
                name: summary.investorName,
                totalValue: summary.totalValue,
                multiple: summary.multipleOfMoney,
                irr: summary.irr,
                fundCount: summary.fundCount,
              });
              break;
            case 'investment':
              summary = await this.globalEntityService.getGlobalInvestmentSummary(id);
              comparisons.push({
                id: summary.investmentId,
                name: summary.portfolioCompany,
                totalValue: summary.totalValue,
                multiple: summary.multipleOfMoney,
                irr: summary.irr,
                sector: summary.sector,
              });
              break;
          }
        } catch (error) {
          // Skip entities that can't be found
          continue;
        }
      }
      
      // Calculate rankings and percentiles
      comparisons.sort((a, b) => b.multiple.comparedTo(a.multiple));
      comparisons.forEach((item, index) => {
        item.rank = index + 1;
        item.percentile = ((comparisons.length - index) / comparisons.length) * 100;
      });
      
      res.json({
        success: true,
        data: {
          entityType,
          comparisons,
          summary: {
            count: comparisons.length,
            avgMultiple: comparisons.reduce((sum, item) => sum.plus(item.multiple), new Decimal(0)).dividedBy(comparisons.length),
            avgIRR: comparisons.reduce((sum, item) => sum.plus(item.irr), new Decimal(0)).dividedBy(comparisons.length),
            topPerformer: comparisons[0],
            bottomPerformer: comparisons[comparisons.length - 1],
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance comparison',
      });
    }
  };
}