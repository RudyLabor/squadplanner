/**
 * PHASE - Animation Utilities
 *
 * Reusable animation variants for Framer Motion.
 * Provides consistent stagger animations across all lists.
 * Values are sourced from motionTokens where they match exactly.
 */
import type { Variants, Transition } from 'framer-motion'
import { motion as motionTokens } from './motionTokens'

/**
 * Container variants for staggered children animations
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
}

/**
 * Fast stagger for short lists (< 5 items)
 */
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.01,
    },
  },
}

/**
 * Slow stagger for longer lists (> 10 items)
 */
export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

/**
 * Item variants for fade + slide up animation
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

/**
 * Item variants for fade + scale animation
 */
export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

/**
 * Item variants for horizontal slide
 */
export const staggerItemSlideX: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

/**
 * Hover animation for interactive cards
 */
export const hoverLift: Variants = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -2,
    scale: 1.01,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

/**
 * Tap animation for buttons
 */
export const tapScale: Variants = {
  rest: { scale: 1 },
  tap: { scale: 0.98 },
}

/**
 * Fade in animation
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

/**
 * Slide up fade in animation
 */
export const slideUpFadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.slow,
      ease: [...motionTokens.easing.easeOut],
    },
  },
}

/**
 * Pop in animation (for modals, toasts)
 */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      ...motionTokens.easing.spring,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: motionTokens.duration.fast },
  },
}

/**
 * Smooth spring transition
 */
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

/**
 * Fast ease out transition
 */
export const fastEaseOut: Transition = {
  duration: 0.2,
  ease: [...motionTokens.easing.easeOut],
}

/**
 * Default transition
 */
export const defaultTransition: Transition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1],
}

/**
 * Create custom stagger container with specified timing
 */
export function createStaggerContainer(
  staggerChildren: number = 0.05,
  delayChildren: number = 0.02
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  }
}

/**
 * Create custom item variant
 */
export function createStaggerItem(
  hiddenState: { opacity?: number; y?: number; x?: number; scale?: number } = { opacity: 0, y: 8 },
  visibleState: { opacity?: number; y?: number; x?: number; scale?: number } = { opacity: 1, y: 0 },
  transition: Transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
): Variants {
  return {
    hidden: hiddenState,
    visible: {
      ...visibleState,
      transition,
    },
  }
}

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
 * Error shake animation for invalid inputs
 * Usage: <motion.div variants={errorShake} initial="initial" animate="animate">
 */
export const errorShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: motionTokens.duration.slow },
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
