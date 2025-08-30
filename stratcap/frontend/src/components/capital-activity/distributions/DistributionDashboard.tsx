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
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { Decimal } from 'decimal.js';
import { format } from 'date-fns';
import { useCapitalActivity } from '../../../hooks/capital-activity/useCapitalActivity';
import { Distribution, Fund } from '../../../types/capital-activity';
import { formatCurrency, formatPercentage } from '../../../utils/financial/calculations';

interface DistributionDashboardProps {
  selectedFund?: Fund;
  onCreateDistribution: () => void;
  onEditDistribution: (distribution: Distribution) => void;
  onViewDistribution: (distribution: Distribution) => void;
  onCalculateWaterfall: (distribution: Distribution) => void;
}

interface DistributionMetrics {
  totalDistributions: number;
  totalDistributionAmount: Decimal;
  ytdDistributions: Decimal;
  returnOfCapital: Decimal;
  capitalGains: Decimal;
  income: Decimal;
  averageDistributionSize: Decimal;
  dpi: Decimal; // Distributions to Paid-In ratio
}

const DistributionDashboard: React.FC<DistributionDashboardProps> = ({
  selectedFund,
  onCreateDistribution,
  onEditDistribution,
  onViewDistribution,
  onCalculateWaterfall
}) => {
  const { distributions, loading, error, fetchDistributions } = useCapitalActivity();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [metrics, setMetrics] = useState<DistributionMetrics>({
    totalDistributions: 0,
    totalDistributionAmount: new Decimal(0),
    ytdDistributions: new Decimal(0),
    returnOfCapital: new Decimal(0),
    capitalGains: new Decimal(0),
    income: new Decimal(0),
    averageDistributionSize: new Decimal(0),
    dpi: new Decimal(0)
  });

  useEffect(() => {
    if (selectedFund) {
      fetchDistributions(selectedFund.id);
    }
  }, [selectedFund, fetchDistributions]);

  useEffect(() => {
    if (distributions.length > 0) {
      const currentYear = new Date().getFullYear();
      
      const totalAmount = distributions.reduce(
        (sum, dist) => sum.plus(dist.total_distribution),
        new Decimal(0)
      );
      
      const ytdAmount = distributions
        .filter(dist => new Date(dist.distribution_date).getFullYear() === currentYear)
        .reduce((sum, dist) => sum.plus(dist.total_distribution), new Decimal(0));
      
      // Calculate distribution type breakdowns
      const returnOfCapital = distributions
        .filter(d => d.distribution_type === 'return_of_capital')
        .reduce((sum, d) => sum.plus(d.total_distribution), new Decimal(0));
      
      const capitalGains = distributions
        .filter(d => d.distribution_type === 'capital_gain')
        .reduce((sum, d) => sum.plus(d.total_distribution), new Decimal(0));
      
      const income = distributions
        .filter(d => d.distribution_type === 'income')
        .reduce((sum, d) => sum.plus(d.total_distribution), new Decimal(0));
      
      // Calculate DPI (would need total contributions from fund data)
      const dpi = selectedFund && selectedFund.commitment.gt(0)
        ? totalAmount.dividedBy(selectedFund.commitment)
        : new Decimal(0);
      
      setMetrics({
        totalDistributions: distributions.length,
        totalDistributionAmount: totalAmount,
        ytdDistributions: ytdAmount,
        returnOfCapital,
        capitalGains,
        income,
        averageDistributionSize: distributions.length > 0 
          ? totalAmount.dividedBy(distributions.length) 
          : new Decimal(0),
        dpi
      });
    }
  }, [distributions, selectedFund]);

  const getStatusColor = (status: Distribution['status']) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending_approval': return 'warning';
      case 'approved': return 'info';
      case 'distributed': return 'success';
      default: return 'default';
    }
  };

  const getTypeColor = (type: Distribution['distribution_type']) => {
    switch (type) {
      case 'return_of_capital': return 'primary';
      case 'capital_gain': return 'success';
      case 'income': return 'info';
      case 'mixed': return 'secondary';
      default: return 'default';
    }
  };

  const filteredDistributions = distributions.filter(distribution => {
    if (statusFilter !== 'all' && distribution.status !== statusFilter) return false;
    if (typeFilter !== 'all' && distribution.distribution_type !== typeFilter) return false;
    
    if (dateFilter !== 'all') {
      const distDate = new Date(distribution.distribution_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - distDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'last_30':
          return daysDiff <= 30;
        case 'last_90':
          return daysDiff <= 90;
        case 'ytd':
          return distDate.getFullYear() === now.getFullYear();
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
          Loading distributions...
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
          Distributions
          {selectedFund && (
            <Typography variant="subtitle1" color="textSecondary">
              {selectedFund.name}
            </Typography>
          )}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateDistribution}
          disabled={!selectedFund}
        >
          Create Distribution
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
                    {formatCurrency(metrics.totalDistributionAmount)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Distributed ({metrics.totalDistributions})
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
                    {formatCurrency(metrics.ytdDistributions)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    YTD Distributions
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
                <PieChartIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {formatPercentage(metrics.dpi.times(100))}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    DPI Ratio
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
                <AssessmentIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {formatCurrency(metrics.averageDistributionSize)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average Size
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Distribution Breakdown */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Return of Capital</Typography>
              <Typography variant="h5" color="primary">
                {formatCurrency(metrics.returnOfCapital)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {metrics.totalDistributionAmount.gt(0) 
                  ? formatPercentage(metrics.returnOfCapital.dividedBy(metrics.totalDistributionAmount).times(100))
                  : '0%'
                } of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Capital Gains</Typography>
              <Typography variant="h5" color="success.main">
                {formatCurrency(metrics.capitalGains)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {metrics.totalDistributionAmount.gt(0) 
                  ? formatPercentage(metrics.capitalGains.dividedBy(metrics.totalDistributionAmount).times(100))
                  : '0%'
                } of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Income</Typography>
              <Typography variant="h5" color="info.main">
                {formatCurrency(metrics.income)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {metrics.totalDistributionAmount.gt(0) 
                  ? formatPercentage(metrics.income.dividedBy(metrics.totalDistributionAmount).times(100))
                  : '0%'
                } of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 3 }}>
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
              <MenuItem value="distributed">Distributed</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              select
              fullWidth
              label="Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="return_of_capital">Return of Capital</MenuItem>
              <MenuItem value="capital_gain">Capital Gain</MenuItem>
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="mixed">Mixed</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
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
              <MenuItem value="ytd">Year to Date</MenuItem>
              <MenuItem value="last_year">Last Year</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Distributions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Distribution #</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Distribution Date</TableCell>
              <TableCell>Ex-Date</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Waterfall</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDistributions.map((distribution) => {
              const hasWaterfall = distribution.waterfall_results && distribution.waterfall_results.length > 0;
              
              return (
                <TableRow key={distribution.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      Dist #{distribution.distribution_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={distribution.distribution_type.replace('_', ' ').toUpperCase()}
                      color={getTypeColor(distribution.distribution_type)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(distribution.distribution_date), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(distribution.ex_date), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(distribution.total_distribution)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={distribution.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(distribution.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {hasWaterfall ? (
                      <Chip label="Calculated" color="success" size="small" />
                    ) : (
                      <Tooltip title="Calculate Waterfall">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onCalculateWaterfall(distribution)}
                        >
                          <CalculateIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewDistribution(distribution)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {['draft', 'pending_approval'].includes(distribution.status) && (
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => onEditDistribution(distribution)}
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

      {filteredDistributions.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No distributions found
          </Typography>
          {selectedFund ? (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {distributions.length === 0 
                ? 'Create your first distribution to get started'
                : 'Try adjusting your filters'
              }
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Please select a fund to view distributions
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DistributionDashboard;
