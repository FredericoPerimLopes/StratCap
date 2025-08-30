import { Decimal } from 'decimal.js';

// Base Types
export interface Fund {
  id: string;
  name: string;
  inception_date: string;
  commitment: Decimal;
  currency: string;
}

export interface Investor {
  id: string;
  name: string;
  type: 'individual' | 'institutional' | 'fund_of_funds';
  commitment: Decimal;
  called_capital: Decimal;
  paid_capital: Decimal;
  unfunded_commitment: Decimal;
  distributions: Decimal;
}

// Capital Call Types
export interface CapitalCall {
  id: string;
  fund_id: string;
  call_number: number;
  purpose: string;
  call_date: string;
  due_date: string;
  total_call_amount: Decimal;
  status: 'draft' | 'pending_approval' | 'approved' | 'issued' | 'completed';
  allocations: CapitalCallAllocation[];
  created_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

export interface CapitalCallAllocation {
  id: string;
  capital_call_id: string;
  investor_id: string;
  call_amount: Decimal;
  percentage: Decimal;
  payment_status: 'pending' | 'paid' | 'defaulted' | 'partially_paid';
  paid_amount?: Decimal;
  paid_date?: string;
  notes?: string;
}

export interface CapitalCallCreationRequest {
  fund_id: string;
  purpose: string;
  call_date: string;
  due_date: string;
  total_call_amount: Decimal;
  allocation_method: 'proportional' | 'custom' | 'equalization';
  custom_allocations?: { investor_id: string; amount: Decimal }[];
}

// Distribution Types
export interface Distribution {
  id: string;
  fund_id: string;
  distribution_number: number;
  distribution_date: string;
  ex_date: string;
  total_distribution: Decimal;
  distribution_type: 'return_of_capital' | 'capital_gain' | 'income' | 'mixed';
  status: 'draft' | 'pending_approval' | 'approved' | 'distributed';
  allocations: DistributionAllocation[];
  waterfall_results?: WaterfallResult[];
  tax_information?: TaxInformation;
  created_by: string;
  created_at: string;
}

export interface DistributionAllocation {
  id: string;
  distribution_id: string;
  investor_id: string;
  distribution_amount: Decimal;
  return_of_capital: Decimal;
  capital_gain: Decimal;
  income: Decimal;
  tax_withholding: Decimal;
  net_distribution: Decimal;
}

export interface TaxInformation {
  tax_year: number;
  k1_forms_required: boolean;
  withholding_details: WithholdingDetail[];
}

export interface WithholdingDetail {
  investor_id: string;
  federal_withholding: Decimal;
  state_withholding: Decimal;
  foreign_withholding: Decimal;
}

// Waterfall Types
export interface WaterfallStructure {
  id: string;
  fund_id: string;
  name: string;
  type: 'american' | 'european' | 'hybrid';
  tiers: WaterfallTier[];
  catch_up_percentage?: Decimal;
  preferred_return?: Decimal;
  carry_percentage?: Decimal;
  is_active: boolean;
}

export interface WaterfallTier {
  id: string;
  tier_number: number;
  description: string;
  allocation_percentage: Decimal;
  cumulative_threshold?: Decimal;
  irr_threshold?: Decimal;
  multiple_threshold?: Decimal;
}

export interface WaterfallCalculation {
  id: string;
  distribution_id: string;
  waterfall_structure_id: string;
  total_distributions: Decimal;
  total_contributions: Decimal;
  current_nav: Decimal;
  irr: Decimal;
  multiple: Decimal;
  tier_results: WaterfallTierResult[];
  lp_allocation: Decimal;
  gp_allocation: Decimal;
  carry_allocation: Decimal;
  calculated_at: string;
}

export interface WaterfallTierResult {
  tier_id: string;
  tier_number: number;
  tier_description: string;
  amount_allocated: Decimal;
  lp_share: Decimal;
  gp_share: Decimal;
  cumulative_amount: Decimal;
  remaining_amount: Decimal;
}

export interface WaterfallResult {
  investor_id: string;
  total_allocation: Decimal;
  tier_allocations: { tier_id: string; amount: Decimal }[];
  preferred_return: Decimal;
  carry_allocation: Decimal;
}

// Equalization Types
export interface Equalization {
  id: string;
  fund_id: string;
  equalization_date: string;
  reason: string;
  total_adjustment: Decimal;
  adjustments: EqualizationAdjustment[];
  status: 'draft' | 'pending_approval' | 'approved' | 'applied';
  created_by: string;
  created_at: string;
}

export interface EqualizationAdjustment {
  id: string;
  equalization_id: string;
  investor_id: string;
  adjustment_type: 'capital_call' | 'distribution' | 'nav_adjustment';
  adjustment_amount: Decimal;
  effective_date: string;
  reason: string;
  supporting_documents?: string[];
}

// Audit and History Types
export interface AuditTrail {
  id: string;
  entity_type: 'capital_call' | 'distribution' | 'waterfall' | 'equalization';
  entity_id: string;
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'deleted';
  changes: AuditChange[];
  performed_by: string;
  performed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditChange {
  field: string;
  old_value: any;
  new_value: any;
}

// Calculation Types
export interface CalculationRequest {
  fund_id: string;
  calculation_type: 'capital_call' | 'distribution' | 'waterfall' | 'equalization';
  parameters: Record<string, any>;
  effective_date: string;
}

export interface CalculationResult {
  success: boolean;
  data?: any;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  calculation_time: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Form Types
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  isComplete: boolean;
  isValid: boolean;
  component: React.ComponentType<any>;
}

export interface WizardState {
  currentStep: number;
  steps: WizardStep[];
  data: Record<string, any>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Export and Reporting Types
export interface ExportRequest {
  entity_type: 'capital_call' | 'distribution' | 'waterfall' | 'investor_statement';
  entity_ids: string[];
  format: 'pdf' | 'excel' | 'csv';
  template?: string;
  parameters?: Record<string, any>;
}

export interface ExportResult {
  success: boolean;
  file_url?: string;
  file_name?: string;
  error?: string;
}

// UI State Types
export interface CapitalActivityState {
  calls: CapitalCall[];
  distributions: Distribution[];
  waterfalls: WaterfallCalculation[];
  equalizations: Equalization[];
  loading: boolean;
  error: string | null;
  selectedFund?: Fund;
  filters: CapitalActivityFilters;
}

export interface CapitalActivityFilters {
  fund_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  investor_id?: string;
}
