import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Loader2, Gamepad2, CheckCircle } from 'lucide-react'
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Button, Card, Input } from '../components/ui'
import { SquadPlannerLogo } from '../components/SquadPlannerLogo'
import { useAuthStore, useSquadsStore } from '../hooks'
import { supabase } from '../lib/supabase'

/** Traduit les erreurs Supabase Auth en francais */
function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'Email not confirmed': 'Vérifie ton email avant de te connecter',
    'User already registered': 'Cet email est déjà utilisé',
    'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
    'Unable to validate email address: invalid format': 'Format d\'email invalide',
    'Signup requires a valid password': 'Un mot de passe valide est requis',
    'Email rate limit exceeded': 'Trop de tentatives, réessaie dans quelques minutes',
    'For security purposes, you can only request this once every 60 seconds': 'Pour des raisons de sécurité, attends 60 secondes avant de réessayer',
    'New password should be different from the old password.': 'Le nouveau mot de passe doit être différent de l\'ancien',
    'Auth session missing!': 'Session expirée, reconnecte-toi',
    'User not found': 'Aucun compte trouvé avec cet email',
    'Token has expired or is invalid': 'Le lien a expiré, demande un nouveau lien',
    'Email link is invalid or has expired': 'Le lien a expiré, demande un nouveau lien',
  }

  for (const [en, fr] of Object.entries(translations)) {
    if (message.includes(en)) return fr
  }
  // Fallback: si pas de traduction, retourner le message tel quel
  return message
}

/** Simple password strength indicator */
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pw: string): { level: number; label: string; color: string } => {
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    if (score <= 1) return { level: 1, label: 'Faible', color: 'bg-error' }
    if (score <= 2) return { level: 2, label: 'Moyen', color: 'bg-warning' }
    if (score <= 3) return { level: 3, label: 'Bon', color: 'bg-primary' }
    return { level: 4, label: 'Fort', color: 'bg-success' }
  }

  const { level, label, color } = getStrength(password)

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
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

