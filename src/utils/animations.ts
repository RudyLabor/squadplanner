/**
 * PHASE - Animation Utilities
 *
 * Reusable animation variants for Framer Motion.
 * Provides consistent stagger animations across all lists.
 */
import type { Variants, Transition } from 'framer-motion'

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
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
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
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15 },
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
  ease: [0.16, 1, 0.3, 1],
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
