import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  InputAdornment,
  Alert,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface PaydownFormData {
  paymentAmount: number;
  paymentDate: Date | null;
  paymentType: 'principal' | 'interest' | 'both' | 'prepayment';
  allocationMethod?: 'fifo' | 'lifo' | 'prorata';
  reference?: string;
  notes?: string;
}

const validationSchema = Yup.object({
  paymentAmount: Yup.number()
    .required('Payment amount is required')
    .positive('Amount must be positive'),
  paymentDate: Yup.date()
    .required('Payment date is required')
    .max(new Date(), 'Payment date cannot be in the future'),
  paymentType: Yup.string()
    .required('Payment type is required'),
  allocationMethod: Yup.string()
    .when('paymentType', (paymentType: any, schema) => {
      return paymentType === 'principal' || paymentType === 'both' 
        ? schema.required('Allocation method is required for principal payments') 
        : schema;
    }),
  reference: Yup.string(),
  notes: Yup.string(),
});

const PaydownForm: React.FC = () => {
  const navigate = useNavigate();
  const { facilityId } = useParams<{ facilityId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [facility, setFacility] = useState<any>(null);
  const [outstandingInterest, setOutstandingInterest] = useState<number>(0);
  const [allocationPreview, setAllocationPreview] = useState<any>(null);

  useEffect(() => {
    if (facilityId) {
      fetchFacilityDetails();
      fetchOutstandingInterest();
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

  const fetchOutstandingInterest = async () => {
    try {
      const response = await api.get(`/credit-facilities/${facilityId}/interest/outstanding`);
      setOutstandingInterest(parseFloat(response.data.data.totalInterest || '0'));
    } catch (error) {
      console.error('Error fetching outstanding interest:', error);
    }
  };

  const previewAllocation = async (amount: number, paymentType: string, allocationMethod?: string) => {
    try {
      const response = await api.post(`/credit-facilities/${facilityId}/paydowns/preview`, {
        paymentAmount: amount,
        paymentType,
        allocationMethod,
      });
      setAllocationPreview(response.data.data);
    } catch (error) {
      console.error('Error previewing allocation:', error);
      setAllocationPreview(null);
    }
  };

  const formik = useFormik<PaydownFormData>({
    initialValues: {
      paymentAmount: 0,
      paymentDate: new Date(),
      paymentType: 'both',
      allocationMethod: 'fifo',
      reference: '',
      notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);

        const payload = {
          facilityId,
          paymentAmount: values.paymentAmount,
          paymentDate: values.paymentDate?.toISOString(),
          paymentType: values.paymentType,
          allocationMethod: values.allocationMethod,
          reference: values.reference,
          notes: values.notes,
        };

        await api.post('/credit-facilities/paydowns', payload);
        enqueueSnackbar('Payment processed successfully', { variant: 'success' });
        navigate(`/credit-facilities/${facilityId}`);
      } catch (error: any) {
        console.error('Error processing payment:', error);
        enqueueSnackbar(
          error.response?.data?.message || 'Failed to process payment',
          { variant: 'error' }
        );
      } finally {
        setLoading(false);
      }
    },
  });

  // Preview allocation on amount or type change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formik.values.paymentAmount > 0) {
        previewAllocation(
          formik.values.paymentAmount,
          formik.values.paymentType,
          formik.values.allocationMethod
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formik.values.paymentAmount, formik.values.paymentType, formik.values.allocationMethod]);

  if (!facility) {
    return <Typography>Loading...</Typography>;
  }

  const currentBalance = parseFloat(facility.currentBalance || '0');
  const showAllocationMethod = formik.values.paymentType === 'principal' || formik.values.paymentType === 'both';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Make Payment
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
                  <Typography color="textSecondary">Current Balance</Typography>
                  <Typography variant="body1" color="error" fontWeight={500}>
                    {formatCurrency(currentBalance)}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary">Outstanding Interest</Typography>
                  <Typography variant="body1">
                    {formatCurrency(outstandingInterest)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <form onSubmit={formik.handleSubmit}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="Payment Amount"
                      name="paymentAmount"
                      type="number"
                      value={formik.values.paymentAmount}
                      onChange={formik.handleChange}
                      error={formik.touched.paymentAmount && Boolean(formik.errors.paymentAmount)}
                      helperText={formik.touched.paymentAmount && formik.errors.paymentAmount}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                    {formik.values.paymentAmount > currentBalance + outstandingInterest && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Payment exceeds total outstanding amount
                      </Alert>
                    )}
                  </Box>

                  <Box>
                    <DatePicker
                      label="Payment Date"
                      value={formik.values.paymentDate}
                      onChange={(value) => formik.setFieldValue('paymentDate', value)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: formik.touched.paymentDate && Boolean(formik.errors.paymentDate),
                          helperText: formik.touched.paymentDate && formik.errors.paymentDate,
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">Payment Type</FormLabel>
                      <RadioGroup
                        row
                        name="paymentType"
                        value={formik.values.paymentType}
                        onChange={formik.handleChange}
                      >
                        <FormControlLabel
                          value="principal"
                          control={<Radio />}
                          label="Principal Only"
                        />
                        <FormControlLabel
                          value="interest"
                          control={<Radio />}
                          label="Interest Only"
                        />
                        <FormControlLabel
                          value="both"
                          control={<Radio />}
                          label="Principal & Interest"
                        />
                        <FormControlLabel
                          value="prepayment"
                          control={<Radio />}
                          label="Prepayment"
                        />
                      </RadioGroup>
                    </FormControl>
                  </Box>

                  {showAllocationMethod && (
                    <Box>
                      <TextField
                        fullWidth
                        select
                        label="Allocation Method"
                        name="allocationMethod"
                        value={formik.values.allocationMethod}
                        onChange={formik.handleChange}
                        error={formik.touched.allocationMethod && Boolean(formik.errors.allocationMethod)}
                        helperText={formik.touched.allocationMethod && formik.errors.allocationMethod}
                      >
                        <MenuItem value="fifo">FIFO (First In, First Out)</MenuItem>
                        <MenuItem value="lifo">LIFO (Last In, First Out)</MenuItem>
                        <MenuItem value="prorata">Pro Rata</MenuItem>
                      </TextField>
                    </Box>
                  )}

                  <Box>
                    <TextField
                      fullWidth
                      label="Reference Number"
                      name="reference"
                      value={formik.values.reference}
                      onChange={formik.handleChange}
                      placeholder="Check number, wire reference, etc."
                    />
                  </Box>

                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Notes"
                      name="notes"
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                      placeholder="Additional information about this payment..."
                    />
                  </Box>
                </Box>

                {/* Allocation Preview */}
                {allocationPreview && formik.values.paymentAmount > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Payment Allocation Preview
                    </Typography>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" gap={2} flexWrap="wrap">
                          <Box>
                            <Typography color="textSecondary" variant="body2">
                              Interest Portion
                            </Typography>
                            <Typography variant="h6">
                              {formatCurrency(parseFloat(allocationPreview.interestAmount || '0'))}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography color="textSecondary" variant="body2">
                              Principal Portion
                            </Typography>
                            <Typography variant="h6">
                              {formatCurrency(parseFloat(allocationPreview.principalAmount || '0'))}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography color="textSecondary" variant="body2">
                              Remaining Balance After Payment
                            </Typography>
                            <Typography variant="h6">
                              {formatCurrency(parseFloat(allocationPreview.remainingBalance || '0'))}
                            </Typography>
                          </Box>
                        </Box>

                        {allocationPreview.allocatedDrawdowns && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Drawdown Allocations:
                            </Typography>
                            {allocationPreview.allocatedDrawdowns.map((drawdown: any, index: number) => (
                              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2">
                                  Drawdown {formatDate(drawdown.drawdownDate)}
                                </Typography>
                                <Typography variant="body2">
                                  {formatCurrency(parseFloat(drawdown.allocatedAmount))}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
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
                    disabled={loading || formik.values.paymentAmount <= 0}
                  >
                    {loading ? 'Processing...' : 'Process Payment'}
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

export default PaydownForm;