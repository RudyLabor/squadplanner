import { describe, it, expect } from 'vitest'
import { motion, transitions } from '../motionTokens'

describe('motionTokens', () => {
  it('motion.duration has correct keys', () => {
    expect(motion.duration.instant).toBe(0.1)
    expect(motion.duration.fast).toBe(0.15)
    expect(motion.duration.normal).toBe(0.25)
    expect(motion.duration.slow).toBe(0.4)
    expect(motion.duration.slower).toBe(0.6)
  })

  it('motion.easing has spring configs', () => {
    expect(motion.easing.spring.type).toBe('spring')
    expect(motion.easing.spring.stiffness).toBe(400)
  })

  it('transitions.fast uses fast duration', () => {
    expect(transitions.fast.duration).toBe(motion.duration.fast)
  })

  it('transitions.normal uses normal duration', () => {
    expect(transitions.normal.duration).toBe(motion.duration.normal)
  })
})
