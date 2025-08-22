import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchFundById,
  clearCurrentFund,
  clearError
} from '../../store/slices/fundSlice';

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
      id={`fund-tabpanel-${index}`}
      aria-labelledby={`fund-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const FundDetails: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  const { currentFund, isLoading, error } = useSelector((state: RootState) => state.fund);
  const [tabValue, setTabValue] = React.useState(0);

  useEffect(() => {
    if (id) {
      dispatch(fetchFundById(parseInt(id)));
    }
    
    return () => {
      dispatch(clearCurrentFund());
      dispatch(clearError());
    };
  }, [dispatch, id]);

  const handleBack = () => {
    navigate('/funds');
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'fundraising': return 'info';
      case 'investing': return 'success';
      case 'harvesting': return 'warning';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatPercentage = (rate: string | number) => {
    const num = typeof rate === 'string' ? parseFloat(rate) : rate;
    return `${(num * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!currentFund) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Fund not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Funds
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mb: 1 }}
          >
            Back to Funds
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                {currentFund.name}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {currentFund.code}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            component={Link}
            to={`/funds/${currentFund.id}/edit`}
          >
            Edit Fund
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => dispatch(clearError())}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Fund Overview Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <MoneyIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h6" component="div">
              {formatCurrency(currentFund.targetSize)}
            </Typography>
            <Typography color="text.secondary">
              Target Size
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CalendarIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h6" component="div">
              {currentFund.vintage}
            </Typography>
            <Typography color="text.secondary">
              Vintage Year
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6" component="div">
              {formatPercentage(currentFund.carriedInterestRate)}
            </Typography>
            <Typography color="text.secondary">
              Carried Interest
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" component="div">
              {formatPercentage(currentFund.managementFeeRate)}
            </Typography>
            <Typography color="text.secondary">
              Management Fee
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="fund details tabs">
            <Tab label="Overview" icon={<BusinessIcon />} iconPosition="start" />
            <Tab label="Performance" icon={<AssessmentIcon />} iconPosition="start" />
            <Tab label="Investors" icon={<GroupIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3 
          }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Fund Name</strong></TableCell>
                    <TableCell>{currentFund.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Fund Code</strong></TableCell>
                    <TableCell>{currentFund.code}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Fund Type</strong></TableCell>
                    <TableCell>
                      <Chip label={currentFund.type} size="small" color="primary" variant="outlined" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell>
                      <Chip 
                        label={currentFund.status} 
                        size="small" 
                        color={getStatusColor(currentFund.status)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Vintage Year</strong></TableCell>
                    <TableCell>{currentFund.vintage}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Currency</strong></TableCell>
                    <TableCell>{currentFund.currency}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Financial Structure</Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Target Size</strong></TableCell>
                    <TableCell>{formatCurrency(currentFund.targetSize)}</TableCell>
                  </TableRow>
                  {currentFund.hardCap && (
                    <TableRow>
                      <TableCell><strong>Hard Cap</strong></TableCell>
                      <TableCell>{formatCurrency(currentFund.hardCap)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell><strong>Management Fee</strong></TableCell>
                    <TableCell>{formatPercentage(currentFund.managementFeeRate)} annually</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Carried Interest</strong></TableCell>
                    <TableCell>{formatPercentage(currentFund.carriedInterestRate)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Preferred Return</strong></TableCell>
                    <TableCell>{formatPercentage(currentFund.preferredReturnRate)} annually</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Created Date</strong></TableCell>
                    <TableCell>
                      {currentFund.createdAt ? new Date(currentFund.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Box>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 3 }}>Fund Performance</Typography>
          <Alert severity="info">
            Performance data and analytics will be available once the fund has operational history.
          </Alert>
          {/* TODO: Add performance charts and metrics */}
        </TabPanel>

        {/* Investors Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 3 }}>Fund Investors</Typography>
          <Alert severity="info">
            Investor information and commitment details will be displayed here.
          </Alert>
          {/* TODO: Add investor list and commitment details */}
        </TabPanel>
      </Card>
    </Box>
  );
};

export default FundDetails;
