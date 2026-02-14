import { describe, it, expect } from 'vitest'
import { BADGE_CONFIGS, formatSeason } from '../badgeConfig'

describe('badgeConfig', () => {
  describe('BADGE_CONFIGS', () => {
    it('exports a non-empty record of badge configs', () => {
      expect(Object.keys(BADGE_CONFIGS).length).toBeGreaterThan(0)
    })

    it('contains expected badge types', () => {
      const keys = Object.keys(BADGE_CONFIGS)
      expect(keys).toContain('mvp')
      expect(keys).toContain('most_reliable')
      expect(keys).toContain('party_animal')
      expect(keys).toContain('top_scorer')
      expect(keys).toContain('streak_master')
      expect(keys).toContain('squad_champion')
      expect(keys).toContain('rising_star')
      expect(keys).toContain('legend')
    })

    it('each badge config has required properties', () => {
      for (const [key, config] of Object.entries(BADGE_CONFIGS)) {
        expect(config.icon, `${key} should have an icon`).toBeDefined()
        expect(config.color, `${key} should have a color`).toBeTruthy()
        expect(config.bgColor, `${key} should have a bgColor`).toBeTruthy()
        expect(config.glowColor, `${key} should have a glowColor`).toBeTruthy()
        expect(config.label, `${key} should have a label`).toBeTruthy()
        expect(config.description, `${key} should have a description`).toBeTruthy()
      }
    })
  })

  describe('formatSeason', () => {
    it('formats "2026-01" as "Janvier 2026"', () => {
      expect(formatSeason('2026-01')).toBe('Janvier 2026')
    })

    it('formats "2025-12" as "Décembre 2025"', () => {
      expect(formatSeason('2025-12')).toBe('Décembre 2025')
    })

    it('formats "2026-06" as "Juin 2026"', () => {
      expect(formatSeason('2026-06')).toBe('Juin 2026')
    })

    it('formats "2024-03" as "Mars 2024"', () => {
      expect(formatSeason('2024-03')).toBe('Mars 2024')
    })
  })
})
