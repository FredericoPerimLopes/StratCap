import React from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  CircularProgress,
  styled,
} from '@mui/material';

const StyledButton = styled(MuiButton)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1, 3),
  fontSize: '0.875rem',
  fontWeight: 500,
  minHeight: 40,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: theme.shadows[2],
  },
  '&.Mui-disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}));

export interface ButtonProps extends Omit<MuiButtonProps, 'loading'> {
  loading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  loading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  startIcon,
  ...props
}) => {
  return (
    <StyledButton
      {...props}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} /> : startIcon}
    >
      {loading ? loadingText : children}
    </StyledButton>
  );
};

export default Button;