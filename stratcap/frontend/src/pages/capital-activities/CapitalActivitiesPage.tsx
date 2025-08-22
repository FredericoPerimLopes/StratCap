import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as PlusIcon,
  Search as MagnifyingGlassIcon,
  Visibility as EyeIcon,
  Edit as PencilIcon,
  Check as CheckIcon,
  Close as XMarkIcon,
  FilterList as FunnelIcon,
  FileDownload as DocumentArrowDownIcon,
  AttachMoney as CurrencyDollarIcon,
  MonetizationOn as BanknotesIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as ArrowTrendingUpIcon,
  TrendingDown as ArrowTrendingDownIcon
} from '@mui/icons-material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface CapitalActivity {
  id: number;
  fundId: number;
  eventType: 'capital_call' | 'distribution' | 'equalization' | 'reallocation';
  eventNumber: string;
  eventDate: string;
  dueDate?: string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  totalAmount: string;
  baseAmount?: string;
  feeAmount?: string;
  expenseAmount?: string;
  currency: string;
  purpose?: string;
  notices?: Record<string, any>;
  calculations?: Record<string, any>;
  approvedBy?: number;
  approvedAt?: string;
  completedAt?: string;
  notes?: string;
  metadata?: Record<string, any>;
  // Display fields
  fundName?: string;
  approverName?: string;
}

interface ActivityFormData {
  fundId: number;
  eventType: 'capital_call' | 'distribution' | 'equalization' | 'reallocation';
  eventNumber: string;
  eventDate: string;
  dueDate?: string;
  description: string;
  totalAmount: string;
  baseAmount?: string;
  feeAmount?: string;
  expenseAmount?: string;
  currency: string;
  purpose?: string;
  notices?: Record<string, any>;
  calculations?: Record<string, any>;
  notes?: string;
  metadata?: Record<string, any>;
}

const CapitalActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<CapitalActivity[]>([
    {
      id: 1,
      fundId: 1,
      eventType: 'capital_call',
      eventNumber: 'CC-001',
      eventDate: '2024-06-15',
      dueDate: '2024-07-15',
      description: 'Investment in TechStart Inc.',
      status: 'completed',
      totalAmount: '25000000',
      currency: 'USD',
      fundName: 'Growth Fund III',
      completedAt: '2024-07-10'
    },
    {
      id: 2,
      fundId: 1,
      eventType: 'distribution',
      eventNumber: 'DIST-001',
      eventDate: '2024-05-20',
      dueDate: '2024-06-05',
      description: 'Exit proceeds from MediCorp',
      status: 'completed',
      totalAmount: '15000000',
      currency: 'USD',
      fundName: 'Growth Fund III',
      completedAt: '2024-06-03'
    },
    {
      id: 3,
      fundId: 2,
      eventType: 'capital_call',
      eventNumber: 'CC-002',
      eventDate: '2024-07-01',
      dueDate: '2024-07-31',
      description: 'Follow-on investment series',
      status: 'pending',
      totalAmount: '18000000',
      currency: 'USD',
      fundName: 'Venture Fund II',
      approvedBy: 1,
      approverName: 'John Smith'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFund, setFilterFund] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState<number | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>({
    fundId: 0,
    eventType: 'capital_call',
    eventNumber: '',
    eventDate: '',
    dueDate: '',
    description: '',
    totalAmount: '',
    currency: 'USD',
    purpose: '',
    notices: {},
    calculations: {},
    notes: '',
    metadata: {}
  });

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const newActivity: CapitalActivity = {
      id: Date.now(),
      fundId: formData.fundId,
      eventType: formData.eventType,
      eventNumber: formData.eventNumber,
      eventDate: formData.eventDate,
      dueDate: formData.dueDate,
      description: formData.description,
      status: 'draft',
      totalAmount: formData.totalAmount,
      currency: formData.currency,
      purpose: formData.purpose,
      notices: formData.notices,
      calculations: formData.calculations,
      notes: formData.notes,
      metadata: formData.metadata,
      fundName: 'New Fund'
    };
    setActivities([...activities, newActivity]);
    setShowCreateModal(false);
    setFormData({
      fundId: 0,
      eventType: 'capital_call',
      eventNumber: '',
      eventDate: '',
      dueDate: '',
      description: '',
      totalAmount: '',
      currency: 'USD',
      purpose: '',
      notices: {},
      calculations: {},
      notes: '',
      metadata: {}
    });
  };

  const handleApproval = (id: number, approved: boolean) => {
    setActivities(activities.map(activity => 
      activity.id === id 
        ? { ...activity, status: approved ? 'approved' : 'cancelled', approvedBy: approved ? 1 : undefined, approverName: approved ? 'Current User' : undefined }
        : activity
    ));
    setShowApprovalModal(null);
  };

  const handleStatusUpdate = (id: number, newStatus: CapitalActivity['status']) => {
    setActivities(activities.map(activity => 
      activity.id === id 
        ? { 
            ...activity, 
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
          }
        : activity
    ));
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = (activity.fundName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || activity.eventType === filterType;
    const matchesStatus = !filterStatus || activity.status === filterStatus;
    const matchesFund = !filterFund || activity.fundName === filterFund;
    return matchesSearch && matchesType && matchesStatus && matchesFund;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string): 'success' | 'info' | 'warning' | 'default' | 'error' => {
    switch (status) {
      case 'completed': return 'success';
      case 'approved': return 'info';
      case 'pending': return 'warning';
      case 'draft': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'approved': return <CheckIcon sx={{ fontSize: 16 }} />;
      case 'pending': return <ClockIcon sx={{ fontSize: 16 }} />;
      case 'draft': return <PencilIcon sx={{ fontSize: 16 }} />;
      case 'cancelled': return <XMarkIcon sx={{ fontSize: 16 }} />;
      default: return <ClockIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'capital_call': return <ArrowTrendingDownIcon sx={{ fontSize: 20, color: 'error.main' }} />;
      case 'distribution': return <ArrowTrendingUpIcon sx={{ fontSize: 20, color: 'success.main' }} />;
      case 'transfer': return <BanknotesIcon sx={{ fontSize: 20, color: 'primary.main' }} />;
      default: return <CurrencyDollarIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
    }
  };

  // Sample data for charts
  const activityTrendData = [
    { month: 'Jan', capitalCalls: 15000000, distributions: 8000000 },
    { month: 'Feb', capitalCalls: 12000000, distributions: 12000000 },
    { month: 'Mar', capitalCalls: 18000000, distributions: 6000000 },
    { month: 'Apr', capitalCalls: 8000000, distributions: 15000000 },
    { month: 'May', capitalCalls: 22000000, distributions: 10000000 },
    { month: 'Jun', capitalCalls: 25000000, distributions: 15000000 }
  ];

  const activityTypeData = [
    { name: 'Capital Calls', value: 65, color: '#EF4444' },
    { name: 'Distributions', value: 30, color: '#10B981' },
    { name: 'Transfers', value: 5, color: '#3B82F6' }
  ];


  // Calculate summary metrics
  const totalCapitalCalls = activities
    .filter(a => a.eventType === 'capital_call' && a.status === 'completed')
    .reduce((sum, a) => sum + parseFloat(a.totalAmount || '0'), 0);
  
  const totalDistributions = activities
    .filter(a => a.eventType === 'distribution' && a.status === 'completed')
    .reduce((sum, a) => sum + parseFloat(a.totalAmount || '0'), 0);

  const pendingActivities = activities.filter(a => a.status === 'pending' || a.status === 'approved').length;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Capital Activities
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DocumentArrowDownIcon />}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<PlusIcon />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Activity
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ArrowTrendingDownIcon sx={{ fontSize: 32, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Capital Calls</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalCapitalCalls)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ArrowTrendingUpIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Distributions</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalDistributions)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ClockIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Pending Activities</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {pendingActivities}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">This Month</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    6
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Activity Trends</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activityTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                    <Area type="monotone" dataKey="capitalCalls" stackId="1" stroke="#EF4444" fill="#EF4444" name="Capital Calls" />
                    <Area type="monotone" dataKey="distributions" stackId="1" stroke="#10B981" fill="#10B981" name="Distributions" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Activity Types</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={activityTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {activityTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MagnifyingGlassIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Fund</InputLabel>
                <Select
                  value={filterFund}
                  label="Fund"
                  onChange={(e) => setFilterFund(e.target.value)}
                >
                  <MenuItem value="">All Funds</MenuItem>
                  <MenuItem value="Growth Fund III">Growth Fund III</MenuItem>
                  <MenuItem value="Venture Fund II">Venture Fund II</MenuItem>
                  <MenuItem value="Real Estate Fund I">Real Estate Fund I</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="capital_call">Capital Call</MenuItem>
                  <MenuItem value="distribution">Distribution</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FunnelIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2" color="text.secondary">
                  {filteredActivities.length} of {activities.length} activities
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Activities Table */}
<<<<<<< HEAD
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Activity</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Fund</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Call Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Investors</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No activities found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map((activity) => (
                <TableRow key={activity.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getTypeIcon(activity.type)}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {activity.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {activity.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={activity.type.replace('_', ' ')} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{activity.fund}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(activity.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(activity.callDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(activity.dueDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={activity.status}
                      size="small"
                      color={getStatusColor(activity.status)}
                      icon={getStatusIcon(activity.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{activity.investorCount}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        size="small"
                        component={Link}
                        to={`/capital-activities/${activity.id}`}
                        color="primary"
                      >
                        <EyeIcon />
                      </IconButton>
                      {activity.status === 'draft' && (
                        <IconButton
                          size="small"
                          onClick={() => handleStatusUpdate(activity.id, 'pending')}
                          color="info"
                          title="Submit for Approval"
=======
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fund
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Call Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investors
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No activities found
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(activity.eventType)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                          <div className="text-sm text-gray-500">ID: {activity.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {activity.eventType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Fund #{activity.fundId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(parseFloat(activity.totalAmount) || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(activity.eventDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {getStatusIcon(activity.status)}
                        <span className="ml-1">{activity.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.calculations?.investorCount || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/capital-activities/${activity.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
>>>>>>> 80a95e2 (fix backedn frontend mismatch)
                        >
                          <CheckIcon />
                        </IconButton>
                      )}
                      {activity.status === 'pending' && (
                        <IconButton
                          size="small"
                          onClick={() => setShowApprovalModal(activity.id)}
                          color="success"
                          title="Approve/Reject"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      {activity.status === 'approved' && (
                        <IconButton
                          size="small"
                          onClick={() => handleStatusUpdate(activity.id, 'completed')}
                          color="secondary"
                          title="Mark Complete"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Activity Modal */}
<<<<<<< HEAD
      <Dialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Capital Activity</DialogTitle>
        <form onSubmit={handleCreateActivity}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel>Fund</InputLabel>
                <Select
                  value={formData.fund}
                  label="Fund"
                  onChange={(e) => setFormData({ ...formData, fund: e.target.value })}
                >
                  <MenuItem value="">Select Fund</MenuItem>
                  <MenuItem value="Growth Fund III">Growth Fund III</MenuItem>
                  <MenuItem value="Venture Fund II">Venture Fund II</MenuItem>
                  <MenuItem value="Real Estate Fund I">Real Estate Fund I</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <MenuItem value="capital_call">Capital Call</MenuItem>
                  <MenuItem value="distribution">Distribution</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Amount"
                type="number"
                required
                fullWidth
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <TextField
                label="Call Date"
                type="date"
                required
                fullWidth
                value={formData.callDate}
                onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Due Date"
                type="date"
                required
                fullWidth
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Description"
                required
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowCreateModal(false)}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
            >
              Create Activity
            </Button>
          </DialogActions>
        </form>
      </Dialog>
=======
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Capital Activity</h3>
              <form onSubmit={handleCreateActivity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fund</label>
                  <select
                    required
                    value={formData.fundId}
                    onChange={(e) => setFormData({ ...formData, fundId: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Fund</option>
                    <option value="1">Growth Fund III</option>
                    <option value="2">Venture Fund II</option>
                    <option value="3">Real Estate Fund I</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="capital_call">Capital Call</option>
                    <option value="distribution">Distribution</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    required
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Call Date</label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    Create Activity
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
>>>>>>> 80a95e2 (fix backedn frontend mismatch)

      {/* Approval Modal */}
      <Dialog
        open={showApprovalModal !== null}
        onClose={() => setShowApprovalModal(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Approve Activity</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to approve or reject this capital activity?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowApprovalModal(null)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => showApprovalModal && handleApproval(showApprovalModal, false)}
            color="error"
            variant="contained"
          >
            Reject
          </Button>
          <Button
            onClick={() => showApprovalModal && handleApproval(showApprovalModal, true)}
            color="success"
            variant="contained"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CapitalActivitiesPage;