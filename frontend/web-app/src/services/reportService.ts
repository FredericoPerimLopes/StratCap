import api from './api';
import { 
  Report, 
  ReportTemplate, 
  DashboardMetrics, 
  PerformanceMetrics,
  CreateReportRequest,
  ReportSchedule 
} from '../types/report';

class ReportService {
  // Dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  }

  async getPerformanceMetrics(fundId?: string): Promise<PerformanceMetrics[]> {
    const params = fundId ? `?fund_id=${fundId}` : '';
    const response = await api.get(`/dashboard/performance${params}`);
    return response.data;
  }

  // Report management
  async getReports(): Promise<Report[]> {
    const response = await api.get('/reports');
    return response.data;
  }

  async getReport(reportId: string): Promise<Report> {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  }

  async createReport(report: CreateReportRequest): Promise<Report> {
    const response = await api.post('/reports', report);
    return response.data;
  }

  async updateReport(reportId: string, updates: Partial<Report>): Promise<Report> {
    const response = await api.put(`/reports/${reportId}`, updates);
    return response.data;
  }

  async deleteReport(reportId: string): Promise<void> {
    await api.delete(`/reports/${reportId}`);
  }

  async generateReport(reportId: string): Promise<Report> {
    const response = await api.post(`/reports/${reportId}/generate`);
    return response.data;
  }

  async downloadReport(reportId: string): Promise<Blob> {
    const response = await api.get(`/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Report templates
  async getReportTemplates(): Promise<ReportTemplate[]> {
    const response = await api.get('/report-templates');
    return response.data;
  }

  async getReportTemplate(templateId: string): Promise<ReportTemplate> {
    const response = await api.get(`/report-templates/${templateId}`);
    return response.data;
  }

  async createReportTemplate(template: Omit<ReportTemplate, 'template_id' | 'created_at' | 'updated_at'>): Promise<ReportTemplate> {
    const response = await api.post('/report-templates', template);
    return response.data;
  }

  async updateReportTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const response = await api.put(`/report-templates/${templateId}`, updates);
    return response.data;
  }

  async deleteReportTemplate(templateId: string): Promise<void> {
    await api.delete(`/report-templates/${templateId}`);
  }

  // Report scheduling
  async getReportSchedules(): Promise<ReportSchedule[]> {
    const response = await api.get('/report-schedules');
    return response.data;
  }

  async createReportSchedule(schedule: Omit<ReportSchedule, 'schedule_id' | 'created_at' | 'updated_at'>): Promise<ReportSchedule> {
    const response = await api.post('/report-schedules', schedule);
    return response.data;
  }

  async updateReportSchedule(scheduleId: string, updates: Partial<ReportSchedule>): Promise<ReportSchedule> {
    const response = await api.put(`/report-schedules/${scheduleId}`, updates);
    return response.data;
  }

  async deleteReportSchedule(scheduleId: string): Promise<void> {
    await api.delete(`/report-schedules/${scheduleId}`);
  }

  // Standard reports
  async generateFundPerformanceReport(fundId: string, startDate: string, endDate: string): Promise<Report> {
    const response = await api.post('/reports/fund-performance', {
      fund_id: fundId,
      period_start: startDate,
      period_end: endDate,
    });
    return response.data;
  }

  async generateInvestorStatement(investorId: string, fundId: string, startDate: string, endDate: string): Promise<Report> {
    const response = await api.post('/reports/investor-statement', {
      investor_id: investorId,
      fund_id: fundId,
      period_start: startDate,
      period_end: endDate,
    });
    return response.data;
  }

  async generateCapitalCallReport(fundId: string, callId?: string): Promise<Report> {
    const response = await api.post('/reports/capital-call', {
      fund_id: fundId,
      call_id: callId,
    });
    return response.data;
  }

  async generateDistributionReport(fundId: string, distributionId?: string): Promise<Report> {
    const response = await api.post('/reports/distribution', {
      fund_id: fundId,
      distribution_id: distributionId,
    });
    return response.data;
  }

  async generateTaxReport(fundId: string, taxYear: number): Promise<Report> {
    const response = await api.post('/reports/tax', {
      fund_id: fundId,
      tax_year: taxYear,
    });
    return response.data;
  }

  async generateComplianceReport(fundId: string, reportType: string): Promise<Report> {
    const response = await api.post('/reports/compliance', {
      fund_id: fundId,
      report_type: reportType,
    });
    return response.data;
  }

  // Analytics and insights
  async getFundAnalytics(fundId?: string): Promise<any> {
    const params = fundId ? `?fund_id=${fundId}` : '';
    const response = await api.get(`/analytics/funds${params}`);
    return response.data;
  }

  async getInvestorAnalytics(investorId?: string): Promise<any> {
    const params = investorId ? `?investor_id=${investorId}` : '';
    const response = await api.get(`/analytics/investors${params}`);
    return response.data;
  }

  async getPortfolioAnalytics(): Promise<any> {
    const response = await api.get('/analytics/portfolio');
    return response.data;
  }

  async getRiskAnalytics(): Promise<any> {
    const response = await api.get('/analytics/risk');
    return response.data;
  }

  // Custom reports
  async executeCustomQuery(query: string, parameters?: any): Promise<any> {
    const response = await api.post('/reports/custom-query', {
      query,
      parameters,
    });
    return response.data;
  }
}

export default new ReportService();