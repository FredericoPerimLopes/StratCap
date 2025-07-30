import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { store } from '../store/store';
import { clearCredentials, refreshTokens } from '../store/slices/authSlice';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await store.dispatch(refreshTokens());
        const token = localStorage.getItem('token');
        if (token && originalRequest) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        store.dispatch(clearCredentials());
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API response interface
interface APIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string; mfaToken?: string }) =>
    api.post<APIResponse<{ user: any; token: string; refreshToken: string }>>('/auth/login', credentials),

  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => api.post<APIResponse<any>>('/auth/register', userData),

  logout: () => api.post<APIResponse>('/auth/logout'),

  getProfile: () => api.get<APIResponse<any>>('/auth/profile'),

  updateProfile: (userData: { firstName?: string; lastName?: string }) =>
    api.patch<APIResponse<any>>('/auth/profile', userData),

  changePassword: (passwordData: { currentPassword: string; newPassword: string }) =>
    api.post<APIResponse>('/auth/password/change', passwordData),

  refreshToken: (refreshToken: string) =>
    api.post<APIResponse<{ user: any; token: string; refreshToken: string }>>('/auth/refresh-token', {
      refreshToken,
    }),

  requestPasswordReset: (email: string) =>
    api.post<APIResponse>('/auth/password/forgot', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<APIResponse>('/auth/password/reset', { token, password }),

  setupMFA: () => api.post<APIResponse<{ secret: string; qrCode: string }>>('/auth/mfa/setup'),

  verifyMFA: (token: string) => api.post<APIResponse>('/auth/mfa/verify', { token }),

  disableMFA: () => api.post<APIResponse>('/auth/mfa/disable'),
};

// Fund Family API
export const fundFamilyAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<APIResponse<any[]>>('/fund-families', { params }),

  getById: (id: number) => api.get<APIResponse<any>>(`/fund-families/${id}`),

  getSummary: (id: number) => api.get<APIResponse<any>>(`/fund-families/${id}/summary`),

  create: (data: any) => api.post<APIResponse<any>>('/fund-families', data),

  update: (id: number, data: any) => api.patch<APIResponse<any>>(`/fund-families/${id}`, data),

  delete: (id: number) => api.delete<APIResponse>(`/fund-families/${id}`),

  addUser: (id: number, userId: number) =>
    api.post<APIResponse>(`/fund-families/${id}/users`, { userId }),

  removeUser: (id: number, userId: number) =>
    api.delete<APIResponse>(`/fund-families/${id}/users/${userId}`),
};

// Fund API
export const fundAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; fundFamilyId?: number }) =>
    api.get<APIResponse<any[]>>('/funds', { params }),

  getById: (id: number) => api.get<APIResponse<any>>(`/funds/${id}`),

  create: (data: any) => api.post<APIResponse<any>>('/funds', data),

  update: (id: number, data: any) => api.patch<APIResponse<any>>(`/funds/${id}`, data),

  delete: (id: number) => api.delete<APIResponse>(`/funds/${id}`),
};

// Investor API
export const investorAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; type?: string }) =>
    api.get<APIResponse<any[]>>('/investors', { params }),

  getById: (id: number) => api.get<APIResponse<any>>(`/investors/${id}`),

  getByFund: (fundId: number) => api.get<APIResponse<any[]>>(`/investors/fund/${fundId}`),

  create: (data: any) => api.post<APIResponse<any>>('/investors', data),

  update: (id: number, data: any) => api.patch<APIResponse<any>>(`/investors/${id}`, data),

  delete: (id: number) => api.delete<APIResponse>(`/investors/${id}`),
};

// Commitment API
export const commitmentAPI = {
  getAll: (params?: { page?: number; limit?: number; fundId?: number; investorId?: number }) =>
    api.get<APIResponse<any[]>>('/commitments', { params }),

  getById: (id: number) => api.get<APIResponse<any>>(`/commitments/${id}`),

  create: (data: any) => api.post<APIResponse<any>>('/commitments', data),

  update: (id: number, data: any) => api.patch<APIResponse<any>>(`/commitments/${id}`, data),

  delete: (id: number) => api.delete<APIResponse>(`/commitments/${id}`),
};

