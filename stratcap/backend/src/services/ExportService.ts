import * as xlsx from 'xlsx';
import * as PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { 
  Fund,
  Commitment,
  Transaction,
  InvestorEntity,
  CapitalActivity,
  FeeCalculation
} from '../models';

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeHeaders?: boolean;
  customColumns?: string[];
  dateFormat?: 'iso' | 'us' | 'eu';
  numberFormat?: 'decimal' | 'currency';
  groupBy?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  template?: string;
  includeSummary?: boolean;
}

interface PivotTableConfig {
  rows: string[];
  columns: string[];
  values: string[];
  aggregation: 'sum' | 'count' | 'average' | 'min' | 'max';
  filters?: Record<string, any>;
}

interface CustomReportConfig {
  name: string;
  description: string;
  dataSource: string;
  columns: Array<{
    field: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
    format?: string;
    calculation?: string;
  }>;
  filters: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like';
    value: any;
  }>;
  grouping?: {
    field: string;
    aggregations: Array<{
      field: string;
      function: 'sum' | 'count' | 'avg' | 'min' | 'max';
    }>;
  };
  sorting?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
}

export class ExportService {

  /**
   * Export fund performance data
   */
  async exportFundPerformance(
    fundId: string,
    options: ExportOptions
  ): Promise<{ filePath: string; fileName: string }> {
    const fund = await Fund.findByPk(fundId, {
      include: [
        { 
          model: Commitment, 
          as: 'commitments',
          include: [{ model: InvestorEntity, as: 'investorEntity' }]
        }
      ]
    });

    if (!fund) {
      throw new Error('Fund not found');
    }

    const transactions = await Transaction.findAll({
      where: { fundId },
      include: [
        {
          model: Commitment,
          as: 'commitment',
          include: [{ model: InvestorEntity, as: 'investorEntity' }]
        }
      ],
      order: [['transactionDate', 'asc']]
    });

    const data = this.prepareFundPerformanceData(fund, transactions);
    
    return this.exportToFile(data, `fund_performance_${fund.code}`, options);
  }

  /**
   * Export investor portfolio data
   */
  async exportInvestorPortfolio(
    investorId: string,
    options: ExportOptions
  ): Promise<{ filePath: string; fileName: string }> {
    const investor = await InvestorEntity.findByPk(investorId);
    if (!investor) {
      throw new Error('Investor not found');
    }

    const commitments = await Commitment.findAll({
      where: { investorEntityId: investorId, status: 'active' },
      include: [{ model: Fund, as: 'fund' }]
    });

    const commitmentIds = commitments.map(c => c.id);
    const transactions = await Transaction.findAll({
      where: { commitmentId: { [Op.in]: commitmentIds } },
      order: [['transactionDate', 'asc']]
    });

    const data = this.prepareInvestorPortfolioData(investor, commitments, transactions);
    
    return this.exportToFile(data, `investor_portfolio_${investor.name.replace(/\s+/g, '_')}`, options);
  }

  /**
   * Export capital activity report
   */
  async exportCapitalActivity(
    fundId?: string,
    startDate?: Date,
    endDate?: Date,
    options: ExportOptions = { format: 'excel' }
  ): Promise<{ filePath: string; fileName: string }> {
    const whereClause: any = {};
    
    if (fundId) {
      whereClause.fundId = fundId;
    }
    
    if (startDate && endDate) {
      whereClause.eventDate = { [Op.between]: [startDate, endDate] };
    }

    const capitalActivities = await CapitalActivity.findAll({
      where: whereClause,
      include: [
        { model: Fund, as: 'fund' },
        {
          model: Transaction,
          as: 'transactions',
          include: [
            {
              model: Commitment,
              as: 'commitment',
              include: [{ model: InvestorEntity, as: 'investorEntity' }]
            }
          ]
        }
      ],
      order: [['eventDate', 'desc']]
    });

    const data = this.prepareCapitalActivityData(capitalActivities);
    
    return this.exportToFile(data, 'capital_activity_report', options);
  }

