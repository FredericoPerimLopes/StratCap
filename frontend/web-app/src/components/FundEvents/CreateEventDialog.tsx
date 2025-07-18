import React, { useState } from 'react';
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
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Alert,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  createCapitalCall, 
  createDistribution, 
  createManagementFee 
} from '../../store/slices/fundEventsSlice';
import { EventType } from '../../types/fundEvents';

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  fundId: string;
}

const steps = ['Event Type', 'Basic Information', 'Event Details', 'Review & Create'];

const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  open,
  onClose,
  fundId
}) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.fundEvents);
  
  const [activeStep, setActiveStep] = useState(0);
  const [eventType, setEventType] = useState<EventType>('capital_call');
  const [formData, setFormData] = useState<any>({
    fund_id: fundId,
    event_date: new Date(),
    effective_date: new Date(),
    record_date: new Date(),
    total_amount: 0
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      fund_id: fundId,
      event_date: new Date(),
      effective_date: new Date(),
      record_date: new Date(),
      total_amount: 0
    });
  };

  const handleSubmit = async () => {
    try {
      switch (eventType) {
        case 'capital_call':
          await dispatch(createCapitalCall(formData)).unwrap();
          break;
        case 'distribution':
          await dispatch(createDistribution(formData)).unwrap();
          break;
        case 'management_fee':
          await dispatch(createManagementFee(formData)).unwrap();
          break;
      }
      onClose();
      handleReset();
    } catch (error) {
      console.error('Failed to create event:', error);
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

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Event Type
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card
                  variant={eventType === 'capital_call' ? 'outlined' : 'elevation'}
                  sx={{
                    cursor: 'pointer',
                    border: eventType === 'capital_call' ? '2px solid' : '1px solid',
                    borderColor: eventType === 'capital_call' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setEventType('capital_call')}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Capital Call
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Request capital from investors for investments or expenses
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card
                  variant={eventType === 'distribution' ? 'outlined' : 'elevation'}
                  sx={{
                    cursor: 'pointer',
                    border: eventType === 'distribution' ? '2px solid' : '1px solid',
                    borderColor: eventType === 'distribution' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setEventType('distribution')}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Distribution
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Distribute proceeds from exits or income to investors
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card
                  variant={eventType === 'management_fee' ? 'outlined' : 'elevation'}
                  sx={{
                    cursor: 'pointer',
                    border: eventType === 'management_fee' ? '2px solid' : '1px solid',
                    borderColor: eventType === 'management_fee' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setEventType('management_fee')}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Management Fee
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Calculate and process periodic management fees
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Event Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Event Name"
                    value={formData.event_name || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      event_name: e.target.value
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      description: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Event Date"
                    value={formData.event_date}
                    onChange={(date) => setFormData({
                      ...formData,
                      event_date: date
                    })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Effective Date"
                    value={formData.effective_date}
                    onChange={(date) => setFormData({
                      ...formData,
                      effective_date: date
                    })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Record Date"
                    value={formData.record_date}
                    onChange={(date) => setFormData({
                      ...formData,
                      record_date: date
                    })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              </Grid>
            </Box>
          </LocalizationProvider>
        );

      case 2:
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {eventType === 'capital_call' && 'Capital Call Details'}
                {eventType === 'distribution' && 'Distribution Details'}
                {eventType === 'management_fee' && 'Management Fee Details'}
              </Typography>
              
              {eventType === 'capital_call' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Call Number"
                      type="number"
                      value={formData.call_number || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        call_number: parseInt(e.target.value)
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Due Date"
                      value={formData.due_date || new Date()}
                      onChange={(date) => setFormData({
                        ...formData,
                        due_date: date
                      })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Call Purpose"
                      value={formData.call_purpose || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        call_purpose: e.target.value
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Investment Amount"
                      type="number"
                      value={formData.investment_amount || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        investment_amount: parseFloat(e.target.value)
                      })}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Management Fee Amount"
                      type="number"
                      value={formData.management_fee_amount || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        management_fee_amount: parseFloat(e.target.value)
                      })}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expense Amount"
                      type="number"
                      value={formData.expense_amount || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        expense_amount: parseFloat(e.target.value)
                      })}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Organizational Expense Amount"
                      type="number"
                      value={formData.organizational_expense_amount || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        organizational_expense_amount: parseFloat(e.target.value)
                      })}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.allow_partial_funding || false}
                          onChange={(e) => setFormData({
                            ...formData,
                            allow_partial_funding: e.target.checked
                          })}
                        />
                      }
                      label="Allow Partial Funding"
                    />
                  </Grid>
                </Grid>
              )}

              {eventType === 'distribution' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Distribution Number"
                      type="number"
                      value={formData.distribution_number || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        distribution_number: parseInt(e.target.value)
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Payment Date"
                      value={formData.payment_date || new Date()}
                      onChange={(date) => setFormData({
                        ...formData,
                        payment_date: date
                      })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Distribution Type</InputLabel>
                      <Select
                        value={formData.distribution_type || 'return_of_capital'}
                        onChange={(e) => setFormData({
                          ...formData,
                          distribution_type: e.target.value
                        })}
                      >
                        <MenuItem value="income">Income</MenuItem>
                        <MenuItem value="capital_gain">Capital Gain</MenuItem>
                        <MenuItem value="return_of_capital">Return of Capital</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tax Year"
                      type="number"
                      value={formData.tax_year || new Date().getFullYear()}
                      onChange={(e) => setFormData({
                        ...formData,
                        tax_year: parseInt(e.target.value)
                      })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Source Description"
                      value={formData.source_description || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        source_description: e.target.value
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Gross Distribution"
                      type="number"
                      value={formData.gross_distribution || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        gross_distribution: parseFloat(e.target.value)
                      })}
                      InputProps={{ startAdornment: '$' }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Management Fee Offset"
                      type="number"
                      value={formData.management_fee_offset || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        management_fee_offset: parseFloat(e.target.value)
                      })}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Expense Offset"
                      type="number"
                      value={formData.expense_offset || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        expense_offset: parseFloat(e.target.value)
                      })}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.withholding_required || false}
                          onChange={(e) => setFormData({
                            ...formData,
                            withholding_required: e.target.checked
                          })}
                        />
                      }
                      label="Withholding Required"
                    />
                  </Grid>
                  {formData.withholding_required && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Default Withholding Rate"
                        type="number"
                        value={formData.default_withholding_rate || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          default_withholding_rate: parseFloat(e.target.value) / 100
                        })}
                        InputProps={{ endAdornment: '%' }}
                      />
                    </Grid>
                  )}
                </Grid>
              )}

              {eventType === 'management_fee' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Fee Period Start"
                      value={formData.fee_period_start || new Date()}
                      onChange={(date) => setFormData({
                        ...formData,
                        fee_period_start: date
                      })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Fee Period End"
                      value={formData.fee_period_end || new Date()}
                      onChange={(date) => setFormData({
                        ...formData,
                        fee_period_end: date
                      })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Fee Rate"
                      type="number"
                      value={formData.fee_rate ? formData.fee_rate * 100 : ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        fee_rate: parseFloat(e.target.value) / 100
                      })}
                      InputProps={{ endAdornment: '%' }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Fee Basis</InputLabel>
                      <Select
                        value={formData.fee_basis || 'commitment'}
                        onChange={(e) => setFormData({
                          ...formData,
                          fee_basis: e.target.value
                        })}
                      >
                        <MenuItem value="commitment">Commitment</MenuItem>
                        <MenuItem value="invested_capital">Invested Capital</MenuItem>
                        <MenuItem value="nav">NAV</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Calculation Frequency</InputLabel>
                      <Select
                        value={formData.calculation_frequency || 'quarterly'}
                        onChange={(e) => setFormData({
                          ...formData,
                          calculation_frequency: e.target.value
                        })}
                      >
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="quarterly">Quarterly</MenuItem>
                        <MenuItem value="annually">Annually</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={formData.payment_method || 'offset'}
                        onChange={(e) => setFormData({
                          ...formData,
                          payment_method: e.target.value
                        })}
                      >
                        <MenuItem value="offset">Offset</MenuItem>
                        <MenuItem value="direct_payment">Direct Payment</MenuItem>
                        <MenuItem value="capital_call">Capital Call</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.prorate_for_period || false}
                          onChange={(e) => setFormData({
                            ...formData,
                            prorate_for_period: e.target.checked
                          })}
                        />
                      }
                      label="Prorate for Period"
                    />
                  </Grid>
                </Grid>
              )}
            </Box>
          </LocalizationProvider>
        );

      case 3:
        // Calculate total amount
        let totalAmount = 0;
        if (eventType === 'capital_call') {
          totalAmount = (formData.investment_amount || 0) + 
                       (formData.management_fee_amount || 0) + 
                       (formData.expense_amount || 0) + 
                       (formData.organizational_expense_amount || 0);
        } else if (eventType === 'distribution') {
          totalAmount = (formData.gross_distribution || 0) - 
                       (formData.management_fee_offset || 0) - 
                       (formData.expense_offset || 0);
        }

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Event Details
            </Typography>
            
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Event Information
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {eventType.replace('_', ' ').toUpperCase()}
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {formData.event_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Description:</strong> {formData.description || 'None'}
                </Typography>
                <Typography variant="body2">
                  <strong>Event Date:</strong> {formData.event_date?.toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Effective Date:</strong> {formData.effective_date?.toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Record Date:</strong> {formData.record_date?.toLocaleDateString()}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Financial Details
                </Typography>
                <Typography variant="h6" color="primary">
                  Total Amount: {formatCurrency(totalAmount)}
                </Typography>
                
                {eventType === 'capital_call' && (
                  <Box mt={1}>
                    <Typography variant="body2">
                      Investment: {formatCurrency(formData.investment_amount || 0)}
                    </Typography>
                    <Typography variant="body2">
                      Management Fee: {formatCurrency(formData.management_fee_amount || 0)}
                    </Typography>
                    <Typography variant="body2">
                      Expenses: {formatCurrency(formData.expense_amount || 0)}
                    </Typography>
                    <Typography variant="body2">
                      Organizational Expenses: {formatCurrency(formData.organizational_expense_amount || 0)}
                    </Typography>
                  </Box>
                )}
                
                {eventType === 'distribution' && (
                  <Box mt={1}>
                    <Typography variant="body2">
                      Gross Distribution: {formatCurrency(formData.gross_distribution || 0)}
                    </Typography>
                    <Typography variant="body2">
                      Management Fee Offset: {formatCurrency(formData.management_fee_offset || 0)}
                    </Typography>
                    <Typography variant="body2">
                      Expense Offset: {formatCurrency(formData.expense_offset || 0)}
                    </Typography>
                  </Box>
                )}
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
        Create Fund Event
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateEventDialog;