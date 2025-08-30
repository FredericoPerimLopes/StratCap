import api from '../api';
import type { APIResponse } from '../../types/api';
import type {
  ReportMetadata,
  ReportConfiguration,
  HypotheticalScenario,
  ScenarioComparison,
  WhatIfAnalysis,
  PerformanceMetrics,
  ExportOptions,
  ExportResult
} from '../../types/reporting';

// Advanced Reporting API
export const reportingAPI = {
  // Report Management
  getReports: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    tags?: string[];
    createdBy?: string;
  }) => api.get<APIResponse<ReportMetadata[]>>('/reports', { params }),

  getReportById: (id: string) => 
    api.get<APIResponse<ReportMetadata & { configuration: ReportConfiguration }>>(`/reports/${id}`),

  createReport: (data: {
    name: string;
    description?: string;
    category: string;
    configuration: ReportConfiguration;
    isPublic?: boolean;
  }) => api.post<APIResponse<ReportMetadata>>('/reports', data),

  updateReport: (id: string, data: Partial<ReportMetadata & { configuration: ReportConfiguration }>) =>
    api.patch<APIResponse<ReportMetadata>>(`/reports/${id}`, data),

  deleteReport: (id: string) => api.delete<APIResponse>(`/reports/${id}`),

  duplicateReport: (id: string, name: string) =>
    api.post<APIResponse<ReportMetadata>>(`/reports/${id}/duplicate`, { name }),

  // Report Execution
  executeReport: (id: string, parameters?: { [key: string]: any }) =>
    api.post<APIResponse<any>>(`/reports/${id}/execute`, { parameters }),

  getReportExecution: (executionId: string) =>
    api.get<APIResponse<any>>(`/reports/executions/${executionId}`),

  getReportHistory: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<APIResponse<any[]>>(`/reports/${id}/history`, { params }),

  // Report Scheduling
  scheduleReport: (id: string, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    time: string;
    timezone: string;
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
    enabled: boolean;
    parameters?: { [key: string]: any };
  }) => api.post<APIResponse<any>>(`/reports/${id}/schedule`, { schedule }),

  getScheduledReports: () => api.get<APIResponse<any[]>>('/reports/scheduled'),

  updateSchedule: (scheduleId: string, schedule: any) =>
    api.patch<APIResponse<any>>(`/reports/schedules/${scheduleId}`, schedule),

  deleteSchedule: (scheduleId: string) =>
    api.delete<APIResponse>(`/reports/schedules/${scheduleId}`),

  // Report Templates
  getReportTemplates: (category?: string) =>
    api.get<APIResponse<any[]>>('/reports/templates', { params: { category } }),

  createFromTemplate: (templateId: string, data: {
    name: string;
    parameters: { [key: string]: any };
  }) => api.post<APIResponse<ReportMetadata>>(`/reports/templates/${templateId}/create`, data),

  // Dashboard Reports
  getDashboardReports: (dashboardId: string) =>
    api.get<APIResponse<any[]>>(`/dashboards/${dashboardId}/reports`),

  addReportToDashboard: (dashboardId: string, reportId: string, position: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => api.post<APIResponse<any>>(`/dashboards/${dashboardId}/reports`, { reportId, position }),

  // Export and Sharing
  exportReport: (id: string, options: ExportOptions) =>
    api.post<APIResponse<ExportResult>>(`/reports/${id}/export`, options),

  shareReport: (id: string, data: {
    recipients: string[];
    permissions: ('view' | 'edit' | 'delete')[];
    expirationDate?: string;
    message?: string;
  }) => api.post<APIResponse<any>>(`/reports/${id}/share`, data),

  getSharedReports: () => api.get<APIResponse<ReportMetadata[]>>('/reports/shared'),

  // Data Source Management
  getDataSources: () => api.get<APIResponse<any[]>>('/reports/data-sources'),

  getDataSourceSchema: (sourceId: string) =>
    api.get<APIResponse<any>>(`/reports/data-sources/${sourceId}/schema`),

  previewData: (sourceId: string, params?: {
    limit?: number;
    filters?: any[];
    sample?: boolean;
  }) => api.get<APIResponse<any>>(`/reports/data-sources/${sourceId}/preview`, { params }),

  validateQuery: (data: { query: string; dataSource: string }) =>
    api.post<APIResponse<any>>('/reports/data-sources/validate-query', data),

  // Report Analytics
  getReportAnalytics: (id: string, timeRange?: string) =>
    api.get<APIResponse<any>>(`/reports/${id}/analytics`, { params: { timeRange } }),

  getUsageMetrics: (timeRange?: string) =>
    api.get<APIResponse<any>>('/reports/usage-metrics', { params: { timeRange } }),
};

