import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Card,
  CardContent,
  TextField,
  Grid2 as Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Decimal } from 'decimal.js';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCapitalActivity, useWizardState } from '../../../hooks/capital-activity/useCapitalActivity';
import { CapitalCallCreationRequest, Investor, Fund } from '../../../types/capital-activity';
import { formatCurrency } from '../../../utils/financial/calculations';

interface CapitalCallCreationProps {
  fund: Fund;
  investors: Investor[];
  onComplete: (callId: string) => void;
  onCancel: () => void;
}

interface WizardData {
  basicInfo: {
    purpose: string;
    callDate: Date | null;
    dueDate: Date | null;
    totalAmount: string;
  };
  allocationMethod: 'proportional' | 'custom' | 'equalization';
  customAllocations: { investorId: string; amount: string }[];
  notes: string;
}

const steps = [
  {
    label: 'Basic Information',
    description: 'Set call purpose, dates, and total amount'
  },
  {
    label: 'Allocation Method',
    description: 'Choose how to allocate the capital call'
  },
  {
    label: 'Review & Confirm',
    description: 'Review all details before creating'
  }
];

const basicInfoSchema = yup.object().shape({
  purpose: yup.string().required('Purpose is required').min(5, 'Purpose must be at least 5 characters'),
  callDate: yup.date().required('Call date is required'),
  dueDate: yup.date().required('Due date is required')
    .min(yup.ref('callDate'), 'Due date must be after call date'),
  totalAmount: yup.string().required('Total amount is required')
    .test('is-positive', 'Amount must be positive', value => {
      try {
        return new Decimal(value || '0').gt(0);
      } catch {
        return false;
      }
    })
});

