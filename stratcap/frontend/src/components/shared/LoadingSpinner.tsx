import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';
import { styled } from '@mui/material/styles';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  backdrop?: boolean;
}

const LoadingContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'fullScreen',
})<{ fullScreen?: boolean }>(({ theme, fullScreen }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  ...(fullScreen && {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: theme.zIndex.modal,
  }),
}));

const sizeMap = {
  small: 24,
  medium: 40,
  large: 60,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'medium',
  fullScreen = false,
  backdrop = false,
}) => {
  const spinnerSize = sizeMap[size];

  if (backdrop) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={true}
      >
        <LoadingContainer>
          <CircularProgress color="primary" size={spinnerSize} />
          {message && (
            <Typography variant="body1" sx={{ color: 'white' }}>
              {message}
            </Typography>
          )}
        </LoadingContainer>
      </Backdrop>
    );
  }

  return (
    <LoadingContainer fullScreen={fullScreen}>
      <CircularProgress color="primary" size={spinnerSize} />
      {message && (
        <Typography variant="body1" color="textSecondary">
          {message}
        </Typography>
      )}
    </LoadingContainer>
  );
};

export default LoadingSpinner;