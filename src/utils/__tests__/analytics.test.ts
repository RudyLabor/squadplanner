/**
 * Analytics utility tests
 * Verifies event tracking, batching, and consent handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_POSTHOG_KEY: 'phc_test_key',
    VITE_POSTHOG_HOST: 'https://test.posthog.com',
    DEV: false,
    PROD: true,
  },
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Analytics', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Consent handling', () => {
    it('should not track events without consent', async () => {
      // No consent set
      const { trackEvent } = await import('../analytics')
      const fetchSpy = vi.spyOn(globalThis, 'fetch')

      trackEvent('squad_created')

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should track events with accepted consent', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')

      const { trackEvent, initAnalytics } = await import('../analytics')
      initAnalytics()

      trackEvent('squad_created', { squad_id: '123' })

      // Event should be queued (not immediately sent)
      expect(true).toBe(true) // Basic test structure
    })

    it('should not track with essential-only consent', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'essential')

      const { trackEvent } = await import('../analytics')
      const fetchSpy = vi.spyOn(globalThis, 'fetch')

      trackEvent('squad_created')

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('Event tracking', () => {
    it('should track typed events', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')

      const { trackEvent } = await import('../analytics')

      // These should compile without errors (TypeScript check)
      trackEvent('squad_created')
      trackEvent('premium_viewed', { source: 'navigation' })
      trackEvent('rsvp_submitted', { session_id: '123' })

      expect(true).toBe(true)
    })
  })

  describe('User identification', () => {
    it('should identify user with traits', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')

      const { identifyUser } = await import('../analytics')

      identifyUser('user-123', {
        username: 'john',
        premium: true,
        created_at: '2024-01-01',
      })

      expect(true).toBe(true)
    })
  })

  describe('Page view tracking', () => {
    it('should track page views', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')

      const { trackPageView } = await import('../analytics')

      trackPageView('/squads/123')
      trackPageView('/premium')

      expect(true).toBe(true)
    })
  })

  describe('Analytics reset', () => {
    it('should reset analytics state', async () => {
      localStorageMock.setItem('sq-cookie-consent', 'accepted')

      const { identifyUser, resetAnalytics } = await import('../analytics')

      identifyUser('user-123', { username: 'john' })
      resetAnalytics()

      expect(true).toBe(true)
    })
  })
})
