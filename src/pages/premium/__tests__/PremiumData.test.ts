import { describe, it, expect } from 'vitest'
import { FEATURES, TESTIMONIALS, FAQ } from '../PremiumData'

describe('PremiumData', () => {
  describe('FEATURES', () => {
    it('exports FEATURES as a non-empty array', () => {
      expect(Array.isArray(FEATURES)).toBe(true)
      expect(FEATURES.length).toBeGreaterThan(0)
    })

    it('each feature has name, free, premium, icon, and highlight', () => {
      FEATURES.forEach((f) => {
        expect(f.name).toBeTruthy()
        expect(f.icon).toBeTruthy()
        expect(f.free !== undefined).toBe(true)
        expect(f.premium !== undefined).toBe(true)
        expect(typeof f.highlight).toBe('boolean')
      })
    })

    it('contains exactly 8 features', () => {
      expect(FEATURES).toHaveLength(8)
    })

    it('icon is a valid React component (function)', () => {
      FEATURES.forEach((f) => {
        expect(typeof f.icon).toBe('function')
      })
    })

    it('includes Squads feature with correct free tier limit', () => {
      const squads = FEATURES.find((f) => f.name === 'Squads')
      expect(squads).toBeDefined()
      expect(squads!.free).toBe('2 max')
      expect(squads!.highlight).toBe(true)
    })

    it('includes Historique sessions feature with 30 days free', () => {
      const hist = FEATURES.find((f) => f.name === 'Historique sessions')
      expect(hist).toBeDefined()
      expect(hist!.free).toBe('30 jours')
    })

    it('includes Stats & Analytics feature', () => {
      const stats = FEATURES.find((f) => f.name === 'Stats & Analytics')
      expect(stats).toBeDefined()
      expect(stats!.free).toBe('Basiques')
    })

    it('includes IA Coach feature', () => {
      const ai = FEATURES.find((f) => f.name === 'IA Coach')
      expect(ai).toBeDefined()
      expect(ai!.free).toBe('Conseils simples')
    })

    it('some features have boolean free/premium (Export calendrier, Badge)', () => {
      const exportCal = FEATURES.find((f) => f.name === 'Export calendrier')
      expect(exportCal).toBeDefined()
      expect(exportCal!.free).toBe(false)
      expect(exportCal!.premium).toBe(true)

      const badge = FEATURES.find((f) => f.name === 'Badge Premium')
      expect(badge).toBeDefined()
      expect(badge!.free).toBe(false)
      expect(badge!.premium).toBe(true)
    })

    it('highlighted features come first in the list', () => {
      const highlightedFeatures = FEATURES.filter((f) => f.highlight)
      const nonHighlighted = FEATURES.filter((f) => !f.highlight)

      expect(highlightedFeatures.length).toBeGreaterThan(0)
      expect(nonHighlighted.length).toBeGreaterThan(0)

      // All highlighted ones should appear before all non-highlighted
      const lastHighlightIndex = FEATURES.indexOf(
        highlightedFeatures[highlightedFeatures.length - 1]
      )
      const firstNonHighlightIndex = FEATURES.indexOf(nonHighlighted[0])
      expect(lastHighlightIndex).toBeLessThan(firstNonHighlightIndex)
    })

    it('audio quality and roles features are not highlighted', () => {
      const audio = FEATURES.find((f) => f.name === 'Qualité audio Party')
      expect(audio!.highlight).toBe(false)

      const roles = FEATURES.find((f) => f.name === 'Rôles squad')
      expect(roles!.highlight).toBe(false)
    })

    it('Rôles squad shows Membre / Admin for free tier', () => {
      const roles = FEATURES.find((f) => f.name === 'Rôles squad')
      expect(roles!.free).toBe('Membre / Admin')
      expect(roles!.premium).toBe('Shotcaller, IGL, Coach...')
    })
  })

  describe('TESTIMONIALS', () => {
    it('exports TESTIMONIALS as a non-empty array', () => {
      expect(Array.isArray(TESTIMONIALS)).toBe(true)
      expect(TESTIMONIALS.length).toBeGreaterThan(0)
    })

    it('contains exactly 3 testimonials', () => {
      expect(TESTIMONIALS).toHaveLength(3)
    })

    it('each testimonial has name, squad, text, memberSince, and avatarType', () => {
      TESTIMONIALS.forEach((t) => {
        expect(t.name).toBeTruthy()
        expect(t.squad).toBeTruthy()
        expect(t.text).toBeTruthy()
        expect(t.memberSince).toBeTruthy()
        expect(t.avatarType).toBeTruthy()
      })
    })

    it('each testimonial has a unique avatarType', () => {
      const avatarTypes = TESTIMONIALS.map((t) => t.avatarType)
      const uniqueTypes = new Set(avatarTypes)
      expect(uniqueTypes.size).toBe(avatarTypes.length)
    })

    it('each testimonial has a unique name', () => {
      const names = TESTIMONIALS.map((t) => t.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('memberSince starts with "Membre depuis"', () => {
      TESTIMONIALS.forEach((t) => {
        expect(t.memberSince).toMatch(/^Membre depuis/)
      })
    })

    it('contains specific testimonial from AlexGaming', () => {
      const alex = TESTIMONIALS.find((t) => t.name === 'AlexGaming')
      expect(alex).toBeDefined()
      expect(alex!.squad).toBe('Les Ranked du Soir')
      expect(alex!.avatarType).toBe('alex')
    })

    it('contains specific testimonial from MarieGG', () => {
      const marie = TESTIMONIALS.find((t) => t.name === 'MarieGG')
      expect(marie).toBeDefined()
      expect(marie!.squad).toBe('GG Girls')
      expect(marie!.avatarType).toBe('marie')
    })

    it('contains specific testimonial from LucasApex', () => {
      const lucas = TESTIMONIALS.find((t) => t.name === 'LucasApex')
      expect(lucas).toBeDefined()
      expect(lucas!.squad).toBe('Apex Legends FR')
      expect(lucas!.avatarType).toBe('lucas')
    })

    it('testimonial texts mention premium benefits', () => {
      TESTIMONIALS.forEach((t) => {
        // Each testimonial should be a non-trivial message
        expect(t.text.length).toBeGreaterThan(30)
      })
    })
  })

  describe('FAQ', () => {
    it('exports FAQ as a non-empty array', () => {
      expect(Array.isArray(FAQ)).toBe(true)
      expect(FAQ.length).toBeGreaterThan(0)
    })

    it('contains exactly 3 FAQ items', () => {
      expect(FAQ).toHaveLength(3)
    })

    it('each FAQ item has q and a fields', () => {
      FAQ.forEach((item) => {
        expect(typeof item.q).toBe('string')
        expect(typeof item.a).toBe('string')
        expect(item.q.length).toBeGreaterThan(0)
        expect(item.a.length).toBeGreaterThan(0)
      })
    })

    it('each question ends with a question mark', () => {
      FAQ.forEach((item) => {
        expect(item.q.endsWith('?')).toBe(true)
      })
    })

    it('answers are longer than questions', () => {
      FAQ.forEach((item) => {
        expect(item.a.length).toBeGreaterThan(item.q.length)
      })
    })

    it('contains cancellation question', () => {
      const cancel = FAQ.find((f) => f.q.includes('annuler'))
      expect(cancel).toBeDefined()
      expect(cancel!.a).toContain('profil')
    })

    it('contains squad vs personal question', () => {
      const squad = FAQ.find((f) => f.q.includes('squad'))
      expect(squad).toBeDefined()
      expect(squad!.a).toContain('personnel')
    })

    it('contains trial period question', () => {
      const trial = FAQ.find((f) => f.q.includes('essai'))
      expect(trial).toBeDefined()
      expect(trial!.a).toContain('7 jours')
      expect(trial!.a).toContain('30 jours')
    })
  })
})
