import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  TrendingUp as DrawdownIcon,
  TrendingDown as PaydownIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '../../hooks/redux';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

interface CreditFacility {
  id: string;
  facilityName: string;
  facilityType: 'revolving' | 'term' | 'bridge' | 'acquisition';
  lender: string;
  originalAmount: string;
  currentBalance: string;
  availableAmount: string;
  interestRate: string;
  facilityStatus: 'active' | 'closed' | 'frozen' | 'defaulted';
  maturityDate: string;
  utilizationRate: number;
  fundId: string;
  fund?: {
    id: string;
    name: string;
  };
}

const CreditFacilityList: React.FC = () => {
  const navigate = useNavigate();
  useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [facilities, setFacilities] = useState<CreditFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCreditFacilities();
  }, []);

  const fetchCreditFacilities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/credit-facilities');
      setFacilities(response.data.data);
    } catch (error) {
      console.error('Error fetching credit facilities:', error);
      enqueueSnackbar('Failed to load credit facilities', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/credit-facilities/new');
  };

  const handleViewFacility = (facilityId: string) => {
    navigate(`/credit-facilities/${facilityId}`);
  };

  const handleEditFacility = (facilityId: string) => {
    navigate(`/credit-facilities/${facilityId}/edit`);
  };

  const handleDrawdown = (facilityId: string) => {
    navigate(`/credit-facilities/${facilityId}/drawdown`);
  };

  const handlePaydown = (facilityId: string) => {
    navigate(`/credit-facilities/${facilityId}/paydown`);
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'closed':
        return 'default';
      case 'frozen':
        return 'warning';
      case 'defaulted':
        return 'error';
      default:
        return 'default';
    }
  };

  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= 90) return '#f44336'; // red
    if (utilization >= 75) return '#ff9800'; // orange
    if (utilization >= 50) return '#ffc107'; // amber
    return '#4caf50'; // green
  };

  const filteredFacilities = facilities.filter(
    facility =>
      facility.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.lender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.fund?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Credit Facilities
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          New Facility
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={3} alignItems="center">
            <Box flex={1}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search facilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box>
              <IconButton onClick={fetchCreditFacilities} color="primary">
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Facility Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Lender</TableCell>
                <TableCell>Fund</TableCell>
                <TableCell align="right">Original Amount</TableCell>
                <TableCell align="right">Current Balance</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="center">Utilization</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Maturity Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFacilities.map((facility) => (
                <TableRow key={facility.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {facility.facilityName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={facility.facilityType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{facility.lender}</TableCell>
                  <TableCell>{facility.fund?.name || '-'}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(parseFloat(facility.originalAmount))}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(parseFloat(facility.currentBalance))}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(parseFloat(facility.availableAmount))}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={facility.utilizationRate}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getUtilizationColor(facility.utilizationRate),
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ minWidth: 40 }}>
                        {formatPercentage(facility.utilizationRate / 100)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={facility.facilityStatus}
                      size="small"
                      color={getStatusColor(facility.facilityStatus)}
                    />
                  </TableCell>
                  <TableCell>{formatDate(facility.maturityDate)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewFacility(facility.id)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditFacility(facility.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {facility.facilityStatus === 'active' && (
                        <>
                          <Tooltip title="Request Drawdown">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleDrawdown(facility.id)}
                              disabled={parseFloat(facility.availableAmount) === 0}
                            >
                              <DrawdownIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Make Payment">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handlePaydown(facility.id)}
                              disabled={parseFloat(facility.currentBalance) === 0}
                            >
                              <PaydownIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFacilities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                      No credit facilities found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Summary Statistics */}
      <Box display="flex" gap={3} sx={{ mt: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Facilities
            </Typography>
            <Typography variant="h5">
              {facilities.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Credit Line
            </Typography>
            <Typography variant="h5">
              {formatCurrency(
                facilities.reduce((sum, f) => sum + parseFloat(f.originalAmount), 0)
              )}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Outstanding
            </Typography>
            <Typography variant="h5">
              {formatCurrency(
                facilities.reduce((sum, f) => sum + parseFloat(f.currentBalance), 0)
              )}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Available
            </Typography>
            <Typography variant="h5">
              {formatCurrency(
                facilities.reduce((sum, f) => sum + parseFloat(f.availableAmount), 0)
              )}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default CreditFacilityList;