  /**
   * Export fee calculations
   */
  async exportFeeCalculations(
    fundId?: string,
    startDate?: Date,
    endDate?: Date,
    options: ExportOptions = { format: 'excel' }
  ): Promise<{ filePath: string; fileName: string }> {
    const whereClause: any = {};
    
    if (fundId) {
      whereClause.fundId = fundId;
    }
    
    if (startDate && endDate) {
      whereClause.calculationDate = { [Op.between]: [startDate, endDate] };
    }

    const feeCalculations = await FeeCalculation.findAll({
      where: whereClause,
      include: [
        { model: Fund, as: 'fund' },
        {
          model: Commitment,
          as: 'commitment',
          include: [{ model: InvestorEntity, as: 'investorEntity' }]
        }
      ],
      order: [['calculationDate', 'desc']]
    });

    const data = this.prepareFeeCalculationsData(feeCalculations);
    
    return this.exportToFile(data, 'fee_calculations_report', options);
  }

  /**
   * Create pivot table from transaction data
   */
  async createPivotTable(
    dataSource: 'transactions' | 'commitments' | 'capital_activities',
    config: PivotTableConfig,
    options: ExportOptions = { format: 'excel' }
  ): Promise<{ filePath: string; fileName: string }> {
    const rawData = await this.getRawDataForPivot(dataSource, config.filters);
    const pivotData = this.generatePivotTable(rawData, config);
    
    return this.exportToFile(pivotData, `pivot_table_${dataSource}`, options);
  }

  /**
   * Build custom report based on configuration
   */
  async buildCustomReport(
    config: CustomReportConfig,
    options: ExportOptions = { format: 'excel' }
  ): Promise<{ filePath: string; fileName: string }> {
    const rawData = await this.getDataForCustomReport(config);
    const processedData = this.processCustomReportData(rawData, config);
    
    return this.exportToFile(processedData, config.name.replace(/\s+/g, '_'), options);
  }

  /**
   * Export all investor statements for a quarter
   */
  async exportQuarterlyStatements(
    fundId: string,
    quarterEndDate: Date,
    options: ExportOptions = { format: 'pdf' }
  ): Promise<{ filePath: string; fileName: string }> {
    // This would integrate with InvestorStatementService
    const quarterStart = this.getQuarterStart(quarterEndDate);
    
    const commitments = await Commitment.findAll({
      where: { fundId, status: 'active' },
      include: [{ model: InvestorEntity, as: 'investorEntity' }]
    });

    const statementsData = [];
    
    for (const commitment of commitments) {
      const transactions = await Transaction.findAll({
        where: {
          commitmentId: commitment.id,
          transactionDate: { [Op.between]: [quarterStart, quarterEndDate] }
        }
      });

      statementsData.push({
        investor: commitment.investorEntity.name,
        investorId: commitment.investorEntity.id,
        transactions: transactions.length,
        totalActivity: transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
      });
    }

    return this.exportToFile(statementsData, `quarterly_statements_Q${this.getQuarter(quarterEndDate)}_${quarterEndDate.getFullYear()}`, options);
  }

  /**
   * Create data visualization exports (charts as images)
   */
  async exportDataVisualization(
    chartType: 'fund_performance' | 'cash_flow' | 'investor_allocation',
    fundId: string,
    format: 'png' | 'svg' | 'pdf' = 'png'
  ): Promise<{ filePath: string; fileName: string }> {
    // This would integrate with a charting library like Chart.js or D3
    // For now, return placeholder
    const chartData = await this.getChartData(chartType, fundId);
    
    // Generate chart image (placeholder implementation)
    const fileName = `${chartType}_${fundId}_${Date.now()}.${format}`;
    const filePath = path.join(process.cwd(), 'exports', fileName);
    
    // In production, this would generate actual chart images
    fs.writeFileSync(filePath, JSON.stringify(chartData, null, 2));
    
    return { filePath, fileName };
  }

