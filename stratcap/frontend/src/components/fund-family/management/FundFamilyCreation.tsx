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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Business as BusinessIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';

import { AppDispatch } from '../../../store';
import { createFundFamily } from '../../../store/slices/fundFamilySlice';

interface FundFamilyCreationProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (fundFamily: any) => void;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Fund family name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  code: Yup.string()
    .required('Fund family code is required')
    .matches(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and dashes')
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be less than 20 characters'),
  managementCompany: Yup.string()
    .required('Management company is required')
    .min(2, 'Management company must be at least 2 characters'),
  primaryCurrency: Yup.string()
    .required('Primary currency is required'),
  fiscalYearEnd: Yup.string()
    .required('Fiscal year end is required')
    .matches(/^\d{2}-\d{2}$/, 'Fiscal year end must be in MM-DD format'),
  description: Yup.string()
    .max(500, 'Description must be less than 500 characters'),
});

const steps = ['Basic Information', 'Configuration', 'Review & Create'];

const currencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NOK'
];

const managementCompanyOptions = [
  'Acme Capital Management',
  'Global Investment Partners',
  'Strategic Asset Advisors',
  'Prime Venture Capital',
  'Institutional Capital Group'
];

const FundFamilyCreation: React.FC<FundFamilyCreationProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      code: '',
      description: '',
      managementCompany: '',
      primaryCurrency: 'USD',
      fiscalYearEnd: '12-31',
      settings: {
        defaultManagementFeeRate: 2,
        defaultCarriedInterestRate: 20,
        defaultPreferredReturn: 8,
        autoApproveCapitalCalls: false,
        requireDualApproval: true,
        enableNotifications: true,
        allowMultipleFundTypes: true,
        enableAdvancedReporting: true,
        requireInvestorAccreditation: true
      }
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const result = await dispatch(createFundFamily(values)).unwrap();
        if (onSuccess) {
          onSuccess(result);
        }
        handleClose();
      } catch (error) {
        console.error('Failed to create fund family:', error);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleClose = () => {
    setActiveStep(0);
    formik.resetForm();
    onClose();
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate basic information
      const basicFields = ['name', 'code', 'managementCompany', 'primaryCurrency', 'fiscalYearEnd'];
      const hasErrors = basicFields.some(field => 
        formik.errors[field as keyof typeof formik.errors] || 
        !formik.values[field as keyof typeof formik.values]
      );
      
      if (hasErrors) {
        formik.setTouched({
          name: true,
          code: true,
          managementCompany: true,
          primaryCurrency: true,
          fiscalYearEnd: true
        });
        return;
      }
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const generateCodeFromName = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="name"
                label="Fund Family Name"
                value={formik.values.name}
                onChange={(e) => {
                  formik.handleChange(e);
                  if (!formik.values.code || formik.values.code === generateCodeFromName(formik.values.name)) {
                    formik.setFieldValue('code', generateCodeFromName(e.target.value));
                  }
                }}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                placeholder="e.g., Growth Equity Partners"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="code"
                label="Fund Family Code"
                value={formik.values.code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.code && Boolean(formik.errors.code)}
                helperText={formik.touched.code && formik.errors.code || 'Used for internal identification'}
                placeholder="e.g., GEP"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={managementCompanyOptions}
                freeSolo
                value={formik.values.managementCompany}
                onChange={(_, newValue) => {
                  formik.setFieldValue('managementCompany', newValue || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="managementCompany"
                    label="Management Company"
                    error={formik.touched.managementCompany && Boolean(formik.errors.managementCompany)}
                    helperText={formik.touched.managementCompany && formik.errors.managementCompany}
                    onBlur={formik.handleBlur}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.primaryCurrency && Boolean(formik.errors.primaryCurrency)}>
                <InputLabel>Primary Currency</InputLabel>
                <Select
                  name="primaryCurrency"
                  value={formik.values.primaryCurrency}
                  onChange={formik.handleChange}
                  label="Primary Currency"
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="fiscalYearEnd"
                label="Fiscal Year End"
                value={formik.values.fiscalYearEnd}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fiscalYearEnd && Boolean(formik.errors.fiscalYearEnd)}
                helperText={formik.touched.fiscalYearEnd && formik.errors.fiscalYearEnd || 'Format: MM-DD'}
                placeholder="12-31"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="description"
                label="Description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                placeholder="Brief description of the fund family's investment strategy and focus..."
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Default Fee Structure
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                name="settings.defaultManagementFeeRate"
                label="Management Fee Rate (%)"
                value={formik.values.settings.defaultManagementFeeRate}
                onChange={formik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 10, step: 0.1 } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                name="settings.defaultCarriedInterestRate"
                label="Carried Interest Rate (%)"
                value={formik.values.settings.defaultCarriedInterestRate}
                onChange={formik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 50, step: 1 } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                name="settings.defaultPreferredReturn"
                label="Preferred Return (%)"
                value={formik.values.settings.defaultPreferredReturn}
                onChange={formik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 20, step: 0.1 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Operational Settings
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        name="settings.autoApproveCapitalCalls"
                        checked={formik.values.settings.autoApproveCapitalCalls}
                        onChange={formik.handleChange}
                      />
                    }
                    label="Auto-approve Capital Calls"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Automatically approve capital calls below threshold
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        name="settings.requireDualApproval"
                        checked={formik.values.settings.requireDualApproval}
                        onChange={formik.handleChange}
                      />
                    }
                    label="Require Dual Approval"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Require two approvers for critical actions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        name="settings.enableNotifications"
                        checked={formik.values.settings.enableNotifications}
                        onChange={formik.handleChange}
                      />
                    }
                    label="Enable Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Send email and in-app notifications
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        name="settings.requireInvestorAccreditation"
                        checked={formik.values.settings.requireInvestorAccreditation}
                        onChange={formik.handleChange}
                      />
                    }
                    label="Require Investor Accreditation"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Verify accreditation before allowing investments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Please review all information before creating the fund family. You can modify most settings later.
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ mr: 1 }} />
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Name:</Typography>
                      <Typography variant="body2" fontWeight="600">{formik.values.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Code:</Typography>
                      <Typography variant="body2" fontWeight="600">{formik.values.code}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Management Company:</Typography>
                      <Typography variant="body2" fontWeight="600">{formik.values.managementCompany}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Primary Currency:</Typography>
                      <Typography variant="body2" fontWeight="600">{formik.values.primaryCurrency}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Fiscal Year End:</Typography>
                      <Typography variant="body2" fontWeight="600">{formik.values.fiscalYearEnd}</Typography>
                    </Grid>
                    {formik.values.description && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Description:</Typography>
                        <Typography variant="body2" fontWeight="600">{formik.values.description}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    Configuration
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Fee Structure:</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={`Management Fee: ${formik.values.settings.defaultManagementFeeRate}%`} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`Carried Interest: ${formik.values.settings.defaultCarriedInterestRate}%`} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`Preferred Return: ${formik.values.settings.defaultPreferredReturn}%`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Enabled Features:</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {formik.values.settings.autoApproveCapitalCalls && (
                        <Chip label="Auto-approve Capital Calls" size="small" color="success" />
                      )}
                      {formik.values.settings.requireDualApproval && (
                        <Chip label="Dual Approval Required" size="small" color="primary" />
                      )}
                      {formik.values.settings.enableNotifications && (
                        <Chip label="Notifications Enabled" size="small" color="info" />
                      )}
                      {formik.values.settings.requireInvestorAccreditation && (
                        <Chip label="Investor Accreditation Required" size="small" color="secondary" />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { minHeight: '600px' } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="span" fontWeight="600">
          Create Fund Family
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Set up a new fund family to group related investment funds
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2 }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext} disabled={loading}>
            Next
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={formik.handleSubmit as any}
            disabled={loading || !formik.isValid}
            startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {loading ? 'Creating...' : 'Create Fund Family'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FundFamilyCreation;