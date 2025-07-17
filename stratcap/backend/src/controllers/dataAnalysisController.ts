import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DataAnalysisService, PivotTableConfig, PivotFilter, ExportOptions } from '../services/DataAnalysisService';

export class DataAnalysisController {
  private dataAnalysisService: DataAnalysisService;

  constructor() {
    this.dataAnalysisService = new DataAnalysisService();
  }

  /**
   * Create a new pivot table configuration
   */
  createPivotTable = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const config = {
        name: req.body.name,
        description: req.body.description,
        dataSource: req.body.dataSource,
        customQuery: req.body.customQuery,
        dimensions: req.body.dimensions,
        measures: req.body.measures,
        filters: req.body.filters || [],
        sorting: req.body.sorting || [],
        formatting: req.body.formatting,
        createdBy: req.user?.id?.toString() || 'unknown',
      };

      const pivotTable = await this.dataAnalysisService.createPivotTable(config);

      res.status(201).json({
        success: true,
        data: pivotTable,
        message: 'Pivot table configuration created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Execute a pivot table
   */
  executePivotTable = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const configId = req.params.configId;
      const runtimeFilters = req.body.filters as PivotFilter[] | undefined;

      const result = await this.dataAnalysisService.executePivotTable(configId, runtimeFilters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get data source schema information
   */
  getDataSourceSchema = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const dataSource = req.params.dataSource;
      const schema = await this.dataAnalysisService.getDataSourceSchema(dataSource);

      res.json({
        success: true,
        data: schema,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Create a custom report
   */
  createCustomReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const report = {
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        sections: req.body.sections,
        parameters: req.body.parameters || [],
        schedule: req.body.schedule,
        distribution: req.body.distribution,
        createdBy: req.user?.id?.toString() || 'unknown',
      };

      const customReport = await this.dataAnalysisService.createCustomReport(report);

      res.status(201).json({
        success: true,
        data: customReport,
        message: 'Custom report created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Execute a custom report
   */
  executeCustomReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const reportId = req.params.reportId;
      const parameters = req.body.parameters;

      const result = await this.dataAnalysisService.executeCustomReport(reportId, parameters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Export data in various formats
   */
  exportData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const dataSource = req.params.dataSource;
      const options: ExportOptions = {
        format: req.body.format || 'csv',
        filename: req.body.filename,
        includeHeaders: req.body.includeHeaders !== false,
        includeFormatting: req.body.includeFormatting || false,
        includeCharts: req.body.includeCharts || false,
        dateRange: req.body.dateRange,
        filters: req.body.filters,
        compress: req.body.compress || false,
      };
      const filters = req.body.filters;

      const exportResult = await this.dataAnalysisService.exportData(dataSource, options, filters);

      // Set appropriate headers for file download
      res.set({
        'Content-Type': exportResult.mimeType,
        'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
        'Content-Length': exportResult.size.toString(),
      });

      res.send(exportResult.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get predefined analysis templates
   */
  getAnalysisTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const category = req.query.category as string;
      const type = req.query.type as string;

      let templates = await this.dataAnalysisService.getAnalysisTemplates();

      // Filter by category if specified
      if (category) {
        templates = templates.filter(template => template.category === category);
      }

      // Filter by type if specified
      if (type) {
        templates = templates.filter(template => template.type === type);
      }

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get available data sources
   */
  getDataSources = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const dataSources = [
        {
          id: 'funds',
          name: 'Funds',
          description: 'Fund entities and their properties',
          recordCount: 0, // Would be calculated from actual data
          lastUpdated: new Date(),
        },
        {
          id: 'investors',
          name: 'Investors',
          description: 'Investor entities and their information',
          recordCount: 0,
          lastUpdated: new Date(),
        },
        {
          id: 'investments',
          name: 'Investments',
          description: 'Portfolio company investments',
          recordCount: 0,
          lastUpdated: new Date(),
        },
        {
          id: 'commitments',
          name: 'Commitments',
          description: 'Investor commitments to funds',
          recordCount: 0,
          lastUpdated: new Date(),
        },
        {
          id: 'capital_activities',
          name: 'Capital Activities',
          description: 'Capital calls and distributions',
          recordCount: 0,
          lastUpdated: new Date(),
        },
      ];

      res.json({
        success: true,
        data: dataSources,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Preview data from a data source
   */
  previewData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const dataSource = req.params.dataSource;
      const limit = parseInt(req.query.limit as string) || 10;

      // Get a preview of the data (first N records)
      const previewData = await this.dataAnalysisService.exportData(
        dataSource,
        {
          format: 'json',
          includeHeaders: true,
          includeFormatting: false,
          includeCharts: false,
        },
        []
      );

      // Parse the JSON and limit results
      const data = JSON.parse(previewData.data.toString());
      const limitedData = data.slice(0, limit);

      res.json({
        success: true,
        data: {
          preview: limitedData,
          totalRecords: data.length,
          previewLimit: limit,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Execute template-based analysis
   */
  executeTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const templateId = req.params.templateId;
      const runtimeFilters = req.body.filters as PivotFilter[] | undefined;

      // Get the template and execute it as a pivot table
      const result = await this.dataAnalysisService.executePivotTable(templateId, runtimeFilters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Validate pivot table configuration
   */
  validatePivotConfig = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const config = req.body as Omit<PivotTableConfig, 'id' | 'createdAt' | 'updatedAt'>;
      
      // Basic validation
      const errors: string[] = [];

      if (!config.name || config.name.trim().length === 0) {
        errors.push('Name is required');
      }

      if (!config.dataSource) {
        errors.push('Data source is required');
      }

      if (!config.dimensions || config.dimensions.length === 0) {
        errors.push('At least one dimension is required');
      }

      if (!config.measures || config.measures.length === 0) {
        errors.push('At least one measure is required');
      }

      // Validate data source exists
      try {
        await this.dataAnalysisService.getDataSourceSchema(config.dataSource);
      } catch (error) {
        errors.push(`Invalid data source: ${config.dataSource}`);
      }

      const isValid = errors.length === 0;

      res.json({
        success: true,
        data: {
          isValid,
          errors,
          warnings: [], // Could add warnings for best practices
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get aggregation functions available for measures
   */
  getAggregationFunctions = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const functions = [
        {
          id: 'sum',
          name: 'Sum',
          description: 'Calculate the sum of all values',
          applicableTypes: ['number'],
        },
        {
          id: 'avg',
          name: 'Average',
          description: 'Calculate the average of all values',
          applicableTypes: ['number'],
        },
        {
          id: 'count',
          name: 'Count',
          description: 'Count the number of records',
          applicableTypes: ['string', 'number', 'date', 'boolean'],
        },
        {
          id: 'min',
          name: 'Minimum',
          description: 'Find the minimum value',
          applicableTypes: ['number', 'date'],
        },
        {
          id: 'max',
          name: 'Maximum',
          description: 'Find the maximum value',
          applicableTypes: ['number', 'date'],
        },
        {
          id: 'stddev',
          name: 'Standard Deviation',
          description: 'Calculate the standard deviation',
          applicableTypes: ['number'],
        },
        {
          id: 'custom',
          name: 'Custom Formula',
          description: 'Use a custom formula',
          applicableTypes: ['number'],
        },
      ];

      res.json({
        success: true,
        data: functions,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };
}