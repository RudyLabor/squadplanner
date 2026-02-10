import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from '../useReducedMotion'

describe('useReducedMotion', () => {
  let matchMediaListeners: Map<string, (e: { matches: boolean }) => void>

  beforeEach(() => {
    matchMediaListeners = new Map()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, handler: (e: { matches: boolean }) => void) => {
          matchMediaListeners.set(event, handler)
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('returns false by default when reduced motion is not preferred', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when reduced motion is preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('updates when media query changes', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    // Simulate media query change
    const changeHandler = matchMediaListeners.get('change')
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: true })
      })
      expect(result.current).toBe(true)
    }
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListener = vi.fn()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener,
        dispatchEvent: vi.fn(),
      })),
    })

    const { unmount } = renderHook(() => useReducedMotion())
    unmount()

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
