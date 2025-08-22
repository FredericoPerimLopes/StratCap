import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchInvestors,
  createInvestor,
  deleteInvestor,
  clearError
} from '../../store/slices/investorSlice';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as PlusIcon,
  Search as MagnifyingGlassIcon,
  Visibility as EyeIcon,
  Edit as PencilIcon,
  Delete as TrashIcon,
  FilterList as FunnelIcon,
  FileDownload as DocumentArrowDownIcon,
  FileUpload as DocumentArrowUpIcon,
  Person as UserIcon,
  Business as BuildingOfficeIcon,
  Security as ShieldCheckIcon,
  Warning as ExclamationTriangleIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface InvestorFormData {
  name: string;
  legalName: string;
  type: 'individual' | 'institution' | 'fund' | 'trust' | 'other';
  domicile: string;
  accreditedInvestor: boolean;
  qualifiedPurchaser: boolean;
  primaryEmail: string;
  primaryPhone: string;
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'expired';
  amlStatus?: 'pending' | 'approved' | 'rejected' | 'expired';
}

const InvestorsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { investors, isLoading, error } = useSelector((state: RootState) => state.investor);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterKycStatus, setFilterKycStatus] = useState('');
  
  // Ensure investors is an array before filtering
  const investorsArray = Array.isArray(investors) ? investors : [];
  
  // Debug logging
  console.log('Debug - investors from Redux:', investors);
  console.log('Debug - typeof investors:', typeof investors);
  console.log('Debug - Array.isArray(investors):', Array.isArray(investors));
  console.log('Debug - investors length:', investorsArray.length);
  console.log('Debug - isLoading:', isLoading);
  console.log('Debug - error:', error);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [formData, setFormData] = useState<InvestorFormData>({
    name: '',
    legalName: '',
    type: 'institution',
    domicile: 'US',
    accreditedInvestor: false,
    qualifiedPurchaser: false,
    primaryEmail: '',
    primaryPhone: '',
    kycStatus: 'pending',
    amlStatus: 'pending'
  });

  useEffect(() => {
    dispatch(fetchInvestors());
  }, [dispatch]);

  const handleCreateInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.legalName || !formData.primaryEmail || !formData.primaryPhone) {
      console.error('All required fields must be filled');
      return;
    }
    
    // Validate email format
    if (!/\S+@\S+\.\S+/.test(formData.primaryEmail)) {
      console.error('Please enter a valid email address');
      return;
    }
    
    try {
      const submissionData = {
        ...formData,
        kycStatus: formData.kycStatus || 'pending',
        amlStatus: formData.amlStatus || 'pending'
      };
      await dispatch(createInvestor(submissionData)).unwrap();
      setShowCreateModal(false);
      setFormData({
        name: '',
        legalName: '',
        type: 'institution',
        domicile: 'US',
        accreditedInvestor: false,
        qualifiedPurchaser: false,
        primaryEmail: '',
        primaryPhone: '',
        kycStatus: 'pending',
        amlStatus: 'pending'
      });
    } catch (error) {
      console.error('Failed to create investor:', error);
    }
  };

  const handleDeleteInvestor = async (id: number) => {
    try {
      await dispatch(deleteInvestor(id)).unwrap();
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete investor:', error);
    }
  };

  const filteredInvestors = investorsArray.filter(investor => {
    const matchesSearch = (investor.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (investor.legalName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (investor.primaryEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = !filterType || investor.type === filterType;
    const matchesKyc = !filterKycStatus || investor.kycStatus === filterKycStatus;
    return matchesSearch && matchesType && matchesKyc;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'pending': return <ClockIcon sx={{ fontSize: 16 }} />;
      case 'rejected': return <ExclamationTriangleIcon sx={{ fontSize: 16 }} />;
      case 'expired': return <ExclamationTriangleIcon sx={{ fontSize: 16 }} />;
      default: return <ClockIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <UserIcon sx={{ fontSize: 20, color: 'primary.main' }} />;
      case 'institution': return <BuildingOfficeIcon sx={{ fontSize: 20, color: 'success.main' }} />;
      case 'fund': return <BuildingOfficeIcon sx={{ fontSize: 20, color: 'secondary.main' }} />;
      case 'trust': return <ShieldCheckIcon sx={{ fontSize: 20, color: 'warning.main' }} />;
      default: return <UserIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
    }
  };

  // Generate chart data from actual investors
  const generateChartData = () => {
    // Always generate data based on actual investors array, even if empty
    const typeCounts = investorsArray.reduce((acc, investor) => {
      acc[investor.type] = (acc[investor.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const kycCounts = investorsArray.reduce((acc, investor) => {
      const kycStatus = investor.kycStatus || 'pending'; // Default to pending if no status
      acc[kycStatus] = (acc[kycStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate geographic data from actual investors
    const geoCounts = investorsArray.reduce((acc, investor) => {
      const region = getRegionFromDomicile(investor.domicile || 'Unknown');
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Debug - Actual investor count:', investorsArray.length);
    console.log('Debug - typeCounts:', typeCounts);
    console.log('Debug - kycCounts:', kycCounts);
    console.log('Debug - geoCounts:', geoCounts);

    const investorTypeData = [
      { name: 'Institution', value: typeCounts.institution || 0, color: '#10B981' },
      { name: 'Individual', value: typeCounts.individual || 0, color: '#3B82F6' },
      { name: 'Fund', value: typeCounts.fund || 0, color: '#8B5CF6' },
      { name: 'Trust', value: typeCounts.trust || 0, color: '#F59E0B' },
      { name: 'Other', value: typeCounts.other || 0, color: '#6B7280' }
    ].filter(item => item.value > 0); // Only show types that exist

    const kycStatusData = [
      { name: 'Approved', value: kycCounts.approved || 0, fill: '#10B981' },
      { name: 'Pending', value: kycCounts.pending || 0, fill: '#F59E0B' },
      { name: 'Rejected', value: kycCounts.rejected || 0, fill: '#EF4444' },
      { name: 'Expired', value: kycCounts.expired || 0, fill: '#6B7280' }
    ];

    const geographicData = Object.entries(geoCounts).map(([region, count]) => ({
      region,
      count: count as number
    }));

    return { 
      investorTypeData, 
      kycStatusData,
      geographicData,
      hasData: investorsArray.length > 0
    };
  };

  // Helper function to map domicile to regions
  const getRegionFromDomicile = (domicile: string): string => {
    const regionMap: Record<string, string> = {
      'US': 'North America',
      'CA': 'North America',
      'MX': 'North America',
      'GB': 'Europe',
      'DE': 'Europe',
      'FR': 'Europe',
      'IT': 'Europe',
      'ES': 'Europe',
      'NL': 'Europe',
      'CH': 'Europe',
      'JP': 'Asia Pacific',
      'CN': 'Asia Pacific',
      'HK': 'Asia Pacific',
      'SG': 'Asia Pacific',
      'AU': 'Asia Pacific',
      'KR': 'Asia Pacific',
      'AE': 'Middle East',
      'SA': 'Middle East',
      'QA': 'Middle East',
      'KW': 'Middle East'
    };
    return regionMap[domicile] || 'Other';
  };

  const { investorTypeData, kycStatusData, geographicData, hasData } = generateChartData();
  
  console.log('Debug - Generated investorTypeData:', investorTypeData);
  console.log('Debug - Generated kycStatusData:', kycStatusData);
  console.log('Debug - Generated geographicData:', geographicData);
  console.log('Debug - hasData:', hasData);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Investor Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DocumentArrowUpIcon />}
          >
            Import
          </Button>
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
            Add Investor
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

      {/* Analytics Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 4, mb: 4 }}>
        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>Investor Types</Typography>
              {!hasData || investorTypeData.length === 0 ? (
                <Box sx={{ height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No investor data available
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                    Add investors to see type distribution
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <Pie
                          data={investorTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={65}
                          fill="#8884d8"
                          dataKey="value"
                          label={false}
                        >
                          {investorTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  {/* Legend */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 2 }}>
                    {investorTypeData.map((entry, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: entry.color, borderRadius: '50%' }} />
                        <Typography variant="caption">{entry.name}: {entry.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>KYC Status</Typography>
              {!hasData ? (
                <Box sx={{ height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No KYC data available
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                    Add investors to see KYC status distribution
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2 }}>
                  {kycStatusData.map((item, index) => {
                    const maxValue = Math.max(...kycStatusData.map(d => d.value), 1);
                    const widthPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    
                    return (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.value}
                          </Typography>
                        </Box>
                        <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                          <Box
                            sx={{
                              height: '100%',
                              width: item.value > 0 ? `${Math.max(widthPercentage, 5)}%` : '0%',
                              bgcolor: item.fill,
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>Geographic Distribution</Typography>
              {!hasData || geographicData.length === 0 ? (
                <Box sx={{ height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No geographic data available
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                    Add investors to see geographic distribution
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {geographicData.map((region, index) => {
                    const maxCount = Math.max(...geographicData.map(r => r.count), 1);
                    const widthPercentage = maxCount > 0 ? (region.count / maxCount) * 100 : 0;
                    
                    return (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 100 }}>
                          {region.region}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          <Box sx={{ width: 80, height: 8, bgcolor: 'grey.200', borderRadius: 1 }}>
                            <Box 
                              sx={{ 
                                height: 8, 
                                bgcolor: 'primary.main', 
                                borderRadius: 1,
                                width: region.count > 0 ? `${Math.max(widthPercentage, 10)}%` : '0%',
                                transition: 'width 0.3s ease'
                              }} 
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                            {region.count}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, alignItems: 'center' }}>
            <Box>
              <TextField
                fullWidth
                placeholder="Search investors..."
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
            </Box>
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Investor Type</InputLabel>
                <Select
                  value={filterType}
                  label="Investor Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="institution">Institution</MenuItem>
                  <MenuItem value="fund">Fund</MenuItem>
                  <MenuItem value="trust">Trust</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>KYC Status</InputLabel>
                <Select
                  value={filterKycStatus}
                  label="KYC Status"
                  onChange={(e) => setFilterKycStatus(e.target.value)}
                >
                  <MenuItem value="">All KYC Status</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FunnelIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2" color="text.secondary">
                  {filteredInvestors.length} of {investorsArray.length} investors
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Investors Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Investor</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Domicile</TableCell>
              <TableCell>KYC Status</TableCell>
              <TableCell>AML Status</TableCell>
              <TableCell>Accredited</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredInvestors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No investors found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvestors.map((investor) => (
                  <TableRow key={investor.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getTypeIcon(investor.type)}
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {investor.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {investor.legalName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={investor.type} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{investor.domicile}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={investor.kycStatus}
                        size="small"
                        color={investor.kycStatus === 'approved' ? 'success' : investor.kycStatus === 'pending' ? 'warning' : 'error'}
                        icon={getStatusIcon(investor.kycStatus)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={investor.amlStatus}
                        size="small"
                        color={investor.amlStatus === 'approved' ? 'success' : investor.amlStatus === 'pending' ? 'warning' : 'error'}
                        icon={getStatusIcon(investor.amlStatus)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {investor.accreditedInvestor && (
                          <Chip 
                            label="Accredited" 
                            size="small" 
                            color="success"
                            variant="outlined"
                          />
                        )}
                        {investor.qualifiedPurchaser && (
                          <Chip 
                            label="Qualified" 
                            size="small" 
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {investor.primaryEmail && (
                          <Typography variant="body2">{investor.primaryEmail}</Typography>
                        )}
                        {investor.primaryPhone && (
                          <Typography variant="body2" color="text.secondary">{investor.primaryPhone}</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <IconButton
                          size="small"
                          component={Link}
                          to={`/investors/${investor.id}`}
                          color="primary"
                        >
                          <EyeIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          component={Link}
                          to={`/investors/${investor.id}/edit`}
                          color="success"
                        >
                          <PencilIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setShowDeleteModal(investor.id)}
                          color="error"
                        >
                          <TrashIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Investor Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Investor</DialogTitle>
        <form onSubmit={handleCreateInvestor}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <TextField
                label="Name"
                required
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                label="Legal Name"
                required
                fullWidth
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="institution">Institution</MenuItem>
                  <MenuItem value="fund">Fund</MenuItem>
                  <MenuItem value="trust">Trust</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Domicile"
                required
                fullWidth
                value={formData.domicile}
                onChange={(e) => setFormData({ ...formData, domicile: e.target.value })}
              />
              <TextField
                label="Primary Email"
                type="email"
                required
                fullWidth
                value={formData.primaryEmail}
                onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                helperText="Primary contact email address"
                error={formData.primaryEmail.length > 0 && !/\S+@\S+\.\S+/.test(formData.primaryEmail)}
              />
              <TextField
                label="Primary Phone"
                type="tel"
                required
                fullWidth
                value={formData.primaryPhone}
                onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                helperText="Primary contact phone number"
                placeholder="+1 (555) 123-4567"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.accreditedInvestor}
                      onChange={(e) => setFormData({ ...formData, accreditedInvestor: e.target.checked })}
                    />
                  }
                  label="Accredited Investor"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.qualifiedPurchaser}
                      onChange={(e) => setFormData({ ...formData, qualifiedPurchaser: e.target.checked })}
                    />
                  }
                  label="Qualified Purchaser"
                />
              </Box>
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
              disabled={
                !formData.name || 
                !formData.legalName || 
                !formData.primaryEmail || 
                !formData.primaryPhone ||
                !/\S+@\S+\.\S+/.test(formData.primaryEmail)
              }
            >
              Add Investor
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteModal !== null}
        onClose={() => setShowDeleteModal(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Investor</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this investor? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteModal(null)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => showDeleteModal && handleDeleteInvestor(showDeleteModal)}
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

export default InvestorsPage;