/**
 * Sentry Error Monitoring Setup
 *
 * Uses dynamic import() so @sentry/browser is NEVER in the initial bundle.
 * Sentry is loaded asynchronously only when initSentry() is called.
 */

type SentryModule = typeof import('@sentry/browser')

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
    // Dynamic import — @sentry/browser is NOT bundled in main chunk
    const Sentry = await import('@sentry/browser')
    SentryRef = Sentry

    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,

      // Performance monitoring — 25% for Web Vitals coverage
      tracesSampleRate: 0.25,

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
        'Auth session missing',
        'Auth error',
        'refresh_token_not_found',
      ],

      beforeSend(event) {
        // Filter out Supabase auth noise that pollutes logs
        const message = event.exception?.values?.[0]?.value || ''
        if (message.includes('Auth session missing') || message.includes('refresh_token')) {
          return null
        }

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
