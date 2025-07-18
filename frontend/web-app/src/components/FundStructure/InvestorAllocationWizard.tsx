import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Warning,
  Person,
  AttachMoney,
  LocationOn,
  AccountBalance
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { allocateInvestor } from '../../store/slices/fundStructureSlice';
import { AllocationRequest, AllocationResult } from '../../types/fundStructure';

interface InvestorAllocationWizardProps {
  open: boolean;
  onClose: () => void;
  investorId?: string;
  fundId?: string;
}

const steps = ['Investor Details', 'Investment Preferences', 'Fund Selection', 'Review & Submit'];

const InvestorAllocationWizard: React.FC<InvestorAllocationWizardProps> = ({
  open,
  onClose,
  investorId: initialInvestorId,
  fundId: initialFundId
}) => {
  const dispatch = useAppDispatch();
  const { structures, allocationResults, loading, error } = useAppSelector(state => state.fundStructure);
  
  const [activeStep, setActiveStep] = useState(0);
  const [allocationRequest, setAllocationRequest] = useState<Partial<AllocationRequest>>({
    investor_id: initialInvestorId || '',
    fund_id: initialFundId || '',
    requested_amount: 0,
    investor_type: '',
    jurisdiction: '',
    preference_order: [],
    accepts_side_letter: true,
    tax_transparent_required: false
  });
  const [allocationResult, setAllocationResult] = useState<AllocationResult | null>(null);

  const investorTypes = [
    'us_taxable',
    'us_tax_exempt',
    'non_us',
    'qualified_purchaser',
    'accredited_investor',
    'institutional',
    'erisa_plan'
  ];

  const jurisdictions = [
    'USA', 'GBR', 'DEU', 'FRA', 'JPN', 'CHE', 'SGP', 'HKG', 'CAN', 'AUS'
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setAllocationResult(null);
  };

  const handleSubmit = async () => {
    if (isRequestValid()) {
      try {
        const result = await dispatch(allocateInvestor(allocationRequest as AllocationRequest)).unwrap();
        setAllocationResult(result);
        setActiveStep(steps.length);
      } catch (error) {
        console.error('Allocation failed:', error);
      }
    }
  };

  const isRequestValid = () => {
    return allocationRequest.investor_id &&
           allocationRequest.requested_amount &&
           allocationRequest.investor_type &&
           allocationRequest.jurisdiction;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full':
        return 'success';
      case 'partial':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Investor Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Investor ID"
                  value={allocationRequest.investor_id}
                  onChange={(e) => setAllocationRequest({
                    ...allocationRequest,
                    investor_id: e.target.value
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Investor Type</InputLabel>
                  <Select
                    value={allocationRequest.investor_type}
                    onChange={(e) => setAllocationRequest({
                      ...allocationRequest,
                      investor_type: e.target.value
                    })}
                  >
                    {investorTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Jurisdiction</InputLabel>
                  <Select
                    value={allocationRequest.jurisdiction}
                    onChange={(e) => setAllocationRequest({
                      ...allocationRequest,
                      jurisdiction: e.target.value
                    })}
                  >
                    {jurisdictions.map((jurisdiction) => (
                      <MenuItem key={jurisdiction} value={jurisdiction}>
                        {jurisdiction}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Requested Investment Amount"
                  type="number"
                  value={allocationRequest.requested_amount}
                  onChange={(e) => setAllocationRequest({
                    ...allocationRequest,
                    requested_amount: Number(e.target.value)
                  })}
                  InputProps={{
                    startAdornment: '$'
                  }}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Investment Preferences
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allocationRequest.accepts_side_letter}
                      onChange={(e) => setAllocationRequest({
                        ...allocationRequest,
                        accepts_side_letter: e.target.checked
                      })}
                    />
                  }
                  label="Accepts Side Letter Arrangements"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allocationRequest.tax_transparent_required}
                      onChange={(e) => setAllocationRequest({
                        ...allocationRequest,
                        tax_transparent_required: e.target.checked
                      })}
                    />
                  }
                  label="Requires Tax Transparent Structure"
                />
              </Grid>
              {allocationRequest.investor_type === 'erisa_plan' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ERISA Percentage"
                    type="number"
                    value={allocationRequest.erisa_percentage || ''}
                    onChange={(e) => setAllocationRequest({
                      ...allocationRequest,
                      erisa_percentage: Number(e.target.value)
                    })}
                    InputProps={{
                      endAdornment: '%'
                    }}
                    helperText="Percentage of ERISA assets this investment represents"
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Fund Selection & Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select your preferred fund allocation order. The system will attempt to allocate
              based on your preferences and eligibility.
            </Typography>
            
            <Grid container spacing={2}>
              {structures.map((structure) => (
                <Grid item xs={12} md={6} key={structure.fund_id}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      border: allocationRequest.preference_order?.includes(structure.fund_id) 
                        ? '2px solid' 
                        : '1px solid',
                      borderColor: allocationRequest.preference_order?.includes(structure.fund_id)
                        ? 'primary.main'
                        : 'divider'
                    }}
                    onClick={() => {
                      const currentOrder = allocationRequest.preference_order || [];
                      const isSelected = currentOrder.includes(structure.fund_id);
                      let newOrder;
                      
                      if (isSelected) {
                        newOrder = currentOrder.filter(id => id !== structure.fund_id);
                      } else {
                        newOrder = [...currentOrder, structure.fund_id];
                      }
                      
                      setAllocationRequest({
                        ...allocationRequest,
                        preference_order: newOrder
                      });
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="subtitle1">
                          {structure.fund_name}
                        </Typography>
                        <Chip
                          label={structure.structure_type}
                          size="small"
                          color="primary"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Min: {formatCurrency(structure.min_commitment)} | 
                        Target: {formatCurrency(structure.target_size)}
                      </Typography>
                      <Typography variant="body2">
                        Available: {formatCurrency(structure.target_size - structure.committed_capital)}
                      </Typography>
                      {allocationRequest.preference_order?.includes(structure.fund_id) && (
                        <Chip
                          label={`Priority ${allocationRequest.preference_order.indexOf(structure.fund_id) + 1}`}
                          color="primary"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Allocation Request
            </Typography>
            
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Investor Details
                    </Typography>
                    <Typography variant="body2">ID: {allocationRequest.investor_id}</Typography>
                    <Typography variant="body2">Type: {allocationRequest.investor_type}</Typography>
                    <Typography variant="body2">Jurisdiction: {allocationRequest.jurisdiction}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Investment Amount
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(allocationRequest.requested_amount || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Fund Preferences
                    </Typography>
                    {allocationRequest.preference_order?.map((fundId, index) => {
                      const fund = structures.find(s => s.fund_id === fundId);
                      return (
                        <Chip
                          key={fundId}
                          label={`${index + 1}. ${fund?.fund_name || fundId}`}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      );
                    })}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Special Requirements
                    </Typography>
                    <Typography variant="body2">
                      Side Letter: {allocationRequest.accepts_side_letter ? 'Accepted' : 'Not Accepted'}
                    </Typography>
                    <Typography variant="body2">
                      Tax Transparent: {allocationRequest.tax_transparent_required ? 'Required' : 'Not Required'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Investor Allocation Wizard
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length ? (
          // Results page
          <Box>
            <Typography variant="h6" gutterBottom>
              Allocation Results
            </Typography>
            
            {allocationResult && (
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Chip
                      label={allocationResult.allocation_status.toUpperCase()}
                      color={getStatusColor(allocationResult.allocation_status) as any}
                      icon={
                        allocationResult.allocation_status === 'full' ? <CheckCircle /> :
                        allocationResult.allocation_status === 'partial' ? <Warning /> :
                        <Cancel />
                      }
                    />
                    <Typography variant="h6" sx={{ ml: 2 }}>
                      {formatCurrency(allocationResult.total_allocated)} allocated
                    </Typography>
                  </Box>

                  {allocationResult.allocations.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle1" gutterBottom>
                        Fund Allocations
                      </Typography>
                      <List>
                        {allocationResult.allocations.map((allocation, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <AccountBalance />
                            </ListItemIcon>
                            <ListItemText
                              primary={allocation.fund_name}
                              secondary={
                                <Box>
                                  <Typography variant="body2">
                                    Amount: {formatCurrency(allocation.allocated_amount)}
                                  </Typography>
                                  <Typography variant="body2">
                                    Percentage: {allocation.percentage.toFixed(1)}%
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {allocationResult.rejection_reasons.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle1" gutterBottom>
                        Rejection Reasons
                      </Typography>
                      {allocationResult.rejection_reasons.map((reason, index) => (
                        <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                          {reason}
                        </Alert>
                      ))}
                    </Box>
                  )}

                  {allocationResult.alternative_funds.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Alternative Suggestions
                      </Typography>
                      {allocationResult.alternative_funds.map((alternative, index) => (
                        <Alert key={index} severity="info" sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{alternative.fund_name}:</strong> {alternative.suggestion}
                          </Typography>
                        </Alert>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        ) : (
          renderStepContent(activeStep)
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        {activeStep === steps.length ? (
          <>
            <Button onClick={handleReset}>Start Over</Button>
            <Button onClick={onClose}>Close</Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!isRequestValid() || loading}
              >
                {loading ? 'Processing...' : 'Submit Allocation'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InvestorAllocationWizard;