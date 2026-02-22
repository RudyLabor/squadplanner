import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSwipeGesture } from '../useSwipeGesture'

// Helper to create synthetic touch events
function makeTouchEvent(
  type: 'touchstart' | 'touchend',
  clientX: number,
  clientY: number
): React.TouchEvent {
  const touch = { clientX, clientY } as React.Touch
  return {
    touches: type === 'touchstart' ? [touch] : [],
    changedTouches: [touch],
  } as unknown as React.TouchEvent
}

describe('useSwipeGesture', () => {
  it('returns onTouchStart and onTouchEnd handlers', () => {
    const { result } = renderHook(() => useSwipeGesture({}))
    expect(typeof result.current.onTouchStart).toBe('function')
    expect(typeof result.current.onTouchEnd).toBe('function')
  })

  it('detects horizontal swipe right', () => {
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeRight, threshold: 50 }))

    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000) // touchstart
      .mockReturnValueOnce(1100) // touchend (100ms < 300ms)

    result.current.onTouchStart(makeTouchEvent('touchstart', 100, 200))
    result.current.onTouchEnd(makeTouchEvent('touchend', 200, 210)) // deltaX=100, deltaY=10

    expect(onSwipeRight).toHaveBeenCalledOnce()
  })

  it('detects horizontal swipe left', () => {
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft, threshold: 50 }))

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1100)

    result.current.onTouchStart(makeTouchEvent('touchstart', 300, 200))
    result.current.onTouchEnd(makeTouchEvent('touchend', 100, 210)) // deltaX=-200

    expect(onSwipeLeft).toHaveBeenCalledOnce()
  })

  it('detects vertical swipe down', () => {
    const onSwipeDown = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeDown, threshold: 50 }))

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1100)

    result.current.onTouchStart(makeTouchEvent('touchstart', 200, 100))
    result.current.onTouchEnd(makeTouchEvent('touchend', 210, 300)) // deltaY=200

    expect(onSwipeDown).toHaveBeenCalledOnce()
  })

  it('detects vertical swipe up', () => {
    const onSwipeUp = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeUp, threshold: 50 }))

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1100)

    result.current.onTouchStart(makeTouchEvent('touchstart', 200, 300))
    result.current.onTouchEnd(makeTouchEvent('touchend', 210, 100)) // deltaY=-200

    expect(onSwipeUp).toHaveBeenCalledOnce()
  })

  it('ignores slow swipes (> 300ms)', () => {
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeRight, threshold: 50 }))

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1400) // 400ms > 300ms

    result.current.onTouchStart(makeTouchEvent('touchstart', 100, 200))
    result.current.onTouchEnd(makeTouchEvent('touchend', 300, 200))

    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('ignores swipes below threshold', () => {
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeRight, threshold: 50 }))

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1100)

    result.current.onTouchStart(makeTouchEvent('touchstart', 100, 200))
    result.current.onTouchEnd(makeTouchEvent('touchend', 130, 200)) // deltaX=30 < threshold=50

    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('ignores diagonal swipes (ambiguous direction)', () => {
    const onSwipeRight = vi.fn()
    const onSwipeDown = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeRight, onSwipeDown, threshold: 50 })
    )

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1100)

    // Equal deltaX and deltaY - horizontal wins because absDeltaX > absDeltaY check
    result.current.onTouchStart(makeTouchEvent('touchstart', 100, 100))
    result.current.onTouchEnd(makeTouchEvent('touchend', 200, 200)) // deltaX=100, deltaY=100

    // When deltaX == deltaY, horizontal check (absDeltaX > absDeltaY) fails
    // vertical check (absDeltaY > absDeltaX) also fails - neither triggers
    expect(onSwipeRight).not.toHaveBeenCalled()
    expect(onSwipeDown).not.toHaveBeenCalled()
  })

  it('uses custom threshold', () => {
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeRight, threshold: 100 }))

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1100)

    result.current.onTouchStart(makeTouchEvent('touchstart', 100, 200))
    result.current.onTouchEnd(makeTouchEvent('touchend', 180, 200)) // deltaX=80 < threshold=100

    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('defaults threshold to 50px', () => {
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeRight }))

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1100)

    result.current.onTouchStart(makeTouchEvent('touchstart', 100, 200))
    result.current.onTouchEnd(makeTouchEvent('touchend', 160, 200)) // deltaX=60 > default 50

    expect(onSwipeRight).toHaveBeenCalledOnce()
  })
})
