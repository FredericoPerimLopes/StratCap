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
  fund: string;
  type: 'capital_call' | 'distribution' | 'transfer';
  amount: number;
  callDate: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  description: string;
  investorCount: number;
  approvedBy?: string;
  completedDate?: string;
}

interface ActivityFormData {
  fund: string;
  type: 'capital_call' | 'distribution' | 'transfer';
  amount: string;
  callDate: string;
  dueDate: string;
  description: string;
}

const CapitalActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<CapitalActivity[]>([
    {
      id: 1,
      fund: 'Growth Fund III',
      type: 'capital_call',
      amount: 25000000,
      callDate: '2024-06-15',
      dueDate: '2024-07-15',
      status: 'completed',
      description: 'Investment in TechStart Inc.',
      investorCount: 45,
      completedDate: '2024-07-10'
    },
    {
      id: 2,
      fund: 'Growth Fund III',
      type: 'distribution',
      amount: 15000000,
      callDate: '2024-05-20',
      dueDate: '2024-06-05',
      status: 'completed',
      description: 'Exit proceeds from MediCorp',
      investorCount: 45,
      completedDate: '2024-06-03'
    },
    {
      id: 3,
      fund: 'Venture Fund II',
      type: 'capital_call',
      amount: 18000000,
      callDate: '2024-07-01',
      dueDate: '2024-07-31',
      status: 'pending',
      description: 'Follow-on investment series',
      investorCount: 32,
      approvedBy: 'John Smith'
    },
    {
      id: 4,
      fund: 'Growth Fund III',
      type: 'transfer',
      amount: 5000000,
      callDate: '2024-06-28',
      dueDate: '2024-07-28',
      status: 'draft',
      description: 'Portfolio company transfer',
      investorCount: 45
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFund, setFilterFund] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState<number | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>({
    fund: '',
    type: 'capital_call',
    amount: '',
    callDate: '',
    dueDate: '',
    description: ''
  });

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const newActivity: CapitalActivity = {
      id: Date.now(),
      fund: formData.fund,
      type: formData.type,
      amount: parseFloat(formData.amount),
      callDate: formData.callDate,
      dueDate: formData.dueDate,
      status: 'draft',
      description: formData.description,
      investorCount: 45 // Mock data
    };
    setActivities([...activities, newActivity]);
    setShowCreateModal(false);
    setFormData({
      fund: '',
      type: 'capital_call',
      amount: '',
      callDate: '',
      dueDate: '',
      description: ''
    });
  };

  const handleApproval = (id: number, approved: boolean) => {
    setActivities(activities.map(activity => 
      activity.id === id 
        ? { ...activity, status: approved ? 'approved' : 'cancelled', approvedBy: approved ? 'Current User' : undefined }
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
            completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
          }
        : activity
    ));
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.fund.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || activity.type === filterType;
    const matchesStatus = !filterStatus || activity.status === filterStatus;
    const matchesFund = !filterFund || activity.fund === filterFund;
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
    .filter(a => a.type === 'capital_call' && a.status === 'completed')
    .reduce((sum, a) => sum + a.amount, 0);
  
  const totalDistributions = activities
    .filter(a => a.type === 'distribution' && a.status === 'completed')
    .reduce((sum, a) => sum + a.amount, 0);

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