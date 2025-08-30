import React, { useState } from 'react';
import {
  Box,
  styled,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Header } from './Layout';
import { Sidebar } from './Sidebar';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setSidebarOpen } from '../../store/slices/uiSlice';

const SIDEBAR_WIDTH = 280;

const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const ContentContainer = styled(Box)<{ sidebarOpen: boolean; isMobile: boolean }>(
  ({ theme, sidebarOpen, isMobile }) => ({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    marginLeft: isMobile ? 0 : sidebarOpen ? SIDEBAR_WIDTH : 0,
    transition: theme.transitions.create(['margin-left'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  })
);

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  paddingTop: theme.spacing(8), // Account for fixed header
  minHeight: '100vh',
}));

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const dispatch = useAppDispatch();
  
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      dispatch(setSidebarOpen(!sidebarOpen));
    }
  };

  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <MainContainer>
      {/* Sidebar */}
      <Sidebar
        open={isMobile ? mobileSidebarOpen : sidebarOpen}
        onClose={handleMobileSidebarClose}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      {/* Main Content Area */}
      <ContentContainer sidebarOpen={sidebarOpen} isMobile={isMobile}>
        {/* Header */}
        <Header onMenuClick={handleSidebarToggle} />

        {/* Page Content */}
        <MainContent>
          {children}
        </MainContent>
      </ContentContainer>
    </MainContainer>
  );
};

export default DashboardLayout;