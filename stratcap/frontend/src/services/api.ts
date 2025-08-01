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

// Credit Facility API
export const creditFacilityAPI = {
  // Credit Facility Management
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<APIResponse<any[]>>('/credit-facilities', { params }),

  getById: (id: number) => api.get<APIResponse<any>>(`/credit-facilities/${id}`),

  create: (data: any) => api.post<APIResponse<any>>('/credit-facilities', data),

  update: (id: number, data: any) => api.patch<APIResponse<any>>(`/credit-facilities/${id}`, data),

  delete: (id: number) => api.delete<APIResponse>(`/credit-facilities/${id}`),

  // Drawdown Operations
  createDrawdown: (facilityId: number, data: {
    amount: number;
    requestedDate: string;
    purpose: string;
    maturityDate?: string;
    interestRate?: number;
  }) => api.post<APIResponse<any>>(`/credit-facilities/${facilityId}/drawdowns`, data),

  getDrawdowns: (facilityId: number, params?: { page?: number; limit?: number }) =>
    api.get<APIResponse<any[]>>(`/credit-facilities/${facilityId}/drawdowns`, { params }),

  approveDrawdown: (drawdownId: number) => 
    api.post<APIResponse>(`/credit-facilities/drawdowns/${drawdownId}/approve`),

  executeDrawdown: (drawdownId: number) => 
    api.post<APIResponse>(`/credit-facilities/drawdowns/${drawdownId}/execute`),

  // Paydown Operations
  createPaydown: (facilityId: number, data: {
    amount: number;
    paydownDate: string;
    paydownType: 'principal' | 'interest' | 'both';
    accountingDate?: string;
  }) => api.post<APIResponse<any>>(`/credit-facilities/${facilityId}/paydowns`, data),

  getPaydowns: (facilityId: number, params?: { page?: number; limit?: number }) =>
    api.get<APIResponse<any[]>>(`/credit-facilities/${facilityId}/paydowns`, { params }),

  // Outstanding Balance and Reporting
  getOutstandingBalance: (facilityId: number, asOfDate?: string) =>
    api.get<APIResponse<any>>(`/credit-facilities/${facilityId}/balance`, { 
      params: { asOfDate } 
    }),

  getUtilizationReport: (facilityId: number, params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get<APIResponse<any>>(`/credit-facilities/${facilityId}/utilization`, { params }),

  // Interest Calculations
  calculateInterest: (facilityId: number, data: {
    startDate: string;
    endDate: string;
    principalAmount?: number;
  }) => api.post<APIResponse<any>>(`/credit-facilities/${facilityId}/interest/calculate`, data),

  // Covenant Monitoring
  getCovenants: (facilityId: number) =>
    api.get<APIResponse<any[]>>(`/credit-facilities/${facilityId}/covenants`),

  checkCovenantCompliance: (facilityId: number, asOfDate: string) =>
    api.post<APIResponse<any>>(`/credit-facilities/${facilityId}/covenants/check`, { asOfDate }),
};

// Document Management API
export const documentAPI = {
  // Document CRUD
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    entityType?: string;
    entityId?: number;
  }) => api.get<APIResponse<any[]>>('/documents', { params }),

  getById: (id: number) => api.get<APIResponse<any>>(`/documents/${id}`),

  upload: (data: FormData) =>
    api.post<APIResponse<any>>('/documents/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  update: (id: number, data: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
  }) => api.patch<APIResponse<any>>(`/documents/${id}`, data),

  delete: (id: number) => api.delete<APIResponse>(`/documents/${id}`),

  download: (id: number) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),

  // Document Organization
  createFolder: (data: { name: string; parentId?: number; description?: string }) =>
    api.post<APIResponse<any>>('/documents/folders', data),

  getFolders: (parentId?: number) =>
    api.get<APIResponse<any[]>>('/documents/folders', { params: { parentId } }),

  moveDocument: (documentId: number, folderId: number) =>
    api.patch<APIResponse>(`/documents/${documentId}/move`, { folderId }),

  // Document Sharing and Permissions
  shareDocument: (documentId: number, data: {
    recipientEmails: string[];
    permissions: string[];
    expirationDate?: string;
  }) => api.post<APIResponse<any>>(`/documents/${documentId}/share`, data),

  getSharedDocuments: () => api.get<APIResponse<any[]>>('/documents/shared'),

  // Document Versioning
  getVersions: (documentId: number) =>
    api.get<APIResponse<any[]>>(`/documents/${documentId}/versions`),

  createVersion: (documentId: number, file: FormData) =>
    api.post<APIResponse<any>>(`/documents/${documentId}/versions`, file, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Search and Metadata
  search: (query: string, filters?: {
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    entityType?: string;
  }) => api.get<APIResponse<any[]>>('/documents/search', { 
    params: { query, ...filters } 
  }),

  extractMetadata: (documentId: number) =>
    api.post<APIResponse<any>>(`/documents/${documentId}/extract-metadata`),
};

