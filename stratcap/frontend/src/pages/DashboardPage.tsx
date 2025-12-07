import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  List,
  ListItem
} from '@mui/material';
import {
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { DashboardTemplate, MetricCard } from '../components/common/PageTemplate/DashboardTemplate';
import { RootState } from '../store/store';

const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Convert stats to MetricCard format for DashboardTemplate
  const dashboardMetrics: MetricCard[] = [
    {
      title: 'Total Fund Families',
      value: '12',
      change: {
        value: 2,
        trend: 'up'
      }
    },
    {
      title: 'Active Funds',
      value: '24',
      change: {
        value: 3,
        trend: 'up'
      }
    },
    {
      title: 'Total Investors',
      value: '156',
      change: {
        value: 12,
        trend: 'up'
      }
    },
    {
      title: 'AUM',
      value: '$2.4B',
      change: {
        value: 8.2,
        trend: 'up'
      }
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'Capital Call',
      fund: 'Growth Fund III',
      amount: '$50M',
      date: '2024-01-15',
      status: 'Pending',
    },
    {
      id: 2,
      type: 'Distribution',
      fund: 'Opportunity Fund II',
      amount: '$25M',
      date: '2024-01-14',
      status: 'Completed',
    },
    {
      id: 3,
      type: 'New Commitment',
      fund: 'Growth Fund III',
      amount: '$100M',
      date: '2024-01-13',
      status: 'Active',
    },
  ];

  const getStatusColor = (status: string): 'success' | 'warning' | 'primary' => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Pending':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <DashboardTemplate
      title={`Welcome back, ${user?.firstName}!`}
      subtitle="Here&apos;s an overview of your fund administration platform."
      metrics={dashboardMetrics}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Recent Activities */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" color="text.primary">
                Recent Activities
              </Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {recentActivities.map((activity) => (
                <ListItem
                  key={activity.id}
                  sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {activity.type} - {activity.fund}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.amount} • {activity.date}
                    </Typography>
                  </Box>
                  <Chip
                    label={activity.status}
                    color={getStatusColor(activity.status)}
                    size="small"
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" color="text.primary" sx={{ mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={3}>
                <Button variant="contained" fullWidth sx={{ py: 1.5 }}>
                  Create Capital Call
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Button variant="outlined" fullWidth sx={{ py: 1.5 }}>
                  Add New Investor
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Button variant="outlined" fullWidth sx={{ py: 1.5 }}>
                  Generate Report
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Button variant="outlined" fullWidth sx={{ py: 1.5 }}>
                  View Transactions
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </DashboardTemplate>
  );
};

export default DashboardPage;