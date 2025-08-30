import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Skeleton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';

interface MetricData {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
    period: string;
  };
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  progress?: number;
  target?: string | number;
  benchmark?: string | number;
}

interface FundFamilySummaryProps {
  metrics: MetricData[];
  loading?: boolean;
}

const FundFamilySummary: React.FC<FundFamilySummaryProps> = ({ metrics, loading = false }) => {
  const getTrendIcon = (direction: 'up' | 'down' | 'flat') => {
    switch (direction) {
      case 'up':
        return <TrendingUpIcon fontSize="small" />;
      case 'down':
        return <TrendingDownIcon fontSize="small" />;
      default:
        return <TrendingFlatIcon fontSize="small" />;
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'flat') => {
    switch (direction) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const renderProgressBar = (progress: number, color: string) => (
    <LinearProgress
      variant="determinate"
      value={progress}
      sx={{
        height: 4,
        borderRadius: 2,
        backgroundColor: 'grey.200',
        '& .MuiLinearProgress-bar': {
          borderRadius: 2,
          backgroundColor: color
        }
      }}
    />
  );

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card sx={{ height: '100%', minHeight: 160 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Skeleton width="80%" height={20} />
                    <Skeleton width="60%" height={16} />
                  </Box>
                </Box>
                <Skeleton width="50%" height={32} sx={{ mb: 1 }} />
                <Skeleton width="100%" height={20} />
                <Skeleton width="70%" height={16} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {metrics.map((metric, index) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
          <Card 
            sx={{ 
              height: '100%',
              minHeight: 160,
              position: 'relative',
              overflow: 'visible',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => theme.shadows[8],
                transition: 'all 0.3s ease-in-out'
              }
            }}
          >
            {/* Accent Bar */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                backgroundColor: `${metric.color}.main`
              }}
            />

            <CardContent sx={{ pb: 2 }}>
              {/* Header with Icon and Title */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: `${metric.color}.light`,
                    color: `${metric.color}.main`
                  }}
                >
                  {metric.icon}
                </Box>
                <Box sx={{ ml: 2, flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {metric.title}
                  </Typography>
                  {metric.subtitle && (
                    <Typography 
                      variant="caption" 
                      color="text.disabled"
                      sx={{ fontSize: '0.7rem' }}
                    >
                      {metric.subtitle}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Main Value */}
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'text.primary',
                  mb: 1,
                  fontSize: '1.5rem'
                }}
              >
                {metric.value}
              </Typography>

              {/* Progress Bar */}
              {metric.progress !== undefined && (
                <Box sx={{ mb: 1.5 }}>
                  {renderProgressBar(metric.progress, `var(--mui-palette-${metric.color}-main)`)}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" color="text.disabled">
                      Progress
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {metric.progress}%
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Trend Indicator */}
              {metric.trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip
                    icon={getTrendIcon(metric.trend.direction)}
                    label={`${metric.trend.direction === 'down' ? '-' : '+'}${metric.trend.percentage}%`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      backgroundColor: 
                        metric.trend.direction === 'up' ? 'success.light' :
                        metric.trend.direction === 'down' ? 'error.light' : 'grey.200',
                      color:
                        metric.trend.direction === 'up' ? 'success.dark' :
                        metric.trend.direction === 'down' ? 'error.dark' : 'text.secondary',
                      '& .MuiChip-icon': {
                        fontSize: '0.9rem'
                      }
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ ml: 1, fontSize: '0.65rem' }}
                  >
                    {metric.trend.period}
                  </Typography>
                </Box>
              )}

              {/* Target and Benchmark */}
              {(metric.target || metric.benchmark) && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {metric.target && (
                    <Tooltip title="Target">
                      <Chip
                        label={`Target: ${metric.target}`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          height: 18, 
                          fontSize: '0.65rem',
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    </Tooltip>
                  )}
                  {metric.benchmark && (
                    <Tooltip title="Benchmark">
                      <Chip
                        label={`Bench: ${metric.benchmark}`}
                        size="small"
                        variant="outlined"
                        color="secondary"
                        sx={{ 
                          height: 18, 
                          fontSize: '0.65rem',
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default FundFamilySummary;