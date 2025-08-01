import { Request, Response, NextFunction } from 'express';
import { apiCache } from '../utils/cache';
import logger from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  vary?: string[]; // Headers to vary cache by (e.g., user-id, role)
  skipCache?: boolean; // Skip cache for this request
  skipCacheOnError?: boolean; // Skip cache if error occurs
  prefix?: string; // Custom key prefix
}

/**
 * Response caching middleware
 */
export const cacheResponse = (options: CacheOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if explicitly disabled
    if (options.skipCache || req.query.no_cache) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = await generateCacheKey(req, options);
      
      // Try to get cached response
      const cachedResponse = await apiCache.get(cacheKey);
      
      if (cachedResponse) {
        // Set cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        // Return cached response
        res.status((cachedResponse as any).status).json((cachedResponse as any).data);
        return;
      }

      // Store original methods
      const originalJson = res.json;
      const originalStatus = res.status;
      let responseStatus = 200;

      // Override status method to capture status code
      res.status = function(code: number) {
        responseStatus = code;
        return originalStatus.call(this, code);
      };

      // Override json method to cache response
      res.json = function(data: any) {
        // Only cache successful responses
        if (responseStatus >= 200 && responseStatus < 300) {
          const responseData = {
            status: responseStatus,
            data: data,
            timestamp: new Date().toISOString(),
          };

          // Cache the response (don't await to avoid blocking)
          apiCache.set(cacheKey, responseData, options.ttl)
            .catch(error => logger.error('Failed to cache response:', error));

          // Set cache headers
          res.set('X-Cache', 'MISS');
          res.set('X-Cache-Key', cacheKey);
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Generate cache key based on request
 */
async function generateCacheKey(req: Request, options: CacheOptions): Promise<string> {
  const baseKey = apiCache.generateKey(req.method, req.path, req.query);
  
  // Add vary headers to key
  if (options.vary) {
    const varyValues = options.vary.map(header => {
      const value = req.get(header) || req.body?.[header] || req.params?.[header];
      return `${header}:${value}`;
    }).join('|');
    
    if (varyValues) {
      return `${baseKey}:vary:${Buffer.from(varyValues).toString('base64')}`;
    }
  }

  // Add custom prefix
  if (options.prefix) {
    return `${options.prefix}:${baseKey}`;
  }

  return baseKey;
}

/**
 * Cache invalidation middleware
 */
export const invalidateCache = (patterns: string | string[]) => {
  return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json;

    res.json = function(data: any) {
      // Only invalidate cache on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
        
        // Invalidate cache patterns (don't await to avoid blocking)
        Promise.all(
          patternsArray.map(pattern => apiCache.deletePattern(pattern))
        ).catch(error => logger.error('Failed to invalidate cache:', error));
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Conditional caching based on user role
 */
export const cacheByRole = (roleConfig: Record<string, CacheOptions>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).user?.role || 'guest';
    const options = roleConfig[userRole] || roleConfig.default || {};
    
    cacheResponse(options)(req, res, next);
  };
};

/**
 * Specific cache configurations for different endpoints
 */

// Fund data caching (30 minutes)
export const cacheFundData = cacheResponse({
  ttl: parseInt(process.env.CACHE_TTL_FUND_DATA || '1800'),
  vary: ['user-id'],
  prefix: 'fund'
});

// Performance metrics caching (1 hour)
export const cachePerformanceMetrics = cacheResponse({
  ttl: parseInt(process.env.CACHE_TTL_PERFORMANCE_METRICS || '3600'),
  vary: ['user-id', 'role'],
  prefix: 'performance'
});

// User session caching (2 hours)
export const cacheUserSession = cacheResponse({
  ttl: parseInt(process.env.CACHE_TTL_USER_SESSION || '7200'),
  vary: ['user-id'],
  prefix: 'session'
});

// Dashboard data caching (15 minutes)
export const cacheDashboardData = cacheResponse({
  ttl: parseInt(process.env.CACHE_TTL_DASHBOARD || '900'),
  vary: ['user-id', 'role'],
  prefix: 'dashboard'
});

// Static reference data caching (24 hours)
export const cacheStaticData = cacheResponse({
  ttl: parseInt(process.env.CACHE_TTL_STATIC || '86400'),
  prefix: 'static'
});

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  static async warmFundCache(fundIds: number[]): Promise<void> {
    logger.info(`Warming cache for ${fundIds.length} funds`);
    
    // In a real implementation, you would make API calls to warm the cache
    // This would typically be done during off-peak hours
    
    for (const fundId of fundIds) {
      try {
        // Example: Pre-load fund performance data
        const key = `fund:performance:${fundId}`;
        const exists = await apiCache.exists(key);
        
        if (!exists) {
          // Here you would fetch the data and cache it
          logger.debug(`Warming cache for fund ${fundId}`);
        }
      } catch (error) {
        logger.error(`Failed to warm cache for fund ${fundId}:`, error);
      }
    }
  }

  static async warmDashboardCache(userIds: number[]): Promise<void> {
    logger.info(`Warming dashboard cache for ${userIds.length} users`);
    
    for (const userId of userIds) {
      try {
        const key = `dashboard:user:${userId}`;
        const exists = await apiCache.exists(key);
        
        if (!exists) {
          logger.debug(`Warming dashboard cache for user ${userId}`);
          // Pre-load dashboard data
        }
      } catch (error) {
        logger.error(`Failed to warm dashboard cache for user ${userId}:`, error);
      }
    }
  }
}

/**
 * Cache monitoring and cleanup
 */
export class CacheMonitor {
  static async getCacheHealth(): Promise<any> {
    return await apiCache.healthCheck();
  }

  static async getCacheStats(): Promise<any> {
    return await apiCache.getStats();
  }

  static async cleanupExpiredKeys(): Promise<void> {
    // This would typically be handled by Redis TTL
    // But we can implement additional cleanup logic here
    logger.info('Running cache cleanup...');
    
    try {
      // Clean up old cache patterns
      await apiCache.deletePattern('*:expired:*');
      logger.info('Cache cleanup completed');
    } catch (error) {
      logger.error('Cache cleanup failed:', error);
    }
  }
}

export default cacheResponse;