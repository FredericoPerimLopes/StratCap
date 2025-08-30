import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  styled,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const ErrorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  padding: theme.spacing(3),
}));

const ErrorCard = styled(Card)(({ theme }) => ({
  maxWidth: 500,
  textAlign: 'center',
}));

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer>
          <ErrorCard>
            <CardContent>
              <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We encountered an unexpected error. Please try refreshing the page.
              </Typography>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
                  <AlertTitle>Error Details</AlertTitle>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error.message}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Alert>
              )}
              
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                sx={{ mt: 3 }}
              >
                Try Again
              </Button>
            </CardContent>
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with ErrorBoundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;