import { QueryTypes, Op } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';
import { Fund } from '../models/Fund';
import { InvestorEntity } from '../models/InvestorEntity';
import { Investment } from '../models/Investment';
import { Commitment } from '../models/Commitment';
import { CapitalActivity } from '../models/CapitalActivity';

export interface PivotTableConfig {
  id: string;
  name: string;
  description?: string;
  dataSource: 'funds' | 'investors' | 'investments' | 'commitments' | 'capital_activities' | 'custom_query';
  customQuery?: string;
  dimensions: PivotDimension[];
  measures: PivotMeasure[];
  filters: PivotFilter[];
  sorting: PivotSort[];
  formatting: PivotFormatting;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PivotDimension {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  groupBy?: 'year' | 'quarter' | 'month' | 'day' | 'range';
  customGroups?: { [key: string]: any[] };
}

export interface PivotMeasure {
  field: string;
  label: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'stddev' | 'custom';
  customFormula?: string;
  formatType: 'number' | 'currency' | 'percentage' | 'date';
  decimalPlaces?: number;
}

export interface PivotFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with';
  value: any;
  values?: any[];
}

export interface PivotSort {
  field: string;
  direction: 'asc' | 'desc';
  type: 'dimension' | 'measure';
}

export interface PivotFormatting {
  showTotals: boolean;
  showSubtotals: boolean;
  showPercentages: boolean;
  conditionalFormatting?: ConditionalFormat[];
  theme: 'default' | 'compact' | 'striped' | 'bordered';
}

export interface ConditionalFormat {
  field: string;
  condition: 'greater_than' | 'less_than' | 'between' | 'equal_to';
  value: number;
  value2?: number;
  format: {
    backgroundColor?: string;
    textColor?: string;
    fontWeight?: 'normal' | 'bold';
    icon?: string;
  };
}

export interface PivotTableResult {
  config: PivotTableConfig;
  data: PivotTableData;
  metadata: {
    totalRows: number;
    executionTime: number;
    generatedAt: Date;
    dataFreshness: Date;
  };
}

export interface PivotTableData {
  headers: PivotHeader[];
  rows: PivotRow[];
  totals?: PivotRow;
  subtotals?: { [key: string]: PivotRow };
}

export interface PivotHeader {
  field: string;
  label: string;
  type: 'dimension' | 'measure';
  width?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface PivotRow {
  id: string;
  cells: PivotCell[];
  level?: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
}

export interface PivotCell {
  value: any;
  formattedValue: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  rawValue?: any;
  metadata?: {
    conditionalFormat?: ConditionalFormat;
    drillDown?: any;
  };
}

export interface CustomReport {
  id: string;
  name: string;
  description?: string;
  type: 'dashboard' | 'detailed' | 'summary' | 'regulatory';
  sections: ReportSection[];
  parameters: ReportParameter[];
  schedule?: ReportSchedule;
  distribution: ReportDistribution;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'table' | 'chart' | 'text' | 'pivot' | 'kpi' | 'image';
  position: { row: number; col: number; rowSpan?: number; colSpan?: number };
  config: any; // Section-specific configuration
  dataSource?: string;
  refreshRate?: number; // seconds
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  defaultValue?: any;
  options?: { value: any; label: string }[];
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  time?: string; // HH:MM format
  dayOfWeek?: number; // 0-6, 0 = Sunday
  dayOfMonth?: number; // 1-31
  timezone: string;
}

export interface ReportDistribution {
  emails: string[];
  formats: ('pdf' | 'excel' | 'csv' | 'html')[];
  includeData: boolean;
  includeCharts: boolean;
}

export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf' | 'json';
  filename?: string;
  includeHeaders: boolean;
  includeFormatting: boolean;
  includeCharts: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: any;
  compress?: boolean;
}

export class DataAnalysisService {

