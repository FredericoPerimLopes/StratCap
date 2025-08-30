import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Preview,
  Save,
  Download,
  ExpandMore,
  Settings,
  Visibility,
  Schedule,
  Share,
  DataUsage,
  BarChart,
  PieChart,
  Timeline,
  TableChart,
  Assessment
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import type { 
  ReportMetadata, 
  ReportConfiguration,
  ReportParameter,
  ReportFilter,
  VisualizationConfig,
  ChartType,
  ExportOptions
} from '../../types/reporting';
import { reportingAPI, customReportAPI } from '../../services/reporting/reportingAPI';

interface ReportGeneratorProps {
  report?: ReportMetadata;
  onSave?: (report: ReportMetadata) => void;
  onCancel?: () => void;
}

const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: React.ReactNode }[] = [
  { value: 'bar', label: 'Bar Chart', icon: <BarChart /> },
  { value: 'line', label: 'Line Chart', icon: <Timeline /> },
  { value: 'pie', label: 'Pie Chart', icon: <PieChart /> },
  { value: 'table', label: 'Table', icon: <TableChart /> },
  { value: 'area', label: 'Area Chart', icon: <Assessment /> },
  { value: 'scatter', label: 'Scatter Plot', icon: <DataUsage /> }
];

const DATA_SOURCE_OPTIONS = [
  { value: 'fund', label: 'Funds' },
  { value: 'investor', label: 'Investors' },
  { value: 'commitment', label: 'Commitments' },
  { value: 'transaction', label: 'Transactions' },
  { value: 'waterfall', label: 'Waterfall Results' },
  { value: 'custom_query', label: 'Custom Query' }
];

const steps = [
  'Basic Information',
  'Data Source',
  'Parameters & Filters',
  'Visualizations',
  'Formatting',
  'Review & Save'
];

