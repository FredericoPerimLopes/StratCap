// Fund Events Types
export type EventType = 'capital_call' | 'distribution' | 'management_fee' | 'expense_allocation' | 'performance_fee';
export type EventStatus = 'draft' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'cancelled' | 'failed';

export interface FundEvent {
  event_id: string;
  fund_id: string;
  event_type: EventType;
  event_name: string;
  description?: string;
  event_date: string;
  effective_date: string;
  record_date: string;
  total_amount: number;
  calculation_method: string;
  calculation_basis: string;
  status: EventStatus;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CapitalCallEvent extends FundEvent {
  call_number: number;
  due_date: string;
  call_purpose: string;
  investment_amount: number;
  management_fee_amount: number;
  expense_amount: number;
  organizational_expense_amount: number;
  call_percentage?: number;
  minimum_call_amount?: number;
  allow_partial_funding: boolean;
}

export interface DistributionEvent extends FundEvent {
  distribution_number: number;
  payment_date: string;
  distribution_type: string;
  source_description: string;
  tax_year: number;
  withholding_required: boolean;
  default_withholding_rate: number;
  gross_distribution: number;
  management_fee_offset: number;
  expense_offset: number;
}

export interface ManagementFeeEvent extends FundEvent {
  fee_period_start: string;
  fee_period_end: string;
  fee_rate: number;
  fee_basis: string;
  calculation_frequency: string;
  prorate_for_period: boolean;
  days_in_period: number;
  payment_method: string;
  payment_due_date?: string;
}

export interface InvestorEventCalculation {
  calculation_id: string;
  event_id: string;
  investor_id: string;
  commitment_id: string;
  ownership_percentage: number;
  calculation_basis_amount: number;
  gross_amount: number;
  management_fee_offset: number;
  expense_offset: number;
  withholding_amount: number;
  net_amount: number;
  investment_portion?: number;
  management_fee_portion?: number;
  expense_portion?: number;
  calculation_status: string;
  override_reason?: string;
  created_at: string;
}

export interface EventProcessingResult {
  event_id: string;
  processing_id: string;
  total_investors_processed: number;
  total_gross_amount: number;
  total_net_amount: number;
  total_withholding: number;
  investor_calculations: InvestorEventCalculation[];
  validation_errors: string[];
  validation_warnings: string[];
  processing_status: string;
  processed_at: string;
}

export interface CreateCapitalCallRequest {
  fund_id: string;
  call_number: number;
  event_date: string;
  effective_date: string;
  record_date: string;
  due_date: string;
  call_purpose: string;
  total_amount: number;
  investment_amount: number;
  management_fee_amount: number;
  expense_amount: number;
  organizational_expense_amount: number;
  call_percentage?: number;
  minimum_call_amount?: number;
  allow_partial_funding: boolean;
}

export interface CreateDistributionRequest {
  fund_id: string;
  distribution_number: number;
  event_date: string;
  effective_date: string;
  record_date: string;
  payment_date: string;
  gross_distribution: number;
  distribution_type: string;
  source_description: string;
  tax_year: number;
  withholding_required: boolean;
  default_withholding_rate: number;
  management_fee_offset: number;
  expense_offset: number;
}

export interface CreateManagementFeeRequest {
  fund_id: string;
  fee_period_start: string;
  fee_period_end: string;
  event_date: string;
  effective_date: string;
  record_date: string;
  fee_rate: number;
  fee_basis: string;
  calculation_frequency: string;
  payment_method: string;
  payment_due_date?: string;
  prorate_for_period: boolean;
}