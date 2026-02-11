import { type ReactNode } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface CrossfadeTransitionProps {
  /** When true, the skeleton is shown; when false, the real content is shown */
  isLoading: boolean
  /** Render function or node for the skeleton placeholder */
  skeleton: ReactNode
  /** The real content to display after loading */
  children: ReactNode
  /** Animation duration in seconds (default: 0.3) */
  duration?: number
  /** Optional className for the outer wrapper */
  className?: string
}

const DURATION = 0.3

/**
 * Crossfades from a skeleton placeholder to real content.
 *
 * When `isLoading` transitions from true to false the skeleton fades out
 * while shrinking slightly, then the content fades in with a subtle scale-up.
 * Uses AnimatePresence mode="wait" so only one element is mounted at a time.
 *
 * Respects the user's `prefers-reduced-motion` setting: when active the swap
 * is instant (no animation).
 */
export function CrossfadeTransition({
  isLoading,
  skeleton,
  children,
  duration = DURATION,
  className,
}: CrossfadeTransitionProps) {
  const reducedMotion = useReducedMotion()

  // Instant swap when the user prefers reduced motion
  if (reducedMotion) {
    return (
      <div className={className} aria-busy={isLoading}>
        {isLoading ? skeleton : children}
      </div>
    )
  }

  return (
    <div className={className} aria-busy={isLoading}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <m.div
            key="skeleton"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: duration * 0.5, ease: 'easeOut' }}
          >
            {skeleton}
          </m.div>
        ) : (
          <m.div
            key="content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration, ease: 'easeOut' }}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
