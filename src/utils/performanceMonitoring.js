/**
 * Performance Monitoring Utilities
 * Track Core Web Vitals and performance metrics in real-time
 */

/**
 * Measure Core Web Vitals (CWV)
 * - Largest Contentful Paint (LCP): ~2.5s
 * - First Input Delay (FID) / Interaction to Next Paint (INP): ~100ms
 * - Cumulative Layout Shift (CLS): ~0.1
 */
export const measureCoreWebVitals = () => {
  const vitals = {
    lcp: null,      // Largest Contentful Paint
    fid: null,      // First Input Delay
    cls: 0,         // Cumulative Layout Shift
    fcp: null,      // First Contentful Paint
    ttfb: null,     // Time to First Byte
    lcp_element: null,
  };

  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
        vitals.lcp_element = lastEntry.element?.tagName || 'unknown';
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.debug('LCP observer not supported', e);
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          vitals.fid = entry.processingDuration;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.debug('FID observer not supported', e);
    }

    // Cumulative Layout Shift (CLS)
    try {
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            vitals.cls += entry.value;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.debug('CLS observer not supported', e);
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.debug('FCP observer not supported', e);
    }
  }

  // Time to First Byte (TTFB)
  if ('performance' in window && window.performance.timing) {
    const timing = window.performance.timing;
    if (timing.navigationStart && timing.responseStart) {
      vitals.ttfb = timing.responseStart - timing.navigationStart;
    }
  }

  return vitals;
};

/**
 * Get detailed performance metrics
 */
export const getPerformanceMetrics = () => {
  if (!('performance' in window)) {
    console.warn('Performance API not available');
    return null;
  }

  const timing = window.performance.timing;
  const navigation = window.performance.navigation;

  return {
    // Navigation Timing
    navigationStart: timing.navigationStart,
    redirectTime: timing.redirectEnd - timing.redirectStart,
    dnsTime: timing.dnsLookupEnd - timing.dnsLookupStart,
    tcpConnectTime: timing.connectEnd - timing.connectStart,
    requestTime: timing.responseStart - timing.requestStart,
    responseTime: timing.responseEnd - timing.responseStart,
    domInteractiveTime: timing.domInteractive - timing.navigationStart,
    domCompleteTime: timing.domComplete - timing.navigationStart,
    loadCompleteTime: timing.loadEventEnd - timing.navigationStart,
    domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,

    // Key metrics
    timeToFirstByte: timing.responseStart - timing.navigationStart,
    domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
    pageLoadTime: timing.loadEventEnd - timing.navigationStart,

    // Navigation type
    navigationType: navigation.type, // 0=navigate, 1=reload, 2=back_forward, 255=reserved
  };
};

/**
 * Get resource loading performance
 */
export const getResourceMetrics = () => {
  if (!('performance' in window)) {
    return null;
  }

  const resources = window.performance.getEntriesByType('resource');
  const metrics = {
    totalResources: resources.length,
    imagCount: 0,
    scriptCount: 0,
    styleCount: 0,
    otherCount: 0,
    totalSize: 0,
    slowestResource: null,
    maxDuration: 0,
    resources: [],
  };

  resources.forEach((resource) => {
    const type = resource.initiatorType;
    const size = resource.transferSize || 0;

    if (type === 'img') metrics.imagCount++;
    else if (type === 'script') metrics.scriptCount++;
    else if (type === 'style') metrics.styleCount++;
    else metrics.otherCount++;

    metrics.totalSize += size;
    metrics.resources.push({
      name: resource.name,
      type,
      duration: resource.duration,
      size: size,
      cached: size === 0,
    });

    if (resource.duration > metrics.maxDuration) {
      metrics.maxDuration = resource.duration;
      metrics.slowestResource = resource.name;
    }
  });

  return metrics;
};

/**
 * Check if a metric meets performance targets
 */
export const checkPerformanceTargets = (vitals) => {
  const targets = {
    lcp: { target: 2500, good: 'Green', warning: 'Yellow', poor: 'Red' },
    fid: { target: 100, good: 'Green', warning: 'Yellow', poor: 'Red' },
    cls: { target: 0.1, good: 'Green', warning: 'Yellow', poor: 'Red' },
    fcp: { target: 1800, good: 'Green', warning: 'Yellow', poor: 'Red' },
    ttfb: { target: 600, good: 'Green', warning: 'Yellow', poor: 'Red' },
  };

  const status = {
    lcp: vitals.lcp <= targets.lcp.target ? 'Good' : vitals.lcp <= targets.lcp.target * 1.25 ? 'Fair' : 'Poor',
    fid: vitals.fid <= targets.fid.target ? 'Good' : vitals.fid <= targets.fid.target * 1.5 ? 'Fair' : 'Poor',
    cls: vitals.cls <= targets.cls.target ? 'Good' : vitals.cls <= targets.cls.target * 1.5 ? 'Fair' : 'Poor',
    fcp: vitals.fcp <= targets.fcp.target ? 'Good' : vitals.fcp <= targets.fcp.target * 1.5 ? 'Fair' : 'Poor',
    ttfb: vitals.ttfb <= targets.ttfb.target ? 'Good' : vitals.ttfb <= targets.ttfb.target * 1.5 ? 'Fair' : 'Poor',
  };

  return { targets, status, vitals };
};

