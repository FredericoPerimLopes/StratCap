import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Chip,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  RefreshIcon,
  CalendarTodayIcon,
  AccountBalanceIcon,
  GroupIcon,
  AssessmentIcon,
  ShowChartIcon,
  PieChartIcon,
  WaterfallChartIcon,
  AttachMoneyIcon,
  NotificationsIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fundAPI, investorAPI, capitalActivityAPI, feeAPI, waterfallAPI } from '../../services/api';

interface DashboardMetrics {
  totalAUM: number;
  aumChange: number;
  totalFunds: number;
  activeFunds: number;
  totalInvestors: number;
  activeInvestors: number;
  totalCommitments: number;
  unfundedCommitments: number;
  ytdDistributions: number;
  ytdCapitalCalls: number;
  averageIRR: number;
  averageMOIC: number;
  pendingActivities: number;
  upcomingFees: number;
}

interface ChartData {
  aumTrend: Array<{ month: string; aum: number; }>;
  fundsByVintage: Array<{ vintage: number; count: number; commitments: number; }>;
  capitalActivity: Array<{ month: string; calls: number; distributions: number; net: number; }>;
  feeAnalysis: Array<{ type: string; amount: number; percentage: number; }>;
  performanceMetrics: Array<{ fund: string; irr: number; moic: number; dpi: number; }>;
  investorTypes: Array<{ type: string; count: number; commitments: number; }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all necessary data in parallel
      const [fundsRes, investorsRes, activitiesRes, feesRes] = await Promise.all([
        fundAPI.getAll({ limit: 100 }),
        investorAPI.getAll({ limit: 100 }),
        capitalActivityAPI.getAll({ 
          startDate: format(subMonths(new Date(), 12), 'yyyy-MM-dd'),
          endDate: format(new Date(), 'yyyy-MM-dd')
        }),
        feeAPI.getFeeCalculations(0, {
          startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
        })
      ]);

      const funds = fundsRes.data.data || [];
      const investors = investorsRes.data.data || [];
      const activities = activitiesRes.data.data || [];
      const fees = feesRes.data.data || [];

      // Calculate metrics
      const totalAUM = funds.reduce((sum, fund) => sum + (fund.currentNAV || 0), 0);
      const previousAUM = funds.reduce((sum, fund) => sum + (fund.previousNAV || fund.currentNAV || 0), 0);
      const aumChange = previousAUM > 0 ? ((totalAUM - previousAUM) / previousAUM) * 100 : 0;

      const activeFunds = funds.filter(f => f.status === 'active').length;
      const activeInvestors = investors.filter(i => i.status === 'active').length;
      
      const totalCommitments = funds.reduce((sum, fund) => sum + (fund.totalCommitments || 0), 0);
      const unfundedCommitments = funds.reduce((sum, fund) => sum + (fund.unfundedCommitments || 0), 0);

      const currentYear = new Date().getFullYear();
      const ytdActivities = activities.filter(a => new Date(a.eventDate).getFullYear() === currentYear);
      const ytdCapitalCalls = ytdActivities
        .filter(a => a.activityType === 'capital_call')
        .reduce((sum, a) => sum + (a.totalAmount || 0), 0);
      const ytdDistributions = ytdActivities
        .filter(a => a.activityType === 'distribution')
        .reduce((sum, a) => sum + (a.totalAmount || 0), 0);

      const pendingActivities = activities.filter(a => a.status === 'pending' || a.status === 'draft').length;
      const upcomingFees = fees.filter(f => f.status === 'pending').length;

      // Calculate average performance metrics
      const fundPerformance = funds.filter(f => f.performance);
      const averageIRR = fundPerformance.length > 0
        ? fundPerformance.reduce((sum, f) => sum + (f.performance?.netIRR || 0), 0) / fundPerformance.length
        : 0;
      const averageMOIC = fundPerformance.length > 0
        ? fundPerformance.reduce((sum, f) => sum + (f.performance?.moic || 0), 0) / fundPerformance.length
        : 0;

