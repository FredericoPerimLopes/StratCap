import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { store } from '../store/store';
import { clearCredentials, refreshTokens } from '../store/slices/authSlice';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

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

export default api;