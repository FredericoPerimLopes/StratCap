import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import PerformanceAnalyticsService from '../services/PerformanceAnalyticsService';
import CashFlowAnalyticsService from '../services/CashFlowAnalyticsService';
import HypotheticalScenarioService from '../services/HypotheticalScenarioService';
import InvestorStatementService from '../services/InvestorStatementService';
import ExportService from '../services/ExportService';

export class AnalyticsController {

  /**
   * Get comprehensive fund performance analytics
   */
  async getFundPerformanceAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { asOfDate, includeUnrealized, benchmarkType } = req.query;

      const asOf = asOfDate ? new Date(asOfDate as string) : undefined;
      const includeUnreal = includeUnrealized === 'true';

      // Get performance metrics
      const performanceMetrics = await PerformanceAnalyticsService.calculateFundPerformance(
        fundId,
        asOf,
        includeUnreal
      );

      // Get time-weighted returns
      const timeWeightedReturns = await PerformanceAnalyticsService.calculateTimeWeightedReturns(
        fundId,
        new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000), // 3 years ago
        asOf || new Date(),
        'monthly'
      );

      // Get rolling performance
      const rollingPerformance = await PerformanceAnalyticsService.calculateRollingPerformance(
        fundId,
        12, // 12-month rolling windows
        asOf
      );

      // Get benchmark comparison if requested
      let benchmarkComparison = null;
      if (benchmarkType) {
        benchmarkComparison = await PerformanceAnalyticsService.compareToBenchmark(
          fundId,
          benchmarkType as 'sp500' | 'nasdaq' | 'custom',
          undefined,
          asOf
        );
      }

      res.status(200).json({
        success: true,
        data: {
          fundId,
          asOfDate: asOf?.toISOString() || new Date().toISOString(),
          performanceMetrics,
          timeWeightedReturns,
          rollingPerformance,
          benchmarkComparison
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get investor performance analytics
   */
  async getInvestorPerformanceAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { investorId } = req.params;
      const { fundId, asOfDate } = req.query;

      const asOf = asOfDate ? new Date(asOfDate as string) : undefined;

      const performanceMetrics = await PerformanceAnalyticsService.calculateInvestorPerformance(
        investorId,
        fundId as string,
        asOf
      );

      res.status(200).json({
        success: true,
        data: {
          investorId,
          fundId,
          asOfDate: asOf?.toISOString() || new Date().toISOString(),
          performanceMetrics
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comprehensive cash flow analytics
   */
  async getCashFlowAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { startDate, endDate, includeProjections } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const includeProj = includeProjections !== 'false';

      const cashFlowAnalysis = await CashFlowAnalyticsService.analyzeFundCashFlows(
        fundId,
        start,
        end,
        includeProj
      );

      res.status(200).json({
        success: true,
        data: {
          fundId,
          analysisParameters: {
            startDate: start?.toISOString(),
            endDate: end?.toISOString(),
            includeProjections: includeProj
          },
          ...cashFlowAnalysis
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get investor cash flow analytics
   */
  async getInvestorCashFlowAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { investorId } = req.params;
      const { fundId, asOfDate } = req.query;

      const asOf = asOfDate ? new Date(asOfDate as string) : undefined;

      const cashFlowAnalysis = await CashFlowAnalyticsService.analyzeInvestorCashFlows(
        investorId,
        fundId as string,
        asOf
      );

      res.status(200).json({
        success: true,
        data: {
          investorId,
          fundId,
          asOfDate: asOf?.toISOString() || new Date().toISOString(),
          ...cashFlowAnalysis
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get waterfall cash flow analysis
   */
  async getWaterfallCashFlowAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { distributionEventId, asOfDate } = req.query;

      const asOf = asOfDate ? new Date(asOfDate as string) : undefined;

      const waterfallAnalysis = await CashFlowAnalyticsService.analyzeWaterfallCashFlows(
        fundId,
        distributionEventId as string,
        asOf
      );

      res.status(200).json({
        success: true,
        data: {
          fundId,
          distributionEventId,
          asOfDate: asOf?.toISOString() || new Date().toISOString(),
          waterfallTiers: waterfallAnalysis
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create hypothetical scenario
   */
  async createHypotheticalScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { scenarioName, assumptions } = req.body;

      if (!scenarioName || !assumptions) {
        throw new AppError('Scenario name and assumptions are required', 400);
      }

      const scenario = await HypotheticalScenarioService.createScenario(
        fundId,
        scenarioName,
        assumptions
      );

      res.status(201).json({
        success: true,
        data: scenario
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Compare multiple scenarios
   */
  async compareScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scenarios } = req.body;

      if (!Array.isArray(scenarios) || scenarios.length < 2) {
        throw new AppError('At least 2 scenarios are required for comparison', 400);
      }

      const comparison = await HypotheticalScenarioService.compareScenarios(scenarios);

      res.status(200).json({
        success: true,
        data: comparison
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run Monte Carlo simulation
   */
  async runMonteCarloSimulation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { baseAssumptions, parameters } = req.body;

      if (!baseAssumptions || !parameters) {
        throw new AppError('Base assumptions and simulation parameters are required', 400);
      }

      const simulationResults = await HypotheticalScenarioService.runMonteCarloSimulation(
        fundId,
        baseAssumptions,
        parameters
      );

      res.status(200).json({
        success: true,
        data: {
          fundId,
          simulationParameters: parameters,
          ...simulationResults
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create portfolio scenario
   */
  async createPortfolioScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { portfolioName, fundAllocations, correlationAssumptions } = req.body;

      if (!portfolioName || !Array.isArray(fundAllocations)) {
        throw new AppError('Portfolio name and fund allocations are required', 400);
      }

      const portfolioScenario = await HypotheticalScenarioService.createPortfolioScenario(
        portfolioName,
        fundAllocations,
        correlationAssumptions
      );

      res.status(201).json({
        success: true,
        data: portfolioScenario
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run stress test scenarios
   */
  async runStressTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { baseAssumptions, stressScenarios } = req.body;

      if (!baseAssumptions || !Array.isArray(stressScenarios)) {
        throw new AppError('Base assumptions and stress scenarios are required', 400);
      }

      const stressTestResults = await HypotheticalScenarioService.runStressTest(
        fundId,
        baseAssumptions,
        stressScenarios
      );

      res.status(200).json({
        success: true,
        data: {
          fundId,
          baseAssumptions,
          stressTestResults
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate investor statement
   */
  async generateInvestorStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { investorId, fundId } = req.params;
      const { startDate, endDate, includeAttachments } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', 400);
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const includeAttach = includeAttachments === 'true';

      const statement = await InvestorStatementService.generateInvestorStatement(
        investorId,
        fundId,
        start,
        end,
        includeAttach
      );

      res.status(200).json({
        success: true,
        data: statement
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate capital account statement
   */
  async generateCapitalAccountStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { investorId, fundId } = req.params;
      const { asOfDate } = req.query;

      const asOf = asOfDate ? new Date(asOfDate as string) : new Date();

      const statement = await InvestorStatementService.generateCapitalAccountStatement(
        investorId,
        fundId,
        asOf
      );

      res.status(200).json({
        success: true,
        data: statement
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate quarterly statements for all investors
   */
  async generateQuarterlyStatements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { quarterEndDate, includeAttachments, emailDelivery } = req.body;

      if (!quarterEndDate) {
        throw new AppError('Quarter end date is required', 400);
      }

      const quarterEnd = new Date(quarterEndDate);
      const options = {
        includeAttachments: includeAttachments === true,
        emailDelivery: emailDelivery === true
      };

      const statements = await InvestorStatementService.generateQuarterlyStatements(
        fundId,
        quarterEnd,
        options
      );

      res.status(200).json({
        success: true,
        data: {
          fundId,
          quarterEndDate: quarterEnd.toISOString(),
          statementsGenerated: statements.length,
          statements
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate annual tax package
   */
  async generateAnnualTaxPackage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { investorId, fundId } = req.params;
      const { taxYear } = req.query;

      if (!taxYear) {
        throw new AppError('Tax year is required', 400);
      }

      const year = parseInt(taxYear as string);
      const taxPackage = await InvestorStatementService.generateAnnualTaxPackage(
        investorId,
        fundId,
        year
      );

      res.status(200).json({
        success: true,
        data: {
          investorId,
          fundId,
          taxYear: year,
          ...taxPackage
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export fund performance data
   */
  async exportFundPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { format, includeHeaders, customColumns } = req.query;

      const validFormats = ['csv', 'excel', 'pdf', 'json'] as const;
      const selectedFormat = validFormats.includes(format as any) ? format as 'csv' | 'excel' | 'pdf' | 'json' : 'excel';
      
      const options = {
        format: selectedFormat,
        includeHeaders: includeHeaders !== 'false',
        customColumns: customColumns ? (customColumns as string).split(',') : undefined
      };

      const exportResult = await ExportService.exportFundPerformance(fundId, options);

      res.status(200).json({
        success: true,
        data: {
          fundId,
          exportFormat: options.format,
          ...exportResult
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export investor portfolio data
   */
  async exportInvestorPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { investorId } = req.params;
      const { format, includeHeaders } = req.query;

      const validFormats = ['csv', 'excel', 'pdf', 'json'] as const;
      const selectedFormat = validFormats.includes(format as any) ? format as 'csv' | 'excel' | 'pdf' | 'json' : 'excel';

      const options = {
        format: selectedFormat,
        includeHeaders: includeHeaders !== 'false'
      };

      const exportResult = await ExportService.exportInvestorPortfolio(investorId, options);

      res.status(200).json({
        success: true,
        data: {
          investorId,
          exportFormat: options.format,
          ...exportResult
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export capital activity report
   */
  async exportCapitalActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId, startDate, endDate, format } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const validFormats = ['csv', 'excel', 'pdf', 'json'] as const;
      const selectedFormat = validFormats.includes(format as any) ? format as 'csv' | 'excel' | 'pdf' | 'json' : 'excel';
      
      const options = {
        format: selectedFormat
      };

      const exportResult = await ExportService.exportCapitalActivity(
        fundId as string,
        start,
        end,
        options
      );

      res.status(200).json({
        success: true,
        data: {
          fundId,
          dateRange: {
            startDate: start?.toISOString(),
            endDate: end?.toISOString()
          },
          exportFormat: options.format,
          ...exportResult
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export fee calculations
   */
  async exportFeeCalculations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId, startDate, endDate, format } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const validFormats = ['csv', 'excel', 'pdf', 'json'] as const;
      const selectedFormat = validFormats.includes(format as any) ? format as 'csv' | 'excel' | 'pdf' | 'json' : 'excel';
      
      const options = {
        format: selectedFormat
      };

      const exportResult = await ExportService.exportFeeCalculations(
        fundId as string,
        start,
        end,
        options
      );

      res.status(200).json({
        success: true,
        data: {
          fundId,
          dateRange: {
            startDate: start?.toISOString(),
            endDate: end?.toISOString()
          },
          exportFormat: options.format,
          ...exportResult
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create pivot table
   */
  async createPivotTable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dataSource, config, format } = req.body;

      if (!dataSource || !config) {
        throw new AppError('Data source and pivot configuration are required', 400);
      }

      const options = {
        format: format || 'excel'
      };

      const exportResult = await ExportService.createPivotTable(dataSource, config, options);

      res.status(200).json({
        success: true,
        data: {
          dataSource,
          pivotConfig: config,
          exportFormat: options.format,
          ...exportResult
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build custom report
   */
  async buildCustomReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportConfig, format } = req.body;

      if (!reportConfig) {
        throw new AppError('Report configuration is required', 400);
      }

      const options = {
        format: format || 'excel'
      };

      const exportResult = await ExportService.buildCustomReport(reportConfig, options);

      res.status(200).json({
        success: true,
        data: {
          reportName: reportConfig.name,
          exportFormat: options.format,
          ...exportResult
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export data visualization
   */
  async exportDataVisualization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { chartType, format } = req.query;

      if (!chartType) {
        throw new AppError('Chart type is required', 400);
      }

      const exportResult = await ExportService.exportDataVisualization(
        chartType as 'fund_performance' | 'cash_flow' | 'investor_allocation',
        fundId,
        (format as 'png' | 'svg' | 'pdf') || 'png'
      );

      res.status(200).json({
        success: true,
        data: {
          fundId,
          chartType,
          exportFormat: format || 'png',
          ...exportResult
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get analytics dashboard data
   */
  async getAnalyticsDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fundId } = req.params;
      const { timeframe } = req.query;

      // Get performance metrics
      const performanceMetrics = await PerformanceAnalyticsService.calculateFundPerformance(fundId);

      // Get cash flow summary
      const cashFlowAnalysis = await CashFlowAnalyticsService.analyzeFundCashFlows(
        fundId,
        undefined,
        undefined,
        false
      );

      // Get recent activity summary (placeholder)
      const recentActivity = {
        capitalCalls: 0,
        distributions: 0,
        transactions: 0
      };

      res.status(200).json({
        success: true,
        data: {
          fundId,
          timeframe: timeframe || 'ytd',
          performanceMetrics,
          cashFlowSummary: cashFlowAnalysis.summary,
          liquidityAnalysis: cashFlowAnalysis.liquidityAnalysis,
          recentActivity,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();