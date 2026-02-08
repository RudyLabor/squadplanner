/**
 * Sentry Error Monitoring Setup
 *
 * Uses dynamic import() so @sentry/react is NEVER in the initial bundle.
 * Sentry is loaded asynchronously only when initSentry() is called.
 */

type SentryModule = typeof import('@sentry/react')

let SentryRef: SentryModule | null = null
let isInitialized = false

/**
 * Initialize Sentry error monitoring
 * Call this ONLY from authenticated routes, NOT on landing page
 */
export async function initSentry(): Promise<void> {
  // Only initialize in production and if DSN is configured
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

  if (!import.meta.env.PROD) {
    return
  }

  if (!dsn) {
    return
  }

  if (isInitialized) {
    return
  }

  try {
    // Dynamic import — @sentry/react is NOT bundled in main chunk
    const Sentry = await import('@sentry/react')
    SentryRef = Sentry

    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,

      // Performance monitoring
      tracesSampleRate: 0.1,

      // Session replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      enabled: import.meta.env.PROD,

      ignoreErrors: [
        'Failed to fetch',
        'NetworkError',
        'Load failed',
        'AbortError',
        'chrome-extension://',
        'moz-extension://',
        'ResizeObserver loop',
        'WebSocket',
      ],

      beforeSend(event) {
        if (event.request?.cookies) {
          delete event.request.cookies
        }
        if (event.request?.headers) {
          delete event.request.headers['Authorization']
          delete event.request.headers['Cookie']
        }
        return event
      },

      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    })

    isInitialized = true
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error)
  }
}

/**
 * Capture an exception manually
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (isInitialized && SentryRef) {
    SentryRef.captureException(error, {
      extra: context,
    })
  } else if (import.meta.env.PROD) {
    console.error('[Error]', error.message, context)
  }
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (isInitialized && SentryRef) {
    SentryRef.captureMessage(message, level)
  }
}

/**
 * Set user context for error reports
 */
export function setUser(user: { id: string; username?: string } | null): void {
  if (isInitialized && SentryRef) {
    SentryRef.setUser(user)
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = 'app',
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): void {
  if (isInitialized && SentryRef) {
    SentryRef.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    })
  }
}

/**
 * Create a performance transaction
 */
export function startTransaction(name: string, op: string = 'task') {
  if (isInitialized && SentryRef) {
    return SentryRef.startInactiveSpan({ name, op })
  }
  return null
}
