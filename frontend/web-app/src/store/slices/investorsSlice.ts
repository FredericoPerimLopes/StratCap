import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import investorService from '../../services/investorService';
import { 
  Investor, 
  InvestorCommitment, 
  InvestorStatement, 
  InvestorDocument,
  CreateInvestorRequest, 
  UpdateInvestorRequest,
  CreateCommitmentRequest 
} from '../../types/investor';

interface InvestorsState {
  investors: Investor[];
  selectedInvestor: Investor | null;
  commitments: InvestorCommitment[];
  statements: InvestorStatement[];
  documents: InvestorDocument[];
  isLoading: boolean;
  error: string | null;
}

const initialState: InvestorsState = {
  investors: [],
  selectedInvestor: null,
  commitments: [],
  statements: [],
  documents: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchInvestors = createAsyncThunk<Investor[], void, { rejectValue: string }>(
  'investors/fetchInvestors',
  async (_, { rejectWithValue }) => {
    try {
      return await investorService.getInvestors();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch investors');
    }
  }
);

export const fetchInvestor = createAsyncThunk<Investor, string, { rejectValue: string }>(
  'investors/fetchInvestor',
  async (investorId, { rejectWithValue }) => {
    try {
      return await investorService.getInvestor(investorId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch investor');
    }
  }
);

export const createInvestor = createAsyncThunk<Investor, CreateInvestorRequest, { rejectValue: string }>(
  'investors/createInvestor',
  async (investorData, { rejectWithValue }) => {
    try {
      return await investorService.createInvestor(investorData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create investor');
    }
  }
);

export const updateInvestor = createAsyncThunk<Investor, UpdateInvestorRequest, { rejectValue: string }>(
  'investors/updateInvestor',
  async (investorData, { rejectWithValue }) => {
    try {
      return await investorService.updateInvestor(investorData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update investor');
    }
  }
);

export const deleteInvestor = createAsyncThunk<string, string, { rejectValue: string }>(
  'investors/deleteInvestor',
  async (investorId, { rejectWithValue }) => {
    try {
      await investorService.deleteInvestor(investorId);
      return investorId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete investor');
    }
  }
);

export const fetchInvestorCommitments = createAsyncThunk<InvestorCommitment[], string, { rejectValue: string }>(
  'investors/fetchInvestorCommitments',
  async (investorId, { rejectWithValue }) => {
    try {
      return await investorService.getInvestorCommitments(investorId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch investor commitments');
    }
  }
);

export const createCommitment = createAsyncThunk<InvestorCommitment, CreateCommitmentRequest, { rejectValue: string }>(
  'investors/createCommitment',
  async (commitmentData, { rejectWithValue }) => {
    try {
      return await investorService.createCommitment(commitmentData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create commitment');
    }
  }
);

export const fetchInvestorStatements = createAsyncThunk<InvestorStatement[], { investorId: string; fundId?: string }, { rejectValue: string }>(
  'investors/fetchInvestorStatements',
  async ({ investorId, fundId }, { rejectWithValue }) => {
    try {
      return await investorService.getInvestorStatements(investorId, fundId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch investor statements');
    }
  }
);

export const fetchInvestorDocuments = createAsyncThunk<InvestorDocument[], string, { rejectValue: string }>(
  'investors/fetchInvestorDocuments',
  async (investorId, { rejectWithValue }) => {
    try {
      return await investorService.getInvestorDocuments(investorId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch investor documents');
    }
  }
);

export const searchInvestors = createAsyncThunk<Investor[], { query: string; filters?: any }, { rejectValue: string }>(
  'investors/searchInvestors',
  async ({ query, filters }, { rejectWithValue }) => {
    try {
      return await investorService.searchInvestors(query, filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search investors');
    }
  }
);

const investorsSlice = createSlice({
  name: 'investors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedInvestor: (state, action: PayloadAction<Investor | null>) => {
      state.selectedInvestor = action.payload;
    },
    clearSelectedInvestor: (state) => {
      state.selectedInvestor = null;
      state.commitments = [];
      state.statements = [];
      state.documents = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch investors
    builder
      .addCase(fetchInvestors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvestors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.investors = action.payload;
      })
      .addCase(fetchInvestors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch investors';
      });

    // Fetch investor
    builder
      .addCase(fetchInvestor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvestor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedInvestor = action.payload;
      })
      .addCase(fetchInvestor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch investor';
      });

    // Create investor
    builder
      .addCase(createInvestor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInvestor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.investors.push(action.payload);
      })
      .addCase(createInvestor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create investor';
      });

    // Update investor
    builder
      .addCase(updateInvestor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateInvestor.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.investors.findIndex(i => i.investor_id === action.payload.investor_id);
        if (index !== -1) {
          state.investors[index] = action.payload;
        }
        if (state.selectedInvestor?.investor_id === action.payload.investor_id) {
          state.selectedInvestor = action.payload;
        }
      })
      .addCase(updateInvestor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update investor';
      });

    // Delete investor
    builder
      .addCase(deleteInvestor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteInvestor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.investors = state.investors.filter(i => i.investor_id !== action.payload);
        if (state.selectedInvestor?.investor_id === action.payload) {
          state.selectedInvestor = null;
        }
      })
      .addCase(deleteInvestor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete investor';
      });

    // Fetch investor commitments
    builder
      .addCase(fetchInvestorCommitments.fulfilled, (state, action) => {
        state.commitments = action.payload;
      })
      .addCase(fetchInvestorCommitments.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch investor commitments';
      });

    // Create commitment
    builder
      .addCase(createCommitment.fulfilled, (state, action) => {
        state.commitments.push(action.payload);
      })
      .addCase(createCommitment.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create commitment';
      });

    // Fetch investor statements
    builder
      .addCase(fetchInvestorStatements.fulfilled, (state, action) => {
        state.statements = action.payload;
      })
      .addCase(fetchInvestorStatements.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch investor statements';
      });

    // Fetch investor documents
    builder
      .addCase(fetchInvestorDocuments.fulfilled, (state, action) => {
        state.documents = action.payload;
      })
      .addCase(fetchInvestorDocuments.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch investor documents';
      });

    // Search investors
    builder
      .addCase(searchInvestors.fulfilled, (state, action) => {
        state.investors = action.payload;
      })
      .addCase(searchInvestors.rejected, (state, action) => {
        state.error = action.payload || 'Failed to search investors';
      });
  },
});

// Selectors
export const selectInvestors = (state: RootState) => state.investors.investors;
export const selectSelectedInvestor = (state: RootState) => state.investors.selectedInvestor;
export const selectInvestorCommitments = (state: RootState) => state.investors.commitments;
export const selectInvestorStatements = (state: RootState) => state.investors.statements;
export const selectInvestorDocuments = (state: RootState) => state.investors.documents;
export const selectInvestorsLoading = (state: RootState) => state.investors.isLoading;
export const selectInvestorsError = (state: RootState) => state.investors.error;

export const { clearError, setSelectedInvestor, clearSelectedInvestor } = investorsSlice.actions;
export default investorsSlice.reducer;