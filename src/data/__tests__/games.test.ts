import { describe, it, expect } from 'vitest'
import { GAMES, GAMES_MAP, getAllGameSlugs, getGameBySlug, type GameInfo } from '../games'

describe('games data', () => {
  describe('GAMES catalog', () => {
    it('contains exactly 12 games', () => {
      expect(GAMES).toHaveLength(12)
    })

    it('all games have unique slugs', () => {
      const slugs = GAMES.map((g) => g.slug)
      const uniqueSlugs = new Set(slugs)
      expect(uniqueSlugs.size).toBe(GAMES.length)
    })

    it('all games have required fields', () => {
      for (const game of GAMES) {
        expect(game.slug).toBeTruthy()
        expect(game.name).toBeTruthy()
        expect(game.description.length).toBeGreaterThan(20)
        expect(game.seoDescription.length).toBeGreaterThan(20)
        expect(game.genre).toBeTruthy()
        expect(game.players).toBeTruthy()
        expect(game.platforms.length).toBeGreaterThan(0)
        expect(game.icon).toBeTruthy()
        expect(game.estimatedPlayers).toBeTruthy()
        expect(game.color).toBeTruthy()
        expect(game.tags.length).toBeGreaterThan(0)
      }
    })

    it('platforms are valid platform names', () => {
      const validPlatforms = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile']
      for (const game of GAMES) {
        for (const platform of game.platforms) {
          expect(validPlatforms).toContain(platform)
        }
      }
    })

    it('slugs are URL-friendly (lowercase, hyphenated)', () => {
      for (const game of GAMES) {
        expect(game.slug).toMatch(/^[a-z0-9-]+$/)
      }
    })

    it('estimatedPlayers format contains a number with M+ or joueurs', () => {
      for (const game of GAMES) {
        expect(game.estimatedPlayers).toMatch(/\d+M?\+?\s*(joueurs|joueurs actifs)/)
      }
    })

    it('includes well-known games', () => {
      const slugs = GAMES.map((g) => g.slug)
      expect(slugs).toContain('valorant')
      expect(slugs).toContain('league-of-legends')
      expect(slugs).toContain('fortnite')
      expect(slugs).toContain('cs2')
      expect(slugs).toContain('minecraft')
    })
  })

  describe('GAMES_MAP', () => {
    it('has same size as GAMES array', () => {
      expect(GAMES_MAP.size).toBe(GAMES.length)
    })

    it('provides O(1) lookup by slug', () => {
      const valorant = GAMES_MAP.get('valorant')
      expect(valorant).toBeDefined()
      expect(valorant!.name).toBe('Valorant')
      expect(valorant!.genre).toBe('FPS Tactique')
    })

    it('returns undefined for unknown slug', () => {
      expect(GAMES_MAP.get('unknown-game')).toBeUndefined()
    })
  })

  describe('getAllGameSlugs', () => {
    it('returns array of all slugs', () => {
      const slugs = getAllGameSlugs()
      expect(slugs).toHaveLength(GAMES.length)
      expect(slugs).toContain('valorant')
      expect(slugs).toContain('destiny-2')
    })

    it('returns strings only', () => {
      const slugs = getAllGameSlugs()
      for (const slug of slugs) {
        expect(typeof slug).toBe('string')
      }
    })
  })

  describe('getGameBySlug', () => {
    it('returns correct game for valid slug', () => {
      const lol = getGameBySlug('league-of-legends')
      expect(lol).toBeDefined()
      expect(lol!.name).toBe('League of Legends')
      expect(lol!.shortName).toBe('LoL')
      expect(lol!.genre).toBe('MOBA')
    })

    it('returns Fortnite with cross-platform support', () => {
      const fortnite = getGameBySlug('fortnite')
      expect(fortnite).toBeDefined()
      expect(fortnite!.platforms).toContain('PC')
      expect(fortnite!.platforms).toContain('Mobile')
      expect(fortnite!.platforms).toContain('Switch')
    })

    it('returns undefined for invalid slug', () => {
      expect(getGameBySlug('')).toBeUndefined()
      expect(getGameBySlug('nonexistent')).toBeUndefined()
      expect(getGameBySlug('Valorant')).toBeUndefined() // case-sensitive
    })

    it('returns same reference as GAMES_MAP', () => {
      const fromFn = getGameBySlug('cs2')
      const fromMap = GAMES_MAP.get('cs2')
      expect(fromFn).toBe(fromMap)
    })
  })
})