// Global Entity API
export const globalEntityAPI = {
  // Entity Management
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    entityType?: string;
    jurisdiction?: string;
    status?: string;
  }) => api.get<APIResponse<any[]>>('/global-entities', { params }),

  getById: (id: number) => api.get<APIResponse<any>>(`/global-entities/${id}`),

  create: (data: {
    name: string;
    entityType: string;
    jurisdiction: string;
    taxId?: string;
    registrationNumber?: string;
    address: any;
    incorporationDate?: string;
    status?: string;
  }) => api.post<APIResponse<any>>('/global-entities', data),

  update: (id: number, data: any) => 
    api.patch<APIResponse<any>>(`/global-entities/${id}`, data),

  delete: (id: number) => api.delete<APIResponse>(`/global-entities/${id}`),

  // Entity Relationships
  getRelationships: (entityId: number) =>
    api.get<APIResponse<any[]>>(`/global-entities/${entityId}/relationships`),

  createRelationship: (entityId: number, data: {
    relatedEntityId: number;
    relationshipType: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }) => api.post<APIResponse<any>>(`/global-entities/${entityId}/relationships`, data),

  updateRelationship: (entityId: number, relationshipId: number, data: any) =>
    api.patch<APIResponse<any>>(`/global-entities/${entityId}/relationships/${relationshipId}`, data),

  deleteRelationship: (entityId: number, relationshipId: number) =>
    api.delete<APIResponse>(`/global-entities/${entityId}/relationships/${relationshipId}`),

  // Ownership Structure
  getOwnershipStructure: (entityId: number, asOfDate?: string) =>
    api.get<APIResponse<any>>(`/global-entities/${entityId}/ownership`, {
      params: { asOfDate }
    }),

  updateOwnership: (entityId: number, data: {
    owners: Array<{
      ownerId: number;
      ownershipPercentage: number;
      ownershipType: string;
      effectiveDate: string;
    }>;
  }) => api.post<APIResponse<any>>(`/global-entities/${entityId}/ownership`, data),

  // Compliance and Reporting
  getComplianceStatus: (entityId: number) =>
    api.get<APIResponse<any>>(`/global-entities/${entityId}/compliance`),

  generateReport: (entityId: number, reportType: string, params?: any) =>
    api.post<APIResponse<any>>(`/global-entities/${entityId}/reports/${reportType}`, params),

  // Entity Directory Features
  searchDirectory: (query: string, filters?: {
    entityType?: string;
    jurisdiction?: string;
    status?: string;
  }) => api.get<APIResponse<any[]>>('/global-entities/directory/search', {
    params: { query, ...filters }
  }),

  getEntityHierarchy: (rootEntityId: number) =>
    api.get<APIResponse<any>>(`/global-entities/${rootEntityId}/hierarchy`),
};

