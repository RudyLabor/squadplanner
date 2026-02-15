/**
 * Tests for src/utils/animations.ts
 * Covers: springTap, scrollReveal, scrollRevealLight, scaleReveal
 */
import { describe, it, expect } from 'vitest'

import { springTap, scrollReveal, scrollRevealLight, scaleReveal } from '../animations'

describe('animations', () => {
  // =========================================================================
  // springTap
  // =========================================================================
  describe('springTap', () => {
    it('should define whileTap with scale < 1', () => {
      expect(springTap.whileTap).toBeDefined()
      expect(springTap.whileTap.scale).toBeLessThan(1)
      expect(springTap.whileTap.scale).toBe(0.97)
    })

    it('should use spring transition type', () => {
      expect(springTap.transition.type).toBe('spring')
    })

    it('should define stiffness and damping', () => {
      expect(springTap.transition.stiffness).toBe(400)
      expect(springTap.transition.damping).toBe(17)
    })
  })

  // =========================================================================
  // scrollReveal
  // =========================================================================
  describe('scrollReveal', () => {
    it('should define hidden and visible variants', () => {
      expect(scrollReveal).toHaveProperty('hidden')
      expect(scrollReveal).toHaveProperty('visible')
    })

    it('hidden state should have opacity 0', () => {
      const hidden = scrollReveal.hidden as Record<string, unknown>
      expect(hidden.opacity).toBe(0)
    })

    it('hidden state should have y offset > 0', () => {
      const hidden = scrollReveal.hidden as Record<string, unknown>
      expect(hidden.y).toBe(30)
    })

    it('hidden state should have blur filter', () => {
      const hidden = scrollReveal.hidden as Record<string, unknown>
      expect(hidden.filter).toContain('blur')
    })

    it('visible state should have opacity 1 and y 0', () => {
      const visible = scrollReveal.visible as Record<string, unknown>
      expect(visible.opacity).toBe(1)
      expect(visible.y).toBe(0)
    })

    it('visible state should have no blur', () => {
      const visible = scrollReveal.visible as Record<string, unknown>
      expect(visible.filter).toBe('blur(0px)')
    })

    it('visible state should define a transition', () => {
      const visible = scrollReveal.visible as Record<string, unknown>
      expect(visible.transition).toBeDefined()
    })
  })

  // =========================================================================
  // scrollRevealLight
  // =========================================================================
  describe('scrollRevealLight', () => {
    it('should define hidden and visible variants', () => {
      expect(scrollRevealLight).toHaveProperty('hidden')
      expect(scrollRevealLight).toHaveProperty('visible')
    })

    it('hidden state should NOT have blur filter', () => {
      const hidden = scrollRevealLight.hidden as Record<string, unknown>
      expect(hidden.filter).toBeUndefined()
    })

    it('hidden state should have opacity 0 and y offset', () => {
      const hidden = scrollRevealLight.hidden as Record<string, unknown>
      expect(hidden.opacity).toBe(0)
      expect(hidden.y).toBe(20)
    })

    it('visible state should have opacity 1 and y 0', () => {
      const visible = scrollRevealLight.visible as Record<string, unknown>
      expect(visible.opacity).toBe(1)
      expect(visible.y).toBe(0)
    })

    it('visible transition should have 0.5s duration', () => {
      const visible = scrollRevealLight.visible as { transition: { duration: number } }
      expect(visible.transition.duration).toBe(0.5)
    })
  })

  // =========================================================================
  // scaleReveal
  // =========================================================================
  describe('scaleReveal', () => {
    it('should define hidden and visible variants', () => {
      expect(scaleReveal).toHaveProperty('hidden')
      expect(scaleReveal).toHaveProperty('visible')
    })

    it('hidden state should have opacity 0 and scale < 1', () => {
      const hidden = scaleReveal.hidden as Record<string, unknown>
      expect(hidden.opacity).toBe(0)
      expect(hidden.scale).toBe(0.95)
    })

    it('visible state should have opacity 1 and scale 1', () => {
      const visible = scaleReveal.visible as Record<string, unknown>
      expect(visible.opacity).toBe(1)
      expect(visible.scale).toBe(1)
    })

    it('visible transition should use spring type', () => {
      const visible = scaleReveal.visible as { transition: { type: string } }
      expect(visible.transition.type).toBe('spring')
    })

    it('visible transition should define stiffness and damping', () => {
      const visible = scaleReveal.visible as {
        transition: { stiffness: number; damping: number }
      }
      expect(visible.transition.stiffness).toBe(300)
      expect(visible.transition.damping).toBe(30)
    })
  })
})
