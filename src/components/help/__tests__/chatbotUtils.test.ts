import { describe, it, expect } from 'vitest'
import {
  QUICK_ACTIONS,
  GREETING_MESSAGE,
  findBestMatch,
  getNoMatchResponse,
  type FAQItem,
} from '../chatbotUtils'

describe('chatbotUtils', () => {
  describe('QUICK_ACTIONS', () => {
    it('exports a non-empty array of quick actions', () => {
      expect(QUICK_ACTIONS.length).toBeGreaterThan(0)
    })

    it('contains expected actions', () => {
      expect(QUICK_ACTIONS).toContain('Premium')
      expect(QUICK_ACTIONS).toContain('Party vocale')
    })
  })

  describe('GREETING_MESSAGE', () => {
    it('has role "bot"', () => {
      expect(GREETING_MESSAGE.role).toBe('bot')
    })

    it('has a non-empty text', () => {
      expect(GREETING_MESSAGE.text.length).toBeGreaterThan(0)
    })

    it('has id "greeting"', () => {
      expect(GREETING_MESSAGE.id).toBe('greeting')
    })
  })

  describe('findBestMatch', () => {
    const faqItems: FAQItem[] = [
      {
        question: 'Comment creer une squad ?',
        answer: 'Va dans le menu Squads et clique sur le bouton +',
        category: 'squads',
      },
      {
        question: 'Comment fonctionne le score de fiabilite ?',
        answer: 'Le score est calcule en fonction de ta presence aux sessions',
        category: 'profile',
      },
      {
        question: 'Comment passer Premium ?',
        answer: 'Va dans les parametres et choisis Premium',
        category: 'premium',
      },
    ]

    it('returns an answer when a match is found', () => {
      const result = findBestMatch('comment creer squad', faqItems)
      expect(result).toBeTruthy()
      expect(result).toContain('bouton')
    })

    it('returns null when no match is found', () => {
      const result = findBestMatch('xyz abc', faqItems)
      expect(result).toBeNull()
    })

    it('returns null for empty input', () => {
      const result = findBestMatch('', faqItems)
      expect(result).toBeNull()
    })

    it('returns null for very short words only', () => {
      const result = findBestMatch('le la un', faqItems)
      expect(result).toBeNull()
    })

    it('finds best match based on question relevance', () => {
      const result = findBestMatch('score fiabilite', faqItems)
      expect(result).toContain('presence')
    })

    it('matches against answer text too', () => {
      const result = findBestMatch('parametres premium', faqItems)
      expect(result).toBeTruthy()
    })
  })

  describe('getNoMatchResponse', () => {
    it('returns a non-empty string', () => {
      const result = getNoMatchResponse()
      expect(result.length).toBeGreaterThan(0)
    })

    it('mentions support or reformulation', () => {
      const result = getNoMatchResponse()
      expect(result).toContain('support')
    })
  })
})
