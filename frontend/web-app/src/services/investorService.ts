import api from './api';
import { 
  Investor, 
  InvestorCommitment, 
  InvestorStatement, 
  InvestorDocument,
  CreateInvestorRequest, 
  UpdateInvestorRequest,
  CreateCommitmentRequest 
} from '../types/investor';

class InvestorService {
  // Investor CRUD operations
  async getInvestors(): Promise<Investor[]> {
    const response = await api.get('/investors');
    return response.data;
  }

  async getInvestor(investorId: string): Promise<Investor> {
    const response = await api.get(`/investors/${investorId}`);
    return response.data;
  }

  async createInvestor(investor: CreateInvestorRequest): Promise<Investor> {
    const response = await api.post('/investors', investor);
    return response.data;
  }

  async updateInvestor(investor: UpdateInvestorRequest): Promise<Investor> {
    const response = await api.put(`/investors/${investor.investor_id}`, investor);
    return response.data;
  }

  async deleteInvestor(investorId: string): Promise<void> {
    await api.delete(`/investors/${investorId}`);
  }

  // Investor commitments
  async getInvestorCommitments(investorId: string): Promise<InvestorCommitment[]> {
    const response = await api.get(`/investors/${investorId}/commitments`);
    return response.data;
  }

  async createCommitment(commitment: CreateCommitmentRequest): Promise<InvestorCommitment> {
    const response = await api.post('/commitments', commitment);
    return response.data;
  }

  async updateCommitment(commitmentId: string, updates: Partial<InvestorCommitment>): Promise<InvestorCommitment> {
    const response = await api.put(`/commitments/${commitmentId}`, updates);
    return response.data;
  }

  async deleteCommitment(commitmentId: string): Promise<void> {
    await api.delete(`/commitments/${commitmentId}`);
  }

  // Investor statements
  async getInvestorStatements(investorId: string, fundId?: string): Promise<InvestorStatement[]> {
    const params = fundId ? `?fund_id=${fundId}` : '';
    const response = await api.get(`/investors/${investorId}/statements${params}`);
    return response.data;
  }

  async generateInvestorStatement(investorId: string, fundId: string, periodStart: string, periodEnd: string): Promise<InvestorStatement> {
    const response = await api.post(`/investors/${investorId}/statements`, {
      fund_id: fundId,
      period_start: periodStart,
      period_end: periodEnd,
    });
    return response.data;
  }

  async getInvestorStatement(statementId: string): Promise<InvestorStatement> {
    const response = await api.get(`/statements/${statementId}`);
    return response.data;
  }

  // Investor documents
  async getInvestorDocuments(investorId: string): Promise<InvestorDocument[]> {
    const response = await api.get(`/investors/${investorId}/documents`);
    return response.data;
  }

  async uploadInvestorDocument(investorId: string, file: File, documentType: string): Promise<InvestorDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    
    const response = await api.post(`/investors/${investorId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateDocumentStatus(documentId: string, status: 'approved' | 'rejected'): Promise<InvestorDocument> {
    const response = await api.put(`/documents/${documentId}/status`, { status });
    return response.data;
  }

  async deleteInvestorDocument(documentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}`);
  }

  // Investor analytics
  async getInvestorPortfolio(investorId: string): Promise<any> {
    const response = await api.get(`/investors/${investorId}/portfolio`);
    return response.data;
  }

  async getInvestorPerformance(investorId: string): Promise<any> {
    const response = await api.get(`/investors/${investorId}/performance`);
    return response.data;
  }

  async getInvestorCashFlow(investorId: string): Promise<any> {
    const response = await api.get(`/investors/${investorId}/cash-flow`);
    return response.data;
  }

  // KYC/AML operations
  async updateKYCStatus(investorId: string, status: 'approved' | 'rejected', notes?: string): Promise<Investor> {
    const response = await api.put(`/investors/${investorId}/kyc-status`, { status, notes });
    return response.data;
  }

  async updateAMLStatus(investorId: string, status: 'approved' | 'rejected', notes?: string): Promise<Investor> {
    const response = await api.put(`/investors/${investorId}/aml-status`, { status, notes });
    return response.data;
  }

  // Investor search and filtering
  async searchInvestors(query: string, filters?: any): Promise<Investor[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/investors/search?${params}`);
    return response.data;
  }
}

export default new InvestorService();