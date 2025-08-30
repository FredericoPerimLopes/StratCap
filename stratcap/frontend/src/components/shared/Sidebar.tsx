import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Collapse,
  styled,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as FundIcon,
  People as InvestorsIcon,
  TrendingUp as CapitalIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Business as FundFamilyIcon,
  MonetizationOn as FeeIcon,
  CreditCard as CreditIcon,
  Public as GlobalIcon,
  Analytics as AnalyticsIcon,
  AccountBalanceWallet as LedgerIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { toggleSidebar } from '../../store/slices/uiSlice';

const SIDEBAR_WIDTH = 280;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: SIDEBAR_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: SIDEBAR_WIDTH,
    boxSizing: 'border-box',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    border: 'none',
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: 64,
  display: 'flex',
  alignItems: 'center',
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
}));

const StyledListItemButton = styled(ListItemButton)<{ active?: boolean }>(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0, 1),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  minHeight: 44,
  ...(active && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.contrastText,
    },
  }),
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : theme.palette.action.hover,
  },
}));

const SubMenuItem = styled(ListItemButton)<{ active?: boolean }>(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0, 1),
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(2),
  minHeight: 40,
  ...(active && {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
    '& .MuiListItemText-primary': {
      fontWeight: 600,
    },
  }),
}));

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
  },
  {
    id: 'fund-families',
    label: 'Fund Families',
    icon: <FundFamilyIcon />,
    children: [
      { id: 'fund-families-list', label: 'All Fund Families', icon: <></>, path: '/fund-families' },
      { id: 'fund-families-new', label: 'Create New', icon: <></>, path: '/fund-families/new' },
    ],
  },
  {
    id: 'funds',
    label: 'Funds',
    icon: <FundIcon />,
    children: [
      { id: 'funds-list', label: 'All Funds', icon: <></>, path: '/funds' },
      { id: 'funds-new', label: 'Create New', icon: <></>, path: '/funds/new' },
    ],
  },
  {
    id: 'investors',
    label: 'Investors',
    icon: <InvestorsIcon />,
    children: [
      { id: 'investors-list', label: 'All Investors', icon: <></>, path: '/investors' },
      { id: 'investors-new', label: 'Add New', icon: <></>, path: '/investors/new' },
    ],
  },
  {
    id: 'capital-activities',
    label: 'Capital Activities',
    icon: <CapitalIcon />,
    children: [
      { id: 'capital-activities-list', label: 'All Activities', icon: <></>, path: '/capital-activities' },
      { id: 'capital-activities-new', label: 'Create New', icon: <></>, path: '/capital-activities/new' },
    ],
  },
  {
    id: 'waterfall',
    label: 'Waterfall',
    icon: <TrendingUp />,
    path: '/waterfall',
  },
  {
    id: 'fee-management',
    label: 'Fee Management',
    icon: <FeeIcon />,
    path: '/fee-management',
  },
  {
    id: 'credit-facilities',
    label: 'Credit Facilities',
    icon: <CreditIcon />,
    path: '/credit-facilities',
  },
  {
    id: 'global-entities',
    label: 'Global Entities',
    icon: <GlobalIcon />,
    path: '/global-entities',
  },
  {
    id: 'data-analysis',
    label: 'Data Analysis',
    icon: <AnalyticsIcon />,
    path: '/data-analysis',
  },
  {
    id: 'general-ledger',
    label: 'General Ledger',
    icon: <LedgerIcon />,
    children: [
      { id: 'journal-entries', label: 'Journal Entries', icon: <></>, path: '/general-ledger/journal-entries' },
      { id: 'trial-balance', label: 'Trial Balance', icon: <></>, path: '/general-ledger/trial-balance' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <ReportsIcon />,
    children: [
      { id: 'reports-list', label: 'All Reports', icon: <></>, path: '/reports' },
      { id: 'reports-builder', label: 'Report Builder', icon: <></>, path: '/reports/builder' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    children: [
      { id: 'system-settings', label: 'System', icon: <></>, path: '/configuration/system' },
      { id: 'user-preferences', label: 'Preferences', icon: <></>, path: '/configuration/preferences' },
    ],
  },
];

export interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  variant?: 'permanent' | 'temporary';
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  open = true, 
  onClose,
  variant = 'permanent' 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      const isExpanded = expandedItems.includes(item.id);
      setExpandedItems(
        isExpanded
          ? expandedItems.filter(id => id !== item.id)
          : [...expandedItems, item.id]
      );
    } else if (item.path) {
      navigate(item.path);
      if (isMobile && onClose) {
        onClose();
      }
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  const isParentActive = (item: MenuItem): boolean => {
    if (item.path && isActive(item.path)) return true;
    if (item.children) {
      return item.children.some(child => child.path && isActive(child.path));
    }
    return false;
  };

  // Auto-expand active parent menus
  React.useEffect(() => {
    menuItems.forEach(item => {
      if (isParentActive(item) && item.children && !expandedItems.includes(item.id)) {
        setExpandedItems(prev => [...prev, item.id]);
      }
    });
  }, [location.pathname]);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SidebarHeader>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          StratCap
        </Typography>
      </SidebarHeader>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List sx={{ pt: 2 }}>
          {menuItems.map((item) => (
            <React.Fragment key={item.id}>
              <StyledListItem disablePadding>
                <StyledListItemButton
                  active={isParentActive(item)}
                  onClick={() => handleItemClick(item)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isParentActive(item) ? 600 : 400,
                    }}
                  />
                  {item.children && (
                    expandedItems.includes(item.id) ? <ExpandLess /> : <ExpandMore />
                  )}
                </StyledListItemButton>
              </StyledListItem>

              {item.children && (
                <Collapse
                  in={expandedItems.includes(item.id)}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <StyledListItem key={child.id} disablePadding>
                        <SubMenuItem
                          active={child.path ? isActive(child.path) : false}
                          onClick={() => handleItemClick(child)}
                        >
                          <ListItemText 
                            primary={child.label}
                            primaryTypographyProps={{
                              fontSize: '0.8125rem',
                            }}
                          />
                        </SubMenuItem>
                      </StyledListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <StyledDrawer variant={variant} open={open}>
      {drawerContent}
    </StyledDrawer>
  );
};

export default Sidebar;