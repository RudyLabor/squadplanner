/**
 * Analytics tracking with PostHog integration
 *
 * Architecture:
 * - Lightweight fetch-based approach (no SDK, ~3KB overhead)
 * - Respects cookie consent (only tracks if user accepted analytics)
 * - Batches events and flushes every 5s or on page unload
 * - Falls back gracefully if PostHog is not configured
 * - Captures user journey funnel events for abandonment analysis
 *
 * Key Events Tracked:
 * - Squad & Session lifecycle (created, joined, left)
 * - RSVP flow (viewed, submitted, changed)
 * - Premium conversion funnel (viewed, checkout_started, subscribed)
 * - Onboarding steps (tour_started, step_completed, tour_finished)
 * - Social actions (invite_sent, message_sent, voice_call_started)
 * - Page views (automatic on route change)
 */

import { COOKIE_CONSENT_KEY } from '../components/CookieConsent'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventProperties = Record<string, string | number | boolean | undefined>

interface AnalyticsEvent {
  event: string
  properties: EventProperties
  timestamp: string
}

interface PageViewEvent {
  event: '$pageview'
  properties: {
    $current_url: string
    $pathname: string
    $referrer: string
    $title: string
  }
  timestamp: string
}

interface IdentifyEvent {
  $set: Record<string, unknown>
  timestamp: string
}

// Key user journey events for funnel analysis
export type UserEvent =
  // Squad & Session events
  | 'squad_created'
  | 'squad_joined'
  | 'squad_left'
  | 'session_created'
  | 'session_viewed'
  | 'session_joined'
  | 'session_left'
  // RSVP funnel
  | 'rsvp_viewed'
  | 'rsvp_submitted'
  | 'rsvp_changed'
  // Premium conversion funnel
  | 'premium_viewed'
  | 'premium_checkout_started'
  | 'premium_subscribed'
  | 'premium_cancelled'
  // Onboarding funnel
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_skipped'
  | 'onboarding_finished'
  // Social actions
  | 'invite_sent'
  | 'message_sent'
  | 'voice_call_started'
  | 'voice_call_ended'
  // Engagement
  | 'command_palette_opened'
  | 'search_performed'
  | 'notification_clicked'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://eu.i.posthog.com'
const FLUSH_INTERVAL = 5000 // 5 seconds
const MAX_BUFFER_SIZE = 20

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let eventQueue: Array<AnalyticsEvent | PageViewEvent | IdentifyEvent> = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let currentUserId: string | null = null
let isInitialized = false

// ---------------------------------------------------------------------------
// Consent & Configuration
// ---------------------------------------------------------------------------

/**
 * Check if analytics tracking is allowed based on cookie consent
 */
function hasAnalyticsConsent(): boolean {
  if (typeof localStorage === 'undefined') return false
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
  return consent === 'accepted'
}

/**
 * Check if PostHog is configured
 */
function isPostHogConfigured(): boolean {
  return Boolean(POSTHOG_API_KEY && POSTHOG_API_KEY.length > 0)
}

/**
 * Check if analytics should be tracked
 */
function shouldTrack(): boolean {
  return isPostHogConfigured() && hasAnalyticsConsent()
}

// ---------------------------------------------------------------------------
// Event Batching & Flushing
// ---------------------------------------------------------------------------

/**
 * Flush events to PostHog API
 */
async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return
  if (!shouldTrack()) {
    eventQueue = []
    return
  }

  const events = [...eventQueue]
  eventQueue = []

  const endpoint = `${POSTHOG_HOST}/capture/`
  const payload = {
    api_key: POSTHOG_API_KEY,
    batch: events.map((event) => ({
      ...event,
      distinct_id: currentUserId || 'anonymous',
    })),
  }

  try {
    // Use sendBeacon for reliable delivery on page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      })
      navigator.sendBeacon(endpoint, blob)
      return
    }

    // Fallback to fetch with keepalive
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch (error) {
    // Silent fail - analytics should never break the app
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Failed to send events:', error)
    }
  }
}

/**
 * Queue an event for batching
 */
function queueEvent(event: AnalyticsEvent | PageViewEvent | IdentifyEvent): void {
  if (!shouldTrack()) return

  eventQueue.push(event)

  // Flush if buffer is full
  if (eventQueue.length >= MAX_BUFFER_SIZE) {
    void flushEvents()
    return
  }

  // Schedule batch flush
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    void flushEvents()
  }, FLUSH_INTERVAL)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize analytics tracking
 * Sets up page unload listener and logs configuration
 */
export function initAnalytics(): void {
  if (isInitialized) return
  isInitialized = true

  if (!isPostHogConfigured()) {
    if (import.meta.env.DEV) {
      console.info('[Analytics] PostHog not configured. Set VITE_POSTHOG_KEY to enable.')
    }
    return
  }

  // Flush events on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      void flushEvents()
    })
  }

  if (import.meta.env.DEV) {
    console.info('[Analytics] PostHog initialized:', {
      host: POSTHOG_HOST,
      consent: hasAnalyticsConsent() ? '✅ Granted' : '❌ Not granted',
    })
  }
}

/**
 * Track a user event with optional properties
 *
 * @example
 * trackEvent('squad_created', { squad_id: '123', game: 'valorant' })
 * trackEvent('premium_viewed', { source: 'settings' })
 */
export function trackEvent(event: UserEvent, properties?: EventProperties): void {
  if (!shouldTrack()) return

  const analyticsEvent: AnalyticsEvent = {
    event,
    properties: {
      ...properties,
      $pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      $timestamp: Date.now(),
    },
    timestamp: new Date().toISOString(),
  }

  queueEvent(analyticsEvent)

  if (import.meta.env.DEV) {
    console.log('[Analytics]', event, properties)
  }
}

/**
 * Track a page view
 * Should be called on route changes
 *
 * @example
 * trackPageView('/squads/123')
 */
export function trackPageView(path: string): void {
  if (!shouldTrack()) return

  const pageViewEvent: PageViewEvent = {
    event: '$pageview',
    properties: {
      $current_url: typeof window !== 'undefined' ? window.location.href : '',
      $pathname: path,
      $referrer: typeof document !== 'undefined' ? document.referrer : '',
      $title: typeof document !== 'undefined' ? document.title : '',
    },
    timestamp: new Date().toISOString(),
  }

  queueEvent(pageViewEvent)

  if (import.meta.env.DEV) {
    console.log('[Analytics] Page view:', path)
  }
}

/**
 * Identify a user and set user properties
 * Should be called after authentication
 *
 * @example
 * identifyUser('user-123', {
 *   username: 'john',
 *   plan: 'premium',
 *   created_at: '2024-01-01'
 * })
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  currentUserId = userId

  if (!shouldTrack()) return

  const identifyEvent: IdentifyEvent = {
    $set: {
      ...traits,
      $identified_at: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  }

  queueEvent(identifyEvent)

  if (import.meta.env.DEV) {
    console.log('[Analytics] User identified:', userId, traits)
  }
}

/**
 * Reset analytics state (e.g., on logout)
 */
export function resetAnalytics(): void {
  currentUserId = null
  eventQueue = []

  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
}

/**
 * Manually flush queued events
 * Useful before navigation or critical actions
 */
export function flushAnalytics(): void {
  void flushEvents()
}