// Capital Activity API
export const capitalActivityAPI = {
  getAll: (params?: { page?: number; limit?: number; fundId?: number; eventType?: string }) =>
    api.get<APIResponse<any[]>>('/capital-activities', { params }),

  getById: (id: number) => api.get<APIResponse<any>>(`/capital-activities/${id}`),

  create: (data: any) => api.post<APIResponse<any>>('/capital-activities', data),

  update: (id: number, data: any) => api.patch<APIResponse<any>>(`/capital-activities/${id}`, data),

  delete: (id: number) => api.delete<APIResponse>(`/capital-activities/${id}`),

  approve: (id: number) => api.post<APIResponse>(`/capital-activities/${id}/approve`),

  complete: (id: number) => api.post<APIResponse>(`/capital-activities/${id}/complete`),
  
  // Capital Call specific endpoints
  createCapitalCall: (data: any) => 
    api.post<APIResponse<any>>('/capital-activities/capital-calls', data),
  getCapitalCallTemplate: (fundId: number) => 
    api.get<APIResponse<any>>(`/capital-activities/capital-calls/template/${fundId}`),
  calculateAllocations: (fundId: number, amount: number) => 
    api.post<APIResponse<any>>(`/capital-activities/capital-calls/allocations`, { fundId, amount }),
  sendNotifications: (id: number, options: any) => 
    api.post<APIResponse<any>>(`/capital-activities/${id}/notifications`, options),
  
  // Distribution specific endpoints
  createDistribution: (data: any) => 
    api.post<APIResponse<any>>('/capital-activities/distributions', data),
  getDistributionTemplate: (fundId: number) => 
    api.get<APIResponse<any>>(`/capital-activities/distributions/template/${fundId}`)
};

// Transaction API
export const transactionAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    fundId?: number;
    commitmentId?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get<APIResponse<any[]>>('/transactions', { params }),

  getById: (id: number) => api.get<APIResponse<any>>(`/transactions/${id}`),

  create: (data: any) => api.post<APIResponse<any>>('/transactions', data),

  update: (id: number, data: any) => api.patch<APIResponse<any>>(`/transactions/${id}`, data),

  delete: (id: number) => api.delete<APIResponse>(`/transactions/${id}`),
};

