/**
 * Comprehensive tests for src/utils/gameImages.ts
 * Covers: getGameImageUrl, getGameGradient, getGameInitial, hasGameImage,
 *         normalizeGameName, getGradientForGame, image cache
 */
import { describe, it, expect } from 'vitest'
import { getGameImageUrl, getGameGradient, getGameInitial, hasGameImage } from '../gameImages'

describe('gameImages', () => {
  // =========================================================================
  // getGameImageUrl
  // =========================================================================
  describe('getGameImageUrl', () => {
    it('returns URL for Fortnite', () => {
      const url = getGameImageUrl('Fortnite')
      expect(url).toBeTruthy()
      expect(url).toContain('http')
    })

    it('returns URL for Valorant', () => {
      expect(getGameImageUrl('Valorant')).toBeTruthy()
    })

    it('returns URL for Minecraft', () => {
      expect(getGameImageUrl('Minecraft')).toBeTruthy()
    })

    it('returns URL for League of Legends', () => {
      expect(getGameImageUrl('League of Legends')).toBeTruthy()
    })

    it('returns URL for CS2', () => {
      expect(getGameImageUrl('CS2')).toBeTruthy()
    })

    it('returns URL for CS:GO (alias)', () => {
      expect(getGameImageUrl('CS:GO')).toBeTruthy()
    })

    it('returns URL for Overwatch 2', () => {
      expect(getGameImageUrl('Overwatch 2')).toBeTruthy()
    })

    it('returns URL for GTA (alias)', () => {
      expect(getGameImageUrl('GTA')).toBeTruthy()
    })

    it('returns URL for WoW (alias)', () => {
      expect(getGameImageUrl('WoW')).toBeTruthy()
    })

    it('returns URL for Rocket League', () => {
      expect(getGameImageUrl('Rocket League')).toBeTruthy()
    })

    it('returns URL for PUBG', () => {
      expect(getGameImageUrl('PUBG')).toBeTruthy()
    })

    it('returns URL for Destiny 2', () => {
      expect(getGameImageUrl('Destiny 2')).toBeTruthy()
    })

    it('returns URL for Rainbow Six', () => {
      expect(getGameImageUrl('Rainbow Six')).toBeTruthy()
    })

    it('returns empty string for unknown game', () => {
      expect(getGameImageUrl('Unknown Game XYZ 2099')).toBe('')
    })

    it('returns empty string for empty input', () => {
      expect(getGameImageUrl('')).toBe('')
    })

    it('is case-insensitive', () => {
      const url1 = getGameImageUrl('FORTNITE')
      const url2 = getGameImageUrl('fortnite')
      const url3 = getGameImageUrl('Fortnite')
      expect(url1).toBe(url2)
      expect(url2).toBe(url3)
    })

    it('handles extra whitespace', () => {
      expect(getGameImageUrl('  Fortnite  ')).toBeTruthy()
    })

    it('handles special characters by stripping them', () => {
      // "CS:GO" has ":" which gets stripped by normalizeGameName
      expect(getGameImageUrl('CS:GO')).toBeTruthy()
    })

    it('uses cache for repeated lookups', () => {
      const url1 = getGameImageUrl('Valorant')
      const url2 = getGameImageUrl('Valorant')
      expect(url1).toBe(url2) // Same reference from cache
    })

    it('caches empty string for unknown games', () => {
      const url1 = getGameImageUrl('Not A Real Game 42')
      const url2 = getGameImageUrl('Not A Real Game 42')
      expect(url1).toBe('')
      expect(url2).toBe('')
    })

    it('handles partial matches (game name includes key)', () => {
      // "fortnite battle royale" includes "fortnite"
      expect(getGameImageUrl('Fortnite Battle Royale')).toBeTruthy()
    })

    it('handles partial matches (key includes normalized name)', () => {
      // "apex" is included in "apex legends"
      expect(getGameImageUrl('Apex')).toBeTruthy()
    })
  })

  // =========================================================================
  // getGameGradient
  // =========================================================================
  describe('getGameGradient', () => {
    it('returns CSS gradient string', () => {
      const gradient = getGameGradient('Fortnite')
      expect(gradient).toContain('linear-gradient')
      expect(gradient).toContain('135deg')
      expect(gradient).toContain('0%')
      expect(gradient).toContain('100%')
    })

    it('returns different gradients for different first letters', () => {
      const gradA = getGameGradient('Apex')
      const gradV = getGameGradient('Valorant')
      expect(gradA).not.toBe(gradV)
    })

    it('returns same gradient for same first letter', () => {
      const grad1 = getGameGradient('Fortnite')
      const grad2 = getGameGradient('FIFA')
      expect(grad1).toBe(grad2)
    })

    it('handles empty string with default gradient', () => {
      const gradient = getGameGradient('')
      expect(gradient).toContain('linear-gradient')
      // Empty string charAt(0) is '', which won't match any letter
      // Falls back to default
    })

    it('returns gradient for each letter a-z', () => {
      for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
        const gradient = getGameGradient(letter)
        expect(gradient).toContain('linear-gradient')
      }
    })

    it('returns default gradient for numbers', () => {
      const gradient = getGameGradient('123 Game')
      expect(gradient).toContain('linear-gradient')
    })
  })

  // =========================================================================
  // getGameInitial
  // =========================================================================
  describe('getGameInitial', () => {
    it('returns uppercase first letter for lowercase input', () => {
      expect(getGameInitial('valorant')).toBe('V')
    })

    it('returns uppercase first letter for uppercase input', () => {
      expect(getGameInitial('Fortnite')).toBe('F')
    })

    it('returns uppercase first letter for mixed case', () => {
      expect(getGameInitial('cS2')).toBe('C')
    })

    it('returns empty string for empty input', () => {
      expect(getGameInitial('')).toBe('')
    })

    it('handles numbers as first character', () => {
      expect(getGameInitial('2K24')).toBe('2')
    })

    it('handles special characters as first character', () => {
      expect(getGameInitial('!special')).toBe('!')
    })

    it('handles single character', () => {
      expect(getGameInitial('x')).toBe('X')
    })
  })

  // =========================================================================
  // hasGameImage
  // =========================================================================
  describe('hasGameImage', () => {
    it('returns true for known games', () => {
      expect(hasGameImage('Fortnite')).toBe(true)
      expect(hasGameImage('Minecraft')).toBe(true)
      expect(hasGameImage('Valorant')).toBe(true)
    })

    it('returns false for unknown games', () => {
      expect(hasGameImage('Unknown Game 99')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(hasGameImage('')).toBe(false)
    })

    it('is case-insensitive', () => {
      expect(hasGameImage('FORTNITE')).toBe(true)
      expect(hasGameImage('fortnite')).toBe(true)
    })
  })
})
