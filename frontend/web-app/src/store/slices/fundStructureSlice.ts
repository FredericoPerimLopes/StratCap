import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Updated interfaces for PRD compliance
export interface FundFamily {
  id: string;
  name: string;
  vintage: string;
  status: 'Active' | 'Inactive' | 'Fundraising' | 'Closed';
  targetSize: number;
  committedCapital: number;
  deployedCapital: number;
  fundType: string;
  managementFee: number;
  carryRate: number;
  domicile: string;
  baseCurrency: string;
  inception: string;
  finalClosing?: string;
  description?: string;
}

export interface FundStructure {
  fund_id: string;
  fund_name: string;
  structure_type: 'main' | 'parallel' | 'feeder' | 'master' | 'blocker' | 'aggregator';
  target_size: number;
  committed_capital: number;
  min_commitment: number;
  management_fee_rate: number;
  carry_rate: number;
  parent_fund_id?: string;
  child_funds: string[];
}

export interface AllocationRequest {
  investor_id: string;
  fund_id: string;
  requested_amount: number;
  investor_type: string;
  jurisdiction: string;
  preference_order: string[];
  accepts_side_letter: boolean;
  tax_transparent_required: boolean;
  erisa_percentage?: number;
}

export interface AllocationResult {
  allocation_status: 'full' | 'partial' | 'rejected';
  total_allocated: number;
  allocations: Array<{
    fund_name: string;
    allocated_amount: number;
    percentage: number;
  }>;
  rejection_reasons: string[];
  alternative_funds: Array<{
    fund_name: string;
    suggestion: string;
  }>;
}

interface FundStructureState {
  structures: FundStructure[];
  currentStructure: FundStructure | null;
  hierarchyTree: FundStructureTree | null;
  allocationResults: AllocationResult[];
  loading: boolean;
  error: string | null;
  filters: {
    structure_type?: string;
    parent_fund_id?: string;
  };
}

const initialState: FundStructureState = {
  structures: [],
  currentStructure: null,
  hierarchyTree: null,
  allocationResults: [],
  loading: false,
  error: null,
  filters: {}
};

// Async thunks
export const fetchFundStructures = createAsyncThunk(
  'fundStructure/fetchStructures',
  async (params?: { structure_type?: string; parent_fund_id?: string }) => {
    return await fundStructureService.getFundStructures(params);
  }
);

export const fetchFundStructure = createAsyncThunk(
  'fundStructure/fetchStructure',
  async (fundId: string) => {
    return await fundStructureService.getFundStructure(fundId);
  }
);

export const createFundStructure = createAsyncThunk(
  'fundStructure/createStructure',
  async (data: any) => {
    return await fundStructureService.createFundStructure(data);
  }
);

export const fetchFundHierarchy = createAsyncThunk(
  'fundStructure/fetchHierarchy',
  async (fundId: string) => {
    return await fundStructureService.getFundHierarchy(fundId);
  }
);

export const allocateInvestor = createAsyncThunk(
  'fundStructure/allocateInvestor',
  async (request: AllocationRequest) => {
    return await fundStructureService.allocateInvestor(request);
  }
);

export const updateFundStructure = createAsyncThunk(
  'fundStructure/updateStructure',
  async ({ fundId, data }: { fundId: string; data: any }) => {
    return await fundStructureService.updateFundStructure(fundId, data);
  }
);

const fundStructureSlice = createSlice({
  name: 'fundStructure',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<{ structure_type?: string; parent_fund_id?: string }>) => {
      state.filters = action.payload;
    },
    clearCurrentStructure: (state) => {
      state.currentStructure = null;
    },
    clearHierarchyTree: (state) => {
      state.hierarchyTree = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch structures
      .addCase(fetchFundStructures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFundStructures.fulfilled, (state, action) => {
        state.loading = false;
        state.structures = action.payload;
      })
      .addCase(fetchFundStructures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch fund structures';
      })
      
      // Fetch single structure
      .addCase(fetchFundStructure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFundStructure.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStructure = action.payload;
      })
      .addCase(fetchFundStructure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch fund structure';
      })
      
      // Create structure
      .addCase(createFundStructure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFundStructure.fulfilled, (state, action) => {
        state.loading = false;
        state.structures.push(action.payload);
        state.currentStructure = action.payload;
      })
      .addCase(createFundStructure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create fund structure';
      })
      
      // Update structure
      .addCase(updateFundStructure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFundStructure.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.structures.findIndex(s => s.fund_id === action.payload.fund_id);
        if (index !== -1) {
          state.structures[index] = action.payload;
        }
        if (state.currentStructure?.fund_id === action.payload.fund_id) {
          state.currentStructure = action.payload;
        }
      })
      .addCase(updateFundStructure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update fund structure';
      })
      
      // Fetch hierarchy
      .addCase(fetchFundHierarchy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFundHierarchy.fulfilled, (state, action) => {
        state.loading = false;
        state.hierarchyTree = action.payload;
      })
      .addCase(fetchFundHierarchy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch fund hierarchy';
      })
      
      // Allocate investor
      .addCase(allocateInvestor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(allocateInvestor.fulfilled, (state, action) => {
        state.loading = false;
        state.allocationResults.push(action.payload);
      })
      .addCase(allocateInvestor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to allocate investor';
      });
  }
});

export const { clearError, setFilters, clearCurrentStructure, clearHierarchyTree } = fundStructureSlice.actions;
export default fundStructureSlice.reducer;