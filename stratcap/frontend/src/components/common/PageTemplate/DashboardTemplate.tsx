import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Skeleton,
} from '@mui/material';

export interface MetricCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  loading?: boolean;
}

export interface DashboardTemplateProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  metrics?: MetricCard[];
  children: React.ReactNode;
  loading?: boolean;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  title,
  subtitle,
  actions,
  metrics = [],
  children,
  loading = false,
}) => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h1" color="text.primary" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && (
            <Stack direction="row" spacing={2} sx={{ mt: { xs: 2, sm: 0 } }}>
              {actions}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Metrics Row */}
      {metrics.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(auto-fit, minmax(250px, 1fr))',
            },
            gap: 3,
            mb: 4,
          }}
        >
          {metrics.map((metric, index) => (
            <Card key={index} sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                {loading || metric.loading ? (
                  <>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" height={40} />
                    <Skeleton variant="text" width="30%" />
                  </>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      sx={{ fontWeight: 500, mb: 1 }}
                    >
                      {metric.title}
                    </Typography>
                    <Typography 
                      variant="h2" 
                      color="text.primary"
                      sx={{ mb: 1 }}
                    >
                      {metric.value}
                    </Typography>
                    {metric.change && (
                      <Typography
                        variant="body2"
                        color={
                          metric.change.trend === 'up'
                            ? 'success.main'
                            : metric.change.trend === 'down'
                            ? 'error.main'
                            : 'text.secondary'
                        }
                        sx={{ 
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {metric.change.trend === 'up' && '↗'}
                        {metric.change.trend === 'down' && '↘'}
                        {metric.change.trend === 'neutral' && '→'}
                        {metric.change.value > 0 ? '+' : ''}
                        {metric.change.value}%
                      </Typography>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Main Content */}
      <Box>{children}</Box>
    </Container>
  );
};

export default DashboardTemplate;