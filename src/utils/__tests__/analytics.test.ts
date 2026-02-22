/**
 * Comprehensive tests for src/utils/analytics.ts
 * Covers: consent, configuration, event queuing, batching, flushing,
 *         page views, user identification, reset, and all edge cases.
 *
 * NOTE: VITE_POSTHOG_KEY is not set in .env, so the module-level const
 * POSTHOG_API_KEY is undefined. We set it via import.meta.env BEFORE
 * the first import so the module captures it at load time.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Set env vars BEFORE any analytics import (Vitest reads import.meta.env dynamically)
import.meta.env.VITE_POSTHOG_KEY = 'phc_test_key_123'
import.meta.env.VITE_POSTHOG_HOST = 'https://test.posthog.com'

// Mock CookieConsent
vi.mock('../../components/CookieConsent', () => ({
  COOKIE_CONSENT_KEY: 'sq-cookie-consent',
}))

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// ---------------------------------------------------------------------------
// Fresh import helper — uses vi.resetModules() + re-sets env + re-mocks
// ---------------------------------------------------------------------------
async function freshImport() {
  vi.resetModules()

  // Re-set env vars (resetModules clears module cache but not env)
  import.meta.env.VITE_POSTHOG_KEY = 'phc_test_key_123'
  import.meta.env.VITE_POSTHOG_HOST = 'https://test.posthog.com'

  // Re-register mock after resetModules
  vi.doMock('../../components/CookieConsent', () => ({
    COOKIE_CONSENT_KEY: 'sq-cookie-consent',
  }))

  return import('../analytics')
}

async function freshImportNoKey() {
  vi.resetModules()

  import.meta.env.VITE_POSTHOG_KEY = ''
  import.meta.env.VITE_POSTHOG_HOST = 'https://test.posthog.com'

  vi.doMock('../../components/CookieConsent', () => ({
    COOKIE_CONSENT_KEY: 'sq-cookie-consent',
  }))

  return import('../analytics')
}

async function freshImportDev() {
  vi.resetModules()

  import.meta.env.VITE_POSTHOG_KEY = 'phc_test_key_123'
  import.meta.env.VITE_POSTHOG_HOST = 'https://test.posthog.com'
  import.meta.env.DEV = true
  import.meta.env.PROD = false

  vi.doMock('../../components/CookieConsent', () => ({
    COOKIE_CONSENT_KEY: 'sq-cookie-consent',
  }))

  return import('../analytics')
}

async function freshImportEmptyHost() {
  vi.resetModules()

  import.meta.env.VITE_POSTHOG_KEY = 'phc_test_key_123'
  import.meta.env.VITE_POSTHOG_HOST = ''

  vi.doMock('../../components/CookieConsent', () => ({
    COOKIE_CONSENT_KEY: 'sq-cookie-consent',
  }))

  return import('../analytics')
}

// ---------------------------------------------------------------------------
// Payload capture — intercept JSON.stringify calls via sendBeacon mock
// ---------------------------------------------------------------------------
// We capture the payload by hooking into the Blob constructor. jsdom's Blob
// doesn't have .text()/.arrayBuffer(), so we store the raw input.
let capturedPayloads: unknown[] = []
const OriginalBlob = globalThis.Blob

class CapturingBlob extends OriginalBlob {
  __raw: string
  constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
    super(parts, options)
    this.__raw = parts ? String(parts[0]) : ''
    capturedPayloads.push(JSON.parse(this.__raw))
  }
}

// Replace Blob globally so the analytics module uses our capturing version
globalThis.Blob = CapturingBlob as any

function getLastCapturedPayload() {
  return capturedPayloads[capturedPayloads.length - 1] as any
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('analytics', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  let sendBeaconSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorageMock.clear()
    capturedPayloads = []
    vi.useFakeTimers()
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response())
    sendBeaconSpy = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconSpy,
      writable: true,
      configurable: true,
    })

    // Reset DEV/PROD
    import.meta.env.DEV = false
    import.meta.env.PROD = true
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // =========================================================================
  // Consent handling
  // =========================================================================
  describe('hasAnalyticsConsent (via shouldTrack)', () => {
    it('should NOT track when no consent in localStorage', async () => {
      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('squad_created')
      flushAnalytics()
      expect(sendBeaconSpy).not.toHaveBeenCalled()
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should NOT track when consent is "essential"', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'essential')
      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('squad_created')
      flushAnalytics()
      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('should NOT track when consent is "rejected"', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'rejected')
      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('squad_created')
      flushAnalytics()
      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('should track when consent is "accepted"', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('squad_created')
      flushAnalytics()
      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // Configuration
  // =========================================================================
  describe('isPostHogConfigured', () => {
    it('should NOT track when POSTHOG_KEY is empty string', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImportNoKey()
      trackEvent('squad_created')
      flushAnalytics()
      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // initAnalytics
  // =========================================================================
  describe('initAnalytics', () => {
    it('should only initialize once (idempotent)', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const addListenerSpy = vi.spyOn(window, 'addEventListener')
      const { initAnalytics } = await freshImport()

      initAnalytics()
      initAnalytics()

      const calls = addListenerSpy.mock.calls.filter((c) => c[0] === 'beforeunload')
      expect(calls.length).toBe(1)
    })

    it('should not add listener when PostHog is not configured', async () => {
      const addListenerSpy = vi.spyOn(window, 'addEventListener')
      const { initAnalytics } = await freshImportNoKey()

      initAnalytics()

      const calls = addListenerSpy.mock.calls.filter((c) => c[0] === 'beforeunload')
      expect(calls.length).toBe(0)
    })

    it('should log info in DEV mode when PostHog is configured', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const { initAnalytics } = await freshImportDev()

      initAnalytics()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] PostHog initialized:',
        expect.objectContaining({ host: expect.any(String) })
      )
    })

    it('should log info in DEV mode when PostHog is NOT configured', async () => {
      vi.resetModules()
      import.meta.env.VITE_POSTHOG_KEY = ''
      import.meta.env.DEV = true
      import.meta.env.PROD = false
      vi.doMock('../../components/CookieConsent', () => ({
        COOKIE_CONSENT_KEY: 'sq-cookie-consent',
      }))

      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const { initAnalytics } = await import('../analytics')

      initAnalytics()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] PostHog not configured. Set VITE_POSTHOG_KEY to enable.'
      )
    })

    it('should not log in PROD mode', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const { initAnalytics } = await freshImport()

      initAnalytics()

      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // trackEvent
  // =========================================================================
  describe('trackEvent', () => {
    it('should not queue events without consent', async () => {
      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('squad_created', { squad_id: '123' })
      flushAnalytics()
      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('should queue events and flush with consent', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('squad_created', { squad_id: '123' })
      flushAnalytics()
      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
    })

    it('should include correct payload structure', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('premium_viewed', { source: 'settings' })
      flushAnalytics()

      const payload = getLastCapturedPayload()

      expect(payload.api_key).toBe('phc_test_key_123')
      expect(payload.batch).toHaveLength(1)
      expect(payload.batch[0].event).toBe('premium_viewed')
      expect(payload.batch[0].properties.source).toBe('settings')
      expect(payload.batch[0].properties.$pathname).toBeDefined()
      expect(payload.batch[0].properties.$timestamp).toBeDefined()
      expect(payload.batch[0].timestamp).toBeDefined()
      expect(payload.batch[0].distinct_id).toBe('anonymous')
    })

    it('should log in DEV mode', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const { trackEvent } = await freshImportDev()

      trackEvent('squad_joined', { squad_id: 'abc' })

      expect(consoleSpy).toHaveBeenCalledWith('[Analytics]', 'squad_joined', { squad_id: 'abc' })
    })

    it('should track events without optional properties', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('session_viewed')
      flushAnalytics()

      const payload = getLastCapturedPayload()
      expect(payload.batch[0].event).toBe('session_viewed')
    })

    it('should handle all UserEvent types without error', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent } = await freshImport()

      const events = [
        'squad_created',
        'squad_joined',
        'squad_left',
        'session_created',
        'session_viewed',
        'session_joined',
        'session_left',
        'rsvp_viewed',
        'rsvp_submitted',
        'rsvp_changed',
        'premium_viewed',
        'premium_checkout_started',
        'premium_subscribed',
        'premium_cancelled',
        'onboarding_started',
        'onboarding_step_completed',
        'onboarding_skipped',
        'onboarding_finished',
        'invite_sent',
        'message_sent',
        'voice_call_started',
        'voice_call_ended',
        'command_palette_opened',
        'search_performed',
        'notification_clicked',
      ] as const

      for (const event of events) {
        expect(() => trackEvent(event)).not.toThrow()
      }
    })

    it('should handle undefined property values', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('squad_created', { optional_field: undefined })
      flushAnalytics()

      const payload = getLastCapturedPayload()
      expect(payload.batch[0].properties.optional_field).toBeUndefined()
    })

    it('should handle boolean and number property values', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('premium_viewed', { is_premium: true, view_count: 42 })
      flushAnalytics()

      const payload = getLastCapturedPayload()
      expect(payload.batch[0].properties.is_premium).toBe(true)
      expect(payload.batch[0].properties.view_count).toBe(42)
    })
  })

  // =========================================================================
  // Event batching
  // =========================================================================
  describe('event batching', () => {
    it('should flush after FLUSH_INTERVAL (5000ms)', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent } = await freshImport()

      trackEvent('squad_created')
      expect(sendBeaconSpy).not.toHaveBeenCalled()

      vi.advanceTimersByTime(5000)
      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
    })

    it('should auto-flush when buffer reaches MAX_BUFFER_SIZE (20)', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent } = await freshImport()

      for (let i = 0; i < 19; i++) {
        trackEvent('squad_created')
      }
      expect(sendBeaconSpy).not.toHaveBeenCalled()

      trackEvent('squad_created')
      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)

      const payload = getLastCapturedPayload()
      expect(payload.batch).toHaveLength(20)
    })

    it('should reset flush timer on each new event', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent } = await freshImport()

      trackEvent('squad_created')
      vi.advanceTimersByTime(4000)
      expect(sendBeaconSpy).not.toHaveBeenCalled()

      trackEvent('squad_joined')
      vi.advanceTimersByTime(4000)
      expect(sendBeaconSpy).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1000)
      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
    })

    it('should batch multiple events together', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent } = await freshImport()

      trackEvent('squad_created')
      trackEvent('session_viewed')
      trackEvent('rsvp_submitted')

      vi.advanceTimersByTime(5000)

      const payload = getLastCapturedPayload()
      expect(payload.batch).toHaveLength(3)
      expect(payload.batch[0].event).toBe('squad_created')
      expect(payload.batch[1].event).toBe('session_viewed')
      expect(payload.batch[2].event).toBe('rsvp_submitted')
    })

    it('should auto-flush multiple times at buffer capacity', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent } = await freshImport()

      for (let i = 0; i < 50; i++) {
        trackEvent('squad_created')
      }

      expect(sendBeaconSpy).toHaveBeenCalledTimes(2)
    })
  })

  // =========================================================================
  // flushEvents internals
  // =========================================================================
  describe('flushEvents', () => {
    it('should not flush when queue is empty', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { flushAnalytics } = await freshImport()
      flushAnalytics()
      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('should clear queue when consent is revoked', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImport()

      trackEvent('squad_created')
      localStorageMock.setItem('sq-cookie-consent', 'rejected')
      flushAnalytics()

      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('should use sendBeacon when available', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImport()

      trackEvent('squad_created')
      flushAnalytics()

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
      expect(sendBeaconSpy.mock.calls[0][0]).toBe('https://test.posthog.com/capture/')
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should fallback to fetch when sendBeacon is unavailable', async () => {
      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImport()

      trackEvent('squad_created')
      flushAnalytics()
      await vi.advanceTimersByTimeAsync(0)

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://test.posthog.com/capture/',
        expect.objectContaining({ method: 'POST', keepalive: true })
      )
    })

    it('should warn on fetch error in DEV mode', async () => {
      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      fetchSpy.mockRejectedValueOnce(new Error('network error'))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { trackEvent, flushAnalytics } = await freshImportDev()
      trackEvent('squad_created')
      flushAnalytics()
      await vi.advanceTimersByTimeAsync(0)

      expect(warnSpy).toHaveBeenCalledWith('[Analytics] Failed to send events:', expect.any(Error))
    })

    it('should silently fail on fetch error in PROD mode', async () => {
      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      fetchSpy.mockRejectedValueOnce(new Error('network error'))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { trackEvent, flushAnalytics } = await freshImport()
      trackEvent('squad_created')
      flushAnalytics()
      await vi.advanceTimersByTimeAsync(0)

      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('should use default POSTHOG_HOST when env var is empty', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImportEmptyHost()

      trackEvent('squad_created')
      flushAnalytics()

      expect(sendBeaconSpy.mock.calls[0][0]).toBe('https://eu.i.posthog.com/capture/')
    })
  })

  // =========================================================================
  // trackPageView
  // =========================================================================
  describe('trackPageView', () => {
    it('should not track without consent', async () => {
      const { trackPageView, flushAnalytics } = await freshImport()
      trackPageView('/squads/123')
      flushAnalytics()
      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('should track page view with consent', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackPageView, flushAnalytics } = await freshImport()

      trackPageView('/squads/123')
      flushAnalytics()

      const payload = getLastCapturedPayload()
      expect(payload.batch[0].event).toBe('$pageview')
      expect(payload.batch[0].properties.$pathname).toBe('/squads/123')
      expect(payload.batch[0].properties.$current_url).toBeDefined()
      expect(payload.batch[0].properties.$referrer).toBeDefined()
      expect(payload.batch[0].properties.$title).toBeDefined()
    })

    it('should log in DEV mode', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const { trackPageView } = await freshImportDev()

      trackPageView('/premium')

      expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Page view:', '/premium')
    })

    it('should track multiple page views', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackPageView, flushAnalytics } = await freshImport()

      trackPageView('/home')
      trackPageView('/squads')
      trackPageView('/profile')
      flushAnalytics()

      const payload = getLastCapturedPayload()
      expect(payload.batch).toHaveLength(3)
    })
  })

  // =========================================================================
  // identifyUser
  // =========================================================================
  describe('identifyUser', () => {
    it('should always set userId even without consent', async () => {
      const { identifyUser } = await freshImport()
      expect(() => identifyUser('user-456')).not.toThrow()
    })

    it('should not queue identify event without consent', async () => {
      const { identifyUser, flushAnalytics } = await freshImport()
      identifyUser('user-123', { plan: 'premium' })
      flushAnalytics()
      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('should queue identify event with consent and traits', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { identifyUser, flushAnalytics } = await freshImport()

      identifyUser('user-123', { username: 'john', plan: 'premium' })
      flushAnalytics()

      const payload = getLastCapturedPayload()
      expect(payload.batch[0].$set.username).toBe('john')
      expect(payload.batch[0].$set.plan).toBe('premium')
      expect(payload.batch[0].$set.$identified_at).toBeDefined()
      expect(payload.batch[0].distinct_id).toBe('user-123')
    })

    it('should set distinct_id for subsequent events', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { identifyUser, trackEvent, flushAnalytics } = await freshImport()

      identifyUser('user-789')
      trackEvent('squad_created')
      flushAnalytics()

      const payload = getLastCapturedPayload()
      expect(payload.batch[0].distinct_id).toBe('user-789')
      expect(payload.batch[1].distinct_id).toBe('user-789')
    })

    it('should log in DEV mode', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const { identifyUser } = await freshImportDev()

      identifyUser('user-999', { role: 'admin' })

      expect(consoleSpy).toHaveBeenCalledWith('[Analytics] User identified:', 'user-999', {
        role: 'admin',
      })
    })

    it('should work without traits', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { identifyUser, flushAnalytics } = await freshImport()

      identifyUser('user-no-traits')
      flushAnalytics()

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
      const payload = getLastCapturedPayload()
      expect(payload.batch[0].$set.$identified_at).toBeDefined()
      expect(payload.batch[0].distinct_id).toBe('user-no-traits')
    })
  })

  // =========================================================================
  // resetAnalytics
  // =========================================================================
  describe('resetAnalytics', () => {
    it('should clear event queue so flush sends nothing', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, resetAnalytics, flushAnalytics } = await freshImport()

      trackEvent('squad_created')
      trackEvent('session_viewed')
      resetAnalytics()
      flushAnalytics()

      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('should clear the flush timer', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, resetAnalytics } = await freshImport()

      trackEvent('squad_created')
      resetAnalytics()

      vi.advanceTimersByTime(10000)
      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('should reset userId to anonymous', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { identifyUser, resetAnalytics, trackEvent, flushAnalytics } = await freshImport()

      identifyUser('user-123')
      resetAnalytics()

      trackEvent('squad_created')
      flushAnalytics()

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
      const payload = getLastCapturedPayload()
      expect(payload.batch[0].distinct_id).toBe('anonymous')
    })

    it('should be safe to call multiple times', async () => {
      const { resetAnalytics } = await freshImport()
      expect(() => {
        resetAnalytics()
        resetAnalytics()
      }).not.toThrow()
    })
  })

  // =========================================================================
  // flushAnalytics
  // =========================================================================
  describe('flushAnalytics', () => {
    it('should flush pending events immediately', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { trackEvent, flushAnalytics } = await freshImport()

      trackEvent('squad_created')
      flushAnalytics()

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
    })

    it('should be safe to call with empty queue', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')
      const { flushAnalytics } = await freshImport()
      expect(() => flushAnalytics()).not.toThrow()
    })
  })
})
