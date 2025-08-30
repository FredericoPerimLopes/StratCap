import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Chip,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { FundFamily } from '../../../store/slices/fundFamilySlice';

interface FundFamilySettingsProps {
  fundFamily: FundFamily;
  onSave: (settings: any) => void;
  loading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const FundFamilySettings: React.FC<FundFamilySettingsProps> = ({
  fundFamily,
  onSave,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const formik = useFormik({
    initialValues: {
      // Financial Settings
      defaultManagementFeeRate: fundFamily.settings?.defaultManagementFeeRate || 2,
      defaultCarriedInterestRate: fundFamily.settings?.defaultCarriedInterestRate || 20,
      defaultPreferredReturn: fundFamily.settings?.defaultPreferredReturn || 8,
      
      // Operational Settings
      autoApproveCapitalCalls: fundFamily.settings?.autoApproveCapitalCalls || false,
      autoApprovalThreshold: fundFamily.settings?.autoApprovalThreshold || 1000000,
      requireDualApproval: fundFamily.settings?.requireDualApproval || true,
      enableNotifications: fundFamily.settings?.enableNotifications || true,
      allowMultipleFundTypes: fundFamily.settings?.allowMultipleFundTypes || true,
      enableAdvancedReporting: fundFamily.settings?.enableAdvancedReporting || true,
      
      // Compliance Settings
      requireInvestorAccreditation: fundFamily.settings?.requireInvestorAccreditation || true,
      enableAuditTrail: fundFamily.settings?.enableAuditTrail || true,
      dataRetentionPeriodYears: fundFamily.settings?.dataRetentionPeriodYears || 7,
      enableTaxReporting: fundFamily.settings?.enableTaxReporting || true,
      
      // Notification Settings
      emailNotifications: fundFamily.settings?.emailNotifications || true,
      smsNotifications: fundFamily.settings?.smsNotifications || false,
      slackNotifications: fundFamily.settings?.slackNotifications || false,
      notificationFrequency: fundFamily.settings?.notificationFrequency || 'immediate',
      
      // Security Settings
      sessionTimeoutMinutes: fundFamily.settings?.sessionTimeoutMinutes || 480,
      passwordPolicy: fundFamily.settings?.passwordPolicy || 'strong',
      enableTwoFactor: fundFamily.settings?.enableTwoFactor || false,
      allowApiAccess: fundFamily.settings?.allowApiAccess || true
    },
    onSubmit: (values) => {
      onSave({ settings: values });
      setHasChanges(false);
    },
    enableReinitialize: true
  });

  React.useEffect(() => {
    const isChanged = JSON.stringify(formik.initialValues) !== JSON.stringify(formik.values);
    setHasChanges(isChanged);
  }, [formik.values, formik.initialValues]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Mock user permissions data
  const userPermissions = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@example.com',
      role: 'Fund Manager',
      permissions: ['read', 'write', 'approve'],
      lastAccess: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      role: 'Operations Manager',
      permissions: ['read', 'write'],
      lastAccess: '2024-01-14T16:45:00Z'
    },
    {
      id: 3,
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      role: 'Analyst',
      permissions: ['read'],
      lastAccess: '2024-01-13T09:15:00Z'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="600">
          Fund Family Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasChanges && (
            <Alert severity="warning" sx={{ mr: 2, py: 0 }}>
              You have unsaved changes
            </Alert>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={formik.handleSubmit as any}
            disabled={loading || !hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Settings Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<BusinessIcon />} label="Financial" />
            <Tab icon={<SettingsIcon />} label="Operations" />
            <Tab icon={<SecurityIcon />} label="Security" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<PeopleIcon />} label="Permissions" />
          </Tabs>
        </Box>

        {/* Financial Settings Tab */}
        <TabPanel value={activeTab} index={0}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Default Fee Structure
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              These settings will be applied to new funds by default
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="defaultManagementFeeRate"
                  label="Management Fee Rate (%)"
                  value={formik.values.defaultManagementFeeRate}
                  onChange={formik.handleChange}
                  InputProps={{
                    inputProps: { min: 0, max: 10, step: 0.1 }
                  }}
                  helperText="Annual management fee percentage"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="defaultCarriedInterestRate"
                  label="Carried Interest Rate (%)"
                  value={formik.values.defaultCarriedInterestRate}
                  onChange={formik.handleChange}
                  InputProps={{
                    inputProps: { min: 0, max: 50, step: 1 }
                  }}
                  helperText="GP's share of profits"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="defaultPreferredReturn"
                  label="Preferred Return (%)"
                  value={formik.values.defaultPreferredReturn}
                  onChange={formik.handleChange}
                  InputProps={{
                    inputProps: { min: 0, max: 20, step: 0.1 }
                  }}
                  helperText="Minimum return before carry"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Fee Calculation Preview
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Management Fee (Annual)
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {formik.values.defaultManagementFeeRate}% of committed capital
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Carried Interest
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {formik.values.defaultCarriedInterestRate}% after {formik.values.defaultPreferredReturn}% preferred return
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Operations Settings Tab */}
        <TabPanel value={activeTab} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Capital Call Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          name="autoApproveCapitalCalls"
                          checked={formik.values.autoApproveCapitalCalls}
                          onChange={formik.handleChange}
                        />
                      }
                      label="Auto-approve Capital Calls"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Automatically approve capital calls below the threshold
                    </Typography>
                    {formik.values.autoApproveCapitalCalls && (
                      <TextField
                        fullWidth
                        type="number"
                        name="autoApprovalThreshold"
                        label="Auto-approval Threshold"
                        value={formik.values.autoApprovalThreshold}
                        onChange={formik.handleChange}
                        sx={{ mt: 2 }}
                        InputProps={{
                          startAdornment: '$',
                          inputProps: { min: 0, step: 1000 }
                        }}
                        helperText={`Calls above ${formatCurrency(formik.values.autoApprovalThreshold)} require manual approval`}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          name="requireDualApproval"
                          checked={formik.values.requireDualApproval}
                          onChange={formik.handleChange}
                        />
                      }
                      label="Require Dual Approval"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Require two authorized users to approve critical actions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom>
              System Features
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="allowMultipleFundTypes"
                      checked={formik.values.allowMultipleFundTypes}
                      onChange={formik.handleChange}
                    />
                  }
                  label="Allow Multiple Fund Types"
                />
                <Typography variant="body2" color="text.secondary">
                  Enable different fund types (PE, VC, Real Estate, etc.) within this family
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="enableAdvancedReporting"
                      checked={formik.values.enableAdvancedReporting}
                      onChange={formik.handleChange}
                    />
                  }
                  label="Advanced Reporting"
                />
                <Typography variant="body2" color="text.secondary">
                  Enable advanced analytics and custom reporting features
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Security Settings Tab */}
        <TabPanel value={activeTab} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Access Control
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="sessionTimeoutMinutes"
                  label="Session Timeout (minutes)"
                  value={formik.values.sessionTimeoutMinutes}
                  onChange={formik.handleChange}
                  InputProps={{
                    inputProps: { min: 30, max: 1440, step: 15 }
                  }}
                  helperText="Auto-logout inactive users"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  name="passwordPolicy"
                  label="Password Policy"
                  value={formik.values.passwordPolicy}
                  onChange={formik.handleChange}
                  SelectProps={{ native: true }}
                  helperText="Password strength requirements"
                >
                  <option value="basic">Basic (8 characters)</option>
                  <option value="strong">Strong (12 chars, mixed case, numbers)</option>
                  <option value="enterprise">Enterprise (16 chars, symbols required)</option>
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    name="enableTwoFactor"
                    checked={formik.values.enableTwoFactor}
                    onChange={formik.handleChange}
                  />
                }
                label="Require Two-Factor Authentication"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Require 2FA for all users accessing this fund family
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    name="allowApiAccess"
                    checked={formik.values.allowApiAccess}
                    onChange={formik.handleChange}
                  />
                }
                label="Allow API Access"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Enable programmatic access via REST API
              </Typography>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom>
              Compliance & Audit
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="enableAuditTrail"
                      checked={formik.values.enableAuditTrail}
                      onChange={formik.handleChange}
                    />
                  }
                  label="Enable Audit Trail"
                />
                <Typography variant="body2" color="text.secondary">
                  Track all user actions and data changes
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="dataRetentionPeriodYears"
                  label="Data Retention Period (years)"
                  value={formik.values.dataRetentionPeriodYears}
                  onChange={formik.handleChange}
                  InputProps={{
                    inputProps: { min: 1, max: 50 }
                  }}
                  helperText="How long to retain historical data"
                />
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Notifications Settings Tab */}
        <TabPanel value={activeTab} index={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Channels
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <NotificationsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <FormControlLabel
                    control={
                      <Switch
                        name="emailNotifications"
                        checked={formik.values.emailNotifications}
                        onChange={formik.handleChange}
                      />
                    }
                    label="Email Notifications"
                    labelPlacement="bottom"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Send notifications via email
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <NotificationsIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                  <FormControlLabel
                    control={
                      <Switch
                        name="smsNotifications"
                        checked={formik.values.smsNotifications}
                        onChange={formik.handleChange}
                      />
                    }
                    label="SMS Notifications"
                    labelPlacement="bottom"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Send urgent alerts via SMS
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <NotificationsIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                  <FormControlLabel
                    control={
                      <Switch
                        name="slackNotifications"
                        checked={formik.values.slackNotifications}
                        onChange={formik.handleChange}
                      />
                    }
                    label="Slack Notifications"
                    labelPlacement="bottom"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Send updates to Slack channels
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Notification Frequency
              </Typography>
              <TextField
                fullWidth
                select
                name="notificationFrequency"
                label="Default Frequency"
                value={formik.values.notificationFrequency}
                onChange={formik.handleChange}
                SelectProps={{ native: true }}
                sx={{ maxWidth: 300 }}
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Summary</option>
              </TextField>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Permissions Tab */}
        <TabPanel value={activeTab} index={4}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                User Permissions
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setUserDialogOpen(true)}
              >
                Add User
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell>Last Access</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userPermissions.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={user.role} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {user.permissions.map((permission) => (
                            <Chip
                              key={permission}
                              label={permission}
                              size="small"
                              color={
                                permission === 'approve' ? 'error' :
                                permission === 'write' ? 'warning' : 'default'
                              }
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(user.lastAccess).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit permissions">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove user">
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Permission Levels:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
                <li><strong>Read:</strong> View fund family data and reports</li>
                <li><strong>Write:</strong> Create and modify fund family data</li>
                <li><strong>Approve:</strong> Approve capital calls and distributions</li>
              </Typography>
            </Alert>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User to Fund Family</DialogTitle>
        <DialogContent>
          {/* Add user form would go here */}
          <Typography color="text.secondary">
            User invitation form would be implemented here
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Send Invitation</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FundFamilySettings;