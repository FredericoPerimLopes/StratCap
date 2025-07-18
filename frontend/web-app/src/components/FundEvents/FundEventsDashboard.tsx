import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add,
  MoreVert,
  PlayArrow,
  CheckCircle,
  Cancel,
  Edit,
  Visibility,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Schedule,
  Assessment
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchFundEvents, 
  processEvent, 
  approveEvent, 
  cancelEvent 
} from '../../store/slices/fundEventsSlice';
import { FundEvent, EventType, EventStatus } from '../../types/fundEvents';
import CreateEventDialog from './CreateEventDialog';
import EventProcessingDialog from './EventProcessingDialog';

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
      id={`events-tabpanel-${index}`}
      aria-labelledby={`events-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FundEventsDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { events, loading, error } = useAppSelector(state => state.fundEvents);
  const { structures } = useAppSelector(state => state.fundStructure);
  
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [processingDialogOpen, setProcessingDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FundEvent | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | 'all'>('all');

  useEffect(() => {
    if (selectedFundId) {
      dispatch(fetchFundEvents({ fundId: selectedFundId }));
    }
  }, [dispatch, selectedFundId]);

  useEffect(() => {
    if (structures.length > 0 && !selectedFundId) {
      setSelectedFundId(structures[0].fund_id);
    }
  }, [structures, selectedFundId]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, fundEvent: FundEvent) => {
    setMenuAnchor(event.currentTarget);
    setSelectedEvent(fundEvent);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedEvent(null);
  };

  const handleProcessEvent = (event: FundEvent) => {
    setSelectedEvent(event);
    setProcessingDialogOpen(true);
    handleMenuClose();
  };

  const handleApproveEvent = async (event: FundEvent) => {
    try {
      await dispatch(approveEvent({ eventId: event.event_id })).unwrap();
      // Refresh events
      if (selectedFundId) {
        dispatch(fetchFundEvents({ fundId: selectedFundId }));
      }
    } catch (error) {
      console.error('Failed to approve event:', error);
    }
    handleMenuClose();
  };

  const handleCancelEvent = async (event: FundEvent, reason: string) => {
    try {
      await dispatch(cancelEvent({ eventId: event.event_id, reason })).unwrap();
      // Refresh events
      if (selectedFundId) {
        dispatch(fetchFundEvents({ fundId: selectedFundId }));
      }
    } catch (error) {
      console.error('Failed to cancel event:', error);
    }
    handleMenuClose();
  };

  const getEventTypeIcon = (type: EventType) => {
    switch (type) {
      case 'capital_call':
        return <TrendingDown color="error" />;
      case 'distribution':
        return <TrendingUp color="success" />;
      case 'management_fee':
        return <AccountBalance color="primary" />;
      default:
        return <Assessment color="action" />;
    }
  };

  const getEventStatusColor = (status: EventStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'approved':
        return 'primary';
      case 'pending_approval':
        return 'warning';
      case 'processing':
        return 'info';
      case 'cancelled':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredEvents = eventTypeFilter === 'all' 
    ? events 
    : events.filter(event => event.event_type === eventTypeFilter);

  const eventSummary = {
    total: events.length,
    pending: events.filter(e => e.status === 'pending_approval').length,
    processing: events.filter(e => e.status === 'processing').length,
    completed: events.filter(e => e.status === 'completed').length,
    totalAmount: events.reduce((sum, e) => sum + e.total_amount, 0)
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Fund Events Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          disabled={!selectedFundId}
        >
          Create Event
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Events
              </Typography>
              <Typography variant="h4">
                {eventSummary.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Approval
              </Typography>
              <Typography variant="h4" color="warning.main">
                {eventSummary.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Processing
              </Typography>
              <Typography variant="h4" color="info.main">
                {eventSummary.processing}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h5">
                {formatCurrency(eventSummary.totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Events Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Fund Events
            </Typography>
            <Box display="flex" gap={1}>
              <Chip
                label="All"
                color={eventTypeFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setEventTypeFilter('all')}
                clickable
              />
              <Chip
                label="Capital Calls"
                color={eventTypeFilter === 'capital_call' ? 'primary' : 'default'}
                onClick={() => setEventTypeFilter('capital_call')}
                clickable
              />
              <Chip
                label="Distributions"
                color={eventTypeFilter === 'distribution' ? 'primary' : 'default'}
                onClick={() => setEventTypeFilter('distribution')}
                clickable
              />
              <Chip
                label="Management Fees"
                color={eventTypeFilter === 'management_fee' ? 'primary' : 'default'}
                onClick={() => setEventTypeFilter('management_fee')}
                clickable
              />
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Event Name</TableCell>
                  <TableCell>Event Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.event_id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getEventTypeIcon(event.event_type)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {event.event_type.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {event.event_name}
                      </Typography>
                      {event.description && (
                        <Typography variant="caption" color="text.secondary">
                          {event.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(event.event_date)}</TableCell>
                    <TableCell>{formatCurrency(event.total_amount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={event.status.replace('_', ' ').toUpperCase()}
                        color={getEventStatusColor(event.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{event.created_by}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, event)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedEvent?.status === 'draft' && (
          <MenuItem onClick={() => selectedEvent && handleProcessEvent(selectedEvent)}>
            <PlayArrow sx={{ mr: 1 }} />
            Process Event
          </MenuItem>
        )}
        {selectedEvent?.status === 'pending_approval' && (
          <MenuItem onClick={() => selectedEvent && handleApproveEvent(selectedEvent)}>
            <CheckCircle sx={{ mr: 1 }} />
            Approve
          </MenuItem>
        )}
        <MenuItem onClick={() => {/* Handle view details */}}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {/* Handle edit */}}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {selectedEvent?.status !== 'completed' && selectedEvent?.status !== 'cancelled' && (
          <MenuItem 
            onClick={() => selectedEvent && handleCancelEvent(selectedEvent, 'Manual cancellation')}
            sx={{ color: 'error.main' }}
          >
            <Cancel sx={{ mr: 1 }} />
            Cancel
          </MenuItem>
        )}
      </Menu>

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        fundId={selectedFundId}
      />

      {/* Event Processing Dialog */}
      <EventProcessingDialog
        open={processingDialogOpen}
        onClose={() => setProcessingDialogOpen(false)}
        event={selectedEvent}
      />
    </Box>
  );
};

export default FundEventsDashboard;