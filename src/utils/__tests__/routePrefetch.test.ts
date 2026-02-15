/**
 * Tests for src/utils/routePrefetch.ts
 * Covers: prefetchProbableRoutes
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the dynamic imports for pages
vi.mock('../../pages/Home', () => ({ default: {} }))
vi.mock('../../pages/Messages', () => ({ default: {} }))
vi.mock('../../pages/Squads', () => ({ default: {} }))
vi.mock('../../pages/Sessions', () => ({ default: {} }))

import { prefetchProbableRoutes } from '../routePrefetch'

describe('routePrefetch', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  const originalRIC = window.requestIdleCallback

  beforeEach(() => {
    vi.useFakeTimers()
    appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node)

    // Provide requestIdleCallback if jsdom doesn't have it
    if (!window.requestIdleCallback) {
      (window as any).requestIdleCallback = (cb: IdleRequestCallback, _opts?: IdleRequestOptions) => {
        return setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline), 0) as unknown as number
      }
      ;(window as any).cancelIdleCallback = (id: number) => clearTimeout(id)
    }

    // Mock import.meta.env
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    // Restore original requestIdleCallback
    if (originalRIC) {
      window.requestIdleCallback = originalRIC
    }
  })

  it('should export prefetchProbableRoutes as a function', () => {
    expect(typeof prefetchProbableRoutes).toBe('function')
  })

  it('should not throw when called', () => {
    expect(() => prefetchProbableRoutes()).not.toThrow()
  })

  it('should schedule work via requestIdleCallback when available', () => {
    const mockRIC = vi.fn((cb: IdleRequestCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline)
      return 1
    })
    ;(window as any).requestIdleCallback = mockRIC

    prefetchProbableRoutes()

    expect(mockRIC).toHaveBeenCalled()
  })

  it('should create a preconnect link for supabase URL', () => {
    // Set up requestIdleCallback that calls callback synchronously
    ;(window as any).requestIdleCallback = (cb: IdleRequestCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline)
      return 1
    }

    prefetchProbableRoutes()

    expect(appendChildSpy).toHaveBeenCalled()
    const link = appendChildSpy.mock.calls[0]?.[0] as HTMLLinkElement
    expect(link.rel).toBe('preconnect')
    expect(link.href).toContain('https://test.supabase.co')
  })

  it('should not create preconnect link if VITE_SUPABASE_URL is empty', () => {
    import.meta.env.VITE_SUPABASE_URL = ''

    ;(window as any).requestIdleCallback = (cb: IdleRequestCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline)
      return 1
    }

    prefetchProbableRoutes()

    // Should not append any link element
    expect(appendChildSpy).not.toHaveBeenCalled()
  })

  it('should use setTimeout as fallback when requestIdleCallback is not available', () => {
    // Remove requestIdleCallback
    delete (window as any).requestIdleCallback

    prefetchProbableRoutes()

    // Advance past the 3000ms fallback timeout
    vi.advanceTimersByTime(3001)

    // Should have tried to add preconnect link
    expect(appendChildSpy).toHaveBeenCalled()
  })
})
