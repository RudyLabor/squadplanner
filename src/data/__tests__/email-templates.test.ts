import { describe, it, expect } from 'vitest'
import { EMAIL_TEMPLATES, getTemplate, renderTemplate } from '../email-templates'

describe('email-templates', () => {
  describe('EMAIL_TEMPLATES', () => {
    it('contains exactly 8 templates', () => {
      expect(EMAIL_TEMPLATES).toHaveLength(8)
    })

    it('all templates have unique IDs', () => {
      const ids = EMAIL_TEMPLATES.map((t) => t.id)
      expect(new Set(ids).size).toBe(EMAIL_TEMPLATES.length)
    })

    it('all templates have required fields', () => {
      for (const template of EMAIL_TEMPLATES) {
        expect(template.id).toBeTruthy()
        expect(template.trigger).toBeTruthy()
        expect(template.subject).toBeTruthy()
        expect(template.delay).toBeTruthy()
        expect(typeof template.html).toBe('function')
      }
    })

    it('includes expected template IDs', () => {
      const ids = EMAIL_TEMPLATES.map((t) => t.id)
      expect(ids).toContain('welcome')
      expect(ids).toContain('invite_friends')
      expect(ids).toContain('session_missed')
      expect(ids).toContain('squad_playing')
      expect(ids).toContain('trial_ending')
      expect(ids).toContain('trial_ended')
      expect(ids).toContain('monthly_digest')
      expect(ids).toContain('anniversary')
    })

    it('delays follow expected format (Xd)', () => {
      for (const template of EMAIL_TEMPLATES) {
        expect(template.delay).toMatch(/^-?\d+d$/)
      }
    })

    it('triggers are descriptive event names', () => {
      const triggers = EMAIL_TEMPLATES.map((t) => t.trigger)
      expect(triggers).toContain('user_signup')
      expect(triggers).toContain('missed_sessions')
      expect(triggers).toContain('monthly')
      expect(triggers).toContain('user_anniversary')
    })
  })

  describe('getTemplate', () => {
    it('returns welcome template', () => {
      const template = getTemplate('welcome')
      expect(template).toBeDefined()
      expect(template!.trigger).toBe('user_signup')
    })

    it('returns trial_ending template', () => {
      const template = getTemplate('trial_ending')
      expect(template).toBeDefined()
      expect(template!.delay).toBe('-3d')
    })

    it('returns undefined for invalid ID', () => {
      expect(getTemplate('nonexistent')).toBeUndefined()
      expect(getTemplate('')).toBeUndefined()
    })
  })

  describe('renderTemplate', () => {
    it('renders welcome email with name variable', () => {
      const result = renderTemplate('welcome', { name: 'Alex' })
      expect(result).not.toBeNull()
      expect(result!.subject).toBe('Bienvenue sur Squad Planner ! 🎮')
      expect(result!.html).toContain('Alex')
      expect(result!.html).toContain('Bienvenue')
    })

    it('renders welcome email with default name when not provided', () => {
      const result = renderTemplate('welcome', {})
      expect(result!.html).toContain('Champion')
    })

    it('renders squad_playing email with squad_id', () => {
      const result = renderTemplate('squad_playing', { squad_id: 'abc123' })
      expect(result).not.toBeNull()
      expect(result!.html).toContain('abc123')
    })

    it('renders squad_playing email with fallback when no squad_id', () => {
      const result = renderTemplate('squad_playing', {})
      expect(result!.html).toContain('dashboard')
    })

    it('renders monthly_digest with stats variables', () => {
      const result = renderTemplate('monthly_digest', {
        sessions_count: '25',
        hours_played: '100',
        reliability: '95',
        xp_gained: '5000',
      })
      expect(result).not.toBeNull()
      expect(result!.html).toContain('25')
      expect(result!.html).toContain('100')
      expect(result!.html).toContain('95')
      expect(result!.html).toContain('5000')
    })

    it('monthly_digest uses defaults when vars empty', () => {
      const result = renderTemplate('monthly_digest', {})
      expect(result!.html).toContain('12') // default sessions_count
      expect(result!.html).toContain('48') // default hours_played
    })

    it('returns null for invalid template ID', () => {
      expect(renderTemplate('nonexistent')).toBeNull()
    })

    it('all templates produce valid HTML with DOCTYPE', () => {
      for (const template of EMAIL_TEMPLATES) {
        const result = renderTemplate(template.id, { name: 'Test', squad_id: 'test123' })
        expect(result).not.toBeNull()
        expect(result!.html).toContain('<!DOCTYPE html>')
        expect(result!.html).toContain('<html lang="fr">')
        expect(result!.html).toContain('</html>')
      }
    })

    it('all templates include unsubscribe link', () => {
      for (const template of EMAIL_TEMPLATES) {
        const result = renderTemplate(template.id, {})
        expect(result!.html).toContain('Se désabonner')
      }
    })

    it('all templates include privacy link', () => {
      for (const template of EMAIL_TEMPLATES) {
        const result = renderTemplate(template.id, {})
        expect(result!.html).toContain('squadplanner.fr/privacy')
      }
    })

    it('trial_ended template shows -20% discount', () => {
      const result = renderTemplate('trial_ended', {})
      expect(result!.html).toContain('-20%')
      expect(result!.html).toContain('3,99€')
    })

    it('anniversary template shows -30% discount', () => {
      const result = renderTemplate('anniversary', {})
      expect(result!.html).toContain('-30%')
      expect(result!.html).toContain('34,99€')
    })
  })
})
