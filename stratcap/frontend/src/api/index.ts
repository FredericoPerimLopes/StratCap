// API Exports
export { baseApi } from './baseApi';

// Fund API
export { fundApi } from './fundApi';
export {
  useGetFundsQuery,
  useGetFundQuery,
  useCreateFundMutation,
  useUpdateFundMutation,
  useDeleteFundMutation,
  useGetFundMetricsQuery,
  useGetFundCommitmentsQuery,
} from './fundApi';

// Investor API
export { investorApi } from './investorApi';
export {
  useGetInvestorsQuery,
  useGetInvestorQuery,
  useCreateInvestorMutation,
  useUpdateInvestorMutation,
  useDeleteInvestorMutation,
  useUpdateKycStatusMutation,
  useUpdateAmlStatusMutation,
  useGetInvestorCommitmentsQuery,
  useGetInvestorDocumentsQuery,
} from './investorApi';

// Capital Activity API
export { capitalActivityApi } from './capitalActivityApi';
export {
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
} from './capitalActivityApi';

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Transform RTK Query error to user-friendly message
export const getErrorMessage = (error: any): string => {
  if ('status' in error) {
    if (error.status === 'FETCH_ERROR') {
      return 'Network error - please check your connection';
    }
    if (error.status === 'PARSING_ERROR') {
      return 'Invalid server response';
    }
    if (error.status === 401) {
      return 'Please log in to continue';
    }
    if (error.status === 403) {
      return 'You do not have permission to perform this action';
    }
    if (error.status === 404) {
      return 'The requested resource was not found';
    }
    if (error.status === 409) {
      return 'This action conflicts with existing data';
    }
    if (error.status >= 500) {
      return 'Server error - please try again later';
    }
    if (error.data?.message) {
      return error.data.message;
    }
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};