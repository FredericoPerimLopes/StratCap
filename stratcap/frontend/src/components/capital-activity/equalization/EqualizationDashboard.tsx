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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Calculate as CalculateIcon,
  Balance as BalanceIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Decimal } from 'decimal.js';
import { format } from 'date-fns';
import { useCapitalActivity } from '../../../hooks/capital-activity/useCapitalActivity';
import { Equalization, EqualizationAdjustment, Fund, Investor } from '../../../types/capital-activity';
import { formatCurrency } from '../../../utils/financial/calculations';

interface EqualizationDashboardProps {
  selectedFund?: Fund;
  investors: Investor[];
  onCreateEqualization: () => void;
  onEditEqualization: (equalization: Equalization) => void;
  onViewEqualization: (equalization: Equalization) => void;
}

interface EqualizationMetrics {
  totalEqualizationsYTD: number;
  totalAdjustmentAmount: Decimal;
  pendingAdjustments: number;
  averageAdjustmentSize: Decimal;
  investorsRequiringEqualization: number;
}

interface NewInvestorEqualizationDialog {
  open: boolean;
  investor?: Investor;
  calculation?: {
    navAdjustment: Decimal;
    capitalCallAdjustment: Decimal;
    totalAdjustment: Decimal;
  };
}

const EqualizationDashboard: React.FC<EqualizationDashboardProps> = ({
  selectedFund,
  investors,
  onCreateEqualization,
  onEditEqualization,
  onViewEqualization
}) => {
  const { equalizations, loading, error, createEqualization } = useCapitalActivity();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [metrics, setMetrics] = useState<EqualizationMetrics>({
    totalEqualizationsYTD: 0,
    totalAdjustmentAmount: new Decimal(0),
    pendingAdjustments: 0,
    averageAdjustmentSize: new Decimal(0),
    investorsRequiringEqualization: 0
  });
  const [newInvestorDialog, setNewInvestorDialog] = useState<NewInvestorEqualizationDialog>({
    open: false
  });

  useEffect(() => {
    if (equalizations.length > 0) {
      const currentYear = new Date().getFullYear();
      const ytdEqualizations = equalizations.filter(
        eq => new Date(eq.equalization_date).getFullYear() === currentYear
      );
      
      const totalAmount = equalizations.reduce(
        (sum, eq) => sum.plus(eq.total_adjustment),
        new Decimal(0)
      );
      
      const pendingCount = equalizations.filter(
        eq => eq.status === 'draft' || eq.status === 'pending_approval'
      ).length;
      
      // Calculate investors needing equalization (simplified logic)
      const investorsNeedingEq = investors.filter(investor => {
        // This would typically involve more complex logic
        // comparing investor contributions vs. fund average performance
        return investor.paid_capital.gt(0) && 
               investor.distributions.dividedBy(investor.paid_capital.plus(1)).lt(0.1);
      }).length;
      
      setMetrics({
        totalEqualizationsYTD: ytdEqualizations.length,
        totalAdjustmentAmount: totalAmount,
        pendingAdjustments: pendingCount,
        averageAdjustmentSize: equalizations.length > 0 
          ? totalAmount.dividedBy(equalizations.length) 
          : new Decimal(0),
        investorsRequiringEqualization: investorsNeedingEq
      });
    }
  }, [equalizations, investors]);

  const getStatusColor = (status: Equalization['status']) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending_approval': return 'warning';
      case 'approved': return 'info';
      case 'applied': return 'success';
      default: return 'default';
    }
  };

  const getAdjustmentTypeColor = (type: EqualizationAdjustment['adjustment_type']) => {
    switch (type) {
      case 'capital_call': return 'primary';
      case 'distribution': return 'success';
      case 'nav_adjustment': return 'info';
      default: return 'default';
    }
  };

  const calculateNewInvestorEqualization = (investor: Investor) => {
    // Simplified equalization calculation for demonstration
    // In practice, this would be much more sophisticated
    const fundAverageNAV = new Decimal(1.15); // Example average NAV multiple
    const investorNAV = investor.paid_capital.gt(0) 
      ? investor.paid_capital.minus(investor.distributions).dividedBy(investor.paid_capital)
      : new Decimal(1);
    
    const navAdjustment = investor.commitment.times(
      fundAverageNAV.minus(investorNAV)
    );
    
    const capitalCallAdjustment = navAdjustment.gt(0) ? navAdjustment.times(0.1) : new Decimal(0);
    const totalAdjustment = navAdjustment.plus(capitalCallAdjustment);
    
    setNewInvestorDialog({
      open: true,
      investor,
      calculation: {
        navAdjustment,
        capitalCallAdjustment,
        totalAdjustment
      }
    });
  };

  const handleCreateEqualizationForInvestor = async () => {
    if (!newInvestorDialog.investor || !newInvestorDialog.calculation || !selectedFund) {
      return;
    }

    const equalization: Partial<Equalization> = {
      fund_id: selectedFund.id,
      equalization_date: new Date().toISOString(),
      reason: `New investor equalization for ${newInvestorDialog.investor.name}`,
      total_adjustment: newInvestorDialog.calculation.totalAdjustment,
      status: 'draft',
      adjustments: [
        {
          id: `adj-${Date.now()}-1`,
          equalization_id: '',
          investor_id: newInvestorDialog.investor.id,
          adjustment_type: 'nav_adjustment',
          adjustment_amount: newInvestorDialog.calculation.navAdjustment,
          effective_date: new Date().toISOString(),
          reason: 'NAV equalization for new investor entry'
        },
        ...(newInvestorDialog.calculation.capitalCallAdjustment.gt(0) ? [{
          id: `adj-${Date.now()}-2`,
          equalization_id: '',
          investor_id: newInvestorDialog.investor.id,
          adjustment_type: 'capital_call' as const,
          adjustment_amount: newInvestorDialog.calculation.capitalCallAdjustment,
          effective_date: new Date().toISOString(),
          reason: 'Capital call adjustment for equalization'
        }] : [])
      ]
    };

    try {
      await createEqualization(equalization);
      setNewInvestorDialog({ open: false });
    } catch (error) {
      console.error('Failed to create equalization:', error);
    }
  };

  const filteredEqualizations = equalizations.filter(equalization => {
    if (statusFilter !== 'all' && equalization.status !== statusFilter) return false;
    
    if (typeFilter !== 'all') {
      const hasType = equalization.adjustments.some(
        adj => adj.adjustment_type === typeFilter
      );
      if (!hasType) return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <Box>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Loading equalizations...
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
          Equalization & Adjustments
          {selectedFund && (
            <Typography variant="subtitle1" color="textSecondary">
              {selectedFund.name}
            </Typography>
          )}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateEqualization}
          disabled={!selectedFund}
        >
          Create Equalization
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BalanceIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {formatCurrency(metrics.totalAdjustmentAmount)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Adjustments
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
                <TrendingUpIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {metrics.totalEqualizationsYTD}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    YTD Equalizations
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
                <WarningIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {metrics.pendingAdjustments}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Adjustments
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
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {metrics.investorsRequiringEqualization}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Need Equalization
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* New Investor Equalization Section */}
      {metrics.investorsRequiringEqualization > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {metrics.investorsRequiringEqualization} investor(s) may require equalization adjustments.
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
            {investors
              .filter(investor => 
                investor.paid_capital.gt(0) && 
                investor.distributions.dividedBy(investor.paid_capital.plus(1)).lt(0.1)
              )
              .slice(0, 3)
              .map(investor => (
                <Button
                  key={investor.id}
                  size="small"
                  variant="outlined"
                  startIcon={<CalculateIcon />}
                  onClick={() => calculateNewInvestorEqualization(investor)}
                >
                  Calculate for {investor.name}
                </Button>
              ))
            }
          </Box>
        </Alert>
      )}

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
              <MenuItem value="applied">Applied</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Adjustment Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="capital_call">Capital Call</MenuItem>
              <MenuItem value="distribution">Distribution</MenuItem>
              <MenuItem value="nav_adjustment">NAV Adjustment</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Equalizations Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell align="right">Total Adjustment</TableCell>
              <TableCell>Investors Affected</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEqualizations.map((equalization) => {
              const investorsAffected = equalization.adjustments.length;
              
              return (
                <TableRow key={equalization.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(equalization.equalization_date), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {equalization.reason}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(equalization.total_adjustment)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${investorsAffected} investor${investorsAffected !== 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={equalization.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(equalization.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewEqualization(equalization)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {['draft', 'pending_approval'].includes(equalization.status) && (
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => onEditEqualization(equalization)}
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

      {filteredEqualizations.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No equalizations found
          </Typography>
          {selectedFund ? (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {equalizations.length === 0 
                ? 'Create your first equalization adjustment to get started'
                : 'Try adjusting your filters'
              }
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Please select a fund to view equalizations
            </Typography>
          )}
        </Box>
      )}

      {/* New Investor Equalization Dialog */}
      <Dialog
        open={newInvestorDialog.open}
        onClose={() => setNewInvestorDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Investor Equalization</DialogTitle>
        <DialogContent>
          {newInvestorDialog.investor && newInvestorDialog.calculation && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {newInvestorDialog.investor.name}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">Commitment</Typography>
                  <Typography variant="body1">
                    {formatCurrency(newInvestorDialog.investor.commitment)}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">Paid Capital</Typography>
                  <Typography variant="body1">
                    {formatCurrency(newInvestorDialog.investor.paid_capital)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
                Proposed Adjustments
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">NAV Adjustment</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(newInvestorDialog.calculation.navAdjustment)}
                </Typography>
              </Box>
              
              {newInvestorDialog.calculation.capitalCallAdjustment.gt(0) && (
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">Capital Call Adjustment</Typography>
                  <Typography variant="h6" color="secondary">
                    {formatCurrency(newInvestorDialog.calculation.capitalCallAdjustment)}
                  </Typography>
                </Box>
              )}
              
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">Total Adjustment</Typography>
                <Typography variant="h5" color="success.main">
                  {formatCurrency(newInvestorDialog.calculation.totalAdjustment)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewInvestorDialog({ open: false })}>Cancel</Button>
          <Button 
            onClick={handleCreateEqualizationForInvestor}
            variant="contained"
            disabled={!newInvestorDialog.calculation?.totalAdjustment.gt(0)}
          >
            Create Equalization
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EqualizationDashboard;
