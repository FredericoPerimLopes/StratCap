import { baseApi } from './baseApi';
import type { APIResponse, InvestorEntity, InvestorFormData } from '../types/api';

export const investorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all investors with pagination and filtering
    getInvestors: builder.query<APIResponse<InvestorEntity[]>, {
      page?: number;
      limit?: number;
      type?: string;
      kycStatus?: string;
      search?: string;
    }>({
      query: ({ page = 0, limit = 25, ...params }) => ({
        url: '/investors',
        params: { page, limit, ...params },
      }),
      providesTags: ['Investor'],
    }),

    // Get single investor by ID
    getInvestor: builder.query<APIResponse<InvestorEntity>, number>({
      query: (id) => `/investors/${id}`,
      providesTags: (result, error, id) => [{ type: 'Investor', id }],
    }),

    // Create new investor
    createInvestor: builder.mutation<APIResponse<InvestorEntity>, InvestorFormData>({
      query: (data) => ({
        url: '/investors',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Investor'],
    }),

    // Update existing investor
    updateInvestor: builder.mutation<APIResponse<InvestorEntity>, { id: number; data: Partial<InvestorFormData> }>({
      query: ({ id, data }) => ({
        url: `/investors/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Investor', id }],
    }),

    // Delete investor
    deleteInvestor: builder.mutation<APIResponse<void>, number>({
      query: (id) => ({
        url: `/investors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Investor'],
    }),

    // Update KYC status
    updateKycStatus: builder.mutation<APIResponse<InvestorEntity>, { 
      id: number; 
      status: 'pending' | 'approved' | 'rejected' | 'expired';
      notes?: string;
    }>({
      query: ({ id, ...data }) => ({
        url: `/investors/${id}/kyc`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Investor', id }],
    }),

    // Update AML status
    updateAmlStatus: builder.mutation<APIResponse<InvestorEntity>, { 
      id: number; 
      status: 'pending' | 'approved' | 'rejected' | 'expired';
      notes?: string;
    }>({
      query: ({ id, ...data }) => ({
        url: `/investors/${id}/aml`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Investor', id }],
    }),

    // Get investor commitments
    getInvestorCommitments: builder.query<APIResponse<any[]>, {
      investorId: number;
      page?: number;
      limit?: number;
    }>({
      query: ({ investorId, page = 0, limit = 25 }) => ({
        url: `/investors/${investorId}/commitments`,
        params: { page, limit },
      }),
      providesTags: (result, error, { investorId }) => [{ type: 'Investor', id: `${investorId}-commitments` }],
    }),

    // Get investor documents
    getInvestorDocuments: builder.query<APIResponse<any[]>, number>({
      query: (id) => `/investors/${id}/documents`,
      providesTags: (result, error, id) => [{ type: 'Investor', id: `${id}-documents` }],
    }),
  }),
});

export const {
  useGetInvestorsQuery,
  useGetInvestorQuery,
  useCreateInvestorMutation,
  useUpdateInvestorMutation,
  useDeleteInvestorMutation,
  useUpdateKycStatusMutation,
  useUpdateAmlStatusMutation,
  useGetInvestorCommitmentsQuery,
  useGetInvestorDocumentsQuery,
} = investorApi;