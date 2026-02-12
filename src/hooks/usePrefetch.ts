import { useCallback, useRef } from 'react'
import { prefetchRoute, prefetchSquadDetail } from '../lib/queryClient'

// Track already-prefetched routes to avoid duplicate work
const prefetchedRoutes = new Set<string>()

/**
 * Detects if the device is primarily touch-based.
 * Prefetching on hover doesn't make sense on touch devices.
 */
function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

interface UsePrefetchOptions {
  /** Debounce delay in ms (default 200) */
  debounce?: number
  /** User ID for authenticated prefetching */
  userId?: string
}

/**
 * usePrefetch - Prefetches route data on hover/intent.
 *
 * Returns event handlers to attach to navigation links.
 * - Debounces to avoid prefetching on quick mouse movements
 * - Only works on desktop (skips touch devices)
 * - Tracks prefetched routes to avoid redundant requests
 */
export function usePrefetch({ debounce = 200, userId }: UsePrefetchOptions = {}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /**
   * Create onPointerEnter handler for a route path.
   * Attach to `<Link>` or nav item wrapper.
   */
  const createPrefetchHandler = useCallback(
    (route: string) => {
      return () => {
        // Skip on touch devices
        if (isTouchDevice()) return
        // Skip if already prefetched
        if (prefetchedRoutes.has(route)) return

        clearTimer()
        timerRef.current = setTimeout(() => {
          prefetchedRoutes.add(route)
          prefetchRoute(route, userId).catch(() => {
            // Remove from set so it can be retried
            prefetchedRoutes.delete(route)
          })
        }, debounce)
      }
    },
    [debounce, userId, clearTimer]
  )

  /**
   * Create onPointerEnter handler for a squad detail.
   */
  const createSquadPrefetchHandler = useCallback(
    (squadId: string) => {
      return () => {
        if (isTouchDevice()) return
        const key = `squad:${squadId}`
        if (prefetchedRoutes.has(key)) return

        clearTimer()
        timerRef.current = setTimeout(() => {
          prefetchedRoutes.add(key)
          prefetchSquadDetail(squadId).catch(() => {
            prefetchedRoutes.delete(key)
          })
        }, debounce)
      }
    },
    [debounce, clearTimer]
  )

  /**
   * Cancel any pending prefetch (attach to onPointerLeave).
   */
  const cancelPrefetch = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  /**
   * Reset prefetch cache (e.g. after logout).
   */
  const resetPrefetchCache = useCallback(() => {
    prefetchedRoutes.clear()
  }, [])

  return {
    createPrefetchHandler,
    createSquadPrefetchHandler,
    cancelPrefetch,
    resetPrefetchCache,
  }
}
