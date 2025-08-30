import { baseApi } from './baseApi';
import type { APIResponse, Fund, FundFormData } from '../types/api';

export const fundApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all funds with pagination and filtering
    getFunds: builder.query<APIResponse<Fund[]>, {
      page?: number;
      limit?: number;
      fundFamilyId?: number;
      status?: string;
      search?: string;
    }>({
      query: ({ page = 0, limit = 25, ...params }) => ({
        url: '/funds',
        params: { page, limit, ...params },
      }),
      providesTags: ['Fund'],
    }),

    // Get single fund by ID
    getFund: builder.query<APIResponse<Fund>, number>({
      query: (id) => `/funds/${id}`,
      providesTags: (result, error, id) => [{ type: 'Fund', id }],
    }),

    // Create new fund
    createFund: builder.mutation<APIResponse<Fund>, FundFormData>({
      query: (data) => ({
        url: '/funds',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Fund'],
    }),

    // Update existing fund
    updateFund: builder.mutation<APIResponse<Fund>, { id: number; data: Partial<FundFormData> }>({
      query: ({ id, data }) => ({
        url: `/funds/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Fund', id }],
    }),

    // Delete fund
    deleteFund: builder.mutation<APIResponse<void>, number>({
      query: (id) => ({
        url: `/funds/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Fund'],
    }),

    // Get fund performance metrics
    getFundMetrics: builder.query<APIResponse<any>, number>({
      query: (id) => `/funds/${id}/metrics`,
      providesTags: (result, error, id) => [{ type: 'Fund', id: `${id}-metrics` }],
    }),

    // Get fund commitments
    getFundCommitments: builder.query<APIResponse<any[]>, {
      fundId: number;
      page?: number;
      limit?: number;
    }>({
      query: ({ fundId, page = 0, limit = 25 }) => ({
        url: `/funds/${fundId}/commitments`,
        params: { page, limit },
      }),
      providesTags: (result, error, { fundId }) => [{ type: 'Fund', id: `${fundId}-commitments` }],
    }),
  }),
});

export const {
  useGetFundsQuery,
  useGetFundQuery,
  useCreateFundMutation,
  useUpdateFundMutation,
  useDeleteFundMutation,
  useGetFundMetricsQuery,
  useGetFundCommitmentsQuery,
} = fundApi;