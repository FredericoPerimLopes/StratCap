import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Slider,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  TableChart as ReportsIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Visibility as DisplayIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';

interface UserPreference {
  id: string;
  category: 'ui' | 'notification' | 'reporting' | 'workflow' | 'security' | 'display' | 'general';
  preferenceKey: string;
  preferenceValue: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description?: string;
  isPublic: boolean;
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
      id={`preferences-tabpanel-${index}`}
      aria-labelledby={`preferences-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UserPreferences: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/configuration/preferences');
      setPreferences(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to load preferences',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const savePreference = async (category: string, key: string, value: any, dataType: string = 'string') => {
    try {
      await api.put('/configuration/preferences', {
        category,
        preferenceKey: key,
        preferenceValue: value,
        dataType,
      });
      
      // Update local state
      setPreferences(prev => {
        const existing = prev.find(p => p.preferenceKey === key);
        if (existing) {
          return prev.map(p => 
            p.preferenceKey === key 
              ? { ...p, preferenceValue: value.toString() }
              : p
          );
        } else {
          return [...prev, {
            id: `temp-${Date.now()}`,
            category: category as any,
            preferenceKey: key,
            preferenceValue: value.toString(),
            dataType: dataType as any,
            isPublic: false,
          }];
        }
      });

      // Clear unsaved changes for this key
      setUnsavedChanges(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      enqueueSnackbar('Preference saved successfully', { variant: 'success' });
    } catch (error: any) {
      console.error('Error saving preference:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to save preference',
        { variant: 'error' }
      );
    }
  };

  const deletePreference = async (key: string) => {
    try {
      await api.delete(`/configuration/preferences/${key}`);
      setPreferences(prev => prev.filter(p => p.preferenceKey !== key));
      enqueueSnackbar('Preference deleted successfully', { variant: 'success' });
    } catch (error: any) {
      console.error('Error deleting preference:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to delete preference',
        { variant: 'error' }
      );
    }
  };

  const getPreferenceValue = (key: string, defaultValue: any = '') => {
    const preference = preferences.find(p => p.preferenceKey === key);
    if (unsavedChanges[key] !== undefined) {
      return unsavedChanges[key];
    }
    if (preference) {
      switch (preference.dataType) {
        case 'boolean':
          return preference.preferenceValue === 'true';
        case 'number':
          return parseFloat(preference.preferenceValue);
        case 'json':
        case 'array':
          try {
            return JSON.parse(preference.preferenceValue);
          } catch {
            return defaultValue;
          }
        default:
          return preference.preferenceValue;
      }
    }
    return defaultValue;
  };

  const updatePreference = (key: string, value: any) => {
    setUnsavedChanges(prev => ({ ...prev, [key]: value }));
  };

  const saveAllChanges = async () => {
    for (const [key, value] of Object.entries(unsavedChanges)) {
      const category = getCategoryForKey(key);
      const dataType = getDataTypeForValue(value);
      await savePreference(category, key, value, dataType);
    }
  };

  const getCategoryForKey = (key: string): string => {
    if (key.startsWith('theme_') || key.startsWith('ui_')) return 'ui';
    if (key.startsWith('notification_')) return 'notification';
    if (key.startsWith('report_')) return 'reporting';
    if (key.startsWith('security_')) return 'security';
    if (key.startsWith('display_')) return 'display';
    return 'general';
  };

  const getDataTypeForValue = (value: any): string => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'object') return 'json';
    return 'string';
  };

  const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;

  const tabCategories = [
    { value: 0, label: 'UI & Display', icon: <PaletteIcon />, category: 'ui' },
    { value: 1, label: 'Notifications', icon: <NotificationsIcon />, category: 'notification' },
    { value: 2, label: 'Reports', icon: <ReportsIcon />, category: 'reporting' },
    { value: 3, label: 'Security', icon: <SecurityIcon />, category: 'security' },
    { value: 4, label: 'General', icon: <SettingsIcon />, category: 'general' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Preferences
      </Typography>

      {hasUnsavedChanges && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save All Changes" to persist your preferences.
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={saveAllChanges}
            sx={{ ml: 2 }}
          >
            Save All Changes
          </Button>
        </Alert>
      )}

      <Card>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabCategories.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        {/* UI & Display Preferences */}
        <TabPanel value={selectedTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Theme Settings
              </Typography>
              
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">Color Theme</FormLabel>
                <RadioGroup
                  value={getPreferenceValue('theme_mode', 'light')}
                  onChange={(e) => updatePreference('theme_mode', e.target.value)}
                >
                  <FormControlLabel value="light" control={<Radio />} label="Light" />
                  <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                  <FormControlLabel value="auto" control={<Radio />} label="Auto (System)" />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                select
                label="Primary Color"
                value={getPreferenceValue('theme_primary_color', 'blue')}
                onChange={(e) => updatePreference('theme_primary_color', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="blue">Blue</MenuItem>
                <MenuItem value="green">Green</MenuItem>
                <MenuItem value="purple">Purple</MenuItem>
                <MenuItem value="orange">Orange</MenuItem>
                <MenuItem value="red">Red</MenuItem>
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('ui_compact_mode', false)}
                    onChange={(e) => updatePreference('ui_compact_mode', e.target.checked)}
                  />
                }
                label="Compact Mode"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Layout Settings
              </Typography>

              <TextField
                fullWidth
                select
                label="Sidebar Position"
                value={getPreferenceValue('ui_sidebar_position', 'left')}
                onChange={(e) => updatePreference('ui_sidebar_position', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="left">Left</MenuItem>
                <MenuItem value="right">Right</MenuItem>
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('ui_sidebar_collapsed', false)}
                    onChange={(e) => updatePreference('ui_sidebar_collapsed', e.target.checked)}
                  />
                }
                label="Collapse Sidebar by Default"
                sx={{ mb: 2 }}
              />

              <Typography gutterBottom>Page Size</Typography>
              <Slider
                value={getPreferenceValue('ui_page_size', 50)}
                onChange={(e, value) => updatePreference('ui_page_size', value)}
                min={10}
                max={100}
                step={10}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notification Preferences */}
        <TabPanel value={selectedTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Email Notifications
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('notification_email_enabled', true)}
                    onChange={(e) => updatePreference('notification_email_enabled', e.target.checked)}
                  />
                }
                label="Enable Email Notifications"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('notification_capital_activities', true)}
                    onChange={(e) => updatePreference('notification_capital_activities', e.target.checked)}
                  />
                }
                label="Capital Activity Notifications"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('notification_fund_updates', true)}
                    onChange={(e) => updatePreference('notification_fund_updates', e.target.checked)}
                  />
                }
                label="Fund Update Notifications"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('notification_reports_ready', true)}
                    onChange={(e) => updatePreference('notification_reports_ready', e.target.checked)}
                  />
                }
                label="Report Ready Notifications"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                In-App Notifications
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('notification_browser_enabled', true)}
                    onChange={(e) => updatePreference('notification_browser_enabled', e.target.checked)}
                  />
                }
                label="Browser Notifications"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                select
                label="Notification Frequency"
                value={getPreferenceValue('notification_frequency', 'immediate')}
                onChange={(e) => updatePreference('notification_frequency', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="hourly">Hourly Digest</MenuItem>
                <MenuItem value="daily">Daily Digest</MenuItem>
                <MenuItem value="weekly">Weekly Digest</MenuItem>
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('notification_sound_enabled', false)}
                    onChange={(e) => updatePreference('notification_sound_enabled', e.target.checked)}
                  />
                }
                label="Sound Notifications"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Report Preferences */}
        <TabPanel value={selectedTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Default Report Settings
              </Typography>

              <TextField
                fullWidth
                select
                label="Default Export Format"
                value={getPreferenceValue('report_default_format', 'excel')}
                onChange={(e) => updatePreference('report_default_format', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="excel">Excel</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </TextField>

              <TextField
                fullWidth
                select
                label="Date Range Default"
                value={getPreferenceValue('report_default_date_range', 'current_quarter')}
                onChange={(e) => updatePreference('report_default_date_range', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="current_month">Current Month</MenuItem>
                <MenuItem value="current_quarter">Current Quarter</MenuItem>
                <MenuItem value="current_year">Current Year</MenuItem>
                <MenuItem value="last_month">Last Month</MenuItem>
                <MenuItem value="last_quarter">Last Quarter</MenuItem>
                <MenuItem value="last_year">Last Year</MenuItem>
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('report_auto_refresh', false)}
                    onChange={(e) => updatePreference('report_auto_refresh', e.target.checked)}
                  />
                }
                label="Auto-refresh Reports"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Dashboard Preferences
              </Typography>

              <TextField
                fullWidth
                select
                label="Default Dashboard"
                value={getPreferenceValue('report_default_dashboard', 'overview')}
                onChange={(e) => updatePreference('report_default_dashboard', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="overview">Fund Overview</MenuItem>
                <MenuItem value="performance">Performance Dashboard</MenuItem>
                <MenuItem value="operations">Operations Dashboard</MenuItem>
                <MenuItem value="analytics">Analytics Dashboard</MenuItem>
              </TextField>

              <Typography gutterBottom>Refresh Interval (minutes)</Typography>
              <Slider
                value={getPreferenceValue('report_refresh_interval', 5)}
                onChange={(e, value) => updatePreference('report_refresh_interval', value)}
                min={1}
                max={60}
                step={1}
                marks={[
                  { value: 1, label: '1m' },
                  { value: 15, label: '15m' },
                  { value: 30, label: '30m' },
                  { value: 60, label: '1h' },
                ]}
                valueLabelDisplay="auto"
                sx={{ mb: 3 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('report_show_charts', true)}
                    onChange={(e) => updatePreference('report_show_charts', e.target.checked)}
                  />
                }
                label="Show Charts by Default"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Preferences */}
        <TabPanel value={selectedTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Session Settings
              </Typography>

              <TextField
                fullWidth
                type="number"
                label="Session Timeout (minutes)"
                value={getPreferenceValue('security_session_timeout', 60)}
                onChange={(e) => updatePreference('security_session_timeout', parseInt(e.target.value))}
                sx={{ mb: 2 }}
                inputProps={{ min: 5, max: 480 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('security_remember_me', false)}
                    onChange={(e) => updatePreference('security_remember_me', e.target.checked)}
                  />
                }
                label="Remember Me on Login"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('security_logout_on_close', false)}
                    onChange={(e) => updatePreference('security_logout_on_close', e.target.checked)}
                  />
                }
                label="Logout When Browser Closes"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Privacy Settings
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('security_activity_logging', true)}
                    onChange={(e) => updatePreference('security_activity_logging', e.target.checked)}
                  />
                }
                label="Log Activity History"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('security_share_analytics', false)}
                    onChange={(e) => updatePreference('security_share_analytics', e.target.checked)}
                  />
                }
                label="Share Usage Analytics"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                select
                label="Data Retention Period"
                value={getPreferenceValue('security_data_retention', '2_years')}
                onChange={(e) => updatePreference('security_data_retention', e.target.value)}
              >
                <MenuItem value="1_year">1 Year</MenuItem>
                <MenuItem value="2_years">2 Years</MenuItem>
                <MenuItem value="5_years">5 Years</MenuItem>
                <MenuItem value="indefinite">Indefinite</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </TabPanel>

        {/* General Preferences */}
        <TabPanel value={selectedTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Regional Settings
              </Typography>

              <TextField
                fullWidth
                select
                label="Language"
                value={getPreferenceValue('general_language', 'en')}
                onChange={(e) => updatePreference('general_language', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </TextField>

              <TextField
                fullWidth
                select
                label="Timezone"
                value={getPreferenceValue('general_timezone', 'America/New_York')}
                onChange={(e) => updatePreference('general_timezone', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="America/New_York">Eastern Time</MenuItem>
                <MenuItem value="America/Chicago">Central Time</MenuItem>
                <MenuItem value="America/Denver">Mountain Time</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                <MenuItem value="UTC">UTC</MenuItem>
              </TextField>

              <TextField
                fullWidth
                select
                label="Date Format"
                value={getPreferenceValue('general_date_format', 'MM/dd/yyyy')}
                onChange={(e) => updatePreference('general_date_format', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="MM/dd/yyyy">MM/dd/yyyy</MenuItem>
                <MenuItem value="dd/MM/yyyy">dd/MM/yyyy</MenuItem>
                <MenuItem value="yyyy-MM-dd">yyyy-MM-dd</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Other Settings
              </Typography>

              <TextField
                fullWidth
                select
                label="Currency Display"
                value={getPreferenceValue('general_currency', 'USD')}
                onChange={(e) => updatePreference('general_currency', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
                <MenuItem value="JPY">JPY (¥)</MenuItem>
              </TextField>

              <TextField
                fullWidth
                select
                label="Number Format"
                value={getPreferenceValue('general_number_format', 'en-US')}
                onChange={(e) => updatePreference('general_number_format', e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="en-US">1,234.56</MenuItem>
                <MenuItem value="de-DE">1.234,56</MenuItem>
                <MenuItem value="fr-FR">1 234,56</MenuItem>
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={getPreferenceValue('general_keyboard_shortcuts', true)}
                    onChange={(e) => updatePreference('general_keyboard_shortcuts', e.target.checked)}
                  />
                }
                label="Enable Keyboard Shortcuts"
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Custom Preferences */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Custom Preferences
          </Typography>
          
          <List>
            {preferences
              .filter(p => !p.preferenceKey.startsWith('theme_') && 
                          !p.preferenceKey.startsWith('ui_') && 
                          !p.preferenceKey.startsWith('notification_') &&
                          !p.preferenceKey.startsWith('report_') &&
                          !p.preferenceKey.startsWith('security_') &&
                          !p.preferenceKey.startsWith('general_'))
              .map((preference) => (
                <ListItem key={preference.id} divider>
                  <ListItemText
                    primary={preference.preferenceKey}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Value: {preference.preferenceValue}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label={preference.dataType} size="small" variant="outlined" />
                          <Chip label={preference.category} size="small" variant="outlined" />
                          {preference.isPublic && (
                            <Chip label="Public" size="small" color="info" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => deletePreference(preference.preferenceKey)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>

          {preferences.length === 0 && (
            <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
              No custom preferences found
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserPreferences;