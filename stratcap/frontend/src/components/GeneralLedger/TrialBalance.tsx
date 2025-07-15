import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TrialBalanceAccount {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  category: string;
  normalBalance: 'debit' | 'credit';
  debitBalance: string;
  creditBalance: string;
  netBalance: string;
}

interface TrialBalanceData {
  asOfDate: string;
  accounts: TrialBalanceAccount[];
  totalDebits: string;
  totalCredits: string;
}

const TrialBalance: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [funds, setFunds] = useState<any[]>([]);
  
  // Filters
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [selectedFund, setSelectedFund] = useState<string>('');
  const [accountType, setAccountType] = useState<string>('');
  const [category] = useState<string>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [hideZeroBalances, setHideZeroBalances] = useState(true);

  useEffect(() => {
    fetchFunds();
    fetchTrialBalance();
  }, []);

  const fetchFunds = async () => {
    try {
      const response = await api.get('/funds');
      setFunds(response.data.data || []);
    } catch (error) {
      console.error('Error fetching funds:', error);
    }
  };

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        asOfDate: asOfDate.toISOString(),
        includeInactive: includeInactive.toString(),
      });
      
      if (selectedFund) params.append('fundId', selectedFund);
      if (accountType) params.append('accountType', accountType);
      if (category) params.append('category', category);

      const response = await api.get(`/general-ledger/trial-balance?${params}`);
      setTrialBalanceData(response.data.data);
    } catch (error: any) {
      console.error('Error fetching trial balance:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to load trial balance',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const exportTrialBalance = async (format: string) => {
    try {
      const params = new URLSearchParams({
        asOfDate: asOfDate.toISOString(),
        includeInactive: includeInactive.toString(),
        format,
      });
      
      if (selectedFund) params.append('fundId', selectedFund);
      if (accountType) params.append('accountType', accountType);
      if (category) params.append('category', category);

      const response = await api.get(`/general-ledger/trial-balance/export?${params}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trial-balance-${formatDate(asOfDate)}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar(`Trial balance exported as ${format.toUpperCase()}`, { variant: 'success' });
    } catch (error: any) {
      console.error('Error exporting trial balance:', error);
      enqueueSnackbar('Failed to export trial balance', { variant: 'error' });
    }
  };

  const printTrialBalance = () => {
    window.print();
  };

  const getAccountTypeColor = (accountType: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (accountType) {
      case 'asset':
        return 'success';
      case 'liability':
        return 'warning';
      case 'equity':
        return 'primary';
      case 'revenue':
        return 'secondary';
      case 'expense':
        return 'error';
      default:
        return 'primary';
    }
  };

  const filteredAccounts = trialBalanceData?.accounts.filter(account => {
    if (hideZeroBalances) {
      const hasBalance = parseFloat(account.debitBalance) > 0 || parseFloat(account.creditBalance) > 0;
      return hasBalance;
    }
    return true;
  }) || [];

  const groupedAccounts = filteredAccounts.reduce((groups: Record<string, TrialBalanceAccount[]>, account) => {
    const key = account.accountType;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(account);
    return groups;
  }, {});

  const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];

  const calculateTotalsByType = (accounts: TrialBalanceAccount[]) => {
    return accounts.reduce(
      (totals, account) => ({
        debits: totals.debits + parseFloat(account.debitBalance),
        credits: totals.credits + parseFloat(account.creditBalance),
      }),
      { debits: 0, credits: 0 }
    );
  };

  const isBalanced = trialBalanceData ? 
    Math.abs(parseFloat(trialBalanceData.totalDebits) - parseFloat(trialBalanceData.totalCredits)) < 0.01 : 
    false;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Trial Balance
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 2 }}>
                <DatePicker
                  label="As of Date"
                  value={asOfDate}
                  onChange={(value) => value && setAsOfDate(value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Fund"
                  value={selectedFund}
                  onChange={(e) => setSelectedFund(e.target.value)}
                >
                  <MenuItem value="">All Funds</MenuItem>
                  {funds.map((fund) => (
                    <MenuItem key={fund.id} value={fund.id}>
                      {fund.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Account Type"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="asset">Assets</MenuItem>
                  <MenuItem value="liability">Liabilities</MenuItem>
                  <MenuItem value="equity">Equity</MenuItem>
                  <MenuItem value="revenue">Revenue</MenuItem>
                  <MenuItem value="expense">Expenses</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeInactive}
                      onChange={(e) => setIncludeInactive(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Include Inactive"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={hideZeroBalances}
                      onChange={(e) => setHideZeroBalances(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Hide Zero Balances"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <Button
                  variant="contained"
                  onClick={fetchTrialBalance}
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                  fullWidth
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6">
                  Trial Balance as of {formatDate(asOfDate)}
                </Typography>
                {trialBalanceData && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      {filteredAccounts.length} accounts
                    </Typography>
                    <Chip
                      label={isBalanced ? 'Balanced' : 'Out of Balance'}
                      color={isBalanced ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PrintIcon />}
                  onClick={printTrialBalance}
                  disabled={!trialBalanceData}
                >
                  Print
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportTrialBalance('csv')}
                  disabled={!trialBalanceData}
                >
                  CSV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportTrialBalance('excel')}
                  disabled={!trialBalanceData}
                >
                  Excel
                </Button>
              </Box>
            </Box>

            {loading ? (
              <LinearProgress />
            ) : !trialBalanceData ? (
              <Alert severity="info">
                Select criteria and click Refresh to generate trial balance
              </Alert>
            ) : (
              <Box>
                {/* Summary Totals */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography color="textSecondary" gutterBottom>
                          Total Debits
                        </Typography>
                        <Typography variant="h5">
                          {formatCurrency(parseFloat(trialBalanceData.totalDebits))}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography color="textSecondary" gutterBottom>
                          Total Credits
                        </Typography>
                        <Typography variant="h5">
                          {formatCurrency(parseFloat(trialBalanceData.totalCredits))}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography color="textSecondary" gutterBottom>
                          Difference
                        </Typography>
                        <Typography variant="h5" color={isBalanced ? 'success.main' : 'error.main'}>
                          {formatCurrency(
                            Math.abs(parseFloat(trialBalanceData.totalDebits) - parseFloat(trialBalanceData.totalCredits))
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Account Details by Type */}
                {accountTypes.map((type) => {
                  const accounts = groupedAccounts[type] || [];
                  if (accounts.length === 0) return null;

                  const typeTotals = calculateTotalsByType(accounts);

                  return (
                    <Box key={type} sx={{ mb: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Chip
                          label={type.toUpperCase()}
                          color={getAccountTypeColor(type)}
                          size="small"
                        />
                        <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                          {type} Accounts
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          ({accounts.length} accounts)
                        </Typography>
                      </Box>

                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Account Number</TableCell>
                              <TableCell>Account Name</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell align="right">Debit Balance</TableCell>
                              <TableCell align="right">Credit Balance</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {accounts.map((account) => (
                              <TableRow key={account.accountId} hover>
                                <TableCell>{account.accountNumber}</TableCell>
                                <TableCell>{account.accountName}</TableCell>
                                <TableCell>
                                  <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                                    {account.category.replace('_', ' ')}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  {parseFloat(account.debitBalance) > 0 ? 
                                    formatCurrency(parseFloat(account.debitBalance)) : 
                                    '-'
                                  }
                                </TableCell>
                                <TableCell align="right">
                                  {parseFloat(account.creditBalance) > 0 ? 
                                    formatCurrency(parseFloat(account.creditBalance)) : 
                                    '-'
                                  }
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {/* Subtotal Row */}
                            <TableRow>
                              <TableCell colSpan={3}>
                                <strong>Total {type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                              </TableCell>
                              <TableCell align="right">
                                <strong>{formatCurrency(typeTotals.debits)}</strong>
                              </TableCell>
                              <TableCell align="right">
                                <strong>{formatCurrency(typeTotals.credits)}</strong>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                })}

                {/* Grand Total */}
                <Divider sx={{ my: 3 }} />
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          GRAND TOTAL
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {formatCurrency(parseFloat(trialBalanceData.totalDebits))}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {formatCurrency(parseFloat(trialBalanceData.totalCredits))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {!isBalanced && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Trial balance is out of balance by {formatCurrency(
                      Math.abs(parseFloat(trialBalanceData.totalDebits) - parseFloat(trialBalanceData.totalCredits))
                    )}. Please review journal entries for errors.
                  </Alert>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default TrialBalance;