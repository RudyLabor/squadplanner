import { describe, it, expect } from 'vitest'
import { motion, transitions } from '../motionTokens'

describe('motionTokens', () => {
  // STRICT: Verifies all motion.duration values are correct numbers in ascending
  // order, representing increasingly slower animation speeds
  it('motion.duration has all 5 values in correct ascending order', () => {
    // 1. instant is 0.1
    expect(motion.duration.instant).toBe(0.1)
    // 2. fast is 0.15
    expect(motion.duration.fast).toBe(0.15)
    // 3. normal is 0.25
    expect(motion.duration.normal).toBe(0.25)
    // 4. slow is 0.4
    expect(motion.duration.slow).toBe(0.4)
    // 5. slower is 0.6
    expect(motion.duration.slower).toBe(0.6)

    // 6. All are numbers
    Object.values(motion.duration).forEach((v) => {
      expect(typeof v).toBe('number')
    })
    // 7. Ascending order: instant < fast < normal < slow < slower
    expect(motion.duration.instant).toBeLessThan(motion.duration.fast)
    expect(motion.duration.fast).toBeLessThan(motion.duration.normal)
    expect(motion.duration.normal).toBeLessThan(motion.duration.slow)
    expect(motion.duration.slow).toBeLessThan(motion.duration.slower)
    // 8. All are positive
    Object.values(motion.duration).forEach((v) => {
      expect(v).toBeGreaterThan(0)
    })
    // 9. Has exactly 5 duration keys
    expect(Object.keys(motion.duration)).toHaveLength(5)
    // 10. Expected key names
    expect(Object.keys(motion.duration)).toEqual(
      expect.arrayContaining(['instant', 'fast', 'normal', 'slow', 'slower'])
    )
  })

  // STRICT: Verifies all motion.easing values have correct shapes — cubic bezier
  // arrays and spring configs with type, stiffness, and damping
  it('motion.easing has correct cubic bezier arrays and spring configs', () => {
    // 1. easeOut is an array of 4 numbers
    expect(Array.isArray(motion.easing.easeOut)).toBe(true)
    expect(motion.easing.easeOut).toHaveLength(4)
    // 2. easeInOut is an array of 4 numbers
    expect(Array.isArray(motion.easing.easeInOut)).toBe(true)
    expect(motion.easing.easeInOut).toHaveLength(4)

    // 3. spring config has type='spring'
    expect(motion.easing.spring.type).toBe('spring')
    // 4. spring has stiffness=400
    expect(motion.easing.spring.stiffness).toBe(400)
    // 5. spring has damping=25
    expect(motion.easing.spring.damping).toBe(25)

    // 6. springSnappy has higher stiffness and damping than spring
    expect(motion.easing.springSnappy.type).toBe('spring')
    expect(motion.easing.springSnappy.stiffness).toBe(500)
    expect(motion.easing.springSnappy.damping).toBe(30)

    // 7. springBouncy has low damping (more bounce)
    expect(motion.easing.springBouncy.type).toBe('spring')
    expect(motion.easing.springBouncy.stiffness).toBe(300)
    expect(motion.easing.springBouncy.damping).toBe(10)

    // 8. springSmooth has moderate values
    expect(motion.easing.springSmooth.type).toBe('spring')
    expect(motion.easing.springSmooth.stiffness).toBe(200)
    expect(motion.easing.springSmooth.damping).toBe(20)

    // 9. All springs have type 'spring'
    const springs = [motion.easing.spring, motion.easing.springSnappy, motion.easing.springBouncy, motion.easing.springSmooth]
    springs.forEach((s) => {
      expect(s.type).toBe('spring')
    })

    // 10. easeOut values are in [0, 1] range
    motion.easing.easeOut.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    })
  })

  // STRICT: Verifies transitions.fast uses motion.duration.fast and has correct
  // ease curve, and same for transitions.normal
  it('transitions.fast and transitions.normal use correct duration and ease', () => {
    // 1. transitions.fast.duration matches motion.duration.fast
    expect(transitions.fast.duration).toBe(motion.duration.fast)
    expect(transitions.fast.duration).toBe(0.15)
    // 2. transitions.fast.ease is an array
    expect(Array.isArray(transitions.fast.ease)).toBe(true)
    // 3. transitions.fast.ease has 4 values (cubic bezier)
    expect(transitions.fast.ease).toHaveLength(4)

    // 4. transitions.normal.duration matches motion.duration.normal
    expect(transitions.normal.duration).toBe(motion.duration.normal)
    expect(transitions.normal.duration).toBe(0.25)
    // 5. transitions.normal.ease is an array
    expect(Array.isArray(transitions.normal.ease)).toBe(true)
    // 6. transitions.normal.ease has 4 values
    expect(transitions.normal.ease).toHaveLength(4)

    // 7. Both fast and normal have the same ease curve (both use easeOut)
    expect(transitions.fast.ease).toEqual(transitions.normal.ease)

    // 8. Ease values match motion.easing.easeOut
    expect(transitions.fast.ease).toEqual([...motion.easing.easeOut])
  })

  // STRICT: Verifies transitions.slow and transitions.pageTransition have correct
  // configurations and all transition presets are properly defined
  it('transitions.slow and transitions.pageTransition are configured correctly', () => {
    // 1. transitions.slow.duration matches motion.duration.slow
    expect(transitions.slow.duration).toBe(motion.duration.slow)
    expect(transitions.slow.duration).toBe(0.4)
    // 2. transitions.slow.ease is defined
    expect(transitions.slow.ease).toBeDefined()
    // 3. transitions.slow.ease has 4 values
    expect(transitions.slow.ease).toHaveLength(4)

    // 4. transitions.pageTransition.duration matches motion.duration.slow
    expect(transitions.pageTransition.duration).toBe(motion.duration.slow)
    // 5. transitions.pageTransition.ease is defined
    expect(transitions.pageTransition.ease).toBeDefined()
    // 6. transitions.pageTransition.ease has 4 values
    expect(transitions.pageTransition.ease).toHaveLength(4)
    // 7. pageTransition uses easeOut curve
    expect(transitions.pageTransition.ease).toEqual([...motion.easing.easeOut])

    // 8. All 4 transition presets exist
    expect(Object.keys(transitions)).toEqual(
      expect.arrayContaining(['fast', 'normal', 'slow', 'pageTransition'])
    )
    // 9. All transitions have duration and ease
    Object.values(transitions).forEach((t) => {
      expect(t).toHaveProperty('duration')
      expect(t).toHaveProperty('ease')
    })
    // 10. motion object itself is defined and has duration + easing
    expect(motion).toHaveProperty('duration')
    expect(motion).toHaveProperty('easing')
  })
})
