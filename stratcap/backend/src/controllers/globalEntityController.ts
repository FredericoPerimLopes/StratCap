import { Request, Response } from 'express';
import GlobalEntity from '../models/GlobalEntity';
import { Fund } from '../models';

export class GlobalEntityController {
  /**
   * Get global metrics across all entities
   */
  getGlobalMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = '1y', entityTypes } = req.query;

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '1m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '3m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1y':
        default:
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }

      // Build filter conditions
      const whereClause: any = {
        isActive: true,
        lastSyncAt: {
          $gte: startDate
        }
      };

      if (entityTypes && typeof entityTypes === 'string') {
        const types = entityTypes.split(',');
        whereClause.entityType = { $in: types };
      }

      // Get all entities with metrics
      const entities = await GlobalEntity.findAll({
        where: whereClause,
        order: [['lastSyncAt', 'DESC']]
      });

      // Calculate global metrics
      const metrics = {
        totalEntities: entities.length,
        entityBreakdown: {} as Record<string, number>,
        riskDistribution: {} as Record<string, number>,
        complianceStatus: {} as Record<string, number>,
        averagePerformance: {} as Record<string, number>,
        totalValue: 0,
        totalCapital: 0,
        relationshipStrength: {
          average: 0,
          strong: 0,
          moderate: 0,
          weak: 0
        },
        topPerformers: [] as any[],
        riskAlerts: [] as any[]
      };

      let totalRelationshipStrength = 0;
      let relationshipCount = 0;

      entities.forEach(entity => {
        // Entity type breakdown
        metrics.entityBreakdown[entity.entityType] = 
          (metrics.entityBreakdown[entity.entityType] || 0) + 1;

        // Risk distribution
        metrics.riskDistribution[entity.riskProfile.riskLevel] = 
          (metrics.riskDistribution[entity.riskProfile.riskLevel] || 0) + 1;

        // Compliance status
        metrics.complianceStatus[entity.compliance.status] = 
          (metrics.complianceStatus[entity.compliance.status] || 0) + 1;

        // Performance metrics
        if (entity.metrics.totalValue) {
          metrics.totalValue += entity.metrics.totalValue;
        }
        if (entity.metrics.totalCapital) {
          metrics.totalCapital += entity.metrics.totalCapital;
        }

        // Average performance by metric type
        entity.performanceData.forEach(perf => {
          if (!metrics.averagePerformance[perf.metric]) {
            metrics.averagePerformance[perf.metric] = { sum: 0, count: 0 } as any;
          }
          (metrics.averagePerformance[perf.metric] as any).sum += perf.value;
          (metrics.averagePerformance[perf.metric] as any).count += 1;
        });

        // Relationship strength analysis
        entity.relationships.forEach(rel => {
          totalRelationshipStrength += rel.strength;
          relationshipCount++;

          if (rel.strength >= 0.8) metrics.relationshipStrength.strong++;
          else if (rel.strength >= 0.5) metrics.relationshipStrength.moderate++;
          else metrics.relationshipStrength.weak++;
        });

        // Identify top performers and risk alerts
        const performanceScore = entity.metrics.performanceScore || 0;
        if (performanceScore > 0.8) {
          metrics.topPerformers.push({
            id: entity.id,
            name: entity.name,
            type: entity.entityType,
            score: performanceScore,
            value: entity.metrics.totalValue
          });
        }

        // Risk alerts
        if (entity.riskProfile.riskLevel === 'high' || entity.riskProfile.riskLevel === 'very_high') {
          metrics.riskAlerts.push({
            id: entity.id,
            name: entity.name,
            type: entity.entityType,
            riskLevel: entity.riskProfile.riskLevel,
            factors: entity.riskProfile.factors,
            complianceStatus: entity.compliance.status
          });
        }
      });

      // Calculate averages
      Object.keys(metrics.averagePerformance).forEach(metric => {
        const data = metrics.averagePerformance[metric] as any;
        if (data && data.count > 0) {
          metrics.averagePerformance[metric] = data.sum / data.count;
        }
      });

      if (relationshipCount > 0) {
        metrics.relationshipStrength.average = totalRelationshipStrength / relationshipCount;
      }

      // Sort top performers by score
      metrics.topPerformers.sort((a, b) => b.score - a.score);
      metrics.topPerformers = metrics.topPerformers.slice(0, 10);

      res.json({
        success: true,
        data: {
          metrics,
          period,
          generatedAt: new Date(),
          entitiesAnalyzed: entities.length
        }
      });

    } catch (error) {
      console.error('Error getting global metrics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get global metrics'
      });
    }
  };

  /**
   * Get cross-fund analytics
   */
  getCrossFundAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { metric = 'performance', period = '1y', fundIds } = req.query;

      // Get fund entities
      let fundFilter: any = {
        entityType: 'fund',
        isActive: true
      };

      if (fundIds && typeof fundIds === 'string') {
        const ids = fundIds.split(',').map(id => parseInt(id));
        fundFilter.entityId = { $in: ids };
      }

      const fundEntities = await GlobalEntity.findAll({
        where: fundFilter,
        include: [
          {
            model: Fund,
            as: 'fund',
            attributes: ['id', 'name', 'fundType', 'vintage', 'totalCommitments']
          }
        ]
      });

      const analytics = {
        funds: [] as any[],
        comparison: {
          metric,
          period,
          benchmarkAverage: 0,
          topPerformer: null as any,
          underperformers: [] as any[]
        },
        correlations: [] as any[],
        trends: {
          monthly: [] as any[],
          quarterly: [] as any[]
        }
      };

      let totalMetricValue = 0;
      let fundCount = 0;

      fundEntities.forEach(entity => {
        const fundData = {
          id: entity.id,
          entityId: entity.entityId,
          name: entity.name,
          fundType: (entity as any).fund?.fundType,
          vintage: (entity as any).fund?.vintage,
          totalCommitments: (entity as any).fund?.totalCommitments,
          metrics: entity.metrics,
          performanceData: entity.performanceData,
          riskProfile: entity.riskProfile,
          relationships: entity.relationships.length
        };

        // Calculate primary metric value
        let primaryMetricValue = 0;
        switch (metric) {
          case 'performance':
            primaryMetricValue = entity.metrics.performanceScore || 0;
            break;
          case 'irr':
            primaryMetricValue = entity.metrics.irr || 0;
            break;
          case 'multiple':
            primaryMetricValue = entity.metrics.multiple || 0;
            break;
          case 'nav':
            primaryMetricValue = entity.metrics.nav || 0;
            break;
          default:
            primaryMetricValue = entity.metrics[metric as string] || 0;
        }

        fundData.metrics.primaryMetric = primaryMetricValue;
        analytics.funds.push(fundData);

        totalMetricValue += primaryMetricValue;
        fundCount++;
      });

      // Calculate benchmark average
      if (fundCount > 0) {
        analytics.comparison.benchmarkAverage = totalMetricValue / fundCount;
      }

      // Sort funds by primary metric
      analytics.funds.sort((a, b) => b.metrics.primaryMetric - a.metrics.primaryMetric);

      // Identify top performer and underperformers
      if (analytics.funds.length > 0) {
        analytics.comparison.topPerformer = analytics.funds[0];
        
        const benchmarkThreshold = analytics.comparison.benchmarkAverage * 0.8;
        analytics.comparison.underperformers = analytics.funds.filter(
          fund => fund.metrics.primaryMetric < benchmarkThreshold
        );
      }

      // Calculate correlations between funds
      for (let i = 0; i < analytics.funds.length; i++) {
        for (let j = i + 1; j < analytics.funds.length; j++) {
          const fund1 = analytics.funds[i];
          const fund2 = analytics.funds[j];
          
          // Simple correlation based on performance data
          const correlation = this.calculateCorrelation(
            fund1.performanceData,
            fund2.performanceData,
            metric as string
          );

          if (Math.abs(correlation) > 0.5) { // Only include significant correlations
            analytics.correlations.push({
              fund1: { id: fund1.id, name: fund1.name },
              fund2: { id: fund2.id, name: fund2.name },
              correlation,
              strength: Math.abs(correlation) > 0.8 ? 'strong' : 'moderate'
            });
          }
        }
      }

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Error getting cross-fund analytics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cross-fund analytics'
      });
    }
  };

  /**
   * Get relationship map for an entity
   */
  getRelationshipMap = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entityType, entityId, depth = '2' } = req.query;

      if (!entityType || !entityId) {
        res.status(400).json({
          success: false,
          error: 'entityType and entityId are required'
        });
        return;
      }

      const relationshipMap = await GlobalEntity.getRelationshipMap(
        entityType as string,
        parseInt(entityId as string),
        parseInt(depth as string)
      );

      if (!relationshipMap) {
        res.status(404).json({
          success: false,
          error: 'Entity not found'
        });
        return;
      }

      res.json({
        success: true,
        data: relationshipMap
      });

    } catch (error) {
      console.error('Error getting relationship map:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get relationship map'
      });
    }
  };

  /**
   * Search entities across all types
   */
  searchEntities = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        query,
        entityType,
        riskLevel,
        complianceStatus,
        tags,
        page = '1',
        limit = '25'
      } = req.query;

      const filters: any = {};
      if (entityType) filters.entityType = entityType as string;
      if (riskLevel) filters.riskLevel = (riskLevel as string).split(',');
      if (complianceStatus) filters.complianceStatus = complianceStatus as string;
      if (tags) filters.tags = (tags as string).split(',');

      const entities = await GlobalEntity.searchEntities(
        query as string || '',
        filters
      );

      // Paginate results
      const pageNum = parseInt(page as string);
      const pageSize = parseInt(limit as string);
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedEntities = entities.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          entities: paginatedEntities,
          pagination: {
            page: pageNum,
            limit: pageSize,
            total: entities.length,
            totalPages: Math.ceil(entities.length / pageSize)
          }
        }
      });

    } catch (error) {
      console.error('Error searching entities:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search entities'
      });
    }
  };

  /**
   * Get performance comparison
   */
  getPerformanceComparison = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entityIds, metric = 'performance', period = '1y' } = req.query;

      if (!entityIds) {
        res.status(400).json({
          success: false,
          error: 'entityIds parameter is required'
        });
        return;
      }

      const ids = (entityIds as string).split(',').map(id => parseInt(id));
      
      const entities = await GlobalEntity.findAll({
        where: {
          id: { $in: ids },
          isActive: true
        }
      });

      const comparison = {
        entities: [] as any[],
        metric: metric as string,
        period: period as string,
        benchmark: {
          average: 0,
          median: 0,
          standardDeviation: 0
        },
        rankings: [] as any[]
      };

      const metricValues: number[] = [];

      entities.forEach(entity => {
        // Get the specific metric value
        let metricValue = 0;
        const latestPerformance = entity.performanceData
          .filter(p => p.metric === metric)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (latestPerformance) {
          metricValue = latestPerformance.value;
        } else {
          metricValue = entity.metrics[metric as string] || 0;
        }

        const entityData = {
          id: entity.id,
          name: entity.name,
          entityType: entity.entityType,
          metricValue,
          benchmark: latestPerformance?.benchmark,
          performanceData: entity.performanceData.filter(p => p.metric === metric),
          riskProfile: entity.riskProfile,
          lastUpdated: entity.lastSyncAt
        };

        comparison.entities.push(entityData);
        metricValues.push(metricValue);
      });

      // Calculate benchmark statistics
      if (metricValues.length > 0) {
        comparison.benchmark.average = metricValues.reduce((a, b) => a + b, 0) / metricValues.length;
        
        const sortedValues = [...metricValues].sort((a, b) => a - b);
        const mid = Math.floor(sortedValues.length / 2);
        comparison.benchmark.median = sortedValues.length % 2 === 0
          ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
          : sortedValues[mid];

        const variance = metricValues.reduce((acc, val) => 
          acc + Math.pow(val - comparison.benchmark.average, 2), 0) / metricValues.length;
        comparison.benchmark.standardDeviation = Math.sqrt(variance);
      }

      // Create rankings
      comparison.rankings = comparison.entities
        .sort((a, b) => b.metricValue - a.metricValue)
        .map((entity, index) => ({
          rank: index + 1,
          id: entity.id,
          name: entity.name,
          entityType: entity.entityType,
          metricValue: entity.metricValue,
          percentile: ((comparison.entities.length - index) / comparison.entities.length) * 100
        }));

      res.json({
        success: true,
        data: comparison
      });

    } catch (error) {
      console.error('Error getting performance comparison:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get performance comparison'
      });
    }
  };

  /**
   * Get investor summary across all investments
   */
  getInvestorSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { investorId } = req.params;

      const investorEntity = await GlobalEntity.findByEntityReference('investor', parseInt(investorId));
      
      if (!investorEntity) {
        res.status(404).json({
          success: false,
          error: 'Investor entity not found'
        });
        return;
      }

      // Get all related entities (funds, investments, etc.)
      const relatedEntities = await Promise.all(
        investorEntity.relationships.map(async rel => {
          const entity = await GlobalEntity.findByEntityReference(rel.entityType, rel.entityId);
          return entity ? { ...entity.toJSON(), relationshipType: rel.relationshipType, strength: rel.strength } : null;
        })
      );

      const validRelatedEntities = relatedEntities.filter(e => e !== null);

      const summary = {
        investor: investorEntity.toJSON(),
        portfolio: {
          totalFunds: validRelatedEntities.filter(e => e.entityType === 'fund').length,
          totalInvestments: validRelatedEntities.filter(e => e.entityType === 'investment').length,
          totalCommitments: 0,
          totalDrawdowns: 0,
          totalDistributions: 0,
          totalNAV: 0,
          totalIRR: 0,
          averageMultiple: 0
        },
        riskProfile: investorEntity.riskProfile,
        compliance: investorEntity.compliance,
        relationships: validRelatedEntities.map(e => ({
          entityType: e.entityType,
          entityId: e.entityId,
          name: e.name,
          relationshipType: e.relationshipType,
          strength: e.strength,
          metrics: e.metrics
        })),
        performanceTrends: investorEntity.performanceData
      };

      // Calculate portfolio aggregates
      validRelatedEntities.forEach(entity => {
        if (entity.metrics.totalCommitments) {
          summary.portfolio.totalCommitments += entity.metrics.totalCommitments;
        }
        if (entity.metrics.totalDrawdowns) {
          summary.portfolio.totalDrawdowns += entity.metrics.totalDrawdowns;
        }
        if (entity.metrics.totalDistributions) {
          summary.portfolio.totalDistributions += entity.metrics.totalDistributions;
        }
        if (entity.metrics.nav) {
          summary.portfolio.totalNAV += entity.metrics.nav;
        }
      });

      // Calculate weighted averages
      const fundEntities = validRelatedEntities.filter(e => e.entityType === 'fund');
      if (fundEntities.length > 0) {
        let totalIRR = 0;
        let totalMultiple = 0;
        let count = 0;

        fundEntities.forEach(fund => {
          if (fund.metrics.irr) {
            totalIRR += fund.metrics.irr;
            count++;
          }
          if (fund.metrics.multiple) {
            totalMultiple += fund.metrics.multiple;
          }
        });

        if (count > 0) {
          summary.portfolio.totalIRR = totalIRR / count;
          summary.portfolio.averageMultiple = totalMultiple / count;
        }
      }

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error getting investor summary:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get investor summary'
      });
    }
  };

  /**
   * Get investor portfolio across all funds
   */
  getInvestorPortfolio = async (req: Request, res: Response): Promise<void> => {
    try {
      const { investorId } = req.params;
      const { includeMetrics = 'true' } = req.query;

      const investorEntity = await GlobalEntity.findByEntityReference('investor', parseInt(investorId));
      
      if (!investorEntity) {
        res.status(404).json({
          success: false,
          error: 'Investor entity not found'
        });
        return;
      }

      // Get fund relationships
      const fundRelationships = investorEntity.relationships.filter(rel => rel.entityType === 'fund');
      
      const portfolio = {
        investorId: parseInt(investorId),
        investorName: investorEntity.name,
        funds: [] as any[],
        summary: {
          totalFunds: fundRelationships.length,
          totalCommitments: 0,
          totalDrawdowns: 0,
          totalDistributions: 0,
          totalNAV: 0,
          weightedAverageIRR: 0,
          weightedAverageMultiple: 0
        }
      };

      for (const rel of fundRelationships) {
        const fundEntity = await GlobalEntity.findByEntityReference('fund', rel.entityId);
        if (fundEntity) {
          const fundData = {
            fundId: rel.entityId,
            fundName: fundEntity.name,
            relationshipType: rel.relationshipType,
            relationshipStrength: rel.strength,
            metrics: includeMetrics === 'true' ? fundEntity.metrics : null,
            riskProfile: fundEntity.riskProfile,
            lastUpdated: fundEntity.lastSyncAt
          };

          portfolio.funds.push(fundData);

          // Aggregate summary data
          if (fundEntity.metrics.totalCommitments) {
            portfolio.summary.totalCommitments += fundEntity.metrics.totalCommitments;
          }
          if (fundEntity.metrics.totalDrawdowns) {
            portfolio.summary.totalDrawdowns += fundEntity.metrics.totalDrawdowns;
          }
          if (fundEntity.metrics.totalDistributions) {
            portfolio.summary.totalDistributions += fundEntity.metrics.totalDistributions;
          }
          if (fundEntity.metrics.nav) {
            portfolio.summary.totalNAV += fundEntity.metrics.nav;
          }
        }
      }

      // Calculate weighted averages
      if (portfolio.funds.length > 0) {
        let totalWeightedIRR = 0;
        let totalWeightedMultiple = 0;
        let totalWeight = 0;

        portfolio.funds.forEach(fund => {
          const weight = fund.metrics?.totalCommitments || 1;
          totalWeight += weight;
          
          if (fund.metrics?.irr) {
            totalWeightedIRR += fund.metrics.irr * weight;
          }
          if (fund.metrics?.multiple) {
            totalWeightedMultiple += fund.metrics.multiple * weight;
          }
        });

        if (totalWeight > 0) {
          portfolio.summary.weightedAverageIRR = totalWeightedIRR / totalWeight;
          portfolio.summary.weightedAverageMultiple = totalWeightedMultiple / totalWeight;
        }
      }

      res.json({
        success: true,
        data: portfolio
      });

    } catch (error) {
      console.error('Error getting investor portfolio:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get investor portfolio'
      });
    }
  };

  /**
   * Get fund summary with all related entities
   */
  getFundSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;

      const fundEntity = await GlobalEntity.findByEntityReference('fund', parseInt(fundId));
      
      if (!fundEntity) {
        res.status(404).json({
          success: false,
          error: 'Fund entity not found'
        });
        return;
      }

      const summary = await this.buildFundSummary(fundEntity);

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error getting fund summary:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get fund summary'
      });
    }
  };

  /**
   * Get fund investor base
   */
  getFundInvestorBase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;

      const fundEntity = await GlobalEntity.findByEntityReference('fund', parseInt(fundId));
      
      if (!fundEntity) {
        res.status(404).json({
          success: false,
          error: 'Fund entity not found'
        });
        return;
      }

      // Get investor relationships
      const investorRelationships = fundEntity.relationships.filter(rel => rel.entityType === 'investor');
      
      const investorBase = {
        fundId: parseInt(fundId),
        fundName: fundEntity.name,
        totalInvestors: investorRelationships.length,
        investors: [] as any[],
        diversification: {
          byType: {} as Record<string, number>,
          byRegion: {} as Record<string, number>,
          bySize: {} as Record<string, number>
        }
      };

      for (const rel of investorRelationships) {
        const investorEntity = await GlobalEntity.findByEntityReference('investor', rel.entityId);
        if (investorEntity) {
          const investorData = {
            investorId: rel.entityId,
            investorName: investorEntity.name,
            relationshipType: rel.relationshipType,
            relationshipStrength: rel.strength,
            commitment: investorEntity.metrics.totalCommitments,
            drawdowns: investorEntity.metrics.totalDrawdowns,
            distributions: investorEntity.metrics.totalDistributions,
            riskProfile: investorEntity.riskProfile,
            complianceStatus: investorEntity.compliance.status,
            tags: investorEntity.tags
          };

          investorBase.investors.push(investorData);

          // Build diversification metrics
          investorEntity.tags.forEach(tag => {
            if (tag.startsWith('type:')) {
              const type = tag.substring(5);
              investorBase.diversification.byType[type] = (investorBase.diversification.byType[type] || 0) + 1;
            }
            if (tag.startsWith('region:')) {
              const region = tag.substring(7);
              investorBase.diversification.byRegion[region] = (investorBase.diversification.byRegion[region] || 0) + 1;
            }
            if (tag.startsWith('size:')) {
              const size = tag.substring(5);
              investorBase.diversification.bySize[size] = (investorBase.diversification.bySize[size] || 0) + 1;
            }
          });
        }
      }

      // Sort investors by commitment size
      investorBase.investors.sort((a, b) => (b.commitment || 0) - (a.commitment || 0));

      res.json({
        success: true,
        data: investorBase
      });

    } catch (error) {
      console.error('Error getting fund investor base:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get fund investor base'
      });
    }
  };

  /**
   * Get investment summary
   */
  getInvestmentSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { investmentId } = req.params;

      const investmentEntity = await GlobalEntity.findByEntityReference('investment', parseInt(investmentId));
      
      if (!investmentEntity) {
        res.status(404).json({
          success: false,
          error: 'Investment entity not found'
        });
        return;
      }

      // Get related entities
      const relatedEntities = await Promise.all(
        investmentEntity.relationships.map(async rel => {
          const entity = await GlobalEntity.findByEntityReference(rel.entityType, rel.entityId);
          return entity ? { ...entity.toJSON(), relationshipType: rel.relationshipType, strength: rel.strength } : null;
        })
      );

      const validRelatedEntities = relatedEntities.filter(e => e !== null);

      const summary = {
        investment: investmentEntity.toJSON(),
        relatedFunds: validRelatedEntities.filter(e => e.entityType === 'fund'),
        relatedInvestors: validRelatedEntities.filter(e => e.entityType === 'investor'),
        transactions: validRelatedEntities.filter(e => e.entityType === 'transaction'),
        performanceMetrics: investmentEntity.metrics,
        riskProfile: investmentEntity.riskProfile,
        complianceStatus: investmentEntity.compliance,
        performanceHistory: investmentEntity.performanceData
      };

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error getting investment summary:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get investment summary'
      });
    }
  };

  // Helper methods
  private calculateCorrelation(data1: any[], data2: any[], metric: string): number {
    // Simple correlation calculation
    const values1 = data1.filter(d => d.metric === metric).map(d => d.value);
    const values2 = data2.filter(d => d.metric === metric).map(d => d.value);
    
    if (values1.length < 2 || values2.length < 2) return 0;
    
    const minLength = Math.min(values1.length, values2.length);
    const trimmed1 = values1.slice(0, minLength);
    const trimmed2 = values2.slice(0, minLength);
    
    const mean1 = trimmed1.reduce((a, b) => a + b, 0) / trimmed1.length;
    const mean2 = trimmed2.reduce((a, b) => a + b, 0) / trimmed2.length;
    
    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;
    
    for (let i = 0; i < minLength; i++) {
      const diff1 = trimmed1[i] - mean1;
      const diff2 = trimmed2[i] - mean2;
      numerator += diff1 * diff2;
      sum1 += diff1 * diff1;
      sum2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private async buildFundSummary(fundEntity: any): Promise<any> {
    const relatedEntities = await Promise.all(
      fundEntity.relationships.map(async (rel: any) => {
        const entity = await GlobalEntity.findByEntityReference(rel.entityType, rel.entityId);
        return entity ? { ...entity.toJSON(), relationshipType: rel.relationshipType, strength: rel.strength } : null;
      })
    );

    const validRelatedEntities = relatedEntities.filter(e => e !== null);

    return {
      fund: fundEntity.toJSON(),
      investors: validRelatedEntities.filter(e => e.entityType === 'investor'),
      investments: validRelatedEntities.filter(e => e.entityType === 'investment'),
      transactions: validRelatedEntities.filter(e => e.entityType === 'transaction'),
      metrics: fundEntity.metrics,
      riskProfile: fundEntity.riskProfile,
      complianceStatus: fundEntity.compliance,
      performanceHistory: fundEntity.performanceData,
      diversification: this.calculateDiversification(validRelatedEntities)
    };
  }

  private calculateDiversification(entities: any[]): any {
    const diversification = {
      geographic: {} as Record<string, number>,
      sector: {} as Record<string, number>,
      assetClass: {} as Record<string, number>,
      vintage: {} as Record<string, number>
    };

    entities.forEach(entity => {
      entity.tags.forEach((tag: string) => {
        if (tag.startsWith('geo:')) {
          const geo = tag.substring(4);
          diversification.geographic[geo] = (diversification.geographic[geo] || 0) + 1;
        }
        if (tag.startsWith('sector:')) {
          const sector = tag.substring(7);
          diversification.sector[sector] = (diversification.sector[sector] || 0) + 1;
        }
        if (tag.startsWith('asset:')) {
          const asset = tag.substring(6);
          diversification.assetClass[asset] = (diversification.assetClass[asset] || 0) + 1;
        }
        if (tag.startsWith('vintage:')) {
          const vintage = tag.substring(8);
          diversification.vintage[vintage] = (diversification.vintage[vintage] || 0) + 1;
        }
      });
    });

    return diversification;
  }
}