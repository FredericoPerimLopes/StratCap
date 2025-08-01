/**
 * Comprehensive Error Handling Utilities for StratCap Frontend
 */

import { AxiosError } from 'axios';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  requestId?: string;
  path?: string;
  statusCode?: number;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export class ErrorHandler {
  private static errorQueue: AppError[] = [];
  private static maxQueueSize = 100;
  private static retryAttempts = new Map<string, number>();
  private static maxRetries = 3;

  /**
   * Transform different error types into standardized AppError
   */
  static transformError(error: any, context?: ErrorContext): AppError {
    const timestamp = Date.now();
    const baseError: Partial<AppError> = {
      timestamp,
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
    };

    // Axios HTTP errors
    if (error.isAxiosError || error.response) {
      const axiosError = error as AxiosError;
      const response = axiosError.response;
      
      return {
        ...baseError,
        code: this.getErrorCode(response?.status, response?.data),
        message: this.getErrorMessage(response?.data, axiosError.message),
        statusCode: response?.status,
        details: response?.data,
        requestId: response?.headers?.['x-request-id'],
        path: axiosError.config?.url,
      } as AppError;
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return {
        ...baseError,
        code: 'NETWORK_ERROR',
        message: 'Network connection error. Please check your internet connection.',
        details: { originalError: error.message },
      } as AppError;
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        ...baseError,
        code: 'TIMEOUT_ERROR',
        message: 'Request timed out. Please try again.',
        details: { timeout: error.timeout },
      } as AppError;
    }

    // Validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      return {
        ...baseError,
        code: 'VALIDATION_ERROR',
        message: 'Please check your input and try again.',
        details: error.details || error.errors,
      } as AppError;
    }

    // Authentication errors
    if (error.code === 'UNAUTHORIZED' || error.message?.includes('401')) {
      return {
        ...baseError,
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.',
        statusCode: 401,
      } as AppError;
    }

    // Permission errors
    if (error.code === 'FORBIDDEN' || error.message?.includes('403')) {
      return {
        ...baseError,
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
        statusCode: 403,
      } as AppError;
    }

    // JavaScript errors
    if (error instanceof Error) {
      return {
        ...baseError,
        code: error.name || 'JAVASCRIPT_ERROR',
        message: error.message,
        details: { stack: error.stack },
      } as AppError;
    }

    // String errors
    if (typeof error === 'string') {
      return {
        ...baseError,
        code: 'STRING_ERROR',
        message: error,
      } as AppError;
    }

    return baseError as AppError;
  }

  /**
   * Get error code from response status and data
   */
  private static getErrorCode(status?: number, data?: any): string {
    if (data?.code) return data.code;
    
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'RATE_LIMITED';
      case 500: return 'INTERNAL_SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'HTTP_ERROR';
    }
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(data?: any, fallback?: string): string {
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (data?.details) return data.details;
    
    return fallback || 'An unexpected error occurred';
  }

  /**
   * Handle error with context and return user-friendly message
   */
  static handleError(error: any, context?: ErrorContext): AppError {
    const appError = this.transformError(error, context);
    
    // Add to error queue for monitoring
    this.addToQueue(appError);
    
    // Log error for debugging
    this.logError(appError, context);
    
    return appError;
  }

  /**
   * Add error to queue for batch reporting
   */
  private static addToQueue(error: AppError): void {
    this.errorQueue.push(error);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * Log error for debugging
   */
  private static logError(error: AppError, context?: ErrorContext): void {
    const logData = {
      error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Error occurred:', logData);
    }

    // In production, you would send to monitoring service
    // Example: Sentry, DataDog, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // this.sendToMonitoringService(logData);
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'INTERNAL_SERVER_ERROR',
      'BAD_GATEWAY',
      'SERVICE_UNAVAILABLE',
      'GATEWAY_TIMEOUT',
    ];

    return retryableCodes.includes(error.code);
  }

  /**
   * Get retry count for a specific request
   */
  static getRetryCount(key: string): number {
    return this.retryAttempts.get(key) || 0;
  }

  /**
   * Increment retry count for a specific request
   */
  static incrementRetryCount(key: string): void {
    const current = this.getRetryCount(key);
    this.retryAttempts.set(key, current + 1);
  }

  /**
   * Clear retry count for a specific request
   */
  static clearRetryCount(key: string): void {
    this.retryAttempts.delete(key);
  }

  /**
   * Check if request should be retried
   */
  static shouldRetry(error: AppError, key: string): boolean {
    if (!this.isRetryable(error)) return false;
    return this.getRetryCount(key) < this.maxRetries;
  }

  /**
   * Get user-friendly error message for display
   */
  static getUserMessage(error: AppError): string {
    const userMessages: Record<string, string> = {
      NETWORK_ERROR: 'Connection problem. Please check your internet and try again.',
      TIMEOUT_ERROR: 'Request timed out. Please try again.',
      UNAUTHORIZED: 'Your session has expired. Please log in again.',
      FORBIDDEN: 'You do not have permission to perform this action.',
      NOT_FOUND: 'The requested resource was not found.',
      VALIDATION_ERROR: 'Please check your input and try again.',
      RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
      INTERNAL_SERVER_ERROR: 'Server error. Please try again later.',
      SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
    };

    return userMessages[error.code] || error.message || 'An unexpected error occurred';
  }

  /**
   * Get error severity level
   */
  static getSeverity(error: AppError): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverity = ['INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE'];
    const mediumSeverity = ['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND'];
    const lowSeverity = ['VALIDATION_ERROR', 'BAD_REQUEST'];

    if (highSeverity.includes(error.code)) return 'high';
    if (mediumSeverity.includes(error.code)) return 'medium';
    if (lowSeverity.includes(error.code)) return 'low';
    
    return error.statusCode >= 500 ? 'critical' : 'medium';
  }

  /**
   * Get current error queue (for monitoring)
   */
  static getErrorQueue(): AppError[] {
    return [...this.errorQueue];
  }

  /**
   * Clear error queue
   */
  static clearErrorQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byCode: Record<string, number>;
    recentErrors: AppError[];
  } {
    const total = this.errorQueue.length;
    const bySeverity: Record<string, number> = {};
    const byCode: Record<string, number> = {};
    
    this.errorQueue.forEach(error => {
      const severity = this.getSeverity(error);
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
      byCode[error.code] = (byCode[error.code] || 0) + 1;
    });

    const recentErrors = this.errorQueue
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return { total, bySeverity, byCode, recentErrors };
  }
}

/**
 * React Hook for error handling
 */
export const useErrorHandler = () => {
  const handleError = (error: any, context?: ErrorContext) => {
    return ErrorHandler.handleError(error, context);
  };

  const getUserMessage = (error: AppError) => {
    return ErrorHandler.getUserMessage(error);
  };

  const isRetryable = (error: AppError) => {
    return ErrorHandler.isRetryable(error);
  };

  return {
    handleError,
    getUserMessage,
    isRetryable,
    transformError: ErrorHandler.transformError,
    getSeverity: ErrorHandler.getSeverity,
  };
};

/**
 * Retry utility function
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = ErrorHandler.transformError(error);
      
      if (attempt === maxRetries || !ErrorHandler.isRetryable(appError)) {
        throw error;
      }
      
      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError;
};

export default ErrorHandler;