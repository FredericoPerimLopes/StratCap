import { ReactNode, useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box display="flex" height="100vh">
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        isMobile={isMobile}
      />
      
      <Box flexGrow={1} display="flex" flexDirection="column">
        <Header onMenuClick={handleSidebarToggle} />
        
        <Box
          component="main"
          flexGrow={1}
          p={3}
          sx={{
            backgroundColor: '#f5f5f5',
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;