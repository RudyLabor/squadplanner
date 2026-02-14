import { describe, it, expect } from 'vitest'
import { getLevelColor, MEDAL_COLORS } from '../leaderboardConfig'

describe('leaderboardConfig', () => {
  describe('getLevelColor', () => {
    it('returns gold colors for level >= 50', () => {
      const result = getLevelColor(50)
      expect(result.color).toContain('gold')
    })

    it('returns primary-hover colors for level >= 30', () => {
      const result = getLevelColor(30)
      expect(result.color).toContain('primary-hover')
    })

    it('returns success colors for level >= 20', () => {
      const result = getLevelColor(20)
      expect(result.color).toContain('success')
    })

    it('returns primary colors for level >= 10', () => {
      const result = getLevelColor(10)
      expect(result.color).toContain('primary')
    })

    it('returns default colors for level < 10', () => {
      const result = getLevelColor(5)
      expect(result.color).toContain('text-secondary')
    })

    it('returns an object with color, bg15, and bg20', () => {
      const result = getLevelColor(1)
      expect(result).toHaveProperty('color')
      expect(result).toHaveProperty('bg15')
      expect(result).toHaveProperty('bg20')
    })

    it('returns gold for very high levels', () => {
      const result = getLevelColor(100)
      expect(result.color).toContain('gold')
    })
  })

  describe('MEDAL_COLORS', () => {
    it('has entries for ranks 1, 2, and 3', () => {
      expect(MEDAL_COLORS[1]).toBeDefined()
      expect(MEDAL_COLORS[2]).toBeDefined()
      expect(MEDAL_COLORS[3]).toBeDefined()
    })

    it('each medal has primary and glow colors', () => {
      for (const rank of [1, 2, 3] as const) {
        const medal = MEDAL_COLORS[rank]
        expect(medal.primary).toBeTruthy()
        expect(medal.secondary).toBeTruthy()
        expect(medal.glow).toBeTruthy()
        expect(medal.primary10).toBeTruthy()
        expect(medal.primary20).toBeTruthy()
        expect(medal.primary30).toBeTruthy()
      }
    })

    it('rank 1 uses gold color', () => {
      expect(MEDAL_COLORS[1].primary).toContain('gold')
    })

    it('rank 3 uses orange color', () => {
      expect(MEDAL_COLORS[3].primary).toContain('orange')
    })
  })
})
