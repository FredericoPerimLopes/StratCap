import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Download,
  Share,
  Add,
  Remove,
  Visibility,
  VisibilityOff,
  Compare,
  TrendingUp,
  TrendingDown,
  Remove as RemoveIcon
} from '@mui/icons-material';

import type { 
  HypotheticalScenario, 
  ScenarioComparison as ScenarioComparisonType,
  ComparisonMetric 
} from '../../types/reporting';
import { hypotheticalAPI } from '../../services/reporting/reportingAPI';

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
      id={`comparison-tabpanel-${index}`}
      aria-labelledby={`comparison-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ScenarioComparisonProps {
  fundId: number;
  scenarios: HypotheticalScenario[];
  selectedScenarios?: string[];
  onScenariosChange?: (scenarioIds: string[]) => void;
}

const DEFAULT_METRICS: ComparisonMetric[] = [
  { name: 'Total Proceeds', type: 'absolute', format: 'currency' },
  { name: 'LP Proceeds', type: 'absolute', format: 'currency' },
  { name: 'GP Proceeds', type: 'absolute', format: 'currency' },
  { name: 'Carried Interest', type: 'absolute', format: 'currency' },
  { name: 'Net IRR', type: 'percentage', format: 'percent', highlight: 'best' },
  { name: 'Net TVPI', type: 'ratio', format: 'decimal', highlight: 'best' },
  { name: 'Net MOIC', type: 'ratio', format: 'decimal', highlight: 'best' },
  { name: 'DPI', type: 'ratio', format: 'decimal', highlight: 'best' },
  { name: 'RVPI', type: 'ratio', format: 'decimal' }
];

const COLORS = ['#1976d2', '#dc004e', '#2e7d32', '#f57c00', '#7b1fa2', '#00695c', '#d32f2f', '#1565c0'];

export default function ScenarioComparison({ 
  fundId, 
  scenarios, 
  selectedScenarios = [],
  onScenariosChange 
}: ScenarioComparisonProps) {
  const [comparisonType, setComparisonType] = useState<'side_by_side' | 'overlay' | 'variance'>('side_by_side');
  const [activeTab, setActiveTab] = useState(0);
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(DEFAULT_METRICS.slice(0, 6).map(m => m.name));
  const [showAbsolute, setShowAbsolute] = useState(true);
  const [showPercentage, setShowPercentage] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Net IRR', 'Net TVPI', 'DPI']);
  const [exportMenu, setExportMenu] = useState<HTMLElement | null>(null);

  const selectedScenarioData = useMemo(() => {
    return scenarios.filter(s => selectedScenarios.includes(s.id) && s.results);
  }, [scenarios, selectedScenarios]);

  const formatValue = (value: number, format: string, type: 'absolute' | 'percentage' | 'ratio' = 'absolute') => {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percent':
        return `${(value * 100).toFixed(2)}%`;
      case 'decimal':
        return `${value.toFixed(2)}x`;
      default:
        return value.toLocaleString();
    }
  };

  const getMetricValue = (scenario: HypotheticalScenario, metricName: string): number => {
    if (!scenario.results) return 0;

    const metricMap: Record<string, keyof typeof scenario.results> = {
      'Total Proceeds': 'totalProceeds',
      'LP Proceeds': 'lpProceeds',
      'GP Proceeds': 'gpProceeds',
      'Carried Interest': 'carriedInterest',
      'Net IRR': 'netIRR',
      'Net TVPI': 'netTVPI',
      'Net MOIC': 'netMOIC',
      'DPI': 'dpi',
      'RVPI': 'rvpi'
    };

    return scenario.results[metricMap[metricName]] as number || 0;
  };

  const getVariance = (values: number[]): { min: number; max: number; variance: number; mean: number } => {
    if (values.length === 0) return { min: 0, max: 0, variance: 0, mean: 0 };
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = max === min ? 0 : ((max - min) / mean) * 100;

    return { min, max, variance, mean };
  };

  const getBestPerformer = (values: { scenario: string; value: number }[], isHigherBetter: boolean = true) => {
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => isHigherBetter ? b.value - a.value : a.value - b.value);
    return sorted[0];
  };

  const renderSideBySideComparison = () => {
    const visibleMetricsData = DEFAULT_METRICS.filter(m => visibleMetrics.includes(m.name));

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Metric</strong></TableCell>
              {selectedScenarioData.map((scenario, index) => (
                <TableCell key={scenario.id} align="center">
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {scenario.name}
                    </Typography>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: COLORS[index % COLORS.length],
                        borderRadius: '50%',
                        mt: 0.5
                      }}
                    />
                  </Box>
                </TableCell>
              ))}
              {comparisonType === 'variance' && (
                <>
                  <TableCell align="center"><strong>Variance</strong></TableCell>
                  <TableCell align="center"><strong>Best</strong></TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleMetricsData.map((metric) => {
              const values = selectedScenarioData.map(s => ({
                scenario: s.name,
                value: getMetricValue(s, metric.name)
              }));
              const variance = getVariance(values.map(v => v.value));
              const bestPerformer = getBestPerformer(values, metric.highlight === 'best');

              return (
                <TableRow key={metric.name}>
                  <TableCell component="th" scope="row">
                    <strong>{metric.name}</strong>
                  </TableCell>
                  {selectedScenarioData.map((scenario, index) => {
                    const value = getMetricValue(scenario, metric.name);
                    const isBest = metric.highlight && bestPerformer?.scenario === scenario.name;
                    
                    return (
                      <TableCell 
                        key={scenario.id} 
                        align="center"
                        sx={{ 
                          backgroundColor: isBest ? 'success.light' : 'transparent',
                          fontWeight: isBest ? 'bold' : 'normal'
                        }}
                      >
                        {formatValue(value, metric.format || 'currency', metric.type)}
                        {isBest && (
                          <Chip 
                            label="Best" 
                            size="small" 
                            color="success" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                  {comparisonType === 'variance' && (
                    <>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {variance.variance > 10 ? (
                            <TrendingUp color="warning" />
                          ) : (
                            <TrendingDown color="success" />
                          )}
                          <Typography sx={{ ml: 1 }}>
                            {variance.variance.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {bestPerformer?.scenario}
                        </Typography>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderChartComparison = () => {
    const chartData = selectedMetrics.map(metric => {
      const dataPoint: any = { metric };
      selectedScenarioData.forEach((scenario, index) => {
        dataPoint[scenario.name] = getMetricValue(scenario, metric);
      });
      return dataPoint;
    });

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics Comparison
              </Typography>
              <Box sx={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <RechartsTooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                    {selectedScenarioData.map((scenario, index) => (
                      <Bar 
                        key={scenario.id}
                        dataKey={scenario.name} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk-Return Profile
              </Typography>
              <Box sx={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={selectedScenarioData.map(scenario => ({
                    scenario: scenario.name,
                    IRR: (getMetricValue(scenario, 'Net IRR') * 100) || 0,
                    TVPI: getMetricValue(scenario, 'Net TVPI') || 0,
                    DPI: getMetricValue(scenario, 'DPI') || 0,
                    MOIC: getMetricValue(scenario, 'Net MOIC') || 0
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="scenario" />
                    <PolarRadiusAxis />
                    {selectedScenarioData.map((scenario, index) => (
                      <Radar
                        key={scenario.id}
                        name={scenario.name}
                        dataKey="IRR"
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.3}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cash Flow Timeline
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    {selectedScenarioData.map((scenario, index) => (
                      scenario.results?.cashFlows && (
                        <Line
                          key={scenario.id}
                          type="monotone"
                          dataKey="cumulativeNetCashFlow"
                          data={scenario.results.cashFlows}
                          stroke={COLORS[index % COLORS.length]}
                          name={scenario.name}
                        />
                      )
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const handleScenarioToggle = (scenarioId: string) => {
    const updated = selectedScenarios.includes(scenarioId)
      ? selectedScenarios.filter(id => id !== scenarioId)
      : [...selectedScenarios, scenarioId];
    onScenariosChange?.(updated);
  };

  const handleMetricVisibilityToggle = (metricName: string) => {
    setVisibleMetrics(prev => 
      prev.includes(metricName)
        ? prev.filter(m => m !== metricName)
        : [...prev, metricName]
    );
  };

  const handleExport = (format: string) => {
    // Export logic would go here
    setExportMenu(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" gutterBottom>
                Comparison Type
              </Typography>
              <ToggleButtonGroup
                value={comparisonType}
                exclusive
                onChange={(e, value) => value && setComparisonType(value)}
                size="small"
              >
                <ToggleButton value="side_by_side">Side by Side</ToggleButton>
                <ToggleButton value="overlay">Charts</ToggleButton>
                <ToggleButton value="variance">Variance</ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Scenarios ({selectedScenarios.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {scenarios.map((scenario, index) => (
                  <Chip
                    key={scenario.id}
                    label={scenario.name}
                    variant={selectedScenarios.includes(scenario.id) ? 'filled' : 'outlined'}
                    color={selectedScenarios.includes(scenario.id) ? 'primary' : 'default'}
                    onClick={() => handleScenarioToggle(scenario.id)}
                    onDelete={selectedScenarios.includes(scenario.id) ? () => handleScenarioToggle(scenario.id) : undefined}
                    deleteIcon={<RemoveIcon />}
                    avatar={
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: COLORS[index % COLORS.length],
                          borderRadius: '50%'
                        }}
                      />
                    }
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  startIcon={<Download />}
                  onClick={(e) => setExportMenu(e.currentTarget)}
                  variant="outlined"
                  size="small"
                >
                  Export
                </Button>
                <Button
                  startIcon={<Share />}
                  variant="outlined"
                  size="small"
                >
                  Share
                </Button>
              </Box>
            </Grid>
          </Grid>

          {selectedScenarios.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Select at least one scenario to begin comparison
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Comparison Content */}
      {selectedScenarios.length > 0 && (
        <>
          {comparisonType === 'overlay' ? (
            <Card>
              <CardContent>
                {/* Chart controls */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Chart Metrics
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Select Metrics</InputLabel>
                    <Select
                      multiple
                      value={selectedMetrics}
                      onChange={(e) => setSelectedMetrics(e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {DEFAULT_METRICS.map((metric) => (
                        <MenuItem key={metric.name} value={metric.name}>
                          {metric.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                {renderChartComparison()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                {/* Table controls */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Scenario Comparison
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAbsolute}
                          onChange={(e) => setShowAbsolute(e.target.checked)}
                        />
                      }
                      label="Absolute Values"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showPercentage}
                          onChange={(e) => setShowPercentage(e.target.checked)}
                        />
                      }
                      label="Percentage Diff"
                    />
                  </Box>
                </Box>

                {/* Metric visibility controls */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Visible Metrics
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {DEFAULT_METRICS.map((metric) => (
                      <Chip
                        key={metric.name}
                        label={metric.name}
                        variant={visibleMetrics.includes(metric.name) ? 'filled' : 'outlined'}
                        size="small"
                        onClick={() => handleMetricVisibilityToggle(metric.name)}
                        icon={visibleMetrics.includes(metric.name) ? <Visibility /> : <VisibilityOff />}
                      />
                    ))}
                  </Box>
                </Box>

                {renderSideBySideComparison()}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenu}
        open={Boolean(exportMenu)}
        onClose={() => setExportMenu(null)}
      >
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemText>Export to Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemText>Export to PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemText>Export to CSV</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}