/**
 * Log performance metrics to console (development only)
 */
export const logPerformanceMetrics = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const vitals = measureCoreWebVitals();
  const metrics = getPerformanceMetrics();
  const resources = getResourceMetrics();
  const targets = checkPerformanceTargets(vitals);

  console.group('📊 Core Web Vitals');
  console.table({
    'Largest Contentful Paint (LCP)': `${vitals.lcp?.toFixed(2) || 'N/A'} ms (Target: 2.5s)`,
    'First Input Delay (FID)': `${vitals.fid?.toFixed(2) || 'N/A'} ms (Target: 100ms)`,
    'Cumulative Layout Shift (CLS)': `${vitals.cls?.toFixed(3) || 'N/A'} (Target: 0.1)`,
    'First Contentful Paint (FCP)': `${vitals.fcp?.toFixed(2) || 'N/A'} ms (Target: 1.8s)`,
    'Time to First Byte (TTFB)': `${vitals.ttfb?.toFixed(2) || 'N/A'} ms (Target: 600ms)`,
  });
  console.groupEnd();

  console.group('⏱️ Page Load Timing');
  console.table({
    'DNS Lookup': `${metrics.dnsTime.toFixed(2)} ms`,
    'TCP Connect': `${metrics.tcpConnectTime.toFixed(2)} ms`,
    'Request Time': `${metrics.requestTime.toFixed(2)} ms`,
    'Response Time': `${metrics.responseTime.toFixed(2)} ms`,
    'DOM Interactive': `${metrics.domInteractiveTime.toFixed(2)} ms`,
    'DOM Complete': `${metrics.domCompleteTime.toFixed(2)} ms`,
    'Total Page Load': `${metrics.pageLoadTime.toFixed(2)} ms`,
  });
  console.groupEnd();

  console.group('🔧 Resources');
  console.table({
    'Total Resources': resources.totalResources,
    'Images': resources.imagCount,
    'Scripts': resources.scriptCount,
    'Stylesheets': resources.styleCount,
    'Other': resources.otherCount,
    'Total Size': `${(resources.totalSize / 1024).toFixed(2)} KB`,
    'Slowest Resource': resources.slowestResource,
  });
  console.groupEnd();

  console.group('✅ Performance Status');
  console.table(targets.status);
  console.groupEnd();
};

/**
 * Hook for React to measure performance on mount
 */
export const usePerformanceMetrics = () => {
  React.useEffect(() => {
    // Give the page time to fully load
    const timer = setTimeout(() => {
      logPerformanceMetrics();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
};

/**
 * Send metrics to analytics service
 */
export const sendMetricsToAnalytics = (analyticsService) => {
  const vitals = measureCoreWebVitals();
  const metrics = getPerformanceMetrics();
  const resources = getResourceMetrics();

  analyticsService.track('performance_metrics', {
    lcp: vitals.lcp,
    fid: vitals.fid,
    cls: vitals.cls,
    fcp: vitals.fcp,
    ttfb: vitals.ttfb,
    pageLoadTime: metrics.pageLoadTime,
    resourceCount: resources.totalResources,
    totalSize: resources.totalSize,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Performance budget checker
 */
export const checkPerformanceBudget = () => {
  const budget = {
    bundleSize: 150000, // 150KB
    mainChunk: 50000,   // 50KB
    pageLoadTime: 3000, // 3 seconds
    lcp: 2500,          // 2.5 seconds
    fid: 100,           // 100ms
    cls: 0.1,           // 0.1
  };

  const resources = getResourceMetrics();
  const vitals = measureCoreWebVitals();
  const metrics = getPerformanceMetrics();

  const results = {
    budgetExceeded: false,
    violations: [],
    warnings: [],
  };

  if (resources.totalSize > budget.bundleSize) {
    results.budgetExceeded = true;
    results.violations.push(
      `Bundle size ${(resources.totalSize / 1024).toFixed(2)}KB exceeds budget of ${budget.bundleSize / 1024}KB`
    );
  }

  if (metrics.pageLoadTime > budget.pageLoadTime) {
    results.warnings.push(
      `Page load time ${metrics.pageLoadTime.toFixed(0)}ms exceeds budget of ${budget.pageLoadTime}ms`
    );
  }

  if (vitals.lcp && vitals.lcp > budget.lcp) {
    results.warnings.push(
      `LCP ${vitals.lcp.toFixed(0)}ms exceeds budget of ${budget.lcp}ms`
    );
  }

  return results;
};

export default {
  measureCoreWebVitals,
  getPerformanceMetrics,
  getResourceMetrics,
  checkPerformanceTargets,
  logPerformanceMetrics,
  usePerformanceMetrics,
  sendMetricsToAnalytics,
  checkPerformanceBudget,
};
