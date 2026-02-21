import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfetti } from '../useConfetti'

describe('useConfetti', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts inactive', () => {
    const { result } = renderHook(() => useConfetti())
    expect(result.current.active).toBe(false)
  })

  it('fire() sets active to true', () => {
    const { result } = renderHook(() => useConfetti())
    act(() => {
      result.current.fire()
    })
    expect(result.current.active).toBe(true)
  })

  it('auto-deactivates after default duration (3500ms)', () => {
    const { result } = renderHook(() => useConfetti())
    act(() => {
      result.current.fire()
    })
    expect(result.current.active).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3499)
    })
    expect(result.current.active).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.active).toBe(false)
  })

  it('uses custom duration when passed to fire()', () => {
    const { result } = renderHook(() => useConfetti())
    act(() => {
      result.current.fire(1000)
    })
    expect(result.current.active).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.active).toBe(false)
  })

  it('respects custom defaultDuration', () => {
    const { result } = renderHook(() => useConfetti(5000))
    act(() => {
      result.current.fire()
    })

    act(() => {
      vi.advanceTimersByTime(4999)
    })
    expect(result.current.active).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.active).toBe(false)
  })

  it('cancel() stops the confetti immediately', () => {
    const { result } = renderHook(() => useConfetti())
    act(() => {
      result.current.fire()
    })
    expect(result.current.active).toBe(true)

    act(() => {
      result.current.cancel()
    })
    expect(result.current.active).toBe(false)
  })

  it('cancel() prevents auto-deactivation timer from firing', () => {
    const { result } = renderHook(() => useConfetti())
    act(() => {
      result.current.fire()
      result.current.cancel()
    })
    // Active should remain false even after timer would have fired
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.active).toBe(false)
  })

  it('fire() resets timer when called multiple times', () => {
    const { result } = renderHook(() => useConfetti(3500))
    act(() => {
      result.current.fire()
    })

    // Advance halfway
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.active).toBe(true)

    // Fire again - should reset the timer
    act(() => {
      result.current.fire()
    })

    // Advance past original timer (2000 + 2000 = 4000 > 3500)
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    // Should still be active because timer was reset
    expect(result.current.active).toBe(true)

    // Now advance to when new timer fires (3500 total from second fire)
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(result.current.active).toBe(false)
  })

  it('cleans up timer on unmount', () => {
    const { result, unmount } = renderHook(() => useConfetti())
    act(() => {
      result.current.fire()
    })
    unmount()
    // Should not throw after unmount
    act(() => {
      vi.advanceTimersByTime(5000)
    })
  })
})
