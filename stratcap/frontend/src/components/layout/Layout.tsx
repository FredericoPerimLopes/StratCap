import React, { ReactNode } from 'react';
import { Box, useTheme } from '@mui/material';
// import { useSelector } from 'react-redux';
// import { RootState } from '../../store/store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  // const { sidebarOpen } = useSelector((state: RootState) => state.ui);

  // const drawerWidth = 280;
  // const collapsedWidth = 72;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.grey[50] }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Header />
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'background.default',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};