// Data Consolidation Types
export type DataSourceType = 'fund_management' | 'accounting' | 'legal' | 'compliance' | 'external_admin' | 'custodian' | 'transfer_agent' | 'audit';
export type DataStatus = 'current' | 'stale' | 'reconciling' | 'error' | 'pending_approval';

export interface DataSource {
  source_id: string;
  name: string;
  source_type: DataSourceType;
  connection_config: any;
  update_frequency: string;
  last_update?: string;
  status: DataStatus;
  error_message?: string;
}

export interface ConsolidatedDataRecord {
  record_id: string;
  entity_type: string;
  entity_id: string;
  data: any;
  primary_source: string;
  contributing_sources: string[];
  confidence_score: number;
  completeness_score: number;
  consistency_score: number;
  as_of_date: string;
  created_at: string;
  updated_at: string;
  validation_status: string;
  validation_errors: string[];
  validation_warnings: string[];
}

export interface ConsolidatedFundData {
  fund_basic_info: ConsolidatedDataRecord;
  fund_performance: ConsolidatedDataRecord;
  fund_positions: any;
  fund_cashflows: any;
  fund_compliance: ConsolidatedDataRecord;
  investors: Record<string, ConsolidatedDataRecord>;
  commitments: Record<string, ConsolidatedDataRecord>;
  events: Record<string, ConsolidatedDataRecord>;
  legal_documents: any;
  consolidation_metadata: {
    consolidation_date: string;
    sources_used: string[];
    quality_scores: {
      overall_confidence: number;
      overall_completeness: number;
      overall_consistency: number;
    };
    reconciliation_status: {
      last_reconciliation: string;
      pending_reconciliations: number;
      failed_reconciliations: number;
      overall_status: string;
    };
  };
}

export interface ReconciliationResult {
  entity_type: string;
  entity_id: string;
  reconciliation_date: string;
  matching_fields: string[];
  differing_fields: string[];
  missing_from_primary: string[];
  missing_from_secondary: string[];
  resolution_required: boolean;
  resolution_status: string;
  resolved_by?: string;
  resolved_at?: string;
}

export interface DataQualityMetrics {
  overall_score: number;
  confidence_score: number;
  completeness_score: number;
  consistency_score: number;
  data_freshness: number;
  reconciliation_health: number;
  source_reliability: Record<string, number>;
}