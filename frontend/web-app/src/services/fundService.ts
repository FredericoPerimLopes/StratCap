import api from './api';
import { Fund, FundPerformance, CapitalCall, Distribution, CreateFundRequest, UpdateFundRequest } from '../types/fund';

class FundService {
  // Fund CRUD operations
  async getFunds(): Promise<Fund[]> {
    const response = await api.get('/funds');
    return response.data;
  }

  async getFund(fundId: string): Promise<Fund> {
    const response = await api.get(`/funds/${fundId}`);
    return response.data;
  }

  async createFund(fund: CreateFundRequest): Promise<Fund> {
    const response = await api.post('/funds', fund);
    return response.data;
  }

  async updateFund(fund: UpdateFundRequest): Promise<Fund> {
    const response = await api.put(`/funds/${fund.fund_id}`, fund);
    return response.data;
  }

  async deleteFund(fundId: string): Promise<void> {
    await api.delete(`/funds/${fundId}`);
  }

  // Fund performance
  async getFundPerformance(fundId: string): Promise<FundPerformance> {
    const response = await api.get(`/funds/${fundId}/performance`);
    return response.data;
  }

  async getFundPerformanceHistory(fundId: string, startDate?: string, endDate?: string): Promise<FundPerformance[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/funds/${fundId}/performance/history?${params}`);
    return response.data;
  }

  // Capital calls
  async getCapitalCalls(fundId: string): Promise<CapitalCall[]> {
    const response = await api.get(`/funds/${fundId}/capital-calls`);
    return response.data;
  }

  async createCapitalCall(fundId: string, capitalCall: Omit<CapitalCall, 'call_id' | 'fund_id'>): Promise<CapitalCall> {
    const response = await api.post(`/funds/${fundId}/capital-calls`, capitalCall);
    return response.data;
  }

  async updateCapitalCall(callId: string, updates: Partial<CapitalCall>): Promise<CapitalCall> {
    const response = await api.put(`/capital-calls/${callId}`, updates);
    return response.data;
  }

  async processCapitalCall(callId: string): Promise<CapitalCall> {
    const response = await api.post(`/capital-calls/${callId}/process`);
    return response.data;
  }

  // Distributions
  async getDistributions(fundId: string): Promise<Distribution[]> {
    const response = await api.get(`/funds/${fundId}/distributions`);
    return response.data;
  }

  async createDistribution(fundId: string, distribution: Omit<Distribution, 'distribution_id' | 'fund_id'>): Promise<Distribution> {
    const response = await api.post(`/funds/${fundId}/distributions`, distribution);
    return response.data;
  }

  async updateDistribution(distributionId: string, updates: Partial<Distribution>): Promise<Distribution> {
    const response = await api.put(`/distributions/${distributionId}`, updates);
    return response.data;
  }

  async processDistribution(distributionId: string): Promise<Distribution> {
    const response = await api.post(`/distributions/${distributionId}/process`);
    return response.data;
  }

  // Fund analytics
  async getFundAnalytics(fundId: string): Promise<any> {
    const response = await api.get(`/funds/${fundId}/analytics`);
    return response.data;
  }

  async getFundCashFlow(fundId: string): Promise<any> {
    const response = await api.get(`/funds/${fundId}/cash-flow`);
    return response.data;
  }

  async getFundWaterfall(fundId: string, scenarioId?: string): Promise<any> {
    const params = scenarioId ? `?scenario_id=${scenarioId}` : '';
    const response = await api.get(`/funds/${fundId}/waterfall${params}`);
    return response.data;
  }

  // Fund documents
  async getFundDocuments(fundId: string): Promise<any[]> {
    const response = await api.get(`/funds/${fundId}/documents`);
    return response.data;
  }

  async uploadFundDocument(fundId: string, file: File, documentType: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    
    const response = await api.post(`/funds/${fundId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export default new FundService();