import { describe, it, expect } from 'vitest'
import { fr } from '../fr'
import type { TranslationKeys } from '../fr'

describe('fr locale', () => {
  it('exports an object', () => {
    expect(fr).toBeDefined()
    expect(typeof fr).toBe('object')
  })

  it('has all expected top-level keys', () => {
    const expectedKeys = [
      'nav',
      'actions',
      'empty',
      'status',
      'time',
      'errors',
      'success',
      'notifications',
      'sessions',
      'squads',
      'messages',
      'settings',
      'premium',
      'auth',
    ]
    expectedKeys.forEach((key) => {
      expect(fr).toHaveProperty(key)
    })
  })

  it('nav section has expected French entries', () => {
    expect(fr.nav.home).toBe('Accueil')
    expect(fr.nav.sessions).toBe('Sessions')
    expect(fr.nav.squads).toBe('Squads')
    expect(fr.nav.messages).toBe('Messages')
    expect(fr.nav.discover).toBe('Découvrir')
  })

  it('time functions return French strings', () => {
    expect(fr.time.minutesAgo(5)).toContain('Il y a')
    expect(fr.time.hoursAgo(2)).toContain('Il y a')
    expect(fr.time.daysAgo(1)).toContain('Il y a')
  })

  it('squads.members handles pluralization', () => {
    expect(fr.squads.members(1)).toBe('1 membre')
    expect(fr.squads.members(3)).toBe('3 membres')
  })

  it('time.minutes handles pluralization', () => {
    expect(fr.time.minutes(1)).toBe('1 minute')
    expect(fr.time.minutes(5)).toBe('5 minutes')
  })

  it('time.hours handles pluralization', () => {
    expect(fr.time.hours(1)).toBe('1 heure')
    expect(fr.time.hours(3)).toBe('3 heures')
  })

  it('time.days handles pluralization', () => {
    expect(fr.time.days(1)).toBe('1 jour')
    expect(fr.time.days(7)).toBe('7 jours')
  })

  it('exports TranslationKeys type', () => {
    const partial: Partial<TranslationKeys> = {
      nav: fr.nav,
    }
    expect(partial.nav).toBeDefined()
  })

  it('settings has all nested sections', () => {
    expect(fr.settings.notifications).toBeDefined()
    expect(fr.settings.audio).toBeDefined()
    expect(fr.settings.appearance).toBeDefined()
    expect(fr.settings.privacy).toBeDefined()
    expect(fr.settings.region).toBeDefined()
    expect(fr.settings.data).toBeDefined()
    expect(fr.settings.legal).toBeDefined()
  })
})
