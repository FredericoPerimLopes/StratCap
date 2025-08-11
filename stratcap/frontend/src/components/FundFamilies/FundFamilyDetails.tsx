import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchFundFamilyById, fetchFundFamilySummary } from '../../store/slices/fundFamilySlice';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Business as BuildingOfficeIcon,
  AttachMoney as CurrencyDollarIcon,
  MonetizationOn as BanknotesIcon,
  People as UsersIcon,
  BarChart as ChartBarIcon,
  Edit as PencilIcon,
  Settings as Cog6ToothIcon,
  ArrowBack as ArrowLeftIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as XCircleIcon
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
  Line
} from 'recharts';

interface FundData {
  id: number;
  name: string;
  vintage: number;
  targetSize: number;
  committedCapital: number;
  calledCapital: number;
  distributedCapital: number;
  status: 'fundraising' | 'investing' | 'harvesting' | 'closed';
  irr: number;
  multiple: number;
}

const FundFamilyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { currentFundFamily, loading, error } = useSelector((state: RootState) => state.fundFamily);
  const [activeTab, setActiveTab] = useState<'overview' | 'funds' | 'performance' | 'settings'>('overview');
  const [funds, setFunds] = useState<FundData[]>([]);

  useEffect(() => {
    if (id) {
      dispatch(fetchFundFamilyById(Number(id)));
      dispatch(fetchFundFamilySummary(Number(id)));
    }
  }, [dispatch, id]);

  useEffect(() => {
    // Fetch funds data from API when fund family is loaded
    const fetchFunds = async () => {
      if (currentFundFamily) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/funds?fundFamilyId=${currentFundFamily.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const fundsData = data.data || [];
            
            // Transform API data to match our interface
            const transformedFunds: FundData[] = fundsData.map((fund: any) => ({
              id: fund.id,
              name: fund.name,
              vintage: fund.vintage,
              targetSize: parseFloat(fund.targetSize || '0'),
              committedCapital: parseFloat(fund.committedCapital || '0'),
              calledCapital: parseFloat(fund.calledCapital || '0'),
              distributedCapital: parseFloat(fund.distributedCapital || '0'),
              status: fund.status,
              irr: parseFloat(fund.irr || '0'),
              multiple: parseFloat(fund.multiple || '1.0')
            }));
            
            setFunds(transformedFunds);
          } else {
            console.error('Failed to fetch funds:', response.statusText);
            // Fallback to empty array
            setFunds([]);
          }
        } catch (error) {
          console.error('Error fetching funds:', error);
          // Fallback to empty array
          setFunds([]);
        }
      }
    };

    fetchFunds();
  }, [currentFundFamily]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1e9 ? 'compact' : 'standard'
    }).format(amount);
  };



  // Generate performance data from actual funds
  const performanceData = funds.map(fund => ({
    name: fund.name,
    vintage: fund.vintage,
    irr: fund.irr,
    multiple: fund.multiple,
    status: fund.status
  }));

  // Calculate summary metrics from real data
  const summaryMetrics = {
    totalFunds: funds.length,
    totalTargetSize: funds.reduce((sum, fund) => sum + fund.targetSize, 0),
    totalCommitted: funds.reduce((sum, fund) => sum + fund.committedCapital, 0),
    totalCalled: funds.reduce((sum, fund) => sum + fund.calledCapital, 0),
    totalDistributed: funds.reduce((sum, fund) => sum + fund.distributedCapital, 0),
    averageIRR: funds.length > 0 ? funds.reduce((sum, fund) => sum + fund.irr, 0) / funds.length : 0,
    averageMultiple: funds.length > 0 ? funds.reduce((sum, fund) => sum + fund.multiple, 0) / funds.length : 0
  };

  // Generate status distribution for pie chart
  const statusCounts = funds.reduce((acc, fund) => {
    acc[fund.status] = (acc[fund.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusDistribution = Object.entries(statusCounts).map(([status, count], index) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][index] || '#6B7280'
  }));

  // Generate vintage distribution
  const vintageData = funds.reduce((acc, fund) => {
    const vintage = fund.vintage.toString();
    const existing = acc.find(item => item.year === vintage);
    if (existing) {
      existing.count += 1;
      existing.totalSize += fund.targetSize;
    } else {
      acc.push({
        year: vintage,
        count: 1,
        totalSize: fund.targetSize,
        avgIRR: fund.irr
      });
    }
    return acc;
  }, [] as Array<{year: string, count: number, totalSize: number, avgIRR: number}>);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error || !currentFundFamily) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading fund family details</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                startIcon={<ArrowLeftIcon />}
                onClick={() => navigate('/fund-families')}
                sx={{ mr: 2 }}
              >
                Back
              </Button>
              <BuildingOfficeIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                  {currentFundFamily.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Code: {currentFundFamily.code}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                component={Link}
                to={`/fund-families/${id}/edit`}
                variant="outlined"
                startIcon={<PencilIcon />}
              >
                Edit
              </Button>
              <Button
                component={Link}
                to={`/fund-families/${id}/configuration`}
                variant="contained"
                startIcon={<Cog6ToothIcon />}
              >
                Configuration
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid xs={12} md={3}>
              <Box sx={{ borderLeft: 4, borderColor: 'primary.main', pl: 2 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label={currentFundFamily.status} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid xs={12} md={3}>
              <Box sx={{ borderLeft: 4, borderColor: 'success.main', pl: 2 }}>
                <Typography variant="body2" color="text.secondary">Management Company</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {currentFundFamily.managementCompany}
                </Typography>
              </Box>
            </Grid>
            <Grid xs={12} md={3}>
              <Box sx={{ borderLeft: 4, borderColor: 'secondary.main', pl: 2 }}>
                <Typography variant="body2" color="text.secondary">Primary Currency</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {currentFundFamily.primaryCurrency}
                </Typography>
              </Box>
            </Grid>
            <Grid xs={12} md={3}>
              <Box sx={{ borderLeft: 4, borderColor: 'warning.main', pl: 2 }}>
                <Typography variant="body2" color="text.secondary">Fiscal Year End</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {new Date(currentFundFamily.fiscalYearEnd).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CurrencyDollarIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Committed</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(summaryMetrics.totalCommitted)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BanknotesIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Funds</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {summaryMetrics.totalFunds}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <UsersIcon sx={{ fontSize: 32, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Called</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(summaryMetrics.totalCalled)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ChartBarIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Avg IRR</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {summaryMetrics.averageIRR.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CurrencyDollarIcon sx={{ fontSize: 32, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Distributed</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(summaryMetrics.totalDistributed)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ChartBarIcon sx={{ fontSize: 32, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Avg Multiple</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {summaryMetrics.averageMultiple.toFixed(2)}x
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(event, newValue) => setActiveTab(newValue)}
            aria-label="fund family details tabs"
          >
            <Tab label="Overview" value="overview" />
            <Tab label="Funds" value="funds" />
            <Tab label="Performance" value="performance" />
            <Tab label="Settings" value="settings" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Grid container spacing={3}>
                <Grid xs={12} lg={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Vintage Distribution</Typography>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={vintageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'count' ? value : formatCurrency(value as number),
                            name === 'count' ? 'Funds' : name === 'totalSize' ? 'Total Size' : 'Avg IRR'
                          ]}
                        />
                        <Bar dataKey="count" fill="#3B82F6" name="Number of Funds" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid xs={12} lg={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Fund Status Distribution</Typography>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [value, 'Funds']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              </Grid>

              {currentFundFamily.description && (
                <Card sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Description</Typography>
                    <Typography color="text.secondary">{currentFundFamily.description}</Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Funds Tab */}
          {activeTab === 'funds' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Fund Portfolio</Typography>
                <Button
                  component={Link}
                  to="/funds/new"
                  variant="contained"
                  sx={{ minWidth: 120 }}
                >
                  Add Fund
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fund Name</TableCell>
                      <TableCell>Vintage</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Called / Committed</TableCell>
                      <TableCell>Distributed</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {funds.map((fund) => (
                      <TableRow key={fund.id} hover>
                        <TableCell>
                          <Button
                            component={Link}
                            to={`/funds/${fund.id}`}
                            color="primary"
                            sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                          >
                            {fund.name}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{fund.vintage}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatCurrency(fund.targetSize)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {formatCurrency(fund.calledCapital)} / {formatCurrency(fund.committedCapital)}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={(fund.calledCapital / fund.committedCapital) * 100}
                              sx={{ mt: 1, height: 6, borderRadius: 1 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatCurrency(fund.distributedCapital)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={fund.status} 
                            size="small" 
                            color={fund.status === 'investing' ? 'success' : fund.status === 'fundraising' ? 'info' : fund.status === 'harvesting' ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              IRR: {fund.irr > 0 ? `${fund.irr}%` : '-'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Multiple: {fund.multiple}x
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Grid container spacing={3}>
                <Grid xs={12} lg={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Historical Performance</Typography>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="vintage" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'irr' ? `${value}%` : `${value}x`,
                            name === 'irr' ? 'IRR' : 'Multiple'
                          ]}
                          labelFormatter={(label) => `Vintage ${label}`}
                        />
                        <Line yAxisId="left" type="monotone" dataKey="irr" stroke="#3B82F6" name="IRR %" />
                        <Line yAxisId="right" type="monotone" dataKey="multiple" stroke="#10B981" name="Multiple" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid xs={12} lg={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Key Metrics</Typography>
                  <Card sx={{ bgcolor: 'grey.50', mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid xs={6}>
                          <Typography variant="body2" color="text.secondary">Average IRR</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {summaryMetrics.averageIRR.toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2" color="text.secondary">Average Multiple</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {summaryMetrics.averageMultiple.toFixed(2)}x
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2" color="text.secondary">Total Called</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(summaryMetrics.totalCalled)}
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2" color="text.secondary">Total Distributed</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(summaryMetrics.totalDistributed)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                  <Alert severity="info">
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Performance Note
                    </Typography>
                    <Typography variant="body2">
                      Performance figures are as of last quarter end and subject to change. 
                      Past performance is not indicative of future results.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6">Fund Family Settings</Typography>
              
              <Card sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Financial Settings</Typography>
                  <Grid container spacing={3}>
                    <Grid xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Management Fee</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {currentFundFamily.settings?.defaultManagementFeeRate || 2}%
                      </Typography>
                    </Grid>
                    <Grid xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Carried Interest</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {currentFundFamily.settings?.defaultCarriedInterestRate || 20}%
                      </Typography>
                    </Grid>
                    <Grid xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Preferred Return</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {currentFundFamily.settings?.defaultPreferredReturn || 8}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Operational Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Auto-approve capital calls</Typography>
                      {currentFundFamily.settings?.autoApproveCapitalCalls ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : (
                        <XCircleIcon sx={{ color: 'text.disabled' }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Require dual approval</Typography>
                      {currentFundFamily.settings?.requireDualApproval ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : (
                        <XCircleIcon sx={{ color: 'text.disabled' }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Enable notifications</Typography>
                      {currentFundFamily.settings?.enableNotifications ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : (
                        <XCircleIcon sx={{ color: 'text.disabled' }} />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  component={Link}
                  to={`/fund-families/${id}/configuration`}
                  variant="contained"
                  startIcon={<Cog6ToothIcon />}
                  sx={{ minWidth: 200 }}
                >
                  Advanced Configuration
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FundFamilyDetails;