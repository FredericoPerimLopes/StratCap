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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Divider,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  TableChart as TableIcon,
  Settings as SettingsIcon,
  PlayArrow as RunIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';

interface PivotDimension {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

interface PivotMeasure {
  field: string;
  label: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'stddev' | 'custom';
  formatType?: 'currency' | 'percentage' | 'number' | 'date';
  customFormula?: string;
}

interface PivotFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
}

interface DataSource {
  id: string;
  name: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
  }>;
}

const PivotTableBuilder: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState<PivotDimension[]>([]);
  const [measures, setMeasures] = useState<PivotMeasure[]>([]);
  const [filters, setFilters] = useState<PivotFilter[]>([]);
  const [pivotResult, setPivotResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [addDimensionOpen, setAddDimensionOpen] = useState(false);
  const [addMeasureOpen, setAddMeasureOpen] = useState(false);
  const [addFilterOpen, setAddFilterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [pivotSettings, setPivotSettings] = useState({
    showTotals: true,
    showSubtotals: false,
    showPercentages: false,
    theme: 'default',
  });

  useEffect(() => {
    fetchDataSources();
  }, []);

  useEffect(() => {
    if (selectedDataSource) {
      fetchDataSourceSchema();
    }
  }, [selectedDataSource]);

  const fetchDataSources = async () => {
    try {
      const response = await api.get('/data-analysis/data-sources');
      setDataSources(response.data.data || []);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      enqueueSnackbar('Failed to load data sources', { variant: 'error' });
    }
  };

  const fetchDataSourceSchema = async () => {
    try {
      const response = await api.get(`/data-analysis/data-sources/${selectedDataSource}/schema`);
      setAvailableFields(response.data.data.fields || []);
    } catch (error) {
      console.error('Error fetching schema:', error);
      enqueueSnackbar('Failed to load data source schema', { variant: 'error' });
    }
  };

  const addDimension = (field: any) => {
    const newDimension: PivotDimension = {
      field: field.name,
      label: field.label,
      type: field.type,
    };
    setDimensions([...dimensions, newDimension]);
    setAddDimensionOpen(false);
  };

  const addMeasure = (field: any, aggregation: string) => {
    const newMeasure: PivotMeasure = {
      field: field.name,
      label: field.label,
      aggregation: aggregation as any,
      formatType: field.type === 'number' ? 'currency' : 'number',
    };
    setMeasures([...measures, newMeasure]);
    setAddMeasureOpen(false);
  };

  const addFilter = (field: any, operator: string, value: any) => {
    const newFilter: PivotFilter = {
      field: field.name,
      operator: operator as any,
      value,
    };
    setFilters([...filters, newFilter]);
    setAddFilterOpen(false);
  };

  const removeDimension = (index: number) => {
    setDimensions(dimensions.filter((_, i) => i !== index));
  };

  const removeMeasure = (index: number) => {
    setMeasures(measures.filter((_, i) => i !== index));
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const executePivotTable = async () => {
    if (!selectedDataSource || dimensions.length === 0 || measures.length === 0) {
      enqueueSnackbar('Please select data source, dimensions, and measures', { variant: 'warning' });
      return;
    }

    try {
      setLoading(true);
      
      const config = {
        name: 'Temporary Pivot Table',
        description: 'Ad-hoc pivot table',
        dataSource: selectedDataSource,
        dimensions,
        measures,
        filters,
        sorting: [],
        formatting: pivotSettings,
      };

      const response = await api.post('/data-analysis/pivot-tables/execute-temp', {
        config,
        runtimeFilters: filters,
      });
      
      setPivotResult(response.data.data);
      enqueueSnackbar('Pivot table executed successfully', { variant: 'success' });
    } catch (error: any) {
      console.error('Error executing pivot table:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to execute pivot table',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const savePivotTable = async () => {
    const name = prompt('Enter a name for this pivot table:');
    if (!name) return;

    try {
      const config = {
        name,
        description: 'User-created pivot table',
        dataSource: selectedDataSource,
        dimensions,
        measures,
        filters,
        sorting: [],
        formatting: pivotSettings,
      };

      await api.post('/data-analysis/pivot-tables', config);
      enqueueSnackbar('Pivot table saved successfully', { variant: 'success' });
    } catch (error: any) {
      console.error('Error saving pivot table:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to save pivot table',
        { variant: 'error' }
      );
    }
  };

  const exportPivotTable = async (format: string) => {
    if (!pivotResult) {
      enqueueSnackbar('Please execute the pivot table first', { variant: 'warning' });
      return;
    }

    try {
      const response = await api.post(`/data-analysis/export/${selectedDataSource}`, {
        format,
        includeHeaders: true,
        includeFormatting: true,
        data: pivotResult.data,
      }, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pivot-table.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar(`Pivot table exported as ${format.toUpperCase()}`, { variant: 'success' });
    } catch (error) {
      console.error('Error exporting pivot table:', error);
      enqueueSnackbar('Failed to export pivot table', { variant: 'error' });
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === 'dimensions' && destination.droppableId === 'dimensions') {
      const reorderedDimensions = Array.from(dimensions);
      const [removed] = reorderedDimensions.splice(source.index, 1);
      reorderedDimensions.splice(destination.index, 0, removed);
      setDimensions(reorderedDimensions);
    } else if (source.droppableId === 'measures' && destination.droppableId === 'measures') {
      const reorderedMeasures = Array.from(measures);
      const [removed] = reorderedMeasures.splice(source.index, 1);
      reorderedMeasures.splice(destination.index, 0, removed);
      setMeasures(reorderedMeasures);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Pivot Table Builder
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>

              {/* Data Source Selection */}
              <TextField
                fullWidth
                select
                label="Data Source"
                value={selectedDataSource}
                onChange={(e) => setSelectedDataSource(e.target.value)}
                sx={{ mb: 2 }}
              >
                {dataSources.map((source) => (
                  <MenuItem key={source.id} value={source.id}>
                    {source.name}
                  </MenuItem>
                ))}
              </TextField>

              <Divider sx={{ my: 2 }} />

              {/* Dimensions */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">Dimensions</Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => setAddDimensionOpen(true)}
                    disabled={!selectedDataSource}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
                
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="dimensions">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {dimensions.map((dimension, index) => (
                          <Draggable key={dimension.field} draggableId={dimension.field} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Chip
                                  label={dimension.label}
                                  onDelete={() => removeDimension(index)}
                                  sx={{ m: 0.5 }}
                                  icon={<DragIcon />}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </Box>

              {/* Measures */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">Measures</Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => setAddMeasureOpen(true)}
                    disabled={!selectedDataSource}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
                
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="measures">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {measures.map((measure, index) => (
                          <Draggable key={`${measure.field}-${measure.aggregation}`} draggableId={`${measure.field}-${measure.aggregation}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Chip
                                  label={`${measure.label} (${measure.aggregation})`}
                                  onDelete={() => removeMeasure(index)}
                                  sx={{ m: 0.5 }}
                                  icon={<DragIcon />}
                                  color="primary"
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </Box>

              {/* Filters */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">Filters</Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => setAddFilterOpen(true)}
                    disabled={!selectedDataSource}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
                
                {filters.map((filter, index) => (
                  <Chip
                    key={index}
                    label={`${filter.field} ${filter.operator} ${filter.value}`}
                    onDelete={() => removeFilter(index)}
                    sx={{ m: 0.5 }}
                    color="secondary"
                  />
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Actions */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<RunIcon />}
                  onClick={executePivotTable}
                  disabled={loading || !selectedDataSource || dimensions.length === 0 || measures.length === 0}
                  fullWidth
                >
                  {loading ? 'Executing...' : 'Execute'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={savePivotTable}
                  disabled={!pivotResult}
                  fullWidth
                >
                  Save
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => setSettingsOpen(true)}
                  fullWidth
                >
                  Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Pivot Table Results
                </Typography>
                {pivotResult && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => exportPivotTable('csv')}
                    >
                      CSV
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => exportPivotTable('excel')}
                    >
                      Excel
                    </Button>
                  </Box>
                )}
              </Box>

              {!pivotResult ? (
                <Alert severity="info">
                  <Typography variant="body2">
                    Configure your pivot table and click Execute to see results
                  </Typography>
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {pivotResult.data.headers.map((header: any, index: number) => (
                          <TableCell key={index} align={header.type === 'measure' ? 'right' : 'left'}>
                            {header.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pivotResult.data.rows.map((row: any, index: number) => (
                        <TableRow key={index}>
                          {row.cells.map((cell: any, cellIndex: number) => (
                            <TableCell 
                              key={cellIndex} 
                              align={pivotResult.data.headers[cellIndex].type === 'measure' ? 'right' : 'left'}
                            >
                              {cell.formattedValue || cell.value}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {pivotResult && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Generated: {formatDate(pivotResult.metadata.generatedAt)} | 
                    Execution time: {pivotResult.metadata.executionTime}ms |
                    Rows: {pivotResult.data.rows.length}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Dimension Dialog */}
      <Dialog open={addDimensionOpen} onClose={() => setAddDimensionOpen(false)}>
        <DialogTitle>Add Dimension</DialogTitle>
        <DialogContent>
          <List>
            {availableFields.filter(field => 
              !dimensions.some(dim => dim.field === field.name)
            ).map((field) => (
              <ListItem key={field.name} button onClick={() => addDimension(field)}>
                <ListItemText 
                  primary={field.label} 
                  secondary={field.type}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Add Measure Dialog */}
      <Dialog open={addMeasureOpen} onClose={() => setAddMeasureOpen(false)}>
        <DialogTitle>Add Measure</DialogTitle>
        <DialogContent>
          <List>
            {availableFields.filter(field => 
              field.type === 'number' && !measures.some(measure => measure.field === field.name)
            ).map((field) => (
              <ListItem key={field.name}>
                <ListItemText 
                  primary={field.label} 
                  secondary={field.type}
                />
                <ListItemSecondaryAction>
                  <TextField
                    select
                    size="small"
                    defaultValue="sum"
                    onChange={(e) => addMeasure(field, e.target.value)}
                  >
                    <MenuItem value="sum">Sum</MenuItem>
                    <MenuItem value="avg">Average</MenuItem>
                    <MenuItem value="count">Count</MenuItem>
                    <MenuItem value="min">Min</MenuItem>
                    <MenuItem value="max">Max</MenuItem>
                  </TextField>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Pivot Table Settings</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Switch
                checked={pivotSettings.showTotals}
                onChange={(e) => setPivotSettings({...pivotSettings, showTotals: e.target.checked})}
              />
            }
            label="Show Totals"
          />
          <FormControlLabel
            control={
              <Switch
                checked={pivotSettings.showSubtotals}
                onChange={(e) => setPivotSettings({...pivotSettings, showSubtotals: e.target.checked})}
              />
            }
            label="Show Subtotals"
          />
          <FormControlLabel
            control={
              <Switch
                checked={pivotSettings.showPercentages}
                onChange={(e) => setPivotSettings({...pivotSettings, showPercentages: e.target.checked})}
              />
            }
            label="Show Percentages"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PivotTableBuilder;