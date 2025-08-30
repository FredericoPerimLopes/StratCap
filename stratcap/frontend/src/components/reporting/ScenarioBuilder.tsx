import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Tooltip
} from '@mui/material';
import {
  Add,
  Delete,
  ExpandMore,
  Info,
  TrendingUp,
  Assessment,
  Calculate,
  Save,
  Preview
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import type { 
  HypotheticalScenario, 
  ScenarioParameters,
  ScenarioAssumptions,
  ParameterOverrides,
  CapitalAssumption,
  ExpenseAssumption,
  DistributionAssumption
} from '../../types/reporting';
import { hypotheticalAPI } from '../../services/reporting/reportingAPI';

interface ScenarioBuilderProps {
  fundId: number;
  scenario?: HypotheticalScenario;
  onSave?: (scenario: HypotheticalScenario) => void;
  onCancel?: () => void;
  onPreview?: (parameters: ScenarioParameters) => void;
}

const steps = [
  'Basic Information',
  'Waterfall Parameters', 
  'Financial Assumptions',
  'Capital Events',
  'Review & Save'
];

export default function ScenarioBuilder({
  fundId,
  scenario,
  onSave,
  onCancel,
  onPreview
}: ScenarioBuilderProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Partial<HypotheticalScenario>>({
    name: '',
    description: '',
    fundId,
    parameters: {
      totalProceeds: 0,
      proceedsDate: new Date(),
      assumptions: {},
      overrides: {}
    } as ScenarioParameters
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [defaultAssumptions, setDefaultAssumptions] = useState<any>(null);

  useEffect(() => {
    if (scenario) {
      setFormData(scenario);
    }
    loadDefaultAssumptions();
  }, [scenario, fundId]);

  const loadDefaultAssumptions = async () => {
    try {
      const response = await hypotheticalAPI.getDefaultAssumptions(fundId, 'standard');
      setDefaultAssumptions(response.data.data);
    } catch (error) {
      console.error('Failed to load default assumptions:', error);
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      name: '',
      description: '',
      fundId,
      parameters: {
        totalProceeds: 0,
        proceedsDate: new Date(),
        assumptions: {},
        overrides: {}
      } as ScenarioParameters
    });
    setValidationErrors({});
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.name?.trim()) {
          errors.name = 'Scenario name is required';
        }
        if (!formData.parameters?.totalProceeds || formData.parameters.totalProceeds <= 0) {
          errors.totalProceeds = 'Total proceeds must be greater than zero';
        }
        break;
      case 1: // Waterfall Parameters
        // Validation for overrides
        break;
      case 2: // Financial Assumptions
        // Validation for assumptions
        break;
      case 3: // Capital Events
        // Validation for events
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateStep(4)) return;

    try {
      setLoading(true);
      const response = scenario?.id 
        ? await hypotheticalAPI.updateScenario(scenario.id, formData)
        : await hypotheticalAPI.createScenario(formData as any);
      
      onSave?.(response.data.data);
    } catch (error) {
      console.error('Failed to save scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (formData.parameters) {
      try {
        const validationResponse = await hypotheticalAPI.validateScenarioParameters(formData.parameters);
        if (validationResponse.data.success) {
          onPreview?.(formData.parameters);
        }
      } catch (error) {
        console.error('Parameter validation failed:', error);
      }
    }
  };

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const addCapitalEvent = (type: 'capital' | 'expense' | 'distribution') => {
    const currentEvents = formData.parameters?.assumptions?.[type === 'capital' ? 'additionalCapital' : type === 'expense' ? 'expenses' : 'distributions'] || [];
    
    const newEvent = type === 'capital' 
      ? { date: new Date(), amount: 0, purpose: '' }
      : type === 'expense'
      ? { type: '', amount: 0, frequency: 'one_time' as const, startDate: new Date() }
      : { date: new Date(), amount: 0, type: 'regular' as const };

    updateFormData(`parameters.assumptions.${type === 'capital' ? 'additionalCapital' : type === 'expense' ? 'expenses' : 'distributions'}`, [
      ...currentEvents,
      newEvent
    ]);
  };

  const removeCapitalEvent = (type: 'capital' | 'expense' | 'distribution', index: number) => {
    const currentEvents = formData.parameters?.assumptions?.[type === 'capital' ? 'additionalCapital' : type === 'expense' ? 'expenses' : 'distributions'] || [];
    const updated = currentEvents.filter((_, i) => i !== index);
    updateFormData(`parameters.assumptions.${type === 'capital' ? 'additionalCapital' : type === 'expense' ? 'expenses' : 'distributions'}`, updated);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Scenario Name"
          value={formData.name || ''}
          onChange={(e) => updateFormData('name', e.target.value)}
          error={!!validationErrors.name}
          helperText={validationErrors.name}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Proceeds Date"
            value={formData.parameters?.proceedsDate}
            onChange={(date) => updateFormData('parameters.proceedsDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Description"
          value={formData.description || ''}
          onChange={(e) => updateFormData('description', e.target.value)}
          multiline
          rows={3}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Total Proceeds"
          type="number"
          value={formData.parameters?.totalProceeds || ''}
          onChange={(e) => updateFormData('parameters.totalProceeds', parseFloat(e.target.value) || 0)}
          error={!!validationErrors.totalProceeds}
          helperText={validationErrors.totalProceeds}
          InputProps={{
            startAdornment: '$'
          }}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Exit Valuation"
          type="number"
          value={formData.parameters?.assumptions?.exitValuation || ''}
          onChange={(e) => updateFormData('parameters.assumptions.exitValuation', parseFloat(e.target.value) || 0)}
          InputProps={{
            startAdornment: '$'
          }}
        />
      </Grid>
    </Grid>
  );

  const renderWaterfallParameters = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Fee and Carry Overrides
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Override default fund parameters for this scenario. Leave blank to use fund defaults.
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Management Fee Rate (%)"
          type="number"
          value={formData.parameters?.overrides?.managementFeeRate ? (formData.parameters.overrides.managementFeeRate * 100) : ''}
          onChange={(e) => updateFormData('parameters.overrides.managementFeeRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
          inputProps={{ step: 0.01, min: 0, max: 10 }}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Carried Interest Rate (%)"
          type="number"
          value={formData.parameters?.overrides?.carriedInterestRate ? (formData.parameters.overrides.carriedInterestRate * 100) : ''}
          onChange={(e) => updateFormData('parameters.overrides.carriedInterestRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
          inputProps={{ step: 0.01, min: 0, max: 50 }}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Preferred Return Rate (%)"
          type="number"
          value={formData.parameters?.overrides?.preferredReturnRate ? (formData.parameters.overrides.preferredReturnRate * 100) : ''}
          onChange={(e) => updateFormData('parameters.overrides.preferredReturnRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
          inputProps={{ step: 0.01, min: 0, max: 20 }}
        />
      </Grid>

      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Advanced Waterfall Structure</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" sx={{ mb: 2 }}>
              Configure custom waterfall tiers and allocation percentages. This will override the standard waterfall structure.
            </Alert>
            {/* Custom waterfall configuration would go here */}
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );

  const renderFinancialAssumptions = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Financial Assumptions
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Exit Multiple"
          type="number"
          value={formData.parameters?.assumptions?.exitMultiple || ''}
          onChange={(e) => updateFormData('parameters.assumptions.exitMultiple', parseFloat(e.target.value) || 0)}
          inputProps={{ step: 0.1, min: 0 }}
          InputProps={{
            endAdornment: 'x'
          }}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Holding Period (years)"
          type="number"
          value={formData.parameters?.assumptions?.holdingPeriod || ''}
          onChange={(e) => updateFormData('parameters.assumptions.holdingPeriod', parseFloat(e.target.value) || 0)}
          inputProps={{ step: 0.1, min: 0 }}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          Risk Adjustments
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography gutterBottom>Discount Rate Adjustment (%)</Typography>
        <Slider
          value={0}
          onChange={(e, value) => {/* Handle discount rate */}}
          aria-labelledby="discount-rate-slider"
          valueLabelDisplay="auto"
          step={0.5}
          marks
          min={-5}
          max={5}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography gutterBottom>Volatility Factor</Typography>
        <Slider
          value={1}
          onChange={(e, value) => {/* Handle volatility */}}
          aria-labelledby="volatility-slider"
          valueLabelDisplay="auto"
          step={0.1}
          marks
          min={0.5}
          max={2}
        />
      </Grid>
    </Grid>
  );

  const renderCapitalEvents = () => (
    <Grid container spacing={3}>
      {/* Additional Capital Events */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Additional Capital Events</Typography>
          <Button
            startIcon={<Add />}
            onClick={() => addCapitalEvent('capital')}
            variant="outlined"
            size="small"
          >
            Add Capital Call
          </Button>
        </Box>
        
        {formData.parameters?.assumptions?.additionalCapital?.map((capital, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date"
                      value={capital.date}
                      onChange={(date) => updateFormData(`parameters.assumptions.additionalCapital.${index}.date`, date)}
                      renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    size="small"
                    value={capital.amount}
                    onChange={(e) => updateFormData(`parameters.assumptions.additionalCapital.${index}.amount`, parseFloat(e.target.value) || 0)}
                    InputProps={{ startAdornment: '$' }}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Purpose"
                    size="small"
                    value={capital.purpose}
                    onChange={(e) => updateFormData(`parameters.assumptions.additionalCapital.${index}.purpose`, e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton 
                    onClick={() => removeCapitalEvent('capital', index)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Grid>

      {/* Expense Assumptions */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Expense Assumptions</Typography>
          <Button
            startIcon={<Add />}
            onClick={() => addCapitalEvent('expense')}
            variant="outlined"
            size="small"
          >
            Add Expense
          </Button>
        </Box>
        
        {formData.parameters?.assumptions?.expenses?.map((expense, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Type"
                    size="small"
                    value={expense.type}
                    onChange={(e) => updateFormData(`parameters.assumptions.expenses.${index}.type`, e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    size="small"
                    value={expense.amount}
                    onChange={(e) => updateFormData(`parameters.assumptions.expenses.${index}.amount`, parseFloat(e.target.value) || 0)}
                    InputProps={{ startAdornment: '$' }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={expense.frequency}
                      label="Frequency"
                      onChange={(e) => updateFormData(`parameters.assumptions.expenses.${index}.frequency`, e.target.value)}
                    >
                      <MenuItem value="one_time">One Time</MenuItem>
                      <MenuItem value="annual">Annual</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={expense.startDate}
                      onChange={(date) => updateFormData(`parameters.assumptions.expenses.${index}.startDate`, date)}
                      renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={2}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={expense.endDate}
                      onChange={(date) => updateFormData(`parameters.assumptions.expenses.${index}.endDate`, date)}
                      renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton 
                    onClick={() => removeCapitalEvent('expense', index)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </Grid>
  );

  const renderReview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Scenario Summary
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Basic Information
            </Typography>
            <Typography><strong>Name:</strong> {formData.name}</Typography>
            <Typography><strong>Total Proceeds:</strong> {formatCurrency(formData.parameters?.totalProceeds || 0)}</Typography>
            <Typography><strong>Proceeds Date:</strong> {formData.parameters?.proceedsDate?.toLocaleDateString()}</Typography>
            {formData.description && (
              <Typography><strong>Description:</strong> {formData.description}</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Parameter Overrides
            </Typography>
            {formData.parameters?.overrides?.managementFeeRate && (
              <Typography><strong>Management Fee:</strong> {(formData.parameters.overrides.managementFeeRate * 100).toFixed(2)}%</Typography>
            )}
            {formData.parameters?.overrides?.carriedInterestRate && (
              <Typography><strong>Carried Interest:</strong> {(formData.parameters.overrides.carriedInterestRate * 100).toFixed(2)}%</Typography>
            )}
            {formData.parameters?.overrides?.preferredReturnRate && (
              <Typography><strong>Preferred Return:</strong> {(formData.parameters.overrides.preferredReturnRate * 100).toFixed(2)}%</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Alert severity="info">
          Review all parameters before saving. You can always edit the scenario later.
        </Alert>
      </Grid>
    </Grid>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderWaterfallParameters();
      case 2:
        return renderFinancialAssumptions();
      case 3:
        return renderCapitalEvents();
      case 4:
        return renderReview();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {scenario ? 'Edit Scenario' : 'Create New Scenario'}
          </Typography>
          <Box>
            <Button onClick={onCancel} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button
              variant="outlined"
              startIcon={<Preview />}
              onClick={handlePreview}
              sx={{ mr: 1 }}
              disabled={activeStep < 1}
            >
              Preview
            </Button>
          </Box>
        </Box>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {getStepContent(index)}
                </Box>
                <Box sx={{ mb: 1 }}>
                  <div>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleSave : handleNext}
                      sx={{ mt: 1, mr: 1 }}
                      disabled={loading}
                      startIcon={index === steps.length - 1 ? <Save /> : undefined}
                    >
                      {index === steps.length - 1 ? 'Save Scenario' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                    {index === steps.length - 1 && (
                      <Button
                        onClick={handleReset}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </CardContent>
    </Card>
  );
}