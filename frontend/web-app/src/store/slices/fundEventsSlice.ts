import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fundEventsService } from '../../services/fundEventsService';
import { 
  FundEvent, 
  CapitalCallEvent, 
  DistributionEvent, 
  ManagementFeeEvent,
  EventProcessingResult,
  InvestorEventCalculation 
} from '../../types/fundEvents';

interface FundEventsState {
  events: FundEvent[];
  currentEvent: FundEvent | null;
  processingResults: EventProcessingResult[];
  calculations: InvestorEventCalculation[];
  investorSummary: any | null;
  loading: boolean;
  error: string | null;
  filters: {
    fund_id?: string;
    event_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  };
}

const initialState: FundEventsState = {
  events: [],
  currentEvent: null,
  processingResults: [],
  calculations: [],
  investorSummary: null,
  loading: false,
  error: null,
  filters: {}
};

// Async thunks
export const createCapitalCall = createAsyncThunk(
  'fundEvents/createCapitalCall',
  async (data: any) => {
    return await fundEventsService.createCapitalCall(data);
  }
);

export const createDistribution = createAsyncThunk(
  'fundEvents/createDistribution',
  async (data: any) => {
    return await fundEventsService.createDistribution(data);
  }
);

export const createManagementFee = createAsyncThunk(
  'fundEvents/createManagementFee',
  async (data: any) => {
    return await fundEventsService.createManagementFee(data);
  }
);

export const fetchFundEvents = createAsyncThunk(
  'fundEvents/fetchEvents',
  async ({ fundId, filters }: { fundId: string; filters?: any }) => {
    return await fundEventsService.getFundEvents(fundId, filters);
  }
);

export const processEvent = createAsyncThunk(
  'fundEvents/processEvent',
  async ({ eventId, options }: { eventId: string; options?: any }) => {
    return await fundEventsService.processEvent(eventId, options);
  }
);

export const approveEvent = createAsyncThunk(
  'fundEvents/approveEvent',
  async ({ eventId, notes }: { eventId: string; notes?: string }) => {
    return await fundEventsService.approveEvent(eventId, notes);
  }
);

export const cancelEvent = createAsyncThunk(
  'fundEvents/cancelEvent',
  async ({ eventId, reason }: { eventId: string; reason: string }) => {
    return await fundEventsService.cancelEvent(eventId, reason);
  }
);

export const reverseEvent = createAsyncThunk(
  'fundEvents/reverseEvent',
  async ({ eventId, reason }: { eventId: string; reason: string }) => {
    return await fundEventsService.reverseEvent(eventId, reason);
  }
);

export const fetchEventCalculations = createAsyncThunk(
  'fundEvents/fetchCalculations',
  async ({ eventId, investorId }: { eventId: string; investorId?: string }) => {
    return await fundEventsService.getEventCalculations(eventId, investorId);
  }
);

export const fetchInvestorEventSummary = createAsyncThunk(
  'fundEvents/fetchInvestorSummary',
  async ({ investorId, filters }: { investorId: string; filters?: any }) => {
    return await fundEventsService.getInvestorEventSummary(investorId, filters);
  }
);

export const fetchEventHistory = createAsyncThunk(
  'fundEvents/fetchHistory',
  async (eventId: string) => {
    return await fundEventsService.getEventHistory(eventId);
  }
);

const fundEventsSlice = createSlice({
  name: 'fundEvents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<any>) => {
      state.filters = action.payload;
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    clearProcessingResults: (state) => {
      state.processingResults = [];
    },
    clearCalculations: (state) => {
      state.calculations = [];
    },
    updateEventStatus: (state, action: PayloadAction<{ eventId: string; status: string }>) => {
      const event = state.events.find(e => e.event_id === action.payload.eventId);
      if (event) {
        event.status = action.payload.status as any;
      }
      if (state.currentEvent?.event_id === action.payload.eventId) {
        state.currentEvent.status = action.payload.status as any;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Create capital call
      .addCase(createCapitalCall.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCapitalCall.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push(action.payload);
        state.currentEvent = action.payload;
      })
      .addCase(createCapitalCall.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create capital call';
      })
      
      // Create distribution
      .addCase(createDistribution.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDistribution.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push(action.payload);
        state.currentEvent = action.payload;
      })
      .addCase(createDistribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create distribution';
      })
      
      // Create management fee
      .addCase(createManagementFee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createManagementFee.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push(action.payload);
        state.currentEvent = action.payload;
      })
      .addCase(createManagementFee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create management fee';
      })
      
      // Fetch events
      .addCase(fetchFundEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFundEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
      })
      .addCase(fetchFundEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch events';
      })
      
      // Process event
      .addCase(processEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.processingResults.push(action.payload);
      })
      .addCase(processEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to process event';
      })
      
      // Approve event
      .addCase(approveEvent.fulfilled, (state, action) => {
        // Update event status in the list
        const event = state.events.find(e => e.event_id === action.meta.arg.eventId);
        if (event) {
          event.status = 'approved';
        }
      })
      
      // Cancel event
      .addCase(cancelEvent.fulfilled, (state, action) => {
        const event = state.events.find(e => e.event_id === action.meta.arg.eventId);
        if (event) {
          event.status = 'cancelled';
        }
      })
      
      // Fetch calculations
      .addCase(fetchEventCalculations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventCalculations.fulfilled, (state, action) => {
        state.loading = false;
        state.calculations = action.payload.calculations;
      })
      .addCase(fetchEventCalculations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch calculations';
      })
      
      // Fetch investor summary
      .addCase(fetchInvestorEventSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvestorEventSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.investorSummary = action.payload;
      })
      .addCase(fetchInvestorEventSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch investor summary';
      });
  }
});

export const {
  clearError,
  setFilters,
  clearCurrentEvent,
  clearProcessingResults,
  clearCalculations,
  updateEventStatus
} = fundEventsSlice.actions;

export default fundEventsSlice.reducer;