// Fee Management API
export const feeAPI = {
  // Fee Calculations
  getFeeCalculations: (fundId: number, params?: { 
    startDate?: string; 
    endDate?: string; 
    feeType?: string;
  }) => api.get<APIResponse<any[]>>(`/fees/funds/${fundId}/calculations`, { params }),

  getFeeSummary: (fundId: number, params?: { year?: number }) => 
    api.get<APIResponse<any>>(`/fees/funds/${fundId}/summary`, { params }),

  calculateManagementFee: (fundId: number, data: {
    periodStartDate: string;
    periodEndDate: string;
    basisType?: string;
    customBasisAmount?: number;
    isAccrual?: boolean;
    useTimeWeighted?: boolean;
  }) => api.post<APIResponse<any>>(`/fees/funds/${fundId}/management-fees/calculate`, data),

  calculateCarriedInterest: (fundId: number, data: {
    asOfDate: string;
    distributionAmount?: number;
    useAccrualMethod?: boolean;
    onDistribution?: boolean;
  }) => api.post<APIResponse<any>>(`/fees/funds/${fundId}/carried-interest/calculate`, data),

  // Fee Postings
  postFeeCalculation: (calculationId: number) => 
    api.post<APIResponse>(`/fees/calculations/${calculationId}/post`),

  reverseFeeCalculation: (calculationId: number, data: { reason: string }) => 
    api.post<APIResponse>(`/fees/calculations/${calculationId}/reverse`, data),

  // Fee Offsets
  createFeeOffset: (calculationId: number, data: {
    offsetType: string;
    offsetAmount: number;
    description: string;
    sourceReference?: string;
    offsetDate?: string;
  }) => api.post<APIResponse<any>>(`/fees/calculations/${calculationId}/offsets`, data),

  getPendingOffsets: (params?: { fundId?: number }) => 
    api.get<APIResponse<any[]>>('/fees/offsets/pending', { params }),

  approveFeeOffset: (offsetId: number, data?: { userId?: number }) => 
    api.post<APIResponse>(`/fees/offsets/${offsetId}/approve`, data),

  getOffsetSummary: (fundId: number, params?: { year?: number }) => 
    api.get<APIResponse<any>>(`/fees/funds/${fundId}/offsets/summary`, { params }),

  // Fee Basis
  createFeeBasisSnapshot: (fundId: number, data: {
    asOfDate: string;
    basisData: object;
    currency?: string;
  }) => api.post<APIResponse<any>>(`/fees/funds/${fundId}/basis/snapshot`, data),

  getFeeBasisHistory: (fundId: number, params?: {
    basisType?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<APIResponse<any[]>>(`/fees/funds/${fundId}/basis/history`, { params }),

  // Health check
  healthCheck: () => api.get<APIResponse>('/fees/health'),
};

// Waterfall API
export const waterfallAPI = {
  // Main waterfall calculations
  calculateWaterfall: (data: {
    fundId: number;
    totalProceedsAmount: number;
    asOfDate: string;
    distributionScenario?: string;
    customParameters?: object;
  }) => api.post<APIResponse<any>>('/waterfall/calculate', data),

  // Get waterfall calculations
  getWaterfallCalculation: (id: number) => 
    api.get<APIResponse<any>>(`/waterfall/${id}`),

  getFundWaterfallCalculations: (fundId: number) => 
    api.get<APIResponse<any[]>>(`/waterfall/fund/${fundId}`),

  // Hypothetical scenarios
  createHypotheticalScenarios: (data: {
    fundId: number;
    scenarios: Array<{
      name: string;
      totalProceedsAmount: number;
      parameters?: object;
    }>;
  }) => api.post<APIResponse<any[]>>('/waterfall/hypothetical', data),

  // Calculation management
  getAuditTrail: (calculationId: number) => 
    api.get<APIResponse<any[]>>(`/waterfall/${calculationId}/audit`),

  validateCalculation: (calculationId: number) => 
    api.get<APIResponse<any>>(`/waterfall/${calculationId}/validate`),

  approveCalculation: (calculationId: number) => 
    api.post<APIResponse>(`/waterfall/${calculationId}/approve`),

  // Distribution events
  getDistributionEvents: (calculationId: number) => 
    api.get<APIResponse<any[]>>(`/waterfall/${calculationId}/distributions`),

  updateDistributionEventStatus: (eventId: number, data: { status: string }) => 
    api.put<APIResponse>(`/waterfall/distribution/${eventId}/status`, data),

  // Allocation summary
  getAllocationSummary: (calculationId: number) => 
    api.get<APIResponse<any>>(`/waterfall/${calculationId}/allocation-summary`),

  // Specific calculations
  calculatePreferredReturn: (data: {
    fundId: number;
    asOfDate: string;
    preferredReturnRate?: number;
  }) => api.post<APIResponse<any>>('/waterfall/preferred-return/calculate', data),

  calculateCarriedInterest: (data: {
    fundId: number;
    totalProceeds: number;
    asOfDate: string;
  }) => api.post<APIResponse<any>>('/waterfall/carried-interest/calculate', data),
};

// Investor Transfer API
export const investorTransferAPI = {
  // Get all transfers with filtering
  getAll: (params?: {
    page?: number;
    limit?: number;
    fundId?: number;
    status?: string;
    transferType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get<APIResponse<any[]>>('/investor-transfers', { params }),

  // Get transfer by ID
  getById: (id: number) => api.get<APIResponse<any>>(`/investor-transfers/${id}`),

  // Create new transfer
  create: (data: {
    fromInvestorId: number;
    toInvestorId: number;
    fundId: number;
    transferType: string;
    interestAmount: number;
    effectiveDate: string;
    reason: string;
    documents?: any[];
    restrictions?: any;
    approvalRequired?: boolean;
    legalDocuments?: any[];
  }) => api.post<APIResponse<any>>('/investor-transfers', data),

  // Update transfer
  update: (id: number, data: any) => 
    api.patch<APIResponse<any>>(`/investor-transfers/${id}`, data),

  // Delete transfer
  delete: (id: number) => api.delete<APIResponse>(`/investor-transfers/${id}`),

  // Approval workflow
  submit: (id: number) => api.post<APIResponse>(`/investor-transfers/${id}/submit`),
  approve: (id: number, data?: { comments?: string }) => 
    api.post<APIResponse>(`/investor-transfers/${id}/approve`, data),
  reject: (id: number, data: { reason: string }) => 
    api.post<APIResponse>(`/investor-transfers/${id}/reject`, data),
  execute: (id: number) => api.post<APIResponse>(`/investor-transfers/${id}/execute`),

  // Validation and checks
  validateTransfer: (data: {
    fromInvestorId: number;
    toInvestorId: number;
    fundId: number;
    interestAmount: number;
  }) => api.post<APIResponse<any>>('/investor-transfers/validate', data),

  // Document management
  uploadDocument: (transferId: number, file: FormData) =>
    api.post<APIResponse<any>>(`/investor-transfers/${transferId}/documents`, file, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  deleteDocument: (transferId: number, documentId: number) =>
    api.delete<APIResponse>(`/investor-transfers/${transferId}/documents/${documentId}`),

  // Legal compliance
  getComplianceChecks: (transferId: number) =>
    api.get<APIResponse<any>>(`/investor-transfers/${transferId}/compliance`),

  runComplianceCheck: (transferId: number, checkType: string) =>
    api.post<APIResponse<any>>(`/investor-transfers/${transferId}/compliance/${checkType}`),

  // Transfer templates
  getTransferTemplate: (fundId: number, transferType: string) =>
    api.get<APIResponse<any>>(`/investor-transfers/template/${fundId}/${transferType}`),

  // Reporting
  getTransferSummary: (params?: {
    fundId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get<APIResponse<any>>('/investor-transfers/summary', { params }),

  // Notifications
  sendNotification: (transferId: number, data: {
    recipients: string[];
    template: string;
    customMessage?: string;
  }) => api.post<APIResponse>(`/investor-transfers/${transferId}/notify`, data),
};

export default api;