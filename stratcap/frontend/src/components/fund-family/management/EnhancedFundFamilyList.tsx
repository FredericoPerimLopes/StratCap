import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem as MenuItemComponent,
  IconButton,
  Tooltip,
  Pagination,
  Typography,
  Card,
  CardContent,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Sort as SortIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  MoreVert as MoreVertIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

import { AppDispatch, RootState } from '../../../store';
import { fetchFundFamilies, deleteFundFamily, FundFamily } from '../../../store/slices/fundFamilySlice';
import FundFamilyCard from './FundFamilyCard';
import FundFamilyCreation from './FundFamilyCreation';
import { ListTemplate, TableColumn, ActionButton } from '../../common/PageTemplate/ListTemplate';

interface FilterState {
  search: string;
  status: string;
  managementCompany: string;
  currency: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const EnhancedFundFamilyList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { fundFamilies, isLoading, error, pagination } = useSelector((state: RootState) => state.fundFamily);
  
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    managementCompany: '',
    currency: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(12); // Items per page

  useEffect(() => {
    const searchParams = {
      page,
      limit,
      search: filters.search || undefined,
      status: filters.status || undefined
    };
    
    dispatch(fetchFundFamilies(searchParams));
  }, [dispatch, page, limit, filters.search, filters.status]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const handleSort = (sortBy: string) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
    setSortMenuAnchor(null);
  };

