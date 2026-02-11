import { memo, useRef, useCallback, useMemo } from 'react'
import { m, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Reply, Trash2, MoreHorizontal } from './icons'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { motion as motionTokens } from '../utils/motionTokens'

/** Swipe threshold in pixels to trigger an action */
const SWIPE_THRESHOLD = 60

/** Max drag distance in pixels */
const MAX_DRAG = 100

/** Spring config for snapping back */
const snapBackSpring = motionTokens.easing.springSnappy

interface SwipeableMessageProps {
  children: React.ReactNode
  /** Called when the user swipes left past the threshold (reply action) */
  onReply?: () => void
  /** Called when the user swipes right past the threshold (actions menu) */
  onActions?: () => void
  /** Enable swipe-left gesture (reply). Default: true */
  enableSwipeLeft?: boolean
  /** Enable swipe-right gesture (actions). Default: true */
  enableSwipeRight?: boolean
  /** Disable all swipe gestures */
  disabled?: boolean
}

/**
 * Wraps a message bubble with horizontal swipe gesture support.
 *
 * - Swipe LEFT to reveal a reply action indicator.
 * - Swipe RIGHT to reveal action buttons (delete, copy, etc.).
 *
 * Uses Framer Motion `drag="x"` for the gesture. Triggers haptic
 * feedback when the swipe crosses the activation threshold.
 * Respects `prefers-reduced-motion` by disabling drag when active.
 */
const SwipeableMessage = memo(function SwipeableMessage({
  children,
  onReply,
  onActions,
  enableSwipeLeft = true,
  enableSwipeRight = true,
  disabled = false,
}: SwipeableMessageProps) {
  const { triggerHaptic } = useHapticFeedback()
  const prefersReducedMotion = useReducedMotion()

  // Track whether we already fired haptic for the current gesture
  const hapticFiredRef = useRef(false)

  const x = useMotionValue(0)

  // Compute drag constraints based on enabled directions
  const dragConstraints = useMemo(() => ({
    left: enableSwipeLeft ? -MAX_DRAG : 0,
    right: enableSwipeRight ? MAX_DRAG : 0,
  }), [enableSwipeLeft, enableSwipeRight])

  // Opacity for left action indicator (reply) - visible when dragging left
  const leftIndicatorOpacity = useTransform(x, [-MAX_DRAG, -SWIPE_THRESHOLD, 0], [1, 0.7, 0])
  const leftIndicatorScale = useTransform(x, [-MAX_DRAG, -SWIPE_THRESHOLD, 0], [1, 0.8, 0.5])

  // Opacity for right action indicator (actions) - visible when dragging right
  const rightIndicatorOpacity = useTransform(x, [0, SWIPE_THRESHOLD, MAX_DRAG], [0, 0.7, 1])
  const rightIndicatorScale = useTransform(x, [0, SWIPE_THRESHOLD, MAX_DRAG], [0.5, 0.8, 1])

  const handleDrag = useCallback((_: unknown, info: PanInfo) => {
    const offset = info.offset.x

    // Fire haptic once when crossing threshold
    if (!hapticFiredRef.current) {
      if (enableSwipeLeft && offset < -SWIPE_THRESHOLD) {
        triggerHaptic('selection')
        hapticFiredRef.current = true
      } else if (enableSwipeRight && offset > SWIPE_THRESHOLD) {
        triggerHaptic('selection')
        hapticFiredRef.current = true
      }
    }
  }, [enableSwipeLeft, enableSwipeRight, triggerHaptic])

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    const offset = info.offset.x

    if (enableSwipeLeft && offset < -SWIPE_THRESHOLD && onReply) {
      triggerHaptic('light')
      onReply()
    } else if (enableSwipeRight && offset > SWIPE_THRESHOLD && onActions) {
      triggerHaptic('light')
      onActions()
    }

    // Reset haptic guard for next gesture
    hapticFiredRef.current = false
  }, [enableSwipeLeft, enableSwipeRight, onReply, onActions, triggerHaptic])

  const handleDragStart = useCallback(() => {
    hapticFiredRef.current = false
  }, [])

  // If disabled or reduced motion, just render children without drag
  if (disabled || prefersReducedMotion || (!enableSwipeLeft && !enableSwipeRight)) {
    return <>{children}</>
  }

  return (
    <div className="relative overflow-hidden">
      {/* Left action indicator (reply) - appears on the RIGHT side when swiping left */}
      {enableSwipeLeft && (
        <m.div
          className="absolute inset-y-0 right-0 flex items-center justify-center w-16"
          style={{ opacity: leftIndicatorOpacity }}
          aria-hidden="true"
        >
          <m.div
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-15"
            style={{ scale: leftIndicatorScale }}
          >
            <Reply className="w-5 h-5 text-primary" />
          </m.div>
        </m.div>
      )}

      {/* Right action indicator (actions) - appears on the LEFT side when swiping right */}
      {enableSwipeRight && (
        <m.div
          className="absolute inset-y-0 left-0 flex items-center gap-1 pl-2"
          style={{ opacity: rightIndicatorOpacity }}
          aria-hidden="true"
        >
          <m.div
            className="flex items-center justify-center w-10 h-10 rounded-full bg-error-10"
            style={{ scale: rightIndicatorScale }}
          >
            <Trash2 className="w-4 h-4 text-error" />
          </m.div>
          <m.div
            className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-surface"
            style={{ scale: rightIndicatorScale }}
          >
            <MoreHorizontal className="w-4 h-4 text-text-secondary" />
          </m.div>
        </m.div>
      )}

      {/* Draggable message content */}
      <m.div
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={0.2}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        transition={snapBackSpring}
        className="relative z-10"
      >
        {children}
      </m.div>
    </div>
  )
})

export { SwipeableMessage }
export type { SwipeableMessageProps }
