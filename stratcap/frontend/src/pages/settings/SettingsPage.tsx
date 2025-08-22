import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Switch,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Storage as StorageIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      securityAlerts: true
    },
    appearance: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      cookiePreferences: 'essential'
    }
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNotificationChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: event.target.checked
      }
    }));
  };

  const handleAppearanceChange = (key: string) => (event: any) => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: event.target.value
      }
    }));
  };

  const handlePrivacyChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: event.target.checked
      }
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
        Settings
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<PersonIcon />} label="Profile" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<PaletteIcon />} label="Appearance" />
            <Tab icon={<SecurityIcon />} label="Privacy & Security" />
            <Tab icon={<StorageIcon />} label="Data & Storage" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" sx={{ mb: 3 }}>Profile Settings</Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
              gap: 3 
            }}>
              <TextField
                fullWidth
                label="Full Name"
                defaultValue="John Smith"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email Address"
                defaultValue="john.smith@company.com"
                variant="outlined"
                type="email"
              />
              <TextField
                fullWidth
                label="Phone Number"
                defaultValue="+1 (555) 123-4567"
                variant="outlined"
              />
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select defaultValue="finance" label="Department">
                  <MenuItem value="finance">Finance</MenuItem>
                  <MenuItem value="operations">Operations</MenuItem>
                  <MenuItem value="compliance">Compliance</MenuItem>
                  <MenuItem value="management">Management</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={3}
                  defaultValue="Senior Financial Analyst with 10+ years of experience in fund management."
                  variant="outlined"
                />
              </Box>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Button variant="contained" sx={{ mr: 2 }}>
                Save Changes
              </Button>
              <Button variant="outlined">
                Cancel
              </Button>
            </Box>
          </TabPanel>

          {/* Notifications Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" sx={{ mb: 3 }}>Notification Preferences</Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive important updates via email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onChange={handleNotificationChange('emailNotifications')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Push Notifications"
                  secondary="Get real-time notifications in your browser"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onChange={handleNotificationChange('pushNotifications')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Weekly Reports"
                  secondary="Receive weekly fund performance summaries"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.weeklyReports}
                    onChange={handleNotificationChange('weeklyReports')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Security Alerts"
                  secondary="Get notified about security events and login attempts"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.securityAlerts}
                    onChange={handleNotificationChange('securityAlerts')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </TabPanel>

          {/* Appearance Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" sx={{ mb: 3 }}>Appearance & Language</Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
              gap: 3 
            }}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={settings.appearance.theme}
                  label="Theme"
                  onChange={handleAppearanceChange('theme')}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={settings.appearance.language}
                  label="Language"
                  onChange={handleAppearanceChange('language')}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={settings.appearance.timezone}
                  label="Timezone"
                  onChange={handleAppearanceChange('timezone')}
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="EST">Eastern Time</MenuItem>
                  <MenuItem value="PST">Pacific Time</MenuItem>
                  <MenuItem value="GMT">Greenwich Mean Time</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </TabPanel>

          {/* Privacy & Security Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" sx={{ mb: 3 }}>Privacy & Security</Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Your privacy and security are important to us. Review and adjust these settings as needed.
            </Alert>
            <List>
              <ListItem>
                <ListItemText
                  primary="Data Sharing"
                  secondary="Allow sharing of anonymized usage data for analytics"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.privacy.dataSharing}
                    onChange={handlePrivacyChange('dataSharing')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Analytics"
                  secondary="Help improve the platform by sharing usage analytics"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.privacy.analytics}
                    onChange={handlePrivacyChange('analytics')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Security Actions</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" color="warning">
                  Change Password
                </Button>
                <Button variant="outlined" color="info">
                  Enable 2FA
                </Button>
                <Button variant="outlined" color="error">
                  View Login History
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Data & Storage Tab */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" sx={{ mb: 3 }}>Data & Storage</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Storage Usage</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    You are using 2.3 GB of 10 GB available storage
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label="Documents: 1.2 GB" size="small" />
                    <Chip label="Reports: 0.8 GB" size="small" />
                    <Chip label="Cache: 0.3 GB" size="small" />
                  </Box>
                  <Button variant="outlined" size="small">
                    Clear Cache
                  </Button>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Data Export</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Download a copy of your personal data and settings
                  </Typography>
                  <Button variant="contained">
                    Export Data
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;