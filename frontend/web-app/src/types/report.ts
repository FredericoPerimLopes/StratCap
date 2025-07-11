export interface Report {
  report_id: string;
  report_name: string;
  report_type: 'fund_performance' | 'investor_statement' | 'capital_call' | 'distribution' | 'tax_report' | 'compliance' | 'custom';
  description?: string;
  fund_id?: string;
  investor_id?: string;
  period_start?: string;
  period_end?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_by: string;
  created_at: string;
  completed_at?: string;
  file_path?: string;
  parameters: ReportParameters;
}

export interface ReportParameters {
  [key: string]: any;
  include_charts?: boolean;
  currency?: string;
  date_format?: string;
  grouping?: 'fund' | 'investor' | 'quarter' | 'year';
  filters?: ReportFilters;
}

export interface ReportFilters {
  fund_ids?: string[];
  investor_ids?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  status?: string[];
  minimum_amount?: number;
  maximum_amount?: number;
}

export interface ReportTemplate {
  template_id: string;
  template_name: string;
  report_type: Report['report_type'];
  description?: string;
  default_parameters: ReportParameters;
  is_system: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total_funds: number;
  total_investors: number;
  total_aum: number;
  total_committed: number;
  total_called: number;
  total_distributed: number;
  avg_fund_performance: number;
  pending_capital_calls: number;
  pending_distributions: number;
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  activity_id: string;
  activity_type: 'capital_call' | 'distribution' | 'new_investor' | 'fund_creation' | 'report_generated';
  description: string;
  timestamp: string;
  fund_id?: string;
  investor_id?: string;
  amount?: number;
  status?: string;
}

export interface PerformanceMetrics {
  fund_id: string;
  fund_name: string;
  as_of_date: string;
  nav: number;
  irr: number;
  moic: number;
  tvpi: number;
  dpi: number;
  rvpi: number;
  called_capital: number;
  distributed_capital: number;
  remaining_value: number;
  quarterly_returns: QuarterlyReturn[];
  benchmark_comparison?: BenchmarkComparison;
}

export interface QuarterlyReturn {
  quarter: string;
  year: number;
  return_percentage: number;
  nav: number;
  capital_calls: number;
  distributions: number;
}

export interface BenchmarkComparison {
  benchmark_name: string;
  benchmark_return: number;
  fund_return: number;
  outperformance: number;
  tracking_error: number;
  sharpe_ratio: number;
}

export interface CreateReportRequest {
  report_name: string;
  report_type: Report['report_type'];
  description?: string;
  fund_id?: string;
  investor_id?: string;
  period_start?: string;
  period_end?: string;
  parameters: ReportParameters;
}

export interface ReportSchedule {
  schedule_id: string;
  report_template_id: string;
  schedule_name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  next_run: string;
  is_active: boolean;
  recipients: string[];
  created_at: string;
  updated_at: string;
}