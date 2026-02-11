import { type ReactNode } from 'react'
import { m, AnimatePresence } from 'framer-motion'

interface AnimatedListProps {
  children: ReactNode
  className?: string
}

/**
 * Wraps a list of AnimatedListItem children with AnimatePresence
 * so items animate in/out and reposition smoothly via layout animations.
 */
export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <div className={className}>
      <AnimatePresence initial={false}>
        {children}
      </AnimatePresence>
    </div>
  )
}

interface AnimatedListItemProps {
  children: ReactNode
  className?: string
  /** Required unique key for AnimatePresence tracking (pass via React key prop) */
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      transition={{
        opacity: { duration: 0.2 },
        y: { duration: 0.2 },
        height: { duration: 0.25, delay: 0.05 },
        layout: { duration: 0.25 },
      }}
      className={className}
    >
      {children}
    </m.div>
  )
}
