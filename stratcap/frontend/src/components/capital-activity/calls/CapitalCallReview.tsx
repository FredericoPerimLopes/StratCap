import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid2 as Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Send as SendIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  AttachFile as AttachFileIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Decimal } from 'decimal.js';
import { CapitalCall, AuditTrail } from '../../../types/capital-activity';
import { formatCurrency, formatPercentage } from '../../../utils/financial/calculations';

interface CapitalCallReviewProps {
  capitalCall: CapitalCall;
  auditTrail?: AuditTrail[];
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
  onIssue: () => void;
  onEdit: () => void;
  canApprove?: boolean;
  canEdit?: boolean;
  canIssue?: boolean;
}

interface ApprovalDialogState {
  type: 'approve' | 'reject' | null;
  notes: string;
  reason: string;
}

const CapitalCallReview: React.FC<CapitalCallReviewProps> = ({
  capitalCall,
  auditTrail = [],
  onApprove,
  onReject,
  onIssue,
  onEdit,
  canApprove = false,
  canEdit = false,
  canIssue = false
}) => {
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogState>({
    type: null,
    notes: '',
    reason: ''
  });
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const totalAllocated = capitalCall.allocations?.reduce(
    (sum, allocation) => sum.plus(allocation.call_amount),
    new Decimal(0)
  ) || new Decimal(0);

  const allocationVariance = totalAllocated.minus(capitalCall.total_call_amount);
  const hasAllocationIssues = !allocationVariance.eq(0);

  const getStatusColor = (status: CapitalCall['status']) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending_approval': return 'warning';
      case 'approved': return 'success';
      case 'issued': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const handleApprovalAction = (type: 'approve' | 'reject') => {
    setApprovalDialog({ type, notes: '', reason: '' });
  };

  const handleConfirmApproval = () => {
    if (approvalDialog.type === 'approve') {
      onApprove(approvalDialog.notes || undefined);
    } else if (approvalDialog.type === 'reject') {
      onReject(approvalDialog.reason);
    }
    setApprovalDialog({ type: null, notes: '', reason: '' });
  };

  const getNextActions = () => {
    const actions = [];
    
    switch (capitalCall.status) {
      case 'draft':
        if (canEdit) {
          actions.push({
            label: 'Edit Call',
            icon: <EditIcon />,
            color: 'primary' as const,
            onClick: onEdit
          });
        }
        actions.push({
          label: 'Submit for Approval',
          icon: <SendIcon />,
          color: 'secondary' as const,
          onClick: () => {/* Handle submit for approval */}
        });
        break;
        
      case 'pending_approval':
        if (canApprove) {
          actions.push(
            {
              label: 'Approve',
              icon: <ApproveIcon />,
              color: 'success' as const,
              onClick: () => handleApprovalAction('approve')
            },
            {
              label: 'Reject',
              icon: <RejectIcon />,
              color: 'error' as const,
              onClick: () => handleApprovalAction('reject')
            }
          );
        }
        break;
        
      case 'approved':
        if (canIssue) {
          actions.push({
            label: 'Issue Call',
            icon: <SendIcon />,
            color: 'primary' as const,
            onClick: onIssue,
            disabled: hasAllocationIssues
          });
        }
        break;
    }
    
    return actions;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Capital Call #{capitalCall.call_number}
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={capitalCall.status.replace('_', ' ').toUpperCase()}
              color={getStatusColor(capitalCall.status)}
              variant="filled"
            />
            <Typography variant="body2" color="textSecondary">
              Created {format(new Date(capitalCall.created_at), 'MMM dd, yyyy')}
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" gap={1}>
          {getNextActions().map((action, index) => (
            <Button
              key={index}
              variant={index === 0 ? 'contained' : 'outlined'}
              color={action.color}
              startIcon={action.icon}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Validation Issues */}
      {hasAllocationIssues && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Allocation variance detected: {formatCurrency(allocationVariance.abs())} 
          {allocationVariance.gt(0) ? 'over-allocated' : 'under-allocated'}
        </Alert>
      )}

      {/* Call Details */}
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Call Details
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">Purpose</Typography>
                  <Typography variant="body1" paragraph>
                    {capitalCall.purpose}
                  </Typography>
                </Grid>
                
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                  <Typography variant="h5" color="primary">
                    {formatCurrency(capitalCall.total_call_amount)}
                  </Typography>
                </Grid>
                
                <Grid size={4}>
                  <Typography variant="body2" color="textSecondary">Call Date</Typography>
                  <Typography variant="body1">
                    {format(new Date(capitalCall.call_date), 'MMMM dd, yyyy')}
                  </Typography>
                </Grid>
                
                <Grid size={4}>
                  <Typography variant="body2" color="textSecondary">Due Date</Typography>
                  <Typography variant="body1">
                    {format(new Date(capitalCall.due_date), 'MMMM dd, yyyy')}
                  </Typography>
                </Grid>
                
                <Grid size={4}>
                  <Typography variant="body2" color="textSecondary">Days to Due</Typography>
                  <Typography variant="body1">
                    {Math.ceil(
                      (new Date(capitalCall.due_date).getTime() - new Date().getTime()) / 
                      (1000 * 60 * 60 * 24)
                    )} days
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Stats */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">Investors</Typography>
                <Typography variant="h6">
                  {capitalCall.allocations?.length || 0}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">Total Allocated</Typography>
                <Typography variant="h6" color={hasAllocationIssues ? 'error' : 'textPrimary'}>
                  {formatCurrency(totalAllocated)}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">Variance</Typography>
                <Typography 
                  variant="body1" 
                  color={hasAllocationIssues ? 'error' : 'success.main'}
                >
                  {hasAllocationIssues 
                    ? formatCurrency(allocationVariance) 
                    : 'Balanced'
                  }
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setShowAuditTrail(true)}
              >
                View History
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Allocations Table */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Investor Allocations
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Investor</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                      <TableCell align="right">Unfunded Commitment</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {capitalCall.allocations?.map((allocation) => {
                      const percentage = capitalCall.total_call_amount.gt(0)
                        ? allocation.call_amount.dividedBy(capitalCall.total_call_amount).times(100)
                        : new Decimal(0);
                      
                      return (
                        <TableRow key={allocation.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {allocation.investor_id}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatCurrency(allocation.call_amount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatPercentage(percentage)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="textSecondary">
                              {/* This would come from investor data */}
                              {formatCurrency(new Decimal(0))}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {allocation.notes || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approval Dialog */}
      <Dialog
        open={!!approvalDialog.type}
        onClose={() => setApprovalDialog({ type: null, notes: '', reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {approvalDialog.type === 'approve' ? 'Approve Capital Call' : 'Reject Capital Call'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" paragraph>
              Capital Call #{capitalCall.call_number} - {formatCurrency(capitalCall.total_call_amount)}
            </Typography>
            
            <TextField
              fullWidth
              label={approvalDialog.type === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
              value={approvalDialog.type === 'approve' ? approvalDialog.notes : approvalDialog.reason}
              onChange={(e) => setApprovalDialog({
                ...approvalDialog,
                [approvalDialog.type === 'approve' ? 'notes' : 'reason']: e.target.value
              })}
              multiline
              rows={4}
              required={approvalDialog.type === 'reject'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApprovalDialog({ type: null, notes: '', reason: '' })}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmApproval}
            variant="contained"
            color={approvalDialog.type === 'approve' ? 'success' : 'error'}
            disabled={approvalDialog.type === 'reject' && !approvalDialog.reason.trim()}
          >
            {approvalDialog.type === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog
        open={showAuditTrail}
        onClose={() => setShowAuditTrail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Trail</DialogTitle>
        <DialogContent>
          <List>
            {auditTrail.map((entry) => (
              <ListItem key={entry.id}>
                <ListItemIcon>
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText
                  primary={`${entry.action.toUpperCase()} by ${entry.performed_by}`}
                  secondary={`${format(new Date(entry.performed_at), 'MMM dd, yyyy HH:mm')}`}
                />
              </ListItem>
            ))}
            {auditTrail.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No audit trail available"
                  secondary="This capital call has no recorded changes"
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuditTrail(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CapitalCallReview;
