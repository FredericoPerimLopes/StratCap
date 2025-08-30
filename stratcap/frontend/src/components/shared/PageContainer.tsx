import React from 'react';
import {
  Box,
  Container,
  Typography,
  styled,
  Fab,
  Zoom,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { ErrorBoundary } from './ErrorBoundary';

const PageHeader = styled(Box)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(3),
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.75rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}));

const PageSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

const PageActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const FloatingActionButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: 1050,
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  minHeight: 'calc(100vh - 200px)',
  paddingBottom: theme.spacing(4),
}));

export interface PageContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  showFab?: boolean;
  fabIcon?: React.ReactNode;
  onFabClick?: () => void;
  fabLabel?: string;
  loading?: boolean;
  error?: Error | null;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  children,
  breadcrumbs,
  actions,
  maxWidth = 'lg',
  fullWidth = false,
  showFab = false,
  fabIcon = <AddIcon />,
  onFabClick,
  fabLabel = 'Add',
  loading = false,
  error = null,
}) => {
  const hasHeader = title || subtitle || breadcrumbs || actions;

  return (
    <ErrorBoundary>
      {hasHeader && (
        <PageHeader>
          <Container maxWidth={maxWidth}>
            {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
            
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              flexWrap="wrap"
              gap={2}
            >
              <Box flex={1}>
                {title && <PageTitle>{title}</PageTitle>}
                {subtitle && <PageSubtitle>{subtitle}</PageSubtitle>}
              </Box>
              
              {actions && (
                <PageActions>
                  {actions}
                </PageActions>
              )}
            </Box>
          </Container>
        </PageHeader>
      )}

      <Container
        maxWidth={fullWidth ? false : maxWidth}
        sx={{
          px: fullWidth ? 0 : undefined,
        }}
      >
        <ContentContainer>
          {loading ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minHeight="400px"
            >
              <Typography>Loading...</Typography>
            </Box>
          ) : error ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minHeight="400px"
              flexDirection="column"
            >
              <Typography color="error" gutterBottom>
                Error: {error.message}
              </Typography>
            </Box>
          ) : (
            children
          )}
        </ContentContainer>
      </Container>

      {showFab && onFabClick && (
        <Zoom in={!loading}>
          <FloatingActionButton
            color="primary"
            aria-label={fabLabel}
            onClick={onFabClick}
          >
            {fabIcon}
          </FloatingActionButton>
        </Zoom>
      )}
    </ErrorBoundary>
  );
};

export default PageContainer;