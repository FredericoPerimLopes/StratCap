/**
 * Performance monitoring and optimization utilities
 */

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactiveTime: number;
  memoryUsage: number;
  resourceCount: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: number;
}

export interface WebVitalsMetrics {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
}

export interface ResourceTiming {
  name: string;
  duration: number;
  startTime: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  compressionRatio: number;
}

/**
 * Performance Monitor class for tracking and analyzing performance metrics
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private thresholds = {
    loadTime: 3000, // 3 seconds
    renderTime: 100, // 100ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
    errorRate: 0.05 // 5%
  };

  private constructor() {
    this.initializeObservers();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Long Task Observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleLongTask(entry as PerformanceEntry);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (e) {
      console.warn('Long Task observer not supported');
    }

    // Layout Shift Observer
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleLayoutShift(entry as any);
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', layoutShiftObserver);
    } catch (e) {
      console.warn('Layout Shift observer not supported');
    }

    // Resource Observer
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleResourceTiming(entry as PerformanceResourceTiming);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (e) {
      console.warn('Resource observer not supported');
    }

    // Navigation Observer
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleNavigation(entry as PerformanceNavigationTiming);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);
    } catch (e) {
      console.warn('Navigation observer not supported');
    }
  }

  private handleLongTask(entry: PerformanceEntry): void {
    console.warn('Long task detected:', {
      duration: entry.duration,
      startTime: entry.startTime,
      name: entry.name
    });

    // Report to analytics if duration > 50ms
    if (entry.duration > 50) {
      this.reportPerformanceIssue('long-task', {
        duration: entry.duration,
        startTime: entry.startTime
      });
    }
  }

  private handleLayoutShift(entry: any): void {
    if (entry.hadRecentInput) return; // Ignore shifts caused by user input

    console.warn('Layout shift detected:', {
      value: entry.value,
      sources: entry.sources
    });

    if (entry.value > 0.1) { // Significant layout shift
      this.reportPerformanceIssue('layout-shift', {
        value: entry.value,
        sources: entry.sources?.map((s: any) => ({
          node: s.node?.tagName,
          previousRect: s.previousRect,
          currentRect: s.currentRect
        }))
      });
    }
  }

  private handleResourceTiming(entry: PerformanceResourceTiming): void {
    const timing: ResourceTiming = {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      compressionRatio: entry.decodedBodySize > 0 
        ? entry.encodedBodySize / entry.decodedBodySize 
        : 1
    };

    // Check for slow resources (>1s)
    if (timing.duration > 1000) {
      this.reportPerformanceIssue('slow-resource', timing);
    }

    // Check for uncompressed resources
    if (timing.compressionRatio > 0.9 && timing.decodedBodySize > 10000) {
      console.warn('Potentially uncompressed resource:', timing.name);
    }
  }

  private handleNavigation(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart > 0 
        ? entry.connectEnd - entry.secureConnectionStart 
        : 0,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domParse: entry.domContentLoadedEventStart - entry.responseEnd,
      domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      total: entry.loadEventEnd - entry.navigationStart
    };

    // Report slow navigation
    if (metrics.total > this.thresholds.loadTime) {
      this.reportPerformanceIssue('slow-navigation', metrics);
    }
  }

  public measureRenderPerformance<T>(
    componentName: string,
    renderFunction: () => T
  ): T {
    const startTime = performance.now();
    
    try {
      const result = renderFunction();
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > this.thresholds.renderTime) {
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
        this.reportPerformanceIssue('slow-render', {
          component: componentName,
          renderTime
        });
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      this.reportPerformanceIssue('render-error', {
        component: componentName,
        renderTime,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }

  public measureAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    return operation()
      .then(result => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordAsyncOperation(operationName, duration, true);
        return result;
      })
      .catch(error => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordAsyncOperation(operationName, duration, false, error);
        throw error;
      });
  }

  private recordAsyncOperation(
    name: string, 
    duration: number, 
    success: boolean, 
    error?: any
  ): void {
    const entry = {
      name,
      duration,
      success,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : String(error)
    };

    if (duration > 5000) { // 5 second threshold
      this.reportPerformanceIssue('slow-async-operation', entry);
    }
  }

  public getWebVitals(): Promise<WebVitalsMetrics> {
    return new Promise((resolve) => {
      const metrics: Partial<WebVitalsMetrics> = {};
      
      // Get FCP
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        metrics.FCP = fcpEntry.startTime;
      }

      // Get LCP
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          metrics.LCP = lastEntry.startTime;
          lcpObserver.disconnect();
          
          // Check if all metrics are collected
          if (Object.keys(metrics).length >= 2) {
            resolve(metrics as WebVitalsMetrics);
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // Get TTFB
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        metrics.TTFB = navigationEntry.responseStart - navigationEntry.requestStart;
      }

      // Set timeout to resolve with available metrics
      setTimeout(() => {
        resolve(metrics as WebVitalsMetrics);
      }, 1000);
    });
  }

  public getResourceMetrics(): ResourceTiming[] {
    return performance.getEntriesByType('resource')
      .map(entry => entry as PerformanceResourceTiming)
      .map(entry => ({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        compressionRatio: entry.decodedBodySize > 0 
          ? entry.encodedBodySize / entry.decodedBodySize 
          : 1
      }));
  }

  public getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  public analyzeBundle(): Promise<any> {
    return new Promise((resolve) => {
      // Analyze JavaScript bundle sizes
      const scriptResources = this.getResourceMetrics()
        .filter(resource => resource.name.includes('.js'))
        .sort((a, b) => b.transferSize - a.transferSize);

      const cssResources = this.getResourceMetrics()
        .filter(resource => resource.name.includes('.css'))
        .sort((a, b) => b.transferSize - a.transferSize);

      const analysis = {
        scripts: {
          count: scriptResources.length,
          totalSize: scriptResources.reduce((sum, r) => sum + r.transferSize, 0),
          largestScripts: scriptResources.slice(0, 5),
          avgCompressionRatio: scriptResources.reduce((sum, r) => sum + r.compressionRatio, 0) / scriptResources.length
        },
        styles: {
          count: cssResources.length,
          totalSize: cssResources.reduce((sum, r) => sum + r.transferSize, 0),
          largestStyles: cssResources.slice(0, 3)
        },
        recommendations: this.generateOptimizationRecommendations(scriptResources, cssResources)
      };

      resolve(analysis);
    });
  }

  private generateOptimizationRecommendations(
    scripts: ResourceTiming[], 
    styles: ResourceTiming[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for large bundles
    const largeScripts = scripts.filter(s => s.transferSize > 500000); // 500KB
    if (largeScripts.length > 0) {
      recommendations.push('Consider code splitting for large JavaScript bundles');
    }

    // Check for poor compression
    const poorlyCompressed = scripts.filter(s => s.compressionRatio > 0.8);
    if (poorlyCompressed.length > 0) {
      recommendations.push('Enable better compression (gzip/brotli) for JavaScript files');
    }

    // Check for too many requests
    if (scripts.length > 10) {
      recommendations.push('Consider bundling more JavaScript files to reduce HTTP requests');
    }

    if (styles.length > 5) {
      recommendations.push('Consider combining CSS files to reduce HTTP requests');
    }

    return recommendations;
  }

  private reportPerformanceIssue(type: string, data: any): void {
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(console.error);
    } else {
      console.warn('Performance issue detected:', { type, data });
    }
  }

  public generatePerformanceReport(): Promise<any> {
    return Promise.all([
      this.getWebVitals(),
      this.analyzeBundle(),
      Promise.resolve(this.getResourceMetrics()),
      Promise.resolve(this.getMemoryUsage())
    ]).then(([webVitals, bundleAnalysis, resources, memoryUsage]) => {
      return {
        timestamp: new Date().toISOString(),
        webVitals,
        bundleAnalysis,
        resources: {
          count: resources.length,
          totalTransferSize: resources.reduce((sum, r) => sum + r.transferSize, 0),
          slowestResources: resources
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10)
        },
        memory: {
          usage: memoryUsage,
          threshold: this.thresholds.memoryUsage,
          withinThreshold: memoryUsage <= this.thresholds.memoryUsage
        },
        recommendations: this.generateOverallRecommendations()
      };
    });
  }

  private generateOverallRecommendations(): string[] {
    const recommendations: string[] = [];
    const memoryUsage = this.getMemoryUsage();

    if (memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push('High memory usage detected - check for memory leaks');
    }

    return recommendations;
  }

  public cleanup(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const measureRender = <T,>(componentName: string, renderFn: () => T): T => {
    return monitor.measureRenderPerformance(componentName, renderFn);
  };

  const measureAsync = <T,>(operationName: string, operation: () => Promise<T>): Promise<T> => {
    return monitor.measureAsyncOperation(operationName, operation);
  };

  const getReport = (): Promise<any> => {
    return monitor.generatePerformanceReport();
  };

  return {
    measureRender,
    measureAsync,
    getReport,
    getWebVitals: () => monitor.getWebVitals(),
    getMemoryUsage: () => monitor.getMemoryUsage()
  };
}

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const WithPerformanceMonitoring = React.forwardRef<any, P>((props, ref) => {
    const monitor = PerformanceMonitor.getInstance();
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name;

    const measureRender = React.useCallback(() => {
      return monitor.measureRenderPerformance(name, () => (
        React.createElement(WrappedComponent, { ...props, ref })
      ));
    }, [props, ref, monitor, name]);

    return measureRender();
  });

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithPerformanceMonitoring;
}

// Performance budget checker
export class PerformanceBudget {
  private static budgets = {
    loadTime: 3000,
    bundleSize: 244 * 1024, // 244KB for critical resources
    imageSize: 1000 * 1024, // 1MB per image
    totalRequests: 50,
    thirdPartySize: 100 * 1024 // 100KB for third-party scripts
  };

  public static checkBudgets(): Promise<any> {
    const monitor = PerformanceMonitor.getInstance();
    
    return Promise.all([
      monitor.getWebVitals(),
      monitor.getResourceMetrics()
    ]).then(([webVitals, resources]) => {
      const results = {
        loadTime: {
          budget: this.budgets.loadTime,
          actual: webVitals.LCP || 0,
          pass: (webVitals.LCP || 0) <= this.budgets.loadTime
        },
        bundleSize: {
          budget: this.budgets.bundleSize,
          actual: resources
            .filter(r => r.name.includes('.js'))
            .reduce((sum, r) => sum + r.transferSize, 0),
          pass: true // calculated below
        },
        totalRequests: {
          budget: this.budgets.totalRequests,
          actual: resources.length,
          pass: resources.length <= this.budgets.totalRequests
        }
      };

      results.bundleSize.pass = results.bundleSize.actual <= this.budgets.bundleSize;

      return {
        results,
        overallPass: Object.values(results).every(r => r.pass),
        recommendations: this.generateBudgetRecommendations(results)
      };
    });
  }

  private static generateBudgetRecommendations(results: any): string[] {
    const recommendations: string[] = [];

    if (!results.loadTime.pass) {
      recommendations.push('Reduce load time by optimizing critical rendering path');
    }

    if (!results.bundleSize.pass) {
      recommendations.push('Reduce JavaScript bundle size through code splitting');
    }

    if (!results.totalRequests.pass) {
      recommendations.push('Combine resources to reduce HTTP request count');
    }

    return recommendations;
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  const monitor = PerformanceMonitor.getInstance();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    monitor.cleanup();
  });
}