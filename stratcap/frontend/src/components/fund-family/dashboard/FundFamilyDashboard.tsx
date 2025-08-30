import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Menu,
  MenuItem,
  IconButton,
  Alert,
  Skeleton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { useNavigate } from 'react-router-dom';

import { AppDispatch, RootState } from '../../../store';
import { fetchFundFamilies } from '../../../store/slices/fundFamilySlice';
import FundFamilySummary from './FundFamilySummary';
import FundFamilyMetrics from './FundFamilyMetrics';
import FundFamilyActivityFeed from './FundFamilyActivityFeed';

// Enhanced metric interfaces
interface MetricData {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
    period: string;
  };
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  progress?: number;
  target?: string | number;
  benchmark?: string | number;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
  trend?: number;
}

// Mock data generators for demonstration
const generatePerformanceData = () => {
  const data = [];
  const currentDate = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);
    data.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      aum: Math.random() * 1000 + 8000,
      distributions: Math.random() * 200 + 100,
      capitalCalls: Math.random() * 150 + 50,
      netReturns: Math.random() * 20 - 5
    });
  }
  return data;
};

const FundFamilyDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { fundFamilies, isLoading, error } = useSelector((state: RootState) => state.fundFamily);
  
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'YTD'>('YTD');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchFundFamilies());
  }, [dispatch]);

  // Enhanced metrics calculation
  const calculateMetrics = (): MetricData[] => {
    const totalFunds = fundFamilies.reduce((sum, ff) => sum + (ff.fundCount || 0), 0);
    const totalAUM = fundFamilies.reduce((sum, ff) => sum + (ff.totalAUM || 0), 0);
    const totalInvestors = fundFamilies.reduce((sum, ff) => sum + (ff.investorCount || 0), 0);
    const avgIRR = fundFamilies.length > 0 
      ? fundFamilies.reduce((sum, ff) => sum + (ff.averageIRR || 0), 0) / fundFamilies.length 
      : 0;

    return [
      {
        title: 'Total AUM',
        value: formatCurrency(totalAUM),
        subtitle: 'Across all fund families',
        trend: { direction: 'up', percentage: 12.5, period: 'vs last quarter' },
        icon: <AccountBalanceIcon />,
        color: 'primary',
        progress: 85,
        target: formatCurrency(15000000000),
        benchmark: formatCurrency(12000000000)
      },
      {
        title: 'Active Fund Families',
        value: fundFamilies.filter(ff => ff.status === 'active').length,
        subtitle: `${fundFamilies.length} total families`,
        trend: { direction: 'up', percentage: 8.3, period: 'vs last month' },
        icon: <BusinessIcon />,
        color: 'secondary',
        progress: 90
      },
      {
        title: 'Total Funds',
        value: totalFunds,
        subtitle: 'Active investment vehicles',
        trend: { direction: 'up', percentage: 5.2, period: 'vs last quarter' },
        icon: <TimelineIcon />,
        color: 'info',
        progress: 75,
        target: 40
      },
      {
        title: 'LP Relationships',
        value: totalInvestors.toLocaleString(),
        subtitle: 'Across all funds',
        trend: { direction: 'up', percentage: 15.7, period: 'vs last year' },
        icon: <PeopleIcon />,
        color: 'success',
        progress: 88
      },
      {
        title: 'Weighted Avg IRR',
        value: `${avgIRR.toFixed(1)}%`,
        subtitle: 'Portfolio performance',
        trend: { direction: 'up', percentage: 2.3, period: 'vs benchmark' },
        icon: <TrendingUpIcon />,
        color: 'warning',
        progress: 92,
        benchmark: '12.5%',
        target: '18.0%'
      },
      {
        title: 'Recent Activity',
        value: '24',
        subtitle: 'Capital events this month',
        trend: { direction: 'down', percentage: 8.1, period: 'vs last month' },
        icon: <BusinessIcon />,
        color: 'error',
        progress: 65
      }
    ];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1e9 ? 'compact' : 'standard'
    }).format(amount);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchFundFamilies());
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const performanceData = generatePerformanceData();
  const metrics = calculateMetrics();

  // Status distribution data
  const statusData: ChartData[] = [
    { name: 'Active', value: fundFamilies.filter(ff => ff.status === 'active').length, color: '#10B981' },
    { name: 'Inactive', value: fundFamilies.filter(ff => ff.status === 'inactive').length, color: '#F59E0B' },
    { name: 'Archived', value: fundFamilies.filter(ff => ff.status === 'archived').length, color: '#EF4444' }
  ];

  // AUM distribution by fund family
  const aumData: ChartData[] = fundFamilies
    .filter(ff => ff.totalAUM && ff.totalAUM > 0)
    .sort((a, b) => (b.totalAUM || 0) - (a.totalAUM || 0))
    .slice(0, 6)
    .map(ff => ({
      name: ff.name.length > 12 ? ff.name.substring(0, 12) + '...' : ff.name,
      value: ff.totalAUM || 0,
      percentage: ((ff.totalAUM || 0) / metrics[0].value as number) * 100
    }));

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => dispatch(fetchFundFamilies())}>
            Retry
          </Button>
        }>
          Error loading fund family dashboard: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Fund Family Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Portfolio overview and key performance metrics
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Period Selector */}
          <Box sx={{ display: 'flex', bgcolor: 'background.paper', borderRadius: 1, p: 0.5 }}>
            {(['1M', '3M', '6M', '1Y', 'YTD'] as const).map((period) => (
              <Button
                key={period}
                size="small"
                variant={selectedPeriod === period ? 'contained' : 'text'}
                onClick={() => setSelectedPeriod(period)}
                sx={{ minWidth: 45, fontSize: '0.75rem' }}
              >
                {period}
              </Button>
            ))}
          </Box>

          <IconButton onClick={handleRefresh} disabled={refreshing} color="primary">
            <RefreshIcon />
          </IconButton>

          <IconButton onClick={handleMenuClick} color="primary">
            <MoreVertIcon />
          </IconButton>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/fund-families/new')}
            sx={{ ml: 1 }}
          >
            New Fund Family
          </Button>
        </Box>
      </Box>

      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Quick Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { navigate('/fund-families'); handleMenuClose(); }}>
          <FilterListIcon sx={{ mr: 1 }} />
          Manage Fund Families
        </MenuItem>
        <MenuItem onClick={() => { navigate('/analytics/fund-families'); handleMenuClose(); }}>
          <TrendingUpIcon sx={{ mr: 1 }} />
          Advanced Analytics
        </MenuItem>
      </Menu>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12}>
          <FundFamilySummary metrics={metrics} loading={isLoading} />
        </Grid>

        {/* Key Metrics */}
        <Grid item xs={12}>
          <FundFamilyMetrics 
            performanceData={performanceData}
            statusData={statusData}
            aumData={aumData}
            selectedPeriod={selectedPeriod}
            loading={isLoading}
          />
        </Grid>

        {/* Charts Section */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="600">
                  Portfolio Performance Trends
                </Typography>
                <Chip 
                  label={`${selectedPeriod} View`} 
                  color="primary" 
                  variant="outlined" 
                  size="small"
                />
              </Box>
              
              {isLoading ? (
                <Skeleton variant="rectangular" height={350} />
              ) : (
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="aumGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="returnsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                      <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: string) => [
                          name === 'aum' ? formatCurrency(value) : 
                          name === 'netReturns' ? `${value.toFixed(1)}%` :
                          formatCurrency(value),
                          name === 'aum' ? 'AUM' :
                          name === 'netReturns' ? 'Net Returns' :
                          name === 'distributions' ? 'Distributions' : 'Capital Calls'
                        ]}
                      />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="aum" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        fill="url(#aumGradient)" 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="netReturns" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Distribution Charts */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Status Distribution
                  </Typography>
                  {isLoading ? (
                    <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
                  ) : (
                    <Box sx={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Top Fund Families by AUM
                  </Typography>
                  {isLoading ? (
                    <Box>
                      {[1,2,3,4].map(i => (
                        <Skeleton key={i} height={24} sx={{ mb: 1 }} />
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      {aumData.slice(0, 4).map((item, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight="500">
                              {item.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(item.value)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={item.percentage || 0}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: `hsl(${210 + index * 30}, 70%, 50%)`
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Activity Feed */}
        <Grid item xs={12}>
          <FundFamilyActivityFeed />
        </Grid>
      </Grid>
    </Box>
  );
};

export default FundFamilyDashboard;