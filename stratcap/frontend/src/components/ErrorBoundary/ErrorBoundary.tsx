import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // You could send this to an error reporting service
    // errorReportingService.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <BugIcon
                sx={{
                  fontSize: 64,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              
              <Typography variant="h5" gutterBottom color="error">
                Something went wrong
              </Typography>
              
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                We're sorry, but something unexpected happened. The error has been logged 
                and our team has been notified.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
              </Box>

              {/* Error Details */}
              <Alert 
                severity="error" 
                sx={{ textAlign: 'left', mt: 2 }}
                action={
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={this.toggleDetails}
                  >
                    {this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                }
              >
                <AlertTitle>Error Details</AlertTitle>
                
                <Collapse in={this.state.showDetails}>
                  <Box sx={{ mt: 2 }}>
                    {this.state.error && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Error Message:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            p: 1,
                            borderRadius: 1,
                            wordBreak: 'break-word',
                          }}
                        >
                          {this.state.error.message}
                        </Typography>
                      </Box>
                    )}

                    {this.state.error?.stack && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Stack Trace:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            p: 1,
                            borderRadius: 1,
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.75rem',
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          {this.state.error.stack}
                        </Typography>
                      </Box>
                    )}

                    {this.state.errorInfo?.componentStack && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Component Stack:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            p: 1,
                            borderRadius: 1,
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.75rem',
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          {this.state.errorInfo.componentStack}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Alert>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;