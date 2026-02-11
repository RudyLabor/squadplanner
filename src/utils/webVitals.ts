/**
 * Core Web Vitals reporting using PerformanceObserver.
 * Reports LCP, FCP, CLS, TTFB, and INP.
 *
 * - DEV: logs to console with color-coded output
 * - PROD: buffers metrics and sends to Supabase Edge Function every 10s
 *         or when the page becomes hidden (visibilitychange)
 */

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface WebVitalPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  url: string;
  timestamp: string;
  userAgent: string;
  connectionType: string | undefined;
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

// ---------------------------------------------------------------------------
// Production analytics buffer
// ---------------------------------------------------------------------------

const FLUSH_INTERVAL = 10_000; // 10 seconds
const MAX_BUFFER_SIZE = 50;

let metricsBuffer: WebVitalPayload[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let visibilityListenerAdded = false;

function getEndpointUrl(): string {
  const supabaseUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta.env?.VITE_SUPABASE_URL as string | undefined)
      : undefined;
  if (!supabaseUrl) return '';
  return `${supabaseUrl}/functions/v1/web-vitals`;
}

function getConnectionType(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  // navigator.connection is not in all browsers; use optional chaining
  const conn = (navigator as any).connection;
  return conn?.effectiveType as string | undefined;
}

function flushMetrics(): void {
  if (metricsBuffer.length === 0) return;

  const endpoint = getEndpointUrl();
  if (!endpoint) return;

  const payload = metricsBuffer.splice(0, MAX_BUFFER_SIZE);

  if (typeof fetch === 'undefined') return;

  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics: payload }),
      keepalive: true,
    }).catch(() => {
      // Silently fail -- analytics should never break the app
    });
  } catch {
    // Silently fail
  }
}

function enqueueMetric(metric: WebVitalMetric): void {
  const entry: WebVitalPayload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    connectionType: getConnectionType(),
  };

  metricsBuffer.push(entry);

  if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
    flushMetrics();
  }
}

function startFlushSchedule(): void {
  if (flushTimer !== null) return;

  // Periodic flush every 10s
  flushTimer = setInterval(flushMetrics, FLUSH_INTERVAL);

  // Flush when the user navigates away or hides the tab
  if (!visibilityListenerAdded && typeof document !== 'undefined') {
    visibilityListenerAdded = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushMetrics();
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Observers
// ---------------------------------------------------------------------------

/**
 * Observe Core Web Vitals using PerformanceObserver.
 * Reports LCP, FCP, CLS, TTFB, FID, and INP.
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

  // FID
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];
      if (firstEntry) {
        const fid = (firstEntry as any).processingStart - firstEntry.startTime;
        callback({
          name: 'FID',
          value: fid,
          rating: getRating('FID', fid),
        });
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // Not supported in this browser
  }

  // INP
  try {
    let maxINP = 0;
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = (entry as any).duration;
        if (duration > maxINP) {
          maxINP = duration;
          callback({
            name: 'INP',
            value: maxINP,
            rating: getRating('INP', maxINP),
          });
        }
      }
    });
    inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 });
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
      return;
    }

    // Production: buffer and send to edge function
    enqueueMetric(metric);
  });

  // Start the flush schedule only in production
  if (!import.meta.env.DEV) {
    startFlushSchedule();
  }
}
