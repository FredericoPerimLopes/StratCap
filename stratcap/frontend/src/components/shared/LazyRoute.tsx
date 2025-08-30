import React, { Suspense } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

export interface LazyRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({ 
  children, 
  fallback = <LoadingSpinner message="Loading page..." variant="skeleton" rows={5} />
}) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazyRoute;