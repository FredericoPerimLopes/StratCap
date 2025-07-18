// Workflow Automation Types
export type WorkflowType = 'capital_call' | 'distribution' | 'waterfall_calculation' | 'subsequent_close' | 'quarterly_reporting' | 'annual_audit' | 'compliance_check' | 'performance_calculation';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type TriggerType = 'scheduled' | 'event_based' | 'manual' | 'conditional';

export interface WorkflowStep {
  step_id: string;
  name: string;
  description: string;
  action: string;
  parameters: any;
  dependencies: string[];
  timeout_minutes: number;
  retry_count: number;
  critical: boolean;
  status: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  result?: any;
}

export interface WorkflowTemplate {
  template_id: string;
  name: string;
  description: string;
  workflow_type: WorkflowType;
  trigger_type: TriggerType;
  steps: WorkflowStep[];
  parallel_execution: boolean;
  auto_approve: boolean;
  notification_settings: any;
  created_by: string;
  created_at: string;
  version: string;
}

export interface WorkflowInstance {
  instance_id: string;
  template_id: string;
  name: string;
  workflow_type: WorkflowType;
  fund_id?: string;
  event_id?: string;
  context_data: any;
  status: WorkflowStatus;
  current_step?: string;
  steps: WorkflowStep[];
  started_at?: string;
  completed_at?: string;
  triggered_by: string;
  results: any;
  error_log: string[];
}

export interface WorkflowExecutionRequest {
  template_id: string;
  context_data: any;
  triggered_by?: string;
}

export interface WorkflowStatusResponse {
  instance_id: string;
  name: string;
  status: WorkflowStatus;
  current_step?: string;
  started_at?: string;
  completed_at?: string;
  steps: Array<{
    step_id: string;
    name: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    error_message?: string;
  }>;
  results: any;
  error_log: string[];
}