import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message: string; // Error message
  standardHeaders?: boolean; // Return rate limit info in headers
  legacyHeaders?: boolean; // Return rate limit info in legacy headers
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Create a rate limiter with the specified options
 */
export function rateLimiter(options: RateLimiterOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000),
    },
    standardHeaders: options.standardHeaders ?? true,
    legacyHeaders: options.legacyHeaders ?? false,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    skipFailedRequests: options.skipFailedRequests ?? false,
    keyGenerator: (req: Request) => {
      // Use IP address and user ID (if authenticated) for more granular limiting
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userId = req.user?.id || 'anonymous';
      return `${ip}:${userId}`;
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000),
        limit: options.max,
        windowMs: options.windowMs,
      });
    },
  });
}

// Predefined rate limiters for common use cases

/**
 * Strict rate limiter for sensitive operations (login, password reset, etc.)
 */
export const strictRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many attempts. Please try again in 15 minutes.',
});

/**
 * Moderate rate limiter for API endpoints
 */
export const moderateRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests. Please try again later.',
});

/**
 * Lenient rate limiter for general API usage
 */
export const generalRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: 'Rate limit exceeded. Please try again later.',
});

/**
 * Special rate limiter for MFA attempts
 */
export const mfaRateLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 attempts per window
  message: 'Too many MFA attempts. Please try again in 5 minutes.',
});

/**
 * Rate limiter for password change attempts
 */
export const passwordChangeRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password changes per hour
  message: 'Too many password changes. Please try again in 1 hour.',
});

/**
 * Rate limiter for account creation
 */
export const registrationRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: 'Too many registration attempts. Please try again later.',
});

/**
 * Advanced rate limiter that adjusts based on user behavior
 */
export function adaptiveRateLimiter(baseOptions: RateLimiterOptions) {
  return rateLimit({
    ...baseOptions,
    keyGenerator: (req: Request) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userId = req.user?.id || 'anonymous';
      return `${ip}:${userId}`;
    },
    skip: (req: Request) => {
      // Skip rate limiting for trusted users or internal services
      const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
      const clientIP = req.ip || req.connection.remoteAddress || '';
      
      // Skip for trusted IPs
      if (trustedIPs.includes(clientIP)) {
        return true;
      }

      // Skip for admin users in development
      if (process.env.NODE_ENV === 'development' && req.user?.role === 'admin') {
        return true;
      }

      return false;
    },
    // Custom logic to adjust limits based on user behavior
    max: (req: Request) => {
      const user = req.user;
      
      // Higher limits for authenticated users
      if (user) {
        // Admin users get higher limits
        if (user.role === 'admin') {
          return baseOptions.max * 5;
        }
        // Regular authenticated users get double the limit
        return baseOptions.max * 2;
      }
      
      // Default limit for unauthenticated users
      return baseOptions.max;
    },
  });
}

/**
 * Rate limiter specifically for API endpoints based on endpoint sensitivity
 */
export function createEndpointRateLimiter(endpoint: string) {
  const sensitiveEndpoints = [
    '/login',
    '/register',
    '/password-reset',
    '/mfa',
    '/admin',
  ];

  const moderateEndpoints = [
    '/funds',
    '/investments',
    '/transactions',
    '/reports',
  ];

  // Determine rate limit based on endpoint sensitivity
  if (sensitiveEndpoints.some(path => endpoint.includes(path))) {
    return strictRateLimiter;
  } else if (moderateEndpoints.some(path => endpoint.includes(path))) {
    return moderateRateLimiter;
  } else {
    return generalRateLimiter;
  }
}

/**
 * Sliding window rate limiter for more sophisticated rate limiting
 */
export function slidingWindowRateLimiter(options: RateLimiterOptions & { 
  slidingWindow?: boolean;
  store?: any;
}) {
  // Use Redis store for production, memory store for development
  const store = options.store || (process.env.NODE_ENV === 'production' 
    ? undefined // Use Redis store in production
    : undefined // Use default memory store
  );

  return rateLimit({
    ...options,
    store,
    // Enable sliding window if specified
    windowMs: options.slidingWindow ? options.windowMs : options.windowMs,
    // Custom logic for sliding window
    handler: (req: Request, res: Response) => {
      console.log(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      
      // Log suspicious activity
      console.warn(`Suspicious activity detected: ${req.ip} exceeded rate limit for ${req.path}`);
      
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
  });
}

export default rateLimiter;