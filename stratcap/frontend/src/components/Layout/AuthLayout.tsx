import React, { ReactNode } from 'react';
import { Box, Container } from '@mui/material';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'grey.50',
      }}
    >
      <Container maxWidth="sm">
        {children}
      </Container>
    </Box>
  );
};

export default AuthLayout;