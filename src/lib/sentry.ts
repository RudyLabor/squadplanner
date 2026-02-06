/**
 * Sentry Error Monitoring Setup
 *
 * This module provides error tracking for production.
 * It's designed to work gracefully when Sentry is not installed.
 *
 * SETUP:
 * 1. Install: npm install @sentry/react
 * 2. Create a Sentry account at https://sentry.io
 * 3. Create a new project (Platform: React)
 * 4. Copy your DSN and add to .env: VITE_SENTRY_DSN=your_dsn_here
 */

// Sentry instance (loaded dynamically)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SentryModule: any = null

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

  try {
    // Dynamic import to avoid bundling Sentry when not used
    // Using variable to prevent TypeScript from trying to resolve the module
    const sentryPackage = '@sentry/react'
    SentryModule = await import(/* @vite-ignore */ sentryPackage)

    SentryModule.init({
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeSend(event: any) {
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
        SentryModule.browserTracingIntegration(),
        SentryModule.replayIntegration({
          maskAllText: true, // Hide sensitive text in replays
          blockAllMedia: true, // Don't capture images/videos
        }),
      ],
    })

    console.log('[Sentry] Initialized successfully')
  } catch {
    // Sentry not installed - that's fine
    console.log('[Sentry] Package not installed, error tracking disabled')
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
  if (SentryModule) {
    SentryModule.captureException(error, {
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
  if (SentryModule) {
    SentryModule.captureMessage(message, level)
  }
}

/**
 * Set user context for error reports
 * Call this after user login
 */
export function setUser(user: { id: string; username?: string } | null): void {
  if (SentryModule) {
    SentryModule.setUser(user)
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
  if (SentryModule) {
    SentryModule.addBreadcrumb({
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
  if (SentryModule) {
    return SentryModule.startInactiveSpan({ name, op })
  }
  return null
}
