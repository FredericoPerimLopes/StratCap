import { Typography, Box, Paper } from '@mui/material';
import { Card } from '../shared';
import { useGetFundsQuery } from '../../api/fundsApi';
import { LoadingSpinner } from '../shared';

export const Dashboard = () => {
  const { data: funds, isLoading, error } = useGetFundsQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Typography color="error">
        Error loading dashboard data
      </Typography>
    );
  }

  const totalFunds = funds?.length || 0;
  const totalCapitalRaised = funds?.reduce((sum, fund) => sum + fund.committedCapital, 0) || 0;
  const averageIRR = 0; // TODO: Implement performance metrics

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Box display="flex" gap={3} mb={3} flexWrap="wrap">
        <Box flex={1} minWidth={200}>
          <Card title="Total Funds">
            <Typography variant="h2" color="primary">
              {totalFunds}
            </Typography>
          </Card>
        </Box>

        <Box flex={1} minWidth={200}>
          <Card title="Total Capital Raised">
            <Typography variant="h2" color="primary">
              ${(totalCapitalRaised / 1000000).toFixed(1)}M
            </Typography>
          </Card>
        </Box>

        <Box flex={1} minWidth={200}>
          <Card title="Average IRR">
            <Typography variant="h2" color="primary">
              {(averageIRR * 100).toFixed(1)}%
            </Typography>
          </Card>
        </Box>
      </Box>

      <Card title="Recent Funds">
        {funds?.slice(0, 5).map((fund) => (
          <Paper key={fund.id} sx={{ p: 2, mb: 1, backgroundColor: '#f9f9f9' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">{fund.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {fund.strategy} • {fund.status}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="body1">
                  ${(fund.committedCapital / 1000000).toFixed(1)}M
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Committed Capital
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Card>
    </Box>
  );
};

export default Dashboard;