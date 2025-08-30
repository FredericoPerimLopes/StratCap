import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  AccountTree as AccountTreeIcon,
  Class as ClassIcon,
  Code as CodeIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

import FundStructure from './FundStructure';
import ClassConfiguration from './ClassConfiguration';
import TransactionCodeManager from './TransactionCodeManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`config-tabpanel-${index}`}
    aria-labelledby={`config-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

interface ConfigurationState {
  fundStructure: any;
  classConfiguration: any;
  transactionCodes: any;
  hasUnsavedChanges: boolean;
}

const FundConfiguration: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [configuration, setConfiguration] = useState<ConfigurationState>({
    fundStructure: {
      entities: [],
      relationships: [],
      version: 1
    },
    classConfiguration: {
      classes: [],
      rules: [],
      waterfalls: []
    },
    transactionCodes: {
      codes: [],
      categories: [],
      mappings: []
    },
    hasUnsavedChanges: false
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleConfigurationChange = (section: string, data: any) => {
    setConfiguration(prev => ({
      ...prev,
      [section]: data,
      hasUnsavedChanges: true
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would save to the API
      console.log('Saving configuration:', configuration);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConfiguration(prev => ({
        ...prev,
        hasUnsavedChanges: false
      }));
      
      // Show success message
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Open preview modal or navigate to preview page
    console.log('Preview configuration');
  };

  const handleViewHistory = () => {
    // Navigate to configuration history
    navigate(`/fund-families/${id}/configuration/history`);
  };

  const getTabLabel = (index: number, hasChanges: boolean) => {
    const labels = ['Fund Structure', 'Class Configuration', 'Transaction Codes'];
    const icons = [<AccountTreeIcon key={0} />, <ClassIcon key={1} />, <CodeIcon key={2} />];
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icons[index]}
        <Typography sx={{ ml: 1 }}>{labels[index]}</Typography>
        {hasChanges && (
          <Chip 
            size="small" 
            color="warning" 
            label="•" 
            sx={{ ml: 1, minWidth: 'auto', height: 16, '& .MuiChip-label': { px: 0.5 } }}
          />
        )}
      </Box>
    );
  };

  // Mock data to check which sections have changes
  const sectionChanges = {
    0: false, // Fund Structure
    1: false, // Class Configuration  
    2: false  // Transaction Codes
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="/fund-families" 
            onClick={(e) => { e.preventDefault(); navigate('/fund-families'); }}
            sx={{ cursor: 'pointer' }}
          >
            Fund Families
          </Link>
          <Link 
            color="inherit" 
            href={`/fund-families/${id}`}
            onClick={(e) => { e.preventDefault(); navigate(`/fund-families/${id}`); }}
            sx={{ cursor: 'pointer' }}
          >
            Fund Family Details
          </Link>
          <Typography color="text.primary">Configuration</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="600">
              Fund Configuration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure fund structure, investment classes, and transaction codes
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={handleViewHistory}
            >
              History
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={!configuration.hasUnsavedChanges}
            >
              Preview
            </Button>

            <Button
              variant="contained"
              startIcon={saving ? undefined : <SaveIcon />}
              onClick={handleSave}
              disabled={!configuration.hasUnsavedChanges || saving}
            >
              {saving ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinearProgress size={16} sx={{ mr: 1, width: 20 }} />
                  Saving...
                </Box>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Unsaved Changes Alert */}
      {configuration.hasUnsavedChanges && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleSave}>
              Save Now
            </Button>
          }
        >
          You have unsaved changes. Don't forget to save your configuration.
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 72,
                textTransform: 'none',
                fontSize: '1rem'
              }
            }}
          >
            <Tab 
              label={getTabLabel(0, sectionChanges[0])}
              id="config-tab-0"
              aria-controls="config-tabpanel-0"
            />
            <Tab 
              label={getTabLabel(1, sectionChanges[1])}
              id="config-tab-1"
              aria-controls="config-tabpanel-1"
            />
            <Tab 
              label={getTabLabel(2, sectionChanges[2])}
              id="config-tab-2"
              aria-controls="config-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Fund Structure Tab */}
        <TabPanel value={activeTab} index={0}>
          <FundStructure
            configuration={configuration.fundStructure}
            onChange={(data) => handleConfigurationChange('fundStructure', data)}
            fundFamilyId={id}
          />
        </TabPanel>

        {/* Class Configuration Tab */}
        <TabPanel value={activeTab} index={1}>
          <ClassConfiguration
            configuration={configuration.classConfiguration}
            onChange={(data) => handleConfigurationChange('classConfiguration', data)}
            fundFamilyId={id}
          />
        </TabPanel>

        {/* Transaction Code Manager Tab */}
        <TabPanel value={activeTab} index={2}>
          <TransactionCodeManager
            configuration={configuration.transactionCodes}
            onChange={(data) => handleConfigurationChange('transactionCodes', data)}
            fundFamilyId={id}
          />
        </TabPanel>
      </Card>

      {/* Configuration Summary */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountTreeIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="600">
                {configuration.fundStructure.entities?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fund Entities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <ClassIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="600">
                {configuration.classConfiguration.classes?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Investment Classes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <CodeIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="600">
                {configuration.transactionCodes.codes?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Transaction Codes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FundConfiguration;