  const handleFavorite = (id: number, favorite: boolean) => {
    if (favorite) {
      setFavorites(prev => [...prev, id]);
    } else {
      setFavorites(prev => prev.filter(fav => fav !== id));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteFundFamily(id)).unwrap();
    } catch (error) {
      console.error('Failed to delete fund family:', error);
    }
  };

  const handleRefresh = () => {
    const searchParams = {
      page,
      limit,
      search: filters.search || undefined,
      status: filters.status || undefined
    };
    
    dispatch(fetchFundFamilies(searchParams));
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Export fund families');
    setAnchorEl(null);
  };

  // Apply client-side filtering and sorting to the fund families
  const filteredAndSortedFundFamilies = React.useMemo(() => {
    let filtered = [...fundFamilies];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(ff =>
        ff.name.toLowerCase().includes(searchLower) ||
        ff.code.toLowerCase().includes(searchLower) ||
        ff.managementCompany.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(ff => ff.status === filters.status);
    }

    if (filters.managementCompany) {
      filtered = filtered.filter(ff => ff.managementCompany === filters.managementCompany);
    }

    if (filters.currency) {
      filtered = filtered.filter(ff => ff.primaryCurrency === filters.currency);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof FundFamily];
      let bValue: any = b[filters.sortBy as keyof FundFamily];

      // Handle special sorting cases
      if (filters.sortBy === 'totalAUM' || filters.sortBy === 'averageIRR') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [fundFamilies, filters]);

  // Get unique values for filter dropdowns
  const uniqueManagementCompanies = React.useMemo(() => {
    return Array.from(new Set(fundFamilies.map(ff => ff.managementCompany))).filter(Boolean);
  }, [fundFamilies]);

  const uniqueCurrencies = React.useMemo(() => {
    return Array.from(new Set(fundFamilies.map(ff => ff.primaryCurrency))).filter(Boolean);
  }, [fundFamilies]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1e9 ? 'compact' : 'standard'
    }).format(amount);
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  // Table columns configuration for table view
  const columns: TableColumn[] = [
    {
      id: 'name',
      label: 'Fund Family',
      sortable: true,
      format: (value: any, row: FundFamily) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" onClick={() => handleFavorite(row.id, !favorites.includes(row.id))}>
            <StarIcon 
              fontSize="small" 
              color={favorites.includes(row.id) ? 'warning' : 'disabled'}
            />
          </IconButton>
          <Box sx={{ ml: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.code}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'managementCompany',
      label: 'Management Company',
      sortable: true
    },
    {
      id: 'totalAUM',
      label: 'Total AUM',
      align: 'right',
      sortable: true,
      format: (value) => (
        <Typography variant="body2" fontWeight={600} color="primary.main">
          {value ? formatCurrency(value) : '-'}
        </Typography>
      )
    },
    {
      id: 'fundCount',
      label: 'Funds',
      align: 'center',
      sortable: true,
      format: (value) => (
        <Chip 
          label={value || 0} 
          size="small" 
          variant="outlined"
          color="primary"
        />
      )
    },
    {
      id: 'investorCount',
      label: 'Investors',
      align: 'center',
      sortable: true,
      format: (value) => value?.toLocaleString() || 0
    },
    {
      id: 'averageIRR',
      label: 'Avg IRR',
      align: 'right',
      sortable: true,
      format: (value) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {value && (
            <TrendingUpIcon 
              fontSize="small" 
              color={value > 12 ? 'success' : value > 8 ? 'warning' : 'error'}
              sx={{ mr: 0.5 }}
            />
          )}
          <Typography 
            variant="body2" 
            fontWeight={600}
            color={value && value > 12 ? 'success.main' : value && value > 8 ? 'warning.main' : 'text.primary'}
          >
            {value ? `${value.toFixed(1)}%` : '-'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      format: (value) => (
        <Chip 
          label={value} 
          size="small" 
          color={getStatusColor(value)}
          variant="outlined"
        />
      )
    }
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading fund families: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="600">
            Fund Family Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredAndSortedFundFamilies.length} fund families in your portfolio
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVertIcon />
          </IconButton>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            size="large"
          >
            New Fund Family
          </Button>
        </Box>
      </Box>

      {/* Filters and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search fund families..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItemComponent value="">All</MenuItemComponent>
                  <MenuItemComponent value="active">Active</MenuItemComponent>
                  <MenuItemComponent value="inactive">Inactive</MenuItemComponent>
                  <MenuItemComponent value="archived">Archived</MenuItemComponent>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Company</InputLabel>
                <Select
                  value={filters.managementCompany}
                  onChange={(e) => handleFilterChange('managementCompany', e.target.value)}
                  label="Company"
                >
                  <MenuItemComponent value="">All</MenuItemComponent>
                  {uniqueManagementCompanies.map(company => (
                    <MenuItemComponent key={company} value={company}>
                      {company}
                    </MenuItemComponent>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Currency</InputLabel>
                <Select
                  value={filters.currency}
                  onChange={(e) => handleFilterChange('currency', e.target.value)}
                  label="Currency"
                >
                  <MenuItemComponent value="">All</MenuItemComponent>
                  {uniqueCurrencies.map(currency => (
                    <MenuItemComponent key={currency} value={currency}>
                      {currency}
                    </MenuItemComponent>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={1}>
              <Tooltip title="Sort">
                <IconButton onClick={(e) => setSortMenuAnchor(e.currentTarget)}>
                  <SortIcon />
                </IconButton>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={2}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="cards">
                  <ViewModuleIcon />
                </ToggleButton>
                <ToggleButton value="table">
                  <ViewListIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>

          {/* Active Filters */}
          {(filters.search || filters.status || filters.managementCompany || filters.currency) && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {filters.search && (
                <Chip
                  label={`Search: ${filters.search}`}
                  onDelete={() => handleFilterChange('search', '')}
                  size="small"
                />
              )}
              {filters.status && (
                <Chip
                  label={`Status: ${filters.status}`}
                  onDelete={() => handleFilterChange('status', '')}
                  size="small"
                />
              )}
              {filters.managementCompany && (
                <Chip
                  label={`Company: ${filters.managementCompany}`}
                  onDelete={() => handleFilterChange('managementCompany', '')}
                  size="small"
                />
              )}
              {filters.currency && (
                <Chip
                  label={`Currency: ${filters.currency}`}
                  onDelete={() => handleFilterChange('currency', '')}
                  size="small"
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : viewMode === 'cards' ? (
        <Grid container spacing={3}>
          {filteredAndSortedFundFamilies.map((fundFamily) => (
            <Grid item xs={12} sm={6} lg={4} key={fundFamily.id}>
              <FundFamilyCard
                fundFamily={fundFamily}
                onDelete={handleDelete}
                onFavorite={handleFavorite}
                isFavorite={favorites.includes(fundFamily.id)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <ListTemplate
          data={filteredAndSortedFundFamilies}
          columns={columns}
          loading={isLoading}
          onRowClick={(fundFamily) => navigate(`/fund-families/${fundFamily.id}`)}
          emptyMessage="No fund families found matching your criteria."
          searchable={false} // We handle search externally
        />
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.pages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Menus */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItemComponent onClick={handleExport}>
          <ExportIcon sx={{ mr: 1 }} />
          Export Data
        </MenuItemComponent>
      </Menu>

      <Menu anchorEl={sortMenuAnchor} open={Boolean(sortMenuAnchor)} onClose={() => setSortMenuAnchor(null)}>
        <MenuItemComponent onClick={() => handleSort('name')}>
          Sort by Name {filters.sortBy === 'name' && `(${filters.sortOrder})`}
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleSort('totalAUM')}>
          Sort by AUM {filters.sortBy === 'totalAUM' && `(${filters.sortOrder})`}
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleSort('averageIRR')}>
          Sort by IRR {filters.sortBy === 'averageIRR' && `(${filters.sortOrder})`}
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleSort('createdAt')}>
          Sort by Date Created {filters.sortBy === 'createdAt' && `(${filters.sortOrder})`}
        </MenuItemComponent>
      </Menu>

      {/* Creation Dialog */}
      <FundFamilyCreation
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={(fundFamily) => {
          console.log('Fund family created:', fundFamily);
          handleRefresh();
        }}
      />
    </Box>
  );
};

export default EnhancedFundFamilyList;