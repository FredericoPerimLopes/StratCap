import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fundFamilyAPI } from '../../services/api';

export interface FundFamily {
  id: number;
  name: string;
  code: string;
  description?: string;
  managementCompany: string;
  primaryCurrency: string;
  fiscalYearEnd: string;
  status: 'active' | 'inactive' | 'archived';
  settings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  funds?: any[];
  users?: any[];
}

interface FundFamilyState {
  fundFamilies: FundFamily[];
  currentFundFamily: FundFamily | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
}

const initialState: FundFamilyState = {
  fundFamilies: [],
  currentFundFamily: null,
  isLoading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const fetchFundFamilies = createAsyncThunk(
  'fundFamily/fetchFundFamilies',
  async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const response = await fundFamilyAPI.getAll(params);
    return response.data;
  }
);

export const fetchFundFamilyById = createAsyncThunk(
  'fundFamily/fetchFundFamilyById',
  async (id: number) => {
    const response = await fundFamilyAPI.getById(id);
    return response.data;
  }
);

export const createFundFamily = createAsyncThunk(
  'fundFamily/createFundFamily',
  async (data: Partial<FundFamily>) => {
    const response = await fundFamilyAPI.create(data);
    return response.data;
  }
);

export const updateFundFamily = createAsyncThunk(
  'fundFamily/updateFundFamily',
  async ({ id, data }: { id: number; data: Partial<FundFamily> }) => {
    const response = await fundFamilyAPI.update(id, data);
    return response.data;
  }
);

export const deleteFundFamily = createAsyncThunk(
  'fundFamily/deleteFundFamily',
  async (id: number) => {
    await fundFamilyAPI.delete(id);
    return id;
  }
);

const fundFamilySlice = createSlice({
  name: 'fundFamily',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentFundFamily: (state) => {
      state.currentFundFamily = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Fund Families
      .addCase(fetchFundFamilies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFundFamilies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fundFamilies = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchFundFamilies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch fund families';
      })
      
      // Fetch Fund Family by ID
      .addCase(fetchFundFamilyById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFundFamilyById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentFundFamily = action.payload.data;
      })
      .addCase(fetchFundFamilyById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch fund family';
      })
      
      // Create Fund Family
      .addCase(createFundFamily.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFundFamily.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fundFamilies.unshift(action.payload.data);
      })
      .addCase(createFundFamily.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create fund family';
      })
      
      // Update Fund Family
      .addCase(updateFundFamily.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFundFamily.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.fundFamilies.findIndex(
          (ff) => ff.id === action.payload.data.id
        );
        if (index !== -1) {
          state.fundFamilies[index] = action.payload.data;
        }
        if (state.currentFundFamily?.id === action.payload.data.id) {
          state.currentFundFamily = action.payload.data;
        }
      })
      .addCase(updateFundFamily.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update fund family';
      })
      
      // Delete Fund Family
      .addCase(deleteFundFamily.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteFundFamily.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fundFamilies = state.fundFamilies.filter(
          (ff) => ff.id !== action.payload
        );
        if (state.currentFundFamily?.id === action.payload) {
          state.currentFundFamily = null;
        }
      })
      .addCase(deleteFundFamily.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete fund family';
      });
  },
});

export const { clearError, clearCurrentFundFamily } = fundFamilySlice.actions;
export default fundFamilySlice.reducer;