      setMetrics({
        totalAUM,
        aumChange,
        totalFunds: funds.length,
        activeFunds,
        totalInvestors: investors.length,
        activeInvestors,
        totalCommitments,
        unfundedCommitments,
        ytdDistributions,
        ytdCapitalCalls,
        averageIRR,
        averageMOIC,
        pendingActivities,
        upcomingFees
      });

      // Prepare chart data
      const aumTrend = generateAUMTrend(funds);
      const fundsByVintage = generateFundsByVintage(funds);
      const capitalActivity = generateCapitalActivityData(activities);
      const feeAnalysis = generateFeeAnalysis(fees);
      const performanceMetrics = generatePerformanceData(funds);
      const investorTypes = generateInvestorTypeData(investors);

      setChartData({
        aumTrend,
        fundsByVintage,
        capitalActivity,
        feeAnalysis,
        performanceMetrics,
        investorTypes
      });

      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAUMTrend = (funds: any[]): any[] => {
    const monthlyData: any = {};
    const today = new Date();
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const month = format(subMonths(today, i), 'MMM yyyy');
      monthlyData[month] = 0;
    }

    // Aggregate AUM by month (simplified - in production would use historical data)
    funds.forEach(fund => {
      const currentMonth = format(today, 'MMM yyyy');
      monthlyData[currentMonth] += fund.currentNAV || 0;
    });

