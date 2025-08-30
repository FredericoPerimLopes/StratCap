import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Card, DataTable, LoadingSpinner } from '../shared';
import { useGetFundsQuery } from '../../api/fundsApi';
import { Fund } from '../../types/fund';
import { formatCurrency } from '../../utils/formatters';

const columns = [
  {
    id: 'name',
    label: 'Fund Name',
    sortable: true,
    render: (value: string, row: Fund) => (
      <Box>
        <Typography variant="subtitle2">{value}</Typography>
        <Typography variant="caption" color="textSecondary">
          {row.strategy}
        </Typography>
      </Box>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    render: (value: string) => (
      <Chip
        label={value}
        size="small"
        color={'primary'}
      />
    ),
  },
  {
    id: 'targetSize',
    label: 'Target Size',
    render: (value: number) => formatCurrency(value),
  },
  {
    id: 'committedCapital',
    label: 'Committed Capital',
    render: (value: number) => formatCurrency(value),
  },
  {
    id: 'calledCapital',
    label: 'Called Capital',
    render: (value: number) => formatCurrency(value),
  },
  {
    id: 'vintage',
    label: 'Vintage',
    render: (value: number) => value?.toString(),
  },
];

export const FundList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { data: funds, isLoading, error } = useGetFundsQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Typography color="error">
        Error loading funds
      </Typography>
    );
  }

  const filteredFunds = funds?.filter(fund =>
    fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fund.strategy.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleRowClick = (fund: Fund) => {
    navigate(`/funds/${fund.id}`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Funds
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/funds/new')}
        >
          Create Fund
        </Button>
      </Box>

      <Card>
        <Box p={2} borderBottom={1} borderColor="divider">
          <TextField
            fullWidth
            placeholder="Search funds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
          />
        </Box>
        
        <DataTable
          data={filteredFunds}
          columns={columns}
          onRowClick={handleRowClick}
          emptyMessage="No funds found"
        />
      </Card>
    </Box>
  );
};

export default FundList;