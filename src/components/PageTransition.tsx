import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

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
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number], // Custom cubic bezier for snappy feel
}

export function PageTransition({
  children,
  variant = 'slide',
  className = ''
}: PageTransitionProps) {
  const selectedVariant = variants[variant]

  return (
    <motion.div
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Alternative export for direct use with framer-motion props
export const pageTransitionVariants = variants
export const pageTransitionConfig = transition
