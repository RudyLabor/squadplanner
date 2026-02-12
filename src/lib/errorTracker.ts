/**
 * Micro Error Tracker (~3 KB)
 * Replaces @sentry/browser (408 KB) with a lightweight error reporter
 * that batches errors and sends them to a Supabase Edge Function.
 *
 * Features:
 * - Global error and unhandled rejection tracking
 * - Navigation breadcrumbs
 * - User context
 * - Environment tags
 * - Console.error capture
 *
 * SSR-safe: all browser APIs are guarded with typeof checks.
 */

interface Breadcrumb {
  timestamp: string
  category: string
  message: string
  level?: 'debug' | 'info' | 'warning' | 'error'
}

interface ErrorReport {
  message: string
  stack?: string
  url: string
  timestamp: string
  userAgent: string
  userId?: string
  username?: string
  level: 'error' | 'warning' | 'info'
  extra?: Record<string, unknown>
  breadcrumbs?: Breadcrumb[]
  tags?: Record<string, string>
}

const FLUSH_INTERVAL = 5_000
const MAX_BUFFER_SIZE = 50
const MAX_BREADCRUMBS = 20

let buffer: ErrorReport[] = []
let breadcrumbs: Breadcrumb[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let currentUserId: string | undefined
let currentUsername: string | undefined
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

function getEnvironmentTags(): Record<string, string> {
  const tags: Record<string, string> = {}

  if (typeof window === 'undefined') return tags

  // Environment
  tags.env = import.meta.env?.PROD ? 'production' : 'development'

  // Browser info
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('chrome')) tags.browser = 'chrome'
    else if (ua.includes('firefox')) tags.browser = 'firefox'
    else if (ua.includes('safari')) tags.browser = 'safari'
    else if (ua.includes('edge')) tags.browser = 'edge'

    // Device type
    if (ua.includes('mobile')) tags.device = 'mobile'
    else if (ua.includes('tablet')) tags.device = 'tablet'
    else tags.device = 'desktop'

    // Platform
    if (ua.includes('android')) tags.platform = 'android'
    else if (ua.includes('iphone') || ua.includes('ipad')) tags.platform = 'ios'
    else if (ua.includes('windows')) tags.platform = 'windows'
    else if (ua.includes('mac')) tags.platform = 'macos'
    else if (ua.includes('linux')) tags.platform = 'linux'
  }

  // Connection type
  if ('connection' in navigator) {
    const conn = (navigator as any).connection
    if (conn?.effectiveType) tags.connection = conn.effectiveType
  }

  return tags
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
    username: currentUsername,
    level,
    extra,
    breadcrumbs: breadcrumbs.length > 0 ? [...breadcrumbs] : undefined,
    tags: getEnvironmentTags(),
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

  // Capture console.error calls
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args)
    const message = args.map(arg => {
      if (arg instanceof Error) return arg.message
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg) }
        catch { return String(arg) }
      }
      return String(arg)
    }).join(' ')

    if (!shouldIgnore(message)) {
      enqueue(createReport(`Console error: ${message}`, undefined, 'error'))
    }
  }

  // Track navigation for breadcrumbs
  let lastUrl = window.location.href
  const navigationObserver = () => {
    const newUrl = window.location.href
    if (newUrl !== lastUrl) {
      addBreadcrumb(`Navigation: ${lastUrl} → ${newUrl}`, 'navigation', 'info')
      lastUrl = newUrl
    }
  }

  // Use multiple methods to catch navigation
  window.addEventListener('popstate', navigationObserver)
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function(...args) {
    originalPushState.apply(history, args)
    navigationObserver()
  }

  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args)
    navigationObserver()
  }

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
  currentUsername = user?.username
}

/**
 * Add breadcrumb for context in error reports
 */
export function addBreadcrumb(
  message: string,
  category: string = 'manual',
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
): void {
  if (typeof window === 'undefined') return

  breadcrumbs.push({
    timestamp: new Date().toISOString(),
    category,
    message,
    level,
  })

  // Keep only the last MAX_BREADCRUMBS
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs = breadcrumbs.slice(-MAX_BREADCRUMBS)
  }
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
  breadcrumbs = []
  initialized = false
}
