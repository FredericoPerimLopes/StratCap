<<<<<<< HEAD
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
=======
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { createFund, updateFund, Fund } from '../../store/slices/fundSlice';
import { fundSchema, validateForm, formatDateForBackend, formatDateForInput } from '../../utils/validation';
import { FundFormData } from '../../types/api';

interface FundFormProps {
  fund?: Fund;
  onSubmit?: (fund: Fund) => void;
  onCancel?: () => void;
}

const FundForm: React.FC<FundFormProps> = ({ fund, onSubmit, onCancel }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<FundFormData>({
    fundFamilyId: 1, // Default to first fund family - should be selected from dropdown
    name: '',
    code: '',
    type: 'master',
    vintage: new Date().getFullYear(),
    targetSize: '',
    hardCap: '',
    managementFeeRate: '2.0',
    carriedInterestRate: '20.0',
    preferredReturnRate: '8.0',
    investmentPeriodEnd: undefined,
    termEnd: undefined,
    extensionPeriods: 0,
    extensionLength: 12,
    currency: 'USD',
    status: 'fundraising',
    settings: {}
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (fund) {
      setFormData(fund);
    }
  }, [fund]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : '') : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    const { errors: validationErrors, isValid } = await validateForm(fundSchema, formData);
    if (!isValid) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Format dates for backend and ensure required fields
      const submissionData: FundFormData = {
        fundFamilyId: formData.fundFamilyId || 1,
        name: formData.name || '',
        code: formData.code || '',
        type: formData.type || 'master',
        vintage: formData.vintage || new Date().getFullYear(),
        targetSize: formData.targetSize || '',
        managementFeeRate: formData.managementFeeRate || '2.0',
        carriedInterestRate: formData.carriedInterestRate || '20.0',
        preferredReturnRate: formData.preferredReturnRate || '8.0',
        currency: formData.currency || 'USD',
        status: formData.status || 'fundraising',
        hardCap: formData.hardCap,
        investmentPeriodEnd: formatDateForBackend(formData.investmentPeriodEnd),
        termEnd: formatDateForBackend(formData.termEnd),
        extensionPeriods: formData.extensionPeriods,
        extensionLength: formData.extensionLength,
        settings: formData.settings || {}
      };

      let result;
      if (fund?.id) {
        result = await dispatch(updateFund({ id: fund.id, data: submissionData })).unwrap();
      } else {
        result = await dispatch(createFund(submissionData)).unwrap();
      }

      if (onSubmit) {
        onSubmit(result.data);
      }
    } catch (error) {
      console.error('Failed to save fund:', error);
      setErrors({ general: 'Failed to save fund. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {fund ? 'Edit Fund' : 'Create New Fund'}
      </h2>
      
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fund Family ID *</label>
              <input
                type="number"
                name="fundFamilyId"
                value={formData.fundFamilyId || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.fundFamilyId ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.fundFamilyId && <p className="mt-1 text-sm text-red-600">{errors.fundFamilyId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fund Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fund Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.code ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fund Type *</label>
              <select
                name="type"
                value={formData.type || 'master'}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.type ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              >
                <option value="master">Master</option>
                <option value="feeder">Feeder</option>
                <option value="parallel">Parallel</option>
                <option value="subsidiary">Subsidiary</option>
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vintage Year *</label>
              <input
                type="number"
                name="vintage"
                value={formData.vintage || ''}
                onChange={handleChange}
                min="1900"
                max="2100"
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.vintage ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.vintage && <p className="mt-1 text-sm text-red-600">{errors.vintage}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status || 'fundraising'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="fundraising">Fundraising</option>
                <option value="investing">Investing</option>
                <option value="harvesting">Harvesting</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                name="currency"
                value={formData.currency || 'USD'}
                onChange={handleChange}
                maxLength={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Size *</label>
              <input
                type="text"
                name="targetSize"
                value={formData.targetSize || ''}
                onChange={handleChange}
                placeholder="100000000"
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.targetSize ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.targetSize && <p className="mt-1 text-sm text-red-600">{errors.targetSize}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hard Cap</label>
              <input
                type="text"
                name="hardCap"
                value={formData.hardCap || ''}
                onChange={handleChange}
                placeholder="120000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Management Fee Rate (%) *</label>
              <input
                type="text"
                name="managementFeeRate"
                value={formData.managementFeeRate || ''}
                onChange={handleChange}
                placeholder="2.0"
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.managementFeeRate ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.managementFeeRate && <p className="mt-1 text-sm text-red-600">{errors.managementFeeRate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carried Interest Rate (%) *</label>
              <input
                type="text"
                name="carriedInterestRate"
                value={formData.carriedInterestRate || ''}
                onChange={handleChange}
                placeholder="20.0"
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.carriedInterestRate ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.carriedInterestRate && <p className="mt-1 text-sm text-red-600">{errors.carriedInterestRate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Return Rate (%) *</label>
              <input
                type="text"
                name="preferredReturnRate"
                value={formData.preferredReturnRate || ''}
                onChange={handleChange}
                placeholder="8.0"
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.preferredReturnRate ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.preferredReturnRate && <p className="mt-1 text-sm text-red-600">{errors.preferredReturnRate}</p>}
            </div>
          </div>
        </div>

        {/* Terms Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Terms Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investment Period End</label>
              <input
                type="date"
                name="investmentPeriodEnd"
                value={formatDateForInput(formData.investmentPeriodEnd)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term End</label>
              <input
                type="date"
                name="termEnd"
                value={formatDateForInput(formData.termEnd)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extension Periods</label>
              <input
                type="number"
                name="extensionPeriods"
                value={formData.extensionPeriods || 0}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extension Length (months)</label>
              <input
                type="number"
                name="extensionLength"
                value={formData.extensionLength || 12}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : fund ? 'Update Fund' : 'Create Fund'}
          </button>
        </div>
      </form>
    </div>
>>>>>>> 80a95e2 (fix backedn frontend mismatch)
  );
};

export default FundForm;
