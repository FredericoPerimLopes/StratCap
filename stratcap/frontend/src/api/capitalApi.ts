import { baseApi } from './baseApi';
import { CapitalCall, Distribution, CapitalActivity, InvestorStatement } from '../types/capital';

export const capitalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Capital Calls
    getCapitalCalls: builder.query<CapitalCall[], string>({
      query: (fundId) => `/funds/${fundId}/capital-calls`,
      providesTags: ['CapitalCall'],
    }),

    getCapitalCall: builder.query<CapitalCall, { fundId: string; id: string }>({
      query: ({ fundId, id }) => `/funds/${fundId}/capital-calls/${id}`,
      providesTags: (_result, _error, { id }) => [{ type: 'CapitalCall', id }],
    }),

    createCapitalCall: builder.mutation<CapitalCall, { fundId: string; capitalCall: Partial<CapitalCall> }>({
      query: ({ fundId, capitalCall }) => ({
        url: `/funds/${fundId}/capital-calls`,
        method: 'POST',
        body: capitalCall,
      }),
      invalidatesTags: ['CapitalCall', 'Fund'],
    }),

    updateCapitalCall: builder.mutation<CapitalCall, { fundId: string; id: string; capitalCall: Partial<CapitalCall> }>({
      query: ({ fundId, id, capitalCall }) => ({
        url: `/funds/${fundId}/capital-calls/${id}`,
        method: 'PUT',
        body: capitalCall,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'CapitalCall', id }],
    }),

    approveCapitalCall: builder.mutation<void, { fundId: string; id: string }>({
      query: ({ fundId, id }) => ({
        url: `/funds/${fundId}/capital-calls/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'CapitalCall', id }],
    }),

    sendCapitalCallNotices: builder.mutation<void, { fundId: string; id: string }>({
      query: ({ fundId, id }) => ({
        url: `/funds/${fundId}/capital-calls/${id}/send-notices`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'CapitalCall', id }],
    }),

    recordCapitalCallFunding: builder.mutation<void, { 
      fundId: string; 
      id: string; 
      allocations: Array<{ investorId: string; amount: number; fundingDate: Date }> 
    }>({
      query: ({ fundId, id, allocations }) => ({
        url: `/funds/${fundId}/capital-calls/${id}/record-funding`,
        method: 'POST',
        body: { allocations },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'CapitalCall', id },
        { type: 'Fund', id: 'LIST' },
        { type: 'Investor', id: 'LIST' },
      ],
    }),

    // Distributions
    getDistributions: builder.query<Distribution[], string>({
      query: (fundId) => `/funds/${fundId}/distributions`,
      providesTags: ['Distribution'],
    }),

    getDistribution: builder.query<Distribution, { fundId: string; id: string }>({
      query: ({ fundId, id }) => `/funds/${fundId}/distributions/${id}`,
      providesTags: (_result, _error, { id }) => [{ type: 'Distribution', id }],
    }),

    createDistribution: builder.mutation<Distribution, { fundId: string; distribution: Partial<Distribution> }>({
      query: ({ fundId, distribution }) => ({
        url: `/funds/${fundId}/distributions`,
        method: 'POST',
        body: distribution,
      }),
      invalidatesTags: ['Distribution', 'Fund'],
    }),

    updateDistribution: builder.mutation<Distribution, { fundId: string; id: string; distribution: Partial<Distribution> }>({
      query: ({ fundId, id, distribution }) => ({
        url: `/funds/${fundId}/distributions/${id}`,
        method: 'PUT',
        body: distribution,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Distribution', id }],
    }),

    approveDistribution: builder.mutation<void, { fundId: string; id: string }>({
      query: ({ fundId, id }) => ({
        url: `/funds/${fundId}/distributions/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Distribution', id }],
    }),

    processDistribution: builder.mutation<void, { fundId: string; id: string }>({
      query: ({ fundId, id }) => ({
        url: `/funds/${fundId}/distributions/${id}/process`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Distribution', id },
        { type: 'Fund', id: 'LIST' },
        { type: 'Investor', id: 'LIST' },
      ],
    }),

    // Capital Activities (general)
    getCapitalActivities: builder.query<CapitalActivity[], { fundId: string; type?: string; status?: string }>({
      query: ({ fundId, type, status }) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        
        return `/funds/${fundId}/capital-activities?${params.toString()}`;
      },
      providesTags: ['CapitalCall', 'Distribution'],
    }),

    // Investor Statements
    generateInvestorStatement: builder.mutation<InvestorStatement, { 
      fundId: string; 
      investorId: string; 
      periodEnd: Date 
    }>({
      query: ({ fundId, investorId, periodEnd }) => ({
        url: `/funds/${fundId}/investors/${investorId}/statements`,
        method: 'POST',
        body: { periodEnd: periodEnd.toISOString() },
      }),
      invalidatesTags: ['Statement'],
    }),

    getInvestorStatements: builder.query<InvestorStatement[], { fundId: string; investorId: string }>({
      query: ({ fundId, investorId }) => `/funds/${fundId}/investors/${investorId}/statements`,
      providesTags: ['Statement'],
    }),

    // Waterfall Calculations
    calculateWaterfall: builder.mutation<any, { 
      fundId: string; 
      distributionAmount: number; 
      calculationDate: Date 
    }>({
      query: ({ fundId, distributionAmount, calculationDate }) => ({
        url: `/funds/${fundId}/waterfall/calculate`,
        method: 'POST',
        body: { 
          distributionAmount, 
          calculationDate: calculationDate.toISOString() 
        },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCapitalCallsQuery,
  useGetCapitalCallQuery,
  useCreateCapitalCallMutation,
  useUpdateCapitalCallMutation,
  useApproveCapitalCallMutation,
  useSendCapitalCallNoticesMutation,
  useRecordCapitalCallFundingMutation,
  useGetDistributionsQuery,
  useGetDistributionQuery,
  useCreateDistributionMutation,
  useUpdateDistributionMutation,
  useApproveDistributionMutation,
  useProcessDistributionMutation,
  useGetCapitalActivitiesQuery,
  useGenerateInvestorStatementMutation,
  useGetInvestorStatementsQuery,
  useCalculateWaterfallMutation,
} = capitalApi;