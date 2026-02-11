/**
 * View Transitions API hook - PHASE 4.1
 * Provides smooth page transitions using the native View Transitions API
 */

import { useCallback } from 'react'
import { useNavigate, type NavigateOptions } from 'react-router'

// Check if View Transitions API is supported
export function isViewTransitionSupported(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document
}

// Helper to safely call startViewTransition
function startTransition(callback: () => void | Promise<void>): void {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void | Promise<void>) => unknown
  }
  if (doc.startViewTransition) {
    doc.startViewTransition(callback)
  } else {
    callback()
  }
}

/**
 * Hook that wraps navigation with View Transitions API
 * Falls back to regular navigation if not supported
 */
export function useViewTransitionNavigate() {
  const navigate = useNavigate()

  const navigateWithTransition = useCallback(
    (to: string | number, options?: NavigateOptions) => {
      // Handle back/forward navigation
      if (typeof to === 'number') {
        if (isViewTransitionSupported()) {
          startTransition(() => navigate(to))
        } else {
          navigate(to)
        }
        return
      }

      // Handle path navigation
      if (isViewTransitionSupported()) {
        startTransition(() => navigate(to, options))
      } else {
        navigate(to, options)
      }
    },
    [navigate]
  )

  return navigateWithTransition
}

/**
 * Standalone function to trigger a view transition for any update
 * Useful for non-navigation transitions (e.g., theme changes, list updates)
 */
export function withViewTransition(callback: () => void | Promise<void>): void {
  if (isViewTransitionSupported()) {
    startTransition(callback)
  } else {
    callback()
  }
}
