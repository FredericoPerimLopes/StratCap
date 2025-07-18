import api from './api';
import {
  FundStructure,
  FundStructureTree,
  AllocationRequest,
  AllocationResult,
  CreateFundStructureRequest,
  FundRelationship
} from '../types/fundStructure';

export const fundStructureService = {
  // Fund Structure Management
  async createFundStructure(data: CreateFundStructureRequest): Promise<FundStructure> {
    const response = await api.post('/api/fund-structures/', data);
    return response.data;
  },

  async getFundStructures(params?: {
    structure_type?: string;
    parent_fund_id?: string;
    include_children?: boolean;
  }): Promise<FundStructure[]> {
    const response = await api.get('/api/fund-structures/', { params });
    return response.data;
  },

  async getFundStructure(fundId: string): Promise<FundStructure> {
    const response = await api.get(`/api/fund-structures/${fundId}`);
    return response.data;
  },

  async updateFundStructure(fundId: string, data: Partial<CreateFundStructureRequest>): Promise<FundStructure> {
    const response = await api.put(`/api/fund-structures/${fundId}`, data);
    return response.data;
  },

  async getFundHierarchy(fundId: string): Promise<FundStructureTree> {
    const response = await api.get(`/api/fund-structures/${fundId}/hierarchy`);
    return response.data;
  },

  async getFundCapacity(fundId: string): Promise<{
    fund_id: string;
    fund_name: string;
    target_size: number;
    committed_capital: number;
    available_capacity: number;
    subscription_percentage: number;
    max_investors?: number;
    current_investors: number;
    available_investor_slots?: number;
    can_accept_new_investors: boolean;
    estimated_final_close?: string;
  }> {
    const response = await api.get(`/api/fund-structures/${fundId}/capacity`);
    return response.data;
  },

  // Fund Relationships
  async createFundRelationship(
    parentFundId: string,
    childFundId: string,
    relationshipType: string,
    allocationPercentage?: number
  ): Promise<FundRelationship> {
    const response = await api.post(`/api/fund-structures/${parentFundId}/relationships`, null, {
      params: {
        child_fund_id: childFundId,
        relationship_type: relationshipType,
        allocation_percentage: allocationPercentage
      }
    });
    return response.data;
  },

  // Investor Allocation
  async allocateInvestor(request: AllocationRequest): Promise<AllocationResult> {
    const response = await api.post('/api/fund-structures/allocate', request);
    return response.data;
  },

  // Batch operations
  async batchCreateStructures(structures: CreateFundStructureRequest[]): Promise<FundStructure[]> {
    const response = await api.post('/api/fund-structures/batch', { structures });
    return response.data;
  },

  async validateStructureHierarchy(fundId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const response = await api.post(`/api/fund-structures/${fundId}/validate`);
    return response.data;
  }
};