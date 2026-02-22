import { useRef, useCallback } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

/**
 * Hook for detecting swipe gestures on touch devices.
 * Attaches to any element via ref.
 */
export function useSwipeGesture(options: SwipeOptions) {
  const { threshold = 50 } = options
  const startX = useRef(0)
  const startY = useRef(0)
  const startTime = useRef(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    startTime.current = Date.now()
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - startX.current
      const deltaY = e.changedTouches[0].clientY - startY.current
      const deltaTime = Date.now() - startTime.current

      // Only count fast swipes (< 300ms)
      if (deltaTime > 300) return

      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Horizontal swipe
      if (absDeltaX > threshold && absDeltaX > absDeltaY) {
        if (deltaX > 0) options.onSwipeRight?.()
        else options.onSwipeLeft?.()
      }
      // Vertical swipe
      else if (absDeltaY > threshold && absDeltaY > absDeltaX) {
        if (deltaY > 0) options.onSwipeDown?.()
        else options.onSwipeUp?.()
      }
    },
    [options, threshold]
  )

  return { onTouchStart, onTouchEnd }
}

export default useSwipeGesture
