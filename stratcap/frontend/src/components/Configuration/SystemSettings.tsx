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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

interface SystemConfig {
  id: string;
  module: string;
  configKey: string;
  configValue: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: 'system' | 'feature' | 'integration' | 'security' | 'ui' | 'workflow';
  description?: string;
  isEncrypted: boolean;
  isRequired: boolean;
  isReadOnly: boolean;
  validationRules?: Record<string, any>;
  defaultValue?: string;
  environmentOverride?: boolean;
}

interface ConfigFormData {
  configValue: string;
}

const SystemSettings: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [configurations, setConfigurations] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showEncrypted, setShowEncrypted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/configuration/system', {
        params: {
          search: searchTerm || undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined,
          module: filterModule !== 'all' ? filterModule : undefined,
          limit: 100,
        },
      });
      setConfigurations(response.data.data.configurations || []);
    } catch (error: any) {
      console.error('Error fetching configurations:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to load configurations',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const editConfigFormik = useFormik<ConfigFormData>({
    initialValues: {
      configValue: '',
    },
    validationSchema: Yup.object({
      configValue: Yup.string().required('Value is required'),
    }),
    onSubmit: async (values) => {
      if (!editingConfig) return;

      try {
        await api.put(`/configuration/system/${editingConfig.module}/${editingConfig.configKey}`, {
          configValue: values.configValue,
        });
        
        enqueueSnackbar('Configuration updated successfully', { variant: 'success' });
        setEditDialogOpen(false);
        fetchConfigurations();
      } catch (error: any) {
        console.error('Error updating configuration:', error);
        enqueueSnackbar(
          error.response?.data?.message || 'Failed to update configuration',
          { variant: 'error' }
        );
      }
    },
  });

  const handleEditConfig = (config: SystemConfig) => {
    setEditingConfig(config);
    editConfigFormik.setValues({
      configValue: config.configValue,
    });
    setEditDialogOpen(true);
  };

  const getParsedValue = (config: SystemConfig) => {
    try {
      switch (config.dataType) {
        case 'boolean':
          return config.configValue.toLowerCase() === 'true' ? 'true' : 'false';
        case 'number':
          return parseFloat(config.configValue).toString();
        case 'json':
        case 'array':
          return JSON.stringify(JSON.parse(config.configValue), null, 2);
        default:
          return config.configValue;
      }
    } catch {
      return config.configValue;
    }
  };

  const getDisplayValue = (config: SystemConfig) => {
    if (config.isEncrypted && !showEncrypted[config.id]) {
      return '••••••••';
    }
    return getParsedValue(config);
  };

  const getCategoryColor = (category: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (category) {
      case 'system':
        return 'primary';
      case 'security':
        return 'error';
      case 'feature':
        return 'success';
      case 'integration':
        return 'info';
      case 'ui':
        return 'secondary';
      case 'workflow':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const toggleShowEncrypted = (configId: string) => {
    setShowEncrypted(prev => ({
      ...prev,
      [configId]: !prev[configId],
    }));
  };

  const groupedConfigurations = configurations.reduce((groups: Record<string, Record<string, SystemConfig[]>>, config) => {
    if (!groups[config.module]) {
      groups[config.module] = {};
    }
    if (!groups[config.module][config.category]) {
      groups[config.module][config.category] = [];
    }
    groups[config.module][config.category].push(config);
    return groups;
  }, {});

  const modules = [...new Set(configurations.map(c => c.module))];
  const categories = [...new Set(configurations.map(c => c.category))];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search configurations"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by key or description..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Module"
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
              >
                <MenuItem value="all">All Modules</MenuItem>
                {modules.map((module) => (
                  <MenuItem key={module} value={module}>
                    {module}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchConfigurations}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Configuration Groups */}
      {Object.entries(groupedConfigurations).map(([module, categoryGroups]) => (
        <Card key={module} sx={{ mb: 2 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6">{module}</Typography>
                <Chip 
                  label={`${Object.values(categoryGroups).flat().length} settings`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {Object.entries(categoryGroups).map(([category, configs]) => (
                <Box key={category} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Chip 
                      label={category}
                      color={getCategoryColor(category)}
                      size="small"
                    />
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                      {category.replace('_', ' ')} Settings
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {configs.map((config) => (
                      <Grid item xs={12} key={config.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {config.configKey}
                                  </Typography>
                                  {config.isRequired && (
                                    <Chip label="Required" size="small" color="error" variant="outlined" />
                                  )}
                                  {config.isReadOnly && (
                                    <Chip label="Read Only" size="small" color="warning" variant="outlined" />
                                  )}
                                  {config.isEncrypted && (
                                    <Chip 
                                      label="Encrypted" 
                                      size="small" 
                                      color="secondary" 
                                      variant="outlined"
                                      icon={<SecurityIcon />}
                                    />
                                  )}
                                  {config.environmentOverride && (
                                    <Tooltip title="Can be overridden by environment variables">
                                      <Chip 
                                        label="Env Override" 
                                        size="small" 
                                        color="info" 
                                        variant="outlined"
                                        icon={<InfoIcon />}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                                
                                {config.description && (
                                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                    {config.description}
                                  </Typography>
                                )}
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption" color="textSecondary">
                                    Type: {config.dataType}
                                  </Typography>
                                  {config.defaultValue && (
                                    <Typography variant="caption" color="textSecondary">
                                      | Default: {config.defaultValue}
                                    </Typography>
                                  )}
                                </Box>
                                
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    <strong>Value:</strong> {getDisplayValue(config)}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {config.isEncrypted && (
                                  <IconButton
                                    size="small"
                                    onClick={() => toggleShowEncrypted(config.id)}
                                  >
                                    {showEncrypted[config.id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                  </IconButton>
                                )}
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditConfig(config)}
                                  disabled={config.isReadOnly}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Box>
                            </Box>
                            
                            {config.validationRules && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="textSecondary">
                                  <strong>Validation Rules:</strong> {JSON.stringify(config.validationRules)}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        </Card>
      ))}

      {configurations.length === 0 && !loading && (
        <Alert severity="info">
          No configurations found. Try adjusting your search criteria.
        </Alert>
      )}

      {/* Edit Configuration Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={editConfigFormik.handleSubmit}>
          <DialogTitle>
            Edit Configuration: {editingConfig?.configKey}
          </DialogTitle>
          <DialogContent>
            {editingConfig && (
              <Box sx={{ pt: 1 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Module:</strong> {editingConfig.module}<br />
                    <strong>Type:</strong> {editingConfig.dataType}<br />
                    <strong>Category:</strong> {editingConfig.category}
                  </Typography>
                </Alert>
                
                {editingConfig.description && (
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {editingConfig.description}
                  </Typography>
                )}

                {editingConfig.dataType === 'boolean' ? (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editConfigFormik.values.configValue === 'true'}
                        onChange={(e) => editConfigFormik.setFieldValue('configValue', e.target.checked.toString())}
                      />
                    }
                    label="Enabled"
                  />
                ) : editingConfig.dataType === 'json' || editingConfig.dataType === 'array' ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Configuration Value (JSON)"
                    name="configValue"
                    value={editConfigFormik.values.configValue}
                    onChange={editConfigFormik.handleChange}
                    error={editConfigFormik.touched.configValue && Boolean(editConfigFormik.errors.configValue)}
                    helperText={editConfigFormik.touched.configValue && editConfigFormik.errors.configValue}
                    sx={{ fontFamily: 'monospace' }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Configuration Value"
                    name="configValue"
                    type={editingConfig.dataType === 'number' ? 'number' : 'text'}
                    value={editConfigFormik.values.configValue}
                    onChange={editConfigFormik.handleChange}
                    error={editConfigFormik.touched.configValue && Boolean(editConfigFormik.errors.configValue)}
                    helperText={editConfigFormik.touched.configValue && editConfigFormik.errors.configValue}
                  />
                )}

                {editingConfig.validationRules && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Validation Rules:</strong><br />
                      {JSON.stringify(editingConfig.validationRules, null, 2)}
                    </Typography>
                  </Alert>
                )}

                {editingConfig.defaultValue && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Default value: {editingConfig.defaultValue}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={editConfigFormik.isSubmitting}
            >
              {editConfigFormik.isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;