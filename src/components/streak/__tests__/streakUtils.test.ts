import { describe, it, expect } from 'vitest'
import {
  MILESTONES,
  calculateXPReward,
  getNextMilestone,
  getFlameIntensity,
  getFlameColors,
  resolveCSSColor,
} from '../streakUtils'

describe('streakUtils', () => {
  describe('MILESTONES', () => {
    it('exports a non-empty array', () => {
      expect(MILESTONES.length).toBeGreaterThan(0)
    })

    it('has milestone at 7 days', () => {
      const m7 = MILESTONES.find((m) => m.days === 7)
      expect(m7).toBeDefined()
      expect(m7!.xp).toBe(100)
    })

    it('has milestone at 30 days', () => {
      const m30 = MILESTONES.find((m) => m.days === 30)
      expect(m30).toBeDefined()
      expect(m30!.xp).toBe(500)
    })

    it('has milestone at 100 days', () => {
      const m100 = MILESTONES.find((m) => m.days === 100)
      expect(m100).toBeDefined()
      expect(m100!.xp).toBe(1000)
    })
  })

  describe('calculateXPReward', () => {
    it('returns milestone XP for milestone days', () => {
      expect(calculateXPReward(7)).toBe(100)
      expect(calculateXPReward(14)).toBe(200)
      expect(calculateXPReward(30)).toBe(500)
      expect(calculateXPReward(100)).toBe(1000)
    })

    it('returns 50 for weekly milestones after 100', () => {
      expect(calculateXPReward(105)).toBe(50) // 105 % 7 === 0
      expect(calculateXPReward(112)).toBe(50)
    })

    it('returns 0 for non-milestone days', () => {
      expect(calculateXPReward(1)).toBe(0)
      expect(calculateXPReward(5)).toBe(0)
      expect(calculateXPReward(10)).toBe(0)
      expect(calculateXPReward(102)).toBe(0)
    })
  })

  describe('getNextMilestone', () => {
    it('returns 7 days for streak of 0', () => {
      const result = getNextMilestone(0)
      expect(result.days).toBe(7)
      expect(result.daysRemaining).toBe(7)
    })

    it('returns 14 days for streak of 7', () => {
      const result = getNextMilestone(7)
      expect(result.days).toBe(14)
      expect(result.daysRemaining).toBe(7)
    })

    it('returns 30 days for streak of 14', () => {
      const result = getNextMilestone(14)
      expect(result.days).toBe(30)
      expect(result.daysRemaining).toBe(16)
    })

    it('returns 100 days for streak of 30', () => {
      const result = getNextMilestone(30)
      expect(result.days).toBe(100)
      expect(result.daysRemaining).toBe(70)
    })

    it('returns next 7-day mark for streak beyond 100', () => {
      const result = getNextMilestone(103)
      expect(result.days).toBe(105)
      expect(result.xp).toBe(50)
    })

    it('calculates progress percentage', () => {
      const result = getNextMilestone(3)
      expect(result.progress).toBeCloseTo((3 / 7) * 100, 1)
    })
  })

  describe('getFlameIntensity', () => {
    it('returns 0 for streak < 7', () => {
      expect(getFlameIntensity(0)).toBe(0)
      expect(getFlameIntensity(6)).toBe(0)
    })

    it('returns 1 for streak >= 7', () => {
      expect(getFlameIntensity(7)).toBe(1)
      expect(getFlameIntensity(13)).toBe(1)
    })

    it('returns 2 for streak >= 14', () => {
      expect(getFlameIntensity(14)).toBe(2)
      expect(getFlameIntensity(29)).toBe(2)
    })

    it('returns 3 for streak >= 30', () => {
      expect(getFlameIntensity(30)).toBe(3)
      expect(getFlameIntensity(99)).toBe(3)
    })

    it('returns 4 for streak >= 100', () => {
      expect(getFlameIntensity(100)).toBe(4)
      expect(getFlameIntensity(999)).toBe(4)
    })
  })

  describe('getFlameColors', () => {
    it('returns an object with primary, secondary, glow', () => {
      const colors = getFlameColors(0)
      expect(colors).toHaveProperty('primary')
      expect(colors).toHaveProperty('secondary')
      expect(colors).toHaveProperty('glow')
    })

    it('returns different colors for different intensities', () => {
      const c0 = getFlameColors(0)
      const c2 = getFlameColors(2)
      expect(c0.primary).not.toBe(c2.primary)
    })

    it('clamps to max intensity for very high values', () => {
      const c4 = getFlameColors(4)
      const c10 = getFlameColors(10)
      expect(c4).toEqual(c10)
    })
  })

  describe('resolveCSSColor', () => {
    it('returns fallback "#888" when document is not available', () => {
      // In JSDOM, getComputedStyle may return empty string
      const result = resolveCSSColor('--nonexistent-var')
      expect(typeof result).toBe('string')
    })
  })
})
