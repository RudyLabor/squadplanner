import { describe, it, expect } from 'vitest'
import { en } from '../en'
import { fr } from '../fr'

describe('en locale', () => {
  it('exports an object', () => {
    expect(en).toBeDefined()
    expect(typeof en).toBe('object')
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
      expect(en).toHaveProperty(key)
    })
  })

  it('has the same top-level keys as fr locale', () => {
    const enKeys = Object.keys(en).sort()
    const frKeys = Object.keys(fr).sort()
    expect(enKeys).toEqual(frKeys)
  })

  it('nav section has expected entries', () => {
    expect(en.nav.home).toBe('Home')
    expect(en.nav.sessions).toBe('Sessions')
    expect(en.nav.squads).toBe('Squads')
    expect(en.nav.messages).toBe('Messages')
  })

  it('time functions return strings', () => {
    expect(typeof en.time.minutesAgo(5)).toBe('string')
    expect(typeof en.time.hoursAgo(2)).toBe('string')
    expect(typeof en.time.daysAgo(1)).toBe('string')
    expect(typeof en.time.minutes(3)).toBe('string')
    expect(typeof en.time.hours(1)).toBe('string')
    expect(typeof en.time.days(7)).toBe('string')
  })

  it('squads.members function returns string', () => {
    expect(typeof en.squads.members(3)).toBe('string')
  })

  it('en and fr have matching nested keys for static sections', () => {
    const staticSections = ['nav', 'actions', 'empty', 'status', 'errors', 'success'] as const
    staticSections.forEach((section) => {
      const enSectionKeys = Object.keys(en[section]).sort()
      const frSectionKeys = Object.keys(fr[section]).sort()
      expect(enSectionKeys, `${section} keys should match`).toEqual(frSectionKeys)
    })
  })
})
