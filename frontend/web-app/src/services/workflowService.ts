import api from './api';
import {
  WorkflowTemplate,
  WorkflowInstance,
  WorkflowExecutionRequest,
  WorkflowStatusResponse
} from '../types/workflow';

export const workflowService = {
  // Template Management
  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    const response = await api.get('/api/workflows/templates');
    return response.data;
  },

  async getWorkflowTemplate(templateId: string): Promise<WorkflowTemplate> {
    const response = await api.get(`/api/workflows/templates/${templateId}`);
    return response.data;
  },

  async createWorkflowTemplate(template: Omit<WorkflowTemplate, 'template_id' | 'created_at'>): Promise<WorkflowTemplate> {
    const response = await api.post('/api/workflows/templates', template);
    return response.data;
  },

  async updateWorkflowTemplate(templateId: string, template: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const response = await api.put(`/api/workflows/templates/${templateId}`, template);
    return response.data;
  },

  async deleteWorkflowTemplate(templateId: string): Promise<{ message: string }> {
    const response = await api.delete(`/api/workflows/templates/${templateId}`);
    return response.data;
  },

  // Workflow Execution
  async startWorkflow(request: WorkflowExecutionRequest): Promise<{ instance_id: string; message: string }> {
    const response = await api.post('/api/workflows/start', request);
    return response.data;
  },

  async getWorkflowStatus(instanceId: string): Promise<WorkflowStatusResponse> {
    const response = await api.get(`/api/workflows/instances/${instanceId}/status`);
    return response.data;
  },

  async pauseWorkflow(instanceId: string): Promise<{ message: string }> {
    const response = await api.post(`/api/workflows/instances/${instanceId}/pause`);
    return response.data;
  },

  async resumeWorkflow(instanceId: string): Promise<{ message: string }> {
    const response = await api.post(`/api/workflows/instances/${instanceId}/resume`);
    return response.data;
  },

  async cancelWorkflow(instanceId: string, reason?: string): Promise<{ message: string }> {
    const response = await api.post(`/api/workflows/instances/${instanceId}/cancel`, {
      reason
    });
    return response.data;
  },

  async retryWorkflowStep(instanceId: string, stepId: string): Promise<{ message: string }> {
    const response = await api.post(`/api/workflows/instances/${instanceId}/steps/${stepId}/retry`);
    return response.data;
  },

  // Workflow Queries
  async getActiveWorkflows(filters?: {
    workflow_type?: string;
    fund_id?: string;
    status?: string;
  }): Promise<WorkflowInstance[]> {
    const response = await api.get('/api/workflows/instances/active', { params: filters });
    return response.data;
  },

  async getWorkflowHistory(filters?: {
    workflow_type?: string;
    fund_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<WorkflowInstance[]> {
    const response = await api.get('/api/workflows/instances/history', { params: filters });
    return response.data;
  },

  async getWorkflowMetrics(timeframe?: string): Promise<{
    total_workflows: number;
    successful_workflows: number;
    failed_workflows: number;
    average_execution_time: number;
    success_rate: number;
    workflow_type_breakdown: Record<string, number>;
    recent_activity: Array<{
      instance_id: string;
      workflow_type: string;
      status: string;
      started_at: string;
      completed_at?: string;
    }>;
  }> {
    const response = await api.get('/api/workflows/metrics', {
      params: { timeframe }
    });
    return response.data;
  },

  // Workflow Automation
  async scheduleWorkflow(
    templateId: string,
    schedule: string, // cron expression
    contextData: any,
    enabled: boolean = true
  ): Promise<{ schedule_id: string; message: string }> {
    const response = await api.post('/api/workflows/schedule', {
      template_id: templateId,
      schedule,
      context_data: contextData,
      enabled
    });
    return response.data;
  },

  async getScheduledWorkflows(): Promise<Array<{
    schedule_id: string;
    template_id: string;
    template_name: string;
    schedule: string;
    next_run: string;
    enabled: boolean;
    created_at: string;
  }>> {
    const response = await api.get('/api/workflows/scheduled');
    return response.data;
  },

  async updateSchedule(
    scheduleId: string,
    updates: {
      schedule?: string;
      context_data?: any;
      enabled?: boolean;
    }
  ): Promise<{ message: string }> {
    const response = await api.put(`/api/workflows/scheduled/${scheduleId}`, updates);
    return response.data;
  },

  async deleteSchedule(scheduleId: string): Promise<{ message: string }> {
    const response = await api.delete(`/api/workflows/scheduled/${scheduleId}`);
    return response.data;
  },

  // Workflow Monitoring
  async getWorkflowLogs(instanceId: string): Promise<Array<{
    timestamp: string;
    level: string;
    message: string;
    step_id?: string;
    metadata?: any;
  }>> {
    const response = await api.get(`/api/workflows/instances/${instanceId}/logs`);
    return response.data;
  },

  async exportWorkflowDefinition(templateId: string, format: 'json' | 'yaml' = 'json'): Promise<Blob> {
    const response = await api.get(`/api/workflows/templates/${templateId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  async importWorkflowDefinition(file: File): Promise<{ template_id: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/workflows/templates/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};