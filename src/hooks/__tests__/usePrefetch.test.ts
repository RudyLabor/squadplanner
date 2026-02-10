import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../lib/queryClient', () => ({
  prefetchRoute: vi.fn().mockResolvedValue(undefined),
  prefetchSquadDetail: vi.fn().mockResolvedValue(undefined),
}))

import { usePrefetch } from '../usePrefetch'
import { prefetchRoute, prefetchSquadDetail } from '../../lib/queryClient'

describe('usePrefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Mock non-touch device
    delete (window as any).ontouchstart
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns handler functions', () => {
    const { result } = renderHook(() => usePrefetch())

    expect(result.current.createPrefetchHandler).toBeDefined()
    expect(result.current.createSquadPrefetchHandler).toBeDefined()
    expect(result.current.cancelPrefetch).toBeDefined()
    expect(result.current.resetPrefetchCache).toBeDefined()
  })

  it('prefetches route on hover after debounce', () => {
    const { result } = renderHook(() => usePrefetch({ debounce: 100, userId: 'user-1' }))

    // Reset the internal module-level Set to avoid cross-test pollution
    act(() => { result.current.resetPrefetchCache() })

    // Use a unique route path for this test
    const handler = result.current.createPrefetchHandler('/test-prefetch-1')

    act(() => {
      handler()
    })

    // Should not be called immediately
    expect(prefetchRoute).not.toHaveBeenCalled()

    // Advance timer past debounce
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(prefetchRoute).toHaveBeenCalledWith('/test-prefetch-1', 'user-1')
  })

  it('cancels prefetch on pointer leave', () => {
    const { result } = renderHook(() => usePrefetch({ debounce: 200 }))
    act(() => { result.current.resetPrefetchCache() })

    const handler = result.current.createPrefetchHandler('/test-cancel')

    act(() => {
      handler()
    })

    act(() => {
      result.current.cancelPrefetch()
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(prefetchRoute).not.toHaveBeenCalled()
  })

  it('does not prefetch same route twice', () => {
    const { result } = renderHook(() => usePrefetch({ debounce: 50 }))
    act(() => { result.current.resetPrefetchCache() })

    const handler = result.current.createPrefetchHandler('/test-dedup')

    // First hover
    act(() => { handler() })
    act(() => { vi.advanceTimersByTime(100) })

    expect(prefetchRoute).toHaveBeenCalledTimes(1)

    // Second hover on same route
    act(() => { handler() })
    act(() => { vi.advanceTimersByTime(100) })

    // Should still be 1 call (deduped)
    expect(prefetchRoute).toHaveBeenCalledTimes(1)
  })

  it('prefetches squad detail on hover', () => {
    const { result } = renderHook(() => usePrefetch({ debounce: 50 }))
    act(() => { result.current.resetPrefetchCache() })

    const handler = result.current.createSquadPrefetchHandler('squad-unique-1')

    act(() => { handler() })
    act(() => { vi.advanceTimersByTime(100) })

    expect(prefetchSquadDetail).toHaveBeenCalledWith('squad-unique-1')
  })

  it('resets prefetch cache', () => {
    const { result } = renderHook(() => usePrefetch({ debounce: 50 }))
    act(() => { result.current.resetPrefetchCache() })

    // Prefetch a unique route
    const handler = result.current.createPrefetchHandler('/test-reset')
    act(() => { handler() })
    act(() => { vi.advanceTimersByTime(100) })
    expect(prefetchRoute).toHaveBeenCalledTimes(1)

    // Reset cache
    act(() => { result.current.resetPrefetchCache() })

    // Now same route should be prefetched again
    act(() => { handler() })
    act(() => { vi.advanceTimersByTime(100) })

    expect(prefetchRoute).toHaveBeenCalledTimes(2)
  })

  it('skips prefetch on touch devices', () => {
    // Mock touch device
    ;(window as any).ontouchstart = true

    const { result } = renderHook(() => usePrefetch({ debounce: 50 }))
    act(() => { result.current.resetPrefetchCache() })

    const handler = result.current.createPrefetchHandler('/test-touch')

    act(() => { handler() })
    act(() => { vi.advanceTimersByTime(100) })

    expect(prefetchRoute).not.toHaveBeenCalled()
  })
})
