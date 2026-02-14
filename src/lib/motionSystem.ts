// Apple-level motion system
export const motionTokens = {
  // Spring physics (not CSS ease)
  spring: {
    gentle: { type: 'spring', stiffness: 120, damping: 20, mass: 1.2 },
    bouncy: { type: 'spring', stiffness: 180, damping: 12, mass: 0.8 },
    snappy: { type: 'spring', stiffness: 300, damping: 30, mass: 1.0 },
  },
  
  // Duration tokens
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.25,
    slow: 0.35,
    slower: 0.5
  },
  
  // Easing curves (fallback when spring not available)
  easing: {
    easeInOut: [0.4, 0.0, 0.2, 1],
    easeOut: [0.0, 0.0, 0.2, 1],
    easeIn: [0.4, 0.0, 1, 1],
    sharp: [0.4, 0.0, 0.6, 1]
  }
}

// Variants système pour consistency
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: motionTokens.spring.gentle },
  exit: { opacity: 0, transition: { duration: motionTokens.duration.fast } }
}

export const slideUpVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: motionTokens.spring.gentle 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    transition: { duration: motionTokens.duration.fast } 
  }
}

export const scaleVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    transition: motionTokens.spring.bouncy 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: motionTokens.duration.fast } 
  }
}

// Stagger animations for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: motionTokens.spring.gentle
  }
}

// Animation props type for framer-motion compatible objects
interface AnimationProps extends Record<string, unknown> {
  onAnimationStart?: () => void
}

// Motion variants type
interface MotionVariants {
  initial?: Record<string, unknown>
  animate?: Record<string, unknown>
  exit?: Record<string, unknown>
}

// Haptic feedback integration
export const useHapticMotion = () => {
  const haptic = useHapticFeedback()

  const withHaptic = (animationProps: AnimationProps, hapticType: 'light' | 'medium' | 'heavy' = 'light') => {
    return {
      ...animationProps,
      onAnimationStart: () => haptic.trigger(hapticType),
      ...animationProps.onAnimationStart && {
        onAnimationStart: () => {
          haptic.trigger(hapticType)
          animationProps.onAnimationStart?.()
        }
      }
    }
  }

  return { withHaptic }
}

// Reduced motion respect
export const useReducedMotionVariants = (defaultVariants: MotionVariants) => {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }
  }

  return defaultVariants
}