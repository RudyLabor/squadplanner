import { describe, it, expect, vi, beforeEach } from 'vitest'

// The source file uses useHapticFeedback and useReducedMotion as bare identifiers
// (no import statements). We need to stub them as globals.
const mockTrigger = vi.hoisted(() => vi.fn())
const mockUseHapticFeedback = vi.hoisted(() =>
  vi.fn().mockReturnValue({ trigger: mockTrigger })
)
const mockUseReducedMotion = vi.hoisted(() => vi.fn().mockReturnValue(false))

// Stub as globals since the source references them without imports
vi.stubGlobal('useHapticFeedback', mockUseHapticFeedback)
vi.stubGlobal('useReducedMotion', mockUseReducedMotion)

import {
  motionTokens,
  fadeVariants,
  slideUpVariants,
  scaleVariants,
  staggerContainer,
  staggerItem,
  useHapticMotion,
  useReducedMotionVariants,
} from '../motionSystem'

describe('motionSystem', () => {
  beforeEach(() => {
    mockTrigger.mockClear()
    mockUseHapticFeedback.mockClear()
    mockUseReducedMotion.mockClear().mockReturnValue(false)
    mockUseHapticFeedback.mockReturnValue({ trigger: mockTrigger })
  })

  describe('motionTokens', () => {
    describe('spring configs', () => {
      it('has gentle spring with correct physics', () => {
        expect(motionTokens.spring.gentle).toEqual({
          type: 'spring',
          stiffness: 120,
          damping: 20,
          mass: 1.2,
        })
      })

      it('has bouncy spring with correct physics', () => {
        expect(motionTokens.spring.bouncy).toEqual({
          type: 'spring',
          stiffness: 180,
          damping: 12,
          mass: 0.8,
        })
      })

      it('has snappy spring with correct physics', () => {
        expect(motionTokens.spring.snappy).toEqual({
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 1.0,
        })
      })

      it('all springs have type spring', () => {
        Object.values(motionTokens.spring).forEach((spring) => {
          expect(spring.type).toBe('spring')
        })
      })
    })

    describe('duration tokens', () => {
      it('has instant at 0.1s', () => {
        expect(motionTokens.duration.instant).toBe(0.1)
      })

      it('has fast at 0.15s', () => {
        expect(motionTokens.duration.fast).toBe(0.15)
      })

      it('has normal at 0.25s', () => {
        expect(motionTokens.duration.normal).toBe(0.25)
      })

      it('has slow at 0.35s', () => {
        expect(motionTokens.duration.slow).toBe(0.35)
      })

      it('has slower at 0.5s', () => {
        expect(motionTokens.duration.slower).toBe(0.5)
      })

      it('durations are in ascending order', () => {
        const { instant, fast, normal, slow, slower } = motionTokens.duration
        expect(instant).toBeLessThan(fast)
        expect(fast).toBeLessThan(normal)
        expect(normal).toBeLessThan(slow)
        expect(slow).toBeLessThan(slower)
      })
    })

    describe('easing curves', () => {
      it('has easeInOut as 4-element array', () => {
        expect(motionTokens.easing.easeInOut).toEqual([0.4, 0.0, 0.2, 1])
      })

      it('has easeOut as 4-element array', () => {
        expect(motionTokens.easing.easeOut).toEqual([0.0, 0.0, 0.2, 1])
      })

      it('has easeIn as 4-element array', () => {
        expect(motionTokens.easing.easeIn).toEqual([0.4, 0.0, 1, 1])
      })

      it('has sharp as 4-element array', () => {
        expect(motionTokens.easing.sharp).toEqual([0.4, 0.0, 0.6, 1])
      })

      it('all easing curves have exactly 4 values between 0 and 1', () => {
        Object.values(motionTokens.easing).forEach((curve) => {
          expect(curve).toHaveLength(4)
          curve.forEach((val) => {
            expect(val).toBeGreaterThanOrEqual(0)
            expect(val).toBeLessThanOrEqual(1)
          })
        })
      })
    })
  })

  describe('fadeVariants', () => {
    it('initial state has opacity 0', () => {
      expect(fadeVariants.initial).toEqual({ opacity: 0 })
    })

    it('animate state has opacity 1 with gentle spring', () => {
      expect(fadeVariants.animate).toEqual({
        opacity: 1,
        transition: motionTokens.spring.gentle,
      })
    })

    it('exit state has opacity 0 with fast duration', () => {
      expect(fadeVariants.exit).toEqual({
        opacity: 0,
        transition: { duration: motionTokens.duration.fast },
      })
    })
  })

  describe('slideUpVariants', () => {
    it('initial state has opacity 0 and y offset of 20', () => {
      expect(slideUpVariants.initial).toEqual({ opacity: 0, y: 20 })
    })

    it('animate state has full opacity, y=0, and gentle spring', () => {
      expect(slideUpVariants.animate).toEqual({
        opacity: 1,
        y: 0,
        transition: motionTokens.spring.gentle,
      })
    })

    it('exit state slides up with negative y and fast duration', () => {
      expect(slideUpVariants.exit).toEqual({
        opacity: 0,
        y: -10,
        transition: { duration: motionTokens.duration.fast },
      })
    })
  })

  describe('scaleVariants', () => {
    it('initial state is slightly scaled down and transparent', () => {
      expect(scaleVariants.initial).toEqual({ opacity: 0, scale: 0.95 })
    })

    it('animate state is full size and opacity with bouncy spring', () => {
      expect(scaleVariants.animate).toEqual({
        opacity: 1,
        scale: 1,
        transition: motionTokens.spring.bouncy,
      })
    })

    it('exit state scales down with fast duration', () => {
      expect(scaleVariants.exit).toEqual({
        opacity: 0,
        scale: 0.95,
        transition: { duration: motionTokens.duration.fast },
      })
    })
  })

  describe('staggerContainer', () => {
    it('has staggerChildren and delayChildren in animate transition', () => {
      expect(staggerContainer.animate.transition).toEqual({
        staggerChildren: 0.05,
        delayChildren: 0.1,
      })
    })
  })

  describe('staggerItem', () => {
    it('initial state has opacity 0 and y offset', () => {
      expect(staggerItem.initial).toEqual({ opacity: 0, y: 20 })
    })

    it('animate state has full opacity, y=0, and gentle spring', () => {
      expect(staggerItem.animate).toEqual({
        opacity: 1,
        y: 0,
        transition: motionTokens.spring.gentle,
      })
    })
  })

  describe('useHapticMotion', () => {
    it('returns withHaptic function', () => {
      const { withHaptic } = useHapticMotion()
      expect(typeof withHaptic).toBe('function')
    })

    it('withHaptic wraps animation props with onAnimationStart haptic trigger', () => {
      mockTrigger.mockClear()
      const { withHaptic } = useHapticMotion()
      const result = withHaptic({ opacity: 1 })
      expect(result.opacity).toBe(1)
      expect(typeof result.onAnimationStart).toBe('function')
      ;(result.onAnimationStart as () => void)()
      expect(mockTrigger).toHaveBeenCalledWith('light')
    })

    it('withHaptic uses specified haptic type', () => {
      mockTrigger.mockClear()
      const { withHaptic } = useHapticMotion()
      const result = withHaptic({ scale: 1 }, 'heavy')
      ;(result.onAnimationStart as () => void)()
      expect(mockTrigger).toHaveBeenCalledWith('heavy')
    })

    it('withHaptic preserves existing onAnimationStart when present', () => {
      mockTrigger.mockClear()
      const existingHandler = vi.fn()
      const { withHaptic } = useHapticMotion()
      const result = withHaptic({ opacity: 1, onAnimationStart: existingHandler }, 'medium')
      ;(result.onAnimationStart as () => void)()
      expect(mockTrigger).toHaveBeenCalledWith('medium')
      expect(existingHandler).toHaveBeenCalled()
    })

    it('withHaptic defaults hapticType to light', () => {
      mockTrigger.mockClear()
      const { withHaptic } = useHapticMotion()
      const result = withHaptic({})
      ;(result.onAnimationStart as () => void)()
      expect(mockTrigger).toHaveBeenCalledWith('light')
    })
  })

  describe('useReducedMotionVariants', () => {
    it('returns default variants when reduced motion is not preferred', () => {
      mockUseReducedMotion.mockReturnValue(false)
      const customVariants = {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -50 },
      }
      const result = useReducedMotionVariants(customVariants)
      expect(result).toEqual(customVariants)
    })

    it('returns simplified opacity-only variants when reduced motion is preferred', () => {
      mockUseReducedMotion.mockReturnValue(true)
      const customVariants = {
        initial: { opacity: 0, y: 50, scale: 0.8 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -50, scale: 0.8 },
      }
      const result = useReducedMotionVariants(customVariants)
      expect(result).toEqual({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      })
    })

    it('reduced motion variants have no transform properties', () => {
      mockUseReducedMotion.mockReturnValue(true)
      const result = useReducedMotionVariants(slideUpVariants)
      expect(result.initial).not.toHaveProperty('y')
      expect(result.animate).not.toHaveProperty('y')
      expect(result.initial).not.toHaveProperty('scale')
    })
  })
})
