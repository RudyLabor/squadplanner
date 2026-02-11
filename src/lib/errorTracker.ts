/**
 * Micro Error Tracker (~3 KB)
 * Replaces @sentry/browser (408 KB) with a lightweight error reporter
 * that batches errors and sends them to a Supabase Edge Function.
 *
 * SSR-safe: all browser APIs are guarded with typeof checks.
 */

interface ErrorReport {
  message: string
  stack?: string
  url: string
  timestamp: string
  userAgent: string
  userId?: string
  level: 'error' | 'warning' | 'info'
  extra?: Record<string, unknown>
}

const FLUSH_INTERVAL = 5_000
const MAX_BUFFER_SIZE = 50

let buffer: ErrorReport[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let currentUserId: string | undefined
let initialized = false

// Errors to ignore (same as previous Sentry config)
const IGNORE_PATTERNS = [
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
]

function shouldIgnore(message: string): boolean {
  return IGNORE_PATTERNS.some(pattern => message.includes(pattern))
}

function getEndpointUrl(): string {
  const supabaseUrl = typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_SUPABASE_URL as string | undefined)
    : undefined
  if (!supabaseUrl) return ''
  return `${supabaseUrl}/functions/v1/error-report`
}

function createReport(
  message: string,
  stack?: string,
  level: ErrorReport['level'] = 'error',
  extra?: Record<string, unknown>,
): ErrorReport {
  return {
    message,
    stack,
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    userId: currentUserId,
    level,
    extra,
  }
}

function flush(): void {
  if (buffer.length === 0) return

  const endpoint = getEndpointUrl()
  if (!endpoint) return

  const payload = buffer.splice(0, MAX_BUFFER_SIZE)

  if (typeof fetch === 'undefined') return

  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors: payload }),
      keepalive: true,
    }).catch(() => {
      // Silently fail — we don't want error reporting to cause errors
    })
  } catch {
    // Silently fail
  }
}

function enqueue(report: ErrorReport): void {
  if (shouldIgnore(report.message)) return
  buffer.push(report)
  if (buffer.length >= MAX_BUFFER_SIZE) flush()
}

/**
 * Initialize the error tracker.
 * Sets up global error and unhandledrejection listeners.
 * Safe to call multiple times — only initializes once.
 */
export function initErrorTracker(): void {
  if (initialized) return
  if (typeof window === 'undefined') return
  if (!import.meta.env?.PROD) return

  initialized = true

  // Global error handler
  window.addEventListener('error', (event) => {
    const msg = event.error?.message || event.message || 'Unknown error'
    const stack = event.error?.stack
    enqueue(createReport(msg, stack))
  })

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const msg = reason instanceof Error ? reason.message : String(reason)
    const stack = reason instanceof Error ? reason.stack : undefined
    enqueue(createReport(msg, stack))
  })

  // Flush on page hide (tab close, navigation)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })

  // Periodic flush
  flushTimer = setInterval(flush, FLUSH_INTERVAL)
}

/**
 * Capture an exception manually (compatible with previous Sentry API)
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>,
): void {
  if (!import.meta.env?.PROD && typeof import.meta !== 'undefined') {
    console.error('[Error]', error.message, context)
    return
  }
  enqueue(createReport(error.message, error.stack, 'error', context))
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
): void {
  enqueue(createReport(message, undefined, level))
}

/**
 * Set user context for error reports
 */
export function setUser(user: { id: string; username?: string } | null): void {
  currentUserId = user?.id
}

/**
 * Add breadcrumb (no-op in micro tracker — kept for API compatibility)
 */
export function addBreadcrumb(
  _message: string,
  _category?: string,
  _level?: 'debug' | 'info' | 'warning' | 'error',
): void {
  // No-op: breadcrumbs are not supported in micro tracker
}

/**
 * Start a performance transaction (no-op in micro tracker — kept for API compatibility)
 */
export function startTransaction(_name: string, _op?: string) {
  return null
}

/**
 * Cleanup: stop flush timer (useful for tests)
 */
export function destroyErrorTracker(): void {
  if (flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }
  flush()
  buffer = []
  initialized = false
}
