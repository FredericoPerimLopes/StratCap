import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { investorAPI } from '../../services/api';

export interface Investor {
  id: number;
  name: string;
  legalName: string;
  type: 'individual' | 'institution' | 'fund' | 'trust' | 'other';
  entityType?: string;
  taxId?: string;
  registrationNumber?: string;
  domicile: string;
  taxResidence?: string;
  accreditedInvestor: boolean;
  qualifiedPurchaser: boolean;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  primaryContact?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  kycDate?: string;
  amlStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  amlDate?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface InvestorState {
  investors: Investor[];
  currentInvestor: Investor | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
}

const initialState: InvestorState = {
  investors: [],
  currentInvestor: null,
  isLoading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const fetchInvestors = createAsyncThunk(
  'investor/fetchInvestors',
  async (params?: { page?: number; limit?: number; search?: string; type?: string }) => {
    const response = await investorAPI.getAll(params);
    return response.data;
  }
);

export const fetchInvestorById = createAsyncThunk(
  'investor/fetchInvestorById',
  async (id: number) => {
    const response = await investorAPI.getById(id);
    return response.data;
  }
);

export const createInvestor = createAsyncThunk(
  'investor/createInvestor',
  async (data: Partial<Investor>) => {
    const response = await investorAPI.create(data);
    return response.data;
  }
);

export const updateInvestor = createAsyncThunk(
  'investor/updateInvestor',
  async ({ id, data }: { id: number; data: Partial<Investor> }) => {
    const response = await investorAPI.update(id, data);
    return response.data;
  }
);

export const deleteInvestor = createAsyncThunk(
  'investor/deleteInvestor',
  async (id: number) => {
    await investorAPI.delete(id);
    return id;
  }
);

const investorSlice = createSlice({
  name: 'investor',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentInvestor: (state) => {
      state.currentInvestor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Investors
      .addCase(fetchInvestors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvestors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.investors = action.payload.data;
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchInvestors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch investors';
      })
      
      // Fetch Investor by ID
      .addCase(fetchInvestorById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvestorById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentInvestor = action.payload.data;
      })
      .addCase(fetchInvestorById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch investor';
      })
      
      // Create Investor
      .addCase(createInvestor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInvestor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.investors.unshift(action.payload.data);
      })
      .addCase(createInvestor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create investor';
      })
      
      // Update Investor
      .addCase(updateInvestor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateInvestor.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.investors.findIndex(
          (investor) => investor.id === action.payload.data.id
        );
        if (index !== -1) {
          state.investors[index] = action.payload.data;
        }
        if (state.currentInvestor?.id === action.payload.data.id) {
          state.currentInvestor = action.payload.data;
        }
      })
      .addCase(updateInvestor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update investor';
      })
      
      // Delete Investor
      .addCase(deleteInvestor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteInvestor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.investors = state.investors.filter(
          (investor) => investor.id !== action.payload
        );
        if (state.currentInvestor?.id === action.payload) {
          state.currentInvestor = null;
        }
      })
      .addCase(deleteInvestor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete investor';
      });
  },
});

export const { clearError, clearCurrentInvestor } = investorSlice.actions;
export default investorSlice.reducer;