// Hypothetical Waterfall API
export const hypotheticalAPI = {
  // Scenario Management
  getScenarios: (params?: {
    fundId?: number;
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get<APIResponse<HypotheticalScenario[]>>('/reports/hypothetical/scenarios', { params }),

  getScenarioById: (id: string) =>
    api.get<APIResponse<HypotheticalScenario>>(`/reports/hypothetical/scenarios/${id}`),

  createScenario: (data: {
    name: string;
    description?: string;
    fundId: number;
    parameters: any;
  }) => api.post<APIResponse<HypotheticalScenario>>('/reports/hypothetical/scenarios', data),

  updateScenario: (id: string, data: Partial<HypotheticalScenario>) =>
    api.patch<APIResponse<HypotheticalScenario>>(`/reports/hypothetical/scenarios/${id}`, data),

  deleteScenario: (id: string) =>
    api.delete<APIResponse>(`/reports/hypothetical/scenarios/${id}`),

  calculateScenario: (id: string) =>
    api.post<APIResponse<any>>(`/reports/hypothetical/scenarios/${id}/calculate`),

  // Scenario Building
  getScenarioBuilder: (fundId: number) =>
    api.get<APIResponse<any>>(`/reports/hypothetical/builder/${fundId}`),

  validateScenarioParameters: (data: any) =>
    api.post<APIResponse<any>>('/reports/hypothetical/validate-parameters', data),

  getDefaultAssumptions: (fundId: number, scenarioType: string) =>
    api.get<APIResponse<any>>(`/reports/hypothetical/default-assumptions`, { 
      params: { fundId, scenarioType } 
    }),

  // Scenario Comparison
  createComparison: (data: {
    name: string;
    scenarios: string[];
    comparisonType: 'side_by_side' | 'overlay' | 'variance';
    metrics?: string[];
  }) => api.post<APIResponse<ScenarioComparison>>('/reports/hypothetical/comparisons', data),

  getComparisons: (params?: { page?: number; limit?: number }) =>
    api.get<APIResponse<ScenarioComparison[]>>('/reports/hypothetical/comparisons', { params }),

  getComparisonById: (id: string) =>
    api.get<APIResponse<ScenarioComparison & { results: any }>>(`/reports/hypothetical/comparisons/${id}`),

  updateComparison: (id: string, data: Partial<ScenarioComparison>) =>
    api.patch<APIResponse<ScenarioComparison>>(`/reports/hypothetical/comparisons/${id}`, data),

  deleteComparison: (id: string) =>
    api.delete<APIResponse>(`/reports/hypothetical/comparisons/${id}`),

  // What-If Analysis
  createWhatIfAnalysis: (data: {
    name: string;
    baseScenarioId: string;
    variables: any[];
    iterations: number;
    method: 'monte_carlo' | 'sensitivity' | 'scenario_tree';
  }) => api.post<APIResponse<WhatIfAnalysis>>('/reports/hypothetical/what-if', data),

  getWhatIfAnalyses: (params?: { page?: number; limit?: number }) =>
    api.get<APIResponse<WhatIfAnalysis[]>>('/reports/hypothetical/what-if', { params }),

  getWhatIfAnalysisById: (id: string) =>
    api.get<APIResponse<WhatIfAnalysis & { results: any }>>(`/reports/hypothetical/what-if/${id}`),

  runWhatIfAnalysis: (id: string) =>
    api.post<APIResponse<any>>(`/reports/hypothetical/what-if/${id}/run`),

  getWhatIfProgress: (id: string) =>
    api.get<APIResponse<any>>(`/reports/hypothetical/what-if/${id}/progress`),

  // Performance Metrics
  calculatePerformanceMetrics: (data: {
    fundId: number;
    asOfDate: string;
    benchmarks?: string[];
    includePeerComparison?: boolean;
  }) => api.post<APIResponse<PerformanceMetrics>>('/reports/hypothetical/performance-metrics', data),

  getHistoricalPerformance: (fundId: number, params?: {
    startDate?: string;
    endDate?: string;
    frequency?: 'monthly' | 'quarterly' | 'annually';
  }) => api.get<APIResponse<any[]>>(`/reports/hypothetical/historical-performance/${fundId}`, { params }),

  // Scenario Templates
  getScenarioTemplates: (category?: string) =>
    api.get<APIResponse<any[]>>('/reports/hypothetical/templates', { params: { category } }),

  createScenarioTemplate: (data: {
    name: string;
    description?: string;
    category: string;
    template: any;
  }) => api.post<APIResponse<any>>('/reports/hypothetical/templates', data),

  applyTemplate: (templateId: string, data: {
    fundId: number;
    parameters: any;
  }) => api.post<APIResponse<HypotheticalScenario>>(`/reports/hypothetical/templates/${templateId}/apply`, data),

  // Batch Operations
  runBatchScenarios: (data: {
    fundId: number;
    scenarios: any[];
    comparisonName?: string;
  }) => api.post<APIResponse<any>>('/reports/hypothetical/batch-run', data),

  getBatchStatus: (batchId: string) =>
    api.get<APIResponse<any>>(`/reports/hypothetical/batch-status/${batchId}`),

  // Export and Sharing
  exportScenario: (id: string, options: ExportOptions) =>
    api.post<APIResponse<ExportResult>>(`/reports/hypothetical/scenarios/${id}/export`, options),

  exportComparison: (id: string, options: ExportOptions) =>
    api.post<APIResponse<ExportResult>>(`/reports/hypothetical/comparisons/${id}/export`, options),

  shareScenario: (id: string, data: {
    recipients: string[];
    permissions: string[];
    message?: string;
  }) => api.post<APIResponse<any>>(`/reports/hypothetical/scenarios/${id}/share`, data),
};

// Custom Report Builder API
export const customReportAPI = {
  // Report Builder Components
  getAvailableComponents: () =>
    api.get<APIResponse<any[]>>('/reports/builder/components'),

  getComponentSchema: (componentType: string) =>
    api.get<APIResponse<any>>(`/reports/builder/components/${componentType}/schema`),

  previewComponent: (data: {
    type: string;
    configuration: any;
    sampleData?: any;
  }) => api.post<APIResponse<any>>('/reports/builder/components/preview', data),

  // Layout Management
  saveLayout: (reportId: string, layout: {
    components: any[];
    grid: any;
    styles: any;
  }) => api.post<APIResponse<any>>(`/reports/builder/${reportId}/layout`, layout),

  getLayoutTemplates: () => api.get<APIResponse<any[]>>('/reports/builder/layout-templates'),

  applyLayoutTemplate: (reportId: string, templateId: string) =>
    api.post<APIResponse<any>>(`/reports/builder/${reportId}/apply-layout/${templateId}`),

  // Data Binding
  getBindableFields: (dataSourceId: string) =>
    api.get<APIResponse<any[]>>(`/reports/builder/data-sources/${dataSourceId}/fields`),

  validateDataBinding: (data: {
    componentType: string;
    binding: any;
    dataSource: string;
  }) => api.post<APIResponse<any>>('/reports/builder/validate-binding', data),

  testDataBinding: (data: {
    binding: any;
    dataSource: string;
    sampleSize?: number;
  }) => api.post<APIResponse<any>>('/reports/builder/test-binding', data),

  // Formula and Calculations
  validateFormula: (formula: string, context?: any) =>
    api.post<APIResponse<any>>('/reports/builder/validate-formula', { formula, context }),

  getFormulaFunctions: () => api.get<APIResponse<any[]>>('/reports/builder/formula-functions'),

  testFormula: (data: {
    formula: string;
    testData: any;
  }) => api.post<APIResponse<any>>('/reports/builder/test-formula', data),

  // Styling and Themes
  getThemes: () => api.get<APIResponse<any[]>>('/reports/builder/themes'),

  applyTheme: (reportId: string, themeId: string) =>
    api.post<APIResponse<any>>(`/reports/builder/${reportId}/apply-theme/${themeId}`),

  getStyleTemplates: (componentType?: string) =>
    api.get<APIResponse<any[]>>('/reports/builder/style-templates', { 
      params: { componentType } 
    }),

  // Collaboration
  lockComponent: (reportId: string, componentId: string) =>
    api.post<APIResponse<any>>(`/reports/builder/${reportId}/components/${componentId}/lock`),

  unlockComponent: (reportId: string, componentId: string) =>
    api.delete<APIResponse>(`/reports/builder/${reportId}/components/${componentId}/lock`),

  getCollaborators: (reportId: string) =>
    api.get<APIResponse<any[]>>(`/reports/builder/${reportId}/collaborators`),

  inviteCollaborator: (reportId: string, data: {
    email: string;
    role: 'viewer' | 'editor' | 'admin';
    permissions: string[];
  }) => api.post<APIResponse<any>>(`/reports/builder/${reportId}/collaborators`, data),
};

export default {
  reporting: reportingAPI,
  hypothetical: hypotheticalAPI,
  customReport: customReportAPI,
};