// Data Analysis API  
export const dataAnalysisAPI = {
  // Pivot Table Operations
  createPivotTable: (data: {
    name: string;
    dataSource: string;
    configuration: {
      rows: string[];
      columns: string[];
      values: string[];
      filters?: any[];
      aggregations?: any[];
    };
    schedule?: {
      frequency: string;
      time?: string;
      recipients?: string[];
    };
  }) => api.post<APIResponse<any>>('/data-analysis/pivot-tables', data),

  getPivotTables: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<APIResponse<any[]>>('/data-analysis/pivot-tables', { params }),

  getPivotTableById: (id: number) => 
    api.get<APIResponse<any>>(`/data-analysis/pivot-tables/${id}`),

  updatePivotTable: (id: number, data: any) =>
    api.patch<APIResponse<any>>(`/data-analysis/pivot-tables/${id}`, data),

  deletePivotTable: (id: number) => 
    api.delete<APIResponse>(`/data-analysis/pivot-tables/${id}`),

  executePivotTable: (id: number, params?: {
    filters?: any[];
    dateRange?: { start: string; end: string };
  }) => api.post<APIResponse<any>>(`/data-analysis/pivot-tables/${id}/execute`, params),

  // Data Sources
  getDataSources: () => api.get<APIResponse<any[]>>('/data-analysis/data-sources'),

  getDataSourceSchema: (sourceId: string) =>
    api.get<APIResponse<any>>(`/data-analysis/data-sources/${sourceId}/schema`),

  previewData: (sourceId: string, params?: {
    limit?: number;
    filters?: any[];
  }) => api.get<APIResponse<any>>(`/data-analysis/data-sources/${sourceId}/preview`, { params }),

  // Custom Queries
  executeCustomQuery: (data: {
    query: string;
    dataSource: string;
    parameters?: any[];
  }) => api.post<APIResponse<any>>('/data-analysis/custom-query', data),

  validateQuery: (data: { query: string; dataSource: string }) =>
    api.post<APIResponse<any>>('/data-analysis/custom-query/validate', data),

  // Export and Sharing
  exportPivotTable: (id: number, format: 'excel' | 'csv' | 'pdf') =>
    api.get(`/data-analysis/pivot-tables/${id}/export/${format}`, { responseType: 'blob' }),

  sharePivotTable: (id: number, data: {
    recipients: string[];
    includeData: boolean;
    expirationDate?: string;
  }) => api.post<APIResponse<any>>(`/data-analysis/pivot-tables/${id}/share`, data),

  // Analytics and Insights
  getInsights: (data: {
    dataSource: string;
    dimensions: string[];
    metrics: string[];
    dateRange?: { start: string; end: string };
  }) => api.post<APIResponse<any>>('/data-analysis/insights', data),

  getTrendAnalysis: (data: {
    dataSource: string;
    metric: string;
    dimension: string;
    period: string;
  }) => api.post<APIResponse<any>>('/data-analysis/trends', data),
};

