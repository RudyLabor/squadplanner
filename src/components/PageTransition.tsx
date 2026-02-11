import { m } from 'framer-motion'
import type { ReactNode } from 'react'
import { transitions } from '../utils/motionTokens'

interface PageTransitionProps {
  children: ReactNode
  variant?: 'slide' | 'fade' | 'scale'
  className?: string
}

const variants = {
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
}

const transition = {
  duration: transitions.pageTransition.duration,
  ease: transitions.pageTransition.ease as [number, number, number, number],
}

export function PageTransition({
  children,
  variant = 'slide',
  className = ''
}: PageTransitionProps) {
  const selectedVariant = variants[variant]

  return (
    <m.div
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={transition}
      className={className}
    >
      {children}
    </m.div>
  )
}

// Alternative export for direct use with framer-motion props
export const pageTransitionVariants = variants
export const pageTransitionConfig = transition
