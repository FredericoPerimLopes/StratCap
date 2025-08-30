import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Progress,
  LinearProgress,
  Grid2 as Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Decimal } from 'decimal.js';
import { format } from 'date-fns';
import { CapitalCall, CapitalCallAllocation as AllocationData } from '../../../types/capital-activity';
import { formatCurrency, formatPercentage } from '../../../utils/financial/calculations';

interface CapitalCallAllocationProps {
  capitalCall: CapitalCall;
  onUpdate: (allocations: AllocationData[]) => void;
  readOnly?: boolean;
}

interface EditingAllocation {
  id: string;
  callAmount: string;
  notes: string;
}

interface PaymentDialogData {
  allocation: AllocationData;
  paidAmount: string;
  paidDate: string;
  notes: string;
}

const CapitalCallAllocation: React.FC<CapitalCallAllocationProps> = ({
  capitalCall,
  onUpdate,
  readOnly = false
}) => {
  const [allocations, setAllocations] = useState<AllocationData[]>(capitalCall.allocations || []);
  const [editingAllocation, setEditingAllocation] = useState<EditingAllocation | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogData | null>(null);
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);

  useEffect(() => {
    setAllocations(capitalCall.allocations || []);
  }, [capitalCall]);

  const totalAllocated = allocations.reduce(
    (sum, allocation) => sum.plus(allocation.call_amount),
    new Decimal(0)
  );

  const totalPaid = allocations.reduce(
    (sum, allocation) => sum.plus(allocation.paid_amount || new Decimal(0)),
    new Decimal(0)
  );

  const collectionRate = totalAllocated.gt(0) 
    ? totalPaid.dividedBy(totalAllocated).times(100)
    : new Decimal(0);

  const handleEditAllocation = (allocation: AllocationData) => {
    setEditingAllocation({
      id: allocation.id,
      callAmount: allocation.call_amount.toString(),
      notes: allocation.notes || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingAllocation) return;

    const updatedAllocations = allocations.map(allocation => {
      if (allocation.id === editingAllocation.id) {
        return {
          ...allocation,
          call_amount: new Decimal(editingAllocation.callAmount),
          notes: editingAllocation.notes
        };
      }
      return allocation;
    });

    setAllocations(updatedAllocations);
    onUpdate(updatedAllocations);
    setEditingAllocation(null);
  };

  const handleCancelEdit = () => {
    setEditingAllocation(null);
  };

  const handlePaymentUpdate = (allocation: AllocationData) => {
    setPaymentDialog({
      allocation,
      paidAmount: allocation.paid_amount?.toString() || '',
      paidDate: allocation.paid_date || new Date().toISOString().split('T')[0],
      notes: allocation.notes || ''
    });
  };

  const handleSavePayment = () => {
    if (!paymentDialog) return;

    const paidAmount = new Decimal(paymentDialog.paidAmount || 0);
    const callAmount = paymentDialog.allocation.call_amount;
    
    let paymentStatus: AllocationData['payment_status'] = 'pending';
    if (paidAmount.gte(callAmount)) {
      paymentStatus = 'paid';
    } else if (paidAmount.gt(0)) {
      paymentStatus = 'partially_paid';
    }

    const updatedAllocations = allocations.map(allocation => {
      if (allocation.id === paymentDialog.allocation.id) {
        return {
          ...allocation,
          paid_amount: paidAmount,
          paid_date: paymentDialog.paidDate,
          payment_status: paymentStatus,
          notes: paymentDialog.notes
        };
      }
      return allocation;
    });

    setAllocations(updatedAllocations);
    onUpdate(updatedAllocations);
    setPaymentDialog(null);
  };

  const getStatusColor = (status: AllocationData['payment_status']) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partially_paid': return 'warning';
      case 'defaulted': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: AllocationData['payment_status']) => {
    switch (status) {
      case 'defaulted': return <WarningIcon fontSize="small" />;
      default: return null;
    }
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {formatCurrency(capitalCall.total_call_amount)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Call Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {formatCurrency(totalAllocated)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Allocated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {formatCurrency(totalPaid)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {formatPercentage(collectionRate)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Collection Rate
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(collectionRate.toNumber(), 100)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Validation Alerts */}
      {totalAllocated.neq(capitalCall.total_call_amount) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Total allocations ({formatCurrency(totalAllocated)}) do not match 
          capital call amount ({formatCurrency(capitalCall.total_call_amount)})
        </Alert>
      )}

      {/* Actions */}
      {!readOnly && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Investor Allocations</Typography>
          <Box>
            <Button
              variant={bulkUpdateMode ? 'contained' : 'outlined'}
              onClick={() => setBulkUpdateMode(!bulkUpdateMode)}
              sx={{ mr: 1 }}
            >
              {bulkUpdateMode ? 'Exit Bulk Mode' : 'Bulk Update'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Allocations Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Investor</TableCell>
              <TableCell align="right">Call Amount</TableCell>
              <TableCell align="right">Percentage</TableCell>
              <TableCell align="right">Paid Amount</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Payment Date</TableCell>
              {!readOnly && <TableCell align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {allocations.map((allocation) => {
              const isEditing = editingAllocation?.id === allocation.id;
              const percentage = totalAllocated.gt(0) 
                ? allocation.call_amount.dividedBy(totalAllocated).times(100)
                : new Decimal(0);

              return (
                <TableRow key={allocation.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {allocation.investor_id}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editingAllocation.callAmount}
                        onChange={(e) => setEditingAllocation({
                          ...editingAllocation,
                          callAmount: e.target.value
                        })}
                        InputProps={{ startAdornment: '$' }}
                        sx={{ width: 120 }}
                      />
                    ) : (
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(allocation.call_amount)}
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatPercentage(percentage)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      color={allocation.paid_amount?.gt(0) ? 'success.main' : 'textSecondary'}
                    >
                      {allocation.paid_amount 
                        ? formatCurrency(allocation.paid_amount) 
                        : '-'
                      }
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={allocation.payment_status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(allocation.payment_status)}
                      size="small"
                      variant="outlined"
                      icon={getStatusIcon(allocation.payment_status)}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {allocation.paid_date 
                        ? format(new Date(allocation.paid_date), 'MMM dd, yyyy')
                        : '-'
                      }
                    </Typography>
                  </TableCell>
                  
                  {!readOnly && (
                    <TableCell align="center">
                      {isEditing ? (
                        <Box>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={handleSaveEdit}
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={handleCancelEdit}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleEditAllocation(allocation)}
                            disabled={capitalCall.status === 'completed'}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handlePaymentUpdate(allocation)}
                            disabled={capitalCall.status !== 'issued'}
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payment Update Dialog */}
      <Dialog
        open={!!paymentDialog}
        onClose={() => setPaymentDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Payment</DialogTitle>
        {paymentDialog && (
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={12}>
                <Typography variant="body2" color="textSecondary">
                  Investor: {paymentDialog.allocation.investor_id}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Call Amount: {formatCurrency(paymentDialog.allocation.call_amount)}
                </Typography>
              </Grid>
              
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Paid Amount"
                  value={paymentDialog.paidAmount}
                  onChange={(e) => setPaymentDialog({
                    ...paymentDialog,
                    paidAmount: e.target.value
                  })}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              
              <Grid size={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Payment Date"
                  value={paymentDialog.paidDate}
                  onChange={(e) => setPaymentDialog({
                    ...paymentDialog,
                    paidDate: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={paymentDialog.notes}
                  onChange={(e) => setPaymentDialog({
                    ...paymentDialog,
                    notes: e.target.value
                  })}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setPaymentDialog(null)}>Cancel</Button>
          <Button 
            onClick={handleSavePayment} 
            variant="contained"
            disabled={!paymentDialog?.paidAmount}
          >
            Update Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CapitalCallAllocation;
