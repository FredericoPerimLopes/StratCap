import React, { ComponentType, ErrorInfo } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // Whether to isolate errors to this component only
}

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 */
function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const { fallback, onError, isolate = true } = options;

  const WrappedComponent = (props: P) => {
    const errorBoundaryProps = {
      fallback,
      onError: (error: Error, errorInfo: ErrorInfo) => {
        // Log component-specific error context
        console.error(`Error in ${Component.displayName || Component.name}:`, {
          component: Component.displayName || Component.name,
          props,
          error: error.message,
          stack: error.stack,
        });

        if (onError) {
          onError(error, errorInfo);
        }
      },
    };

    if (isolate) {
      return (
        <ErrorBoundary {...errorBoundaryProps}>
          <Component {...props} />
        </ErrorBoundary>
      );
    }

    return <Component {...props} />;
  };

  // Preserve component name for debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default withErrorBoundary;