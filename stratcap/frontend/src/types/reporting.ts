// Advanced Reporting and Analytics Types

export interface ReportMetadata {
  id: string;
  name: string;
  description?: string;
  category: ReportCategory;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastRunAt?: Date;
  version: number;
  isPublic: boolean;
  permissions: ReportPermissions;
}

export interface ReportPermissions {
  canView: string[];
  canEdit: string[];
  canDelete: string[];
  canSchedule: string[];
}

export type ReportCategory = 
  | 'financial' 
  | 'operational' 
  | 'compliance' 
  | 'performance' 
  | 'portfolio'
  | 'investor'
  | 'custom';

export interface ReportConfiguration {
  dataSource: DataSource;
  parameters: ReportParameter[];
  filters: ReportFilter[];
  groupings: ReportGrouping[];
  calculations: ReportCalculation[];
  formatting: ReportFormatting;
  visualization: VisualizationConfig[];
}

export interface DataSource {
  type: 'fund' | 'investor' | 'commitment' | 'transaction' | 'waterfall' | 'custom_query';
  entity?: string;
  query?: string;
  joins?: DataJoin[];
  includes?: string[];
}

export interface DataJoin {
  type: 'inner' | 'left' | 'right' | 'full';
  table: string;
  on: string;
  alias?: string;
}

export interface ReportParameter {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: any;
  options?: ParameterOption[];
  validation?: ParameterValidation;
}

export interface ParameterOption {
  value: any;
  label: string;
  group?: string;
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  logical?: 'AND' | 'OR';
  group?: string;
}

export type FilterOperator = 
  | 'equals' 
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_null'
  | 'is_not_null'
  | 'in'
  | 'not_in'
  | 'between';

export interface ReportGrouping {
  field: string;
  order: 'asc' | 'desc';
  level: number;
  includeSubtotals: boolean;
  includeGrandTotal: boolean;
}

export interface ReportCalculation {
  id: string;
  name: string;
  type: CalculationType;
  expression: string;
  fields?: string[];
  format?: string;
}

export type CalculationType = 
  | 'sum'
  | 'avg'
  | 'count'
  | 'min'
  | 'max'
  | 'formula'
  | 'percentage'
  | 'running_total'
  | 'rank'
  | 'variance'
  | 'correlation';

