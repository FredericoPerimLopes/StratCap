import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Avatar,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { FundFamily } from '../../../store/slices/fundFamilySlice';

interface FundFamilyCardProps {
  fundFamily: FundFamily;
  onEdit?: (fundFamily: FundFamily) => void;
  onDelete?: (id: number) => void;
  onFavorite?: (id: number, favorite: boolean) => void;
  isFavorite?: boolean;
  compact?: boolean;
}

const FundFamilyCard: React.FC<FundFamilyCardProps> = ({
  fundFamily,
  onEdit,
  onDelete,
  onFavorite,
  isFavorite = false,
  compact = false
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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

  const getPerformanceColor = (value: number) => {
    if (value > 15) return 'success.main';
    if (value > 8) return 'warning.main';
    return 'error.main';
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = () => {
    navigate(`/fund-families/${fundFamily.id}`);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    if (onEdit) {
      onEdit(fundFamily);
    } else {
      navigate(`/fund-families/${fundFamily.id}/edit`);
    }
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    if (onDelete && window.confirm('Are you sure you want to delete this fund family?')) {
      onDelete(fundFamily.id);
    }
  };

  const handleFavorite = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onFavorite) {
      onFavorite(fundFamily.id, !isFavorite);
    }
  };

  // Calculate deployment percentage (mock calculation)
  const deploymentPercentage = fundFamily.totalAUM 
    ? Math.min(((fundFamily.totalAUM * 0.7) / fundFamily.totalAUM) * 100, 100)
    : 0;

  if (compact) {
    return (
      <Card 
        sx={{ 
          cursor: 'pointer',
          height: '100%',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: (theme) => theme.shadows[8],
            transition: 'all 0.3s ease-in-out'
          }
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              sx={{
                backgroundColor: `${getStatusColor(fundFamily.status)}.light`,
                color: `${getStatusColor(fundFamily.status)}.main`,
                width: 32,
                height: 32,
                mr: 2
              }}
            >
              <BusinessIcon fontSize="small" />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight="600" noWrap>
                {fundFamily.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {fundFamily.code} • {fundFamily.managementCompany}
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              AUM
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {fundFamily.totalAUM ? formatCurrency(fundFamily.totalAUM) : '-'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip 
              label={fundFamily.status} 
              size="small" 
              color={getStatusColor(fundFamily.status)}
              variant="outlined"
            />
            {fundFamily.averageIRR !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="body2" 
                  fontWeight="600"
                  color={getPerformanceColor(fundFamily.averageIRR)}
                >
                  {fundFamily.averageIRR.toFixed(1)}%
                </Typography>
                {fundFamily.averageIRR > 12 ? (
                  <TrendingUpIcon fontSize="small" color="success" />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" />
                )}
              </Box>
            )}
          </Box>
        </CardContent>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => navigate(`/fund-families/${fundFamily.id}`)}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        height: '100%',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[12],
          transition: 'all 0.3s ease-in-out'
        }
      }}
      onClick={handleCardClick}
    >
      {/* Favorite Star */}
      <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
        <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
          <IconButton 
            size="small" 
            onClick={handleFavorite}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
            }}
          >
            {isFavorite ? (
              <StarIcon fontSize="small" color="warning" />
            ) : (
              <StarBorderIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status Badge */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <Chip 
          label={fundFamily.status.toUpperCase()} 
          size="small" 
          color={getStatusColor(fundFamily.status)}
          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
        />
      </Box>

      <CardContent sx={{ pt: 5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
          <Avatar
            sx={{
              backgroundColor: 'primary.light',
              color: 'primary.main',
              width: 48,
              height: 48,
              mr: 2
            }}
          >
            <BusinessIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
              {fundFamily.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {fundFamily.code}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {fundFamily.managementCompany}
            </Typography>
          </Box>
        </Box>

        {/* Key Metrics */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <AccountBalanceIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                Total AUM
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="600">
              {fundFamily.totalAUM ? formatCurrency(fundFamily.totalAUM) : '-'}
            </Typography>
          </Box>
          
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <BusinessIcon fontSize="small" color="secondary" sx={{ mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                Funds
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="600">
              {fundFamily.fundCount || 0}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <PeopleIcon fontSize="small" color="info" sx={{ mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                Investors
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="600">
              {fundFamily.investorCount?.toLocaleString() || 0}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                Avg IRR
              </Typography>
            </Box>
            <Typography 
              variant="h6" 
              fontWeight="600"
              color={fundFamily.averageIRR ? getPerformanceColor(fundFamily.averageIRR) : 'text.primary'}
            >
              {fundFamily.averageIRR ? `${fundFamily.averageIRR.toFixed(1)}%` : '-'}
            </Typography>
          </Box>
        </Box>

        {/* Capital Deployment Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Capital Deployment
            </Typography>
            <Typography variant="caption" fontWeight="600">
              {deploymentPercentage.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={deploymentPercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: deploymentPercentage > 70 ? 'success.main' : 
                               deploymentPercentage > 40 ? 'warning.main' : 'error.main'
              }
            }}
          />
        </Box>

        {/* Description */}
        {fundFamily.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {fundFamily.description}
          </Typography>
        )}

        {/* Tags */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          <Chip 
            label={fundFamily.primaryCurrency} 
            size="small" 
            variant="outlined" 
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
          <Chip 
            label={`FYE: ${fundFamily.fiscalYearEnd}`} 
            size="small" 
            variant="outlined" 
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
          {fundFamily.fundCount && fundFamily.fundCount > 5 && (
            <Chip 
              label="Multi-Fund" 
              size="small" 
              color="info"
              variant="outlined" 
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/fund-families/${fundFamily.id}`);
          }}
        >
          View Details
        </Button>
        
        <IconButton 
          size="small" 
          onClick={handleMenuClick}
          sx={{ ml: 'auto' }}
        >
          <MoreVertIcon />
        </IconButton>
      </CardActions>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Fund Family
        </MenuItem>
        <MenuItem onClick={() => navigate(`/fund-families/${fundFamily.id}/configuration`)}>
          <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
          Configuration
        </MenuItem>
        <MenuItem onClick={() => navigate(`/funds/new?fundFamilyId=${fundFamily.id}`)}>
          <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
          Add Fund
        </MenuItem>
        <MenuItem 
          onClick={handleDelete} 
          sx={{ color: 'error.main' }}
          disabled={fundFamily.fundCount && fundFamily.fundCount > 0}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default FundFamilyCard;