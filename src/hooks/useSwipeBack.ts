import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { haptic, getHapticEnabled } from '../utils/haptics'

interface UseSwipeBackOptions {
  /** Width of the edge zone that activates swipe detection (default: 20px) */
  edgeWidth?: number
  /** Minimum swipe distance to trigger navigation (default: 100px) */
  threshold?: number
  /** Whether swipe back is enabled (default: true) */
  enabled?: boolean
}

interface UseSwipeBackReturn {
  /** Progress of the swipe gesture from 0 to 1 */
  swipeProgress: number
  /** Whether a swipe gesture is currently active */
  isSwiping: boolean
}

/**
 * Hook that enables iOS-like swipe-from-left-edge to navigate back.
 *
 * Detects touch start from the left edge of the screen (within `edgeWidth` pixels),
 * tracks horizontal swipe, and triggers `navigate(-1)` when the swipe distance
 * exceeds `threshold` with sufficient velocity.
 *
 * Provides haptic feedback when the threshold is reached and respects
 * `prefers-reduced-motion`. Only activates on mobile viewports (< 1024px).
 *
 * @example
 * ```tsx
 * function AppShell() {
 *   const { swipeProgress, isSwiping } = useSwipeBack()
 *   return (
 *     <div style={{ opacity: isSwiping ? 1 - swipeProgress * 0.3 : 1 }}>
 *       {children}
 *     </div>
 *   )
 * }
 * ```
 */
export function useSwipeBack(options?: UseSwipeBackOptions): UseSwipeBackReturn {
  const {
    edgeWidth = 20,
    threshold = 100,
    enabled = true,
  } = options ?? {}

  const navigate = useNavigate()
  const [swipeProgress, setSwipeProgress] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const currentXRef = useRef(0)
  const startTimeRef = useRef(0)
  const isTrackingRef = useRef(false)
  const hasTriggeredHapticRef = useRef(false)
  const isHorizontalRef = useRef<boolean | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const isMobile = useCallback(() => {
    return typeof window !== 'undefined' && window.innerWidth < 1024
  }, [])

  // Create/update the visual overlay indicator
  const updateOverlay = useCallback((progress: number) => {
    if (prefersReducedMotion.current) return

    if (progress > 0) {
      if (!overlayRef.current) {
        const overlay = document.createElement('div')
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 24px;
          pointer-events: none;
          z-index: 9999;
          transition: none;
        `
        document.body.appendChild(overlay)
        overlayRef.current = overlay
      }
      const opacity = Math.min(progress * 0.6, 0.4)
      overlayRef.current.style.background =
        `linear-gradient(to right, var(--color-primary) 0%, transparent 100%)`
      overlayRef.current.style.opacity = String(opacity)
      overlayRef.current.style.width = `${Math.min(progress * 60, 40)}px`
    } else if (overlayRef.current) {
      overlayRef.current.remove()
      overlayRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobile()) return

      const touch = e.touches[0]
      if (touch.clientX > edgeWidth) return

      startXRef.current = touch.clientX
      startYRef.current = touch.clientY
      currentXRef.current = touch.clientX
      startTimeRef.current = Date.now()
      isTrackingRef.current = true
      isHorizontalRef.current = null
      hasTriggeredHapticRef.current = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTrackingRef.current) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - startXRef.current
      const deltaY = touch.clientY - startYRef.current

      // Determine direction on first significant move
      if (isHorizontalRef.current === null) {
        const absDx = Math.abs(deltaX)
        const absDy = Math.abs(deltaY)
        if (absDx > 10 || absDy > 10) {
          isHorizontalRef.current = absDx > absDy
          if (!isHorizontalRef.current) {
            // Vertical scroll - abort tracking
            isTrackingRef.current = false
            setIsSwiping(false)
            setSwipeProgress(0)
            updateOverlay(0)
            return
          }
        } else {
          return
        }
      }

      // Only track right swipes
      if (deltaX < 0) {
        currentXRef.current = touch.clientX
        setSwipeProgress(0)
        updateOverlay(0)
        return
      }

      currentXRef.current = touch.clientX
      const progress = Math.min(deltaX / threshold, 1)
      setSwipeProgress(progress)
      setIsSwiping(true)
      updateOverlay(progress)

      // Haptic feedback when threshold is reached
      if (progress >= 1 && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true
        if (getHapticEnabled()) {
          haptic.light()
        }
      }
    }

    const handleTouchEnd = () => {
      if (!isTrackingRef.current) return

      const deltaX = currentXRef.current - startXRef.current
      const elapsed = Date.now() - startTimeRef.current
      const velocity = deltaX / Math.max(elapsed, 1)

      isTrackingRef.current = false
      setIsSwiping(false)
      setSwipeProgress(0)
      updateOverlay(0)

      if (deltaX > threshold && velocity > 0.3) {
        navigate(-1)
      }
    }

    const handleTouchCancel = () => {
      isTrackingRef.current = false
      setIsSwiping(false)
      setSwipeProgress(0)
      updateOverlay(0)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchCancel)
      if (overlayRef.current) {
        overlayRef.current.remove()
        overlayRef.current = null
      }
    }
  }, [enabled, edgeWidth, threshold, navigate, isMobile, updateOverlay])

  return { swipeProgress, isSwiping }
}
