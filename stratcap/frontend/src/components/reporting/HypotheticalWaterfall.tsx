import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Edit,
  Compare,
  Download,
  Share,
  MoreVert,
  TrendingUp,
  Assessment,
  Timeline,
  PieChart
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import type { 
  HypotheticalScenario, 
  ScenarioResults, 
  WaterfallStep,
  AllocationResult 
} from '../../types/reporting';
import { hypotheticalAPI } from '../../services/reporting/reportingAPI';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';

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
      id={`waterfall-tabpanel-${index}`}
      aria-labelledby={`waterfall-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface HypotheticalWaterfallProps {
  fundId: number;
  selectedScenarioId?: string;
  onScenarioCreate?: (scenario: HypotheticalScenario) => void;
  onScenarioCompare?: (scenarios: string[]) => void;
}

export default function HypotheticalWaterfall({ 
  fundId, 
  selectedScenarioId,
  onScenarioCreate,
  onScenarioCompare
}: HypotheticalWaterfallProps) {
  const [scenarios, setScenarios] = useState<HypotheticalScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<HypotheticalScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [actionMenu, setActionMenu] = useState<{
    anchorEl: HTMLElement | null;
    scenarioId: string | null;
  }>({ anchorEl: null, scenarioId: null });

  useEffect(() => {
    loadScenarios();
  }, [fundId]);

  useEffect(() => {
    if (selectedScenarioId) {
      const scenario = scenarios.find(s => s.id === selectedScenarioId);
      if (scenario) {
        setSelectedScenario(scenario);
      }
    }
  }, [selectedScenarioId, scenarios]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const response = await hypotheticalAPI.getScenarios({ fundId });
      setScenarios(response.data.data);
      
      if (response.data.data.length > 0 && !selectedScenario) {
        setSelectedScenario(response.data.data[0]);
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioSelect = (scenario: HypotheticalScenario) => {
    setSelectedScenario(scenario);
  };

  const handleCalculateScenario = async (scenarioId: string) => {
    try {
      setCalculating(true);
      await hypotheticalAPI.calculateScenario(scenarioId);
      await loadScenarios();
    } catch (error) {
      console.error('Failed to calculate scenario:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, scenarioId: string) => {
    setActionMenu({ anchorEl: event.currentTarget, scenarioId });
  };

  const handleActionMenuClose = () => {
    setActionMenu({ anchorEl: null, scenarioId: null });
  };

  const handleExportScenario = async (scenarioId: string) => {
    try {
      const response = await hypotheticalAPI.exportScenario(scenarioId, {
        format: 'excel',
        includeCharts: true,
        includeRawData: true
      });
      
      // Download the file
      const link = document.createElement('a');
      link.href = response.data.data.url;
      link.download = response.data.data.filename;
      link.click();
    } catch (error) {
      console.error('Failed to export scenario:', error);
    }
    handleActionMenuClose();
  };

  const getStatusColor = (status: HypotheticalScenario['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'calculating': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Scenario list columns
  const scenarioColumns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Scenario Name', 
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="subtitle2">{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.description || 'No description'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'parameters.totalProceeds',
      headerName: 'Total Proceeds',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value || 0)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'results.netIRR',
      headerName: 'Net IRR',
      width: 100,
      valueFormatter: (params) => params.value ? formatPercentage(params.value) : '-'
    },
    {
      field: 'results.netTVPI',
      headerName: 'Net TVPI',
      width: 100,
      valueFormatter: (params) => params.value ? `${params.value.toFixed(2)}x` : '-'
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<PlayArrow />}
          label="Calculate"
          onClick={() => handleCalculateScenario(params.id as string)}
          disabled={params.row.status === 'calculating'}
        />,
        <GridActionsCellItem
          icon={<MoreVert />}
          label="More"
          onClick={(event) => handleActionMenuOpen(event, params.id as string)}
        />
      ]
    }
  ];

  // Waterfall steps columns
  const waterfallColumns: GridColDef[] = [
    { field: 'step', headerName: 'Step', width: 80 },
    { field: 'description', headerName: 'Description', flex: 1 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value)
    },
    {
      field: 'lpAllocation',
      headerName: 'LP Allocation',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value)
    },
    {
      field: 'gpAllocation',
      headerName: 'GP Allocation',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value)
    },
    {
      field: 'carriedInterest',
      headerName: 'Carried Interest',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value)
    }
  ];

  // Allocation results columns
  const allocationColumns: GridColDef[] = [
    { field: 'investorName', headerName: 'Investor', flex: 1 },
    {
      field: 'commitment',
      headerName: 'Commitment',
      width: 130,
      valueFormatter: (params) => formatCurrency(params.value)
    },
    {
      field: 'capitalCalled',
      headerName: 'Capital Called',
      width: 130,
      valueFormatter: (params) => formatCurrency(params.value)
    },
    {
      field: 'totalProceeds',
      headerName: 'Total Proceeds',
      width: 130,
      valueFormatter: (params) => formatCurrency(params.value)
    },
    {
      field: 'netIRR',
      headerName: 'Net IRR',
      width: 100,
      valueFormatter: (params) => formatPercentage(params.value)
    },
    {
      field: 'netTVPI',
      headerName: 'Net TVPI',
      width: 100,
      valueFormatter: (params) => `${params.value.toFixed(2)}x`
    },
    {
      field: 'netMOIC',
      headerName: 'Net MOIC',
      width: 100,
      valueFormatter: (params) => `${params.value.toFixed(2)}x`
    }
  ];

  const keyMetrics = useMemo(() => {
    if (!selectedScenario?.results) return [];

    return [
      {
        label: 'Total Proceeds',
        value: formatCurrency(selectedScenario.results.totalProceeds),
        icon: <TrendingUp />
      },
      {
        label: 'LP Proceeds',
        value: formatCurrency(selectedScenario.results.lpProceeds),
        icon: <Assessment />
      },
      {
        label: 'GP Proceeds',
        value: formatCurrency(selectedScenario.results.gpProceeds),
        icon: <PieChart />
      },
      {
        label: 'Net IRR',
        value: formatPercentage(selectedScenario.results.netIRR),
        icon: <Timeline />
      },
      {
        label: 'Net TVPI',
        value: `${selectedScenario.results.netTVPI.toFixed(2)}x`,
        icon: <Assessment />
      },
      {
        label: 'DPI',
        value: `${selectedScenario.results.dpi.toFixed(2)}x`,
        icon: <TrendingUp />
      }
    ];
  }, [selectedScenario]);

  const chartData = useMemo(() => {
    if (!selectedScenario?.results?.cashFlows) return [];

    return selectedScenario.results.cashFlows.map(cf => ({
      date: new Date(cf.date).toLocaleDateString(),
      netCashFlow: cf.netCashFlow / 1000000, // Convert to millions
      cumulativeNetCashFlow: cf.cumulativeNetCashFlow / 1000000,
      netAssetValue: cf.netAssetValue / 1000000
    }));
  }, [selectedScenario]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading hypothetical scenarios...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* Scenario List */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Scenarios</Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onScenarioCreate?.(null)}
                >
                  New Scenario
                </Button>
              </Box>
              
              <DataGrid
                rows={scenarios}
                columns={scenarioColumns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                autoHeight
                disableSelectionOnClick
                onRowClick={(params) => handleScenarioSelect(params.row as HypotheticalScenario)}
                sx={{
                  '& .MuiDataGrid-row': {
                    cursor: 'pointer'
                  },
                  '& .MuiDataGrid-row.Mui-selected': {
                    backgroundColor: 'action.selected'
                  }
                }}
                getRowId={(row) => row.id}
                selectionModel={selectedScenario ? [selectedScenario.id] : []}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Scenario Details */}
        <Grid item xs={12} lg={8}>
          {selectedScenario ? (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{selectedScenario.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedScenario.description || 'No description'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PlayArrow />}
                      onClick={() => handleCalculateScenario(selectedScenario.id)}
                      disabled={calculating}
                    >
                      {calculating ? 'Calculating...' : 'Calculate'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Compare />}
                      onClick={() => onScenarioCompare?.([selectedScenario.id])}
                    >
                      Compare
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => onScenarioCreate?.(selectedScenario)}
                    >
                      Edit
                    </Button>
                  </Box>
                </Box>

                {calculating && <LinearProgress sx={{ mb: 2 }} />}

                {selectedScenario.status === 'error' && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Calculation failed. Please check the scenario parameters and try again.
                  </Alert>
                )}

                {selectedScenario.results ? (
                  <>
                    {/* Key Metrics */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {keyMetrics.map((metric, index) => (
                        <Grid item xs={6} md={4} lg={2} key={index}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                {metric.icon}
                              </Box>
                              <Typography variant="h6" component="div">
                                {metric.value}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {metric.label}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Tabs for detailed results */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                        <Tab label="Cash Flow Chart" />
                        <Tab label="Waterfall Steps" />
                        <Tab label="Investor Allocations" />
                      </Tabs>
                    </Box>

                    <TabPanel value={activeTab} index={0}>
                      <Box sx={{ height: 400, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip formatter={(value) => [`$${value}M`, '']} />
                            <Line 
                              type="monotone" 
                              dataKey="netCashFlow" 
                              stroke="#1976d2" 
                              name="Net Cash Flow"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="cumulativeNetCashFlow" 
                              stroke="#dc004e" 
                              name="Cumulative Net Cash Flow"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="netAssetValue" 
                              stroke="#2e7d32" 
                              name="Net Asset Value"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </TabPanel>

                    <TabPanel value={activeTab} index={1}>
                      <DataGrid
                        rows={selectedScenario.results.waterfallSteps || []}
                        columns={waterfallColumns}
                        pageSize={25}
                        rowsPerPageOptions={[25]}
                        autoHeight
                        disableSelectionOnClick
                        getRowId={(row) => row.step}
                      />
                    </TabPanel>

                    <TabPanel value={activeTab} index={2}>
                      <DataGrid
                        rows={selectedScenario.results.allocations || []}
                        columns={allocationColumns}
                        pageSize={25}
                        rowsPerPageOptions={[25]}
                        autoHeight
                        disableSelectionOnClick
                        getRowId={(row) => row.investorId}
                      />
                    </TabPanel>
                  </>
                ) : (
                  <Alert severity="info">
                    Click "Calculate" to run the waterfall analysis for this scenario.
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  Select a scenario to view details and results
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => handleExportScenario(actionMenu.scenarioId!)}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}