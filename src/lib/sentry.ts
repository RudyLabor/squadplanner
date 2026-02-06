/**
 * Sentry Error Monitoring Setup
 *
 * This module provides error tracking for production.
 */
import * as Sentry from '@sentry/react'

let isInitialized = false

/**
 * Initialize Sentry error monitoring
 * Call this in main.tsx before rendering the app
 */
export async function initSentry(): Promise<void> {
  // Only initialize in production and if DSN is configured
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

  if (!import.meta.env.PROD) {
    console.log('[Sentry] Skipped in development mode')
    return
  }

  if (!dsn) {
    console.log('[Sentry] No DSN configured, skipping initialization')
    return
  }

  if (isInitialized) {
    return
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,

      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions for performance

      // Session replay (optional - captures user interactions)
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Only send errors in production
      enabled: import.meta.env.PROD,

      // Filter out common non-critical errors
      ignoreErrors: [
        // Network errors
        'Failed to fetch',
        'NetworkError',
        'Load failed',
        // Aborted requests
        'AbortError',
        // Extension interference
        'chrome-extension://',
        'moz-extension://',
        // ResizeObserver (benign)
        'ResizeObserver loop',
        // WebSocket connection issues (handled by reconnection logic)
        'WebSocket',
      ],

      // Don't send PII
      beforeSend(event) {
        // Remove sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies
        }
        if (event.request?.headers) {
          delete event.request.headers['Authorization']
          delete event.request.headers['Cookie']
        }
        return event
      },

      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true, // Hide sensitive text in replays
          blockAllMedia: true, // Don't capture images/videos
        }),
      ],
    })

    isInitialized = true
    console.log('[Sentry] Initialized successfully')
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error)
  }
}

/**
 * Capture an exception manually
 * Use this in catch blocks for important errors
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (isInitialized) {
    Sentry.captureException(error, {
      extra: context,
    })
  } else if (import.meta.env.PROD) {
    // Fallback: log to console in production if Sentry not available
    console.error('[Error]', error.message, context)
  }
}

/**
 * Capture a message (for non-error events you want to track)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (isInitialized) {
    Sentry.captureMessage(message, level)
  }
}

/**
 * Set user context for error reports
 * Call this after user login
 */
export function setUser(user: { id: string; username?: string } | null): void {
  if (isInitialized) {
    Sentry.setUser(user)
  }
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs show the trail of events leading to an error
 */
export function addBreadcrumb(
  message: string,
  category: string = 'app',
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): void {
  if (isInitialized) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    })
  }
}

/**
 * Create a performance transaction
 * Use for tracking slow operations
 */
export function startTransaction(name: string, op: string = 'task') {
  if (isInitialized) {
    return Sentry.startInactiveSpan({ name, op })
  }
  return null
}
