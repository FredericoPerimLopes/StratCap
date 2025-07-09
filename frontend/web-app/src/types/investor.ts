export interface Investor {
  investor_id: string;
  investor_name: string;
  investor_type: 'institutional' | 'individual' | 'family_office' | 'pension_fund' | 'endowment' | 'sovereign_wealth' | 'insurance';
  email: string;
  phone?: string;
  address?: Address;
  tax_id?: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  aml_status: 'pending' | 'approved' | 'rejected';
  accredited_investor: boolean;
  qualified_purchaser: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface InvestorCommitment {
  commitment_id: string;
  investor_id: string;
  fund_id: string;
  commitment_amount: number;
  commitment_date: string;
  commitment_percentage: number;
  called_amount: number;
  uncalled_amount: number;
  distributed_amount: number;
  current_value: number;
  status: 'active' | 'fulfilled' | 'withdrawn';
}

export interface InvestorStatement {
  statement_id: string;
  investor_id: string;
  fund_id: string;
  statement_date: string;
  period_start: string;
  period_end: string;
  beginning_balance: number;
  capital_calls: number;
  distributions: number;
  management_fees: number;
  performance_fees: number;
  other_fees: number;
  unrealized_gains: number;
  realized_gains: number;
  ending_balance: number;
  irr: number;
  moic: number;
}

export interface InvestorDocument {
  document_id: string;
  investor_id: string;
  document_type: 'subscription_agreement' | 'kyc_document' | 'tax_form' | 'statement' | 'notice' | 'other';
  document_name: string;
  file_path: string;
  upload_date: string;
  uploaded_by: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CreateInvestorRequest {
  investor_name: string;
  investor_type: Investor['investor_type'];
  email: string;
  phone?: string;
  address?: Address;
  tax_id?: string;
  accredited_investor: boolean;
  qualified_purchaser: boolean;
}

export interface UpdateInvestorRequest extends Partial<CreateInvestorRequest> {
  investor_id: string;
}

export interface CreateCommitmentRequest {
  investor_id: string;
  fund_id: string;
  commitment_amount: number;
  commitment_date: string;
}