// General Ledger API
export const generalLedgerAPI = {
  // Chart of Accounts
  getChartOfAccounts: (params?: { 
    accountType?: string; 
    status?: string;
    level?: number;
  }) => api.get<APIResponse<any[]>>('/general-ledger/accounts', { params }),

  getAccountById: (id: number) => 
    api.get<APIResponse<any>>(`/general-ledger/accounts/${id}`),

  createAccount: (data: {
    accountCode: string;
    accountName: string;
    accountType: string;
    parentAccountId?: number;
    description?: string;
    isActive: boolean;
  }) => api.post<APIResponse<any>>('/general-ledger/accounts', data),

  updateAccount: (id: number, data: any) =>
    api.patch<APIResponse<any>>(`/general-ledger/accounts/${id}`, data),

  deactivateAccount: (id: number) =>
    api.patch<APIResponse>(`/general-ledger/accounts/${id}/deactivate`),

  // Journal Entries
  getJournalEntries: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    accountId?: number;
    status?: string;
    reference?: string;
  }) => api.get<APIResponse<any[]>>('/general-ledger/journal-entries', { params }),

  getJournalEntryById: (id: number) =>
    api.get<APIResponse<any>>(`/general-ledger/journal-entries/${id}`),

  createJournalEntry: (data: {
    entryDate: string;
    reference: string;
    description: string;
    totalAmount: number;
    lines: Array<{
      accountId: number;
      debitAmount?: number;
      creditAmount?: number;
      description?: string;
      reference?: string;
    }>;
    attachments?: number[];
  }) => api.post<APIResponse<any>>('/general-ledger/journal-entries', data),

  updateJournalEntry: (id: number, data: any) =>
    api.patch<APIResponse<any>>(`/general-ledger/journal-entries/${id}`, data),

  deleteJournalEntry: (id: number) =>
    api.delete<APIResponse>(`/general-ledger/journal-entries/${id}`),

  postJournalEntry: (id: number) =>
    api.post<APIResponse>(`/general-ledger/journal-entries/${id}/post`),

  reverseJournalEntry: (id: number, data: { reason: string; reversalDate: string }) =>
    api.post<APIResponse<any>>(`/general-ledger/journal-entries/${id}/reverse`, data),

  // Trial Balance
  getTrialBalance: (params: {
    asOfDate: string;
    accountLevel?: number;
    includeZeroBalances?: boolean;
    accountTypes?: string[];
  }) => api.get<APIResponse<any>>('/general-ledger/trial-balance', { params }),

  getDetailedTrialBalance: (params: {
    asOfDate: string;
    accountId?: number;
    includeTransactions?: boolean;
  }) => api.get<APIResponse<any>>('/general-ledger/trial-balance/detailed', { params }),

  // General Ledger Reports
  getGeneralLedger: (params: {
    accountId?: number;
    dateFrom: string;
    dateTo: string;
    includeOpeningBalance?: boolean;
  }) => api.get<APIResponse<any>>('/general-ledger/general-ledger', { params }),

  getAccountBalance: (accountId: number, asOfDate: string) =>
    api.get<APIResponse<any>>(`/general-ledger/accounts/${accountId}/balance`, {
      params: { asOfDate }
    }),

  getAccountActivity: (accountId: number, params: {
    dateFrom: string;
    dateTo: string;
    page?: number;
    limit?: number;
  }) => api.get<APIResponse<any[]>>(`/general-ledger/accounts/${accountId}/activity`, { params }),

  // Financial Statements
  getBalanceSheet: (params: {
    asOfDate: string;
    consolidate?: boolean;
    entityIds?: number[];
  }) => api.get<APIResponse<any>>('/general-ledger/balance-sheet', { params }),

  getIncomeStatement: (params: {
    startDate: string;
    endDate: string;
    consolidate?: boolean;
    entityIds?: number[];
  }) => api.get<APIResponse<any>>('/general-ledger/income-statement', { params }),

  getCashFlowStatement: (params: {
    startDate: string;
    endDate: string;
    method?: 'direct' | 'indirect';
    consolidate?: boolean;
  }) => api.get<APIResponse<any>>('/general-ledger/cash-flow', { params }),

  // Period Management
  getAccountingPeriods: () => 
    api.get<APIResponse<any[]>>('/general-ledger/periods'),

  createAccountingPeriod: (data: {
    name: string;
    startDate: string;
    endDate: string;
    fiscalYear: number;
    status: string;
  }) => api.post<APIResponse<any>>('/general-ledger/periods', data),

  closePeriod: (periodId: number) =>
    api.post<APIResponse>(`/general-ledger/periods/${periodId}/close`),

  reopenPeriod: (periodId: number, data: { reason: string }) =>
    api.post<APIResponse>(`/general-ledger/periods/${periodId}/reopen`, data),
};

