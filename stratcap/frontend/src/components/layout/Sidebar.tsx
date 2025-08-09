import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  Avatar,
  Divider,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as FundsIcon,
  People as InvestorsIcon,
  SwapHoriz as CapitalActivitiesIcon,
  AttachMoney as FeeManagementIcon,
  Calculate as WaterfallIcon,
  CreditCard as CreditFacilitiesIcon,
  Language as GlobalEntitiesIcon,
  Analytics as DataAnalysisIcon,
  MenuBook as GeneralLedgerIcon,
  Description as DocumentsIcon,
  Assessment as ReportsIcon,
  Settings as ConfigIcon,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  BusinessCenter as FundFamiliesIcon,
  AccountBalanceWallet as FundConfigIcon,
  AdminPanelSettings as SystemSettingsIcon,
  Person as UserPreferencesIcon
} from '@mui/icons-material';

import { RootState } from '../../store/store';
import { toggleSidebar } from '../../store/slices/uiSlice';

const drawerWidth = 280;
const collapsedWidth = 72;

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ComponentType<any>;
  children?: { name: string; href: string; icon?: React.ComponentType<any> }[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: DashboardIcon },
  { 
    name: 'Fund Management', 
    icon: FundsIcon,
    children: [
      { name: 'Funds', href: '/funds', icon: FundsIcon },
      { name: 'Fund Families', href: '/fund-families', icon: FundFamiliesIcon },
    ]
  },
  { name: 'Investors', href: '/investors', icon: InvestorsIcon },
  { name: 'Capital Activities', href: '/capital-activities', icon: CapitalActivitiesIcon },
  { name: 'Fee Management', href: '/fee-management', icon: FeeManagementIcon },
  { name: 'Waterfall', href: '/waterfall', icon: WaterfallIcon },
  { name: 'Credit Facilities', href: '/credit-facilities', icon: CreditFacilitiesIcon },
  { name: 'Global Entities', href: '/global-entities', icon: GlobalEntitiesIcon },
  { name: 'Data Analysis', href: '/data-analysis', icon: DataAnalysisIcon },
  { name: 'General Ledger', href: '/general-ledger/journal-entries', icon: GeneralLedgerIcon },
  { name: 'Documents', href: '/documents', icon: DocumentsIcon },
  { name: 'Reports', href: '/reports', icon: ReportsIcon },
  { 
    name: 'Configuration', 
    icon: ConfigIcon,
    children: [
      { name: 'Fund Configuration', href: '/fund-configuration', icon: FundConfigIcon },
      { name: 'System Settings', href: '/configuration/system', icon: SystemSettingsIcon },
      { name: 'User Preferences', href: '/configuration/preferences', icon: UserPreferencesIcon },
    ]
  },
];

export const Sidebar: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['Fund Management']));

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleExpandToggle = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href || (href !== '/' && location.pathname.startsWith(href));
  };

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = item.href ? isActiveRoute(item.href) : false;
    const isExpanded = expandedItems.has(item.name);
    const hasChildren = item.children && item.children.length > 0;

    if (item.href) {
      // Regular navigation item
      return (
        <ListItem key={item.name} disablePadding>
          <Tooltip title={!sidebarOpen ? item.name : ''} placement="right">
            <ListItemButton
              onClick={() => handleNavigation(item.href!)}
              sx={{
                minHeight: 48,
                justifyContent: sidebarOpen ? 'initial' : 'center',
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: isActive 
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.action.hover, 0.1),
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarOpen ? 3 : 'auto',
                  justifyContent: 'center',
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                <item.icon />
              </ListItemIcon>
              {sidebarOpen && (
                <ListItemText 
                  primary={item.name}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      );
    }

    // Parent item with children
    return (
      <Box key={item.name}>
        <ListItem disablePadding>
          <Tooltip title={!sidebarOpen ? item.name : ''} placement="right">
            <ListItemButton
              onClick={() => sidebarOpen && handleExpandToggle(item.name)}
              sx={{
                minHeight: 48,
                justifyContent: sidebarOpen ? 'initial' : 'center',
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarOpen ? 3 : 'auto',
                  justifyContent: 'center',
                  color: theme.palette.text.secondary,
                }}
              >
                <item.icon />
              </ListItemIcon>
              {sidebarOpen && (
                <>
                  <ListItemText 
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  />
                  {hasChildren && (
                    isExpanded ? <ExpandLess /> : <ExpandMore />
                  )}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        
        {/* Children */}
        {sidebarOpen && hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => {
                const isChildActive = isActiveRoute(child.href);
                return (
                  <ListItem key={child.name} disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigation(child.href)}
                      sx={{
                        pl: 6,
                        pr: 2.5,
                        py: 1,
                        borderRadius: 2,
                        mx: 1,
                        mb: 0.5,
                        backgroundColor: isChildActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                        color: isChildActive ? theme.palette.primary.main : theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: isChildActive 
                            ? alpha(theme.palette.primary.main, 0.12)
                            : alpha(theme.palette.action.hover, 0.08),
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      {child.icon && (
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: 2,
                            color: isChildActive ? theme.palette.primary.main : theme.palette.text.disabled,
                          }}
                        >
                          <child.icon fontSize="small" />
                        </ListItemIcon>
                      )}
                      <ListItemText 
                        primary={child.name}
                        primaryTypographyProps={{
                          fontSize: '0.8125rem',
                          fontWeight: isChildActive ? 600 : 400,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarOpen ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarOpen ? drawerWidth : collapsedWidth,
          boxSizing: 'border-box',
          transition: 'width 0.3s ease-in-out',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: 64,
        }}
      >
        {sidebarOpen && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            StratCap
          </Typography>
        )}
        <IconButton
          onClick={handleToggleSidebar}
          size="small"
          sx={{
            ml: sidebarOpen ? 0 : 'auto',
            mr: sidebarOpen ? 0 : 'auto',
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, py: 1 }}>
        <List sx={{ px: 0 }}>
          {navigation.map(renderNavigationItem)}
        </List>
      </Box>

      {/* User Info */}
      {user && (
        <>
          <Divider />
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40,
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </Avatar>
            {sidebarOpen && (
              <Box sx={{ ml: 2, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    lineHeight: 1.2,
                  }}
                >
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    textTransform: 'capitalize',
                    lineHeight: 1.2,
                  }}
                >
                  {user.role}
                </Typography>
              </Box>
            )}
          </Box>
        </>
      )}
    </Drawer>
  );
};