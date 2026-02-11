import { useEffect, useRef, useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { useNavigationProgressStore } from '../../hooks/useNavigationProgress'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/**
 * YouTube / NProgress-style thin loading bar at the very top of the viewport.
 *
 * - Quickly jumps to ~30%, then crawls to ~90%.
 * - Snaps to 100% and fades out when loading completes.
 * - Uses the app's primary accent colour via CSS custom property.
 * - Respects prefers-reduced-motion.
 */
export function TopLoadingBar() {
  const isNavigating = useNavigationProgressStore((s) => s.isNavigating)
  const reducedMotion = useReducedMotion()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const crawlRef = useRef<ReturnType<typeof setInterval>>()
  const fadeRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (isNavigating) {
      // Reset and start
      clearInterval(crawlRef.current)
      clearTimeout(fadeRef.current)
      setProgress(0)
      setVisible(true)

      // Quick jump to 30%
      requestAnimationFrame(() => setProgress(30))

      // Then slowly crawl towards 90%
      crawlRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(crawlRef.current)
            return prev
          }
          // Slow down as it approaches 90
          const increment = (90 - prev) * 0.08
          return Math.min(prev + Math.max(increment, 0.5), 90)
        })
      }, 200)
    } else if (visible) {
      // Snap to 100% and fade out
      clearInterval(crawlRef.current)
      setProgress(100)
      fadeRef.current = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 400)
    }

    return () => {
      clearInterval(crawlRef.current)
      clearTimeout(fadeRef.current)
    }
  }, [isNavigating, visible])

  if (reducedMotion) return null

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
          style={{ height: 3 }}
          aria-hidden="true"
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--color-primary)',
              transition: progress === 100
                ? 'width 200ms ease-out'
                : 'width 400ms cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 8px var(--color-primary)',
            }}
          />
        </m.div>
      )}
    </AnimatePresence>
  )
}
