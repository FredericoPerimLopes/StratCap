import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add,
  Edit,
  MoreVert,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Receipt,
  Assessment,
  Timeline,
  MonetizationOn,
  Balance,
  ShowChart
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
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
  Area,
  AreaChart
} from 'recharts';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';

interface CreditFacility {
  id: string;
  name: string;
  facilityType: 'revolving' | 'term_loan' | 'bridge' | 'warehouse';
  lender: string;
  totalCommitment: number;
  availableAmount: number;
  outstandingBalance: number;
  interestRate: number;
  maturityDate: Date;
  status: 'active' | 'inactive' | 'expired' | 'closed';
  covenant_compliance: CovenantStatus[];
  recent_activity: FacilityActivity[];
  utilization_rate: number;
  created_at: Date;
}

interface CovenantStatus {
  id: string;
  name: string;
  type: 'financial' | 'operational' | 'reporting';
  current_value: number;
  threshold: number;
  status: 'compliant' | 'warning' | 'breach';
  test_date: Date;
  next_test_date: Date;
}

interface FacilityActivity {
  id: string;
  facility_id: string;
  activity_type: 'drawdown' | 'paydown' | 'interest_payment' | 'fee_payment';
  amount: number;
  transaction_date: Date;
  description: string;
  status: 'pending' | 'completed' | 'failed';
}