    return Object.entries(monthlyData).map(([month, aum]) => ({ month, aum }));
  };

  const generateFundsByVintage = (funds: any[]): any[] => {
    const vintageData: any = {};
    
    funds.forEach(fund => {
      const vintage = fund.vintage || new Date().getFullYear();
      if (!vintageData[vintage]) {
        vintageData[vintage] = { count: 0, commitments: 0 };
      }
      vintageData[vintage].count += 1;
      vintageData[vintage].commitments += fund.totalCommitments || 0;
    });

    return Object.entries(vintageData)
      .map(([vintage, data]: [string, any]) => ({
        vintage: parseInt(vintage),
        count: data.count,
        commitments: data.commitments
      }))
      .sort((a, b) => a.vintage - b.vintage);
  };

  const generateCapitalActivityData = (activities: any[]): any[] => {
    const monthlyData: any = {};
    const today = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(today, i), 'MMM yyyy');
      monthlyData[month] = { calls: 0, distributions: 0, net: 0 };
    }

    activities.forEach(activity => {
      const month = format(new Date(activity.eventDate), 'MMM yyyy');
      if (monthlyData[month]) {
        if (activity.activityType === 'capital_call') {
          monthlyData[month].calls += activity.totalAmount || 0;
        } else if (activity.activityType === 'distribution') {
          monthlyData[month].distributions += activity.totalAmount || 0;
        }
      }
    });

    return Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
      month,
      calls: data.calls,
      distributions: data.distributions,
      net: data.distributions - data.calls
    }));
  };

  const generateFeeAnalysis = (fees: any[]): any[] => {
    const feeTypes: any = {};
    let totalFees = 0;

    fees.forEach(fee => {
      const type = fee.feeType || 'Other';
      if (!feeTypes[type]) {
        feeTypes[type] = 0;
      }
      feeTypes[type] += fee.calculatedAmount || 0;
      totalFees += fee.calculatedAmount || 0;
    });

    return Object.entries(feeTypes).map(([type, amount]: [string, any]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
      amount,
      percentage: totalFees > 0 ? (amount / totalFees) * 100 : 0
    }));
  };

  const generatePerformanceData = (funds: any[]): any[] => {
    return funds
      .filter(f => f.performance)
      .slice(0, 10)
      .map(fund => ({
        fund: fund.name || fund.code,
        irr: fund.performance?.netIRR || 0,
        moic: fund.performance?.moic || 0,
        dpi: fund.performance?.dpi || 0
      }))
      .sort((a, b) => b.irr - a.irr);
  };

  const generateInvestorTypeData = (investors: any[]): any[] => {
    const typeData: any = {};
    
    investors.forEach(investor => {
      const type = investor.type || 'Other';
      if (!typeData[type]) {
        typeData[type] = { count: 0, commitments: 0 };
      }
      typeData[type].count += 1;
      typeData[type].commitments += investor.totalCommitments || 0;
    });

    return Object.entries(typeData).map(([type, data]: [string, any]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
      count: data.count,
      commitments: data.commitments
    }));
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <IconButton size="small" onClick={fetchDashboardData}>
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" gutterBottom>
            Executive Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Last updated: {format(lastRefresh, 'MMM dd, yyyy HH:mm')}
          </Typography>
        </div>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchDashboardData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Chip
            icon={<NotificationsIcon />}
            label={`${metrics?.pendingActivities || 0} Pending Actions`}
            color={metrics?.pendingActivities ? 'warning' : 'default'}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <div>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Total AUM
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(metrics?.totalAUM || 0)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    {metrics && metrics.aumChange >= 0 ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      color={metrics && metrics.aumChange >= 0 ? 'success.main' : 'error.main'}
                      ml={0.5}
                    >
                      {formatPercentage(metrics?.aumChange || 0)}
                    </Typography>
                  </Box>
                </div>
                <AccountBalanceIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <div>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Active Funds
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {metrics?.activeFunds || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    of {metrics?.totalFunds || 0} total
                  </Typography>
                </div>
                <PieChartIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <div>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Total Commitments
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(metrics?.totalCommitments || 0)}
                  </Typography>
                  <Box mt={1}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        metrics && metrics.totalCommitments > 0
                          ? ((metrics.totalCommitments - metrics.unfundedCommitments) / metrics.totalCommitments) * 100
                          : 0
                      }
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="textSecondary" mt={0.5}>
                      {formatCurrency(metrics?.unfundedCommitments || 0)} unfunded
                    </Typography>
                  </Box>
                </div>
                <AttachMoneyIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <div>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Active Investors
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {metrics?.activeInvestors || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    of {metrics?.totalInvestors || 0} total
                  </Typography>
                </div>
                <GroupIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              YTD Capital Activity
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Capital Calls
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(metrics?.ytdCapitalCalls || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Distributions
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(metrics?.ytdDistributions || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  Net Cash Flow
                </Typography>
                <Typography
                  variant="h6"
                  color={
                    (metrics?.ytdDistributions || 0) - (metrics?.ytdCapitalCalls || 0) >= 0
                      ? 'success.main'
                      : 'error.main'
                  }
                >
                  {formatCurrency((metrics?.ytdDistributions || 0) - (metrics?.ytdCapitalCalls || 0))}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Average Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Net IRR
                  </Typography>
                  <Typography variant="h6">
                    {metrics?.averageIRR?.toFixed(1) || 0}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    MOIC
                  </Typography>
                  <Typography variant="h6">
                    {metrics?.averageMOIC?.toFixed(2) || 0}x
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* AUM Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              AUM Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData?.aumTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                <Area
                  type="monotone"
                  dataKey="aum"
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.primary.light}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Investor Types */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Investor Composition
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData?.investorTypes || []}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.type}: ${entry.count}`}
                >
                  {chartData?.investorTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Capital Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Capital Activity Flow
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData?.capitalActivity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="calls" fill={theme.palette.primary.main} name="Capital Calls" />
                <Bar dataKey="distributions" fill={theme.palette.success.main} name="Distributions" />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke={theme.palette.warning.main}
                  strokeWidth={2}
                  name="Net Flow"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Performing Funds */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Performing Funds
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData?.performanceMetrics?.slice(0, 5) || []}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fund" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="irr" fill={theme.palette.primary.main} name="IRR %" />
                <Bar dataKey="moic" fill={theme.palette.secondary.main} name="MOIC" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Funds by Vintage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Funds by Vintage Year
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData?.fundsByVintage || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vintage" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value)} />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill={theme.palette.primary.main} name="Fund Count" />
                <Bar
                  yAxisId="right"
                  dataKey="commitments"
                  fill={theme.palette.secondary.main}
                  name="Total Commitments"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Fee Analysis */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Fee Composition
            </Typography>
            {chartData?.feeAnalysis && chartData.feeAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.feeAnalysis}
                    dataKey="amount"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.type}: ${formatCurrency(entry.amount)}`}
                  >
                    {chartData.feeAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <Typography variant="body2" color="textSecondary">
                  No fee data available for the current period
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;