const CapitalCallCreation: React.FC<CapitalCallCreationProps> = ({
  fund,
  investors,
  onComplete,
  onCancel
}) => {
  const { createCapitalCall, calculateAllocation, loading } = useCapitalActivity();
  const [customAllocationDialog, setCustomAllocationDialog] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<{ investorId: string; amount: string } | null>(null);
  
  const initialData: WizardData = {
    basicInfo: {
      purpose: '',
      callDate: null,
      dueDate: null,
      totalAmount: ''
    },
    allocationMethod: 'proportional',
    customAllocations: [],
    notes: ''
  };

  const {
    currentStep,
    data,
    isValid,
    isSubmitting,
    setIsValid,
    setIsSubmitting,
    updateData,
    nextStep,
    prevStep,
    reset
  } = useWizardState(initialData);

  // Form for basic info step
  const { control, handleSubmit, formState: { errors, isValid: formValid }, trigger, watch } = useForm({
    resolver: yupResolver(basicInfoSchema),
    defaultValues: data.basicInfo,
    mode: 'onChange'
  });

  const watchedValues = watch();

  useEffect(() => {
    updateData({ basicInfo: watchedValues });
    setIsValid(formValid && currentStep === 0);
  }, [watchedValues, formValid, updateData, setIsValid, currentStep]);

  // Calculate preview allocations
  const [previewAllocations, setPreviewAllocations] = useState<any[]>([]);
  
  useEffect(() => {
    if (data.basicInfo.totalAmount && data.allocationMethod) {
      try {
        const totalAmount = new Decimal(data.basicInfo.totalAmount);
        
        if (data.allocationMethod === 'proportional') {
          const allocations = calculateAllocation(investors, totalAmount, 'proportional');
          setPreviewAllocations(allocations);
        } else if (data.allocationMethod === 'custom' && data.customAllocations.length > 0) {
          const allocations = data.customAllocations.map(custom => {
            const investor = investors.find(i => i.id === custom.investorId);
            return {
              investorId: custom.investorId,
              investorName: investor?.name || 'Unknown',
              amount: new Decimal(custom.amount),
              percentage: new Decimal(custom.amount).dividedBy(totalAmount).times(100)
            };
          });
          setPreviewAllocations(allocations);
        }
      } catch (error) {
        console.error('Error calculating allocations:', error);
        setPreviewAllocations([]);
      }
    }
  }, [data.basicInfo.totalAmount, data.allocationMethod, data.customAllocations, investors, calculateAllocation]);

  const handleNext = async () => {
    if (currentStep === 0) {
      const isValid = await trigger();
      if (isValid) {
        nextStep();
      }
    } else if (currentStep === 1) {
      // Validate allocation method
      if (data.allocationMethod === 'custom') {
        const totalCustom = data.customAllocations.reduce(
          (sum, alloc) => sum.plus(new Decimal(alloc.amount)),
          new Decimal(0)
        );
        const totalAmount = new Decimal(data.basicInfo.totalAmount);
        
        if (!totalCustom.eq(totalAmount)) {
          alert('Custom allocations must sum to the total amount');
          return;
        }
      }
      nextStep();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const request: CapitalCallCreationRequest = {
        fund_id: fund.id,
        purpose: data.basicInfo.purpose,
        call_date: data.basicInfo.callDate!.toISOString(),
        due_date: data.basicInfo.dueDate!.toISOString(),
        total_call_amount: new Decimal(data.basicInfo.totalAmount),
        allocation_method: data.allocationMethod,
        custom_allocations: data.allocationMethod === 'custom' 
          ? data.customAllocations.map(alloc => ({
              investor_id: alloc.investorId,
              amount: new Decimal(alloc.amount)
            })) 
          : undefined
      };

      const capitalCall = await createCapitalCall(request);
      onComplete(capitalCall.id);
    } catch (error) {
      console.error('Failed to create capital call:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCustomAllocation = (investorId: string, amount: string) => {
    const existing = data.customAllocations.findIndex(a => a.investorId === investorId);
    if (existing >= 0) {
      const updated = [...data.customAllocations];
      updated[existing] = { investorId, amount };
      updateData({ customAllocations: updated });
    } else {
      updateData({ 
        customAllocations: [...data.customAllocations, { investorId, amount }] 
      });
    }
    setCustomAllocationDialog(false);
    setEditingAllocation(null);
  };

  const removeCustomAllocation = (investorId: string) => {
    updateData({
      customAllocations: data.customAllocations.filter(a => a.investorId !== investorId)
    });
  };

  const renderBasicInfoStep = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Controller
            name="purpose"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Purpose of Capital Call"
                placeholder="e.g., Investment in ABC Company, Operating expenses, Bridge funding"
                multiline
                rows={3}
                error={!!errors.purpose}
                helperText={errors.purpose?.message}
              />
            )}
          />
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="callDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                label="Call Date"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.callDate,
                    helperText: errors.callDate?.message
                  }
                }}
              />
            )}
          />
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                label="Due Date"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.dueDate,
                    helperText: errors.dueDate?.message
                  }
                }}
              />
            )}
          />
        </Grid>
        
        <Grid size={12}>
          <Controller
            name="totalAmount"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Total Call Amount"
                placeholder="0.00"
                InputProps={{
                  startAdornment: '$'
                }}
                error={!!errors.totalAmount}
                helperText={errors.totalAmount?.message}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderAllocationMethodStep = () => (
    <Box>
      <FormControl component="fieldset">
        <FormLabel component="legend">Allocation Method</FormLabel>
        <RadioGroup
          value={data.allocationMethod}
          onChange={(e) => updateData({ allocationMethod: e.target.value as any })}
        >
          <FormControlLabel 
            value="proportional" 
            control={<Radio />} 
            label="Proportional (based on commitments)" 
          />
          <FormControlLabel 
            value="custom" 
            control={<Radio />} 
            label="Custom allocations" 
          />
          <FormControlLabel 
            value="equalization" 
            control={<Radio />} 
            label="Equalization (for new investors)" 
          />
        </RadioGroup>
      </FormControl>

      {data.allocationMethod === 'custom' && (
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Custom Allocations</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setCustomAllocationDialog(true)}
            >
              Add Allocation
            </Button>
          </Box>
          
          {data.customAllocations.length > 0 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Investor</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.customAllocations.map((allocation) => {
                    const investor = investors.find(i => i.id === allocation.investorId);
                    return (
                      <TableRow key={allocation.investorId}>
                        <TableCell>{investor?.name}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(new Decimal(allocation.amount))}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setEditingAllocation(allocation);
                              setCustomAllocationDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => removeCustomAllocation(allocation.investorId)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {previewAllocations.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Allocation Preview
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Investor</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewAllocations.map((allocation) => {
                  const investor = investors.find(i => i.id === allocation.investorId);
                  return (
                    <TableRow key={allocation.investorId}>
                      <TableCell>{investor?.name || allocation.investorName}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(allocation.amount)}
                      </TableCell>
                      <TableCell align="right">
                        {allocation.percentage.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );

  const renderReviewStep = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Capital Call Details</Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">Fund</Typography>
                  <Typography variant="body1">{fund.name}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(new Decimal(data.basicInfo.totalAmount))}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">Call Date</Typography>
                  <Typography variant="body1">
                    {data.basicInfo.callDate?.toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">Due Date</Typography>
                  <Typography variant="body1">
                    {data.basicInfo.dueDate?.toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant="body2" color="textSecondary">Purpose</Typography>
                  <Typography variant="body1">{data.basicInfo.purpose}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {previewAllocations.length > 0 && (
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Investor Allocations ({data.allocationMethod})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Investor</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewAllocations.map((allocation) => {
                        const investor = investors.find(i => i.id === allocation.investorId);
                        return (
                          <TableRow key={allocation.investorId}>
                            <TableCell>{investor?.name || allocation.investorName}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(allocation.amount)}
                            </TableCell>
                            <TableCell align="right">
                              {allocation.percentage.toFixed(2)}%
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
        )}
      </Grid>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create Capital Call
      </Typography>
      
      <Stepper activeStep={currentStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="textSecondary" paragraph>
                {step.description}
              </Typography>
              
              {index === 0 && renderBasicInfoStep()}
              {index === 1 && renderAllocationMethodStep()}
              {index === 2 && renderReviewStep()}
              
              <Box sx={{ mt: 3, mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                  disabled={(!isValid && index === 0) || isSubmitting}
                  startIcon={index === steps.length - 1 && isSubmitting ? <CircularProgress size={20} /> : undefined}
                >
                  {index === steps.length - 1 ? 'Create Capital Call' : 'Next'}
                </Button>
                <Button
                  disabled={index === 0 || isSubmitting}
                  onClick={prevStep}
                  sx={{ ml: 1 }}
                >
                  Back
                </Button>
                <Button
                  onClick={onCancel}
                  sx={{ ml: 1 }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Custom Allocation Dialog */}
      <CustomAllocationDialog
        open={customAllocationDialog}
        onClose={() => {
          setCustomAllocationDialog(false);
          setEditingAllocation(null);
        }}
        investors={investors}
        onSave={addCustomAllocation}
        existingAllocations={data.customAllocations}
        editingAllocation={editingAllocation}
      />
    </Box>
  );
};

// Custom Allocation Dialog Component
interface CustomAllocationDialogProps {
  open: boolean;
  onClose: () => void;
  investors: Investor[];
  onSave: (investorId: string, amount: string) => void;
  existingAllocations: { investorId: string; amount: string }[];
  editingAllocation: { investorId: string; amount: string } | null;
}

const CustomAllocationDialog: React.FC<CustomAllocationDialogProps> = ({
  open,
  onClose,
  investors,
  onSave,
  existingAllocations,
  editingAllocation
}) => {
  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (editingAllocation) {
      setSelectedInvestor(editingAllocation.investorId);
      setAmount(editingAllocation.amount);
    } else {
      setSelectedInvestor('');
      setAmount('');
    }
  }, [editingAllocation, open]);

  const availableInvestors = investors.filter(investor => 
    !existingAllocations.some(alloc => alloc.investorId === investor.id) ||
    investor.id === editingAllocation?.investorId
  );

  const handleSave = () => {
    if (selectedInvestor && amount) {
      onSave(selectedInvestor, amount);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingAllocation ? 'Edit Allocation' : 'Add Custom Allocation'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={12}>
            <TextField
              select
              fullWidth
              label="Investor"
              value={selectedInvestor}
              onChange={(e) => setSelectedInvestor(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="">Select Investor</option>
              {availableInvestors.map((investor) => (
                <option key={investor.id} value={investor.id}>
                  {investor.name}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: '$'
              }}
              placeholder="0.00"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!selectedInvestor || !amount}
        >
          {editingAllocation ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CapitalCallCreation;
