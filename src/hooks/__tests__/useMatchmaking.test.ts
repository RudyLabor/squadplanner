import { describe, it, expect } from 'vitest'
import {
  computeCompatibility,
  DEFAULT_FILTERS,
  RANK_OPTIONS,
  PLAY_STYLE_OPTIONS,
  GAME_OPTIONS,
  type MatchmakingPlayer,
} from '../useMatchmaking'

// Helper to create a mock player
function makePlayer(overrides: Partial<MatchmakingPlayer> = {}): MatchmakingPlayer {
  return {
    id: 'player-1',
    username: 'TestPlayer',
    avatar_url: null,
    games: ['valorant'],
    rank: 'gold',
    language: 'fr',
    timezone: 'Europe/Paris',
    play_style: 'competitive',
    reliability_score: 80,
    xp_level: 5,
    is_online: false,
    compatibility_score: 0,
    last_active: new Date().toISOString(),
    ...overrides,
  }
}

const baseUser = {
  timezone: 'Europe/Paris',
  language: 'fr',
  reliability_score: 80,
  xp_level: 5,
  play_style: 'competitive',
  is_online: true,
}

describe('matchmaking', () => {
  describe('computeCompatibility', () => {
    it('gives max score (100) for perfect match', () => {
      const candidate = makePlayer({
        timezone: 'Europe/Paris',
        language: 'fr',
        reliability_score: 80, // same, within 15
        xp_level: 5, // same, within 3
        play_style: 'competitive', // same
        is_online: true, // online bonus
      })
      const score = computeCompatibility(baseUser, candidate)
      expect(score).toBe(100) // 20+20+20+15+15+10 = 100
    })

    it('gives 0 for completely different candidate (offline)', () => {
      const candidate = makePlayer({
        timezone: 'America/New_York', // different
        language: 'en', // different
        reliability_score: 10, // diff > 15
        xp_level: 20, // diff > 3
        play_style: 'casual', // different
        is_online: false, // no bonus
      })
      const score = computeCompatibility(baseUser, candidate)
      expect(score).toBe(0)
    })

    it('adds 20 for same timezone', () => {
      const candidate = makePlayer({
        timezone: 'Europe/Paris',
        language: 'en', // different
        reliability_score: 10, // far
        xp_level: 20, // far
        play_style: 'casual', // different
        is_online: false,
      })
      expect(computeCompatibility(baseUser, candidate)).toBe(20)
    })

    it('adds 20 for same language', () => {
      const candidate = makePlayer({
        timezone: 'America/New_York',
        language: 'fr', // same
        reliability_score: 10,
        xp_level: 20,
        play_style: 'casual',
        is_online: false,
      })
      expect(computeCompatibility(baseUser, candidate)).toBe(20)
    })

    it('adds 20 for similar reliability (within 15 points)', () => {
      const candidate = makePlayer({
        timezone: 'America/New_York',
        language: 'en',
        reliability_score: 75, // diff = 5, within 15
        xp_level: 20,
        play_style: 'casual',
        is_online: false,
      })
      expect(computeCompatibility(baseUser, candidate)).toBe(20)
    })

    it('does NOT add reliability bonus when diff > 15', () => {
      const candidate = makePlayer({
        timezone: 'America/New_York',
        language: 'en',
        reliability_score: 60, // diff = 20, > 15
        xp_level: 20,
        play_style: 'casual',
        is_online: false,
      })
      expect(computeCompatibility(baseUser, candidate)).toBe(0)
    })

    it('adds 15 for similar XP level (within 3)', () => {
      const candidate = makePlayer({
        timezone: 'America/New_York',
        language: 'en',
        reliability_score: 10,
        xp_level: 7, // diff = 2, within 3
        play_style: 'casual',
        is_online: false,
      })
      expect(computeCompatibility(baseUser, candidate)).toBe(15)
    })

    it('adds 15 for same play style', () => {
      const candidate = makePlayer({
        timezone: 'America/New_York',
        language: 'en',
        reliability_score: 10,
        xp_level: 20,
        play_style: 'competitive', // same
        is_online: false,
      })
      expect(computeCompatibility(baseUser, candidate)).toBe(15)
    })

    it('adds 10 for online candidate', () => {
      const candidate = makePlayer({
        timezone: 'America/New_York',
        language: 'en',
        reliability_score: 10,
        xp_level: 20,
        play_style: 'casual',
        is_online: true, // online bonus
      })
      expect(computeCompatibility(baseUser, candidate)).toBe(10)
    })

    it('caps score at 100', () => {
      // Even though theoretical max is exactly 100, verify capping
      const candidate = makePlayer({
        timezone: 'Europe/Paris',
        language: 'fr',
        reliability_score: 80,
        xp_level: 5,
        play_style: 'competitive',
        is_online: true,
      })
      expect(computeCompatibility(baseUser, candidate)).toBeLessThanOrEqual(100)
    })

    it('reliability boundary: exactly 15 points difference gives bonus', () => {
      const candidate = makePlayer({
        timezone: 'America/New_York',
        language: 'en',
        reliability_score: 65, // diff = exactly 15
        xp_level: 20,
        play_style: 'casual',
        is_online: false,
      })
      expect(computeCompatibility(baseUser, candidate)).toBe(20) // within 15
    })

    it('XP level boundary: exactly 3 levels difference gives bonus', () => {
      const candidate = makePlayer({
        timezone: 'America/New_York',
        language: 'en',
        reliability_score: 10,
        xp_level: 8, // diff = exactly 3
        play_style: 'casual',
        is_online: false,
      })
      expect(computeCompatibility(baseUser, candidate)).toBe(15) // within 3
    })
  })

  describe('constants', () => {
    it('DEFAULT_FILTERS has correct defaults', () => {
      expect(DEFAULT_FILTERS.game).toBeNull()
      expect(DEFAULT_FILTERS.rank).toBeNull()
      expect(DEFAULT_FILTERS.language).toBe('fr')
      expect(DEFAULT_FILTERS.timezone).toBeNull()
      expect(DEFAULT_FILTERS.playStyle).toBe('both')
      expect(DEFAULT_FILTERS.availableNow).toBe(false)
    })

    it('RANK_OPTIONS has correct ranks', () => {
      expect(RANK_OPTIONS).toHaveLength(7)
      const values = RANK_OPTIONS.map((r) => r.value)
      expect(values).toContain('iron')
      expect(values).toContain('radiant')
    })

    it('PLAY_STYLE_OPTIONS has 3 options', () => {
      expect(PLAY_STYLE_OPTIONS).toHaveLength(3)
      const values = PLAY_STYLE_OPTIONS.map((p) => p.value)
      expect(values).toContain('competitive')
      expect(values).toContain('casual')
      expect(values).toContain('both')
    })

    it('GAME_OPTIONS includes popular games', () => {
      expect(GAME_OPTIONS.length).toBeGreaterThanOrEqual(8)
      const values = GAME_OPTIONS.map((g) => g.value)
      expect(values).toContain('valorant')
      expect(values).toContain('cs2')
      expect(values).toContain('apex')
      expect(values).toContain('fortnite')
    })

    it('all options have value and label', () => {
      for (const opt of [...RANK_OPTIONS, ...PLAY_STYLE_OPTIONS, ...GAME_OPTIONS]) {
        expect(opt.value).toBeTruthy()
        expect(opt.label).toBeTruthy()
      }
    })
  })
})