export interface ReportFormatting {
  pageSize?: 'A4' | 'Letter' | 'Legal' | 'A3';
  orientation?: 'portrait' | 'landscape';
  margins?: Margins;
  header?: ReportSection;
  footer?: ReportSection;
  fonts?: FontConfig;
  colors?: ColorConfig;
  borders?: BorderConfig;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ReportSection {
  content: string;
  height?: number;
  alignment?: 'left' | 'center' | 'right';
  includePageNumbers?: boolean;
  includeDate?: boolean;
}

export interface FontConfig {
  family: string;
  sizes: {
    title: number;
    heading: number;
    body: number;
    caption: number;
  };
}

export interface ColorConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

export interface BorderConfig {
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
}

export interface VisualizationConfig {
  id: string;
  type: ChartType;
  title: string;
  position: ChartPosition;
  size: ChartSize;
  data: ChartDataConfig;
  style: ChartStyleConfig;
}

export type ChartType = 
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'treemap'
  | 'waterfall'
  | 'funnel'
  | 'gauge'
  | 'table';

export interface ChartPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChartSize {
  width: number;
  height: number;
}

export interface ChartDataConfig {
  xAxis: string;
  yAxis: string[];
  series?: string;
  aggregation?: CalculationType;
  filters?: ReportFilter[];
}

export interface ChartStyleConfig {
  colors: string[];
  theme: 'light' | 'dark';
  legend: {
    position: 'top' | 'bottom' | 'left' | 'right' | 'none';
    alignment?: 'start' | 'center' | 'end';
  };
  axes?: AxisConfig;
  tooltip?: TooltipConfig;
}

export interface AxisConfig {
  x: {
    title?: string;
    format?: string;
    grid?: boolean;
    rotate?: number;
  };
  y: {
    title?: string;
    format?: string;
    grid?: boolean;
    min?: number;
    max?: number;
  };
}

export interface TooltipConfig {
  enabled: boolean;
  format?: string;
  backgroundColor?: string;
  textColor?: string;
}

// Hypothetical Waterfall Types
export interface HypotheticalScenario {
  id: string;
  name: string;
  description?: string;
  fundId: number;
  baseDate: Date;
  parameters: ScenarioParameters;
  results?: ScenarioResults;
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'calculating' | 'completed' | 'error';
}

export interface ScenarioParameters {
  totalProceeds: number;
  proceedsDate: Date;
  assumptions: ScenarioAssumptions;
  overrides: ParameterOverrides;
  sensitivities?: SensitivityAnalysis[];
}

export interface ScenarioAssumptions {
  exitValuation?: number;
  exitMultiple?: number;
  holdingPeriod?: number;
  additionalCapital?: CapitalAssumption[];
  expenses?: ExpenseAssumption[];
  distributions?: DistributionAssumption[];
}

export interface CapitalAssumption {
  date: Date;
  amount: number;
  purpose: string;
}

export interface ExpenseAssumption {
  type: string;
  amount: number;
  frequency: 'one_time' | 'annual' | 'quarterly' | 'monthly';
  startDate: Date;
  endDate?: Date;
}

export interface DistributionAssumption {
  date: Date;
  amount: number;
  type: 'regular' | 'special' | 'interim';
}

export interface ParameterOverrides {
  managementFeeRate?: number;
  carriedInterestRate?: number;
  preferredReturnRate?: number;
  catchUpPercentage?: number;
  waterfallStructure?: WaterfallOverride[];
}

export interface WaterfallOverride {
  tier: number;
  threshold?: number;
  allocationPercentage: {
    limitedPartners: number;
    generalPartner: number;
  };
}

export interface SensitivityAnalysis {
  parameter: string;
  baseValue: number;
  scenarios: SensitivityScenario[];
}

export interface SensitivityScenario {
  name: string;
  value: number;
  variance: number;
}

export interface ScenarioResults {
  totalProceeds: number;
  lpProceeds: number;
  gpProceeds: number;
  carriedInterest: number;
  preferredReturn: number;
  managementFees: number;
  netIRR: number;
  grossIRR: number;
  netTVPI: number;
  grossTVPI: number;
  netMOIC: number;
  grossMOIC: number;
  dpi: number;
  rvpi: number;
  waterfallSteps: WaterfallStep[];
  cashFlows: CashFlowProjection[];
  allocations: AllocationResult[];
}

export interface WaterfallStep {
  step: number;
  description: string;
  amount: number;
  cumulativeAmount: number;
  lpAllocation: number;
  gpAllocation: number;
  carriedInterest: number;
}

export interface CashFlowProjection {
  date: Date;
  capitalCalled: number;
  distributions: number;
  netCashFlow: number;
  cumulativeNetCashFlow: number;
  netAssetValue: number;
}

export interface AllocationResult {
  investorId: number;
  investorName: string;
  commitment: number;
  capitalCalled: number;
  capitalReturned: number;
  preferredReturn: number;
  carriedInterest: number;
  totalProceeds: number;
  netIRR: number;
  netTVPI: number;
  netMOIC: number;
}

// Scenario Comparison Types
export interface ScenarioComparison {
  id: string;
  name: string;
  scenarios: string[];
  comparisonType: 'side_by_side' | 'overlay' | 'variance';
  metrics: ComparisonMetric[];
  visualizations: ComparisonVisualization[];
  createdAt: Date;
}

export interface ComparisonMetric {
  name: string;
  type: 'absolute' | 'percentage' | 'ratio';
  format?: string;
  highlight?: 'best' | 'worst' | 'variance';
}

export interface ComparisonVisualization {
  type: ChartType;
  title: string;
  metrics: string[];
  style: ChartStyleConfig;
}

// Performance Metrics Types
export interface PerformanceMetrics {
  asOfDate: Date;
  fundId: number;
  netIRR: number;
  grossIRR: number;
  netTVPI: number;
  grossTVPI: number;
  netMOIC: number;
  grossMOIC: number;
  dpi: number;
  rvpi: number;
  pmePlusOne: number;
  pmePlusOneIndex: string;
  benchmarkComparison: BenchmarkComparison[];
  quartileRanking: QuartileRanking;
  attribution: PerformanceAttribution;
}

export interface BenchmarkComparison {
  benchmarkName: string;
  benchmarkReturn: number;
  outperformance: number;
  pValue?: number;
  significance?: 'high' | 'medium' | 'low';
}

export interface QuartileRanking {
  vintage: number;
  strategy: string;
  quartile: 1 | 2 | 3 | 4;
  percentile: number;
  universeSize: number;
}

export interface PerformanceAttribution {
  marketTiming: number;
  securitySelection: number;
  industryAllocation: number;
  interaction: number;
  total: number;
  breakdown: AttributionBreakdown[];
}

export interface AttributionBreakdown {
  category: string;
  contribution: number;
  percentage: number;
}

// What-If Analysis Types
export interface WhatIfAnalysis {
  id: string;
  name: string;
  baseScenarioId: string;
  variables: WhatIfVariable[];
  iterations: number;
  method: 'monte_carlo' | 'sensitivity' | 'scenario_tree';
  results?: WhatIfResults;
  status: 'configuring' | 'running' | 'completed' | 'error';
}

export interface WhatIfVariable {
  parameter: string;
  distribution: 'normal' | 'uniform' | 'triangular' | 'discrete';
  parameters: DistributionParameters;
  correlation?: VariableCorrelation[];
}

export interface DistributionParameters {
  mean?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  mode?: number;
  values?: number[];
  probabilities?: number[];
}

export interface VariableCorrelation {
  variable: string;
  coefficient: number;
}

export interface WhatIfResults {
  summary: WhatIfSummary;
  distributions: ResultDistribution[];
  scenarios: WhatIfScenario[];
  sensitivities: SensitivityResult[];
  risks: RiskMetric[];
}

export interface WhatIfSummary {
  iterations: number;
  convergence: boolean;
  executionTime: number;
  statistics: WhatIfStatistics;
}

export interface WhatIfStatistics {
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  min: number;
  max: number;
  percentiles: { [key: string]: number };
}

export interface ResultDistribution {
  metric: string;
  distribution: number[];
  percentiles: { [key: string]: number };
  statistics: WhatIfStatistics;
}

export interface WhatIfScenario {
  id: string;
  inputs: { [key: string]: number };
  outputs: { [key: string]: number };
  probability: number;
}

export interface SensitivityResult {
  variable: string;
  correlation: number;
  elasticity: number;
  impact: number;
}

export interface RiskMetric {
  name: string;
  value: number;
  threshold?: number;
  status: 'low' | 'medium' | 'high';
  description?: string;
}

// Export Types
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'xml';

export interface ExportOptions {
  format: ExportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  compression?: boolean;
  password?: string;
}

export interface ExportResult {
  filename: string;
  url: string;
  size: number;
  expiresAt: Date;
}