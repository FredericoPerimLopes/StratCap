import React, { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  MoreVert,
  Assessment,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  AttachMoney,
  People,
  Description,
  Timeline,
  TrendingUp,
  CalendarToday
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';

interface ClosingEvent {
  id: string;
  name: string;
  fundId: number;
  fundName: string;
  closingDate: Date;
  firstClosingDate?: Date;
  finalClosingDate?: Date;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  type: 'initial' | 'interim' | 'final';
  targetCommitments: number;
  currentCommitments: number;
  minimumSize?: number;
  maximumSize?: number;
  investorCount: number;
  documentsRequired: number;
  documentsCompleted: number;
  complianceChecks: ComplianceCheck[];
  legalReviews: LegalReview[];
  notifications: NotificationStatus[];
  createdAt: Date;
  updatedAt: Date;
}

interface ComplianceCheck {
  id: string;
  type: string;
  status: 'pending' | 'passed' | 'failed';
  description: string;
  completedAt?: Date;
}

interface LegalReview {
  id: string;
  documentType: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer: string;
  comments?: string;
  completedAt?: Date;
}

interface NotificationStatus {
  id: string;
  type: 'investor_notice' | 'regulatory_filing' | 'internal_approval';
  status: 'pending' | 'sent' | 'acknowledged';
  dueDate: Date;
  completedAt?: Date;
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
      id={`closing-tabpanel-${index}`}
      aria-labelledby={`closing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#d32f2f', '#7b1fa2'];

export default function ClosingDashboard() {
  const [closings, setClosings] = useState<ClosingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [actionMenu, setActionMenu] = useState<{
    anchorEl: HTMLElement | null;
    closingId: string | null;
  }>({ anchorEl: null, closingId: null });

  useEffect(() => {
    loadClosings();
  }, []);

  const loadClosings = async () => {
    // Mock data - in real implementation, this would call the API
    setTimeout(() => {
      setClosings([
        {
          id: '1',
          name: 'Fund I First Closing',
          fundId: 1,
          fundName: 'Growth Fund I',
          closingDate: new Date('2024-12-15'),
          status: 'in_progress',
          type: 'initial',
          targetCommitments: 50000000,
          currentCommitments: 42000000,
          minimumSize: 25000000,
          maximumSize: 100000000,
          investorCount: 8,
          documentsRequired: 15,
          documentsCompleted: 12,
          complianceChecks: [
            { id: '1', type: 'AML Check', status: 'passed', description: 'Anti-money laundering verification' },
            { id: '2', type: 'KYC Review', status: 'pending', description: 'Know your customer documentation' }
          ],
          legalReviews: [
            { id: '1', documentType: 'Subscription Agreement', status: 'approved', reviewer: 'Jane Smith' },
            { id: '2', documentType: 'Side Letter', status: 'pending', reviewer: 'John Doe' }
          ],
          notifications: [
            { id: '1', type: 'investor_notice', status: 'sent', dueDate: new Date('2024-12-01') },
            { id: '2', type: 'regulatory_filing', status: 'pending', dueDate: new Date('2024-12-10') }
          ],
          createdAt: new Date('2024-11-01'),
          updatedAt: new Date('2024-12-01')
        },
        {
          id: '2',
          name: 'Fund II Second Closing',
          fundId: 2,
          fundName: 'Growth Fund II',
          closingDate: new Date('2025-02-28'),
          status: 'planning',
          type: 'interim',
          targetCommitments: 75000000,
          currentCommitments: 35000000,
          investorCount: 12,
          documentsRequired: 18,
          documentsCompleted: 5,
          complianceChecks: [],
          legalReviews: [],
          notifications: [],
          createdAt: new Date('2024-11-15'),
          updatedAt: new Date('2024-11-20')
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, closingId: string) => {
    setActionMenu({ anchorEl: event.currentTarget, closingId });
  };

  const handleActionMenuClose = () => {
    setActionMenu({ anchorEl: null, closingId: null });
  };

  const getStatusColor = (status: ClosingEvent['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'planning': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getCompletionPercentage = (closing: ClosingEvent) => {
    const docProgress = closing.documentsCompleted / closing.documentsRequired;
    const complianceProgress = closing.complianceChecks.filter(c => c.status === 'passed').length / Math.max(closing.complianceChecks.length, 1);
    const legalProgress = closing.legalReviews.filter(r => r.status === 'approved').length / Math.max(closing.legalReviews.length, 1);
    const notificationProgress = closing.notifications.filter(n => n.status === 'sent' || n.status === 'acknowledged').length / Math.max(closing.notifications.length, 1);
    
    return Math.round(((docProgress + complianceProgress + legalProgress + notificationProgress) / 4) * 100);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Data for charts
  const statusDistribution = [
    { name: 'Completed', value: closings.filter(c => c.status === 'completed').length },
    { name: 'In Progress', value: closings.filter(c => c.status === 'in_progress').length },
    { name: 'Planning', value: closings.filter(c => c.status === 'planning').length },
    { name: 'Cancelled', value: closings.filter(c => c.status === 'cancelled').length }
  ].filter(item => item.value > 0);

  const commitmentProgress = closings.map(closing => ({
    name: closing.name,
    target: closing.targetCommitments / 1000000,
    current: closing.currentCommitments / 1000000,
    percentage: (closing.currentCommitments / closing.targetCommitments) * 100
  }));

  const closingTimeline = closings
    .filter(c => c.status !== 'cancelled')
    .sort((a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime())
    .map(closing => ({
      name: closing.name,
      date: closing.closingDate.toLocaleDateString(),
      commitments: closing.currentCommitments / 1000000,
      completion: getCompletionPercentage(closing)
    }));

  // Grid columns
  const closingColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Closing Name',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="subtitle2">{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.fundName}
          </Typography>
        </Box>
      )
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value.replace('_', ' ')} 
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'closingDate',
      headerName: 'Closing Date',
      width: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'commitments',
      headerName: 'Commitments',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">
            {formatCurrency(params.row.currentCommitments)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            of {formatCurrency(params.row.targetCommitments)}
          </Typography>
        </Box>
      )
    },
    {
      field: 'completion',
      headerName: 'Progress',
      width: 120,
      renderCell: (params) => {
        const percentage = getCompletionPercentage(params.row);
        return (
          <Box sx={{ width: '100%' }}>
            <LinearProgress 
              variant="determinate" 
              value={percentage} 
              sx={{ mb: 0.5 }}
            />
            <Typography variant="caption">{percentage}%</Typography>
          </Box>
        );
      }
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

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assessment color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Closings</Typography>
            </Box>
            <Typography variant="h4">{closings.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Active closing events
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoney color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Raised</Typography>
            </Box>
            <Typography variant="h4">
              {formatCurrency(closings.reduce((sum, c) => sum + c.currentCommitments, 0))}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Committed capital
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <People color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Investors</Typography>
            </Box>
            <Typography variant="h4">
              {closings.reduce((sum, c) => sum + c.investorCount, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Across all closings
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Schedule color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Pending Items</Typography>
            </Box>
            <Typography variant="h4">
              {closings.reduce((sum, c) => 
                sum + (c.documentsRequired - c.documentsCompleted) + 
                c.complianceChecks.filter(cc => cc.status === 'pending').length +
                c.legalReviews.filter(lr => lr.status === 'pending').length, 0
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Items requiring attention
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Closing Status Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistribution.map((entry, index) => (
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

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Commitment Progress
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commitmentProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Amount ($M)', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip formatter={(value) => [`$${value}M`, '']} />
                  <Legend />
                  <Bar dataKey="target" fill="#e3f2fd" name="Target" />
                  <Bar dataKey="current" fill="#1976d2" name="Current" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Closing Timeline
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={closingTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Commitments ($M)', angle: 90, position: 'insideRight' }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="completion" 
                    stroke="#2e7d32" 
                    name="Completion %" 
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="commitments" 
                    fill="#1976d2" 
                    name="Commitments ($M)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderClosingsList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">All Closings</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {/* Handle create closing */}}
        >
          New Closing
        </Button>
      </Box>

      <DataGrid
        rows={closings}
        columns={closingColumns}
        pageSize={25}
        rowsPerPageOptions={[25, 50, 100]}
        autoHeight
        disableSelectionOnClick
        loading={loading}
        getRowId={(row) => row.id}
      />
    </Box>
  );

  const renderUpcomingTasks = () => {
    const allTasks = closings.flatMap(closing => [
      ...closing.complianceChecks
        .filter(cc => cc.status === 'pending')
        .map(cc => ({
          id: `${closing.id}-${cc.id}`,
          type: 'Compliance Check',
          description: cc.description,
          closingName: closing.name,
          priority: 'high',
          dueDate: closing.closingDate
        })),
      ...closing.legalReviews
        .filter(lr => lr.status === 'pending')
        .map(lr => ({
          id: `${closing.id}-${lr.id}`,
          type: 'Legal Review',
          description: lr.documentType,
          closingName: closing.name,
          priority: 'medium',
          dueDate: closing.closingDate
        })),
      ...closing.notifications
        .filter(n => n.status === 'pending')
        .map(n => ({
          id: `${closing.id}-${n.id}`,
          type: 'Notification',
          description: n.type.replace('_', ' '),
          closingName: closing.name,
          priority: 'low',
          dueDate: n.dueDate
        }))
    ]).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Upcoming Tasks
        </Typography>
        
        {allTasks.length === 0 ? (
          <Alert severity="success">
            No pending tasks! All closings are on track.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {allTasks.map((task) => (
              <Grid item xs={12} md={6} key={task.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2">
                        {task.type}
                      </Typography>
                      <Chip 
                        label={task.priority} 
                        size="small" 
                        color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {task.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {task.closingName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading closing dashboard...
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
              <Badge badgeContent={closings.length} color="primary">
                Overview
              </Badge>
            } 
          />
          <Tab label="All Closings" />
          <Tab 
            label={
              <Badge 
                badgeContent={closings.reduce((sum, c) => 
                  sum + (c.documentsRequired - c.documentsCompleted) + 
                  c.complianceChecks.filter(cc => cc.status === 'pending').length +
                  c.legalReviews.filter(lr => lr.status === 'pending').length, 0
                )} 
                color="error"
              >
                Tasks
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {renderOverview()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderClosingsList()}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {renderUpcomingTasks()}
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
          <ListItemText>Edit Closing</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Description fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Documents</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Assessment fontSize="small" />
          </ListItemIcon>
          <ListItemText>Generate Report</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}