  /**
   * Export to specified file format
   */
  private async exportToFile(
    data: any[],
    baseFileName: string,
    options: ExportOptions
  ): Promise<{ filePath: string; fileName: string }> {
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `${baseFileName}_${timestamp}.${options.format}`;
    const exportDir = path.join(process.cwd(), 'exports');
    
    // Ensure export directory exists
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const filePath = path.join(exportDir, fileName);

    switch (options.format) {
      case 'csv':
        await this.exportToCSV(data, filePath, options);
        break;
      case 'excel':
        await this.exportToExcel(data, filePath, options);
        break;
      case 'pdf':
        await this.exportToPDF(data, filePath, options);
        break;
      case 'json':
        await this.exportToJSON(data, filePath, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    return { filePath, fileName };
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(data: any[], filePath: string, options: ExportOptions): Promise<void> {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = options.customColumns || Object.keys(data[0]);
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers.map(h => ({ id: h, title: h }))
    });

    const formattedData = data.map(row => this.formatRowData(row, options));
    await csvWriter.writeRecords(formattedData);
  }

  /**
   * Export to Excel format
   */
  private async exportToExcel(data: any[], filePath: string, options: ExportOptions): Promise<void> {
    const workbook = xlsx.utils.book_new();
    
    // Main data sheet
    const worksheet = xlsx.utils.json_to_sheet(data.map(row => this.formatRowData(row, options)));
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Add summary sheet if requested
    if (options.includeSummary && data.length > 0) {
      const summary = this.generateSummaryData(data);
      const summarySheet = xlsx.utils.json_to_sheet(summary);
      xlsx.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    xlsx.writeFile(workbook, filePath);
  }

  /**
   * Export to PDF format
   */
  private async exportToPDF(data: any[], filePath: string, options: ExportOptions): Promise<void> {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(filePath));

    // Add title
    doc.fontSize(16).text('Report Export', { align: 'center' });
    doc.moveDown();

    // Add data table
    if (data.length > 0) {
      const headers = options.customColumns || Object.keys(data[0]);
      
      // Table headers
      doc.fontSize(10);
      let y = doc.y;
      headers.forEach((header, index) => {
        doc.text(header, 50 + (index * 100), y, { width: 95, align: 'center' });
      });
      
      doc.moveDown();

      // Table data
      data.slice(0, 50).forEach(row => { // Limit to 50 rows for PDF
        const formattedRow = this.formatRowData(row, options);
        y = doc.y;
        
        headers.forEach((header, index) => {
          const value = formattedRow[header]?.toString() || '';
          doc.text(value, 50 + (index * 100), y, { width: 95, align: 'left' });
        });
        
        doc.moveDown(0.5);
      });
    }

    doc.end();
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(data: any[], filePath: string, options: ExportOptions): Promise<void> {
    const formattedData = data.map(row => this.formatRowData(row, options));
    const exportData = {
      exportDate: new Date().toISOString(),
      recordCount: data.length,
      data: formattedData
    };

    if (options.includeSummary) {
      exportData.summary = this.generateSummaryData(data);
    }

    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
  }

  /**
   * Prepare fund performance data for export
   */
  private prepareFundPerformanceData(fund: any, transactions: any[]): any[] {
    const investorMap = new Map();
    
    // Group transactions by investor
    transactions.forEach(transaction => {
      const investorId = transaction.commitment.investorEntityId;
      if (!investorMap.has(investorId)) {
        investorMap.set(investorId, {
          investor: transaction.commitment.investorEntity,
          transactions: []
        });
      }
      investorMap.get(investorId).transactions.push(transaction);
    });

    const data = [];
    
    investorMap.forEach((investorData, investorId) => {
      const { transactions: investorTransactions } = investorData;
      
      const totalCalled = investorTransactions
        .filter(t => t.transactionType === 'capital_call')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
      const totalDistributed = investorTransactions
        .filter(t => t.transactionType === 'distribution')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      data.push({
        'Fund Code': fund.code,
        'Fund Name': fund.name,
        'Investor Name': investorData.investor.name,
        'Investor Type': investorData.investor.type,
        'Total Called': totalCalled,
        'Total Distributed': totalDistributed,
        'Net Cash Flow': totalDistributed - totalCalled,
        'Multiple': totalCalled > 0 ? (totalDistributed / totalCalled).toFixed(2) : '0.00',
        'Transaction Count': investorTransactions.length
      });
    });

    return data;
  }

  /**
   * Prepare investor portfolio data for export
   */
  private prepareInvestorPortfolioData(investor: any, commitments: any[], transactions: any[]): any[] {
    const data = [];
    
    commitments.forEach(commitment => {
      const commitmentTransactions = transactions.filter(t => t.commitmentId === commitment.id);
      
      const totalCalled = commitmentTransactions
        .filter(t => t.transactionType === 'capital_call')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
      const totalDistributed = commitmentTransactions
        .filter(t => t.transactionType === 'distribution')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      data.push({
        'Investor Name': investor.name,
        'Fund Code': commitment.fund.code,
        'Fund Name': commitment.fund.name,
        'Commitment Amount': parseFloat(commitment.commitmentAmount),
        'Commitment Date': commitment.commitmentDate.toISOString().split('T')[0],
        'Total Called': totalCalled,
        'Total Distributed': totalDistributed,
        'Unfunded': parseFloat(commitment.commitmentAmount) - totalCalled,
        'Call Rate': ((totalCalled / parseFloat(commitment.commitmentAmount)) * 100).toFixed(1) + '%',
        'Net Cash Flow': totalDistributed - totalCalled,
        'Status': commitment.status
      });
    });

    return data;
  }

  /**
   * Prepare capital activity data for export
   */
  private prepareCapitalActivityData(capitalActivities: any[]): any[] {
    const data = [];
    
    capitalActivities.forEach(activity => {
      const transactionCount = activity.transactions?.length || 0;
      const totalTransactionAmount = activity.transactions?.reduce((sum: number, t: any) => 
        sum + parseFloat(t.amount), 0) || 0;

      data.push({
        'Event Date': activity.eventDate.toISOString().split('T')[0],
        'Event Type': activity.eventType,
        'Fund Code': activity.fund?.code || '',
        'Fund Name': activity.fund?.name || '',
        'Description': activity.description || '',
        'Total Amount': parseFloat(activity.totalAmount),
        'Transaction Count': transactionCount,
        'Actual Amount': totalTransactionAmount,
        'Status': activity.status || 'completed',
        'Notice Date': activity.noticeDate?.toISOString().split('T')[0] || '',
        'Settlement Date': activity.settlementDate?.toISOString().split('T')[0] || ''
      });
    });

    return data;
  }

  /**
   * Prepare fee calculations data for export
   */
  private prepareFeeCalculationsData(feeCalculations: any[]): any[] {
    const data = [];
    
    feeCalculations.forEach(fee => {
      data.push({
        'Calculation Date': fee.calculationDate.toISOString().split('T')[0],
        'Fund Code': fee.fund?.code || '',
        'Fund Name': fee.fund?.name || '',
        'Investor Name': fee.commitment?.investorEntity?.name || '',
        'Fee Type': fee.feeType,
        'Basis': parseFloat(fee.basis),
        'Rate': (parseFloat(fee.rate) * 100).toFixed(4) + '%',
        'Amount': parseFloat(fee.totalAmount),
        'Period Start': fee.periodStart?.toISOString().split('T')[0] || '',
        'Period End': fee.periodEnd?.toISOString().split('T')[0] || '',
        'Status': fee.status,
        'Paid Date': fee.paidDate?.toISOString().split('T')[0] || ''
      });
    });

    return data;
  }

  // Helper methods

  private formatRowData(row: any, options: ExportOptions): any {
    const formatted = { ...row };
    
    Object.keys(formatted).forEach(key => {
      const value = formatted[key];
      
      if (value instanceof Date) {
        formatted[key] = this.formatDate(value, options.dateFormat);
      } else if (typeof value === 'number' && options.numberFormat === 'currency') {
        formatted[key] = this.formatCurrency(value);
      }
    });

    return formatted;
  }

  private formatDate(date: Date, format: string = 'iso'): string {
    switch (format) {
      case 'us':
        return date.toLocaleDateString('en-US');
      case 'eu':
        return date.toLocaleDateString('en-GB');
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  private generateSummaryData(data: any[]): any[] {
    if (data.length === 0) return [];
    
    const summary = [];
    const numericFields = Object.keys(data[0]).filter(key => 
      typeof data[0][key] === 'number'
    );

    numericFields.forEach(field => {
      const values = data.map(row => row[field]).filter(val => !isNaN(val));
      
      if (values.length > 0) {
        summary.push({
          'Field': field,
          'Count': values.length,
          'Sum': values.reduce((sum, val) => sum + val, 0),
          'Average': values.reduce((sum, val) => sum + val, 0) / values.length,
          'Min': Math.min(...values),
          'Max': Math.max(...values)
        });
      }
    });

    return summary;
  }

  private async getRawDataForPivot(dataSource: string, filters?: Record<string, any>): Promise<any[]> {
    // Implementation would depend on data source
    switch (dataSource) {
      case 'transactions':
        return this.getTransactionsForPivot(filters);
      case 'commitments':
        return this.getCommitmentsForPivot(filters);
      case 'capital_activities':
        return this.getCapitalActivitiesForPivot(filters);
      default:
        throw new Error(`Unsupported data source: ${dataSource}`);
    }
  }

  private async getTransactionsForPivot(filters?: Record<string, any>): Promise<any[]> {
    const whereClause = filters || {};
    
    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [
        {
          model: Commitment,
          as: 'commitment',
          include: [
            { model: InvestorEntity, as: 'investorEntity' },
            { model: Fund, as: 'fund' }
          ]
        }
      ]
    });

    return transactions.map(t => ({
      transactionId: t.id,
      date: t.transactionDate,
      type: t.transactionType,
      amount: parseFloat(t.amount),
      investor: t.commitment?.investorEntity?.name,
      fund: t.commitment?.fund?.name,
      fundCode: t.commitment?.fund?.code,
      year: t.transactionDate.getFullYear(),
      quarter: Math.floor(t.transactionDate.getMonth() / 3) + 1,
      month: t.transactionDate.getMonth() + 1
    }));
  }

  private async getCommitmentsForPivot(filters?: Record<string, any>): Promise<any[]> {
    // Similar implementation for commitments
    return [];
  }

  private async getCapitalActivitiesForPivot(filters?: Record<string, any>): Promise<any[]> {
    // Similar implementation for capital activities
    return [];
  }

  private generatePivotTable(data: any[], config: PivotTableConfig): any[] {
    // Simplified pivot table generation
    // In production, this would be a more sophisticated implementation
    const pivotMap = new Map();
    
    data.forEach(row => {
      const rowKey = config.rows.map(r => row[r]).join('|');
      const colKey = config.columns.map(c => row[c]).join('|');
      const key = `${rowKey}:${colKey}`;
      
      if (!pivotMap.has(key)) {
        const pivotRow: any = {};
        config.rows.forEach(r => pivotRow[r] = row[r]);
        config.columns.forEach(c => pivotRow[c] = row[c]);
        config.values.forEach(v => pivotRow[v] = 0);
        pivotMap.set(key, pivotRow);
      }
      
      const pivotRow = pivotMap.get(key);
      config.values.forEach(valueField => {
        const value = row[valueField] || 0;
        switch (config.aggregation) {
          case 'sum':
            pivotRow[valueField] += value;
            break;
          case 'count':
            pivotRow[valueField] += 1;
            break;
          case 'average':
            // Would need more sophisticated handling for average
            pivotRow[valueField] += value;
            break;
          // Add other aggregation types
        }
      });
    });

    return Array.from(pivotMap.values());
  }

  private async getDataForCustomReport(config: CustomReportConfig): Promise<any[]> {
    // Implementation would depend on data source specified in config
    return [];
  }

  private processCustomReportData(data: any[], config: CustomReportConfig): any[] {
    // Apply filters, sorting, grouping based on config
    let processedData = [...data];

    // Apply filters
    config.filters.forEach(filter => {
      processedData = processedData.filter(row => {
        const value = row[filter.field];
        switch (filter.operator) {
          case 'eq': return value === filter.value;
          case 'ne': return value !== filter.value;
          case 'gt': return value > filter.value;
          case 'lt': return value < filter.value;
          case 'gte': return value >= filter.value;
          case 'lte': return value <= filter.value;
          case 'in': return filter.value.includes(value);
          case 'like': return value.toString().includes(filter.value);
          default: return true;
        }
      });
    });

    // Apply sorting
    if (config.sorting) {
      config.sorting.forEach(sort => {
        processedData.sort((a, b) => {
          const aVal = a[sort.field];
          const bVal = b[sort.field];
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return sort.direction === 'desc' ? -comparison : comparison;
        });
      });
    }

    return processedData;
  }

  private async getChartData(chartType: string, fundId: string): Promise<any> {
    // Placeholder for chart data generation
    return { chartType, fundId, data: [] };
  }

  private getQuarterStart(quarterEndDate: Date): Date {
    const quarter = Math.floor(quarterEndDate.getMonth() / 3);
    return new Date(quarterEndDate.getFullYear(), quarter * 3, 1);
  }

  private getQuarter(date: Date): number {
    return Math.floor(date.getMonth() / 3) + 1;
  }
}

export default new ExportService();