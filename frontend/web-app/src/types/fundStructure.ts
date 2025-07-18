// Fund Structure Types
export interface FundStructure {
  fund_id: string;
  fund_name: string;
  fund_type: string;
  structure_type: 'main' | 'parallel' | 'feeder' | 'master' | 'blocker' | 'aggregator';
  fund_status: string;
  parent_fund_id?: string;
  master_fund_id?: string;
  inception_date: string;
  target_size: number;
  min_commitment: number;
  max_commitment?: number;
  max_investors?: number;
  eligible_investor_types: string[];
  restricted_jurisdictions: string[];
  management_fee_rate: number;
  carry_rate: number;
  committed_capital: number;
  called_capital: number;
  paid_in_capital: number;
  nav: number;
  child_funds: string[];
  sibling_funds: string[];
  allocation_strategy: string;
  allocation_rules?: any;
  description?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface FundRelationship {
  relationship_id: string;
  parent_fund_id: string;
  child_fund_id: string;
  relationship_type: string;
  allocation_percentage?: number;
  fee_sharing_percentage?: number;
  cross_investment_allowed: boolean;
  created_at: string;
}

export interface FundStructureTree {
  root_fund: FundStructure;
  relationships: FundRelationship[];
  total_target_size: number;
  total_committed: number;
  total_investors: number;
}

export interface AllocationRequest {
  investor_id: string;
  fund_id: string;
  requested_amount: number;
  investor_type: string;
  jurisdiction: string;
  preference_order: string[];
  accepts_side_letter: boolean;
  tax_transparent_required: boolean;
  erisa_percentage?: number;
}

export interface AllocationResult {
  request_id: string;
  investor_id: string;
  total_requested: number;
  total_allocated: number;
  allocation_status: 'full' | 'partial' | 'rejected';
  allocations: Array<{
    fund_id: string;
    fund_name: string;
    allocated_amount: number;
    percentage: number;
  }>;
  rejection_reasons: string[];
  alternative_funds: Array<{
    fund_id: string;
    fund_name: string;
    suggestion: string;
    min_commitment: number;
  }>;
  timestamp: string;
}

export interface CreateFundStructureRequest {
  fund_name: string;
  fund_type: string;
  structure_type: 'main' | 'parallel' | 'feeder' | 'master' | 'blocker' | 'aggregator';
  parent_fund_id?: string;
  inception_date: string;
  target_size: number;
  min_commitment: number;
  max_commitment?: number;
  max_investors?: number;
  eligible_investor_types: string[];
  restricted_jurisdictions: string[];
  management_fee_rate: number;
  carry_rate: number;
  allocation_strategy: string;
  allocation_rules?: any;
  description?: string;
}