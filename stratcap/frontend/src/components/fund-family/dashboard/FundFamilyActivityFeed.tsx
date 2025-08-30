import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Button,
  Divider,
  Menu,
  MenuItem,
  Badge,
  Skeleton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface ActivityItem {
  id: string;
  type: 'capital_call' | 'distribution' | 'fund_creation' | 'investor_update' | 'performance_update' | 'compliance_alert';
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'in_progress' | 'alert';
  entityName: string;
  amount?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Mock activity data
const generateActivityData = (): ActivityItem[] => {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'capital_call',
      title: 'Capital Call Issued',
      description: 'Capital call for $15M issued to Fund III investors',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'completed',
      entityName: 'Growth Equity Fund III',
      amount: 15000000,
      priority: 'high'
    },
    {
      id: '2',
      type: 'distribution',
      title: 'Distribution Processed',
      description: 'Quarterly distribution of $8.5M to LP investors',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'completed',
      entityName: 'Technology Fund II',
      amount: 8500000,
      priority: 'medium'
    },
    {
      id: '3',
      type: 'performance_update',
      title: 'Performance Report Generated',
      description: 'Q3 2024 performance report completed',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'completed',
      entityName: 'Healthcare Ventures',
      priority: 'low'
    },
    {
      id: '4',
      type: 'investor_update',
      title: 'New LP Commitment',
      description: 'New institutional investor committed $25M',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      status: 'in_progress',
      entityName: 'Real Estate Fund IV',
      amount: 25000000,
      priority: 'high'
    },
    {
      id: '5',
      type: 'fund_creation',
      title: 'Fund Structure Finalized',
      description: 'Legal documentation and fund structure completed',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      status: 'completed',
      entityName: 'Infrastructure Fund I',
      priority: 'medium'
    },
    {
      id: '6',
      type: 'compliance_alert',
      title: 'Regulatory Filing Due',
      description: 'Form ADV annual amendment due in 7 days',
      timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000),
      status: 'alert',
      entityName: 'Growth Equity Fund Family',
      priority: 'critical'
    },
    {
      id: '7',
      type: 'capital_call',
      title: 'Capital Call Notice Sent',
      description: 'Notice for $20M capital call sent to investors',
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
      status: 'pending',
      entityName: 'Venture Fund V',
      amount: 20000000,
      priority: 'high'
    },
    {
      id: '8',
      type: 'performance_update',
      title: 'NAV Calculation Completed',
      description: 'Monthly NAV updated for all fund entities',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'completed',
      entityName: 'Multi-Strategy Fund',
      priority: 'medium'
    }
  ];

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const FundFamilyActivityFeed: React.FC = () => {
  const [activities] = useState<ActivityItem[]>(generateActivityData());
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high_priority' | 'today' | 'alerts'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1e6 ? 'compact' : 'standard'
    }).format(amount);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'capital_call':
        return <TrendingUpIcon />;
      case 'distribution':
        return <AccountBalanceIcon />;
      case 'fund_creation':
        return <BusinessIcon />;
      case 'investor_update':
        return <PeopleIcon />;
      case 'performance_update':
        return <TrendingUpIcon />;
      case 'compliance_alert':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getActivityColor = (type: ActivityItem['type'], status: ActivityItem['status']) => {
    if (status === 'alert') return 'error';
    
    switch (type) {
      case 'capital_call':
        return 'primary';
      case 'distribution':
        return 'success';
      case 'fund_creation':
        return 'secondary';
      case 'investor_update':
        return 'info';
      case 'performance_update':
        return 'warning';
      case 'compliance_alert':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: ActivityItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'pending':
        return <ScheduleIcon fontSize="small" color="warning" />;
      case 'in_progress':
        return <RefreshIcon fontSize="small" color="info" />;
      case 'alert':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const filteredActivities = activities.filter(activity => {
    switch (filter) {
      case 'high_priority':
        return activity.priority === 'high' || activity.priority === 'critical';
      case 'today':
        return activity.timestamp.toDateString() === new Date().toDateString();
      case 'alerts':
        return activity.status === 'alert';
      default:
        return true;
    }
  }).slice(0, 10); // Show only top 10 activities

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => setLoading(false), 1000);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const alertCount = activities.filter(a => a.status === 'alert').length;
  const pendingCount = activities.filter(a => a.status === 'pending').length;

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight="600">
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latest updates across your fund portfolio
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Activity Summary Badges */}
            <Badge badgeContent={alertCount} color="error" sx={{ mr: 1 }}>
              <Chip
                label="Alerts"
                size="small"
                color={filter === 'alerts' ? 'error' : 'default'}
                variant={filter === 'alerts' ? 'filled' : 'outlined'}
                onClick={() => setFilter(filter === 'alerts' ? 'all' : 'alerts')}
                clickable
              />
            </Badge>
            
            <Badge badgeContent={pendingCount} color="warning" sx={{ mr: 1 }}>
              <Chip
                label="Pending"
                size="small"
                color={filter === 'high_priority' ? 'warning' : 'default'}
                variant={filter === 'high_priority' ? 'filled' : 'outlined'}
                onClick={() => setFilter(filter === 'high_priority' ? 'all' : 'high_priority')}
                clickable
              />
            </Badge>

            <IconButton onClick={handleRefresh} disabled={loading} size="small">
              <RefreshIcon />
            </IconButton>
            
            <IconButton onClick={handleMenuClick} size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Filter Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {[
            { key: 'all' as const, label: 'All Activities' },
            { key: 'today' as const, label: 'Today' },
            { key: 'high_priority' as const, label: 'High Priority' },
            { key: 'alerts' as const, label: 'Alerts Only' }
          ].map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              size="small"
              variant={filter === key ? 'filled' : 'outlined'}
              color={filter === key ? 'primary' : 'default'}
              onClick={() => setFilter(key)}
              clickable
            />
          ))}
        </Box>

        {/* Activity List */}
        {loading ? (
          <Box>
            {[1, 2, 3, 4, 5].map(i => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="60%" height={20} sx={{ mb: 0.5 }} />
                  <Skeleton width="80%" height={16} sx={{ mb: 0.5 }} />
                  <Skeleton width="40%" height={14} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem 
                  sx={{ 
                    px: 0,
                    py: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderRadius: 1
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        backgroundColor: `${getActivityColor(activity.type, activity.status)}.light`,
                        color: `${getActivityColor(activity.type, activity.status)}.main`
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="600">
                          {activity.title}
                        </Typography>
                        {getStatusIcon(activity.status)}
                        {activity.priority === 'critical' && (
                          <Chip
                            label="CRITICAL"
                            size="small"
                            color="error"
                            sx={{ height: 16, fontSize: '0.6rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {activity.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={activity.entityName}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          {activity.amount && (
                            <Chip
                              label={formatCurrency(activity.amount)}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                          )}
                          <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                            {formatTimestamp(activity.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < filteredActivities.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Show More Button */}
        {!loading && filteredActivities.length >= 10 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button variant="outlined" size="small">
              View All Activity
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <FilterListIcon sx={{ mr: 1 }} />
          Advanced Filters
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <RefreshIcon sx={{ mr: 1 }} />
          Auto Refresh
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Export Activity Log
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default FundFamilyActivityFeed;