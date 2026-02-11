/**
 * Core Web Vitals reporting using Google's web-vitals library.
 * Reports LCP, FCP, CLS, TTFB, and INP (FID removed in web-vitals v5).
 *
 * Uses the official web-vitals library for accurate measurements including:
 * - Back/forward cache (bfcache) handling
 * - Soft navigation support
 * - CLS windowed session tracking
 *
 * - DEV: logs to console with color-coded output
 * - PROD: buffers metrics and sends to Supabase Edge Function every 10s
 *         or when the page becomes hidden (visibilitychange)
 */

import type { Metric } from 'web-vitals';

interface WebVitalPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  url: string;
  timestamp: string;
  userAgent: string;
  connectionType: string | undefined;
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

function enqueueMetric(metric: Metric): void {
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
// Metric handler
// ---------------------------------------------------------------------------

function handleMetric(metric: Metric): void {
  if (import.meta.env.DEV) {
    const color = metric.rating === 'good' ? '#0cce6b' : metric.rating === 'needs-improvement' ? '#ffa400' : '#ff4e42';
    console.log(
      `%c[WebVital] ${metric.name}: ${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}ms (${metric.rating})`,
      `color: ${color}; font-weight: bold;`,
    );
    return;
  }

  enqueueMetric(metric);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Report all Core Web Vitals using Google's web-vitals library.
 * In dev: logs to console. In prod: buffers and sends to edge function.
 */
export function reportWebVitals(): void {
  if (typeof window === 'undefined') return;

  import('web-vitals').then(({ onLCP, onCLS, onINP, onTTFB, onFCP }) => {
    onLCP(handleMetric);
    onCLS(handleMetric);
    onINP(handleMetric);
    onTTFB(handleMetric);
    onFCP(handleMetric);
  });

  // Start the flush schedule only in production
  if (!import.meta.env.DEV) {
    startFlushSchedule();
  }
}
