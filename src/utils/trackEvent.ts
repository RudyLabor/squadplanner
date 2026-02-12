/**
 * Lightweight analytics event tracking
 * Captures clicks on elements with data-track attribute
 * Now integrated with PostHog analytics system
 */

import { trackEvent as trackAnalyticsEvent } from './analytics'

interface TrackEvent {
  name: string
  timestamp: number
  url: string
  referrer: string
}

const eventQueue: TrackEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function flushEvents() {
  if (eventQueue.length === 0) return

  const events = [...eventQueue]
  eventQueue.length = 0

  // Send to PostHog if configured
  events.forEach(event => {
    trackAnalyticsEvent(event.name as any, {
      url: event.url,
      referrer: event.referrer,
      timestamp: event.timestamp,
    })
  })
}

function queueEvent(name: string) {
  eventQueue.push({
    name,
    timestamp: Date.now(),
    url: window.location.pathname,
    referrer: document.referrer,
  })

  // Batch events and flush every 5 seconds
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(flushEvents, 5000)
}

/**
 * Initialize click tracking for all data-track elements
 * Call once on app mount
 */
export function initTrackingListeners() {
  // Initialize analytics system
  import('./analytics').then(({ initAnalytics }) => {
    initAnalytics()
  })

  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-track]')
    if (target) {
      const trackName = target.getAttribute('data-track')
      if (trackName) {
        queueEvent(trackName)
      }
    }
  }, { passive: true })

  // Flush on page unload
  window.addEventListener('beforeunload', flushEvents)

  // Track initial page view
  queueEvent('page_view')
}
