import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router'
import { create } from 'zustand'

interface NavigationProgressState {
  isNavigating: boolean
  start: () => void
  done: () => void
}

/**
 * Minimal store so the TopLoadingBar can subscribe without being
 * a child of the Router (or can be placed anywhere in the tree).
 */
export const useNavigationProgressStore = create<NavigationProgressState>((set) => ({
  isNavigating: false,
  start: () => set({ isNavigating: true }),
  done: () => set({ isNavigating: false }),
}))

/**
 * Detects route changes and drives the top loading bar.
 *
 * Because the app uses BrowserRouter (not a data router) there is no
 * built-in "navigation pending" event. Instead we mark `isNavigating`
 * on every location change and clear it after a short delay (the Suspense
 * fallback for lazy routes handles the visual gap).
 *
 * Place this hook once, inside the Router context (e.g. in AppContent).
 */
export function useNavigationProgress() {
  const location = useLocation()
  const { start, done } = useNavigationProgressStore()
  const prevPathRef = useRef(location.pathname)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const finish = useCallback(() => {
    clearTimeout(timerRef.current)
    // Small delay to let the page render before snapping to 100%
    timerRef.current = setTimeout(done, 80)
  }, [done])

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname
      start()
      // Auto-finish after the lazy import + render has had time
      finish()
    }
  }, [location.pathname, start, finish])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])
}
