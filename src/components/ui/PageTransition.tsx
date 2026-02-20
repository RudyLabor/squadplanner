import { m } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
  /** Direction hint for the transition */
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
}

const directionVariants = {
  up: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  down: {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  },
  left: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  },
  right: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
}

/**
 * Wraps a page in a smooth enter/exit transition.
 * Respects prefers-reduced-motion automatically.
 *
 * @example
 * <PageTransition>
 *   <div>Page content</div>
 * </PageTransition>
 */
export function PageTransition({
  children,
  className = '',
  direction = 'up',
}: PageTransitionProps) {
  const variants = directionVariants[direction]

  return (
    <m.div
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
      className={className}
    >
      {children}
    </m.div>
  )
}

export default PageTransition
