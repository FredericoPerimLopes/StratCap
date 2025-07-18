import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Tabs,
  Tab,
  IconButton
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Person,
  AttachMoney,
  Refresh,
  Download
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  processEvent, 
  fetchEventCalculations,
  updateEventStatus
} from '../../store/slices/fundEventsSlice';
import { FundEvent, InvestorEventCalculation } from '../../types/fundEvents';

interface EventProcessingDialogProps {
  open: boolean;
  onClose: () => void;
  event: FundEvent | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`processing-tabpanel-${index}`}
      aria-labelledby={`processing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const EventProcessingDialog: React.FC<EventProcessingDialogProps> = ({
  open,
  onClose,
  event
}) => {
  const dispatch = useAppDispatch();
  const { calculations, processingResults, loading, error } = useAppSelector(state => state.fundEvents);
  
  const [tabValue, setTabValue] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [validationResults, setValidationResults] = useState<any[]>([]);

  useEffect(() => {
    if (event && open) {
      dispatch(fetchEventCalculations({ eventId: event.event_id }));
    }
  }, [event, open, dispatch]);

  const handleStartProcessing = async () => {
    if (!event) return;

    setProcessingStatus('processing');
    try {
      const result = await dispatch(processEvent({ 
        eventId: event.event_id,
        options: { validate: true, calculate: true }
      })).unwrap();
      
      setProcessingStatus('completed');
      setValidationResults(result.validation_results || []);
      
      // Update event status
      dispatch(updateEventStatus({ 
        eventId: event.event_id, 
        status: 'pending_approval' 
      }));
    } catch (error) {
      setProcessingStatus('failed');
      console.error('Processing failed:', error);
    }
  };

  const handleRefreshCalculations = () => {
    if (event) {
      dispatch(fetchEventCalculations({ eventId: event.event_id }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getValidationSeverity = (level: string) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'success';
    }
  };

  const renderEventSummary = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Event Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Event Type
            </Typography>
            <Typography variant="body1">
              {event?.event_type.replace('_', ' ').toUpperCase()}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Event Date
            </Typography>
            <Typography variant="body1">
              {event?.event_date ? new Date(event.event_date).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Total Amount
            </Typography>
            <Typography variant="h6">
              {event?.total_amount ? formatCurrency(event.total_amount) : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={event?.status.replace('_', ' ').toUpperCase()}
              color={event?.status === 'completed' ? 'success' : 
                     event?.status === 'processing' ? 'info' : 'default'}
              size="small"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderValidationResults = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Validation Results
        </Typography>
        {validationResults.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No validation results available. Process the event to see validation details.
          </Typography>
        ) : (
          validationResults.map((result, index) => (
            <Alert
              key={index}
              severity={getValidationSeverity(result.level)}
              sx={{ mb: 1 }}
            >
              <Typography variant="body2">
                <strong>{result.check}:</strong> {result.message}
              </Typography>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  );

  const renderCalculations = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Investor Calculations
          </Typography>
          <IconButton onClick={handleRefreshCalculations} size="small">
            <Refresh />
          </IconButton>
        </Box>
        
        {calculations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No calculations available. Process the event to generate investor calculations.
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Investor ID</TableCell>
                  <TableCell align="right">Ownership %</TableCell>
                  <TableCell align="right">Gross Amount</TableCell>
                  <TableCell align="right">Net Amount</TableCell>
                  <TableCell align="right">Withholding</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {calculations.map((calc) => (
                  <TableRow key={calc.investor_id}>
                    <TableCell>{calc.investor_id}</TableCell>
                    <TableCell align="right">
                      {formatPercentage(calc.ownership_percentage)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(calc.gross_amount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(calc.net_amount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(calc.withholding_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={calc.calculation_status}
                        size="small"
                        color={calc.calculation_status === 'completed' ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderProcessingStatus = () => {
    if (processingStatus === 'idle') return null;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            {processingStatus === 'processing' && (
              <>
                <Box sx={{ mr: 2 }}>
                  <LinearProgress />
                </Box>
                <Typography variant="body2">
                  Processing event...
                </Typography>
              </>
            )}
            {processingStatus === 'completed' && (
              <>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  Event processed successfully
                </Typography>
              </>
            )}
            {processingStatus === 'failed' && (
              <>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="body2" color="error.main">
                  Processing failed
                </Typography>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (!event) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Process Event - {event.event_name}
      </DialogTitle>
      <DialogContent>
        {renderProcessingStatus()}
        
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Summary" />
          <Tab label="Calculations" />
          <Tab label="Validation" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderEventSummary()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderCalculations()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderValidationResults()}
        </TabPanel>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        {event.status === 'draft' && (
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleStartProcessing}
            disabled={loading || processingStatus === 'processing'}
          >
            {processingStatus === 'processing' ? 'Processing...' : 'Start Processing'}
          </Button>
        )}
        {calculations.length > 0 && (
          <Button
            startIcon={<Download />}
            onClick={() => {/* Handle export */}}
          >
            Export Results
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EventProcessingDialog;