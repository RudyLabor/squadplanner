/** Traduit les erreurs Supabase Auth en français */
export function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'Email not confirmed': 'Vérifie ton email avant de te connecter',
    'User already registered': 'Cet email est déjà utilisé',
    'Password should be at least 6 characters':
      'Le mot de passe doit contenir au moins 6 caractères',
    'Unable to validate email address: invalid format': "Format d'email invalide",
    'Signup requires a valid password': 'Un mot de passe valide est requis',
    'Email rate limit exceeded': 'Trop de tentatives, réessaie dans quelques minutes',
    'For security purposes, you can only request this once every 60 seconds':
      'Pour des raisons de sécurité, attends 60 secondes avant de réessayer',
    'New password should be different from the old password.':
      "Le nouveau mot de passe doit être différent de l'ancien",
    'Auth session missing!': 'Session expirée, reconnecte-toi',
    'User not found': 'Aucun compte trouvé avec cet email',
    'Token has expired or is invalid': 'Le lien a expiré, demande un nouveau lien',
    'Email link is invalid or has expired': 'Le lien a expiré, demande un nouveau lien',
  }

  for (const [en, fr] of Object.entries(translations)) {
    if (message.includes(en)) return fr
  }
  return message
}

/** Simple password strength indicator */
export function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pw: string): { level: number; label: string; color: string } => {
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    if (score <= 1) return { level: 1, label: 'Faible', color: 'bg-error' }
    if (score <= 2) return { level: 2, label: 'Moyen', color: 'bg-warning' }
    if (score <= 3) return { level: 3, label: 'Bon', color: 'bg-primary-bg' }
    return { level: 4, label: 'Fort', color: 'bg-success' }
  }

  const { level, label, color } = getStrength(password)

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= level ? color : 'bg-border-subtle'}`}
          />
        ))}
      </div>
      <p className="text-xs text-text-tertiary mt-1">{label}</p>
    </div>
  )
}
