import { DataAnalysisService, PivotTableConfig, PivotFilter, ExportOptions } from '../services/DataAnalysisService';

describe('DataAnalysisService', () => {
  let dataAnalysisService: DataAnalysisService;

  beforeEach(() => {
    dataAnalysisService = new DataAnalysisService();
  });

  describe('Pivot Table Operations', () => {
    test('should create a pivot table configuration', async () => {
      const config = {
        name: 'Test Pivot Table',
        description: 'A test pivot table for fund analysis',
        dataSource: 'funds' as const,
        dimensions: [
          {
            field: 'vintage',
            label: 'Vintage Year',
            type: 'number' as const,
          },
          {
            field: 'type',
            label: 'Fund Type',
            type: 'string' as const,
          },
        ],
        measures: [
          {
            field: 'targetSize',
            label: 'Target Size',
            aggregation: 'sum' as const,
            formatType: 'currency' as const,
          },
        ],
        filters: [],
        sorting: [],
        formatting: {
          showTotals: true,
          showSubtotals: false,
          showPercentages: false,
          theme: 'default' as const,
        },
        createdBy: 'test-user',
      };

      const result = await dataAnalysisService.createPivotTable(config);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(config.name);
      expect(result.dataSource).toBe(config.dataSource);
      expect(result.dimensions).toEqual(config.dimensions);
      expect(result.measures).toEqual(config.measures);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    test('should execute a predefined pivot table template', async () => {
      const configId = 'fund-performance-summary';
      const runtimeFilters: PivotFilter[] = [
        {
          field: 'vintage',
          operator: 'greater_than',
          value: 2020,
        },
      ];

      const result = await dataAnalysisService.executePivotTable(configId, runtimeFilters);

      expect(result).toBeDefined();
      expect(result.config).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.executionTime).toBeGreaterThan(0);
      expect(result.metadata.generatedAt).toBeDefined();
      expect(result.data.headers).toBeDefined();
      expect(result.data.rows).toBeDefined();
    });

    test('should validate pivot configuration filters are merged correctly', async () => {
      const configId = 'fund-performance-summary';
      const runtimeFilters: PivotFilter[] = [
        {
          field: 'status',
          operator: 'equals',
          value: 'active',
        },
      ];

      const result = await dataAnalysisService.executePivotTable(configId, runtimeFilters);

      // Should have both config filters and runtime filters applied
      expect(result.config.filters.length).toBeGreaterThan(0);
    });
  });

  describe('Data Source Operations', () => {
    test('should return schema for funds data source', async () => {
      const schema = await dataAnalysisService.getDataSourceSchema('funds');

      expect(schema).toBeDefined();
      expect(schema.fields).toBeDefined();
      expect(schema.fields.length).toBeGreaterThan(0);
      expect(schema.relationships).toBeDefined();

      // Check that essential fund fields are present
      const fieldNames = schema.fields.map(f => f.name);
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('vintage');
      expect(fieldNames).toContain('targetSize');
    });

    test('should return schema for investors data source', async () => {
      const schema = await dataAnalysisService.getDataSourceSchema('investors');

      expect(schema).toBeDefined();
      expect(schema.fields).toBeDefined();
      expect(schema.fields.length).toBeGreaterThan(0);

      const fieldNames = schema.fields.map(f => f.name);
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('entityType');
    });

    test('should return schema for commitments data source', async () => {
      const schema = await dataAnalysisService.getDataSourceSchema('commitments');

      expect(schema).toBeDefined();
      expect(schema.fields).toBeDefined();
      expect(schema.relationships).toBeDefined();
      expect(schema.relationships.length).toBeGreaterThan(0);

      const fieldNames = schema.fields.map(f => f.name);
      expect(fieldNames).toContain('commitmentAmount');
      expect(fieldNames).toContain('contributedAmount');
      expect(fieldNames).toContain('distributedAmount');
    });

    test('should return empty schema for unknown data source', async () => {
      const schema = await dataAnalysisService.getDataSourceSchema('unknown');

      expect(schema).toBeDefined();
      expect(schema.fields).toEqual([]);
      expect(schema.relationships).toEqual([]);
    });
  });

  describe('Custom Reports', () => {
    test('should create a custom report configuration', async () => {
      const report = {
        name: 'Quarterly Performance Report',
        description: 'Comprehensive quarterly performance analysis',
        type: 'dashboard' as const,
        sections: [
          {
            id: 'section1',
            title: 'Fund Performance Overview',
            type: 'pivot' as const,
            position: { row: 1, col: 1 },
            config: { pivotTableId: 'fund-performance-summary' },
          },
          {
            id: 'section2',
            title: 'Investor Commitments',
            type: 'chart' as const,
            position: { row: 1, col: 2 },
            config: { chartType: 'bar', dataSource: 'commitments' },
          },
        ],
        parameters: [
          {
            name: 'quarter',
            label: 'Quarter',
            type: 'select' as const,
            defaultValue: 'Q1',
            options: [
              { value: 'Q1', label: 'Q1' },
              { value: 'Q2', label: 'Q2' },
              { value: 'Q3', label: 'Q3' },
              { value: 'Q4', label: 'Q4' },
            ],
            required: true,
          },
        ],
        distribution: {
          emails: ['manager@fund.com'],
          formats: ['pdf' as const],
          includeData: true,
          includeCharts: true,
        },
        createdBy: 'test-user',
      };

      const result = await dataAnalysisService.createCustomReport(report);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(report.name);
      expect(result.type).toBe(report.type);
      expect(result.sections).toEqual(report.sections);
      expect(result.parameters).toEqual(report.parameters);
    });
  });

  describe('Data Export', () => {
    test('should export data in CSV format', async () => {
      const options: ExportOptions = {
        format: 'csv',
        includeHeaders: true,
        includeFormatting: false,
        includeCharts: false,
      };

      const result = await dataAnalysisService.exportData('funds', options);

      expect(result).toBeDefined();
      expect(result.filename).toBeDefined();
      expect(result.filename).toMatch(/\.csv$/);
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });

    test('should export data in JSON format', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeHeaders: true,
        includeFormatting: false,
        includeCharts: false,
      };

      const result = await dataAnalysisService.exportData('investors', options);

      expect(result).toBeDefined();
      expect(result.filename).toMatch(/\.json$/);
      expect(result.mimeType).toBe('application/json');
      expect(result.data).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });

    test('should generate custom filename when provided', async () => {
      const options: ExportOptions = {
        format: 'csv',
        filename: 'custom_export.csv',
        includeHeaders: true,
        includeFormatting: false,
        includeCharts: false,
      };

      const result = await dataAnalysisService.exportData('commitments', options);

      expect(result.filename).toBe('custom_export.csv');
    });

    test('should throw error for unsupported export format', async () => {
      const options: ExportOptions = {
        format: 'xml' as any,
        includeHeaders: true,
        includeFormatting: false,
        includeCharts: false,
      };

      await expect(
        dataAnalysisService.exportData('funds', options)
      ).rejects.toThrow('Unsupported export format: xml');
    });

    test('should throw error for unsupported data source', async () => {
      const options: ExportOptions = {
        format: 'csv',
        includeHeaders: true,
        includeFormatting: false,
        includeCharts: false,
      };

      await expect(
        dataAnalysisService.exportData('unknown_source', options)
      ).rejects.toThrow('Unsupported data source: unknown_source');
    });
  });

  describe('Analysis Templates', () => {
    test('should return predefined analysis templates', async () => {
      const templates = await dataAnalysisService.getAnalysisTemplates();

      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);

      // Check for specific templates
      const fundPerformanceTemplate = templates.find(t => t.id === 'fund-performance-summary');
      expect(fundPerformanceTemplate).toBeDefined();
      expect(fundPerformanceTemplate?.name).toBe('Fund Performance Summary');
      expect(fundPerformanceTemplate?.category).toBe('performance');
      expect(fundPerformanceTemplate?.type).toBe('pivot');

      const investorCommitmentTemplate = templates.find(t => t.id === 'investor-commitment-analysis');
      expect(investorCommitmentTemplate).toBeDefined();
      expect(investorCommitmentTemplate?.category).toBe('operations');
    });

    test('should have valid template configurations', async () => {
      const templates = await dataAnalysisService.getAnalysisTemplates();

      for (const template of templates) {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.type).toBeDefined();
        expect(template.config).toBeDefined();

        if (template.type === 'pivot') {
          expect(template.config.dataSource).toBeDefined();
          expect(template.config.dimensions).toBeDefined();
          expect(template.config.measures).toBeDefined();
          expect(template.config.formatting).toBeDefined();
        }
      }
    });
  });

  describe('Query Building', () => {
    test('should build correct query for funds data source', () => {
      const config: PivotTableConfig = {
        id: 'test',
        name: 'Test',
        dataSource: 'funds',
        dimensions: [],
        measures: [],
        filters: [],
        sorting: [],
        formatting: { showTotals: false, showSubtotals: false, showPercentages: false, theme: 'default' },
        createdBy: 'test',
      };

      // Access private method via any cast for testing
      const service = dataAnalysisService as any;
      const query = service.buildPivotQuery(config, []);

      expect(query).toContain('SELECT * FROM "Funds"');
    });

    test('should build query with filters', () => {
      const config: PivotTableConfig = {
        id: 'test',
        name: 'Test',
        dataSource: 'funds',
        dimensions: [],
        measures: [],
        filters: [],
        sorting: [],
        formatting: { showTotals: false, showSubtotals: false, showPercentages: false, theme: 'default' },
        createdBy: 'test',
      };

      const filters: PivotFilter[] = [
        {
          field: 'status',
          operator: 'equals',
          value: 'active',
        },
      ];

      const service = dataAnalysisService as any;
      const query = service.buildPivotQuery(config, filters);

      expect(query).toContain('WHERE');
      expect(query).toContain("status = 'active'");
    });

    test('should build complex query for commitments with joins', () => {
      const config: PivotTableConfig = {
        id: 'test',
        name: 'Test',
        dataSource: 'commitments',
        dimensions: [],
        measures: [],
        filters: [],
        sorting: [],
        formatting: { showTotals: false, showSubtotals: false, showPercentages: false, theme: 'default' },
        createdBy: 'test',
      };

      const service = dataAnalysisService as any;
      const query = service.buildPivotQuery(config, []);

      expect(query).toContain('JOIN "Funds"');
      expect(query).toContain('JOIN "InvestorEntities"');
      expect(query).toContain('fund_name');
      expect(query).toContain('investor_name');
    });
  });

  describe('Data Processing', () => {
    test('should process raw data into pivot table format', () => {
      const rawData = [
        { id: '1', name: 'Fund A', vintage: 2020, targetSize: 100000000 },
        { id: '2', name: 'Fund B', vintage: 2021, targetSize: 200000000 },
      ];

      const config: PivotTableConfig = {
        id: 'test',
        name: 'Test',
        dataSource: 'funds',
        dimensions: [
          { field: 'vintage', label: 'Vintage Year', type: 'number' },
        ],
        measures: [
          { field: 'targetSize', label: 'Target Size', aggregation: 'sum', formatType: 'currency' },
        ],
        filters: [],
        sorting: [],
        formatting: { showTotals: false, showSubtotals: false, showPercentages: false, theme: 'default' },
        createdBy: 'test',
      };

      const service = dataAnalysisService as any;
      const result = service.processPivotData(rawData, config);

      expect(result).toBeDefined();
      expect(result.headers).toBeDefined();
      expect(result.headers.length).toBe(2); // 1 dimension + 1 measure
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBe(2);

      // Check header structure
      expect(result.headers[0].type).toBe('dimension');
      expect(result.headers[1].type).toBe('measure');

      // Check row structure
      expect(result.rows[0].cells).toBeDefined();
      expect(result.rows[0].cells.length).toBe(2);
    });

    test('should format cell values correctly', () => {
      const service = dataAnalysisService as any;

      // Test number formatting
      const numberHeader = { field: 'amount', label: 'Amount', type: 'measure' };
      const formattedNumber = service.formatCellValue(1234567.89, numberHeader);
      expect(formattedNumber).toMatch(/1,234,567/); // Should have comma separators

      // Test string formatting
      const stringHeader = { field: 'name', label: 'Name', type: 'dimension' };
      const formattedString = service.formatCellValue('Test Fund', stringHeader);
      expect(formattedString).toBe('Test Fund');

      // Test null/undefined values
      const formattedNull = service.formatCellValue(null, numberHeader);
      expect(formattedNull).toBe('');

      const formattedUndefined = service.formatCellValue(undefined, numberHeader);
      expect(formattedUndefined).toBe('');
    });

    test('should detect value types correctly', () => {
      const service = dataAnalysisService as any;

      expect(service.getValueType(123)).toBe('number');
      expect(service.getValueType('test')).toBe('string');
      expect(service.getValueType(true)).toBe('boolean');
      expect(service.getValueType(new Date())).toBe('date');
    });
  });

  describe('CSV Generation', () => {
    test('should generate CSV with headers', () => {
      const data = [
        { name: 'Fund A', vintage: 2020, targetSize: 100000000 },
        { name: 'Fund B', vintage: 2021, targetSize: 200000000 },
      ];

      const options: ExportOptions = {
        format: 'csv',
        includeHeaders: true,
        includeFormatting: false,
        includeCharts: false,
      };

      const service = dataAnalysisService as any;
      const csv = service.generateCSV(data, options);

      const csvString = csv.toString();
      expect(csvString).toContain('name,vintage,targetSize');
      expect(csvString).toContain('Fund A,2020,100000000');
      expect(csvString).toContain('Fund B,2021,200000000');
    });

    test('should generate CSV without headers', () => {
      const data = [
        { name: 'Fund A', vintage: 2020 },
      ];

      const options: ExportOptions = {
        format: 'csv',
        includeHeaders: false,
        includeFormatting: false,
        includeCharts: false,
      };

      const service = dataAnalysisService as any;
      const csv = service.generateCSV(data, options);

      const csvString = csv.toString();
      expect(csvString).not.toContain('name,vintage');
      expect(csvString).toContain('Fund A,2020');
    });

    test('should handle CSV values with commas and quotes', () => {
      const data = [
        { name: 'Fund "A", LLC', description: 'A fund with, commas' },
      ];

      const options: ExportOptions = {
        format: 'csv',
        includeHeaders: true,
        includeFormatting: false,
        includeCharts: false,
      };

      const service = dataAnalysisService as any;
      const csv = service.generateCSV(data, options);

      const csvString = csv.toString();
      expect(csvString).toContain('"Fund ""A"", LLC"'); // Quoted and escaped
      expect(csvString).toContain('"A fund with, commas"'); // Quoted because of comma
    });

    test('should handle empty data', () => {
      const data: any[] = [];

      const options: ExportOptions = {
        format: 'csv',
        includeHeaders: true,
        includeFormatting: false,
        includeCharts: false,
      };

      const service = dataAnalysisService as any;
      const csv = service.generateCSV(data, options);

      const csvString = csv.toString();
      expect(csvString).toBe('');
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid pivot table config ID', async () => {
      await expect(
        dataAnalysisService.executePivotTable('non-existent-config')
      ).rejects.toThrow('Pivot table configuration with ID non-existent-config not found');
    });

    test('should handle database errors gracefully', async () => {
      // Mock a database error by trying to access an invalid data source
      const config: PivotTableConfig = {
        id: 'test',
        name: 'Test',
        dataSource: 'invalid_table' as any,
        dimensions: [],
        measures: [],
        filters: [],
        sorting: [],
        formatting: { showTotals: false, showSubtotals: false, showPercentages: false, theme: 'default' },
        createdBy: 'test',
      };

      const service = dataAnalysisService as any;
      
      await expect(
        service.buildPivotQuery(config, [])
      ).rejects.toThrow('Unsupported data source: invalid_table');
    });
  });
});