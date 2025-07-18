import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  People,
  SwapHoriz,
  MonetizationOn,
  Assessment,
  Settings,
  MoreVert,
  Gavel,
  CreditCard
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';

interface FundFamilyTab {
  label: string;
  value: string;
  icon: React.ReactElement;
  path: string;
}

const fundFamilyTabs: FundFamilyTab[] = [
  { label: 'Summary', value: 'summary', icon: <AccountBalance />, path: 'summary' },
  { label: 'Capital Activity', value: 'capital-activity', icon: <TrendingUp />, path: 'capital-activity' },
  { label: 'Commitments', value: 'commitments', icon: <People />, path: 'commitments' },
  { label: 'Investor Transfers', value: 'investor-transfers', icon: <SwapHoriz />, path: 'investor-transfers' },
  { label: 'Closings', value: 'closing', icon: <Gavel />, path: 'closing' },
  { label: 'Credit Facility', value: 'credit-facility', icon: <CreditCard />, path: 'credit-facility' },
  { label: 'Fees', value: 'fees', icon: <MonetizationOn />, path: 'fees' },
  { label: 'Financial Reporting', value: 'financial-reporting', icon: <Assessment />, path: 'financial-reporting' },
  { label: 'Configuration', value: 'configuration', icon: <Settings />, path: 'configuration' }
];

const FundFamilyLayout: React.FC = () => {
  const { fundFamilyId } = useParams<{ fundFamilyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTab, setCurrentTab] = useState('summary');

  // Mock fund family data - replace with actual Redux state
  const fundFamily = {
    id: fundFamilyId,
    name: 'Tech Growth Fund III',
    vintage: '2023',
    status: 'Active',
    targetSize: 500000000,
    committedCapital: 375000000,
    deployedCapital: 125000000,
    fundType: 'Growth Equity',
    managementFee: 2.0,
    carryRate: 20.0
  };

  useEffect(() => {
    // Determine current tab based on URL
    const pathSegments = location.pathname.split('/');
    const fundFamilyIndex = pathSegments.findIndex(segment => segment === 'fund-family');
    if (fundFamilyIndex !== -1 && pathSegments[fundFamilyIndex + 2]) {
      const currentPath = pathSegments[fundFamilyIndex + 2];
      setCurrentTab(currentPath);
    }
  }, [location.pathname]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
    navigate(`/fund-family/${fundFamilyId}/${newValue}`);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const calculateProgress = (committed: number, target: number) => {
    return target > 0 ? (committed / target) * 100 : 0;
  };

  const generateBreadcrumbs = () => {
    return [
      <Link key="fund-families" color="inherit" href="/fund-family" onClick={(e) => {
        e.preventDefault();
        navigate('/fund-family');
      }}>
        Fund Families
      </Link>,
      <Typography key="current" color="text.primary">
        {fundFamily.name}
      </Typography>
    ];
  };

  return (
    <Box>
      {/* Fund Family Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
              {generateBreadcrumbs()}
            </Breadcrumbs>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h4" component="h1">
                {fundFamily.name}
              </Typography>
              <Chip
                label={fundFamily.status}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`Vintage ${fundFamily.vintage}`}
                variant="outlined"
              />
            </Box>
            <Typography variant="subtitle1" color="text.secondary">
              {fundFamily.fundType} • ID: {fundFamily.id}
            </Typography>
          </Box>
          
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Target Size
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(fundFamily.targetSize)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Committed Capital
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(fundFamily.committedCapital)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {calculateProgress(fundFamily.committedCapital, fundFamily.targetSize).toFixed(1)}% of target
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Deployed Capital
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(fundFamily.deployedCapital)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {calculateProgress(fundFamily.deployedCapital, fundFamily.committedCapital).toFixed(1)}% deployed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Management Fee
                </Typography>
                <Typography variant="h6">
                  {fundFamily.managementFee}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Carry: {fundFamily.carryRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="fund family navigation"
        >
          {fundFamilyTabs.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Content Area */}
      <Outlet />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/fund-family/${fundFamilyId}/configuration`);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Configure Fund</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Assessment fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Reports</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FundFamilyLayout;