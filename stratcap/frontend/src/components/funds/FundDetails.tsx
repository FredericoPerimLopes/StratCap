import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useState } from 'react';
import { Card, LoadingSpinner } from '../shared';
import { useGetFundQuery } from '../../api/fundsApi';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <Box role="tabpanel" hidden={value !== index}>
      {value === index && <Box pt={3}>{children}</Box>}
    </Box>
  );
};

export const FundDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const { data: fund, isLoading, error } = useGetFundQuery(id!);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !fund) {
    return (
      <Typography color="error">
        Error loading fund details
      </Typography>
    );
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/funds')}
          sx={{ mr: 2 }}
        >
          Back to Funds
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {fund.name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/funds/${id}/edit`)}
        >
          Edit Fund
        </Button>
      </Box>

      <Box display="flex" gap={3} mb={3} flexWrap="wrap">
        <Box flex={1} minWidth={200}>
          <Card title="Status">
            <Chip label={fund.status} color={'primary'} />
          </Card>
        </Box>
        <Box flex={1} minWidth={200}>
          <Card title="Target Size">
            <Typography variant="h6">
              {formatCurrency(fund.targetSize)}
            </Typography>
          </Card>
        </Box>
        <Box flex={1} minWidth={200}>
          <Card title="Committed Capital">
            <Typography variant="h6">
              {formatCurrency(fund.committedCapital)}
            </Typography>
          </Card>
        </Box>
        <Box flex={1} minWidth={200}>
          <Card title="Called Capital">
            <Typography variant="h6">
              {formatCurrency(fund.calledCapital)}
            </Typography>
          </Card>
        </Box>
      </Box>

      <Card>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Investors" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box flex={1} minWidth={300}>
              <Box mb={2}>
                <Typography variant="h6" gutterBottom>
                  Fund Information
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  <strong>Strategy:</strong> {fund.strategy}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  <strong>Vintage:</strong> {fund.vintage}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  <strong>Inception Date:</strong> {new Date(fund.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  <strong>Management Fee:</strong> {formatPercentage(fund.managementFee)}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  <strong>Carried Interest:</strong> {formatPercentage(fund.carriedInterest)}
                </Typography>
              </Box>
            </Box>
            <Box flex={1} minWidth={300}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {fund.description || 'No description provided.'}
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box flex={1} minWidth={200}>
              <Card title="IRR">
                <Typography variant="h4" color="primary">
                  N/A
                </Typography>
              </Card>
            </Box>
            <Box flex={1} minWidth={200}>
              <Card title="Multiple">
                <Typography variant="h4" color="primary">
                  N/A
                </Typography>
              </Card>
            </Box>
            <Box flex={1} minWidth={200}>
              <Card title="DPI">
                <Typography variant="h4" color="primary">
                  N/A
                </Typography>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Investors
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Investor information would be displayed here.
          </Typography>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default FundDetails;