  /**
   * Create a new pivot table configuration
   */
  async createPivotTable(config: Omit<PivotTableConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<PivotTableConfig> {
    const pivotConfig: PivotTableConfig = {
      ...config,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store pivot configuration (would normally save to database)
    // For now, just return the config
    return pivotConfig;
  }

  /**
   * Execute a pivot table and return results
   */
  async executePivotTable(configId: string, runtimeFilters?: PivotFilter[]): Promise<PivotTableResult> {
    const startTime = Date.now();
    
    // Get pivot configuration (would normally load from database)
    const config = await this.getPivotTableConfig(configId);
    
    // Merge runtime filters with config filters
    const allFilters = [...config.filters, ...(runtimeFilters || [])];
    
    // Build and execute query
    const query = this.buildPivotQuery(config, allFilters);
    const rawData = await sequelize.query(query, { type: QueryTypes.SELECT });
    
    // Process and format data
    const pivotData = this.processPivotData(rawData, config);
    
    const executionTime = Date.now() - startTime;
    
    return {
      config,
      data: pivotData,
      metadata: {
        totalRows: pivotData.rows.length,
        executionTime,
        generatedAt: new Date(),
        dataFreshness: new Date(), // Would be based on source data timestamps
      },
    };
  }

  /**
   * Get available data sources and their schemas
   */
  async getDataSourceSchema(dataSource: string): Promise<{
    fields: Array<{
      name: string;
      label: string;
      type: 'string' | 'number' | 'date' | 'boolean';
      aggregatable: boolean;
      filterable: boolean;
      sortable: boolean;
    }>;
    relationships: Array<{
      table: string;
      field: string;
      relatedTable: string;
      relatedField: string;
    }>;
  }> {
    const schemas: Record<string, any> = {
      funds: {
        fields: [
          { name: 'id', label: 'Fund ID', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'name', label: 'Fund Name', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'vintage', label: 'Vintage Year', type: 'number', aggregatable: true, filterable: true, sortable: true },
          { name: 'targetSize', label: 'Target Size', type: 'number', aggregatable: true, filterable: true, sortable: true },
          { name: 'type', label: 'Fund Type', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'status', label: 'Status', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'managementFeeRate', label: 'Management Fee Rate', type: 'number', aggregatable: true, filterable: true, sortable: true },
          { name: 'carriedInterestRate', label: 'Carried Interest Rate', type: 'number', aggregatable: true, filterable: true, sortable: true },
          { name: 'createdAt', label: 'Created Date', type: 'date', aggregatable: false, filterable: true, sortable: true },
        ],
        relationships: [
          { table: 'funds', field: 'fundFamilyId', relatedTable: 'fund_families', relatedField: 'id' },
        ],
      },
      investors: {
        fields: [
          { name: 'id', label: 'Investor ID', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'name', label: 'Investor Name', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'entityType', label: 'Entity Type', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'geography', label: 'Geography', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'sector', label: 'Sector', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'riskProfile', label: 'Risk Profile', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'status', label: 'Status', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'createdAt', label: 'Created Date', type: 'date', aggregatable: false, filterable: true, sortable: true },
        ],
        relationships: [],
      },
      commitments: {
        fields: [
          { name: 'id', label: 'Commitment ID', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'commitmentAmount', label: 'Commitment Amount', type: 'number', aggregatable: true, filterable: true, sortable: true },
          { name: 'contributedAmount', label: 'Contributed Amount', type: 'number', aggregatable: true, filterable: true, sortable: true },
          { name: 'distributedAmount', label: 'Distributed Amount', type: 'number', aggregatable: true, filterable: true, sortable: true },
          { name: 'currentNav', label: 'Current NAV', type: 'number', aggregatable: true, filterable: true, sortable: true },
          { name: 'status', label: 'Status', type: 'string', aggregatable: false, filterable: true, sortable: true },
          { name: 'createdAt', label: 'Created Date', type: 'date', aggregatable: false, filterable: true, sortable: true },
        ],
        relationships: [
          { table: 'commitments', field: 'fundId', relatedTable: 'funds', relatedField: 'id' },
          { table: 'commitments', field: 'investorId', relatedTable: 'investors', relatedField: 'id' },
        ],
      },
    };

    return schemas[dataSource] || { fields: [], relationships: [] };
  }

  /**
   * Create a custom report
   */
  async createCustomReport(report: Omit<CustomReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomReport> {
    const customReport: CustomReport = {
      ...report,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store report configuration (would normally save to database)
    return customReport;
  }

  /**
   * Execute a custom report
   */
  async executeCustomReport(reportId: string, parameters?: Record<string, any>): Promise<{
    report: CustomReport;
    sections: Array<{
      id: string;
      title: string;
      type: string;
      data: any;
      chart?: any;
    }>;
    metadata: {
      executionTime: number;
      generatedAt: Date;
      parameters: Record<string, any>;
    };
  }> {
    const startTime = Date.now();
    
    // Get report configuration
    const report = await this.getCustomReport(reportId);
    
    // Execute each section
    const sectionResults = [];
    for (const section of report.sections) {
      const sectionData = await this.executeReportSection(section, parameters || {});
      sectionResults.push({
        id: section.id,
        title: section.title,
        type: section.type,
        data: sectionData,
        chart: section.type === 'chart' ? this.generateChartConfig(section, sectionData) : undefined,
      });
    }

    const executionTime = Date.now() - startTime;

    return {
      report,
      sections: sectionResults,
      metadata: {
        executionTime,
        generatedAt: new Date(),
        parameters: parameters || {},
      },
    };
  }

  /**
   * Export data in various formats
   */
  async exportData(
    dataSource: string, 
    options: ExportOptions, 
    filters?: any[]
  ): Promise<{
    filename: string;
    mimeType: string;
    data: Buffer;
    size: number;
  }> {
    // Get data based on source and filters
    const data = await this.getExportData(dataSource, filters, options);
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = options.filename || `${dataSource}_export_${timestamp}.${options.format}`;

    let exportData: Buffer;
    let mimeType: string;

    switch (options.format) {
      case 'csv':
        exportData = this.generateCSV(data, options);
        mimeType = 'text/csv';
        break;
      case 'excel':
        exportData = await this.generateExcel(data, options);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        exportData = await this.generatePDF(data, options);
        mimeType = 'application/pdf';
        break;
      case 'json':
        exportData = Buffer.from(JSON.stringify(data, null, 2));
        mimeType = 'application/json';
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    return {
      filename,
      mimeType,
      data: exportData,
      size: exportData.length,
    };
  }

  /**
   * Get predefined analysis templates
   */
  async getAnalysisTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: 'performance' | 'risk' | 'compliance' | 'operations' | 'custom';
    type: 'pivot' | 'report' | 'dashboard';
    config: any;
  }>> {
    return [
      {
        id: 'fund-performance-summary',
        name: 'Fund Performance Summary',
        description: 'Comprehensive fund performance metrics across all vintages',
        category: 'performance',
        type: 'pivot',
        config: {
          dataSource: 'funds',
          dimensions: [
            { field: 'vintage', label: 'Vintage Year', type: 'number' },
            { field: 'type', label: 'Fund Type', type: 'string' }
          ],
          measures: [
            { field: 'targetSize', label: 'Target Size', aggregation: 'sum', formatType: 'currency' },
            { field: 'managementFeeRate', label: 'Avg Mgmt Fee', aggregation: 'avg', formatType: 'percentage' },
            { field: 'carriedInterestRate', label: 'Avg Carried Interest', aggregation: 'avg', formatType: 'percentage' }
          ],
          filters: [
            { field: 'status', operator: 'not_equals', value: 'closed' }
          ],
          sorting: [
            { field: 'vintage', direction: 'desc', type: 'dimension' }
          ],
          formatting: {
            showTotals: true,
            showSubtotals: true,
            showPercentages: false,
            theme: 'default'
          }
        }
      },
      {
        id: 'investor-commitment-analysis',
        name: 'Investor Commitment Analysis',
        description: 'Analysis of investor commitments by geography and type',
        category: 'operations',
        type: 'pivot',
        config: {
          dataSource: 'commitments',
          dimensions: [
            { field: 'investor.geography', label: 'Geography', type: 'string' },
            { field: 'investor.entityType', label: 'Investor Type', type: 'string' }
          ],
          measures: [
            { field: 'commitmentAmount', label: 'Total Commitments', aggregation: 'sum', formatType: 'currency' },
            { field: 'contributedAmount', label: 'Total Contributions', aggregation: 'sum', formatType: 'currency' },
            { field: 'id', label: 'Number of Commitments', aggregation: 'count', formatType: 'number' }
          ],
          filters: [],
          sorting: [
            { field: 'commitmentAmount', direction: 'desc', type: 'measure' }
          ],
          formatting: {
            showTotals: true,
            showSubtotals: true,
            showPercentages: true,
            theme: 'default'
          }
        }
      }
    ];
  }

  /**
   * Private helper methods
   */

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getPivotTableConfig(configId: string): Promise<PivotTableConfig> {
    // Mock implementation - would normally load from database
    const templates = await this.getAnalysisTemplates();
    const template = templates.find(t => t.id === configId);
    
    if (template && template.type === 'pivot') {
      return {
        id: configId,
        name: template.name,
        description: template.description,
        dataSource: template.config.dataSource,
        dimensions: template.config.dimensions,
        measures: template.config.measures,
        filters: template.config.filters,
        sorting: template.config.sorting,
        formatting: template.config.formatting,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    throw new Error(`Pivot table configuration with ID ${configId} not found`);
  }

  private buildPivotQuery(config: PivotTableConfig, filters: PivotFilter[]): string {
    // Simplified query builder - in practice would be more sophisticated
    let query = '';
    
    switch (config.dataSource) {
      case 'funds':
        query = 'SELECT * FROM "Funds"';
        break;
      case 'investors':
        query = 'SELECT * FROM "InvestorEntities"';
        break;
      case 'commitments':
        query = `
          SELECT c.*, f.name as fund_name, f.vintage, ie.name as investor_name, 
                 ie.geography as investor_geography, ie."entityType" as investor_entity_type
          FROM "Commitments" c
          JOIN "Funds" f ON c."fundId" = f.id
          JOIN "InvestorEntities" ie ON c."investorId" = ie.id
        `;
        break;
      default:
        throw new Error(`Unsupported data source: ${config.dataSource}`);
    }

    // Add WHERE clause for filters
    if (filters.length > 0) {
      const whereConditions = filters.map(filter => this.buildFilterCondition(filter));
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    return query;
  }

  private buildFilterCondition(filter: PivotFilter): string {
    // Simplified filter condition builder
    switch (filter.operator) {
      case 'equals':
        return `${filter.field} = '${filter.value}'`;
      case 'not_equals':
        return `${filter.field} != '${filter.value}'`;
      case 'greater_than':
        return `${filter.field} > ${filter.value}`;
      case 'less_than':
        return `${filter.field} < ${filter.value}`;
      case 'in':
        return `${filter.field} IN (${filter.values?.map(v => `'${v}'`).join(', ')})`;
      default:
        return '1=1'; // Default to no filter
    }
  }

  private processPivotData(rawData: any[], config: PivotTableConfig): PivotTableData {
    // Process raw data into pivot table format
    const headers: PivotHeader[] = [
      ...config.dimensions.map(dim => ({
        field: dim.field,
        label: dim.label,
        type: 'dimension' as const,
        alignment: 'left' as const,
      })),
      ...config.measures.map(measure => ({
        field: measure.field,
        label: measure.label,
        type: 'measure' as const,
        alignment: 'right' as const,
      })),
    ];

    const rows: PivotRow[] = rawData.map((row, index) => ({
      id: `row_${index}`,
      cells: headers.map(header => ({
        value: row[header.field],
        formattedValue: this.formatCellValue(row[header.field], header),
        type: this.getValueType(row[header.field]),
        rawValue: row[header.field],
      })),
    }));

    return {
      headers,
      rows,
      // TODO: Add totals and subtotals calculation
    };
  }

  private formatCellValue(value: any, header: PivotHeader): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Find corresponding measure for formatting
    if (header.type === 'measure') {
      // Apply formatting based on measure configuration
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
    }

    return String(value);
  }

  private getValueType(value: any): 'string' | 'number' | 'date' | 'boolean' {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    return 'string';
  }

  private async getCustomReport(reportId: string): Promise<CustomReport> {
    // Mock implementation - would normally load from database
    throw new Error('Custom report not implemented yet');
  }

  private async executeReportSection(section: ReportSection, parameters: Record<string, any>): Promise<any> {
    // Mock implementation for executing report sections
    return { message: 'Section data placeholder' };
  }

  private generateChartConfig(section: ReportSection, data: any): any {
    // Generate chart configuration based on section and data
    return { type: 'bar', data: [] };
  }

  private async getExportData(dataSource: string, filters: any[], options: ExportOptions): Promise<any[]> {
    // Get data for export based on source and filters
    let query = '';
    
    switch (dataSource) {
      case 'funds':
        query = 'SELECT * FROM "Funds"';
        break;
      case 'investors':
        query = 'SELECT * FROM "InvestorEntities"';
        break;
      case 'commitments':
        query = 'SELECT * FROM "Commitments"';
        break;
      default:
        throw new Error(`Unsupported data source: ${dataSource}`);
    }

    return await sequelize.query(query, { type: QueryTypes.SELECT });
  }

  private generateCSV(data: any[], options: ExportOptions): Buffer {
    if (data.length === 0) {
      return Buffer.from('');
    }

    const headers = Object.keys(data[0]);
    let csv = '';

    if (options.includeHeaders) {
      csv += headers.join(',') + '\n';
    }

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    }

    return Buffer.from(csv);
  }

  private async generateExcel(data: any[], options: ExportOptions): Promise<Buffer> {
    // Would use a library like ExcelJS to generate Excel files
    // For now, return CSV as placeholder
    return this.generateCSV(data, options);
  }

  private async generatePDF(data: any[], options: ExportOptions): Promise<Buffer> {
    // Would use a library like PDFKit to generate PDF files
    // For now, return placeholder
    return Buffer.from('PDF placeholder');
  }
}