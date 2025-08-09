import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Button,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fundAPI, investorAPI, capitalActivityAPI, feeAPI } from '../../services/api';
import { DashboardTemplate, MetricCard } from '../common/PageTemplate/DashboardTemplate';

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

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [fundsRes, investorsRes, activitiesRes, feesRes] = await Promise.all([
        fundAPI.getAll({ limit: 100 }),
        investorAPI.getAll({ limit: 100 }),
        capitalActivityAPI.getAll({ page: 1, limit: 100 }),
        feeAPI.getFeeCalculations(0, {
          startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
        })
      ]);

      const funds = fundsRes.data.data || [];
      const investors = investorsRes.data.data || [];
      const activities = activitiesRes.data.data || [];
      const fees = feesRes.data.data || [];

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

      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
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

  // Prepare metrics for the template
  const dashboardMetrics: MetricCard[] = [
    {
      title: 'Total AUM',
      value: formatCurrency(metrics?.totalAUM || 0),
      change: {
        value: metrics?.aumChange || 0,
        trend: metrics?.aumChange && metrics.aumChange >= 0 ? 'up' : 'down'
      },
      loading
    },
    {
      title: 'Active Funds',
      value: `${metrics?.activeFunds || 0}${metrics ? ` of ${metrics.totalFunds}` : ''}`,
      loading
    },
    {
      title: 'Total Commitments',
      value: formatCurrency(metrics?.totalCommitments || 0),
      loading
    },
    {
      title: 'Active Investors',
      value: `${metrics?.activeInvestors || 0}${metrics ? ` of ${metrics.totalInvestors}` : ''}`,
      loading
    }
  ];

  // Error state
  if (error && !loading) {
    return (
      <DashboardTemplate
        title="Executive Dashboard"
        subtitle="Error loading dashboard data"
        actions={
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
          >
            Retry
          </Button>
        }
      >
        <Alert severity="error">
          {error}
        </Alert>
      </DashboardTemplate>
    );
  }

  return (
    <DashboardTemplate
      title="Executive Dashboard"
      subtitle={`Last updated: ${format(lastRefresh, 'MMM dd, yyyy HH:mm')}`}
      metrics={dashboardMetrics}
      loading={loading}
      actions={
        <>
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
        </>
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          {/* YTD Capital Activity */}
          <Paper sx={{ p: 3, flex: '1 1 calc(50% - 12px)', minWidth: 400 }}>
            <Typography variant="h6" gutterBottom>
              YTD Capital Activity
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 calc(50% - 4px)' }}>
                <Typography variant="body2" color="text.secondary">
                  Capital Calls
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(metrics?.ytdCapitalCalls || 0)}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 calc(50% - 4px)' }}>
                <Typography variant="body2" color="text.secondary">
                  Distributions
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(metrics?.ytdDistributions || 0)}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 100%' }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
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
              </Box>
            </Box>
          </Paper>

          {/* Average Performance */}
          <Paper sx={{ p: 3, flex: '1 1 calc(50% - 12px)', minWidth: 400 }}>
            <Typography variant="h6" gutterBottom>
              Average Performance
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 calc(50% - 4px)' }}>
                <Typography variant="body2" color="text.secondary">
                  Net IRR
                </Typography>
                <Typography variant="h6">
                  {metrics?.averageIRR?.toFixed(1) || 0}%
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 calc(50% - 4px)' }}>
                <Typography variant="body2" color="text.secondary">
                  MOIC
                </Typography>
                <Typography variant="h6">
                  {metrics?.averageMOIC?.toFixed(2) || 0}x
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </DashboardTemplate>
  );
};

export default Dashboard;