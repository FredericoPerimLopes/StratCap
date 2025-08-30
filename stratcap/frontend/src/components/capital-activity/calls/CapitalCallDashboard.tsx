import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid2 as Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  TextField,
  MenuItem,
  LinearProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { Decimal } from 'decimal.js';
import { format } from 'date-fns';
import { useCapitalActivity } from '../../../hooks/capital-activity/useCapitalActivity';
import { CapitalCall, Fund } from '../../../types/capital-activity';
import { formatCurrency, formatPercentage } from '../../../utils/financial/calculations';

interface CapitalCallDashboardProps {
  selectedFund?: Fund;
  onCreateCall: () => void;
  onEditCall: (call: CapitalCall) => void;
  onViewCall: (call: CapitalCall) => void;
}

interface DashboardMetrics {
  totalCalls: number;
  totalCallAmount: Decimal;
  pendingCalls: number;
  collectionRate: Decimal;
  averageCallSize: Decimal;
}

const CapitalCallDashboard: React.FC<CapitalCallDashboardProps> = ({
  selectedFund,
  onCreateCall,
  onEditCall,
  onViewCall
}) => {
  const { capitalCalls, loading, error, fetchCapitalCalls } = useCapitalActivity();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCalls: 0,
    totalCallAmount: new Decimal(0),
    pendingCalls: 0,
    collectionRate: new Decimal(0),
    averageCallSize: new Decimal(0)
  });

  useEffect(() => {
    if (selectedFund) {
      fetchCapitalCalls(selectedFund.id);
    }
  }, [selectedFund, fetchCapitalCalls]);

  useEffect(() => {
    // Calculate metrics
    if (capitalCalls.length > 0) {
      const totalCallAmount = capitalCalls.reduce(
        (sum, call) => sum.plus(call.total_call_amount),
        new Decimal(0)
      );
      
      const pendingCalls = capitalCalls.filter(
        call => call.status === 'pending_approval' || call.status === 'issued'
      ).length;
      
      // Calculate collection rate (paid vs called)
      const totalPaid = capitalCalls
        .flatMap(call => call.allocations)
        .reduce((sum, allocation) => {
          return sum.plus(allocation.paid_amount || new Decimal(0));
        }, new Decimal(0));
      
      const collectionRate = totalCallAmount.gt(0) 
        ? totalPaid.dividedBy(totalCallAmount).times(100)
        : new Decimal(0);
      
      setMetrics({
        totalCalls: capitalCalls.length,
        totalCallAmount,
        pendingCalls,
        collectionRate,
        averageCallSize: capitalCalls.length > 0 
          ? totalCallAmount.dividedBy(capitalCalls.length) 
          : new Decimal(0)
      });
    }
  }, [capitalCalls]);

  const getStatusColor = (status: CapitalCall['status']) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending_approval': return 'warning';
      case 'approved': return 'info';
      case 'issued': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const filteredCalls = capitalCalls.filter(call => {
    if (statusFilter !== 'all' && call.status !== statusFilter) return false;
    
    if (dateFilter !== 'all') {
      const callDate = new Date(call.call_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - callDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'last_30':
          return daysDiff <= 30;
        case 'last_90':
          return daysDiff <= 90;
        case 'last_year':
          return daysDiff <= 365;
        default:
          return true;
      }
    }
    
    return true;
  });

  if (loading) {
    return (
      <Box>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Loading capital calls...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Capital Calls
          {selectedFund && (
            <Typography variant="subtitle1" color="textSecondary">
              {selectedFund.name}
            </Typography>
          )}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateCall}
          disabled={!selectedFund}
        >
          Create Capital Call
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalanceIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {formatCurrency(metrics.totalCallAmount)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Called ({metrics.totalCalls} calls)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ScheduleIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {metrics.pendingCalls}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Calls
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {formatPercentage(metrics.collectionRate)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Collection Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {formatCurrency(metrics.averageCallSize)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average Call Size
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending_approval">Pending Approval</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="issued">Issued</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Date Range"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="last_30">Last 30 Days</MenuItem>
              <MenuItem value="last_90">Last 90 Days</MenuItem>
              <MenuItem value="last_year">Last Year</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Capital Calls Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Call #</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Call Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCalls.map((call) => {
              const isOverdue = new Date(call.due_date) < new Date() && 
                ['issued', 'approved'].includes(call.status);
              
              return (
                <TableRow key={call.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      Call #{call.call_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {call.purpose}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(call.call_date), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={isOverdue ? 'error' : 'textPrimary'}
                    >
                      {format(new Date(call.due_date), 'MMM dd, yyyy')}
                      {isOverdue && (
                        <Chip 
                          label="Overdue" 
                          size="small" 
                          color="error" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(call.total_call_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={call.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(call.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewCall(call)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {['draft', 'pending_approval'].includes(call.status) && (
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => onEditCall(call)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredCalls.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No capital calls found
          </Typography>
          {selectedFund ? (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {capitalCalls.length === 0 
                ? 'Create your first capital call to get started'
                : 'Try adjusting your filters'
              }
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Please select a fund to view capital calls
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CapitalCallDashboard;
