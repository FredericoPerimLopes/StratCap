import React from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  CircularProgress,
  styled,
} from '@mui/material';

const StyledButton = styled(MuiButton)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  borderRadius: theme.shape.borderRadius,
  minHeight: 40,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  '&.MuiButton-containedPrimary': {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    boxShadow: '0 2px 8px rgba(30, 58, 138, 0.25)',
    '&:hover': {
      background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
      boxShadow: '0 4px 12px rgba(30, 58, 138, 0.35)',
    },
  },
  '&.MuiButton-containedSecondary': {
    background: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
    '&:hover': {
      background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
    },
  },
}));

export interface ButtonProps extends Omit<MuiButtonProps, 'color'> {
  loading?: boolean;
  loadingText?: string;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  loadingText,
  disabled,
  color = 'primary',
  ...props
}) => {
  return (
    <StyledButton
      {...props}
      color={color}
      disabled={disabled || loading}
      startIcon={
        loading ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          props.startIcon
        )
      }
    >
      {loading && loadingText ? loadingText : children}
    </StyledButton>
  );
};

export default Button;