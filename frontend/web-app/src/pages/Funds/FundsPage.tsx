import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Alert,
  Tooltip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  CircularProgress,
  TablePagination,
  InputAdornment,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import Search from '@mui/icons-material/Search';
import FilterList from '@mui/icons-material/FilterList';
import Download from '@mui/icons-material/Download';
import Upload from '@mui/icons-material/Upload';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import AccountBalance from '@mui/icons-material/AccountBalance';
import Assessment from '@mui/icons-material/Assessment';
import Timeline from '@mui/icons-material/Timeline';
import People from '@mui/icons-material/People';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Schedule from '@mui/icons-material/Schedule';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Warning from '@mui/icons-material/Warning';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Close from '@mui/icons-material/Close';
import Save from '@mui/icons-material/Save';
import Cancel from '@mui/icons-material/Cancel';
import Refresh from '@mui/icons-material/Refresh';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  selectFunds,
  selectSelectedFund,
  selectFundPerformance,
  selectCapitalCalls,
  selectDistributions,
  selectFundsLoading,
  selectFundsError,
  fetchFunds,
  fetchFund,
  createFund,
  updateFund,
  deleteFund,
  fetchFundPerformance,
  fetchCapitalCalls,
  fetchDistributions,
  clearError,
  setSelectedFund
} from '../../store/slices/fundsSlice';
import { Fund, CreateFundRequest, UpdateFundRequest } from '../../types/fund';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const FundsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const funds = useAppSelector(selectFunds);
  const isLoading = useAppSelector(selectFundsLoading);
  const error = useAppSelector(selectFundsError);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateFundRequest>({
    fund_name: '',
    fund_type: 'private_equity',
    inception_date: new Date().toISOString().split('T')[0],
    target_size: 0,
    management_fee_rate: 2.0,
    carry_rate: 20.0,
    description: ''
  });

  useEffect(() => {
    dispatch(fetchFunds());
  }, [dispatch]);

  const handleCreateFund = async () => {
    try {
      await dispatch(createFund(formData)).unwrap();
      setCreateDialogOpen(false);
      setFormData({
        fund_name: '',
        fund_type: 'private_equity',
        inception_date: new Date().toISOString().split('T')[0],
        target_size: 0,
        management_fee_rate: 2.0,
        carry_rate: 20.0,
        description: ''
      });
    } catch (error) {
      console.error('Failed to create fund:', error);
    }
  };

  const handleDeleteFund = async (fundId: string) => {
    try {
      await dispatch(deleteFund(fundId)).unwrap();
      setDeleteDialogOpen(null);
    } catch (error) {
      console.error('Failed to delete fund:', error);
    }
  };

  const filteredFunds = funds.filter(fund => {
    const matchesSearch = fund.fund_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fund.fund_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || fund.fund_status === filterStatus;
    const matchesType = filterType === 'all' || fund.fund_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedFunds = filteredFunds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'closed': return 'warning';
      case 'liquidated': return 'error';
      default: return 'default';
    }
  };

  const getFundTypeLabel = (type: string) => {
    switch (type) {
      case 'private_equity': return 'Private Equity';
      case 'venture_capital': return 'Venture Capital';
      case 'hedge_fund': return 'Hedge Fund';
      case 'real_estate': return 'Real Estate';
      default: return type;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Funds Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ mr: 2 }}
        >
          Create Fund
        </Button>
        <Button
          variant="outlined"
          startIcon={<Upload />}
          sx={{ mr: 2 }}
        >
          Import Data
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download />}
        >
          Export
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search funds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="liquidated">Liquidated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="private_equity">Private Equity</MenuItem>
                  <MenuItem value="venture_capital">Venture Capital</MenuItem>
                  <MenuItem value="hedge_fund">Hedge Fund</MenuItem>
                  <MenuItem value="real_estate">Real Estate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredFunds.length} of {funds.length} funds
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fund Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Target Size</TableCell>
                <TableCell align="right">Committed</TableCell>
                <TableCell align="right">NAV</TableCell>
                <TableCell align="right">IRR</TableCell>
                <TableCell align="right">MOIC</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFunds.map((fund) => (
                  <TableRow key={fund.fund_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <AccountBalance />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {fund.fund_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fund.fund_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getFundTypeLabel(fund.fund_type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fund.fund_status}
                        size="small"
                        color={getStatusColor(fund.fund_status) as any}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(fund.target_size)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(fund.committed_capital)}
                      <LinearProgress
                        variant="determinate"
                        value={(fund.committed_capital / fund.target_size) * 100}
                        sx={{ mt: 0.5, width: 60 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(fund.nav)}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {fund.irr >= 0 ? (
                          <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                        ) : (
                          <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                        )}
                        {formatPercent(fund.irr)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {fund.moic.toFixed(2)}x
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/funds/${fund.fund_id}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/funds/${fund.fund_id}/edit`)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialogOpen(fund.fund_id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredFunds.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Fund</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fund Name"
                value={formData.fund_name}
                onChange={(e) => setFormData({ ...formData, fund_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Fund Type</InputLabel>
                <Select
                  value={formData.fund_type}
                  onChange={(e) => setFormData({ ...formData, fund_type: e.target.value as any })}
                  label="Fund Type"
                >
                  <MenuItem value="private_equity">Private Equity</MenuItem>
                  <MenuItem value="venture_capital">Venture Capital</MenuItem>
                  <MenuItem value="hedge_fund">Hedge Fund</MenuItem>
                  <MenuItem value="real_estate">Real Estate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Inception Date"
                  value={new Date(formData.inception_date)}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData({ ...formData, inception_date: newValue.toISOString().split('T')[0] });
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Size"
                type="number"
                value={formData.target_size}
                onChange={(e) => setFormData({ ...formData, target_size: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Management Fee Rate"
                type="number"
                value={formData.management_fee_rate}
                onChange={(e) => setFormData({ ...formData, management_fee_rate: Number(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Carry Rate"
                type="number"
                value={formData.carry_rate}
                onChange={(e) => setFormData({ ...formData, carry_rate: Number(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFund} variant="contained" disabled={!formData.fund_name}>
            Create Fund
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteDialogOpen} onClose={() => setDeleteDialogOpen(null)}>
        <DialogTitle>Delete Fund</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this fund? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(null)}>Cancel</Button>
          <Button
            onClick={() => deleteDialogOpen && handleDeleteFund(deleteDialogOpen)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const FundDetail: React.FC = () => {
  const { fundId } = useParams<{ fundId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fund = useAppSelector(selectSelectedFund);
  const performance = useAppSelector(selectFundPerformance);
  const capitalCalls = useAppSelector(selectCapitalCalls);
  const distributions = useAppSelector(selectDistributions);
  const isLoading = useAppSelector(selectFundsLoading);
  const error = useAppSelector(selectFundsError);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (fundId) {
      dispatch(fetchFund(fundId));
      dispatch(fetchFundPerformance(fundId));
      dispatch(fetchCapitalCalls(fundId));
      dispatch(fetchDistributions(fundId));
    }
  }, [dispatch, fundId]);

  const performanceData = [
    { period: '2024-Q1', nav: 1.2, irr: 15.2, moic: 1.25, called: 0.6 },
    { period: '2024-Q2', nav: 1.35, irr: 18.7, moic: 1.42, called: 0.75 },
    { period: '2024-Q3', nav: 1.28, irr: 16.8, moic: 1.38, called: 0.68 },
    { period: '2024-Q4', nav: 1.42, irr: 21.3, moic: 1.55, called: 0.82 }
  ];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!fund) {
    return (
      <Alert severity="error">
        Fund not found or failed to load.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/funds')}
          sx={{ mr: 2 }}
        >
          Back to Funds
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {fund.fund_name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate(`/funds/${fund.fund_id}/edit`)}
        >
          Edit Fund
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Target Size
              </Typography>
              <Typography variant="h4" color="primary">
                {formatCurrency(fund.target_size)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Committed Capital
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatCurrency(fund.committed_capital)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(fund.committed_capital / fund.target_size) * 100}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current NAV
              </Typography>
              <Typography variant="h4" color="info.main">
                {formatCurrency(fund.nav)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                IRR
              </Typography>
              <Typography variant="h4" color={fund.irr >= 0 ? 'success.main' : 'error.main'}>
                {formatPercent(fund.irr)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Capital Calls" />
          <Tab label="Distributions" />
          <Tab label="Investors" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fund Performance Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="irr" stroke="#8884d8" strokeWidth={2} name="IRR (%)" />
                    <Line yAxisId="right" type="monotone" dataKey="moic" stroke="#82ca9d" strokeWidth={2} name="MOIC" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fund Details
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Fund Type"
                      secondary={fund.fund_type.replace('_', ' ').toUpperCase()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          label={fund.fund_status}
                          size="small"
                          color={fund.fund_status === 'active' ? 'success' : 'default'}
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Inception Date"
                      secondary={new Date(fund.inception_date).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Management Fee"
                      secondary={`${fund.management_fee_rate}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Carry Rate"
                      secondary={`${fund.carry_rate}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="MOIC"
                      secondary={`${fund.moic.toFixed(2)}x`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Capital Deployment
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="called" stackId="1" stroke="#8884d8" fill="#8884d8" name="Called Capital" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="nav" fill="#8884d8" name="NAV" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Capital Calls History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Call Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {capitalCalls.map((call) => (
                    <TableRow key={call.call_id}>
                      <TableCell>{new Date(call.call_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(call.due_date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{formatCurrency(call.total_amount)}</TableCell>
                      <TableCell align="right">{formatPercent(call.call_percentage)}</TableCell>
                      <TableCell>
                        <Chip
                          label={call.status}
                          size="small"
                          color={call.status === 'completed' ? 'success' : call.status === 'pending' ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distributions History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Distribution Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {distributions.map((distribution) => (
                    <TableRow key={distribution.distribution_id}>
                      <TableCell>{new Date(distribution.distribution_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={distribution.distribution_type.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(distribution.total_amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={distribution.status}
                          size="small"
                          color={distribution.status === 'completed' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Fund Investors
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Investor management functionality will be available here.
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

const FundsPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<FundsList />} />
      <Route path="/:fundId" element={<FundDetail />} />
    </Routes>
  );
};

export default FundsPage;