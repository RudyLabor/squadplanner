import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const { mockTrackEvent } = vi.hoisted(() => {
  const mockTrackEvent = vi.fn()
  return { mockTrackEvent }
})

vi.mock('../../utils/analytics', () => ({
  trackEvent: mockTrackEvent,
}))

import { useAnalytics } from '../useAnalytics'

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an object with a track function', () => {
    const { result } = renderHook(() => useAnalytics())
    expect(result.current).toHaveProperty('track')
    expect(typeof result.current.track).toBe('function')
  })

  it('track calls trackEvent with correct event name', () => {
    const { result } = renderHook(() => useAnalytics())
    result.current.track('squad_created')
    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith('squad_created', undefined)
  })

  it('track calls trackEvent with event name and properties', () => {
    const { result } = renderHook(() => useAnalytics())
    const props = { game: 'valorant', count: 5, premium: true }
    result.current.track('session_created', props)
    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith('session_created', props)
  })

  it('track function is memoized (same reference across renders)', () => {
    const { result, rerender } = renderHook(() => useAnalytics())
    const firstTrack = result.current.track
    rerender()
    const secondTrack = result.current.track
    expect(firstTrack).toBe(secondTrack)
  })

  it('can call track multiple times', () => {
    const { result } = renderHook(() => useAnalytics())
    result.current.track('squad_created', { game: 'lol' })
    result.current.track('squad_joined', { source: 'invite' })
    expect(mockTrackEvent).toHaveBeenCalledTimes(2)
    expect(mockTrackEvent).toHaveBeenNthCalledWith(1, 'squad_created', { game: 'lol' })
    expect(mockTrackEvent).toHaveBeenNthCalledWith(2, 'squad_joined', { source: 'invite' })
  })

  it('passes undefined properties when none provided', () => {
    const { result } = renderHook(() => useAnalytics())
    result.current.track('squad_left')
    expect(mockTrackEvent).toHaveBeenCalledWith('squad_left', undefined)
  })
})
