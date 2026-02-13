import { lazy } from 'react'

// Lazy load Framer Motion uniquement pour animations complexes
// Motion simple (opacity, scale) → CSS transitions
// Motion complexe (spring physics, gestures) → Framer Motion lazy

export const LazyMotionDiv = lazy(async () => {
  const { motion } = await import('framer-motion')
  return { default: motion.div }
})

export const LazyAnimatePresence = lazy(async () => {
  const { AnimatePresence } = await import('framer-motion')
  return { default: AnimatePresence }
})

export const LazyMotionSpan = lazy(async () => {
  const { motion } = await import('framer-motion')
  return { default: motion.span }
})

export const LazyMotionButton = lazy(async () => {
  const { motion } = await import('framer-motion')
  return { default: motion.button }
})

// Hook pour preload intelligent motion
export function useMotionPreload() {
  const preload = () => {
    import('framer-motion')
  }
  
  return { preload }
}

// Alternatives CSS pour remplacer motion simple
export const simpleTransitions = {
  fadeIn: 'transition-opacity duration-200 ease-in-out',
  slideUp: 'transition-transform duration-300 ease-out transform translate-y-0',
  scaleIn: 'transition-transform duration-200 ease-out transform scale-100',
  
  // Classes pour remplacer motion basique
  fade: {
    initial: 'opacity-0',
    animate: 'opacity-100',
    exit: 'opacity-0'
  },
  
  slide: {
    initial: 'transform translate-y-4 opacity-0',
    animate: 'transform translate-y-0 opacity-100',
    exit: 'transform translate-y-4 opacity-0'
  }
}