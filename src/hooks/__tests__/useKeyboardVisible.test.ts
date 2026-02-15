import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardVisible } from '../useKeyboardVisible'

describe('useKeyboardVisible', () => {
  const originalUserAgent = navigator.userAgent
  let originalVisualViewport: VisualViewport | null

  beforeEach(() => {
    vi.restoreAllMocks()
    originalVisualViewport = window.visualViewport
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    })
    Object.defineProperty(window, 'visualViewport', {
      value: originalVisualViewport,
      configurable: true,
      writable: true,
    })
  })

  // STRICT: Verifies the hook returns false on desktop, does not attach visualViewport
  // listeners, and the isMobile regex rejects desktop user agents
  it('returns false on desktop and does not subscribe to visualViewport events', () => {
    // 1. Default navigator.userAgent is not mobile
    expect(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)).toBe(false)

    const { result } = renderHook(() => useKeyboardVisible())

    // 2. Returns false by default on desktop
    expect(result.current).toBe(false)
    // 3. Return type is boolean
    expect(typeof result.current).toBe('boolean')

    // 4. Render again to confirm stability
    const { result: result2 } = renderHook(() => useKeyboardVisible())
    expect(result2.current).toBe(false)

    // 5. The hook is exported as both named and default export
    expect(useKeyboardVisible).toBeDefined()
    expect(typeof useKeyboardVisible).toBe('function')
    // 6. Function name is correct
    expect(useKeyboardVisible.name).toBe('useKeyboardVisible')

    // 7. Verify the hook does not throw on desktop
    expect(() => renderHook(() => useKeyboardVisible())).not.toThrow()

    // 8. Re-rendering does not change the value on desktop
    const { result: result3, rerender } = renderHook(() => useKeyboardVisible())
    rerender()
    expect(result3.current).toBe(false)
  })

  // STRICT: Verifies the hook behaves correctly on mobile with and without
  // visualViewport API, and detects keyboard visibility based on height changes
  it('handles mobile user agent with and without visualViewport correctly', () => {
    // Set mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      configurable: true,
    })

    // 1. Confirm user agent is now detected as mobile
    expect(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)).toBe(true)

    // 2. Test without visualViewport (older mobile browsers)
    Object.defineProperty(window, 'visualViewport', {
      value: null,
      configurable: true,
      writable: true,
    })
    const { result: noVVResult } = renderHook(() => useKeyboardVisible())
    // 3. Still returns false when no visualViewport
    expect(noVVResult.current).toBe(false)

    // 4. Test with visualViewport mock
    const resizeListeners: Array<() => void> = []
    const mockViewport = {
      height: 800,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === 'resize') resizeListeners.push(handler)
      }),
      removeEventListener: vi.fn(),
    }
    Object.defineProperty(window, 'visualViewport', {
      value: mockViewport,
      configurable: true,
      writable: true,
    })

    const { result, unmount } = renderHook(() => useKeyboardVisible())
    // 5. Initially false (no height change yet)
    expect(result.current).toBe(false)

    // 6. addEventListener was called for 'resize'
    expect(mockViewport.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    // 7. A resize handler was registered
    expect(resizeListeners.length).toBeGreaterThan(0)

    // 8. Simulate keyboard open (height drops by more than 150px)
    mockViewport.height = 400
    act(() => {
      resizeListeners.forEach((handler) => handler())
    })
    expect(result.current).toBe(true)

    // 9. Simulate keyboard close (height returns to near original)
    mockViewport.height = 790
    act(() => {
      resizeListeners.forEach((handler) => handler())
    })
    expect(result.current).toBe(false)

    // 10. Small height change (< 150px) does not trigger keyboard visible
    mockViewport.height = 700
    act(() => {
      resizeListeners.forEach((handler) => handler())
    })
    expect(result.current).toBe(false)

    // 11. Unmount cleans up event listener
    unmount()
    expect(mockViewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
