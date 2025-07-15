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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Check as PostIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

interface JournalEntryLineItem {
  id: string;
  glAccountId: string;
  glAccountName?: string;
  debitAmount: string;
  creditAmount: string;
  description?: string;
  reference?: string;
}

interface JournalEntryFormData {
  entryDate: Date | null;
  description: string;
  reference?: string;
  sourceType: 'manual' | 'automated' | 'import' | 'closing' | 'adjustment';
  fundId?: string;
  lineItems: JournalEntryLineItem[];
}

const validationSchema = Yup.object({
  entryDate: Yup.date().required('Entry date is required'),
  description: Yup.string().required('Description is required'),
  sourceType: Yup.string().required('Source type is required'),
  lineItems: Yup.array()
    .min(2, 'At least two line items are required')
    .test('balanced', 'Journal entry must be balanced', function(lineItems) {
      if (!lineItems || lineItems.length < 2) return false;
      
      const totalDebits = lineItems.reduce((sum: number, item: any) => 
        sum + parseFloat(item.debitAmount || '0'), 0
      );
      const totalCredits = lineItems.reduce((sum: number, item: any) => 
        sum + parseFloat(item.creditAmount || '0'), 0
      );
      
      return Math.abs(totalDebits - totalCredits) < 0.01;
    }),
});

const JournalEntryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(false);
  const [glAccounts, setGLAccounts] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    fetchGLAccounts();
    fetchFunds();
    if (isEdit) {
      fetchJournalEntry();
    }
  }, [id]);

  const fetchGLAccounts = async () => {
    try {
      const response = await api.get('/general-ledger/accounts');
      setGLAccounts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching GL accounts:', error);
      enqueueSnackbar('Failed to load GL accounts', { variant: 'error' });
    }
  };

  const fetchFunds = async () => {
    try {
      const response = await api.get('/funds');
      setFunds(response.data.data || []);
    } catch (error) {
      console.error('Error fetching funds:', error);
    }
  };

  const fetchJournalEntry = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/general-ledger/journal-entries/${id}`);
      const entry = response.data.data;
      
      formik.setValues({
        entryDate: new Date(entry.entryDate),
        description: entry.description,
        reference: entry.reference,
        sourceType: entry.sourceType,
        fundId: entry.fundId,
        lineItems: entry.lineItems.map((item: any) => ({
          id: item.id,
          glAccountId: item.glAccountId,
          glAccountName: item.glAccount?.accountName,
          debitAmount: item.debitAmount,
          creditAmount: item.creditAmount,
          description: item.description,
          reference: item.reference,
        })),
      });
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      enqueueSnackbar('Failed to load journal entry', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik<JournalEntryFormData>({
    initialValues: {
      entryDate: new Date(),
      description: '',
      reference: '',
      sourceType: 'manual',
      fundId: '',
      lineItems: [
        { id: '1', glAccountId: '', debitAmount: '', creditAmount: '', description: '', reference: '' },
        { id: '2', glAccountId: '', debitAmount: '', creditAmount: '', description: '', reference: '' },
      ],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        const payload = {
          entryDate: values.entryDate?.toISOString(),
          description: values.description,
          reference: values.reference,
          sourceType: values.sourceType,
          fundId: values.fundId,
          lineItems: values.lineItems.map(item => ({
            glAccountId: item.glAccountId,
            debitAmount: item.debitAmount || '0',
            creditAmount: item.creditAmount || '0',
            description: item.description,
            reference: item.reference,
          })),
        };

        if (isEdit) {
          await api.put(`/general-ledger/journal-entries/${id}`, payload);
          enqueueSnackbar('Journal entry updated successfully', { variant: 'success' });
        } else {
          await api.post('/general-ledger/journal-entries', payload);
          enqueueSnackbar('Journal entry created successfully', { variant: 'success' });
        }
        
        navigate('/general-ledger/journal-entries');
      } catch (error: any) {
        console.error('Error saving journal entry:', error);
        enqueueSnackbar(
          error.response?.data?.message || 'Failed to save journal entry',
          { variant: 'error' }
        );
      } finally {
        setLoading(false);
      }
    },
  });

  const addLineItem = () => {
    const newId = (formik.values.lineItems.length + 1).toString();
    formik.setFieldValue('lineItems', [
      ...formik.values.lineItems,
      { id: newId, glAccountId: '', debitAmount: '', creditAmount: '', description: '', reference: '' },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (formik.values.lineItems.length > 2) {
      const newLineItems = formik.values.lineItems.filter((_, i) => i !== index);
      formik.setFieldValue('lineItems', newLineItems);
    }
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    const updatedLineItems = [...formik.values.lineItems];
    
    if (field === 'glAccountId') {
      const account = glAccounts.find(acc => acc.id === value);
      updatedLineItems[index] = {
        ...updatedLineItems[index],
        glAccountId: value,
        glAccountName: account?.accountName || '',
      };
    } else if (field === 'debitAmount' && value) {
      updatedLineItems[index] = {
        ...updatedLineItems[index],
        debitAmount: value,
        creditAmount: '', // Clear credit when entering debit
      };
    } else if (field === 'creditAmount' && value) {
      updatedLineItems[index] = {
        ...updatedLineItems[index],
        creditAmount: value,
        debitAmount: '', // Clear debit when entering credit
      };
    } else {
      updatedLineItems[index] = {
        ...updatedLineItems[index],
        [field]: value,
      };
    }
    
    formik.setFieldValue('lineItems', updatedLineItems);
  };

  const validateEntry = async () => {
    try {
      const response = await api.post('/general-ledger/journal-entries/validate', {
        lineItems: formik.values.lineItems,
      });
      setValidationResult(response.data.data);
      setPreviewOpen(true);
    } catch (error: any) {
      console.error('Error validating entry:', error);
      enqueueSnackbar('Validation failed', { variant: 'error' });
    }
  };

  const postEntry = async () => {
    try {
      setLoading(true);
      await api.post(`/general-ledger/journal-entries/${id}/post`);
      enqueueSnackbar('Journal entry posted successfully', { variant: 'success' });
      navigate('/general-ledger/journal-entries');
    } catch (error: any) {
      console.error('Error posting entry:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to post journal entry',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalDebits = formik.values.lineItems.reduce((sum, item) => 
      sum + parseFloat(item.debitAmount || '0'), 0
    );
    const totalCredits = formik.values.lineItems.reduce((sum, item) => 
      sum + parseFloat(item.creditAmount || '0'), 0
    );
    const difference = totalDebits - totalCredits;
    
    return { totalDebits, totalCredits, difference };
  };

  const { totalDebits, totalCredits, difference } = calculateTotals();
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Edit Journal Entry' : 'New Journal Entry'}
        </Typography>

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Header Information */}
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Entry Details
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <DatePicker
                        label="Entry Date"
                        value={formik.values.entryDate}
                        onChange={(value) => formik.setFieldValue('entryDate', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: formik.touched.entryDate && Boolean(formik.errors.entryDate),
                            helperText: formik.touched.entryDate && formik.errors.entryDate,
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        select
                        label="Source Type"
                        name="sourceType"
                        value={formik.values.sourceType}
                        onChange={formik.handleChange}
                        error={formik.touched.sourceType && Boolean(formik.errors.sourceType)}
                        helperText={formik.touched.sourceType && formik.errors.sourceType}
                      >
                        <MenuItem value="manual">Manual</MenuItem>
                        <MenuItem value="automated">Automated</MenuItem>
                        <MenuItem value="import">Import</MenuItem>
                        <MenuItem value="closing">Closing</MenuItem>
                        <MenuItem value="adjustment">Adjustment</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        select
                        label="Fund (Optional)"
                        name="fundId"
                        value={formik.values.fundId}
                        onChange={formik.handleChange}
                      >
                        <MenuItem value="">All Funds</MenuItem>
                        {funds.map((fund) => (
                          <MenuItem key={fund.id} value={fund.id}>
                            {fund.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Reference"
                        name="reference"
                        value={formik.values.reference}
                        onChange={formik.handleChange}
                        placeholder="Invoice #, check #, etc."
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        error={formik.touched.description && Boolean(formik.errors.description)}
                        helperText={formik.touched.description && formik.errors.description}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Line Items */}
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Line Items
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={addLineItem}
                      variant="outlined"
                      size="small"
                    >
                      Add Line
                    </Button>
                  </Box>

                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>GL Account</TableCell>
                          <TableCell align="right">Debit</TableCell>
                          <TableCell align="right">Credit</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Reference</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formik.values.lineItems.map((lineItem, index) => (
                          <TableRow key={lineItem.id}>
                            <TableCell>
                              <TextField
                                select
                                fullWidth
                                size="small"
                                value={lineItem.glAccountId}
                                onChange={(e) => updateLineItem(index, 'glAccountId', e.target.value)}
                                error={!lineItem.glAccountId && formik.submitCount > 0}
                              >
                                {glAccounts.map((account) => (
                                  <MenuItem key={account.id} value={account.id}>
                                    {account.accountNumber} - {account.accountName}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={lineItem.debitAmount}
                                onChange={(e) => updateLineItem(index, 'debitAmount', e.target.value)}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={lineItem.creditAmount}
                                onChange={(e) => updateLineItem(index, 'creditAmount', e.target.value)}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={lineItem.description}
                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                placeholder="Line description"
                                sx={{ width: 200 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={lineItem.reference}
                                onChange={(e) => updateLineItem(index, 'reference', e.target.value)}
                                placeholder="Reference"
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => removeLineItem(index)}
                                disabled={formik.values.lineItems.length <= 2}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Totals Row */}
                        <TableRow>
                          <TableCell><strong>Totals</strong></TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(totalDebits)}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(totalCredits)}</strong>
                          </TableCell>
                          <TableCell colSpan={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                Difference: {formatCurrency(Math.abs(difference))}
                              </Typography>
                              <Chip
                                label={isBalanced ? 'Balanced' : 'Out of Balance'}
                                color={isBalanced ? 'success' : 'error'}
                                size="small"
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {!isBalanced && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      Journal entry is not balanced. Total debits must equal total credits.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Actions */}
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/general-ledger/journal-entries')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={validateEntry}
                  disabled={loading || !isBalanced}
                >
                  Validate
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading || !isBalanced}
                >
                  {loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Save as Draft'}
                </Button>

                {isEdit && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PostIcon />}
                    onClick={postEntry}
                    disabled={loading || !isBalanced}
                  >
                    Post Entry
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Validation Dialog */}
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Entry Validation Results</DialogTitle>
          <DialogContent>
            {validationResult && (
              <Box>
                <Alert 
                  severity={validationResult.isValid ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                >
                  {validationResult.isValid 
                    ? 'Journal entry is valid and ready to post'
                    : 'Journal entry has validation errors'
                  }
                </Alert>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={4}>
                    <Typography variant="body2" color="textSecondary">Total Debits</Typography>
                    <Typography variant="h6">{validationResult.totals?.debits}</Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="body2" color="textSecondary">Total Credits</Typography>
                    <Typography variant="h6">{validationResult.totals?.credits}</Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="body2" color="textSecondary">Difference</Typography>
                    <Typography variant="h6">{validationResult.totals?.difference}</Typography>
                  </Grid>
                </Grid>

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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default JournalEntryForm;