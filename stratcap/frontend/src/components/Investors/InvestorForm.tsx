import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Grid,
  Checkbox,
  FormControlLabel,
  Alert,
  Divider
} from '@mui/material';
import { AppDispatch } from '../../store/store';
import { createInvestor, updateInvestor, Investor } from '../../store/slices/investorSlice';
import { investorSchema, validateForm, formatDateForBackend, formatDateForInput } from '../../utils/validation';
import { InvestorFormData } from '../../types/api';

interface InvestorFormProps {
  investor?: Investor;
  onSubmit?: (investor: Investor) => void;
  onCancel?: () => void;
}

const InvestorForm: React.FC<InvestorFormProps> = ({ investor, onSubmit, onCancel }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<InvestorFormData>({
    name: '',
    legalName: '',
    type: 'institution',
    entityType: '',
    taxId: '',
    registrationNumber: '',
    domicile: 'US',
    taxResidence: '',
    accreditedInvestor: false,
    qualifiedPurchaser: false,
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    primaryContact: '',
    primaryEmail: '',
    primaryPhone: '',
    kycStatus: 'pending',
    kycDate: undefined,
    amlStatus: 'pending',
    amlDate: undefined,
    notes: '',
    metadata: {}
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (investor) {
      setFormData(investor);
    }
  }, [investor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    const type = 'type' in e.target ? (e.target as HTMLInputElement).type : undefined;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
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
    const { errors: validationErrors, isValid } = await validateForm(investorSchema, formData);
    if (!isValid) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Format dates for backend and ensure required fields
      const submissionData: InvestorFormData = {
        name: formData.name || '',
        legalName: formData.legalName || '',
        type: formData.type || 'institution',
        domicile: formData.domicile || 'US',
        accreditedInvestor: formData.accreditedInvestor || false,
        qualifiedPurchaser: formData.qualifiedPurchaser || false,
        kycStatus: formData.kycStatus || 'pending',
        amlStatus: formData.amlStatus || 'pending',
        entityType: formData.entityType,
        taxId: formData.taxId,
        registrationNumber: formData.registrationNumber,
        taxResidence: formData.taxResidence,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        primaryContact: formData.primaryContact,
        primaryEmail: formData.primaryEmail,
        primaryPhone: formData.primaryPhone,
        kycDate: formatDateForBackend(formData.kycDate),
        amlDate: formatDateForBackend(formData.amlDate),
        notes: formData.notes,
        metadata: formData.metadata || {}
      };

      let result;
      if (investor?.id) {
        result = await dispatch(updateInvestor({ id: investor.id, data: submissionData })).unwrap();
      } else {
        result = await dispatch(createInvestor(submissionData)).unwrap();
      }

      if (onSubmit) {
        onSubmit(result.data);
      }
    } catch (error) {
      console.error('Failed to save investor:', error);
      setErrors({ general: 'Failed to save investor. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          {investor ? 'Edit Investor' : 'Create New Investor'}
        </Typography>
        
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* Basic Information */}
          <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="name"
                  label="Name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="legalName"
                  label="Legal Name"
                  value={formData.legalName || ''}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.legalName}
                  helperText={errors.legalName}
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required error={!!errors.type}>
                  <FormLabel component="label">Type</FormLabel>
                  <Select
                    name="type"
                    value={formData.type || 'institution'}
                    onChange={handleChange}
                    variant="outlined"
                  >
                    <MenuItem value="individual">Individual</MenuItem>
                    <MenuItem value="institution">Institution</MenuItem>
                    <MenuItem value="fund">Fund</MenuItem>
                    <MenuItem value="trust">Trust</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="entityType"
                  label="Entity Type"
                  value={formData.entityType || ''}
                  onChange={handleChange}
                  fullWidth
                  placeholder="e.g., Pension Fund, Endowment"
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="taxId"
                  label="Tax ID"
                  value={formData.taxId || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="registrationNumber"
                  label="Registration Number"
                  value={formData.registrationNumber || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Location Information */}
          <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
              Location Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="domicile"
                  label="Domicile (Country Code)"
                  value={formData.domicile || ''}
                  onChange={handleChange}
                  fullWidth
                  required
                  inputProps={{ maxLength: 2 }}
                  placeholder="US"
                  error={!!errors.domicile}
                  helperText={errors.domicile}
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="taxResidence"
                  label="Tax Residence"
                  value={formData.taxResidence || ''}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ maxLength: 2 }}
                  placeholder="US"
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  name="address"
                  label="Address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="city"
                  label="City"
                  value={formData.city || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="state"
                  label="State"
                  value={formData.state || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="postalCode"
                  label="Postal Code"
                  value={formData.postalCode || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="country"
                  label="Country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Contact Information */}
          <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
              Contact Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="primaryContact"
                  label="Primary Contact"
                  value={formData.primaryContact || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="primaryEmail"
                  label="Primary Email"
                  type="email"
                  value={formData.primaryEmail || ''}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.primaryEmail}
                  helperText={errors.primaryEmail}
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="primaryPhone"
                  label="Primary Phone"
                  type="tel"
                  value={formData.primaryPhone || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Qualification Status */}
          <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
              Qualification Status
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="accreditedInvestor"
                      checked={formData.accreditedInvestor || false}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="Accredited Investor"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="qualifiedPurchaser"
                      checked={formData.qualifiedPurchaser || false}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="Qualified Purchaser"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Compliance Status */}
          <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
              Compliance Status
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel component="label">KYC Status</FormLabel>
                  <Select
                    name="kycStatus"
                    value={formData.kycStatus || 'pending'}
                    onChange={handleChange}
                    variant="outlined"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="kycDate"
                  label="KYC Date"
                  type="date"
                  value={formatDateForInput(formData.kycDate)}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel component="label">AML Status</FormLabel>
                  <Select
                    name="amlStatus"
                    value={formData.amlStatus || 'pending'}
                    onChange={handleChange}
                    variant="outlined"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  name="amlDate"
                  label="AML Date"
                  type="date"
                  value={formatDateForInput(formData.amlDate)}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Notes */}
          <Box sx={{ mb: 3 }}>
            <TextField
              name="notes"
              label="Notes"
              value={formData.notes || ''}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              placeholder="Additional notes or comments..."
              variant="outlined"
            />
          </Box>

          {/* Form Actions */}
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
            {onCancel && (
              <Button
                type="button"
                variant="outlined"
                onClick={onCancel}
                size="large"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              size="large"
              color="primary"
            >
              {isLoading ? 'Saving...' : investor ? 'Update Investor' : 'Create Investor'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default InvestorForm;
