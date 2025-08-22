import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as EyeIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon
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
  approvedAt?: Date | string;
  completedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
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
}

const CapitalActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<CapitalActivity[]>([
    {
      id: 1,
      fundId: 1,
      eventType: 'capital_call',
      eventNumber: 'CC-2024-001',
      eventDate: '2024-06-15',
      dueDate: '2024-07-15',
      status: 'completed',
      description: 'Investment in TechStart Inc.',
      totalAmount: '25000000',
      currency: 'USD',
      calculations: { investorCount: 45 },
      completedAt: '2024-07-10'
    },
    {
      id: 2,
      fundId: 1,
      eventType: 'distribution',
      eventNumber: 'DIST-2024-001',
      eventDate: '2024-05-20',
      dueDate: '2024-06-05',
      status: 'completed',
      description: 'Exit proceeds from MediCorp',
      totalAmount: '15000000',
      currency: 'USD',
      calculations: { investorCount: 45 },
      completedAt: '2024-06-03'
    },
    {
      id: 3,
      fundId: 2,
      eventType: 'capital_call',
      eventNumber: 'CC-2024-002',
      eventDate: '2024-07-01',
      dueDate: '2024-07-31',
      status: 'pending',
      description: 'Follow-on investment series',
      totalAmount: '18000000',
      currency: 'USD',
      calculations: { investorCount: 32 },
      approvedBy: 1
    },
    {
      id: 4,
      fundId: 1,
      eventType: 'equalization',
      eventNumber: 'EQ-2024-001',
      eventDate: '2024-06-28',
      dueDate: '2024-07-28',
      status: 'draft',
      description: 'Portfolio company equalization',
      totalAmount: '5000000',
      currency: 'USD',
      calculations: { investorCount: 45 }
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
    currency: 'USD'
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
      status: 'draft',
      description: formData.description,
      totalAmount: formData.totalAmount,
      currency: formData.currency,
      calculations: { investorCount: 45 } // Mock data
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
      currency: 'USD'
    });
  };

  const handleApproval = (id: number, approved: boolean) => {
    setActivities(activities.map(activity => 
      activity.id === id 
        ? { ...activity, status: approved ? 'approved' : 'cancelled', approvedBy: approved ? 1 : undefined }
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
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.eventNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || activity.eventType === filterType;
    const matchesStatus = !filterStatus || activity.status === filterStatus;
    const matchesFund = !filterFund || activity.fundId.toString() === filterFund;
    return matchesSearch && matchesType && matchesStatus && matchesFund;
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'completed': return 'success';
      case 'approved': return 'info';
      case 'pending': return 'warning';
      case 'draft': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'completed': return <CheckCircleIcon fontSize="small" />;
  //     case 'approved': return <CheckIcon fontSize="small" />;
  //     case 'pending': return <ScheduleIcon fontSize="small" />;
  //     default: return null;
  //   }
  // };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'capital_call': return <TrendingUpIcon color="error" />;
      case 'distribution': return <TrendingDownIcon color="success" />;
      case 'equalization': return <AttachMoneyIcon color="warning" />;
      case 'reallocation': return <PersonIcon color="info" />;
      default: return <AttachMoneyIcon color="primary" />;
    }
  };

  const uniqueFunds = [...new Set(activities.map(a => a.fundId))];

  // Sample chart data
  const activityTrendData = [
    { month: 'Jan', calls: 45, distributions: 20, transfers: 5 },
    { month: 'Feb', calls: 52, distributions: 25, transfers: 8 },
    { month: 'Mar', calls: 48, distributions: 22, transfers: 6 },
    { month: 'Apr', calls: 61, distributions: 30, transfers: 10 },
    { month: 'May', calls: 55, distributions: 28, transfers: 7 },
    { month: 'Jun', calls: 67, distributions: 35, transfers: 12 }
  ];

  const activityTypeData = [
    { name: 'Capital Calls', value: 65, color: '#EF4444' },
    { name: 'Distributions', value: 30, color: '#10B981' },
    { name: 'Equalizations', value: 5, color: '#3B82F6' }
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Capital Activities
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<TrendingDownIcon />}>
            Export
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateModal(true)}>
            New Activity
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="overline">
                  Total Capital Calls
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: 'error.main' }}>
                  {formatCurrency(totalCapitalCalls)}
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'error.main' }} />
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="overline">
                  Total Distributions
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: 'success.main' }}>
                  {formatCurrency(totalDistributions)}
                </Typography>
              </Box>
              <TrendingDownIcon sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="overline">
                  Pending Activities
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: 'warning.main' }}>
                  {pendingActivities}
                </Typography>
              </Box>
              <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="overline">
                  Active Funds
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: 'info.main' }}>
                  {uniqueFunds.length}
                </Typography>
              </Box>
              <AttachMoneyIcon sx={{ fontSize: 40, color: 'info.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Activity Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="calls" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                <Area type="monotone" dataKey="distributions" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="transfers" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Activity Types
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
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
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                label="Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="capital_call">Capital Call</MenuItem>
                <MenuItem value="distribution">Distribution</MenuItem>
                <MenuItem value="equalization">Equalization</MenuItem>
                <MenuItem value="reallocation">Reallocation</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
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
            <FormControl fullWidth>
              <InputLabel>Fund</InputLabel>
              <Select
                value={filterFund}
                label="Fund"
                onChange={(e) => setFilterFund(e.target.value)}
              >
                <MenuItem value="">All Funds</MenuItem>
                {uniqueFunds.map(fundId => (
                  <MenuItem key={fundId} value={fundId.toString()}>Fund {fundId}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredActivities.length} of {activities.length} activities
            </Typography>
          </Box>
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
              <TableCell>Event Date</TableCell>
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
                      {getTypeIcon(activity.eventType)}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {activity.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.eventNumber}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={activity.eventType.replace('_', ' ')} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">Fund #{activity.fundId}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(activity.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(activity.eventDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={activity.status}
                      size="small"
                      color={getStatusColor(activity.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{activity.calculations?.investorCount || '-'}</Typography>
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
                  value={formData.fundId}
                  label="Fund"
                  onChange={(e) => setFormData({ ...formData, fundId: Number(e.target.value) })}
                >
                  <MenuItem value={0}>Select Fund</MenuItem>
                  <MenuItem value={1}>Fund 1</MenuItem>
                  <MenuItem value={2}>Fund 2</MenuItem>
                  <MenuItem value={3}>Fund 3</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.eventType}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
                >
                  <MenuItem value="capital_call">Capital Call</MenuItem>
                  <MenuItem value="distribution">Distribution</MenuItem>
                  <MenuItem value="equalization">Equalization</MenuItem>
                  <MenuItem value="reallocation">Reallocation</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Event Number"
                required
                fullWidth
                value={formData.eventNumber}
                onChange={(e) => setFormData({ ...formData, eventNumber: e.target.value })}
              />
              <TextField
                label="Amount"
                type="number"
                required
                fullWidth
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
              />
              <TextField
                label="Event Date"
                type="date"
                required
                fullWidth
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              />
              <TextField
                label="Due Date"
                type="date"
                fullWidth
                value={formData.dueDate || ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
        <DialogTitle>Activity Approval</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Do you want to approve or reject this activity?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => showApprovalModal && handleApproval(showApprovalModal, false)}
            color="error"
          >
            Reject
          </Button>
          <Button
            onClick={() => showApprovalModal && handleApproval(showApprovalModal, true)}
            variant="contained"
            color="success"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => setShowCreateModal(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default CapitalActivitiesPage;