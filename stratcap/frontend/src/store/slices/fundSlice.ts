import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fundAPI } from '../../services/api';

export interface Fund {
  id: number;
  fundFamilyId: number;
  name: string;
  code: string;
  type: 'master' | 'feeder' | 'parallel' | 'subsidiary';
  vintage: number;
  targetSize: string;
  hardCap?: string;
  managementFeeRate: string;
  carriedInterestRate: string;
  preferredReturnRate: string;
  investmentPeriodEnd?: string;
  termEnd?: string;
  extensionPeriods?: number;
  extensionLength?: number;
  currency: string;
  status: 'fundraising' | 'investing' | 'harvesting' | 'closed';
  settings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface FundState {
  funds: Fund[];
  currentFund: Fund | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
}

const initialState: FundState = {
  funds: [],
  currentFund: null,
  isLoading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const fetchFunds = createAsyncThunk(
  'fund/fetchFunds',
  async (params?: { page?: number; limit?: number; search?: string; fundFamilyId?: number }) => {
    const response = await fundAPI.getAll(params);
    return response.data;
  }
);

export const fetchFundById = createAsyncThunk(
  'fund/fetchFundById',
  async (id: number) => {
    const response = await fundAPI.getById(id);
    return response.data;
  }
);

export const createFund = createAsyncThunk(
  'fund/createFund',
  async (data: Partial<Fund>) => {
    const response = await fundAPI.create(data);
    return response.data;
  }
);

export const updateFund = createAsyncThunk(
  'fund/updateFund',
  async ({ id, data }: { id: number; data: Partial<Fund> }) => {
    const response = await fundAPI.update(id, data);
    return response.data;
  }
);

export const deleteFund = createAsyncThunk(
  'fund/deleteFund',
  async (id: number) => {
    await fundAPI.delete(id);
    return id;
  }
);

const fundSlice = createSlice({
  name: 'fund',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentFund: (state) => {
      state.currentFund = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Funds
      .addCase(fetchFunds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFunds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.funds = action.payload.data;
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchFunds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch funds';
      })
      
      // Fetch Fund by ID
      .addCase(fetchFundById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFundById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentFund = action.payload.data;
      })
      .addCase(fetchFundById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch fund';
      })
      
      // Create Fund
      .addCase(createFund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFund.fulfilled, (state, action) => {
        state.isLoading = false;
        state.funds.unshift(action.payload.data);
      })
      .addCase(createFund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create fund';
      })
      
      // Update Fund
      .addCase(updateFund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFund.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.funds.findIndex(
          (fund) => fund.id === action.payload.data.id
        );
        if (index !== -1) {
          state.funds[index] = action.payload.data;
        }
        if (state.currentFund?.id === action.payload.data.id) {
          state.currentFund = action.payload.data;
        }
      })
      .addCase(updateFund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update fund';
      })
      
      // Delete Fund
      .addCase(deleteFund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteFund.fulfilled, (state, action) => {
        state.isLoading = false;
        state.funds = state.funds.filter(
          (fund) => fund.id !== action.payload
        );
        if (state.currentFund?.id === action.payload) {
          state.currentFund = null;
        }
      })
      .addCase(deleteFund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete fund';
      });
  },
});

export const { clearError, clearCurrentFund } = fundSlice.actions;
export default fundSlice.reducer;