// Configuration API
export const configurationAPI = {
  // System Settings
  getSystemSettings: () => api.get<APIResponse<any>>('/configuration/system'),

  updateSystemSettings: (data: {
    organizationName?: string;
    timezone?: string;
    currency?: string;
    fiscalYearEnd?: string;
    dateFormat?: string;
    decimalPrecision?: number;
    features?: any;
  }) => api.patch<APIResponse<any>>('/configuration/system', data),

  // User Preferences
  getUserPreferences: () => api.get<APIResponse<any>>('/configuration/preferences'),

  updateUserPreferences: (data: {
    language?: string;
    timezone?: string;
    dateFormat?: string;
    numberFormat?: string;
    dashboardLayout?: any;
    notifications?: any;
  }) => api.patch<APIResponse<any>>('/configuration/preferences', data),

  // Application Configuration
  getFeatureFlags: () => api.get<APIResponse<any>>('/configuration/features'),

  updateFeatureFlag: (flagName: string, enabled: boolean) =>
    api.patch<APIResponse>(`/configuration/features/${flagName}`, { enabled }),

  // Email Templates
  getEmailTemplates: () => api.get<APIResponse<any[]>>('/configuration/email-templates'),

  getEmailTemplate: (templateId: string) =>
    api.get<APIResponse<any>>(`/configuration/email-templates/${templateId}`),

  updateEmailTemplate: (templateId: string, data: {
    subject?: string;
    body?: string;
    variables?: string[];
  }) => api.patch<APIResponse<any>>(`/configuration/email-templates/${templateId}`, data),

  // Notification Settings
  getNotificationSettings: () => 
    api.get<APIResponse<any>>('/configuration/notifications'),

  updateNotificationSettings: (data: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    inAppNotifications?: boolean;
    channels?: any;
  }) => api.patch<APIResponse<any>>('/configuration/notifications', data),

  // Integration Settings
  getIntegrations: () => api.get<APIResponse<any[]>>('/configuration/integrations'),

  getIntegration: (integrationId: string) =>
    api.get<APIResponse<any>>(`/configuration/integrations/${integrationId}`),

  updateIntegration: (integrationId: string, data: any) =>
    api.patch<APIResponse<any>>(`/configuration/integrations/${integrationId}`, data),

  testIntegration: (integrationId: string) =>
    api.post<APIResponse<any>>(`/configuration/integrations/${integrationId}/test`),

  // Audit Configuration
  getAuditSettings: () => api.get<APIResponse<any>>('/configuration/audit'),

  updateAuditSettings: (data: {
    retentionPeriod?: number;
    logLevel?: string;
    enableUserTracking?: boolean;
    enableDataChanges?: boolean;
  }) => api.patch<APIResponse<any>>('/configuration/audit', data),

  // Backup and Maintenance
  getBackupSettings: () => api.get<APIResponse<any>>('/configuration/backup'),

  updateBackupSettings: (data: {
    schedule?: string;
    retention?: number;
    enabled?: boolean;
    destination?: string;
  }) => api.patch<APIResponse<any>>('/configuration/backup', data),

  createBackup: () => api.post<APIResponse<any>>('/configuration/backup/create'),

  getBackupHistory: () => api.get<APIResponse<any[]>>('/configuration/backup/history'),

  // Performance and Monitoring
  getPerformanceSettings: () => 
    api.get<APIResponse<any>>('/configuration/performance'),

  updatePerformanceSettings: (data: {
    cacheTimeout?: number;
    maxQueryTime?: number;
    enableMetrics?: boolean;
    alertingEnabled?: boolean;
  }) => api.patch<APIResponse<any>>('/configuration/performance', data),

  getSystemHealth: () => api.get<APIResponse<any>>('/configuration/health'),

  getSystemMetrics: (timeRange?: string) =>
    api.get<APIResponse<any>>('/configuration/metrics', { params: { timeRange } }),
};

export default api;