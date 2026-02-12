/**
 * PHASE - Motion Design Tokens
 *
 * Centralized motion values for consistent animations across the app.
 * All animation code should reference these tokens instead of inline magic numbers.
 */

export const motion = {
  duration: {
    instant: 0.1, // Immediate feedback (tap)
    fast: 0.15, // Micro-interactions
    normal: 0.25, // Standard transitions
    slow: 0.4, // Page transitions
    slower: 0.6, // Complex animations
  },
  easing: {
    easeOut: [0.16, 1, 0.3, 1], // Entrances
    easeInOut: [0.65, 0, 0.35, 1], // Transitions
    spring: { type: 'spring' as const, stiffness: 400, damping: 25 }, // Interactions
    springSnappy: { type: 'spring' as const, stiffness: 500, damping: 30 }, // Quick feedback
    springBouncy: { type: 'spring' as const, stiffness: 300, damping: 10 }, // Celebrations
    springSmooth: { type: 'spring' as const, stiffness: 200, damping: 20 }, // Subtle movements
  },
} as const

// Helper to create transition config
const createTransition = (
  duration: number = motion.duration.normal,
  ease: number[] = [...motion.easing.easeOut]
) => ({
  duration,
  ease,
})

// Pre-built transition presets
export const transitions = {
  fast: createTransition(motion.duration.fast),
  normal: createTransition(motion.duration.normal),
  slow: createTransition(motion.duration.slow),
  pageTransition: createTransition(motion.duration.slow, [...motion.easing.easeOut]),
} as const
