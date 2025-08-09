import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';

import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';

export const Header: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  
  // Mock notifications count - replace with actual notification state
  const unreadNotifications = 3;

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await dispatch(logout() as any);
    navigate('/login');
  };

  const handleProfile = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  const drawerWidth = 280;
  const collapsedWidth = 72;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        width: `calc(100% - ${sidebarOpen ? drawerWidth : collapsedWidth}px)`,
        ml: `${sidebarOpen ? drawerWidth : collapsedWidth}px`,
        transition: 'width 0.3s ease-in-out, margin-left 0.3s ease-in-out',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
        {/* Page Title */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontSize: '1.125rem',
            }}
          >
            Fund Administration Platform
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.75rem',
            }}
          >
            Professional Portfolio Management
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <IconButton
            size="large"
            color="inherit"
            onClick={handleNotificationOpen}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.1),
              },
            }}
          >
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Profile */}
          <IconButton
            size="large"
            edge="end"
            onClick={handleProfileMenuOpen}
            sx={{
              ml: 1,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.1),
              },
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          onClick={handleProfileMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 220,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1.5,
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User Info */}
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {user?.role}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />

          <MenuItem onClick={handleProfile}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Your Profile</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Sign Out</ListItemText>
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 320,
              maxWidth: 400,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have {unreadNotifications} unread notifications
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ py: 1 }}>
            <MenuItem>
              <ListItemIcon>
                <AccountCircleIcon color="primary" />
              </ListItemIcon>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  New investor onboarded
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  2 minutes ago
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <NotificationsIcon color="info" />
              </ListItemIcon>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Monthly report ready
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  1 hour ago
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <SettingsIcon color="warning" />
              </ListItemIcon>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  System maintenance scheduled
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  3 hours ago
                </Typography>
              </Box>
            </MenuItem>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};