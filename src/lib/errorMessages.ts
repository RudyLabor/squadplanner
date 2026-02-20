/**
 * Maps technical errors to human-friendly French messages.
 * Every error the user sees should be understandable by a non-technical person.
 */

const ERROR_MAP: Record<string, string> = {
  // Network
  'Failed to fetch': 'Connexion perdue. On réessaie automatiquement...',
  'NetworkError': 'Pas de connexion internet. Vérifie ton réseau.',
  'TypeError: Failed to fetch': 'Le serveur ne répond pas. Réessaie dans quelques secondes.',
  'AbortError': 'La requête a pris trop de temps. Réessaie.',
  'TimeoutError': 'Le serveur met trop de temps à répondre.',

  // Auth
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'User already registered': 'Cet email est déjà utilisé. Essaie de te connecter.',
  'Email not confirmed': 'Vérifie ta boîte mail pour confirmer ton compte.',
  'Invalid Refresh Token': 'Ta session a expiré. Reconnecte-toi.',
  'JWT expired': 'Ta session a expiré. Reconnecte-toi.',

  // Database
  'duplicate key value': 'Cette action a déjà été effectuée.',
  'violates foreign key constraint': 'Impossible de supprimer — des données liées existent encore.',
  'violates unique constraint': 'Cet élément existe déjà.',
  'Row not found': 'Élément introuvable. Il a peut-être été supprimé.',
  'PGRST116': 'Élément introuvable.',

  // Rate limiting
  'rate limit': 'Doucement ! Réessaie dans quelques secondes.',
  'too many requests': 'Trop de requêtes. Patiente un moment.',
  '429': 'Serveur surchargé. Réessaie dans 30 secondes.',

  // File upload
  'Payload too large': 'Fichier trop volumineux. Maximum 5 Mo.',
  'unsupported media type': 'Format de fichier non supporté.',

  // Permission
  'permission denied': 'Tu n\'as pas la permission pour cette action.',
  'not authorized': 'Connecte-toi pour continuer.',
  '403': 'Accès refusé.',
  '401': 'Session expirée. Reconnecte-toi.',
  '404': 'Page introuvable.',
  '500': 'Erreur serveur. On est dessus !',
  '502': 'Le serveur est temporairement indisponible.',
  '503': 'Service en maintenance. Reviens dans quelques minutes.',
}

export function humanizeError(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : 'Une erreur inattendue est survenue.'

  // Check for exact match first
  if (ERROR_MAP[message]) return ERROR_MAP[message]

  // Check for partial match
  const lowerMessage = message.toLowerCase()
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (lowerMessage.includes(key.toLowerCase())) return value
  }

  // Default
  return 'Une erreur est survenue. Réessaie ou contacte le support.'
}

export function getRetryDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000)
}
