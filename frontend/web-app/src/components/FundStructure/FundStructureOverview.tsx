import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  AccountTree,
  TrendingUp,
  People,
  AttachMoney,
  Add,
  Visibility,
  Edit
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchFundStructures, fetchFundHierarchy } from '../../store/slices/fundStructureSlice';
import { FundStructure } from '../../types/fundStructure';

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
      id={`fund-structure-tabpanel-${index}`}
      aria-labelledby={`fund-structure-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FundStructureOverview: React.FC = () => {
  const dispatch = useAppDispatch();
  const { structures, hierarchyTree, loading, error } = useAppSelector(state => state.fundStructure);
  const [selectedFund, setSelectedFund] = useState<FundStructure | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    dispatch(fetchFundStructures());
  }, [dispatch]);

  const handleViewHierarchy = (fund: FundStructure) => {
    setSelectedFund(fund);
    dispatch(fetchFundHierarchy(fund.fund_id));
    setDialogOpen(true);
  };

  const getStructureTypeColor = (type: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
      main: 'primary',
      parallel: 'secondary',
      feeder: 'success',
      master: 'warning',
      blocker: 'error',
      aggregator: 'primary'
    };
    return colors[type] || 'primary';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const calculateSubscriptionRate = (committed: number, target: number) => {
    return target > 0 ? (committed / target) * 100 : 0;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Fund Structures
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {/* Handle create new structure */}}
        >
          Create Structure
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {structures.map((structure) => (
          <Grid item xs={12} md={6} lg={4} key={structure.fund_id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2" noWrap>
                    {structure.fund_name}
                  </Typography>
                  <Chip
                    label={structure.structure_type}
                    color={getStructureTypeColor(structure.structure_type)}
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Target Size
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(structure.target_size)}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Subscription Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={calculateSubscriptionRate(structure.committed_capital, structure.target_size)}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2">
                    {formatCurrency(structure.committed_capital)} / {formatCurrency(structure.target_size)}
                    ({calculateSubscriptionRate(structure.committed_capital, structure.target_size).toFixed(1)}%)
                  </Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <AttachMoney fontSize="small" color="primary" />
                      <Box ml={1}>
                        <Typography variant="caption" color="text.secondary">
                          Management Fee
                        </Typography>
                        <Typography variant="body2">
                          {(structure.management_fee_rate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <TrendingUp fontSize="small" color="primary" />
                      <Box ml={1}>
                        <Typography variant="caption" color="text.secondary">
                          Carry Rate
                        </Typography>
                        <Typography variant="body2">
                          {(structure.carry_rate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {structure.parent_fund_id && (
                  <Box mb={2}>
                    <Chip
                      icon={<AccountTree />}
                      label="Child Fund"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                )}

                {structure.child_funds.length > 0 && (
                  <Box mb={2}>
                    <Chip
                      icon={<AccountTree />}
                      label={`${structure.child_funds.length} Child Funds`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                )}

                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewHierarchy(structure)}
                  >
                    View Hierarchy
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => {/* Handle edit */}}
                  >
                    Edit
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Hierarchy Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Fund Hierarchy - {selectedFund?.fund_name}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Structure Tree" />
            <Tab label="Relationships" />
            <Tab label="Capacity Overview" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {hierarchyTree && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Fund Structure Tree
                </Typography>
                {/* Tree visualization would go here */}
                <Card sx={{ p: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Root Fund:</strong> {hierarchyTree.root_fund.fund_name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Target Size:</strong> {formatCurrency(hierarchyTree.total_target_size)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Committed:</strong> {formatCurrency(hierarchyTree.total_committed)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Investors:</strong> {hierarchyTree.total_investors}
                  </Typography>
                </Card>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {hierarchyTree && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Parent Fund</TableCell>
                      <TableCell>Child Fund</TableCell>
                      <TableCell>Relationship Type</TableCell>
                      <TableCell>Allocation %</TableCell>
                      <TableCell>Cross Investment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hierarchyTree.relationships.map((rel) => (
                      <TableRow key={rel.relationship_id}>
                        <TableCell>{rel.parent_fund_id}</TableCell>
                        <TableCell>{rel.child_fund_id}</TableCell>
                        <TableCell>{rel.relationship_type}</TableCell>
                        <TableCell>
                          {rel.allocation_percentage ? `${rel.allocation_percentage}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {rel.cross_investment_allowed ? 'Yes' : 'No'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Capacity Overview
            </Typography>
            {/* Capacity details would go here */}
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FundStructureOverview;