import api from './api';
import {
  FundEvent,
  CapitalCallEvent,
  DistributionEvent,
  ManagementFeeEvent,
  EventProcessingResult,
  CreateCapitalCallRequest,
  CreateDistributionRequest,
  CreateManagementFeeRequest,
  InvestorEventCalculation
} from '../types/fundEvents';

export const fundEventsService = {
  // Capital Calls
  async createCapitalCall(data: CreateCapitalCallRequest): Promise<CapitalCallEvent> {
    const response = await api.post('/api/fund-events/capital-calls', null, { params: data });
    return response.data;
  },

  // Distributions
  async createDistribution(data: CreateDistributionRequest): Promise<DistributionEvent> {
    const response = await api.post('/api/fund-events/distributions', null, { params: data });
    return response.data;
  },

  // Management Fees
  async createManagementFee(data: CreateManagementFeeRequest): Promise<ManagementFeeEvent> {
    const response = await api.post('/api/fund-events/management-fees', null, { params: data });
    return response.data;
  },

  // Event Processing
  async processEvent(
    eventId: string,
    options: {
      auto_approve?: boolean;
      send_notifications?: boolean;
    } = {}
  ): Promise<EventProcessingResult> {
    const response = await api.post(`/api/fund-events/${eventId}/process`, null, {
      params: options
    });
    return response.data;
  },

  // Event Management
  async approveEvent(eventId: string, approvalNotes?: string): Promise<{ message: string }> {
    const response = await api.post(`/api/fund-events/${eventId}/approve`, null, {
      params: { approval_notes: approvalNotes }
    });
    return response.data;
  },

  async cancelEvent(eventId: string, cancellationReason: string): Promise<{ message: string }> {
    const response = await api.post(`/api/fund-events/${eventId}/cancel`, null, {
      params: { cancellation_reason: cancellationReason }
    });
    return response.data;
  },

  async reverseEvent(eventId: string, reversalReason: string): Promise<{
    message: string;
    reversal_id: string;
    reversal_data: any;
  }> {
    const response = await api.post(`/api/fund-events/${eventId}/reverse`, null, {
      params: { reversal_reason: reversalReason }
    });
    return response.data;
  },

  // Event Queries
  async getFundEvents(
    fundId: string,
    filters?: {
      event_type?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{ fund_id: string; events: FundEvent[] }> {
    const response = await api.get(`/api/fund-events/funds/${fundId}`, { params: filters });
    return response.data;
  },

  async getEventHistory(eventId: string): Promise<{ event_id: string; history: any[] }> {
    const response = await api.get(`/api/fund-events/${eventId}/history`);
    return response.data;
  },

  async getEventCalculations(
    eventId: string,
    investorId?: string
  ): Promise<{
    event_id: string;
    calculations: any[];
    summary: {
      total_investors: number;
      total_gross_amount: number;
      total_net_amount: number;
    };
  }> {
    const response = await api.get(`/api/fund-events/${eventId}/calculations`, {
      params: { investor_id: investorId }
    });
    return response.data;
  },

  async getInvestorEventSummary(
    investorId: string,
    filters?: {
      fund_id?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{
    investor_id: string;
    fund_id?: string;
    summary: {
      total_capital_calls: number;
      total_called_amount: number;
      total_distributions: number;
      total_distributed_amount: number;
      total_management_fees: number;
      total_fee_amount: number;
      net_investment: number;
    };
    events: Array<{
      event_id: string;
      event_type: string;
      event_date: string;
      amount: number;
      status: string;
    }>;
  }> {
    const response = await api.get(`/api/fund-events/investors/${investorId}/summary`, {
      params: filters
    });
    return response.data;
  },

  // Bulk operations
  async batchProcessEvents(
    eventIds: string[],
    options: {
      auto_approve?: boolean;
      send_notifications?: boolean;
    } = {}
  ): Promise<EventProcessingResult[]> {
    const response = await api.post('/api/fund-events/batch-process', {
      event_ids: eventIds,
      ...options
    });
    return response.data;
  },

  async scheduleEvent(
    eventId: string,
    scheduledDate: string,
    options?: any
  ): Promise<{ message: string; scheduled_for: string }> {
    const response = await api.post(`/api/fund-events/${eventId}/schedule`, {
      scheduled_date: scheduledDate,
      ...options
    });
    return response.data;
  }
};