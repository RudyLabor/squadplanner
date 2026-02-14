import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDelayedLoading } from '../useDelayedLoading'

describe('useDelayedLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('showSpinner is false initially when isLoading is false', () => {
    const { result } = renderHook(() => useDelayedLoading(false))
    expect(result.current.showSpinner).toBe(false)
  })

  it('showSpinner stays false before delay when isLoading is true', () => {
    const { result } = renderHook(() => useDelayedLoading(true))

    // Advance less than default 300ms
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.showSpinner).toBe(false)
  })

  it('showSpinner becomes true after delay when isLoading is true', () => {
    const { result } = renderHook(() => useDelayedLoading(true))

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.showSpinner).toBe(true)
  })

  it('showSpinner resets to false when isLoading becomes false before delay', () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useDelayedLoading(isLoading),
      { initialProps: { isLoading: true } }
    )

    // Advance part of the delay
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current.showSpinner).toBe(false)

    // Set isLoading to false before the timer fires
    rerender({ isLoading: false })

    // Advance past the original delay
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.showSpinner).toBe(false)
  })

  it('custom delayMs works correctly', () => {
    const { result } = renderHook(() => useDelayedLoading(true, 500))

    // At 300ms (default), spinner should still be hidden
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.showSpinner).toBe(false)

    // At 500ms (custom delay), spinner should show
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.showSpinner).toBe(true)
  })

  it('showSpinner resets to false when isLoading becomes false after spinner is shown', () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useDelayedLoading(isLoading),
      { initialProps: { isLoading: true } }
    )

    // Let spinner appear
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.showSpinner).toBe(true)

    // Stop loading
    rerender({ isLoading: false })
    expect(result.current.showSpinner).toBe(false)
  })
})
