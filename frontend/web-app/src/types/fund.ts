export interface Fund {
  fund_id: string;
  fund_name: string;
  fund_type: 'private_equity' | 'venture_capital' | 'hedge_fund' | 'real_estate';
  fund_status: 'active' | 'closed' | 'liquidated';
  inception_date: string;
  target_size: number;
  committed_capital: number;
  called_capital: number;
  paid_in_capital: number;
  nav: number;
  irr: number;
  moic: number;
  management_fee_rate: number;
  carry_rate: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface FundPerformance {
  fund_id: string;
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
}

export interface CapitalCall {
  call_id: string;
  fund_id: string;
  call_date: string;
  due_date: string;
  total_amount: number;
  call_percentage: number;
  status: 'pending' | 'completed' | 'overdue';
  investor_calls: InvestorCapitalCall[];
}

export interface InvestorCapitalCall {
  investor_id: string;
  call_amount: number;
  paid_amount: number;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Distribution {
  distribution_id: string;
  fund_id: string;
  distribution_date: string;
  total_amount: number;
  distribution_type: 'return_of_capital' | 'capital_gains' | 'dividend';
  status: 'pending' | 'completed';
  investor_distributions: InvestorDistribution[];
}

export interface InvestorDistribution {
  investor_id: string;
  distribution_amount: number;
  tax_withholding: number;
  net_amount: number;
  payment_date?: string;
  status: 'pending' | 'paid';
}

export interface CreateFundRequest {
  fund_name: string;
  fund_type: Fund['fund_type'];
  inception_date: string;
  target_size: number;
  management_fee_rate: number;
  carry_rate: number;
  description?: string;
}

export interface UpdateFundRequest extends Partial<CreateFundRequest> {
  fund_id: string;
}