import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccountBalance as FundIcon,
  TrendingUp as InvestmentIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';

interface GlobalEntity {
  id: string;
  name: string;
  entityType: 'person' | 'corporation' | 'partnership' | 'trust' | 'foundation' | 'government' | 'other';
  primaryContact?: {
    email: string;
    phone: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  relationshipSummary: {
    totalCommitments: string;
    totalContributions: string;
    totalDistributions: string;
    activeFunds: number;
    lastActivity: string;
  };
  tags: string[];
  isActive: boolean;
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
      id={`entity-tabpanel-${index}`}
      aria-labelledby={`entity-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const GlobalEntityDirectory: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [entities, setEntities] = useState<GlobalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchGlobalEntities();
  }, []);

  const fetchGlobalEntities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/global-entities/directory');
      setEntities(response.data.data || []);
    } catch (error) {
      console.error('Error fetching global entities:', error);
      enqueueSnackbar('Failed to load entity directory', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'person':
        return <PersonIcon />;
      case 'corporation':
      case 'partnership':
        return <BusinessIcon />;
      case 'trust':
      case 'foundation':
        return <FundIcon />;
      default:
        return <BusinessIcon />;
    }
  };

  const getEntityTypeColor = (entityType: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (entityType) {
      case 'person':
        return 'primary';
      case 'corporation':
        return 'success';
      case 'partnership':
        return 'info';
      case 'trust':
        return 'warning';
      case 'foundation':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.primaryContact?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || entity.entityType === filterType;
    return matchesSearch && matchesType;
  });

  const entityTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'person', label: 'Individual' },
    { value: 'corporation', label: 'Corporation' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'trust', label: 'Trust' },
    { value: 'foundation', label: 'Foundation' },
    { value: 'government', label: 'Government' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Box>
      <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4" component="h1">
            Global Entity Directory
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Comprehensive view of all entities across funds
          </Typography>
        </Grid>
        <Grid item>
          <IconButton onClick={fetchGlobalEntities} color="primary">
            <RefreshIcon />
          </IconButton>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Entity Type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                SelectProps={{ native: true }}
              >
                {entityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="textSecondary">
                {filteredEntities.length} entities
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <LinearProgress />
      ) : (
        <Card>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Table View" />
            <Tab label="Card View" />
            <Tab label="Summary View" />
          </Tabs>

          <TabPanel value={selectedTab} index={0}>
            {/* Table View */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Entity</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell align="right">Total Commitments</TableCell>
                    <TableCell align="right">Total Contributions</TableCell>
                    <TableCell align="right">Active Funds</TableCell>
                    <TableCell>Last Activity</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEntities.map((entity) => (
                    <TableRow key={entity.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getEntityIcon(entity.entityType)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {entity.name}
                            </Typography>
                            {entity.tags.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                {entity.tags.slice(0, 2).map((tag) => (
                                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                                ))}
                                {entity.tags.length > 2 && (
                                  <Chip label={`+${entity.tags.length - 2}`} size="small" variant="outlined" />
                                )}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entity.entityType}
                          size="small"
                          color={getEntityTypeColor(entity.entityType)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {entity.primaryContact ? (
                          <Box>
                            <Typography variant="body2">
                              {entity.primaryContact.email}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {entity.primaryContact.phone}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No contact info
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(parseFloat(entity.relationshipSummary.totalCommitments))}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(parseFloat(entity.relationshipSummary.totalContributions))}
                      </TableCell>
                      <TableCell align="right">
                        {entity.relationshipSummary.activeFunds}
                      </TableCell>
                      <TableCell>
                        {formatDate(entity.relationshipSummary.lastActivity)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEntities.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                          No entities found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            {/* Card View */}
            <Grid container spacing={2}>
              {filteredEntities.map((entity) => (
                <Grid item xs={12} md={6} lg={4} key={entity.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: getEntityTypeColor(entity.entityType) + '.main' }}>
                          {getEntityIcon(entity.entityType)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                            {entity.name}
                          </Typography>
                          <Chip
                            label={entity.entityType}
                            size="small"
                            color={getEntityTypeColor(entity.entityType)}
                            variant="outlined"
                          />
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Financial Summary
                        </Typography>
                        <Typography variant="body2">
                          <strong>Commitments:</strong> {formatCurrency(parseFloat(entity.relationshipSummary.totalCommitments))}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Contributions:</strong> {formatCurrency(parseFloat(entity.relationshipSummary.totalContributions))}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Active Funds:</strong> {entity.relationshipSummary.activeFunds}
                        </Typography>
                      </Box>

                      {entity.tags.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {entity.tags.map((tag) => (
                              <Chip key={tag} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Typography variant="caption" color="textSecondary">
                          Last activity: {formatDate(entity.relationshipSummary.lastActivity)}
                        </Typography>
                        <Box>
                          <IconButton size="small">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={selectedTab} index={2}>
            {/* Summary View */}
            <Box>
              {entityTypes.slice(1).map((type) => {
                const typeEntities = filteredEntities.filter(e => e.entityType === type.value);
                if (typeEntities.length === 0) return null;

                const totalCommitments = typeEntities.reduce((sum, e) => 
                  sum + parseFloat(e.relationshipSummary.totalCommitments), 0
                );
                const totalContributions = typeEntities.reduce((sum, e) => 
                  sum + parseFloat(e.relationshipSummary.totalContributions), 0
                );

                return (
                  <Accordion key={type.value}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Avatar sx={{ bgcolor: getEntityTypeColor(type.value) + '.main' }}>
                          {getEntityIcon(type.value)}
                        </Avatar>
                        <Typography variant="h6">{type.label}</Typography>
                        <Chip label={typeEntities.length} size="small" />
                        <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                          <Typography variant="body2">
                            {formatCurrency(totalCommitments)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Total Commitments
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
                        {typeEntities.map((entity) => (
                          <Grid item xs={12} md={6} key={entity.id}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                              <Typography variant="body2">{entity.name}</Typography>
                              <Typography variant="body2">
                                {formatCurrency(parseFloat(entity.relationshipSummary.totalCommitments))}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </TabPanel>
        </Card>
      )}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Entities
              </Typography>
              <Typography variant="h5">
                {entities.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Commitments
              </Typography>
              <Typography variant="h5">
                {formatCurrency(
                  entities.reduce((sum, e) => sum + parseFloat(e.relationshipSummary.totalCommitments), 0)
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Contributions
              </Typography>
              <Typography variant="h5">
                {formatCurrency(
                  entities.reduce((sum, e) => sum + parseFloat(e.relationshipSummary.totalContributions), 0)
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Relationships
              </Typography>
              <Typography variant="h5">
                {entities.filter(e => e.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GlobalEntityDirectory;