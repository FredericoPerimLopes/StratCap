import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps,
  IconButton,
  Typography,
  styled,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  paddingRight: theme.spacing(6),
  fontSize: '1.25rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledCloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  color: theme.palette.grey[500],
}));

export interface ModalProps extends Omit<DialogProps, 'title'> {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  actions?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  title,
  subtitle,
  children,
  onClose,
  actions,
  size = 'md',
  ...props
}) => {
  return (
    <StyledDialog
      {...props}
      onClose={onClose}
      maxWidth={size}
      fullWidth
    >
      {title && (
        <StyledDialogTitle>
          <Box>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <StyledCloseButton onClick={onClose}>
            <CloseIcon />
          </StyledCloseButton>
        </StyledDialogTitle>
      )}
      <DialogContent>
        {children}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          {actions}
        </DialogActions>
      )}
    </StyledDialog>
  );
};

export default Modal;