interface DrawdownRequest {
  id: string;
  facility_id: string;
  amount: number;
  requested_date: Date;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approver?: string;
  completion_date?: Date;
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
      id={`credit-tabpanel-${index}`}
      aria-labelledby={`credit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#d32f2f', '#7b1fa2'];

export default function CreditFacilityDashboard() {
  const [facilities, setFacilities] = useState<CreditFacility[]>([]);
  const [drawdownRequests, setDrawdownRequests] = useState<DrawdownRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [actionMenu, setActionMenu] = useState<{
    anchorEl: HTMLElement | null;
    facilityId: string | null;
  }>({ anchorEl: null, facilityId: null });

  useEffect(() => {
    loadCreditFacilities();
    loadDrawdownRequests();
  }, []);

  const loadCreditFacilities = async () => {
    // Mock data - in real implementation, this would call the API
    setTimeout(() => {
      setFacilities([
        {
          id: '1',
          name: 'Revolving Credit Line A',
          facilityType: 'revolving',
          lender: 'Bank of America',
          totalCommitment: 25000000,
          availableAmount: 15000000,
          outstandingBalance: 10000000,
          interestRate: 0.045,
          maturityDate: new Date('2025-12-31'),
          status: 'active',
          utilization_rate: 0.4,
          covenant_compliance: [
            {
              id: '1',
              name: 'Debt-to-Equity Ratio',
              type: 'financial',
              current_value: 0.6,
              threshold: 0.75,
              status: 'compliant',
              test_date: new Date('2024-09-30'),
              next_test_date: new Date('2024-12-31')
            },
            {
              id: '2',
              name: 'Interest Coverage Ratio',
              type: 'financial',
              current_value: 3.2,
              threshold: 2.5,
              status: 'compliant',
              test_date: new Date('2024-09-30'),
              next_test_date: new Date('2024-12-31')
            }
          ],
          recent_activity: [
            {
              id: '1',
              facility_id: '1',
              activity_type: 'drawdown',
              amount: 2000000,
              transaction_date: new Date('2024-11-15'),
              description: 'Working capital drawdown',
              status: 'completed'
            },
            {
              id: '2',
              facility_id: '1',
              activity_type: 'interest_payment',
              amount: 37500,
              transaction_date: new Date('2024-11-30'),
              description: 'Monthly interest payment',
              status: 'completed'
            }
          ],
          created_at: new Date('2023-01-15')
        },
        {
          id: '2',
          name: 'Bridge Facility B',
          facilityType: 'bridge',
          lender: 'Goldman Sachs',
          totalCommitment: 50000000,
          availableAmount: 30000000,
          outstandingBalance: 20000000,
          interestRate: 0.065,
          maturityDate: new Date('2024-12-31'),
          status: 'active',
          utilization_rate: 0.4,
          covenant_compliance: [
            {
              id: '3',
              name: 'Asset Coverage Ratio',
              type: 'financial',
              current_value: 1.8,
              threshold: 1.5,
              status: 'compliant',
              test_date: new Date('2024-09-30'),
              next_test_date: new Date('2024-12-31')
            },
            {
              id: '4',
              name: 'Cash Flow Coverage',
              type: 'financial',
              current_value: 1.1,
              threshold: 1.2,
              status: 'warning',
              test_date: new Date('2024-09-30'),
              next_test_date: new Date('2024-12-31')
            }
          ],
          recent_activity: [
            {
              id: '3',
              facility_id: '2',
              activity_type: 'drawdown',
              amount: 5000000,
              transaction_date: new Date('2024-10-01'),
              description: 'Acquisition financing',
              status: 'completed'
            }
          ],
          created_at: new Date('2024-01-01')
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const loadDrawdownRequests = async () => {
    setTimeout(() => {
      setDrawdownRequests([
        {
          id: '1',
          facility_id: '1',
          amount: 3000000,
          requested_date: new Date('2024-12-01'),
          purpose: 'Investment opportunity',
          status: 'pending'
        },
        {
          id: '2',
          facility_id: '2',
          amount: 8000000,
          requested_date: new Date('2024-11-28'),
          purpose: 'Portfolio company capital call',
          status: 'approved',
          approver: 'John Smith'
        }
      ]);
    }, 500);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, facilityId: string) => {
    setActionMenu({ anchorEl: event.currentTarget, facilityId });
  };

  const handleActionMenuClose = () => {
    setActionMenu({ anchorEl: null, facilityId: null });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'warning': return 'warning';
      case 'breach': return 'error';
      case 'compliant': return 'success';
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalCommitment = facilities.reduce((sum, f) => sum + f.totalCommitment, 0);
    const totalOutstanding = facilities.reduce((sum, f) => sum + f.outstandingBalance, 0);
    const totalAvailable = facilities.reduce((sum, f) => sum + f.availableAmount, 0);
    const overallUtilization = totalCommitment > 0 ? totalOutstanding / totalCommitment : 0;
    const covenantBreaches = facilities.reduce((sum, f) => 
      sum + f.covenant_compliance.filter(c => c.status === 'breach').length, 0);
    const covenantWarnings = facilities.reduce((sum, f) => 
      sum + f.covenant_compliance.filter(c => c.status === 'warning').length, 0);

    return {
      totalCommitment,
      totalOutstanding,
      totalAvailable,
      overallUtilization,
      covenantBreaches,
      covenantWarnings
    };
  }, [facilities]);

  // Chart data
  const utilizationData = facilities.map(facility => ({
    name: facility.name,
    utilization: facility.utilization_rate * 100,
    outstanding: facility.outstandingBalance / 1000000,
    available: facility.availableAmount / 1000000
  }));

  const facilityTypeDistribution = [
    { name: 'Revolving', value: facilities.filter(f => f.facilityType === 'revolving').length },
    { name: 'Term Loan', value: facilities.filter(f => f.facilityType === 'term_loan').length },
    { name: 'Bridge', value: facilities.filter(f => f.facilityType === 'bridge').length },
    { name: 'Warehouse', value: facilities.filter(f => f.facilityType === 'warehouse').length }
  ].filter(item => item.value > 0);

  const activityTimeline = facilities
    .flatMap(f => f.recent_activity.map(a => ({
      ...a,
      facilityName: f.name,
      amount: a.amount / 1000000
    })))
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 10)
    .reverse();

  // Grid columns
  const facilityColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Facility Name',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="subtitle2">{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.lender}
          </Typography>
        </Box>
      )
    },
    {
      field: 'facilityType',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value.replace('_', ' ')} 
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'commitment',
      headerName: 'Commitment',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">
          {formatCurrency(params.row.totalCommitment)}
        </Typography>
      )
    },
    {
      field: 'outstanding',
      headerName: 'Outstanding',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">
          {formatCurrency(params.row.outstandingBalance)}
        </Typography>
      )
    },
    {
      field: 'utilization',
      headerName: 'Utilization',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={params.row.utilization_rate * 100} 
            sx={{ mb: 0.5 }}
            color={params.row.utilization_rate > 0.8 ? 'warning' : 'primary'}
          />
          <Typography variant="caption">
            {formatPercentage(params.row.utilization_rate)}
          </Typography>
        </Box>
      )
    },
    {
      field: 'interestRate',
      headerName: 'Rate',
      width: 80,
      valueFormatter: (params) => formatPercentage(params.value)
    },
    {
      field: 'maturityDate',
      headerName: 'Maturity',
      width: 110,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Edit />}
          label="Edit"
          onClick={() => {/* Handle edit */}}
        />,
        <GridActionsCellItem
          icon={<MoreVert />}
          label="More"
          onClick={(event) => handleActionMenuOpen(event, params.id as string)}
        />
      ]
    }
  ];

  const drawdownColumns: GridColDef[] = [
    {
      field: 'facility_id',
      headerName: 'Facility',
      flex: 1,
      valueGetter: (params) => {
        const facility = facilities.find(f => f.id === params.value);
        return facility?.name || 'Unknown';
      }
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      valueFormatter: (params) => formatCurrency(params.value)
    },
    {
      field: 'purpose',
      headerName: 'Purpose',
      flex: 1
    },
    {
      field: 'requested_date',
      headerName: 'Requested',
      width: 110,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 80,
      getActions: () => [
        <GridActionsCellItem
          icon={<Edit />}
          label="Review"
          onClick={() => {/* Handle review */}}
        />
      ]
    }
  ];

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalance color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Commitment</Typography>
            </Box>
            <Typography variant="h4">
              {formatCurrency(summaryMetrics.totalCommitment)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Across {facilities.length} facilities
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MonetizationOn color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Outstanding</Typography>
            </Box>
            <Typography variant="h4">
              {formatCurrency(summaryMetrics.totalOutstanding)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatPercentage(summaryMetrics.overallUtilization)} utilization
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Balance color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Available</Typography>
            </Box>
            <Typography variant="h4">
              {formatCurrency(summaryMetrics.totalAvailable)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ready for drawdown
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Warning color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Covenant Alerts</Typography>
            </Box>
            <Typography variant="h4">
              {summaryMetrics.covenantBreaches + summaryMetrics.covenantWarnings}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {summaryMetrics.covenantBreaches} breaches, {summaryMetrics.covenantWarnings} warnings
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Facility Utilization
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip formatter={(value) => [`${value}%`, '']} />
                  <Bar 
                    dataKey="utilization" 
                    fill="#1976d2" 
                    name="Utilization %" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Facility Types
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={facilityTypeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {facilityTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activity Timeline
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="transaction_date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()} 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis label={{ value: 'Amount ($M)', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip 
                    formatter={(value, name, props) => [
                      `$${value}M`, 
                      props.payload.activity_type.replace('_', ' ')
                    ]}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill={(entry: any) => entry.activity_type === 'drawdown' ? '#d32f2f' : '#2e7d32'}
                    name="Amount"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Covenant Status Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Covenant Compliance Status
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Facility</TableCell>
                    <TableCell>Covenant</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell align="right">Threshold</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Next Test</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {facilities.flatMap(facility => 
                    facility.covenant_compliance.map(covenant => (
                      <TableRow key={`${facility.id}-${covenant.id}`}>
                        <TableCell>{facility.name}</TableCell>
                        <TableCell>{covenant.name}</TableCell>
                        <TableCell>
                          <Chip label={covenant.type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{covenant.current_value.toFixed(2)}</TableCell>
                        <TableCell align="right">{covenant.threshold.toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={covenant.status} 
                            color={getStatusColor(covenant.status)}
                            size="small"
                            icon={
                              covenant.status === 'compliant' ? <CheckCircle /> :
                              covenant.status === 'warning' ? <Warning /> : undefined
                            }
                          />
                        </TableCell>
                        <TableCell>{covenant.next_test_date.toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFacilitiesList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">All Credit Facilities</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {/* Handle create facility */}}
        >
          New Facility
        </Button>
      </Box>

      <DataGrid
        rows={facilities}
        columns={facilityColumns}
        pageSize={25}
        rowsPerPageOptions={[25, 50, 100]}
        autoHeight
        disableSelectionOnClick
        loading={loading}
        getRowId={(row) => row.id}
      />
    </Box>
  );

  const renderDrawdownRequests = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Drawdown Requests</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {/* Handle create drawdown request */}}
        >
          New Request
        </Button>
      </Box>

      <DataGrid
        rows={drawdownRequests}
        columns={drawdownColumns}
        pageSize={25}
        rowsPerPageOptions={[25, 50, 100]}
        autoHeight
        disableSelectionOnClick
        loading={loading}
        getRowId={(row) => row.id}
      />
    </Box>
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading credit facility dashboard...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab 
            label={
              <Badge badgeContent={facilities.length} color="primary">
                Overview
              </Badge>
            } 
          />
          <Tab label="All Facilities" />
          <Tab 
            label={
              <Badge 
                badgeContent={drawdownRequests.filter(r => r.status === 'pending').length} 
                color="warning"
              >
                Drawdowns
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {renderOverview()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderFacilitiesList()}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {renderDrawdownRequests()}
      </TabPanel>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleActionMenuClose}
      >
        <MenuItem>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Facility</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <TrendingDown fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Drawdown</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <TrendingUp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Make Payment</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Assessment fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Reports</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}