import { type ReactNode } from 'react'
import { m, AnimatePresence } from 'framer-motion'

interface ContentTransitionProps {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
}

/**
 * Crossfades between a skeleton placeholder and loaded content.
 * Prevents the jarring instant-swap when data finishes loading.
 */
export function ContentTransition({ isLoading, skeleton, children }: ContentTransitionProps) {
  return (
    <div aria-busy={isLoading}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <m.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {skeleton}
          </m.div>
        ) : (
          <m.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
