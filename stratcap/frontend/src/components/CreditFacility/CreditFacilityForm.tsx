import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  InputAdornment,
  Divider,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { useAppSelector } from '../../hooks/redux';

interface CreditFacilityFormData {
  facilityName: string;
  facilityType: 'revolving' | 'term' | 'bridge' | 'acquisition';
  lender: string;
  originalAmount: number;
  currency: string;
  interestRate: number;
  interestType: 'fixed' | 'floating';
  baseRate?: string;
  spread?: number;
  maturityDate: Date | null;
  commitmentFeeRate: number;
  unusedFeeRate: number;
  upfrontFeeRate: number;
  fundId: string;
  description?: string;
  covenants?: string;
  securityType?: string;
  guarantorInfo?: string;
  metadata?: Record<string, any>;
}

const validationSchema = Yup.object({
  facilityName: Yup.string().required('Facility name is required'),
  facilityType: Yup.string().required('Facility type is required'),
  lender: Yup.string().required('Lender is required'),
  originalAmount: Yup.number()
    .required('Original amount is required')
    .positive('Amount must be positive'),
  currency: Yup.string().required('Currency is required'),
  interestRate: Yup.number()
    .required('Interest rate is required')
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100%'),
  interestType: Yup.string().required('Interest type is required'),
  baseRate: Yup.string().when('interestType', {
    is: 'floating',
    then: Yup.string().required('Base rate is required for floating rate'),
  }),
  spread: Yup.number().when('interestType', {
    is: 'floating',
    then: Yup.number().required('Spread is required for floating rate'),
  }),
  maturityDate: Yup.date()
    .required('Maturity date is required')
    .min(new Date(), 'Maturity date must be in the future'),
  commitmentFeeRate: Yup.number().min(0).max(100),
  unusedFeeRate: Yup.number().min(0).max(100),
  upfrontFeeRate: Yup.number().min(0).max(100),
  fundId: Yup.string().required('Fund is required'),
});

const CreditFacilityForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [funds, setFunds] = useState<any[]>([]);
  const isEdit = !!id;

  useEffect(() => {
    fetchFunds();
    if (isEdit) {
      fetchFacility();
    }
  }, [id]);

  const fetchFunds = async () => {
    try {
      const response = await api.get('/funds');
      setFunds(response.data.data || []);
    } catch (error) {
      console.error('Error fetching funds:', error);
      enqueueSnackbar('Failed to load funds', { variant: 'error' });
    }
  };

  const fetchFacility = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/credit-facilities/${id}`);
      const facility = response.data.data;
      
      formik.setValues({
        facilityName: facility.facilityName,
        facilityType: facility.facilityType,
        lender: facility.lender,
        originalAmount: parseFloat(facility.originalAmount),
        currency: facility.currency,
        interestRate: parseFloat(facility.interestRate),
        interestType: facility.interestType,
        baseRate: facility.baseRate,
        spread: facility.spread ? parseFloat(facility.spread) : undefined,
        maturityDate: new Date(facility.maturityDate),
        commitmentFeeRate: parseFloat(facility.commitmentFeeRate),
        unusedFeeRate: parseFloat(facility.unusedFeeRate),
        upfrontFeeRate: parseFloat(facility.upfrontFeeRate),
        fundId: facility.fundId,
        description: facility.description,
        covenants: facility.covenants,
        securityType: facility.securityType,
        guarantorInfo: facility.guarantorInfo,
        metadata: facility.metadata,
      });
    } catch (error) {
      console.error('Error fetching facility:', error);
      enqueueSnackbar('Failed to load facility details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik<CreditFacilityFormData>({
    initialValues: {
      facilityName: '',
      facilityType: 'revolving',
      lender: '',
      originalAmount: 0,
      currency: 'USD',
      interestRate: 0,
      interestType: 'fixed',
      baseRate: '',
      spread: 0,
      maturityDate: null,
      commitmentFeeRate: 0,
      unusedFeeRate: 0,
      upfrontFeeRate: 0,
      fundId: '',
      description: '',
      covenants: '',
      securityType: '',
      guarantorInfo: '',
      metadata: {},
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        const payload = {
          ...values,
          maturityDate: values.maturityDate?.toISOString(),
        };

        if (isEdit) {
          await api.put(`/credit-facilities/${id}`, payload);
          enqueueSnackbar('Credit facility updated successfully', { variant: 'success' });
        } else {
          await api.post('/credit-facilities', payload);
          enqueueSnackbar('Credit facility created successfully', { variant: 'success' });
        }
        
        navigate('/credit-facilities');
      } catch (error: any) {
        console.error('Error saving facility:', error);
        enqueueSnackbar(
          error.response?.data?.message || 'Failed to save credit facility',
          { variant: 'error' }
        );
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Edit Credit Facility' : 'New Credit Facility'}
        </Typography>

        <form onSubmit={formik.handleSubmit}>
          <Card>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Facility Name"
                    name="facilityName"
                    value={formik.values.facilityName}
                    onChange={formik.handleChange}
                    error={formik.touched.facilityName && Boolean(formik.errors.facilityName)}
                    helperText={formik.touched.facilityName && formik.errors.facilityName}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Facility Type"
                    name="facilityType"
                    value={formik.values.facilityType}
                    onChange={formik.handleChange}
                    error={formik.touched.facilityType && Boolean(formik.errors.facilityType)}
                    helperText={formik.touched.facilityType && formik.errors.facilityType}
                  >
                    <MenuItem value="revolving">Revolving</MenuItem>
                    <MenuItem value="term">Term Loan</MenuItem>
                    <MenuItem value="bridge">Bridge Loan</MenuItem>
                    <MenuItem value="acquisition">Acquisition</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Lender"
                    name="lender"
                    value={formik.values.lender}
                    onChange={formik.handleChange}
                    error={formik.touched.lender && Boolean(formik.errors.lender)}
                    helperText={formik.touched.lender && formik.errors.lender}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Fund"
                    name="fundId"
                    value={formik.values.fundId}
                    onChange={formik.handleChange}
                    error={formik.touched.fundId && Boolean(formik.errors.fundId)}
                    helperText={formik.touched.fundId && formik.errors.fundId}
                  >
                    {funds.map((fund) => (
                      <MenuItem key={fund.id} value={fund.id}>
                        {fund.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Financial Terms
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Original Amount"
                    name="originalAmount"
                    type="number"
                    value={formik.values.originalAmount}
                    onChange={formik.handleChange}
                    error={formik.touched.originalAmount && Boolean(formik.errors.originalAmount)}
                    helperText={formik.touched.originalAmount && formik.errors.originalAmount}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Currency"
                    name="currency"
                    value={formik.values.currency}
                    onChange={formik.handleChange}
                    error={formik.touched.currency && Boolean(formik.errors.currency)}
                    helperText={formik.touched.currency && formik.errors.currency}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                    <MenuItem value="JPY">JPY</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Maturity Date"
                    value={formik.values.maturityDate}
                    onChange={(value) => formik.setFieldValue('maturityDate', value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.maturityDate && Boolean(formik.errors.maturityDate),
                        helperText: formik.touched.maturityDate && formik.errors.maturityDate,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Interest Type"
                    name="interestType"
                    value={formik.values.interestType}
                    onChange={formik.handleChange}
                    error={formik.touched.interestType && Boolean(formik.errors.interestType)}
                    helperText={formik.touched.interestType && formik.errors.interestType}
                  >
                    <MenuItem value="fixed">Fixed</MenuItem>
                    <MenuItem value="floating">Floating</MenuItem>
                  </TextField>
                </Grid>

                {formik.values.interestType === 'fixed' ? (
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Interest Rate"
                      name="interestRate"
                      type="number"
                      value={formik.values.interestRate}
                      onChange={formik.handleChange}
                      error={formik.touched.interestRate && Boolean(formik.errors.interestRate)}
                      helperText={formik.touched.interestRate && formik.errors.interestRate}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        select
                        label="Base Rate"
                        name="baseRate"
                        value={formik.values.baseRate}
                        onChange={formik.handleChange}
                        error={formik.touched.baseRate && Boolean(formik.errors.baseRate)}
                        helperText={formik.touched.baseRate && formik.errors.baseRate}
                      >
                        <MenuItem value="LIBOR">LIBOR</MenuItem>
                        <MenuItem value="SOFR">SOFR</MenuItem>
                        <MenuItem value="EURIBOR">EURIBOR</MenuItem>
                        <MenuItem value="PRIME">Prime</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Spread"
                        name="spread"
                        type="number"
                        value={formik.values.spread}
                        onChange={formik.handleChange}
                        error={formik.touched.spread && Boolean(formik.errors.spread)}
                        helperText={formik.touched.spread && formik.errors.spread}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">bps</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Fee Structure
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Commitment Fee Rate"
                    name="commitmentFeeRate"
                    type="number"
                    value={formik.values.commitmentFeeRate}
                    onChange={formik.handleChange}
                    error={formik.touched.commitmentFeeRate && Boolean(formik.errors.commitmentFeeRate)}
                    helperText={formik.touched.commitmentFeeRate && formik.errors.commitmentFeeRate}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Unused Fee Rate"
                    name="unusedFeeRate"
                    type="number"
                    value={formik.values.unusedFeeRate}
                    onChange={formik.handleChange}
                    error={formik.touched.unusedFeeRate && Boolean(formik.errors.unusedFeeRate)}
                    helperText={formik.touched.unusedFeeRate && formik.errors.unusedFeeRate}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Upfront Fee Rate"
                    name="upfrontFeeRate"
                    type="number"
                    value={formik.values.upfrontFeeRate}
                    onChange={formik.handleChange}
                    error={formik.touched.upfrontFeeRate && Boolean(formik.errors.upfrontFeeRate)}
                    helperText={formik.touched.upfrontFeeRate && formik.errors.upfrontFeeRate}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Additional Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Covenants"
                    name="covenants"
                    value={formik.values.covenants}
                    onChange={formik.handleChange}
                    placeholder="Enter any financial or operational covenants..."
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Security Type"
                    name="securityType"
                    value={formik.values.securityType}
                    onChange={formik.handleChange}
                    placeholder="e.g., Unsecured, Asset-backed, etc."
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Guarantor Information"
                    name="guarantorInfo"
                    value={formik.values.guarantorInfo}
                    onChange={formik.handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/credit-facilities')}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : isEdit ? 'Update Facility' : 'Create Facility'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default CreditFacilityForm;