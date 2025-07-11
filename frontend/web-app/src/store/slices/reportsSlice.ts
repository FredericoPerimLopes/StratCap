import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import reportService from '../../services/reportService';
import { 
  Report, 
  ReportTemplate, 
  DashboardMetrics, 
  PerformanceMetrics,
  CreateReportRequest,
  ReportSchedule 
} from '../../types/report';

interface ReportsState {
  reports: Report[];
  templates: ReportTemplate[];
  schedules: ReportSchedule[];
  dashboardMetrics: DashboardMetrics | null;
  performanceMetrics: PerformanceMetrics[];
  selectedReport: Report | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  reports: [],
  templates: [],
  schedules: [],
  dashboardMetrics: null,
  performanceMetrics: [],
  selectedReport: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchDashboardMetrics = createAsyncThunk<DashboardMetrics, void, { rejectValue: string }>(
  'reports/fetchDashboardMetrics',
  async (_, { rejectWithValue }) => {
    try {
      return await reportService.getDashboardMetrics();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard metrics');
    }
  }
);

export const fetchPerformanceMetrics = createAsyncThunk<PerformanceMetrics[], string | undefined, { rejectValue: string }>(
  'reports/fetchPerformanceMetrics',
  async (fundId, { rejectWithValue }) => {
    try {
      return await reportService.getPerformanceMetrics(fundId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch performance metrics');
    }
  }
);

export const fetchReports = createAsyncThunk<Report[], void, { rejectValue: string }>(
  'reports/fetchReports',
  async (_, { rejectWithValue }) => {
    try {
      return await reportService.getReports();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reports');
    }
  }
);

export const fetchReport = createAsyncThunk<Report, string, { rejectValue: string }>(
  'reports/fetchReport',
  async (reportId, { rejectWithValue }) => {
    try {
      return await reportService.getReport(reportId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch report');
    }
  }
);

export const createReport = createAsyncThunk<Report, CreateReportRequest, { rejectValue: string }>(
  'reports/createReport',
  async (reportData, { rejectWithValue }) => {
    try {
      return await reportService.createReport(reportData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create report');
    }
  }
);

export const generateReport = createAsyncThunk<Report, string, { rejectValue: string }>(
  'reports/generateReport',
  async (reportId, { rejectWithValue }) => {
    try {
      return await reportService.generateReport(reportId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate report');
    }
  }
);

export const deleteReport = createAsyncThunk<string, string, { rejectValue: string }>(
  'reports/deleteReport',
  async (reportId, { rejectWithValue }) => {
    try {
      await reportService.deleteReport(reportId);
      return reportId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete report');
    }
  }
);

export const fetchReportTemplates = createAsyncThunk<ReportTemplate[], void, { rejectValue: string }>(
  'reports/fetchReportTemplates',
  async (_, { rejectWithValue }) => {
    try {
      return await reportService.getReportTemplates();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch report templates');
    }
  }
);

export const fetchReportSchedules = createAsyncThunk<ReportSchedule[], void, { rejectValue: string }>(
  'reports/fetchReportSchedules',
  async (_, { rejectWithValue }) => {
    try {
      return await reportService.getReportSchedules();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch report schedules');
    }
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedReport: (state, action: PayloadAction<Report | null>) => {
      state.selectedReport = action.payload;
    },
    clearSelectedReport: (state) => {
      state.selectedReport = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch dashboard metrics
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardMetrics = action.payload;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch dashboard metrics';
      });

    // Fetch performance metrics
    builder
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
        state.performanceMetrics = action.payload;
      })
      .addCase(fetchPerformanceMetrics.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch performance metrics';
      });

    // Fetch reports
    builder
      .addCase(fetchReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch reports';
      });

    // Fetch report
    builder
      .addCase(fetchReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedReport = action.payload;
      })
      .addCase(fetchReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch report';
      });

    // Create report
    builder
      .addCase(createReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports.push(action.payload);
      })
      .addCase(createReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create report';
      });

    // Generate report
    builder
      .addCase(generateReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.reports.findIndex(r => r.report_id === action.payload.report_id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
        if (state.selectedReport?.report_id === action.payload.report_id) {
          state.selectedReport = action.payload;
        }
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to generate report';
      });

    // Delete report
    builder
      .addCase(deleteReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = state.reports.filter(r => r.report_id !== action.payload);
        if (state.selectedReport?.report_id === action.payload) {
          state.selectedReport = null;
        }
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete report';
      });

    // Fetch report templates
    builder
      .addCase(fetchReportTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      })
      .addCase(fetchReportTemplates.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch report templates';
      });

    // Fetch report schedules
    builder
      .addCase(fetchReportSchedules.fulfilled, (state, action) => {
        state.schedules = action.payload;
      })
      .addCase(fetchReportSchedules.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch report schedules';
      });
  },
});

// Selectors
export const selectReports = (state: RootState) => state.reports.reports;
export const selectReportTemplates = (state: RootState) => state.reports.templates;
export const selectReportSchedules = (state: RootState) => state.reports.schedules;
export const selectDashboardMetrics = (state: RootState) => state.reports.dashboardMetrics;
export const selectPerformanceMetrics = (state: RootState) => state.reports.performanceMetrics;
export const selectSelectedReport = (state: RootState) => state.reports.selectedReport;
export const selectReportsLoading = (state: RootState) => state.reports.isLoading;
export const selectReportsError = (state: RootState) => state.reports.error;

export const { clearError, setSelectedReport, clearSelectedReport } = reportsSlice.actions;
export default reportsSlice.reducer;