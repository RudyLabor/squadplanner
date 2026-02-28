import { describe, it, expect } from 'vitest'
import { FEATURES, TESTIMONIALS, FAQ } from '../PremiumData'

/**
 * PremiumData integrity tests — ZERO mocks.
 * Tests the actual exported data arrays to ensure they match
 * the PLAN-50K 4-tier pricing structure.
 */

describe('FEATURES — feature comparison table data (4 tiers)', () => {
  it('has at least 15 features', () => {
    expect(FEATURES.length).toBeGreaterThanOrEqual(15)
  })

  it('each feature has all 4 tier values + icon + highlight', () => {
    for (const feature of FEATURES) {
      expect(feature).toHaveProperty('name')
      expect(feature).toHaveProperty('free')
      expect(feature).toHaveProperty('premium')
      expect(feature).toHaveProperty('squadLeader')
      expect(feature).toHaveProperty('club')
      expect(feature).toHaveProperty('icon')
      expect(typeof feature.highlight).toBe('boolean')
    }
  })

  it('icon is a valid React component (function)', () => {
    for (const f of FEATURES) {
      expect(typeof f.icon).toBe('function')
    }
  })

  it('Squads feature: free=1, premium=5, SL/Club=Illimité', () => {
    const squads = FEATURES.find((f) => f.name === 'Squads')!
    expect(squads).toBeTruthy()
    expect(squads.free).toBe('1 squad')
    expect(squads.premium).toBe('5 squads')
    expect(squads.squadLeader).toBe('Illimité')
    expect(squads.club).toBe('Illimité')
    expect(squads.highlight).toBe(true)
  })

  it('Sessions: free=3, rest=Illimitées', () => {
    const sessions = FEATURES.find((f) => f.name === 'Sessions par semaine')!
    expect(sessions).toBeTruthy()
    expect(sessions.free).toBe('3')
    expect(sessions.premium).toBe('Illimitées')
    expect(sessions.squadLeader).toBe('Illimitées')
    expect(sessions.club).toBe('Illimitées')
  })

  it('Historique: free=7 jours, premium=90 jours, SL=Illimité', () => {
    const history = FEATURES.find((f) => f.name === 'Historique sessions')!
    expect(history).toBeTruthy()
    expect(history.free).toBe('7 jours')
    expect(history.premium).toBe('90 jours')
    expect(history.squadLeader).toBe('Illimité')
    expect(history.club).toBe('Illimité')
  })

  it('Chat complet: free=false, premium/SL/club=true', () => {
    const chat = FEATURES.find((f) => f.name.includes('Chat complet'))!
    expect(chat).toBeTruthy()
    expect(chat.free).toBe(false)
    expect(chat.premium).toBe(true)
    expect(chat.squadLeader).toBe(true)
    expect(chat.club).toBe(true)
  })

  it('Stats: free=Basiques, premium=Avancées, club=Cross-squad', () => {
    const stats = FEATURES.find((f) => f.name === 'Stats & Analytics')!
    expect(stats).toBeTruthy()
    expect(stats.free).toBe('Basiques')
    expect(stats.premium).toBe('Avancées')
    expect(stats.club).toBe('Cross-squad')
  })

  it('IA Coach: free=false, premium=Basique, SL=Avancé', () => {
    const ai = FEATURES.find((f) => f.name === 'IA Coach')!
    expect(ai).toBeTruthy()
    expect(ai.free).toBe(false)
    expect(ai.premium).toBe('Basique')
    expect(ai.squadLeader).toMatch(/Avancé/)
  })

  it('Audio HD Party: only squad_leader and club', () => {
    const hd = FEATURES.find((f) => f.name === 'Audio HD Party')!
    expect(hd).toBeTruthy()
    expect(hd.free).toBe(false)
    expect(hd.premium).toBe(false)
    expect(hd.squadLeader).toBe(true)
    expect(hd.club).toBe(true)
  })

  it('Club-only features: dashboard multi-squads, branding, export CSV, support', () => {
    const clubOnlyNames = [
      'Dashboard multi-squads',
      'Branding personnalisé',
      'Export CSV avancé',
      'Support prioritaire par email',
    ]
    for (const name of clubOnlyNames) {
      const feature = FEATURES.find((f) => f.name === name)!
      expect(feature).toBeTruthy()
      expect(feature.free).toBe(false)
      expect(feature.premium).toBe(false)
      expect(feature.squadLeader).toBe(false)
      expect(feature.club).toBe(true)
    }
  })

  it('Badge: free=false, premium=Violet, SL=Doré, club=Doré', () => {
    const badge = FEATURES.find((f) => f.name === 'Badge exclusif')!
    expect(badge).toBeTruthy()
    expect(badge.free).toBe(false)
    expect(badge.premium).toBe('Violet')
    expect(badge.squadLeader).toBe('Doré')
    expect(badge.club).toBe('Doré')
  })

  it('highlighted features come first in the list', () => {
    const highlightedFeatures = FEATURES.filter((f) => f.highlight)
    const nonHighlighted = FEATURES.filter((f) => !f.highlight)
    expect(highlightedFeatures.length).toBeGreaterThan(0)
    expect(nonHighlighted.length).toBeGreaterThan(0)
    const lastHighlightIndex = FEATURES.indexOf(highlightedFeatures[highlightedFeatures.length - 1])
    const firstNonHighlightIndex = FEATURES.indexOf(nonHighlighted[0])
    expect(lastHighlightIndex).toBeLessThan(firstNonHighlightIndex)
  })
})

describe('TESTIMONIALS', () => {
  it('has exactly 3 testimonials', () => {
    expect(TESTIMONIALS).toHaveLength(3)
  })

  it('each testimonial has name, squad, memberSince, text, avatarType', () => {
    for (const t of TESTIMONIALS) {
      expect(t.name).toBeTruthy()
      expect(t.squad).toBeTruthy()
      expect(t.memberSince).toMatch(/^Membre depuis/)
      expect(t.text.length).toBeGreaterThan(20)
      expect(['alex', 'marie', 'lucas']).toContain(t.avatarType)
    }
  })

  it('each testimonial has a unique avatarType', () => {
    const types = new Set(TESTIMONIALS.map((t) => t.avatarType))
    expect(types.size).toBe(3)
  })

  it('contains AlexGaming, MarieGG, LucasApex', () => {
    const names = TESTIMONIALS.map((t) => t.name)
    expect(names).toContain('AlexGaming')
    expect(names).toContain('MarieGG')
    expect(names).toContain('LucasApex')
  })
})

describe('FAQ', () => {
  it('has at least 4 FAQ items', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(4)
  })

  it('each FAQ has a question (q) and answer (a)', () => {
    for (const item of FAQ) {
      expect(item.q).toBeTruthy()
      expect(item.a).toBeTruthy()
      expect(item.q.endsWith('?')).toBe(true)
      expect(item.a.length).toBeGreaterThan(20)
    }
  })

  it('covers cancellation, Premium vs SL, Club, and trial questions', () => {
    const allQuestions = FAQ.map((f) => f.q).join(' ')
    expect(allQuestions).toMatch(/annuler/i)
    expect(allQuestions).toMatch(/Squad Leader/i)
    expect(allQuestions).toMatch(/Club/i)
    expect(allQuestions).toMatch(/essai/i)
  })

  it('trial answer mentions 7 jours and 30 jours', () => {
    const trial = FAQ.find((f) => f.q.includes('essai'))!
    expect(trial).toBeTruthy()
    expect(trial.a).toContain('7 jours')
    expect(trial.a).toContain('30 jours')
  })
})
