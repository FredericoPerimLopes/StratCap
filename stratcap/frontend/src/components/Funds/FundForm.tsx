import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchFundById,
  createFund,
  updateFund,
  clearError,
  clearCurrentFund
} from '../../store/slices/fundSlice';

interface FundFormData {
  name: string;
  code: string;
  type: 'master' | 'feeder' | 'parallel' | 'subsidiary';
  vintage: number;
  targetSize: string;
  hardCap?: string;
  currency: string;
  managementFeeRate: string;
  carriedInterestRate: string;
  preferredReturnRate: string;
  status: 'fundraising' | 'investing' | 'harvesting' | 'closed';
  fundFamilyId: number;
}

const FundForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  const { currentFund, isLoading, error } = useSelector((state: RootState) => state.fund);
  
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<FundFormData>({
    name: '',
    code: '',
    type: 'master',
    vintage: new Date().getFullYear(),
    targetSize: '',
    hardCap: '',
    currency: 'USD',
    managementFeeRate: '2.0',
    carriedInterestRate: '20.0',
    preferredReturnRate: '8.0',
    status: 'fundraising',
    fundFamilyId: 1
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchFundById(parseInt(id)));
    }
    
    return () => {
      dispatch(clearCurrentFund());
      dispatch(clearError());
    };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (currentFund && isEditing) {
      setFormData({
        name: currentFund.name || '',
        code: currentFund.code || '',
        type: currentFund.type || 'master',
        vintage: currentFund.vintage || new Date().getFullYear(),
        targetSize: currentFund.targetSize || '',
        hardCap: currentFund.hardCap || '',
        currency: currentFund.currency || 'USD',
        managementFeeRate: currentFund.managementFeeRate ? (parseFloat(currentFund.managementFeeRate) * 100).toString() : '2.0',
        carriedInterestRate: currentFund.carriedInterestRate ? (parseFloat(currentFund.carriedInterestRate) * 100).toString() : '20.0',
        preferredReturnRate: currentFund.preferredReturnRate ? (parseFloat(currentFund.preferredReturnRate) * 100).toString() : '8.0',
        status: currentFund.status || 'fundraising',
        fundFamilyId: currentFund.fundFamilyId || 1
      });
    }
  }, [currentFund, isEditing]);

  const handleInputChange = (field: keyof FundFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        managementFeeRate: (parseFloat(formData.managementFeeRate) / 100).toString(),
        carriedInterestRate: (parseFloat(formData.carriedInterestRate) / 100).toString(),
        preferredReturnRate: (parseFloat(formData.preferredReturnRate) / 100).toString()
      };
      
      if (isEditing && id) {
        await dispatch(updateFund({ id: parseInt(id), data: submitData })).unwrap();
      } else {
        await dispatch(createFund(submitData)).unwrap();
      }
      
      navigate('/funds');
    } catch (error) {
      console.error('Failed to save fund:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/funds');
  };

  if (isLoading && isEditing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back to Funds
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {isEditing ? 'Edit Fund' : 'Create New Fund'}
        </Typography>
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

      {/* Form */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid xs={12}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon sx={{ mr: 1 }} />
                  Basic Information
                </Typography>
              </Grid>
              
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Fund Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Sample Growth Fund I"
                />
              </Grid>
              
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Fund Code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., SGF-I"
                />
              </Grid>
              
              <Grid xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Fund Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Fund Type"
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    <MenuItem value="master">Master</MenuItem>
                    <MenuItem value="feeder">Feeder</MenuItem>
                    <MenuItem value="parallel">Parallel</MenuItem>
                    <MenuItem value="subsidiary">Subsidiary</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Vintage Year"
                  value={formData.vintage}
                  onChange={(e) => handleInputChange('vintage', parseInt(e.target.value))}
                  inputProps={{ min: 2000, max: 2050 }}
                />
              </Grid>
              
              <Grid xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <MenuItem value="fundraising">Fundraising</MenuItem>
                    <MenuItem value="investing">Investing</MenuItem>
                    <MenuItem value="harvesting">Harvesting</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Financial Information */}
              <Grid xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                  Financial Structure
                </Typography>
              </Grid>
              
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Target Size"
                  value={formData.targetSize}
                  onChange={(e) => handleInputChange('targetSize', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  placeholder="100000000"
                  helperText="Enter amount in dollars"
                />
              </Grid>
              
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Hard Cap (Optional)"
                  value={formData.hardCap}
                  onChange={(e) => handleInputChange('hardCap', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  placeholder="120000000"
                  helperText="Leave empty if no hard cap"
                />
              </Grid>
              
              <Grid xs={12} md={3}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Management Fee Rate"
                  value={formData.managementFeeRate}
                  onChange={(e) => handleInputChange('managementFeeRate', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                  helperText="Annual fee rate"
                />
              </Grid>
              
              <Grid xs={12} md={3}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Carried Interest Rate"
                  value={formData.carriedInterestRate}
                  onChange={(e) => handleInputChange('carriedInterestRate', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 50, step: 0.1 }}
                  helperText="Carry percentage"
                />
              </Grid>
              
              <Grid xs={12} md={3}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Preferred Return Rate"
                  value={formData.preferredReturnRate}
                  onChange={(e) => handleInputChange('preferredReturnRate', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 20, step: 0.1 }}
                  helperText="Hurdle rate"
                />
              </Grid>
              
              <Grid xs={12} md={3}>
                <FormControl fullWidth required>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency}
                    label="Currency"
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                    <MenuItem value="CAD">CAD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Actions */}
              <Grid xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      `${isEditing ? 'Update' : 'Create'} Fund`
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FundForm;
