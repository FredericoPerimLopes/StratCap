import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SnackbarProvider } from 'notistack';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { AuthContext } from '../contexts/AuthContext';
import { theme } from '../theme';

// Mock Redux store setup
import { RootState } from '../store/types';
import authReducer from '../store/slices/authSlice';
import fundReducer from '../store/slices/fundSlice';
import investorReducer from '../store/slices/investorSlice';

// Mock auth context value
export const mockAuthContext = {
  user: {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
  },
  token: 'mock-jwt-token',
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
  isLoading: false,
  error: null,
  clearError: jest.fn(),
  refreshToken: jest.fn(),
};

// Mock store configuration
export function setupTestStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      funds: fundReducer,
      investors: investorReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
}

// Mock query client
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  store?: ReturnType<typeof setupTestStore>;
  authContext?: typeof mockAuthContext;
  queryClient?: QueryClient;
  route?: string;
}

// Custom render function with all providers
export function renderWithProviders(
  ui: ReactElement,
  options: ExtendedRenderOptions = {}
): RenderResult & { store: ReturnType<typeof setupTestStore> } {
  const {
    preloadedState = {},
    store = setupTestStore(preloadedState),
    authContext = mockAuthContext,
    queryClient = createTestQueryClient(),
    route = '/',
    ...renderOptions
  } = options;

  // Navigate to the specified route
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route);
  }

  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <AuthContext.Provider value={authContext}>
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <SnackbarProvider maxSnack={3}>
                {children}
              </SnackbarProvider>
            </ThemeProvider>
          </BrowserRouter>
        </AuthContext.Provider>
      </Provider>
    </QueryClientProvider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

// Re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Test data factories
export const createMockFund = (overrides = {}) => ({
  id: '1',
  name: 'Test Fund',
  fundType: 'Private Equity',
  targetSize: 100000000,
  vintage: 2023,
  status: 'Active',
  managementFeeRate: 2.0,
  carriedInterestRate: 20.0,
  generalPartner: 'Test GP',
  fundFamilyId: '1',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockInvestor = (overrides = {}) => ({
  id: '1',
  name: 'Test Investor',
  type: 'Institution',
  email: 'investor@example.com',
  phone: '+1-555-0123',
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'US',
  },
  taxId: '12-3456789',
  kycStatus: 'Approved',
  accreditationStatus: 'Accredited',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockTransaction = (overrides = {}) => ({
  id: '1',
  type: 'Capital Call',
  amount: 1000000,
  date: '2023-06-01T00:00:00.000Z',
  description: 'Test transaction',
  fundId: '1',
  investorId: '1',
  status: 'Completed',
  reference: 'TXN-001',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockCommitment = (overrides = {}) => ({
  id: '1',
  fundId: '1',
  investorId: '1',
  amount: 5000000,
  dateCommitted: '2023-01-01T00:00:00.000Z',
  status: 'Active',
  capitalCalled: 1000000,
  capitalDistributed: 0,
  unfundedCommitment: 4000000,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

// Utility functions for common test scenarios
export const waitForLoadingToFinish = async () => {
  const { findByTestId, queryByTestId } = await import('@testing-library/react');
  
  // Wait for loading spinners to disappear
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Check if loading spinner is gone
  const loadingSpinner = queryByTestId('loading-spinner');
  if (loadingSpinner) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

export const fillForm = async (fields: Record<string, string>) => {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  
  for (const [testId, value] of Object.entries(fields)) {
    const field = document.querySelector(`[data-testid="${testId}"]`) as HTMLInputElement;
    if (field) {
      await user.clear(field);
      await user.type(field, value);
    }
  }
};

export const selectOption = async (selectTestId: string, optionText: string) => {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  
  const select = document.querySelector(`[data-testid="${selectTestId}"]`) as HTMLElement;
  if (select) {
    await user.click(select);
    
    // Wait for options to appear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const option = document.querySelector(`[role="option"][data-value="${optionText}"]`) as HTMLElement;
    if (option) {
      await user.click(option);
    }
  }
};

// Mock API handlers for MSW
export const handlers = [
  // Add your API handlers here
];

// Financial calculation test utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercentage = (rate: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate / 100);
};

// A11y test utilities
export const getAccessibleName = (element: HTMLElement): string => {
  return element.getAttribute('aria-label') || 
         element.getAttribute('aria-labelledby') || 
         element.textContent || 
         '';
};

export const hasRequiredAccessibilityAttributes = (element: HTMLElement): boolean => {
  const role = element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const ariaDescribedBy = element.getAttribute('aria-describedby');
  
  return !!(role && (ariaLabel || ariaLabelledBy || element.textContent));
};