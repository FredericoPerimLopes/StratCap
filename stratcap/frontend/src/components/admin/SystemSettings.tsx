import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Storage,
  Integration,
  ExpandMore,
  Edit,
  Delete,
  Add,
  Save,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { configurationAPI } from '../../services/api';

interface SystemConfiguration {
  organization: {
    name: string;
    logo?: string;
    timezone: string;
    currency: string;
    fiscalYearEnd: string;
    dateFormat: string;
    decimalPrecision: number;
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxAge: number;
    };
    mfaRequired: boolean;
    sessionTimeout: number;
    ipWhitelist: string[];
    auditLogging: boolean;
  };
  features: {
    hypotheticalScenarios: boolean;
    creditFacilities: boolean;
    investorPortal: boolean;
    advancedReporting: boolean;
    apiAccess: boolean;
    dataExport: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    inAppEnabled: boolean;
    channels: NotificationChannel[];
  };
  integrations: {
    enabled: IntegrationConfig[];
  };
  backup: {
    enabled: boolean;
    schedule: string;
    retention: number;
    destination: string;
  };
  performance: {
    cacheTimeout: number;
    maxQueryTime: number;
    enableMetrics: boolean;
    alertingEnabled: boolean;
  };
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'webhook' | 'slack';
  enabled: boolean;
  configuration: Record<string, any>;
}

