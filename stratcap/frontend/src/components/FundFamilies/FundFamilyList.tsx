import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Chip,
  Typography,
  Card,
  Button,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';

import { AppDispatch, RootState } from '../../store';
import { fetchFundFamilies, deleteFundFamily, FundFamily } from '../../store/slices/fundFamilySlice';
import { ListTemplate, TableColumn, ActionButton } from '../common/PageTemplate/ListTemplate';
import { DashboardTemplate } from '../common/PageTemplate/DashboardTemplate';


const FundFamilyList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { fundFamilies, isLoading, error } = useSelector((state: RootState) => state.fundFamily);

  useEffect(() => {
    dispatch(fetchFundFamilies());
  }, [dispatch]);

  // Calculate metrics
  const metrics = [
    {
      title: 'Total AUM',
      value: '$1.25B',
      trend: { direction: 'up', percentage: 12.5 },
      icon: <AccountBalanceIcon />,
      color: 'primary'
    },
    {
      title: 'Total Funds',
      value: '28',
      subtitle: 'Across all families',
      icon: <BusinessIcon />,
      color: 'secondary'
    },
    {
      title: 'Active Investors',
      value: '1,247',
      subtitle: 'LP relationships',
      icon: <PeopleIcon />,
      color: 'info'
    },
    {
      title: 'Avg Performance',
      value: '14.2%',
      subtitle: 'Weighted IRR',
      trend: { direction: 'up', percentage: 2.3 },
      icon: <TrendingUpIcon />,
      color: 'success'
    }
  ];

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

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteFundFamily(id)).unwrap();
    } catch (error) {
      console.error('Failed to delete fund family:', error);
    }
  };

  const handleView = (fundFamily: FundFamily) => {
    navigate(`/fund-families/${fundFamily.id}`);
  };

  const handleEdit = (fundFamily: FundFamily) => {
    navigate(`/fund-families/${fundFamily.id}/edit`);
  };

  const handleCreate = () => {
    navigate('/fund-families/new');
  };

  // Table columns configuration
  const columns: TableColumn[] = [
    {
      id: 'name',
      label: 'Fund Family',
      sortable: true,
      format: (value: any) => (
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {value}
          </Typography>
        </Box>
      )
    },
    {
      id: 'managementCompany',
      label: 'Management Company',
      sortable: true,
      format: (value) => (
        <Typography variant="body2" color="text.primary">
          {value || '-'}
        </Typography>
      )
    },
    {
      id: 'totalAUM',
      label: 'Total AUM',
      align: 'right',
      sortable: true,
      format: (value) => (
        <Typography variant="body2" fontWeight={600} color="text.primary">
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
      format: (value) => (
        <Typography variant="body2" color="text.primary">
          {value?.toLocaleString() || 0}
        </Typography>
      )
    },
    {
      id: 'averageIRR',
      label: 'Avg IRR',
      align: 'right',
      sortable: true,
      format: (value) => (
        <Typography 
          variant="body2" 
          fontWeight={600}
          color={value && value > 0 ? 'success.main' : 'text.primary'}
        >
          {value ? `${value.toFixed(1)}%` : '-'}
        </Typography>
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

  // Action buttons for the page header
  const actions: ActionButton[] = [
    {
      label: 'New Fund Family',
      onClick: handleCreate,
      variant: 'contained',
      startIcon: <AddIcon />,
      color: 'primary'
    }
  ];

  // Row actions
  const renderRowActions = (row: FundFamily) => (
    <Stack direction="row" spacing={1}>
      <IconButton
        size="small"
        onClick={() => handleView(row)}
        sx={{ color: 'primary.main' }}
      >
        <ViewIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleEdit(row)}
        sx={{ color: 'info.main' }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleDelete(row.id)}
        sx={{ color: 'error.main' }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Stack>
  );

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
    <DashboardTemplate
      title="Fund Family Management"
      subtitle="Manage and monitor your fund family portfolio"
      metrics={metrics}
      actions={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          size="large"
        >
          New Fund Family
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Performance Charts */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Portfolio Performance Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fund family distribution and performance trends will be displayed here.
          </Typography>
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', borderRadius: 1, mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Charts Component Placeholder
            </Typography>
          </Box>
        </Card>

        {/* Fund Families Table */}
        <Box>
          <ListTemplate
            title="Fund Families"
            subtitle={`${fundFamilies.length} fund families in your portfolio`}
            data={fundFamilies}
            columns={columns}
            actions={actions}
            loading={isLoading}
            emptyMessage="No fund families found. Create your first fund family to get started."
            onRowClick={handleView}
            renderRowActions={renderRowActions}
            searchable
            filterable
          />
        </Box>
      </Box>
    </DashboardTemplate>
  );
};

export default FundFamilyList;