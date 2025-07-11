import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  IconButton,
  Chip,
  Tabs,
  Tab,
  Alert,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormGroup,
  RadioGroup,
  Radio,
  FormLabel,
  Slider,
  Rating,
  LinearProgress,
  Backdrop,
  Fade,
  Modal,
  Breadcrumbs,
  Link,
  Avatar,
  Badge,
  Stack
} from '@mui/material';
import Assessment from '@mui/icons-material/Assessment';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Download from '@mui/icons-material/Download';
import Share from '@mui/icons-material/Share';
import Schedule from '@mui/icons-material/Schedule';
import Visibility from '@mui/icons-material/Visibility';
import TrendingUp from '@mui/icons-material/TrendingUp';
import PieChart from '@mui/icons-material/PieChart';
import BarChart from '@mui/icons-material/BarChart';
import Timeline from '@mui/icons-material/Timeline';
import TableChart from '@mui/icons-material/TableChart';
import Print from '@mui/icons-material/Print';
import Email from '@mui/icons-material/Email';
import CloudDownload from '@mui/icons-material/CloudDownload';
import Settings from '@mui/icons-material/Settings';
import Refresh from '@mui/icons-material/Refresh';
import FilterList from '@mui/icons-material/FilterList';
import Search from '@mui/icons-material/Search';
import DateRange from '@mui/icons-material/DateRange';
import CalendarToday from '@mui/icons-material/CalendarToday';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Save from '@mui/icons-material/Save';
import Cancel from '@mui/icons-material/Cancel';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Dashboard from '@mui/icons-material/Dashboard';
import AccountBalance from '@mui/icons-material/AccountBalance';
import People from '@mui/icons-material/People';
import MonetizationOn from '@mui/icons-material/MonetizationOn';
import ShowChart from '@mui/icons-material/ShowChart';
import DonutLarge from '@mui/icons-material/DonutLarge';
import GraphicEq from '@mui/icons-material/GraphicEq';
import Insights from '@mui/icons-material/Insights';
import Analytics from '@mui/icons-material/Analytics';
import DataUsage from '@mui/icons-material/DataUsage';
import BubbleChart from '@mui/icons-material/BubbleChart';
import ScatterPlot from '@mui/icons-material/ScatterPlot';
import Cached from '@mui/icons-material/Cached';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import StarBorder from '@mui/icons-material/StarBorder';
import Star from '@mui/icons-material/Star';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Error from '@mui/icons-material/Error';
import Warning from '@mui/icons-material/Warning';
import Info from '@mui/icons-material/Info';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  Sankey,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface Report {
  id: string;
  name: string;
  type: 'standard' | 'custom' | 'scheduled';
  category: 'performance' | 'investor' | 'fund' | 'compliance' | 'financial' | 'operational';
  description: string;
  template: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'draft';
  created_by: string;
  created_at: string;
  updated_at: string;
  parameters?: Record<string, any>;
  recipients?: string[];
  format: 'pdf' | 'excel' | 'html' | 'csv';
}

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: ReportField[];
  chartTypes: string[];
  defaultFormat: string;
  customizable: boolean;
}

interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean';
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const ReportsList: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runReportId, setRunReportId] = useState<string | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  const [reports] = useState<Report[]>([
    {
      id: 'rpt_001',
      name: 'Monthly Performance Report',
      type: 'standard',
      category: 'performance',
      description: 'Comprehensive fund performance analysis for the month',
      template: 'monthly_performance',
      frequency: 'monthly',
      lastRun: '2024-01-15T09:00:00Z',
      nextRun: '2024-02-15T09:00:00Z',
      status: 'active',
      created_by: 'John Doe',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T09:00:00Z',
      recipients: ['cfo@fund.com', 'investors@fund.com'],
      format: 'pdf'
    },
    {
      id: 'rpt_002',
      name: 'Investor Statements',
      type: 'standard',
      category: 'investor',
      description: 'Quarterly investor statements with performance metrics',
      template: 'investor_statements',
      frequency: 'quarterly',
      lastRun: '2024-01-01T08:00:00Z',
      nextRun: '2024-04-01T08:00:00Z',
      status: 'active',
      created_by: 'Jane Smith',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T08:00:00Z',
      recipients: ['statements@fund.com'],
      format: 'pdf'
    },
    {
      id: 'rpt_003',
      name: 'Fund Compliance Report',
      type: 'standard',
      category: 'compliance',
      description: 'Regulatory compliance and risk assessment report',
      template: 'compliance_report',
      frequency: 'quarterly',
      lastRun: '2024-01-01T10:00:00Z',
      nextRun: '2024-04-01T10:00:00Z',
      status: 'active',
      created_by: 'Compliance Team',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      recipients: ['compliance@fund.com', 'legal@fund.com'],
      format: 'pdf'
    },
    {
      id: 'rpt_004',
      name: 'Custom IRR Analysis',
      type: 'custom',
      category: 'performance',
      description: 'Custom analysis of IRR trends across multiple funds',
      template: 'custom_irr',
      status: 'draft',
      created_by: user?.full_name || 'Current User',
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
      recipients: ['analysis@fund.com'],
      format: 'excel'
    },
    {
      id: 'rpt_005',
      name: 'Capital Calls Summary',
      type: 'scheduled',
      category: 'operational',
      description: 'Weekly summary of capital calls and investor responses',
      template: 'capital_calls',
      frequency: 'weekly',
      lastRun: '2024-01-08T07:00:00Z',
      nextRun: '2024-01-15T07:00:00Z',
      status: 'active',
      created_by: 'Operations Team',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-08T07:00:00Z',
      recipients: ['operations@fund.com'],
      format: 'excel'
    }
  ]);

  const [templates] = useState<ReportTemplate[]>([
    {
      id: 'monthly_performance',
      name: 'Monthly Performance Report',
      category: 'performance',
      description: 'Standard monthly performance analysis with key metrics',
      fields: [
        { id: 'period', name: 'Reporting Period', type: 'date', required: true },
        { id: 'funds', name: 'Funds to Include', type: 'text', required: true },
        { id: 'benchmark', name: 'Benchmark Comparison', type: 'boolean', required: false }
      ],
      chartTypes: ['line', 'bar', 'pie'],
      defaultFormat: 'pdf',
      customizable: true
    },
    {
      id: 'investor_statements',
      name: 'Investor Statements',
      category: 'investor',
      description: 'Comprehensive investor statements with holdings and performance',
      fields: [
        { id: 'quarter', name: 'Quarter', type: 'date', required: true },
        { id: 'investor_type', name: 'Investor Type', type: 'text', required: false },
        { id: 'include_tax', name: 'Include Tax Information', type: 'boolean', required: false }
      ],
      chartTypes: ['pie', 'bar'],
      defaultFormat: 'pdf',
      customizable: false
    },
    {
      id: 'compliance_report',
      name: 'Compliance Report',
      category: 'compliance',
      description: 'Regulatory compliance and risk assessment',
      fields: [
        { id: 'period', name: 'Period', type: 'date', required: true },
        { id: 'regulations', name: 'Regulations', type: 'text', required: true },
        { id: 'risk_level', name: 'Risk Level', type: 'text', required: false }
      ],
      chartTypes: ['bar', 'gauge'],
      defaultFormat: 'pdf',
      customizable: false
    },
    {
      id: 'custom_irr',
      name: 'Custom IRR Analysis',
      category: 'performance',
      description: 'Customizable IRR analysis with multiple scenarios',
      fields: [
        { id: 'funds', name: 'Funds', type: 'text', required: true },
        { id: 'time_period', name: 'Time Period', type: 'date', required: true },
        { id: 'scenarios', name: 'Scenarios', type: 'text', required: false }
      ],
      chartTypes: ['line', 'scatter', 'area'],
      defaultFormat: 'excel',
      customizable: true
    },
    {
      id: 'capital_calls',
      name: 'Capital Calls Summary',
      category: 'operational',
      description: 'Summary of capital calls and investor responses',
      fields: [
        { id: 'period', name: 'Period', type: 'date', required: true },
        { id: 'fund', name: 'Fund', type: 'text', required: true },
        { id: 'status', name: 'Status', type: 'text', required: false }
      ],
      chartTypes: ['bar', 'pie'],
      defaultFormat: 'excel',
      customizable: true
    }
  ]);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || report.category === filterCategory;
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  const handleRunReport = async (reportId: string) => {
    setRunReportId(reportId);
    setIsLoading(true);
    try {
      setTimeout(() => {
        setIsLoading(false);
        setRunReportId(null);
      }, 3000);
    } catch (error) {
      setError('Failed to generate report');
      setIsLoading(false);
      setRunReportId(null);
    }
  };

  const handleCreateReport = () => {
    if (selectedTemplate) {
      setCreateDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <TrendingUp />;
      case 'investor': return <People />;
      case 'fund': return <AccountBalance />;
      case 'compliance': return <Assessment />;
      case 'financial': return <MonetizationOn />;
      case 'operational': return <Settings />;
      default: return <Assessment />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'success';
      case 'investor': return 'primary';
      case 'fund': return 'info';
      case 'compliance': return 'error';
      case 'financial': return 'warning';
      case 'operational': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const chartData = [
    { name: 'Jan', performance: 12.5, benchmark: 10.2 },
    { name: 'Feb', performance: 15.2, benchmark: 11.8 },
    { name: 'Mar', performance: 13.8, benchmark: 9.5 },
    { name: 'Apr', performance: 18.7, benchmark: 12.3 },
    { name: 'May', performance: 16.2, benchmark: 11.7 },
    { name: 'Jun', performance: 21.3, benchmark: 14.2 }
  ];

  const reportMetrics = [
    { name: 'Total Reports', value: reports.length, change: 12.5 },
    { name: 'Active Reports', value: reports.filter(r => r.status === 'active').length, change: 8.3 },
    { name: 'Scheduled Reports', value: reports.filter(r => r.type === 'scheduled').length, change: -2.1 },
    { name: 'Custom Reports', value: reports.filter(r => r.type === 'custom').length, change: 25.0 }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Reports & Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ mr: 2 }}
        >
          New Report
        </Button>
        <Button
          variant="outlined"
          startIcon={<Settings />}
          sx={{ mr: 2 }}
        >
          Templates
        </Button>
        <Button
          variant="outlined"
          startIcon={<Schedule />}
        >
          Scheduler
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {reportMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {metric.name}
                </Typography>
                <Typography variant="h4" color="primary">
                  {metric.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {metric.change >= 0 ? (
                    <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <TrendingUp sx={{ color: 'error.main', mr: 0.5, transform: 'rotate(180deg)' }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ color: metric.change >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="All Reports" />
          <Tab label="Standard Reports" />
          <Tab label="Custom Reports" />
          <Tab label="Scheduled Reports" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1 }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    <MenuItem value="performance">Performance</MenuItem>
                    <MenuItem value="investor">Investor</MenuItem>
                    <MenuItem value="fund">Fund</MenuItem>
                    <MenuItem value="compliance">Compliance</MenuItem>
                    <MenuItem value="financial">Financial</MenuItem>
                    <MenuItem value="operational">Operational</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="paused">Paused</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredReports.length} of {reports.length} reports
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Last Run</TableCell>
                  <TableCell>Next Run</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: `${getCategoryColor(report.category)}.main`, mr: 2 }}>
                          {getCategoryIcon(report.category)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {report.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.category}
                        size="small"
                        color={getCategoryColor(report.category) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.type}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        size="small"
                        color={getStatusColor(report.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      {report.frequency ? (
                        <Chip
                          label={report.frequency}
                          size="small"
                          icon={<Schedule />}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {report.lastRun ? formatDate(report.lastRun) : '-'}
                    </TableCell>
                    <TableCell>
                      {report.nextRun ? formatDate(report.nextRun) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Run Report">
                        <IconButton
                          size="small"
                          onClick={() => handleRunReport(report.id)}
                          disabled={runReportId === report.id}
                        >
                          {runReportId === report.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <PlayArrow />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small">
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Share">
                        <IconButton size="small">
                          <Share />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {templates.filter(t => reports.some(r => r.template === t.id && r.type === 'standard')).map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${getCategoryColor(template.category)}.main`, mr: 2 }}>
                      {getCategoryIcon(template.category)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {template.category}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={template.defaultFormat.toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                    <Box>
                      <Tooltip title="Generate Report">
                        <IconButton size="small" onClick={() => setGenerateDialogOpen(true)}>
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Customize">
                        <IconButton size="small" disabled={!template.customizable}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Create Custom Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
          >
            Report Builder
          </Button>
        </Box>
        <Grid container spacing={3}>
          {reports.filter(r => r.type === 'custom').map((report) => (
            <Grid item xs={12} md={6} lg={4} key={report.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${getCategoryColor(report.category)}.main`, mr: 2 }}>
                      {getCategoryIcon(report.category)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {report.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created by {report.created_by}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {report.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={report.status}
                      size="small"
                      color={getStatusColor(report.status) as any}
                    />
                    <Box>
                      <Tooltip title="Run Report">
                        <IconButton size="small" onClick={() => handleRunReport(report.id)}>
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clone">
                        <IconButton size="small">
                          <Cached />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scheduled Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage automated report generation and distribution
            </Typography>
          </CardContent>
        </Card>
        <Grid container spacing={3}>
          {reports.filter(r => r.type === 'scheduled').map((report) => (
            <Grid item xs={12} key={report.id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: `${getCategoryColor(report.category)}.main`, mr: 2 }}>
                          {getCategoryIcon(report.category)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {report.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {report.frequency}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        Last Run
                      </Typography>
                      <Typography variant="body2">
                        {report.lastRun ? formatDate(report.lastRun) : 'Never'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        Next Run
                      </Typography>
                      <Typography variant="body2">
                        {report.nextRun ? formatDate(report.nextRun) : 'Not scheduled'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Chip
                        label={report.status}
                        size="small"
                        color={getStatusColor(report.status) as any}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Run Now">
                          <IconButton size="small" onClick={() => handleRunReport(report.id)}>
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Schedule">
                          <IconButton size="small">
                            <Schedule />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Pause">
                          <IconButton size="small">
                            <Settings />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Report Performance Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="performance" stroke="#8884d8" strokeWidth={2} name="Performance %" />
                    <Line type="monotone" dataKey="benchmark" stroke="#82ca9d" strokeWidth={2} name="Benchmark %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Report Usage
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp />
                    </ListItemIcon>
                    <ListItemText
                      primary="Performance Reports"
                      secondary="45% of total runs"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <People />
                    </ListItemIcon>
                    <ListItemText
                      primary="Investor Reports"
                      secondary="30% of total runs"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Assessment />
                    </ListItemIcon>
                    <ListItemText
                      primary="Compliance Reports"
                      secondary="25% of total runs"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Report</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Select Report Template
          </Typography>
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedTemplate?.id === template.id ? '2px solid' : '1px solid',
                    borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: `${getCategoryColor(template.category)}.main`, mr: 2 }}>
                        {getCategoryIcon(template.category)}
                      </Avatar>
                      <Typography variant="h6">
                        {template.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateReport}
            variant="contained"
            disabled={!selectedTemplate}
          >
            Create Report
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Report</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Configure report parameters and generate your report.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Report Period"
                  value={new Date()}
                  onChange={() => {}}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Output Format</InputLabel>
                <Select
                  value="pdf"
                  label="Output Format"
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="html">HTML</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Recipients"
                placeholder="Enter email addresses separated by commas"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setGenerateDialogOpen(false);
              handleRunReport('temp');
            }}
            variant="contained"
            startIcon={<PlayArrow />}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ReportsPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/*" element={<ReportsList />} />
    </Routes>
  );
};

export default ReportsPage;