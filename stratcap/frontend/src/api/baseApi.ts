import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { RootState } from '../store';

// Base query with auth token and error handling
const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_BASE_URL || '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  });

  let result = await baseQuery(args, api, extraOptions);

  // Handle authentication errors
  if (result.error && result.error.status === 401) {
    // Dispatch logout action or redirect to login
    api.dispatch({ type: 'auth/logout' });
  }

  return result;
};

// Main API slice
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    'Fund',
    'FundFamily',
    'Investor',
    'Commitment',
    'CapitalActivity',
    'CapitalCall',
    'Distribution',
    'Statement',
    'Transaction',
    'User',
    'Report',
  ],
  endpoints: () => ({}),
});

export default baseApi;