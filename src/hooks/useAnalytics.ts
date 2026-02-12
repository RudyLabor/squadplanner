/**
 * React hook for analytics tracking
 * Provides a convenient API for tracking events in components
 *
 * @example
 * const analytics = useAnalytics()
 *
 * // Track an event
 * analytics.track('squad_created', { game: 'valorant' })
 *
 * // Track on mount
 * useEffect(() => {
 *   analytics.track('premium_viewed', { source: 'navigation' })
 * }, [])
 */

import { useCallback } from 'react'
import { trackEvent, type UserEvent } from '../utils/analytics'

interface UseAnalyticsReturn {
  /**
   * Track a user event with optional properties
   */
  track: (
    event: UserEvent,
    properties?: Record<string, string | number | boolean | undefined>
  ) => void
}

export function useAnalytics(): UseAnalyticsReturn {
  const track = useCallback(
    (event: UserEvent, properties?: Record<string, string | number | boolean | undefined>) => {
      trackEvent(event, properties)
    },
    []
  )

  return { track }
}
