import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import Refresh from '@mui/icons-material/Refresh';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Warning from '@mui/icons-material/Warning';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Schedule from '@mui/icons-material/Schedule';
import AccountBalance from '@mui/icons-material/AccountBalance';
import People from '@mui/icons-material/People';
import Assessment from '@mui/icons-material/Assessment';
import Timeline from '@mui/icons-material/Timeline';
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
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { selectFunds, selectFundsLoading, selectFundsError, fetchFunds } from '../../store/slices/fundsSlice';
import { selectUser } from '../../store/slices/authSlice';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface DashboardMetrics {
  totalFunds: number;
  totalInvestors: number;
  totalAUM: number;
  totalCommitted: number;
  totalCalled: number;
  totalDistributed: number;
  avgIRR: number;
  avgMOIC: number;
  pendingCapitalCalls: number;
  upcomingDistributions: number;
}

interface PerformanceData {
  period: string;
  nav: number;
  irr: number;
  moic: number;
  distributions: number;
}

interface FundAllocation {
  name: string;
  value: number;
  percentage: number;
}

interface RecentActivity {
  id: string;
  type: 'capital_call' | 'distribution' | 'fund_creation' | 'investor_onboarding';
  description: string;
  amount?: number;
  date: string;
  status: 'completed' | 'pending' | 'overdue';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const funds = useAppSelector(selectFunds);
  const isLoading = useAppSelector(selectFundsLoading);
  const error = useAppSelector(selectFundsError);
  const user = useAppSelector(selectUser);
  const [tabValue, setTabValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [quickActionDialog, setQuickActionDialog] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalFunds: 0,
    totalInvestors: 0,
    totalAUM: 0,
    totalCommitted: 0,
    totalCalled: 0,
    totalDistributed: 0,
    avgIRR: 0,
    avgMOIC: 0,
    pendingCapitalCalls: 0,
    upcomingDistributions: 0
  });

  const performanceData: PerformanceData[] = [
    { period: '2024-Q1', nav: 1.2, irr: 15.2, moic: 1.25, distributions: 125000 },
    { period: '2024-Q2', nav: 1.35, irr: 18.7, moic: 1.42, distributions: 180000 },
    { period: '2024-Q3', nav: 1.28, irr: 16.8, moic: 1.38, distributions: 95000 },
    { period: '2024-Q4', nav: 1.42, irr: 21.3, moic: 1.55, distributions: 220000 }
  ];

  const fundAllocation: FundAllocation[] = [
    { name: 'Growth Fund I', value: 450000000, percentage: 35 },
    { name: 'Value Fund II', value: 380000000, percentage: 28 },
    { name: 'Tech Fund III', value: 290000000, percentage: 22 },
    { name: 'Real Estate Fund', value: 200000000, percentage: 15 }
  ];

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'capital_call',
      description: 'Capital Call #3 - Growth Fund I',
      amount: 25000000,
      date: '2024-01-15',
      status: 'pending'
    },
    {
      id: '2',
      type: 'distribution',
      description: 'Distribution - Value Fund II',
      amount: 18000000,
      date: '2024-01-14',
      status: 'completed'
    },
    {
      id: '3',
      type: 'investor_onboarding',
      description: 'New Investor: Pension Fund ABC',
      date: '2024-01-13',
      status: 'pending'
    },
    {
      id: '4',
      type: 'fund_creation',
      description: 'New Fund: ESG Fund I',
      date: '2024-01-12',
      status: 'completed'
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    dispatch(fetchFunds());
    calculateMetrics();
  }, [dispatch]);

  useEffect(() => {
    if (funds.length > 0) {
      calculateMetrics();
    }
  }, [funds]);

  const calculateMetrics = () => {
    const totalFunds = funds.length;
    const totalAUM = funds.reduce((sum, fund) => sum + fund.nav, 0);
    const totalCommitted = funds.reduce((sum, fund) => sum + fund.committed_capital, 0);
    const totalCalled = funds.reduce((sum, fund) => sum + fund.called_capital, 0);
    const avgIRR = funds.length > 0 ? funds.reduce((sum, fund) => sum + fund.irr, 0) / funds.length : 0;
    const avgMOIC = funds.length > 0 ? funds.reduce((sum, fund) => sum + fund.moic, 0) / funds.length : 0;

    setMetrics({
      totalFunds,
      totalInvestors: 145,
      totalAUM,
      totalCommitted,
      totalCalled,
      totalDistributed: 850000000,
      avgIRR,
      avgMOIC,
      pendingCapitalCalls: 3,
      upcomingDistributions: 2
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchFunds());
    setTimeout(() => setRefreshing(false), 1000);
  };

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
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'overdue': return <Warning />;
      default: return undefined;
    }
  };

  const MetricCard: React.FC<{ title: string; value: string; change?: number; icon: React.ReactNode; color?: string }> = ({ title, value, change, icon, color = 'primary' }) => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: `${color}.main`, mr: 2 }}>{icon}</Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1, color: `${color}.main` }}>
          {value}
        </Typography>
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {change >= 0 ? (
              <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
            )}
            <Typography
              variant="body2"
              sx={{ color: change >= 0 ? 'success.main' : 'error.main' }}
            >
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading && funds.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Dashboard
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Funds"
            value={metrics.totalFunds.toString()}
            change={8.2}
            icon={<AccountBalance />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Investors"
            value={metrics.totalInvestors.toString()}
            change={12.5}
            icon={<People />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total AUM"
            value={formatCurrency(metrics.totalAUM)}
            change={-2.1}
            icon={<Assessment />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg IRR"
            value={formatPercent(metrics.avgIRR)}
            change={5.3}
            icon={<Timeline />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Fund Allocation" />
          <Tab label="Recent Activity" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Performance Trends
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
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Key Metrics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Committed Capital
                </Typography>
                <Typography variant="h6">{formatCurrency(metrics.totalCommitted)}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={(metrics.totalCalled / metrics.totalCommitted) * 100}
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatPercent((metrics.totalCalled / metrics.totalCommitted) * 100)} called
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Average MOIC
                </Typography>
                <Typography variant="h6">{metrics.avgMOIC.toFixed(2)}x</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pending Actions
                </Typography>
                <Typography variant="h6">
                  {metrics.pendingCapitalCalls + metrics.upcomingDistributions}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                IRR vs MOIC Correlation
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="irr" stackId="1" stroke="#8884d8" fill="#8884d8" name="IRR (%)" />
                  <Area type="monotone" dataKey="moic" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="MOIC" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Distributions by Quarter
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [formatCurrency(value as number), 'Distribution']} />
                  <Legend />
                  <Bar dataKey="distributions" fill="#8884d8" name="Distributions" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Fund Allocation by AUM
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fundAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {fundAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [formatCurrency(value as number), 'AUM']} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Fund Details
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fund Name</TableCell>
                      <TableCell align="right">AUM</TableCell>
                      <TableCell align="right">Allocation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fundAllocation.map((fund) => (
                      <TableRow key={fund.name}>
                        <TableCell component="th" scope="row">
                          {fund.name}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(fund.value)}</TableCell>
                        <TableCell align="right">{fund.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <List>
            {recentActivity.map((activity) => (
              <ListItem key={activity.id} divider>
                <ListItemText
                  primary={activity.description}
                  secondary={`${activity.date} ${activity.amount ? `• ${formatCurrency(activity.amount)}` : ''}`}
                />
                <ListItemSecondaryAction>
                  <Chip
                    icon={getStatusIcon(activity.status)}
                    label={activity.status}
                    color={getStatusColor(activity.status) as any}
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      </TabPanel>
    </Box>
  );
};

export default DashboardPage;