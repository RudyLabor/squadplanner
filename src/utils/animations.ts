/**
 * PHASE - Animation Utilities
 *
 * Reusable animation variants for Framer Motion.
 * Values are sourced from motionTokens where they match exactly.
 */
import type { Variants } from 'framer-motion'
import { motion as motionTokens } from './motionTokens'

/**
 * Spring tap props - enhanced feel for buttons and interactive elements
 * Usage: <motion.button {...springTap}>
 */
export const springTap = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
}

/**
 * Scroll-triggered reveal animation with blur
 * Usage: <motion.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
 */
export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: motionTokens.duration.slower, ease: [...motionTokens.easing.easeOut] },
  },
}

/**
 * Lighter scroll reveal without blur (better for performance-sensitive areas)
 */
export const scrollRevealLight: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [...motionTokens.easing.easeOut] },
  },
}

/**
 * Scale reveal for cards and containers
 */
export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
}
