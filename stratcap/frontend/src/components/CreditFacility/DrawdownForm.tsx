import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface DrawdownFormData {
  requestedAmount: number;
  requestedDate: Date | null;
  expectedDisbursementDate: Date | null;
  purpose: string;
  notes?: string;
}

const validationSchema = Yup.object({
  requestedAmount: Yup.number()
    .required('Requested amount is required')
    .positive('Amount must be positive'),
  requestedDate: Yup.date()
    .required('Request date is required'),
  expectedDisbursementDate: Yup.date()
    .required('Expected disbursement date is required')
    .min(Yup.ref('requestedDate'), 'Disbursement date must be after request date'),
  purpose: Yup.string()
    .required('Purpose is required')
    .min(10, 'Purpose must be at least 10 characters'),
});

const DrawdownForm: React.FC = () => {
  const navigate = useNavigate();
  const { facilityId } = useParams<{ facilityId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [facility, setFacility] = useState<any>(null);
  const [borrowingBase, setBorrowingBase] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    if (facilityId) {
      fetchFacilityDetails();
      fetchBorrowingBase();
    }
  }, [facilityId]);

  const fetchFacilityDetails = async () => {
    try {
      const response = await api.get(`/credit-facilities/${facilityId}`);
      setFacility(response.data.data);
    } catch (error) {
      console.error('Error fetching facility:', error);
      enqueueSnackbar('Failed to load facility details', { variant: 'error' });
    }
  };

  const fetchBorrowingBase = async () => {
    try {
      const response = await api.get(`/credit-facilities/${facilityId}/borrowing-base/current`);
      setBorrowingBase(response.data.data);
    } catch (error) {
      console.error('Error fetching borrowing base:', error);
      // Borrowing base might not be required for all facilities
    }
  };

  const validateDrawdownRequest = async (amount: number) => {
    try {
      const response = await api.post(`/credit-facilities/${facilityId}/drawdowns/validate`, {
        requestedAmount: amount,
      });
      setValidationResult(response.data.data);
      return response.data.data.isValid;
    } catch (error) {
      console.error('Error validating drawdown:', error);
      return false;
    }
  };

  const formik = useFormik<DrawdownFormData>({
    initialValues: {
      requestedAmount: 0,
      requestedDate: new Date(),
      expectedDisbursementDate: new Date(),
      purpose: '',
      notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);

        // Validate drawdown request
        const isValid = await validateDrawdownRequest(values.requestedAmount);
        if (!isValid) {
          enqueueSnackbar('Drawdown validation failed. Please check the validation results.', { variant: 'error' });
          return;
        }

        const payload = {
          facilityId,
          requestedAmount: values.requestedAmount,
          requestedDate: values.requestedDate?.toISOString(),
          expectedDisbursementDate: values.expectedDisbursementDate?.toISOString(),
          purpose: values.purpose,
          notes: values.notes,
        };

        await api.post('/credit-facilities/drawdowns/request', payload);
        enqueueSnackbar('Drawdown request submitted successfully', { variant: 'success' });
        navigate(`/credit-facilities/${facilityId}`);
      } catch (error: any) {
        console.error('Error submitting drawdown:', error);
        enqueueSnackbar(
          error.response?.data?.message || 'Failed to submit drawdown request',
          { variant: 'error' }
        );
      } finally {
        setLoading(false);
      }
    },
  });

  // Validate amount on change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formik.values.requestedAmount > 0) {
        validateDrawdownRequest(formik.values.requestedAmount);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formik.values.requestedAmount]);

  if (!facility) {
    return <Typography>Loading...</Typography>;
  }

  const availableAmount = parseFloat(facility.availableAmount || '0');
  const utilizationRate = facility.utilizationRate || 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Request Drawdown
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Facility Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Facility Summary
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box>
                  <Typography color="textSecondary">Facility Name</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {facility.facilityName}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary">Lender</Typography>
                  <Typography variant="body1">{facility.lender}</Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary">Available Amount</Typography>
                  <Typography variant="body1" color="primary" fontWeight={500}>
                    {formatCurrency(availableAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary">Current Utilization</Typography>
                  <Typography variant="body1">
                    {formatPercentage(utilizationRate / 100)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Borrowing Base (if applicable) */}
          {borrowingBase && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Borrowing Base Calculation
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset Type</TableCell>
                        <TableCell align="right">Eligible Amount</TableCell>
                        <TableCell align="right">Advance Rate</TableCell>
                        <TableCell align="right">Borrowing Base</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {borrowingBase.assetDetails?.map((asset: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{asset.assetType}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(parseFloat(asset.eligibleAmount))}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercentage(asset.advanceRate / 100)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(parseFloat(asset.borrowingBase))}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <strong>Total Borrowing Base</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>
                            {formatCurrency(parseFloat(borrowingBase.totalBorrowingBase))}
                          </strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Drawdown Form */}
          <form onSubmit={formik.handleSubmit}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Drawdown Request Details
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="Requested Amount"
                      name="requestedAmount"
                      type="number"
                      value={formik.values.requestedAmount}
                      onChange={formik.handleChange}
                      error={formik.touched.requestedAmount && Boolean(formik.errors.requestedAmount)}
                      helperText={formik.touched.requestedAmount && formik.errors.requestedAmount}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                    {formik.values.requestedAmount > availableAmount && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        Requested amount exceeds available credit line
                      </Alert>
                    )}
                  </Box>

                  <Box>
                    <TextField
                      fullWidth
                      label="Purpose"
                      name="purpose"
                      value={formik.values.purpose}
                      onChange={formik.handleChange}
                      error={formik.touched.purpose && Boolean(formik.errors.purpose)}
                      helperText={formik.touched.purpose && formik.errors.purpose}
                    />
                  </Box>

                  <Box>
                    <DatePicker
                      label="Request Date"
                      value={formik.values.requestedDate}
                      onChange={(value) => formik.setFieldValue('requestedDate', value)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: formik.touched.requestedDate && Boolean(formik.errors.requestedDate),
                          helperText: formik.touched.requestedDate && formik.errors.requestedDate,
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <DatePicker
                      label="Expected Disbursement Date"
                      value={formik.values.expectedDisbursementDate}
                      onChange={(value) => formik.setFieldValue('expectedDisbursementDate', value)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: formik.touched.expectedDisbursementDate && Boolean(formik.errors.expectedDisbursementDate),
                          helperText: formik.touched.expectedDisbursementDate && formik.errors.expectedDisbursementDate,
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Notes"
                      name="notes"
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                      placeholder="Additional information or special instructions..."
                    />
                  </Box>
                </Box>

                {/* Validation Results */}
                {validationResult && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Validation Results
                    </Typography>
                    <Alert 
                      severity={validationResult.isValid ? 'success' : 'error'}
                      sx={{ mb: 2 }}
                    >
                      {validationResult.isValid
                        ? 'Drawdown request is valid and can proceed'
                        : 'Drawdown request failed validation'}
                    </Alert>
                    
                    {validationResult.errors && validationResult.errors.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="error" gutterBottom>
                          Errors:
                        </Typography>
                        {validationResult.errors.map((error: string, index: number) => (
                          <Typography key={index} variant="body2" color="error">
                            • {error}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {validationResult.warnings && validationResult.warnings.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="warning.main" gutterBottom>
                          Warnings:
                        </Typography>
                        {validationResult.warnings.map((warning: string, index: number) => (
                          <Typography key={index} variant="body2" color="warning.main">
                            • {warning}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/credit-facilities/${facilityId}`)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || (validationResult && !validationResult.isValid)}
                  >
                    {loading ? 'Submitting...' : 'Submit Drawdown Request'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </form>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DrawdownForm;