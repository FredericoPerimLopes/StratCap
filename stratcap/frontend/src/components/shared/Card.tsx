import React from 'react';
import {
  Card as MuiCard,
  CardProps as MuiCardProps,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  styled,
  alpha,
} from '@mui/material';

const StyledCard = styled(MuiCard)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    transform: 'translateY(-1px)',
  },
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  '& .MuiCardHeader-title': {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  '& .MuiCardHeader-subheader': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  '&:last-child': {
    paddingBottom: theme.spacing(2),
  },
}));

export interface CardProps extends MuiCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  variant?: 'elevation' | 'outlined' | 'glass';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  actions,
  loading = false,
  variant = 'elevation',
  sx,
  ...props
}) => {
  const cardSx = {
    ...sx,
    ...(variant === 'glass' && {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    }),
    ...(loading && {
      opacity: 0.7,
      pointerEvents: 'none',
    }),
  };

  return (
    <StyledCard {...props} sx={cardSx} variant={variant === 'glass' ? undefined : variant}>
      {(title || subtitle || action) && (
        <StyledCardHeader
          title={title}
          subheader={subtitle}
          action={action}
        />
      )}
      {children && (
        <StyledCardContent>
          {children}
        </StyledCardContent>
      )}
      {actions && (
        <CardActions>
          {actions}
        </CardActions>
      )}
    </StyledCard>
  );
};

export default Card;