import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton
} from '@mui/material';
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
  ComposedChart,
  Area
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
  trend?: number;
}

interface PerformanceData {
  month: string;
  aum: number;
  distributions: number;
  capitalCalls: number;
  netReturns: number;
}

interface FundFamilyMetricsProps {
  performanceData: PerformanceData[];
  statusData: ChartData[];
  aumData: ChartData[];
  selectedPeriod: string;
  loading?: boolean;
}

const FundFamilyMetrics: React.FC<FundFamilyMetricsProps> = ({ 
  performanceData, 
  statusData, 
  aumData, 
  selectedPeriod,
  loading = false 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1e9 ? 'compact' : 'standard'
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #E5E7EB',
            borderRadius: 2,
            p: 2,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                  mr: 1
                }}
              />
              <Typography variant="caption" sx={{ mr: 1 }}>
                {entry.dataKey === 'aum' ? 'AUM' :
                 entry.dataKey === 'distributions' ? 'Distributions' :
                 entry.dataKey === 'capitalCalls' ? 'Capital Calls' :
                 entry.dataKey === 'netReturns' ? 'Net Returns' : entry.dataKey}:
              </Typography>
              <Typography variant="caption" fontWeight="600">
                {entry.dataKey === 'netReturns' ? `${entry.value.toFixed(1)}%` : formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Generate quarterly performance summary
  const quarterlyData = React.useMemo(() => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarters.map(quarter => ({
      quarter,
      capitalCalls: Math.random() * 500 + 200,
      distributions: Math.random() * 400 + 100,
      netCashFlow: Math.random() * 200 - 100,
      irr: Math.random() * 15 + 5
    }));
  }, []);

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Skeleton width="40%" height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={300} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Skeleton width="60%" height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Main Performance Chart */}
      <Grid item xs={12} lg={8}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="600">
                Capital Activity Trends
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={`${selectedPeriod} Period`} 
                  color="primary" 
                  variant="outlined" 
                  size="small"
                />
                <Chip 
                  label="Live Data" 
                  color="success" 
                  size="small"
                  sx={{ '&::before': { content: '"●"', mr: 0.5, color: 'success.main' } }}
                />
              </Box>
            </Box>
            
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6B7280" 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#6B7280" 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#6B7280" 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Bar 
                    yAxisId="left"
                    dataKey="capitalCalls" 
                    fill="#3B82F6" 
                    name="Capital Calls"
                    radius={[2, 2, 0, 0]}
                    opacity={0.8}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="distributions" 
                    fill="#10B981" 
                    name="Distributions"
                    radius={[2, 2, 0, 0]}
                    opacity={0.8}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="netReturns" 
                    stroke="#F59E0B" 
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                    name="Net Returns %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
              {[
                { label: 'Capital Calls', color: '#3B82F6' },
                { label: 'Distributions', color: '#10B981' },
                { label: 'Net Returns %', color: '#F59E0B' }
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 1,
                      backgroundColor: item.color,
                      mr: 1
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Side Panel with Multiple Charts */}
      <Grid item xs={12} lg={4}>
        <Grid container spacing={3}>
          {/* Top Performers Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Top Performing Fund Families
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Family</TableCell>
                        <TableCell align="right">AUM</TableCell>
                        <TableCell align="right">IRR</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aumData.slice(0, 5).map((row, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {row.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="primary.main" fontWeight="600">
                              {formatCurrency(row.value)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${(Math.random() * 20 + 5).toFixed(1)}%`}
                              size="small"
                              color={Math.random() > 0.3 ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Quarterly Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Quarterly Cash Flows
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quarterlyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="quarter" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} tickFormatter={formatCurrency} />
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value), 'Amount']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar 
                        dataKey="capitalCalls" 
                        stackId="a" 
                        fill="#EF4444" 
                        radius={[0, 0, 0, 0]}
                        name="Capital Calls"
                      />
                      <Bar 
                        dataKey="distributions" 
                        stackId="a" 
                        fill="#10B981" 
                        radius={[2, 2, 0, 0]}
                        name="Distributions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Risk Metrics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Risk Metrics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: 'Portfolio Beta', value: '1.15', status: 'warning' },
                    { label: 'Sharpe Ratio', value: '1.42', status: 'success' },
                    { label: 'Max Drawdown', value: '-8.3%', status: 'error' },
                    { label: 'Volatility', value: '12.8%', status: 'info' }
                  ].map((metric) => (
                    <Box key={metric.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {metric.label}
                      </Typography>
                      <Chip
                        label={metric.value}
                        size="small"
                        color={metric.status as any}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default FundFamilyMetrics;