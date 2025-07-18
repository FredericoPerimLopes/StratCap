import api from './api';
import {
  DataSource,
  ConsolidatedFundData,
  ConsolidatedDataRecord,
  ReconciliationResult,
  DataQualityMetrics
} from '../types/dataConsolidation';

export const dataConsolidationService = {
  // Data Sources Management
  async getDataSources(): Promise<DataSource[]> {
    const response = await api.get('/api/data-consolidation/sources');
    return response.data;
  },

  async getDataSource(sourceId: string): Promise<DataSource> {
    const response = await api.get(`/api/data-consolidation/sources/${sourceId}`);
    return response.data;
  },

  async registerDataSource(source: Omit<DataSource, 'last_update' | 'status'>): Promise<DataSource> {
    const response = await api.post('/api/data-consolidation/sources', source);
    return response.data;
  },

  async updateDataSource(sourceId: string, updates: Partial<DataSource>): Promise<DataSource> {
    const response = await api.put(`/api/data-consolidation/sources/${sourceId}`, updates);
    return response.data;
  },

  async testDataSourceConnection(sourceId: string): Promise<{
    success: boolean;
    message: string;
    response_time_ms?: number;
    last_test: string;
  }> {
    const response = await api.post(`/api/data-consolidation/sources/${sourceId}/test`);
    return response.data;
  },

  async refreshDataSource(sourceId: string): Promise<{
    success: boolean;
    message: string;
    records_updated: number;
    last_update: string;
  }> {
    const response = await api.post(`/api/data-consolidation/sources/${sourceId}/refresh`);
    return response.data;
  },

  // Fund Data Consolidation
  async getConsolidatedFundData(fundId: string, asOfDate?: string): Promise<ConsolidatedFundData> {
    const response = await api.get(`/api/data-consolidation/funds/${fundId}`, {
      params: { as_of_date: asOfDate }
    });
    return response.data;
  },

  async triggerFundConsolidation(fundId: string, forceFresh: boolean = false): Promise<{
    success: boolean;
    message: string;
    consolidation_id: string;
    estimated_completion: string;
  }> {
    const response = await api.post(`/api/data-consolidation/funds/${fundId}/consolidate`, {
      force_fresh: forceFresh
    });
    return response.data;
  },

  async getConsolidationStatus(consolidationId: string): Promise<{
    consolidation_id: string;
    status: string;
    progress_percentage: number;
    current_step: string;
    started_at: string;
    estimated_completion?: string;
    completed_at?: string;
    error_message?: string;
  }> {
    const response = await api.get(`/api/data-consolidation/status/${consolidationId}`);
    return response.data;
  },

  // Data Quality and Metrics
  async getDataQualityMetrics(
    entityType?: string,
    entityId?: string,
    timeframe?: string
  ): Promise<DataQualityMetrics> {
    const response = await api.get('/api/data-consolidation/quality-metrics', {
      params: { entity_type: entityType, entity_id: entityId, timeframe }
    });
    return response.data;
  },

  async getDataQualityTrends(
    metricType: string,
    timeframe: string = '30d'
  ): Promise<Array<{
    date: string;
    value: number;
    entity_type?: string;
  }>> {
    const response = await api.get('/api/data-consolidation/quality-trends', {
      params: { metric_type: metricType, timeframe }
    });
    return response.data;
  },

  // Data Reconciliation
  async triggerReconciliation(
    entityType: string,
    entityId: string,
    primarySource: string,
    secondarySource: string
  ): Promise<ReconciliationResult> {
    const response = await api.post('/api/data-consolidation/reconcile', {
      entity_type: entityType,
      entity_id: entityId,
      primary_source: primarySource,
      secondary_source: secondarySource
    });
    return response.data;
  },

  async getReconciliationResults(
    entityType?: string,
    entityId?: string,
    status?: string
  ): Promise<ReconciliationResult[]> {
    const response = await api.get('/api/data-consolidation/reconciliation-results', {
      params: { entity_type: entityType, entity_id: entityId, status }
    });
    return response.data;
  },

  async resolveReconciliation(
    reconciliationId: string,
    resolution: {
      resolution_action: 'accept_primary' | 'accept_secondary' | 'manual_override';
      override_values?: Record<string, any>;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/api/data-consolidation/reconciliation/${reconciliationId}/resolve`, resolution);
    return response.data;
  },

  // Data Lineage and Audit
  async getDataLineage(entityType: string, entityId: string): Promise<{
    entity_type: string;
    entity_id: string;
    data_lineage: Array<{
      source_id: string;
      source_name: string;
      contribution_type: string;
      last_updated: string;
      confidence_score: number;
      field_mappings: Record<string, string>;
    }>;
    transformation_history: Array<{
      timestamp: string;
      transformation_type: string;
      description: string;
      performed_by: string;
    }>;
  }> {
    const response = await api.get(`/api/data-consolidation/lineage/${entityType}/${entityId}`);
    return response.data;
  },

  async getDataAuditTrail(
    entityType: string,
    entityId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Array<{
    timestamp: string;
    action: string;
    user_id: string;
    source_id: string;
    field_changes: Record<string, { old_value: any; new_value: any }>;
    confidence_impact: number;
  }>> {
    const response = await api.get(`/api/data-consolidation/audit-trail/${entityType}/${entityId}`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Data Validation and Cleanup
  async validateDataRecord(
    entityType: string,
    entityId: string,
    validationRules?: string[]
  ): Promise<{
    valid: boolean;
    validation_errors: string[];
    validation_warnings: string[];
    confidence_score: number;
    completeness_score: number;
  }> {
    const response = await api.post('/api/data-consolidation/validate', {
      entity_type: entityType,
      entity_id: entityId,
      validation_rules: validationRules
    });
    return response.data;
  },

  async getDataInconsistencies(
    fundId?: string,
    threshold?: number
  ): Promise<Array<{
    entity_type: string;
    entity_id: string;
    inconsistency_type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    sources_involved: string[];
    suggested_resolution: string;
    auto_resolvable: boolean;
  }>> {
    const response = await api.get('/api/data-consolidation/inconsistencies', {
      params: { fund_id: fundId, threshold }
    });
    return response.data;
  },

  async cleanupStaleData(olderThanDays: number, dryRun: boolean = true): Promise<{
    records_to_cleanup: number;
    estimated_space_freed: string;
    cleanup_summary: Record<string, number>;
    dry_run: boolean;
  }> {
    const response = await api.post('/api/data-consolidation/cleanup', {
      older_than_days: olderThanDays,
      dry_run: dryRun
    });
    return response.data;
  },

  // Dashboard and Monitoring
  async getConsolidationDashboard(): Promise<{
    total_entities: number;
    data_sources_count: number;
    active_sources: number;
    failed_sources: number;
    average_quality_score: number;
    recent_consolidations: Array<{
      fund_id: string;
      fund_name: string;
      consolidation_date: string;
      quality_score: number;
      status: string;
    }>;
    quality_trends: Array<{
      date: string;
      confidence: number;
      completeness: number;
      consistency: number;
    }>;
    pending_reconciliations: number;
    critical_issues: Array<{
      entity_type: string;
      entity_id: string;
      issue_type: string;
      severity: string;
      description: string;
    }>;
  }> {
    const response = await api.get('/api/data-consolidation/dashboard');
    return response.data;
  }
};