import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('../../utils/haptics', () => ({
  haptic: { light: vi.fn() },
  getHapticEnabled: () => false,
}))

import { useSwipeBack } from '../useSwipeBack'

describe('useSwipeBack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 })
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => useSwipeBack())

    expect(result.current.swipeProgress).toBe(0)
    expect(result.current.isSwiping).toBe(false)
  })

  it('does not start swiping from non-edge touch', () => {
    const { result } = renderHook(() => useSwipeBack())

    // Touch starts at x=50 (outside the edge zone of 20px)
    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 50, clientY: 100 } as Touch],
        })
      )
    })

    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 150, clientY: 100 } as Touch],
        })
      )
    })

    expect(result.current.isSwiping).toBe(false)
    expect(result.current.swipeProgress).toBe(0)
  })

  it('starts swiping from left edge', () => {
    const { result } = renderHook(() => useSwipeBack({ edgeWidth: 20, threshold: 100 }))

    // Touch starts at x=10 (inside edge zone)
    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 10, clientY: 100 } as Touch],
        })
      )
    })

    // Move right significantly
    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 60, clientY: 105 } as Touch],
        })
      )
    })

    expect(result.current.isSwiping).toBe(true)
    expect(result.current.swipeProgress).toBeGreaterThan(0)
  })

  it('resets on touch end without threshold', () => {
    const { result } = renderHook(() => useSwipeBack({ edgeWidth: 20, threshold: 200 }))

    // Start swipe from edge
    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 5, clientY: 100 } as Touch],
        })
      )
    })

    // Move slightly (not enough to trigger navigation)
    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 30, clientY: 105 } as Touch],
        })
      )
    })

    // End touch
    act(() => {
      document.dispatchEvent(new TouchEvent('touchend', { touches: [] }))
    })

    expect(result.current.isSwiping).toBe(false)
    expect(result.current.swipeProgress).toBe(0)
  })

  it('resets on touch cancel', () => {
    const { result } = renderHook(() => useSwipeBack({ edgeWidth: 20, threshold: 100 }))

    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 5, clientY: 100 } as Touch],
        })
      )
    })

    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 50, clientY: 105 } as Touch],
        })
      )
    })

    act(() => {
      document.dispatchEvent(new TouchEvent('touchcancel', { touches: [] }))
    })

    expect(result.current.isSwiping).toBe(false)
    expect(result.current.swipeProgress).toBe(0)
  })

  it('does not activate on desktop (> 1024px)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 })

    const { result } = renderHook(() => useSwipeBack())

    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 5, clientY: 100 } as Touch],
        })
      )
    })

    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 150, clientY: 100 } as Touch],
        })
      )
    })

    expect(result.current.isSwiping).toBe(false)
  })

  it('does not activate when disabled', () => {
    const { result } = renderHook(() => useSwipeBack({ enabled: false }))

    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 5, clientY: 100 } as Touch],
        })
      )
    })

    expect(result.current.isSwiping).toBe(false)
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListener = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() => useSwipeBack())
    unmount()

    expect(removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function))
  })
})
