/**
 * Lightweight analytics event tracking
 * Captures clicks on elements with data-track attribute
 * Events are sent to the web-vitals edge function for aggregation
 */

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

  // Analytics endpoint not deployed yet — skip beacon to avoid 405 errors.
  // Re-enable once /api/analytics or a third-party (GA4, Plausible) is set up.
  void events
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

  // Track page views
  queueEvent('page_view')
}
