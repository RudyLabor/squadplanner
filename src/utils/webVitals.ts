/**
 * Core Web Vitals reporting using PerformanceObserver.
 * Reports LCP, FCP, CLS, TTFB, and INP.
 */

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

type WebVitalCallback = (metric: WebVitalMetric) => void;

const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Observe Core Web Vitals using PerformanceObserver.
 * Reports LCP, FCP, CLS, and TTFB.
 */
export function observeWebVitals(callback: WebVitalCallback) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        callback({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: getRating('LCP', lastEntry.startTime),
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Not supported in this browser
  }

  // FCP
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        callback({
          name: 'FCP',
          value: fcpEntry.startTime,
          rating: getRating('FCP', fcpEntry.startTime),
        });
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch {
    // Not supported in this browser
  }

  // CLS
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      callback({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // Not supported in this browser
  }

  // TTFB
  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      callback({
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
      });
    }
  } catch {
    // Not supported in this browser
  }
}

/**
 * Log Web Vitals to console in development, send to analytics in production.
 */
export function reportWebVitals() {
  observeWebVitals((metric) => {
    if (import.meta.env.DEV) {
      const color = metric.rating === 'good' ? '#0cce6b' : metric.rating === 'needs-improvement' ? '#ffa400' : '#ff4e42';
      console.log(
        `%c[WebVital] ${metric.name}: ${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}ms (${metric.rating})`,
        `color: ${color}; font-weight: bold;`
      );
    }

    // In production, Sentry captures web vitals automatically via browserTracingIntegration
  });
}
