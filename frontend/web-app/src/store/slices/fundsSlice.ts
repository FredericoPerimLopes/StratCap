import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import fundService from '../../services/fundService';
import { Fund, FundPerformance, CapitalCall, Distribution, CreateFundRequest, UpdateFundRequest } from '../../types/fund';

interface FundsState {
  funds: Fund[];
  selectedFund: Fund | null;
  performance: FundPerformance | null;
  capitalCalls: CapitalCall[];
  distributions: Distribution[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FundsState = {
  funds: [],
  selectedFund: null,
  performance: null,
  capitalCalls: [],
  distributions: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchFunds = createAsyncThunk<Fund[], void, { rejectValue: string }>(
  'funds/fetchFunds',
  async (_, { rejectWithValue }) => {
    try {
      return await fundService.getFunds();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch funds');
    }
  }
);

export const fetchFund = createAsyncThunk<Fund, string, { rejectValue: string }>(
  'funds/fetchFund',
  async (fundId, { rejectWithValue }) => {
    try {
      return await fundService.getFund(fundId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch fund');
    }
  }
);

export const createFund = createAsyncThunk<Fund, CreateFundRequest, { rejectValue: string }>(
  'funds/createFund',
  async (fundData, { rejectWithValue }) => {
    try {
      return await fundService.createFund(fundData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create fund');
    }
  }
);

export const updateFund = createAsyncThunk<Fund, UpdateFundRequest, { rejectValue: string }>(
  'funds/updateFund',
  async (fundData, { rejectWithValue }) => {
    try {
      return await fundService.updateFund(fundData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update fund');
    }
  }
);

export const deleteFund = createAsyncThunk<string, string, { rejectValue: string }>(
  'funds/deleteFund',
  async (fundId, { rejectWithValue }) => {
    try {
      await fundService.deleteFund(fundId);
      return fundId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete fund');
    }
  }
);

export const fetchFundPerformance = createAsyncThunk<FundPerformance, string, { rejectValue: string }>(
  'funds/fetchFundPerformance',
  async (fundId, { rejectWithValue }) => {
    try {
      return await fundService.getFundPerformance(fundId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch fund performance');
    }
  }
);

export const fetchCapitalCalls = createAsyncThunk<CapitalCall[], string, { rejectValue: string }>(
  'funds/fetchCapitalCalls',
  async (fundId, { rejectWithValue }) => {
    try {
      return await fundService.getCapitalCalls(fundId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch capital calls');
    }
  }
);

export const fetchDistributions = createAsyncThunk<Distribution[], string, { rejectValue: string }>(
  'funds/fetchDistributions',
  async (fundId, { rejectWithValue }) => {
    try {
      return await fundService.getDistributions(fundId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch distributions');
    }
  }
);

const fundsSlice = createSlice({
  name: 'funds',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedFund: (state, action: PayloadAction<Fund | null>) => {
      state.selectedFund = action.payload;
    },
    clearSelectedFund: (state) => {
      state.selectedFund = null;
      state.performance = null;
      state.capitalCalls = [];
      state.distributions = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch funds
    builder
      .addCase(fetchFunds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFunds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.funds = action.payload;
      })
      .addCase(fetchFunds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch funds';
      });

    // Fetch fund
    builder
      .addCase(fetchFund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFund.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedFund = action.payload;
      })
      .addCase(fetchFund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch fund';
      });

    // Create fund
    builder
      .addCase(createFund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFund.fulfilled, (state, action) => {
        state.isLoading = false;
        state.funds.push(action.payload);
      })
      .addCase(createFund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create fund';
      });

    // Update fund
    builder
      .addCase(updateFund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFund.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.funds.findIndex(f => f.fund_id === action.payload.fund_id);
        if (index !== -1) {
          state.funds[index] = action.payload;
        }
        if (state.selectedFund?.fund_id === action.payload.fund_id) {
          state.selectedFund = action.payload;
        }
      })
      .addCase(updateFund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update fund';
      });

    // Delete fund
    builder
      .addCase(deleteFund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteFund.fulfilled, (state, action) => {
        state.isLoading = false;
        state.funds = state.funds.filter(f => f.fund_id !== action.payload);
        if (state.selectedFund?.fund_id === action.payload) {
          state.selectedFund = null;
        }
      })
      .addCase(deleteFund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete fund';
      });

    // Fetch fund performance
    builder
      .addCase(fetchFundPerformance.fulfilled, (state, action) => {
        state.performance = action.payload;
      })
      .addCase(fetchFundPerformance.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch fund performance';
      });

    // Fetch capital calls
    builder
      .addCase(fetchCapitalCalls.fulfilled, (state, action) => {
        state.capitalCalls = action.payload;
      })
      .addCase(fetchCapitalCalls.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch capital calls';
      });

    // Fetch distributions
    builder
      .addCase(fetchDistributions.fulfilled, (state, action) => {
        state.distributions = action.payload;
      })
      .addCase(fetchDistributions.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch distributions';
      });
  },
});

// Selectors
export const selectFunds = (state: RootState) => state.funds.funds;
export const selectSelectedFund = (state: RootState) => state.funds.selectedFund;
export const selectFundPerformance = (state: RootState) => state.funds.performance;
export const selectCapitalCalls = (state: RootState) => state.funds.capitalCalls;
export const selectDistributions = (state: RootState) => state.funds.distributions;
export const selectFundsLoading = (state: RootState) => state.funds.isLoading;
export const selectFundsError = (state: RootState) => state.funds.error;

export const { clearError, setSelectedFund, clearSelectedFund } = fundsSlice.actions;
export default fundsSlice.reducer;