import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  TablePagination,
  InputAdornment,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  Checkbox,
  FormLabel
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import Search from '@mui/icons-material/Search';
import FilterList from '@mui/icons-material/FilterList';
import Download from '@mui/icons-material/Download';
import Upload from '@mui/icons-material/Upload';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Person from '@mui/icons-material/Person';
import Business from '@mui/icons-material/Business';
import AccountBalance from '@mui/icons-material/AccountBalance';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Warning from '@mui/icons-material/Warning';
import Schedule from '@mui/icons-material/Schedule';
import Phone from '@mui/icons-material/Phone';
import Email from '@mui/icons-material/Email';
import LocationOn from '@mui/icons-material/LocationOn';
import AttachFile from '@mui/icons-material/AttachFile';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Assessment from '@mui/icons-material/Assessment';
import TrendingUp from '@mui/icons-material/TrendingUp';
import MonetizationOn from '@mui/icons-material/MonetizationOn';
import History from '@mui/icons-material/History';
import Verified from '@mui/icons-material/Verified';
import Block from '@mui/icons-material/Block';
import Security from '@mui/icons-material/Security';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { Investor, CreateInvestorRequest, InvestorCommitment } from '../../types/investor';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

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

const InvestorsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterKYC, setFilterKYC] = useState<string>('all');
  const [filterAML, setFilterAML] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateInvestorRequest>({
    investor_name: '',
    investor_type: 'institutional',
    email: '',
    phone: '',
    address: {
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    },
    tax_id: '',
    accredited_investor: false,
    qualified_purchaser: false
  });

  const [investors] = useState<Investor[]>([
    {
      investor_id: 'inv_001',
      investor_name: 'Pension Fund ABC',
      investor_type: 'pension_fund',
      email: 'contact@pensionfundabc.com',
      phone: '+1-555-0123',
      address: {
        street_address: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US'
      },
      tax_id: '12-3456789',
      kyc_status: 'approved',
      aml_status: 'approved',
      accredited_investor: true,
      qualified_purchaser: true,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      investor_id: 'inv_002',
      investor_name: 'Endowment University',
      investor_type: 'endowment',
      email: 'investments@university.edu',
      phone: '+1-555-0124',
      address: {
        street_address: '456 University Ave',
        city: 'Boston',
        state: 'MA',
        postal_code: '02138',
        country: 'US'
      },
      tax_id: '12-7890123',
      kyc_status: 'approved',
      aml_status: 'approved',
      accredited_investor: true,
      qualified_purchaser: true,
      is_active: true,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z'
    },
    {
      investor_id: 'inv_003',
      investor_name: 'Family Office XYZ',
      investor_type: 'family_office',
      email: 'admin@familyofficexyz.com',
      phone: '+1-555-0125',
      address: {
        street_address: '789 Wealth St',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94105',
        country: 'US'
      },
      tax_id: '12-4567890',
      kyc_status: 'pending',
      aml_status: 'approved',
      accredited_investor: true,
      qualified_purchaser: true,
      is_active: true,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-17T00:00:00Z'
    },
    {
      investor_id: 'inv_004',
      investor_name: 'Sovereign Wealth Fund',
      investor_type: 'sovereign_wealth',
      email: 'investments@swf.gov',
      phone: '+1-555-0126',
      address: {
        street_address: '321 Government Blvd',
        city: 'Washington',
        state: 'DC',
        postal_code: '20001',
        country: 'US'
      },
      tax_id: '12-9876543',
      kyc_status: 'approved',
      aml_status: 'approved',
      accredited_investor: true,
      qualified_purchaser: true,
      is_active: true,
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-18T00:00:00Z'
    },
    {
      investor_id: 'inv_005',
      investor_name: 'John Smith',
      investor_type: 'individual',
      email: 'john.smith@email.com',
      phone: '+1-555-0127',
      address: {
        street_address: '654 Private Rd',
        city: 'Greenwich',
        state: 'CT',
        postal_code: '06830',
        country: 'US'
      },
      tax_id: '123-45-6789',
      kyc_status: 'approved',
      aml_status: 'pending',
      accredited_investor: true,
      qualified_purchaser: false,
      is_active: true,
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-19T00:00:00Z'
    }
  ]);

  const handleCreateInvestor = async () => {
    setIsLoading(true);
    try {
      setTimeout(() => {
        setCreateDialogOpen(false);
        setFormData({
          investor_name: '',
          investor_type: 'institutional',
          email: '',
          phone: '',
          address: {
            street_address: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'US'
          },
          tax_id: '',
          accredited_investor: false,
          qualified_purchaser: false
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setError('Failed to create investor');
      setIsLoading(false);
    }
  };

  const handleDeleteInvestor = async (investorId: string) => {
    setIsLoading(true);
    try {
      setTimeout(() => {
        setDeleteDialogOpen(null);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setError('Failed to delete investor');
      setIsLoading(false);
    }
  };

  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = investor.investor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || investor.investor_type === filterType;
    const matchesKYC = filterKYC === 'all' || investor.kyc_status === filterKYC;
    const matchesAML = filterAML === 'all' || investor.aml_status === filterAML;
    return matchesSearch && matchesType && matchesKYC && matchesAML;
  });

  const paginatedInvestors = filteredInvestors.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getInvestorTypeIcon = (type: string) => {
    switch (type) {
      case 'institutional': return <Business />;
      case 'individual': return <Person />;
      case 'family_office': return <AccountBalance />;
      case 'pension_fund': return <AccountBalance />;
      case 'endowment': return <AccountBalance />;
      case 'sovereign_wealth': return <AccountBalance />;
      case 'insurance': return <Business />;
      default: return <Person />;
    }
  };

  const getInvestorTypeLabel = (type: string) => {
    switch (type) {
      case 'institutional': return 'Institutional';
      case 'individual': return 'Individual';
      case 'family_office': return 'Family Office';
      case 'pension_fund': return 'Pension Fund';
      case 'endowment': return 'Endowment';
      case 'sovereign_wealth': return 'Sovereign Wealth';
      case 'insurance': return 'Insurance';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'rejected': return <Block />;
      default: return undefined;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Investors Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ mr: 2 }}
        >
          Add Investor
        </Button>
        <Button
          variant="outlined"
          startIcon={<Upload />}
          sx={{ mr: 2 }}
        >
          Import
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download />}
        >
          Export
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Investors
              </Typography>
              <Typography variant="h4" color="primary">
                {investors.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Commitments
              </Typography>
              <Typography variant="h4" color="success.main">
                {investors.filter(i => i.is_active).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending KYC
              </Typography>
              <Typography variant="h4" color="warning.main">
                {investors.filter(i => i.kyc_status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accredited
              </Typography>
              <Typography variant="h4" color="info.main">
                {investors.filter(i => i.accredited_investor).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search investors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
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
                  <MenuItem value="institutional">Institutional</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="family_office">Family Office</MenuItem>
                  <MenuItem value="pension_fund">Pension Fund</MenuItem>
                  <MenuItem value="endowment">Endowment</MenuItem>
                  <MenuItem value="sovereign_wealth">Sovereign Wealth</MenuItem>
                  <MenuItem value="insurance">Insurance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>KYC Status</InputLabel>
                <Select
                  value={filterKYC}
                  onChange={(e) => setFilterKYC(e.target.value)}
                  label="KYC Status"
                >
                  <MenuItem value="all">All KYC</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>AML Status</InputLabel>
                <Select
                  value={filterAML}
                  onChange={(e) => setFilterAML(e.target.value)}
                  label="AML Status"
                >
                  <MenuItem value="all">All AML</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredInvestors.length} of {investors.length} investors
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
                <TableCell>Investor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>KYC Status</TableCell>
                <TableCell>AML Status</TableCell>
                <TableCell>Accredited</TableCell>
                <TableCell>Qualified Purchaser</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvestors.map((investor) => (
                  <TableRow key={investor.investor_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {getInvestorTypeIcon(investor.investor_type)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {investor.investor_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {investor.investor_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getInvestorTypeLabel(investor.investor_type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {investor.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {investor.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(investor.kyc_status)}
                        label={investor.kyc_status}
                        size="small"
                        color={getStatusColor(investor.kyc_status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(investor.aml_status)}
                        label={investor.aml_status}
                        size="small"
                        color={getStatusColor(investor.aml_status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={investor.accredited_investor ? <Verified /> : <Block />}
                        label={investor.accredited_investor ? 'Yes' : 'No'}
                        size="small"
                        color={investor.accredited_investor ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={investor.qualified_purchaser ? <Security /> : <Block />}
                        label={investor.qualified_purchaser ? 'Yes' : 'No'}
                        size="small"
                        color={investor.qualified_purchaser ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/investors/${investor.investor_id}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/investors/${investor.investor_id}/edit`)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialogOpen(investor.investor_id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredInvestors.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Investor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Investor Name"
                value={formData.investor_name}
                onChange={(e) => setFormData({ ...formData, investor_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Investor Type</InputLabel>
                <Select
                  value={formData.investor_type}
                  onChange={(e) => setFormData({ ...formData, investor_type: e.target.value as any })}
                  label="Investor Type"
                >
                  <MenuItem value="institutional">Institutional</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="family_office">Family Office</MenuItem>
                  <MenuItem value="pension_fund">Pension Fund</MenuItem>
                  <MenuItem value="endowment">Endowment</MenuItem>
                  <MenuItem value="sovereign_wealth">Sovereign Wealth</MenuItem>
                  <MenuItem value="insurance">Insurance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tax ID"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address?.street_address}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, street_address: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.address?.city}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, city: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.address?.state}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, state: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.address?.postal_code}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, postal_code: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.accredited_investor}
                      onChange={(e) => setFormData({ ...formData, accredited_investor: e.target.checked })}
                    />
                  }
                  label="Accredited Investor"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.qualified_purchaser}
                      onChange={(e) => setFormData({ ...formData, qualified_purchaser: e.target.checked })}
                    />
                  }
                  label="Qualified Purchaser"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateInvestor} variant="contained" disabled={!formData.investor_name || !formData.email}>
            Add Investor
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteDialogOpen} onClose={() => setDeleteDialogOpen(null)}>
        <DialogTitle>Delete Investor</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this investor? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(null)}>Cancel</Button>
          <Button
            onClick={() => deleteDialogOpen && handleDeleteInvestor(deleteDialogOpen)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const InvestorDetail: React.FC = () => {
  const { investorId } = useParams<{ investorId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const investor: Investor = {
    investor_id: 'inv_001',
    investor_name: 'Pension Fund ABC',
    investor_type: 'pension_fund',
    email: 'contact@pensionfundabc.com',
    phone: '+1-555-0123',
    address: {
      street_address: '123 Main St',
      city: 'New York',
      state: 'NY',
      postal_code: '10001',
      country: 'US'
    },
    tax_id: '12-3456789',
    kyc_status: 'approved',
    aml_status: 'approved',
    accredited_investor: true,
    qualified_purchaser: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  };

  const commitments: InvestorCommitment[] = [
    {
      commitment_id: 'comm_001',
      investor_id: 'inv_001',
      fund_id: 'fund_001',
      commitment_amount: 50000000,
      commitment_date: '2024-01-01',
      commitment_percentage: 10.0,
      called_amount: 30000000,
      uncalled_amount: 20000000,
      distributed_amount: 5000000,
      current_value: 55000000,
      status: 'active'
    },
    {
      commitment_id: 'comm_002',
      investor_id: 'inv_001',
      fund_id: 'fund_002',
      commitment_amount: 25000000,
      commitment_date: '2024-02-01',
      commitment_percentage: 8.0,
      called_amount: 15000000,
      uncalled_amount: 10000000,
      distributed_amount: 2000000,
      current_value: 28000000,
      status: 'active'
    }
  ];

  const performanceData = [
    { period: '2024-Q1', value: 50000000, distributions: 1000000, irr: 15.2 },
    { period: '2024-Q2', value: 55000000, distributions: 1500000, irr: 18.7 },
    { period: '2024-Q3', value: 52000000, distributions: 2000000, irr: 16.8 },
    { period: '2024-Q4', value: 58000000, distributions: 2500000, irr: 21.3 }
  ];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getInvestorTypeLabel = (type: string) => {
    switch (type) {
      case 'institutional': return 'Institutional';
      case 'individual': return 'Individual';
      case 'family_office': return 'Family Office';
      case 'pension_fund': return 'Pension Fund';
      case 'endowment': return 'Endowment';
      case 'sovereign_wealth': return 'Sovereign Wealth';
      case 'insurance': return 'Insurance';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!investor) {
    return (
      <Alert severity="error">
        Investor not found or failed to load.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/investors')}
          sx={{ mr: 2 }}
        >
          Back to Investors
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {investor.investor_name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate(`/investors/${investor.investor_id}/edit`)}
        >
          Edit Investor
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Commitments
              </Typography>
              <Typography variant="h4" color="primary">
                {formatCurrency(commitments.reduce((sum, c) => sum + c.commitment_amount, 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Called Capital
              </Typography>
              <Typography variant="h4" color="warning.main">
                {formatCurrency(commitments.reduce((sum, c) => sum + c.called_amount, 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Value
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatCurrency(commitments.reduce((sum, c) => sum + c.current_value, 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distributions
              </Typography>
              <Typography variant="h4" color="info.main">
                {formatCurrency(commitments.reduce((sum, c) => sum + c.distributed_amount, 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Commitments" />
          <Tab label="Performance" />
          <Tab label="Documents" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Investor Details
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Investor Type"
                      secondary={getInvestorTypeLabel(investor.investor_type)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Email"
                      secondary={investor.email}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Phone"
                      secondary={investor.phone}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Tax ID"
                      secondary={investor.tax_id}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Address"
                      secondary={`${investor.address?.street_address}, ${investor.address?.city}, ${investor.address?.state} ${investor.address?.postal_code}`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Compliance Status
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="KYC Status" />
                    <Chip
                      label={investor.kyc_status}
                      color={getStatusColor(investor.kyc_status) as any}
                      size="small"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="AML Status" />
                    <Chip
                      label={investor.aml_status}
                      color={getStatusColor(investor.aml_status) as any}
                      size="small"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Accredited Investor" />
                    <Chip
                      label={investor.accredited_investor ? 'Yes' : 'No'}
                      color={investor.accredited_investor ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Qualified Purchaser" />
                    <Chip
                      label={investor.qualified_purchaser ? 'Yes' : 'No'}
                      color={investor.qualified_purchaser ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Status" />
                    <Chip
                      label={investor.is_active ? 'Active' : 'Inactive'}
                      color={investor.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Fund Commitments
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fund</TableCell>
                    <TableCell align="right">Commitment</TableCell>
                    <TableCell align="right">Called</TableCell>
                    <TableCell align="right">Uncalled</TableCell>
                    <TableCell align="right">Distributed</TableCell>
                    <TableCell align="right">Current Value</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commitments.map((commitment) => (
                    <TableRow key={commitment.commitment_id}>
                      <TableCell>{commitment.fund_id}</TableCell>
                      <TableCell align="right">{formatCurrency(commitment.commitment_amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(commitment.called_amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(commitment.uncalled_amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(commitment.distributed_amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(commitment.current_value)}</TableCell>
                      <TableCell>
                        <Chip
                          label={commitment.status}
                          color={commitment.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Portfolio Value Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [formatCurrency(value as number), 'Value']} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} name="Portfolio Value" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distributions by Quarter
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [formatCurrency(value as number), 'Distribution']} />
                    <Legend />
                    <Bar dataKey="distributions" fill="#82ca9d" name="Distributions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Documents
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Document management functionality will be available here.
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

const InvestorsPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<InvestorsList />} />
      <Route path="/:investorId" element={<InvestorDetail />} />
    </Routes>
  );
};

export default InvestorsPage;