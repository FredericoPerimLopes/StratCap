import { baseApi } from './baseApi';
import type { APIResponse, CapitalActivity, CapitalActivityFormData } from '../types/api';

export const capitalActivityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all capital activities with pagination and filtering
    getCapitalActivities: builder.query<APIResponse<CapitalActivity[]>, {
      page?: number;
      limit?: number;
      fundId?: number;
      eventType?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }>({
      query: ({ page = 0, limit = 25, ...params }) => ({
        url: '/capital-activities',
        params: { page, limit, ...params },
      }),
      providesTags: ['CapitalActivity'],
    }),

    // Get single capital activity by ID
    getCapitalActivity: builder.query<APIResponse<CapitalActivity>, number>({
      query: (id) => `/capital-activities/${id}`,
      providesTags: (result, error, id) => [{ type: 'CapitalActivity', id }],
    }),

    // Create new capital activity
    createCapitalActivity: builder.mutation<APIResponse<CapitalActivity>, CapitalActivityFormData>({
      query: (data) => ({
        url: '/capital-activities',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CapitalActivity'],
    }),

    // Update existing capital activity
    updateCapitalActivity: builder.mutation<APIResponse<CapitalActivity>, { 
      id: number; 
      data: Partial<CapitalActivityFormData> 
    }>({
      query: ({ id, data }) => ({
        url: `/capital-activities/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'CapitalActivity', id }],
    }),

    // Delete capital activity
    deleteCapitalActivity: builder.mutation<APIResponse<void>, number>({
      query: (id) => ({
        url: `/capital-activities/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CapitalActivity'],
    }),

    // Submit capital activity for approval
    submitCapitalActivity: builder.mutation<APIResponse<CapitalActivity>, number>({
      query: (id) => ({
        url: `/capital-activities/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'CapitalActivity', id }],
    }),

    // Approve capital activity
    approveCapitalActivity: builder.mutation<APIResponse<CapitalActivity>, {
      id: number;
      notes?: string;
    }>({
      query: ({ id, ...data }) => ({
        url: `/capital-activities/${id}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'CapitalActivity', id }],
    }),

    // Reject capital activity
    rejectCapitalActivity: builder.mutation<APIResponse<CapitalActivity>, {
      id: number;
      reason: string;
    }>({
      query: ({ id, ...data }) => ({
        url: `/capital-activities/${id}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'CapitalActivity', id }],
    }),

    // Execute capital activity
    executeCapitalActivity: builder.mutation<APIResponse<CapitalActivity>, number>({
      query: (id) => ({
        url: `/capital-activities/${id}/execute`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'CapitalActivity', id }],
    }),

    // Get capital activity distributions
    getCapitalActivityDistributions: builder.query<APIResponse<any[]>, number>({
      query: (id) => `/capital-activities/${id}/distributions`,
      providesTags: (result, error, id) => [{ type: 'CapitalActivity', id: `${id}-distributions` }],
    }),

    // Calculate capital activity amounts
    calculateCapitalActivity: builder.mutation<APIResponse<any>, {
      fundId: number;
      eventType: string;
      totalAmount: string;
      allocationType?: string;
    }>({
      query: (data) => ({
        url: '/capital-activities/calculate',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetCapitalActivitiesQuery,
  useGetCapitalActivityQuery,
  useCreateCapitalActivityMutation,
  useUpdateCapitalActivityMutation,
  useDeleteCapitalActivityMutation,
  useSubmitCapitalActivityMutation,
  useApproveCapitalActivityMutation,
  useRejectCapitalActivityMutation,
  useExecuteCapitalActivityMutation,
  useGetCapitalActivityDistributionsQuery,
  useCalculateCapitalActivityMutation,
} = capitalActivityApi;