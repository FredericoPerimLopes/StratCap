import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
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
  Card,
  CardContent,
  Alert,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as ExportIcon,
  CloudUpload as ImportIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchFunds,
  deleteFund,
  clearError
} from '../../store/slices/fundSlice';

// interface FundFormData {
//   fundFamilyId?: number;
//   name: string;
//   code: string;
//   type: 'master' | 'feeder' | 'parallel' | 'subsidiary';
//   vintage: number;
//   targetSize: string;
//   currency: string;
//   status?: 'fundraising' | 'investing' | 'harvesting' | 'closed';
//   managementFeeRate: string;
//   carriedInterestRate: string;
//   preferredReturnRate: string;
// }

const FundsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { funds, isLoading, error } = useSelector((state: RootState) => state.fund);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  // const [showCreateModal, setShowCreateModal] = useState(false);
  // const [formData, setFormData] = useState<FundFormData>({
  //   name: '',
  //   code: '',
  //   type: 'master',
  //   vintage: new Date().getFullYear(),
  //   targetSize: '',
  //   currency: 'USD',
  //   managementFeeRate: '2.0',
  //   carriedInterestRate: '20.0',
  //   preferredReturnRate: '8.0',
  //   fundFamilyId: 1,
  //   status: 'fundraising'
  // });

  useEffect(() => {
    dispatch(fetchFunds());
  }, [dispatch]);

  // const handleCreateFund = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     const submissionData = {
  //       ...formData,
  //       fundFamilyId: formData.fundFamilyId || 1,
  //       status: formData.status || 'fundraising'
  //     };
  //     await dispatch(createFund(submissionData)).unwrap();
  //     setShowCreateModal(false);
  //     setFormData({
  //       name: '',
  //       code: '',
  //       type: 'master',
  //       vintage: new Date().getFullYear(),
  //       targetSize: '',
  //       currency: 'USD',
  //       managementFeeRate: '2.0',
  //       carriedInterestRate: '20.0',
  //       preferredReturnRate: '8.0',
  //       fundFamilyId: 1,
  //       status: 'fundraising'
  //     });
  //   } catch (error) {
  //     console.error('Failed to create fund:', error);
  //   }
  // };

  const handleDeleteFund = async (id: number) => {
    try {
      await dispatch(deleteFund(id)).unwrap();
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete fund:', error);
    }
  };

  const filteredFunds = (funds || []).filter(fund => {
    const matchesSearch = (fund.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (fund.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = !filterType || fund.type === filterType;
    const matchesStatus = !filterStatus || fund.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
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



  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Funds Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            size="medium"
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            size="medium"
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/funds/new"
            size="medium"
          >
            Create Fund
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


      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3, alignItems: 'center' }}>
            <Box>
              <TextField
                fullWidth
                placeholder="Search funds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Box>
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Fund Type</InputLabel>
                <Select
                  value={filterType}
                  label="Fund Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="master">Master</MenuItem>
                  <MenuItem value="feeder">Feeder</MenuItem>
                  <MenuItem value="parallel">Parallel</MenuItem>
                  <MenuItem value="subsidiary">Subsidiary</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="fundraising">Fundraising</MenuItem>
                  <MenuItem value="investing">Investing</MenuItem>
                  <MenuItem value="harvesting">Harvesting</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 1, fontSize: 20 }} />
                {filteredFunds.length} of {funds.length} funds
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Funds Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fund</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Vintage</TableCell>
              <TableCell>Target Size</TableCell>
              <TableCell>Management Fee</TableCell>
              <TableCell>Carry</TableCell>
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
            ) : filteredFunds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No funds found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredFunds.map((fund) => (
                <TableRow key={fund.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                          {fund.name || 'Unnamed Fund'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {fund.code || 'No Code'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={fund.type} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={fund.status} 
                      size="small" 
                      color={getStatusColor(fund.status)}
                    />
                  </TableCell>
                  <TableCell>{fund.vintage || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(fund.targetSize || 0)}</TableCell>
                  <TableCell>{fund.managementFeeRate ? (parseFloat(fund.managementFeeRate) * 100).toFixed(1) + '%' : 'N/A'}</TableCell>
                  <TableCell>{fund.carriedInterestRate ? (parseFloat(fund.carriedInterestRate) * 100).toFixed(1) + '%' : 'N/A'}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton 
                        size="small" 
                        component={Link} 
                        to={`/funds/${fund.id}`}
                        color="primary"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        component={Link} 
                        to={`/funds/${fund.id}/edit`}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => setShowDeleteModal(fund.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>


      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteModal !== null}
        onClose={() => setShowDeleteModal(null)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          <DeleteIcon sx={{ mr: 1, color: 'error.main' }} />
          Delete Fund
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete <strong>"{(funds || []).find(f => f.id === showDeleteModal)?.name || 'this fund'}"</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 1, color: 'text.secondary' }}>
            This action cannot be undone and will permanently remove all fund data, including investors, commitments, and transactions.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowDeleteModal(null)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => showDeleteModal && handleDeleteFund(showDeleteModal)}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            autoFocus
          >
            Delete Fund
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FundsPage;