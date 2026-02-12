import { useEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router'

const MAX_STORED_POSITIONS = 50
const DEBOUNCE_MS = 100
const SESSION_KEY = 'scroll-positions'

/**
 * Hook that saves and restores scroll positions when navigating between routes.
 *
 * Stores scroll positions keyed by route path in sessionStorage (survives refreshes
 * within the same tab session). On navigating to a previously visited route, the
 * scroll position is restored via `requestAnimationFrame` for smoothness.
 *
 * Old entries are pruned once the map exceeds 50 entries.
 *
 * @param scrollContainerRef - Optional ref to a scrollable container element.
 *   If omitted, `window` scroll is used.
 *
 * @example
 * ```tsx
 * // At app root level (uses window scroll)
 * function App() {
 *   useScrollRestoration()
 *   return <Routes>...</Routes>
 * }
 *
 * // With a specific scroll container
 * function Layout() {
 *   const containerRef = useRef<HTMLDivElement>(null)
 *   useScrollRestoration(containerRef)
 *   return <div ref={containerRef} className="overflow-auto">...</div>
 * }
 * ```
 */
export function useScrollRestoration(scrollContainerRef?: RefObject<HTMLElement | null>): void {
  const { pathname } = useLocation()
  const previousPathRef = useRef<string>(pathname)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load stored positions from sessionStorage
  const getPositions = (): Record<string, number> => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  // Save positions to sessionStorage
  const savePositions = (positions: Record<string, number>) => {
    try {
      // Prune old entries if we exceed the limit
      const keys = Object.keys(positions)
      if (keys.length > MAX_STORED_POSITIONS) {
        const toRemove = keys.slice(0, keys.length - MAX_STORED_POSITIONS)
        for (const key of toRemove) {
          delete positions[key]
        }
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(positions))
    } catch {
      // sessionStorage may be full or unavailable - ignore
    }
  }

  const getScrollTop = (): number => {
    if (scrollContainerRef?.current) {
      return scrollContainerRef.current.scrollTop
    }
    return window.scrollY
  }

  const setScrollTop = (value: number) => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTop = value
    } else {
      window.scrollTo(0, value)
    }
  }

  // Save current scroll position on scroll events (debounced)
  useEffect(() => {
    const handleScroll = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        const positions = getPositions()
        positions[pathname] = getScrollTop()
        savePositions(positions)
      }, DEBOUNCE_MS)
    }

    const target = scrollContainerRef?.current ?? window
    target.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      target.removeEventListener('scroll', handleScroll)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, scrollContainerRef])

  // On route change: save previous position, restore new position
  useEffect(() => {
    const prevPath = previousPathRef.current

    if (prevPath !== pathname) {
      // Save the scroll position for the page we are leaving
      const positions = getPositions()
      // The debounced handler may not have fired yet, so capture current scroll
      positions[prevPath] = getScrollTop()
      savePositions(positions)

      // Restore scroll for the new route
      const savedScroll = positions[pathname]
      if (savedScroll != null && savedScroll > 0) {
        // Use rAF so the DOM has time to render the new page content
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setScrollTop(savedScroll)
          })
        })
      } else {
        // New page - scroll to top
        requestAnimationFrame(() => {
          setScrollTop(0)
        })
      }

      previousPathRef.current = pathname
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
}
