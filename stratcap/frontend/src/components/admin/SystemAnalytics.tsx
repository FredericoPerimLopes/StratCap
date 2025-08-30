import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Speed,
  Storage,
  Security,
  Timeline,
  Assessment,
  Computer,
  NetworkCheck,
  Memory,
  Refresh,
  Warning,
  Error,
  CheckCircle
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { configurationAPI } from '../../services/api';

interface SystemMetrics {
  performance: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_throughput: number;
    response_time: number;
    uptime: number;
  };
  usage: {
    active_users: number;
    total_users: number;
    daily_sessions: number;
    api_requests: number;
    database_queries: number;
    storage_used: number;
  };
  errors: {
    error_rate: number;
    critical_errors: number;
    warnings: number;
    failed_logins: number;
  };
  business: {
    funds_created: number;
    transactions_processed: number;
    reports_generated: number;
    documents_uploaded: number;
  };
}

interface MetricTimeSeries {
  timestamp: string;
  value: number;
  label?: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  components: HealthComponent[];
  overall_score: number;
  last_check: Date;
}

interface HealthComponent {
  name: string;
  status: 'online' | 'warning' | 'offline';
  response_time: number;
  last_check: Date;
  error_message?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#d32f2f', '#7b1fa2', '#00695c'];

export default function SystemAnalytics() {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<{
    performance: MetricTimeSeries[];
    usage: MetricTimeSeries[];
    errors: MetricTimeSeries[];
  } | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadSystemHealth();
    
    // Set up auto-refresh every 30 seconds for real-time data
    const interval = setInterval(() => {
      loadAnalytics();
      loadSystemHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [metricsResponse, healthResponse] = await Promise.all([
        configurationAPI.getSystemMetrics(timeRange),
        configurationAPI.getSystemHealth()
      ]);

      // Mock data structure - in real implementation, this would come from the API
      const mockMetrics: SystemMetrics = {
        performance: {
          cpu_usage: 35.2,
          memory_usage: 68.7,
          disk_usage: 45.3,
          network_throughput: 1250,
          response_time: 145,
          uptime: 99.97
        },
        usage: {
          active_users: 24,
          total_users: 156,
          daily_sessions: 342,
          api_requests: 15420,
          database_queries: 89340,
          storage_used: 2.4
        },
        errors: {
          error_rate: 0.02,
          critical_errors: 0,
          warnings: 5,
          failed_logins: 3
        },
        business: {
          funds_created: 2,
          transactions_processed: 145,
          reports_generated: 28,
          documents_uploaded: 67
        }
      };

      const mockTimeSeriesData = {
        performance: generateTimeSeries('performance', 24),
        usage: generateTimeSeries('usage', 24),
        errors: generateTimeSeries('errors', 24)
      };

      const mockSystemHealth: SystemHealth = {
        status: 'healthy',
        overall_score: 98.5,
        last_check: new Date(),
        components: [
          { name: 'Database', status: 'online', response_time: 12, last_check: new Date() },
          { name: 'API Gateway', status: 'online', response_time: 8, last_check: new Date() },
          { name: 'File Storage', status: 'online', response_time: 15, last_check: new Date() },
          { name: 'Email Service', status: 'warning', response_time: 234, last_check: new Date(), error_message: 'High response time' },
          { name: 'Backup Service', status: 'online', response_time: 45, last_check: new Date() }
        ]
      };

      setMetrics(mockMetrics);
      setTimeSeriesData(mockTimeSeriesData);
      setSystemHealth(mockSystemHealth);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSystemHealth = async () => {
    // This would normally make an API call
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const generateTimeSeries = (type: string, hours: number): MetricTimeSeries[] => {
    const data: MetricTimeSeries[] = [];
    const now = new Date();
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      let value: number;
      
      switch (type) {
        case 'performance':
          value = Math.random() * 100;
          break;
        case 'usage':
          value = Math.floor(Math.random() * 50) + 10;
          break;
        case 'errors':
          value = Math.random() * 5;
          break;
        default:
          value = Math.random() * 100;
      }
      
      data.push({
        timestamp: timestamp.toISOString(),
        value,
        label: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
    
    return data;
  };

  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return { color: 'success', icon: <CheckCircle /> };
      case 'warning':
        return { color: 'warning', icon: <Warning /> };
      case 'critical':
      case 'offline':
        return { color: 'error', icon: <Error /> };
      default:
        return { color: 'default', icon: <CheckCircle /> };
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Key Performance Indicators */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Speed color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">System Performance</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {metrics?.performance.uptime.toFixed(2)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Uptime
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption">
                CPU: {metrics?.performance.cpu_usage.toFixed(1)}% | 
                Memory: {metrics?.performance.memory_usage.toFixed(1)}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <People color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">User Activity</Typography>
            </Box>
            <Typography variant="h4">
              {metrics?.usage.active_users}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active users
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <TrendingUp color="success" fontSize="small" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {metrics?.usage.daily_sessions} sessions today
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assessment color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Business Metrics</Typography>
            </Box>
            <Typography variant="h4">
              {metrics?.business.transactions_processed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Transactions processed
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption">
                {metrics?.business.reports_generated} reports generated
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Security Status</Typography>
            </Box>
            <Typography variant="h4" color={metrics?.errors.critical_errors === 0 ? 'success.main' : 'error.main'}>
              {metrics?.errors.critical_errors}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Critical errors
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption">
                {metrics?.errors.failed_logins} failed logins | 
                {metrics?.errors.warnings} warnings
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* System Health Status */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">System Health</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  icon={getHealthStatus(systemHealth?.status || 'healthy').icon}
                  label={systemHealth?.status.toUpperCase() || 'HEALTHY'}
                  color={getHealthStatus(systemHealth?.status || 'healthy').color as any}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  Score: {systemHealth?.overall_score}%
                </Typography>
                <IconButton size="small" onClick={handleRefresh} disabled={refreshing}>
                  <Refresh />
                </IconButton>
              </Box>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Response Time</TableCell>
                    <TableCell>Last Check</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {systemHealth?.components.map((component) => (
                    <TableRow key={component.name}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Computer sx={{ mr: 1, fontSize: 20 }} />
                          {component.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={getHealthStatus(component.status).icon}
                          label={component.status.toUpperCase()}
                          color={getHealthStatus(component.status).color as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2"
                          color={component.response_time > 200 ? 'warning.main' : 'text.primary'}
                        >
                          {component.response_time}ms
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {component.last_check.toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {component.error_message && (
                          <Tooltip title={component.error_message}>
                            <Chip 
                              label="Issue"
                              color="warning"
                              size="small"
                              icon={<Warning />}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Charts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Performance Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData?.performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis label={{ value: 'Usage %', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#1976d2" 
                    strokeWidth={2}
                    name="Performance Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Activity
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData?.usage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis label={{ value: 'Active Users', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2e7d32" 
                    fill="#2e7d32"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPerformance = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resource Utilization
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                <Typography variant="body2">CPU Usage</Typography>
                <Typography variant="body2">{metrics?.performance.cpu_usage.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.performance.cpu_usage || 0}
                color={metrics && metrics.performance.cpu_usage > 80 ? 'warning' : 'primary'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                <Typography variant="body2">Memory Usage</Typography>
                <Typography variant="body2">{metrics?.performance.memory_usage.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.performance.memory_usage || 0}
                color={metrics && metrics.performance.memory_usage > 85 ? 'error' : 'primary'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                <Typography variant="body2">Disk Usage</Typography>
                <Typography variant="body2">{metrics?.performance.disk_usage.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.performance.disk_usage || 0}
                color={metrics && metrics.performance.disk_usage > 90 ? 'error' : 'success'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Network & Response Times
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {metrics?.performance.response_time}ms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response Time
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {formatBytes((metrics?.performance.network_throughput || 0) * 1024)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Network Throughput
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance History
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData?.performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#1976d2" 
                    strokeWidth={2}
                    name="Performance Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderUsage = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Statistics
            </Typography>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h3" color="primary">
                {metrics?.usage.active_users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5">
                {metrics?.usage.total_users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              API Usage
            </Typography>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h3" color="success.main">
                {formatNumber(metrics?.usage.api_requests || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                API Requests Today
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5">
                {formatNumber(metrics?.usage.database_queries || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Database Queries
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Storage Usage
            </Typography>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h3" color="warning.main">
                {metrics?.usage.storage_used.toFixed(1)} GB
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Storage Used
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5">
                {metrics?.business.documents_uploaded}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Documents Uploaded
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Usage Trends
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData?.usage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2e7d32" 
                    fill="#2e7d32"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading system analytics...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
            <Typography variant="h5">
              System Analytics
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="1h">Last Hour</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                </Select>
              </FormControl>
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>
          
          {systemHealth?.status !== 'healthy' && (
            <Alert 
              severity={systemHealth?.status === 'warning' ? 'warning' : 'error'} 
              sx={{ mt: 2 }}
            >
              System health is {systemHealth?.status}. Please check component status below.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab 
            label={
              <Badge 
                badgeContent={systemHealth?.status !== 'healthy' ? '!' : 0} 
                color="error"
              >
                Overview
              </Badge>
            } 
          />
          <Tab label="Performance" />
          <Tab label="Usage" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {renderOverview()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderPerformance()}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {renderUsage()}
      </TabPanel>
    </Box>
  );
}