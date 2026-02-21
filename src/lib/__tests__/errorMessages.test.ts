/**
 * Tests pour le module errorMessages
 */

import { humanizeError, getRetryDelay } from '../errorMessages'

describe('humanizeError', () => {
  describe('exact matches', () => {
    it('should map common network errors', () => {
      expect(humanizeError('Failed to fetch')).toBe(
        'Connexion perdue. On réessaie automatiquement...'
      )
      expect(humanizeError('NetworkError')).toBe(
        'Pas de connexion internet. Vérifie ton réseau.'
      )
    })

    it('should map auth errors', () => {
      expect(humanizeError('JWT expired')).toBe(
        'Ta session a expiré. Reconnecte-toi.'
      )
      expect(humanizeError('Invalid login credentials')).toBe(
        'Email ou mot de passe incorrect.'
      )
    })

    it('should map database errors', () => {
      expect(humanizeError('duplicate key value')).toBe(
        'Cette action a déjà été effectuée.'
      )
      expect(humanizeError('Row not found')).toBe(
        'Élément introuvable. Il a peut-être été supprimé.'
      )
    })

    it('should map HTTP status codes', () => {
      expect(humanizeError('404')).toBe('Page introuvable.')
      expect(humanizeError('500')).toBe('Erreur serveur. On est dessus !')
      expect(humanizeError('503')).toBe(
        'Service en maintenance. Reviens dans quelques minutes.'
      )
    })
  })

  describe('partial matches (case-insensitive)', () => {
    it('should find matches regardless of case', () => {
      expect(humanizeError('RATE LIMIT EXCEEDED')).toBe(
        'Doucement ! Réessaie dans quelques secondes.'
      )
      expect(humanizeError('Too Many Requests')).toBe(
        'Trop de requêtes. Patiente un moment.'
      )
    })

    it('should work with Error objects', () => {
      const error = new Error('Failed to fetch')
      expect(humanizeError(error)).toBe(
        'Connexion perdue. On réessaie automatiquement...'
      )
    })
  })

  describe('fallback', () => {
    it('should return default message for unknown errors', () => {
      expect(humanizeError('Some unknown error')).toBe(
        'Une erreur est survenue. Réessaie ou contacte le support.'
      )
    })

    it('should handle non-Error, non-string types', () => {
      // null/undefined/{} are not Error or string, so the intermediate message
      // 'Une erreur inattendue est survenue.' is used internally but doesn't
      // match any ERROR_MAP key, falling through to the default return.
      const defaultMsg = 'Une erreur est survenue. Réessaie ou contacte le support.'
      expect(humanizeError(null)).toBe(defaultMsg)
      expect(humanizeError(undefined)).toBe(defaultMsg)
      expect(humanizeError({})).toBe(defaultMsg)
    })
  })
})

describe('getRetryDelay', () => {
  it('should implement exponential backoff', () => {
    expect(getRetryDelay(0)).toBe(1000) // 2^0 * 1000
    expect(getRetryDelay(1)).toBe(2000) // 2^1 * 1000
    expect(getRetryDelay(2)).toBe(4000) // 2^2 * 1000
    expect(getRetryDelay(3)).toBe(8000) // 2^3 * 1000
  })

  it('should cap at 30 seconds', () => {
    expect(getRetryDelay(4)).toBe(16000)
    expect(getRetryDelay(5)).toBe(30000) // Capped
    expect(getRetryDelay(6)).toBe(30000) // Still capped
    expect(getRetryDelay(100)).toBe(30000) // Still capped
  })

  it('should handle zero attempt', () => {
    expect(getRetryDelay(0)).toBe(1000)
  })
})