export default function Auth() {
  const [searchParams] = useSearchParams()
  const urlMode = searchParams.get('mode')
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(
    urlMode === 'register' ? 'register' : urlMode === 'reset' ? 'reset' : 'login'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string }>({})
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)

  const { signIn, signUp, signInWithGoogle, isLoading, user, isInitialized } = useAuthStore()
  const { fetchSquads } = useSquadsStore()
  const navigate = useNavigate()

  // Si l'utilisateur est déjà connecté, rediriger vers la bonne page
  // Sauf pour le mode reset (changement de mot de passe)
  // NOTE: La redirection vers onboarding se fait dans ProtectedRoute/App.tsx
  // pour une meilleure gestion du flow
  if (isInitialized && user && mode !== 'reset') {
    // Rediriger vers home, le check onboarding sera fait là-bas
    return <Navigate to="/home" replace />
  }

  // Handle password update for reset mode
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setIsResetting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setIsResetting(false)

    if (error) {
      setError(translateAuthError(error.message))
    } else {
      setPasswordUpdated(true)
      setShowConfetti(true)
      setTimeout(() => {
        setMode('login')
        setPassword('')
        setConfirmPassword('')
      }, 2000)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(translateAuthError(error.message))
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Entre ton email pour recevoir le lien de réinitialisation')
      return
    }

    setIsResetting(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    })

    setIsResetting(false)

    if (error) {
      setError(translateAuthError(error.message))
    } else {
      setResetEmailSent(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // Client-side validation — show all errors at once
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const errors: { username?: string; email?: string; password?: string } = {}

    if (mode === 'register' && !username.trim()) {
      errors.username = 'Le pseudo est requis'
    }
    if (mode !== 'reset' && !email.trim()) {
      errors.email = "L'email est requis"
    } else if (mode !== 'reset' && !emailRegex.test(email)) {
      errors.email = "L'adresse email n'est pas valide"
    }
    if (!password) {
      errors.password = 'Le mot de passe est requis'
    } else if (password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(translateAuthError(error.message))
      } else {
        // Check for redirect URL (e.g., from /join/:code deep link)
        const redirectUrl = sessionStorage.getItem('redirectAfterAuth')
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterAuth')
          navigate(redirectUrl)
        } else {
          await fetchSquads()
          const { squads } = useSquadsStore.getState()
          if (squads.length === 0) {
            navigate('/onboarding')
          } else {
            navigate('/home')
          }
        }
      }
    } else {
      const { error } = await signUp(email, password, username)
      if (error) {
        setError(translateAuthError(error.message))
      } else {
        setShowConfetti(true)
        setTimeout(() => {
          navigate('/onboarding')
        }, 1500)
      }
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError(null)
    setFieldErrors({})
    setEmail('')
    setPassword('')
    setUsername('')
  }

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide-mobile">
      {/* Celebration confetti on signup */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={120}
          gravity={0.25}
          colors={['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-purple)']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />

      {/* Header with logo */}
      <header className="relative z-10 px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
          <SquadPlannerLogo size={28} />
          <span className="text-md font-semibold text-text-primary">Squad Planner</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-10 mb-5">
                  <Gamepad2 className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  {mode === 'login' ? 'T\'as manqué à ta squad !' : mode === 'reset' ? 'Nouveau mot de passe' : 'Rejoins l\'aventure'}
                </h1>
                <p className="text-md text-text-secondary">
                  {mode === 'login'
                    ? 'Tes potes t\'attendent'
                    : mode === 'reset'
                      ? 'Choisis un nouveau mot de passe sécurisé'
                      : 'Crée ton compte en 30 secondes'
                  }
                </p>
              </div>

              {/* Form */}
              <Card className="mb-6">
                <form onSubmit={mode === 'reset' ? handlePasswordUpdate : handleSubmit} noValidate className="p-5 space-y-4">
                  {/* Google - only for login/register */}
                  {mode !== 'reset' && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full h-12"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        aria-label="Continuer avec Google"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuer avec Google
                      </Button>

                      {/* Divider */}
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border-hover" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-4 bg-bg-surface text-sm text-text-tertiary uppercase tracking-wider">
                            ou par email
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Fields */}
                  <div className="space-y-3">
                    {mode === 'register' && (
                      <div>
                        <Input
                          type="text"
                          value={username}
                          onChange={(e) => { setUsername(e.target.value); setFieldErrors(prev => ({ ...prev, username: undefined })) }}
                          placeholder="Ton pseudo de gamer"
                          icon={<User className="w-4 h-4" />}
                          required
                          autoComplete="username"
                          className={fieldErrors.username ? 'border-error focus:border-error' : ''}
                        />
                        {fieldErrors.username && <p className="text-error text-sm mt-1">{fieldErrors.username}</p>}
                      </div>
                    )}

                    {mode !== 'reset' && (
                      <div>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })) }}
                          placeholder="Email"
                          icon={<Mail className="w-4 h-4" />}
                          required
                          autoFocus={mode !== 'register'}
                          autoComplete="email"
                          className={fieldErrors.email ? 'border-error focus:border-error' : ''}
                        />
                        {fieldErrors.email && <p className="text-error text-sm mt-1">{fieldErrors.email}</p>}
                      </div>
                    )}

                    <div>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: undefined })) }}
                        placeholder={mode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'}
                        icon={<Lock className="w-4 h-4" />}
                        showPasswordToggle
                        required
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className={fieldErrors.password ? 'border-error focus:border-error' : ''}
                      />
                      {fieldErrors.password && <p className="text-error text-sm mt-1">{fieldErrors.password}</p>}
                      {/* Password strength indicator (register/reset only) */}
                      {(mode === 'register' || mode === 'reset') && password.length > 0 && (
                        <PasswordStrength password={password} />
                      )}
                    </div>

                    {mode === 'reset' && (
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmer le mot de passe"
                        icon={<Lock className="w-4 h-4" />}
                        showPasswordToggle
                        required
                        autoComplete="new-password"
                      />
                    )}
                  </div>

                  {/* Success message for password update */}
                  {passwordUpdated && (
                    <div className="p-3 rounded-xl bg-success-5 border border-success/10">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-base">Mot de passe mis à jour !</span>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  <div aria-live="polite" aria-atomic="true">
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 rounded-xl bg-error-5 border border-error" role="alert">
                            <p className="text-error text-base">{error}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Submit */}
                  <Button type="submit" className="w-full h-12" disabled={isLoading || isResetting}>
                    {(isLoading || isResetting) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      mode === 'login' ? 'Se connecter' : mode === 'reset' ? 'Mettre à jour' : 'Créer mon compte'
                    )}
                  </Button>

                  {/* Forgot password - login only */}
                  {mode === 'login' && (
                    <div className="text-center">
                      {resetEmailSent ? (
                        <div className="flex items-center justify-center gap-2 text-success">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-base">Email envoyé ! Vérifie ta boîte mail</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={isResetting}
                          className="text-base text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-50"
                        >
                          {isResetting ? 'Envoi en cours...' : 'Mot de passe oublié ?'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Back to login - reset mode only */}
                  {mode === 'reset' && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-base text-text-tertiary hover:text-text-secondary transition-colors"
                      >
                        Retour à la connexion
                      </button>
                    </div>
                  )}
                </form>
              </Card>

              {/* Toggle mode - not shown in reset mode */}
              {mode !== 'reset' && (
                <div className="text-center">
                  <p className="text-md text-text-secondary">
                    {mode === 'login' ? 'Première fois ?' : 'Déjà un compte ?'}
                    {' '}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-primary hover:text-purple font-medium transition-colors"
                    >
                      {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
                    </button>
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center">
        <p className="text-sm text-text-tertiary">
          En continuant, tu acceptes nos{' '}
          <Link to="/legal" className="text-primary hover:text-purple underline transition-colors">
            conditions d'utilisation
          </Link>
          {' '}et notre{' '}
          <Link to="/legal?tab=privacy" className="text-primary hover:text-purple underline transition-colors">
            politique de confidentialité
          </Link>
        </p>
      </footer>
    </div>
  )
}
