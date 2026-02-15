import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from '../useReducedMotion'

describe('useReducedMotion', () => {
  let matchMediaListeners: Map<string, (e: { matches: boolean }) => void>
  let mockRemoveEventListener: ReturnType<typeof vi.fn>
  let mockAddEventListener: ReturnType<typeof vi.fn>

  function setupMatchMedia(matches: boolean) {
    matchMediaListeners = new Map()
    mockRemoveEventListener = vi.fn()
    mockAddEventListener = vi.fn((event: string, handler: (e: { matches: boolean }) => void) => {
      matchMediaListeners.set(event, handler)
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      })),
    })
  }

  beforeEach(() => {
    setupMatchMedia(false)
  })

  // STRICT: Verifies the hook returns false when prefers-reduced-motion is not enabled,
  // queries the correct media query, and subscribes to change events
  it('returns false when reduced motion is not preferred and subscribes to change event', () => {
    setupMatchMedia(false)

    const { result } = renderHook(() => useReducedMotion())

    // 1. Returns false
    expect(result.current).toBe(false)
    // 2. Return type is boolean
    expect(typeof result.current).toBe('boolean')
    // 3. matchMedia was called with the correct query
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    // 4. addEventListener was called for 'change' event
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    // 5. A change handler was registered
    expect(matchMediaListeners.has('change')).toBe(true)
    // 6. matchMedia was called (at least for initial state + effect)
    expect(window.matchMedia).toHaveBeenCalled()
    // 7. The function is defined and named
    expect(useReducedMotion).toBeDefined()
    expect(typeof useReducedMotion).toBe('function')
    // 8. Value stays false on re-render
    const { result: r2, rerender } = renderHook(() => useReducedMotion())
    rerender()
    expect(r2.current).toBe(false)
  })

  // STRICT: Verifies the hook returns true when prefers-reduced-motion is enabled
  // from the start, and the media query object reports matches=true
  it('returns true when reduced motion is preferred from the start', () => {
    setupMatchMedia(true)

    const { result } = renderHook(() => useReducedMotion())

    // 1. Returns true
    expect(result.current).toBe(true)
    // 2. matchMedia was called
    expect(window.matchMedia).toHaveBeenCalled()
    // 3. Query string is correct
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    // 4. addEventListener was called
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    // 5. Value is stable on re-render
    const { result: r2, rerender } = renderHook(() => useReducedMotion())
    rerender()
    expect(r2.current).toBe(true)
    // 6. Two separate hook instances both return true
    const { result: r3 } = renderHook(() => useReducedMotion())
    expect(r3.current).toBe(true)
    // 7. Return is still boolean
    expect(typeof result.current).toBe('boolean')
    // 8. Change listener is registered
    expect(matchMediaListeners.size).toBeGreaterThan(0)
  })

  // STRICT: Verifies the hook reacts to live changes in the media query
  // (user toggles reduced motion in OS settings)
  it('updates reactively when media query changes at runtime', () => {
    setupMatchMedia(false)

    const { result } = renderHook(() => useReducedMotion())

    // 1. Initially false
    expect(result.current).toBe(false)

    // 2. Get the registered change handler
    const changeHandler = matchMediaListeners.get('change')
    expect(changeHandler).toBeDefined()

    // 3. Simulate user enabling reduced motion
    act(() => {
      changeHandler!({ matches: true })
    })
    // 4. Now returns true
    expect(result.current).toBe(true)

    // 5. Simulate user disabling reduced motion
    act(() => {
      changeHandler!({ matches: false })
    })
    // 6. Returns false again
    expect(result.current).toBe(false)

    // 7. Toggle rapidly
    act(() => {
      changeHandler!({ matches: true })
    })
    expect(result.current).toBe(true)
    act(() => {
      changeHandler!({ matches: true })
    })
    // 8. Idempotent: still true
    expect(result.current).toBe(true)
  })

  // STRICT: Verifies the hook properly cleans up the 'change' event listener
  // on unmount to prevent memory leaks
  it('cleans up event listener on unmount to prevent memory leaks', () => {
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

    // 1. removeEventListener not called yet (hook is mounted)
    expect(removeEventListener).not.toHaveBeenCalled()

    // 2. Unmount the hook
    unmount()

    // 3. removeEventListener was called
    expect(removeEventListener).toHaveBeenCalled()
    // 4. Called with 'change' event
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    // 5. Called exactly once
    expect(removeEventListener).toHaveBeenCalledTimes(1)

    // 6. The handler passed to removeEventListener is a function
    const handlerArg = removeEventListener.mock.calls[0][1]
    expect(typeof handlerArg).toBe('function')
    // 7. The event name is exactly 'change'
    const eventArg = removeEventListener.mock.calls[0][0]
    expect(eventArg).toBe('change')
    // 8. No other events were cleaned up
    expect(removeEventListener.mock.calls.length).toBe(1)
  })
})