interface IntegrationConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  configuration: Record<string, any>;
}

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<SystemConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState<{
    type: 'integration' | 'notification' | null;
    data?: any;
  }>({ type: null });

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Load all configuration settings
      const [
        systemSettings,
        features,
        notifications,
        integrations,
        backup,
        performance
      ] = await Promise.all([
        configurationAPI.getSystemSettings(),
        configurationAPI.getFeatureFlags(),
        configurationAPI.getNotificationSettings(),
        configurationAPI.getIntegrations(),
        configurationAPI.getBackupSettings(),
        configurationAPI.getPerformanceSettings()
      ]);

      setConfig({
        organization: {
          name: systemSettings.data.data.organizationName || '',
          timezone: systemSettings.data.data.timezone || 'UTC',
          currency: systemSettings.data.data.currency || 'USD',
          fiscalYearEnd: systemSettings.data.data.fiscalYearEnd || '12-31',
          dateFormat: systemSettings.data.data.dateFormat || 'MM/DD/YYYY',
          decimalPrecision: systemSettings.data.data.decimalPrecision || 2
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
            maxAge: 90
          },
          mfaRequired: false,
          sessionTimeout: 30,
          ipWhitelist: [],
          auditLogging: true
        },
        features: features.data.data,
        notifications: notifications.data.data,
        integrations: {
          enabled: integrations.data.data
        },
        backup: backup.data.data,
        performance: performance.data.data
      });
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setErrors({ general: 'Failed to load configuration settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: keyof SystemConfiguration) => {
    if (!config) return;

    try {
      setSaving(true);
      
      switch (section) {
        case 'organization':
          await configurationAPI.updateSystemSettings(config.organization);
          break;
        case 'features':
          // Update individual feature flags
          for (const [key, value] of Object.entries(config.features)) {
            await configurationAPI.updateFeatureFlag(key, value);
          }
          break;
        case 'notifications':
          await configurationAPI.updateNotificationSettings(config.notifications);
          break;
        case 'backup':
          await configurationAPI.updateBackupSettings(config.backup);
          break;
        case 'performance':
          await configurationAPI.updatePerformanceSettings(config.performance);
          break;
      }
      
      // Clear any previous errors for this section
      setErrors(prev => ({ ...prev, [section]: '' }));
    } catch (error) {
      console.error(`Failed to save ${section} settings:`, error);
      setErrors(prev => ({ ...prev, [section]: `Failed to save ${section} settings` }));
    } finally {
      setSaving(false);
    }
  };

  const handleTestIntegration = async (integrationId: string) => {
    try {
      setTestingIntegration(integrationId);
      const response = await configurationAPI.testIntegration(integrationId);
      
      if (response.data.success) {
        // Update integration status
        if (config) {
          const updatedIntegrations = config.integrations.enabled.map(int => 
            int.id === integrationId 
              ? { ...int, status: 'connected' as const }
              : int
          );
          setConfig({
            ...config,
            integrations: { enabled: updatedIntegrations }
          });
        }
      }
    } catch (error) {
      console.error('Integration test failed:', error);
    } finally {
      setTestingIntegration(null);
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;

    setConfig(prev => {
      if (!prev) return prev;
      
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const renderOrganizationSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Organization Settings
        </Typography>
        {errors.organization && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.organization}
          </Alert>
        )}
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Organization Name"
          value={config?.organization.name || ''}
          onChange={(e) => updateConfig('organization.name', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Timezone</InputLabel>
          <Select
            value={config?.organization.timezone || 'UTC'}
            label="Timezone"
            onChange={(e) => updateConfig('organization.timezone', e.target.value)}
          >
            <MenuItem value="UTC">UTC</MenuItem>
            <MenuItem value="America/New_York">Eastern Time</MenuItem>
            <MenuItem value="America/Chicago">Central Time</MenuItem>
            <MenuItem value="America/Denver">Mountain Time</MenuItem>
            <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
            <MenuItem value="Europe/London">London</MenuItem>
            <MenuItem value="Europe/Paris">Paris</MenuItem>
            <MenuItem value="Asia/Tokyo">Tokyo</MenuItem>
            <MenuItem value="Asia/Hong_Kong">Hong Kong</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Base Currency</InputLabel>
          <Select
            value={config?.organization.currency || 'USD'}
            label="Base Currency"
            onChange={(e) => updateConfig('organization.currency', e.target.value)}
          >
            <MenuItem value="USD">USD - US Dollar</MenuItem>
            <MenuItem value="EUR">EUR - Euro</MenuItem>
            <MenuItem value="GBP">GBP - British Pound</MenuItem>
            <MenuItem value="JPY">JPY - Japanese Yen</MenuItem>
            <MenuItem value="CHF">CHF - Swiss Franc</MenuItem>
            <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Date Format</InputLabel>
          <Select
            value={config?.organization.dateFormat || 'MM/DD/YYYY'}
            label="Date Format"
            onChange={(e) => updateConfig('organization.dateFormat', e.target.value)}
          >
            <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
            <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
            <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
            <MenuItem value="DD-MMM-YYYY">DD-MMM-YYYY</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Decimal Precision"
          type="number"
          inputProps={{ min: 0, max: 6 }}
          value={config?.organization.decimalPrecision || 2}
          onChange={(e) => updateConfig('organization.decimalPrecision', parseInt(e.target.value))}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Fiscal Year End"
          placeholder="MM-DD (e.g., 12-31)"
          value={config?.organization.fiscalYearEnd || '12-31'}
          onChange={(e) => updateConfig('organization.fiscalYearEnd', e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={() => handleSave('organization')}
            disabled={saving}
          >
            Save Organization Settings
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  const renderSecuritySettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Security Settings
        </Typography>
      </Grid>

      {/* Password Policy */}
      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Password Policy</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Length"
                  type="number"
                  inputProps={{ min: 6, max: 20 }}
                  value={config?.security.passwordPolicy.minLength || 8}
                  onChange={(e) => updateConfig('security.passwordPolicy.minLength', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password Expiry (days)"
                  type="number"
                  inputProps={{ min: 30, max: 365 }}
                  value={config?.security.passwordPolicy.maxAge || 90}
                  onChange={(e) => updateConfig('security.passwordPolicy.maxAge', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config?.security.passwordPolicy.requireUppercase || false}
                      onChange={(e) => updateConfig('security.passwordPolicy.requireUppercase', e.target.checked)}
                    />
                  }
                  label="Require Uppercase"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config?.security.passwordPolicy.requireLowercase || false}
                      onChange={(e) => updateConfig('security.passwordPolicy.requireLowercase', e.target.checked)}
                    />
                  }
                  label="Require Lowercase"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config?.security.passwordPolicy.requireNumbers || false}
                      onChange={(e) => updateConfig('security.passwordPolicy.requireNumbers', e.target.checked)}
                    />
                  }
                  label="Require Numbers"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config?.security.passwordPolicy.requireSpecialChars || false}
                      onChange={(e) => updateConfig('security.passwordPolicy.requireSpecialChars', e.target.checked)}
                    />
                  }
                  label="Require Special Characters"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>

      {/* Authentication */}
      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Authentication</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config?.security.mfaRequired || false}
                      onChange={(e) => updateConfig('security.mfaRequired', e.target.checked)}
                    />
                  }
                  label="Require Multi-Factor Authentication"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  inputProps={{ min: 5, max: 480 }}
                  value={config?.security.sessionTimeout || 30}
                  onChange={(e) => updateConfig('security.sessionTimeout', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config?.security.auditLogging || false}
                      onChange={(e) => updateConfig('security.auditLogging', e.target.checked)}
                    />
                  }
                  label="Enable Audit Logging"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );

  const renderFeatureSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Feature Configuration
        </Typography>
        {errors.features && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.features}
          </Alert>
        )}
      </Grid>

      <Grid item xs={12}>
        <List>
          {config && Object.entries(config.features).map(([key, enabled]) => (
            <ListItem key={key} divider>
              <ListItemText
                primary={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                secondary={getFeatureDescription(key)}
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={enabled}
                  onChange={(e) => updateConfig(`features.${key}`, e.target.checked)}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={() => handleSave('features')}
            disabled={saving}
          >
            Save Feature Settings
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  const renderIntegrationsSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            External Integrations
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen({ type: 'integration' })}
          >
            Add Integration
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Sync</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {config?.integrations.enabled.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell>{integration.name}</TableCell>
                  <TableCell>
                    <Chip label={integration.type} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={getStatusIcon(integration.status)}
                      label={integration.status}
                      color={integration.status === 'connected' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {integration.lastSync 
                      ? new Date(integration.lastSync).toLocaleString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleTestIntegration(integration.id)}
                      disabled={testingIntegration === integration.id}
                    >
                      {testingIntegration === integration.id ? (
                        <LinearProgress />
                      ) : (
                        <Refresh />
                      )}
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={() => setDialogOpen({ type: 'integration', data: integration })}
                    >
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );

  const getFeatureDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      hypotheticalScenarios: 'Enable waterfall scenario modeling and analysis',
      creditFacilities: 'Enable credit facility management and monitoring',
      investorPortal: 'Allow investors to access their portfolio data',
      advancedReporting: 'Enable custom report builder and advanced analytics',
      apiAccess: 'Allow external systems to access data via REST API',
      dataExport: 'Enable data export in various formats'
    };
    return descriptions[key] || 'Feature configuration option';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle />;
      case 'error': return <Error />;
      default: return <Warning />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading system settings...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            System Settings
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
              <Tab icon={<Settings />} label="Organization" />
              <Tab icon={<Security />} label="Security" />
              <Tab icon={<Info />} label="Features" />
              <Tab icon={<Integration />} label="Integrations" />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            {renderOrganizationSettings()}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {renderSecuritySettings()}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {renderFeatureSettings()}
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            {renderIntegrationsSettings()}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Integration Configuration Dialog */}
      <Dialog
        open={dialogOpen.type === 'integration'}
        onClose={() => setDialogOpen({ type: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogOpen.data ? 'Edit Integration' : 'Add Integration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Integration Name"
                defaultValue={dialogOpen.data?.name || ''}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  defaultValue={dialogOpen.data?.type || ''}
                  label="Type"
                >
                  <MenuItem value="accounting">Accounting System</MenuItem>
                  <MenuItem value="banking">Banking</MenuItem>
                  <MenuItem value="crm">CRM</MenuItem>
                  <MenuItem value="document">Document Management</MenuItem>
                  <MenuItem value="email">Email Service</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen({ type: null })}>
            Cancel
          </Button>
          <Button variant="contained">
            {dialogOpen.data ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}