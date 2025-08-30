import { baseApi } from './baseApi';
import { Fund, FundSummary, FundPerformance } from '../types/fund';

export const fundsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all funds
    getFunds: builder.query<Fund[], void>({
      query: () => '/funds',
      providesTags: ['Fund'],
    }),

    // Get fund by ID
    getFund: builder.query<Fund, string>({
      query: (id) => `/funds/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Fund', id }],
    }),

    // Create new fund
    createFund: builder.mutation<Fund, Partial<Fund>>({
      query: (fund) => ({
        url: '/funds',
        method: 'POST',
        body: fund,
      }),
      invalidatesTags: ['Fund'],
    }),

    // Update fund
    updateFund: builder.mutation<Fund, { id: string; fund: Partial<Fund> }>({
      query: ({ id, fund }) => ({
        url: `/funds/${id}`,
        method: 'PUT',
        body: fund,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Fund', id }],
    }),

    // Delete fund
    deleteFund: builder.mutation<void, string>({
      query: (id) => ({
        url: `/funds/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Fund'],
    }),

    // Get fund summary statistics
    getFundSummaries: builder.query<FundSummary[], void>({
      query: () => '/funds/summaries',
      providesTags: ['Fund'],
    }),

    // Get fund performance data
    getFundPerformance: builder.query<FundPerformance[], string>({
      query: (fundId) => `/funds/${fundId}/performance`,
      providesTags: (_result, _error, fundId) => [{ type: 'Fund', id: fundId }],
    }),

    // Get fund investors
    getFundInvestors: builder.query<any[], string>({
      query: (fundId) => `/funds/${fundId}/investors`,
      providesTags: (_result, _error, fundId) => [
        { type: 'Fund', id: fundId },
        { type: 'Investor', id: 'LIST' },
      ],
    }),

    // Add investor to fund
    addInvestorToFund: builder.mutation<void, { fundId: string; investorId: string; commitment: number }>({
      query: ({ fundId, investorId, commitment }) => ({
        url: `/funds/${fundId}/investors`,
        method: 'POST',
        body: { investorId, commitment },
      }),
      invalidatesTags: (_result, _error, { fundId }) => [
        { type: 'Fund', id: fundId },
        { type: 'Investor', id: 'LIST' },
      ],
    }),

    // Remove investor from fund
    removeInvestorFromFund: builder.mutation<void, { fundId: string; investorId: string }>({
      query: ({ fundId, investorId }) => ({
        url: `/funds/${fundId}/investors/${investorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { fundId }) => [
        { type: 'Fund', id: fundId },
        { type: 'Investor', id: 'LIST' },
      ],
    }),

    // Get fund metrics and analytics
    getFundMetrics: builder.query<any, string>({
      query: (fundId) => `/funds/${fundId}/metrics`,
      providesTags: (_result, _error, fundId) => [{ type: 'Fund', id: fundId }],
    }),
  }),
  overrideExisting: false,
});

// Export hooks for components
export const {
  useGetFundsQuery,
  useGetFundQuery,
  useCreateFundMutation,
  useUpdateFundMutation,
  useDeleteFundMutation,
  useGetFundSummariesQuery,
  useGetFundPerformanceQuery,
  useGetFundInvestorsQuery,
  useAddInvestorToFundMutation,
  useRemoveInvestorFromFundMutation,
  useGetFundMetricsQuery,
} = fundsApi;