export default function ReportGenerator({ report, onSave, onCancel }: ReportGeneratorProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Partial<ReportMetadata & { configuration: ReportConfiguration }>>({
    name: '',
    description: '',
    category: 'financial',
    tags: [],
    isPublic: false,
    configuration: {
      dataSource: { type: 'fund' },
      parameters: [],
      filters: [],
      groupings: [],
      calculations: [],
      formatting: {},
      visualization: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [availableFields, setAvailableFields] = useState<any[]>([]);

  useEffect(() => {
    if (report) {
      loadReportData(report.id);
    }
  }, [report]);

  const loadReportData = async (reportId: string) => {
    try {
      setLoading(true);
      const response = await reportingAPI.getReportById(reportId);
      setFormData(response.data.data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableFields = async (dataSourceType: string) => {
    try {
      const response = await customReportAPI.getBindableFields(dataSourceType);
      setAvailableFields(response.data.data);
    } catch (error) {
      console.error('Failed to load fields:', error);
    }
  };

  useEffect(() => {
    if (formData.configuration?.dataSource?.type) {
      loadAvailableFields(formData.configuration.dataSource.type);
    }
  }, [formData.configuration?.dataSource?.type]);

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.name?.trim()) {
          errors.name = 'Report name is required';
        }
        if (!formData.category) {
          errors.category = 'Category is required';
        }
        break;
      case 1: // Data Source
        if (!formData.configuration?.dataSource?.type) {
          errors.dataSource = 'Data source is required';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateStep(5)) return;

    try {
      setLoading(true);
      const response = report?.id 
        ? await reportingAPI.updateReport(report.id, formData)
        : await reportingAPI.createReport(formData as any);
      
      onSave?.(response.data.data);
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      if (formData.configuration) {
        const response = await reportingAPI.executeReport('preview', {});
        setPreviewData(response.data.data);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const addParameter = () => {
    const newParameter: ReportParameter = {
      id: `param_${Date.now()}`,
      name: '',
      type: 'text',
      required: false
    };
    
    const currentParams = formData.configuration?.parameters || [];
    updateFormData('configuration.parameters', [...currentParams, newParameter]);
  };

  const removeParameter = (index: number) => {
    const currentParams = formData.configuration?.parameters || [];
    const updated = currentParams.filter((_, i) => i !== index);
    updateFormData('configuration.parameters', updated);
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      field: '',
      operator: 'equals',
      value: '',
      logical: 'AND'
    };
    
    const currentFilters = formData.configuration?.filters || [];
    updateFormData('configuration.filters', [...currentFilters, newFilter]);
  };

  const removeFilter = (index: number) => {
    const currentFilters = formData.configuration?.filters || [];
    const updated = currentFilters.filter((_, i) => i !== index);
    updateFormData('configuration.filters', updated);
  };

  const addVisualization = () => {
    const newVisualization: VisualizationConfig = {
      id: `viz_${Date.now()}`,
      type: 'bar',
      title: 'New Chart',
      position: { x: 0, y: 0, width: 6, height: 4 },
      size: { width: 400, height: 300 },
      data: { xAxis: '', yAxis: [] },
      style: { colors: ['#1976d2'], theme: 'light', legend: { position: 'bottom' } }
    };
    
    const currentViz = formData.configuration?.visualization || [];
    updateFormData('configuration.visualization', [...currentViz, newVisualization]);
  };

  const removeVisualization = (index: number) => {
    const currentViz = formData.configuration?.visualization || [];
    const updated = currentViz.filter((_, i) => i !== index);
    updateFormData('configuration.visualization', updated);
  };

  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Report Name"
          value={formData.name || ''}
          onChange={(e) => updateFormData('name', e.target.value)}
          error={!!validationErrors.name}
          helperText={validationErrors.name}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required error={!!validationErrors.category}>
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category || ''}
            label="Category"
            onChange={(e) => updateFormData('category', e.target.value)}
          >
            <MenuItem value="financial">Financial</MenuItem>
            <MenuItem value="operational">Operational</MenuItem>
            <MenuItem value="compliance">Compliance</MenuItem>
            <MenuItem value="performance">Performance</MenuItem>
            <MenuItem value="portfolio">Portfolio</MenuItem>
            <MenuItem value="investor">Investor</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Description"
          value={formData.description || ''}
          onChange={(e) => updateFormData('description', e.target.value)}
          multiline
          rows={3}
        />
      </Grid>
      <Grid item xs={12} md={8}>
        <TextField
          fullWidth
          label="Tags (comma separated)"
          value={formData.tags?.join(', ') || ''}
          onChange={(e) => updateFormData('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
          helperText="Enter tags separated by commas"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.isPublic || false}
              onChange={(e) => updateFormData('isPublic', e.target.checked)}
            />
          }
          label="Make Public"
        />
      </Grid>
    </Grid>
  );

  const renderDataSource = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Data Source Configuration
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>Data Source Type</InputLabel>
          <Select
            value={formData.configuration?.dataSource?.type || ''}
            label="Data Source Type"
            onChange={(e) => updateFormData('configuration.dataSource.type', e.target.value)}
          >
            {DATA_SOURCE_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      {formData.configuration?.dataSource?.type === 'custom_query' && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="SQL Query"
            value={formData.configuration?.dataSource?.query || ''}
            onChange={(e) => updateFormData('configuration.dataSource.query', e.target.value)}
            multiline
            rows={6}
            placeholder="SELECT * FROM funds WHERE..."
            helperText="Write your custom SQL query here"
          />
        </Grid>
      )}
      <Grid item xs={12}>
        <Alert severity="info">
          Selected data source: <strong>{DATA_SOURCE_OPTIONS.find(opt => opt.value === formData.configuration?.dataSource?.type)?.label}</strong>
          {availableFields.length > 0 && (
            <><br />Available fields: {availableFields.map(f => f.name).join(', ')}</>
          )}
        </Alert>
      </Grid>
    </Grid>
  );

  const renderParametersAndFilters = () => (
    <Grid container spacing={3}>
      {/* Parameters */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Report Parameters</Typography>
          <Button startIcon={<Add />} onClick={addParameter} variant="outlined" size="small">
            Add Parameter
          </Button>
        </Box>
        
        {formData.configuration?.parameters?.map((param, index) => (
          <Card key={param.id} sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Parameter Name"
                    size="small"
                    value={param.name}
                    onChange={(e) => updateFormData(`configuration.parameters.${index}.name`, e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={param.type}
                      label="Type"
                      onChange={(e) => updateFormData(`configuration.parameters.${index}.type`, e.target.value)}
                    >
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="number">Number</MenuItem>
                      <MenuItem value="date">Date</MenuItem>
                      <MenuItem value="boolean">Boolean</MenuItem>
                      <MenuItem value="select">Select</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Default Value"
                    size="small"
                    value={param.defaultValue || ''}
                    onChange={(e) => updateFormData(`configuration.parameters.${index}.defaultValue`, e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={param.required}
                        onChange={(e) => updateFormData(`configuration.parameters.${index}.required`, e.target.checked)}
                      />
                    }
                    label="Required"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <IconButton onClick={() => removeParameter(index)} color="error">
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>

      {/* Filters */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Data Filters</Typography>
          <Button startIcon={<Add />} onClick={addFilter} variant="outlined" size="small">
            Add Filter
          </Button>
        </Box>
        
        {formData.configuration?.filters?.map((filter, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Field</InputLabel>
                    <Select
                      value={filter.field}
                      label="Field"
                      onChange={(e) => updateFormData(`configuration.filters.${index}.field`, e.target.value)}
                    >
                      {availableFields.map(field => (
                        <MenuItem key={field.name} value={field.name}>
                          {field.label || field.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={filter.operator}
                      label="Operator"
                      onChange={(e) => updateFormData(`configuration.filters.${index}.operator`, e.target.value)}
                    >
                      <MenuItem value="equals">Equals</MenuItem>
                      <MenuItem value="not_equals">Not Equals</MenuItem>
                      <MenuItem value="greater_than">Greater Than</MenuItem>
                      <MenuItem value="less_than">Less Than</MenuItem>
                      <MenuItem value="contains">Contains</MenuItem>
                      <MenuItem value="in">In</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Value"
                    size="small"
                    value={filter.value}
                    onChange={(e) => updateFormData(`configuration.filters.${index}.value`, e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Logic</InputLabel>
                    <Select
                      value={filter.logical || 'AND'}
                      label="Logic"
                      onChange={(e) => updateFormData(`configuration.filters.${index}.logical`, e.target.value)}
                    >
                      <MenuItem value="AND">AND</MenuItem>
                      <MenuItem value="OR">OR</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <IconButton onClick={() => removeFilter(index)} color="error">
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </Grid>
  );

  const renderVisualizations = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Visualizations</Typography>
          <Button startIcon={<Add />} onClick={addVisualization} variant="outlined" size="small">
            Add Chart
          </Button>
        </Box>
      </Grid>

      {formData.configuration?.visualization?.map((viz, index) => (
        <Grid item xs={12} key={viz.id}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {CHART_TYPE_OPTIONS.find(opt => opt.value === viz.type)?.icon}
                <Typography>{viz.title}</Typography>
                <Chip label={viz.type} size="small" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Chart Title"
                    value={viz.title}
                    onChange={(e) => updateFormData(`configuration.visualization.${index}.title`, e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Chart Type</InputLabel>
                    <Select
                      value={viz.type}
                      label="Chart Type"
                      onChange={(e) => updateFormData(`configuration.visualization.${index}.type`, e.target.value)}
                    >
                      {CHART_TYPE_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {option.icon}
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => removeVisualization(index)} color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>X-Axis Field</InputLabel>
                    <Select
                      value={viz.data.xAxis}
                      label="X-Axis Field"
                      onChange={(e) => updateFormData(`configuration.visualization.${index}.data.xAxis`, e.target.value)}
                    >
                      {availableFields.map(field => (
                        <MenuItem key={field.name} value={field.name}>
                          {field.label || field.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Y-Axis Field</InputLabel>
                    <Select
                      multiple
                      value={viz.data.yAxis}
                      label="Y-Axis Field"
                      onChange={(e) => updateFormData(`configuration.visualization.${index}.data.yAxis`, e.target.value)}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {availableFields.map(field => (
                        <MenuItem key={field.name} value={field.name}>
                          {field.label || field.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      ))}

      {!formData.configuration?.visualization?.length && (
        <Grid item xs={12}>
          <Alert severity="info">
            No visualizations added yet. Click "Add Chart" to create your first visualization.
          </Alert>
        </Grid>
      )}
    </Grid>
  );

  const renderFormatting = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Report Formatting
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Page Size</InputLabel>
          <Select
            value={formData.configuration?.formatting?.pageSize || 'A4'}
            label="Page Size"
            onChange={(e) => updateFormData('configuration.formatting.pageSize', e.target.value)}
          >
            <MenuItem value="A4">A4</MenuItem>
            <MenuItem value="Letter">Letter</MenuItem>
            <MenuItem value="Legal">Legal</MenuItem>
            <MenuItem value="A3">A3</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Orientation</InputLabel>
          <Select
            value={formData.configuration?.formatting?.orientation || 'portrait'}
            label="Orientation"
            onChange={(e) => updateFormData('configuration.formatting.orientation', e.target.value)}
          >
            <MenuItem value="portrait">Portrait</MenuItem>
            <MenuItem value="landscape">Landscape</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Header & Footer</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Header Content"
                  multiline
                  rows={2}
                  value={formData.configuration?.formatting?.header?.content || ''}
                  onChange={(e) => updateFormData('configuration.formatting.header.content', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Footer Content"
                  multiline
                  rows={2}
                  value={formData.configuration?.formatting?.footer?.content || ''}
                  onChange={(e) => updateFormData('configuration.formatting.footer.content', e.target.value)}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );

  const renderReview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Report Summary
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Basic Information</Typography>
            <Typography><strong>Name:</strong> {formData.name}</Typography>
            <Typography><strong>Category:</strong> {formData.category}</Typography>
            <Typography><strong>Tags:</strong> {formData.tags?.join(', ') || 'None'}</Typography>
            <Typography><strong>Public:</strong> {formData.isPublic ? 'Yes' : 'No'}</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Configuration</Typography>
            <Typography><strong>Data Source:</strong> {formData.configuration?.dataSource?.type}</Typography>
            <Typography><strong>Parameters:</strong> {formData.configuration?.parameters?.length || 0}</Typography>
            <Typography><strong>Filters:</strong> {formData.configuration?.filters?.length || 0}</Typography>
            <Typography><strong>Visualizations:</strong> {formData.configuration?.visualization?.length || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Alert severity="success">
          Report configuration is complete. Review all settings and click "Save Report" to create your report.
        </Alert>
      </Grid>
    </Grid>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0: return renderBasicInformation();
      case 1: return renderDataSource();
      case 2: return renderParametersAndFilters();
      case 3: return renderVisualizations();
      case 4: return renderFormatting();
      case 5: return renderReview();
      default: return 'Unknown step';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading report generator...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              {report ? 'Edit Report' : 'Create New Report'}
            </Typography>
            <Box>
              <Button onClick={onCancel} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button
                variant="outlined"
                startIcon={<Preview />}
                onClick={handlePreview}
                sx={{ mr: 1 }}
                disabled={activeStep < 2}
              >
                Preview
              </Button>
            </Box>
          </Box>

          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    {getStepContent(index)}
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <div>
                      <Button
                        variant="contained"
                        onClick={index === steps.length - 1 ? handleSave : handleNext}
                        sx={{ mt: 1, mr: 1 }}
                        disabled={loading}
                        startIcon={index === steps.length - 1 ? <Save /> : undefined}
                      >
                        {index === steps.length - 1 ? 'Save Report' : 'Continue'}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Back
                      </Button>
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Report Preview</DialogTitle>
        <DialogContent>
          {previewData ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Preview functionality would render the report here based on current configuration.
              </Typography>
            </Box>
          ) : (
            <Typography>No preview data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}