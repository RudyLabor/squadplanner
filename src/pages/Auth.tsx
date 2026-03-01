import { useState, useMemo, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Loader2, Gamepad2, CheckCircle } from '../components/icons'
import { Link, useNavigate, useSearchParams } from 'react-router'
import Confetti from '../components/LazyConfetti'
import { Button, Card } from '../components/ui'
import { SquadPlannerLogo } from '../components/SquadPlannerLogo'
import { useAuthStore } from '../hooks'
import { useReferralStore } from '../hooks/useReferral'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { translateAuthError } from './auth/AuthHelpers'
import { AuthGoogleButton } from './auth/AuthGoogleButton'
import { AuthFormFields } from './auth/AuthFormFields'
import type { FieldErrors } from './auth/AuthFormFields'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Auth() {
  const [searchParams] = useSearchParams()
  const urlMode = searchParams.get('mode')
  const referralCode = searchParams.get('ref')
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(
    urlMode === 'register' || referralCode ? 'register' : urlMode === 'reset' ? 'reset' : 'login'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)

  const { signIn, signUp, signInWithGoogle, user, isInitialized } = useAuthStore()
  const navigate = useNavigate()

  // Redirect logged-in users via useEffect (not conditional render)
  // to avoid SSR/client hydration mismatch — SSR always renders the form
  // since auth state isn't available server-side.
  useEffect(() => {
    if (isInitialized && user && mode !== 'reset') {
      navigate('/home', { replace: true })
    }
  }, [isInitialized, user, mode, navigate])

  const isFormValid = useMemo(() => {
    if (mode === 'login') {
      return email.trim().length > 0 && EMAIL_REGEX.test(email) && password.length > 0
    }
    if (mode === 'register') {
      return (
        username.trim().length > 0 &&
        email.trim().length > 0 &&
        EMAIL_REGEX.test(email) &&
        password.length >= 6
      )
    }
    // mode === 'reset'
    return password.length >= 6 && confirmPassword === password
  }, [mode, email, password, confirmPassword, username])

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
    setIsSubmitting(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(translateAuthError(error.message))
      setIsSubmitting(false)
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
    if (error) setError(translateAuthError(error.message))
    else setResetEmailSent(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const errors: FieldErrors = {}
    if (mode === 'register' && !username.trim()) errors.username = 'Le pseudo est requis'
    if (mode !== 'reset' && !email.trim()) errors.email = "L'email est requis"
    else if (mode !== 'reset' && !EMAIL_REGEX.test(email))
      errors.email = "L'adresse email n'est pas valide"
    if (!password) errors.password = 'Le mot de passe est requis'
    else if (password.length < 6)
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(translateAuthError(error.message))
        setIsSubmitting(false)
      } else {
        const redirectUrl = sessionStorage.getItem('redirectAfterAuth')
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterAuth')
          // SEC: Validate redirect URL to prevent open redirect attacks.
          // Only allow relative paths starting with '/' (no protocol/host).
          if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
            navigate(redirectUrl)
          } else {
            navigate('/home')
          }
        } else {
          // Always navigate to /home after login. The _protected layout's
          // clientLoader will reliably fetch squads (with retry) and redirect
          // to /onboarding if the user truly has none. Fetching squads here
          // caused a race condition: the auth session wasn't fully settled yet,
          // so fetchSquads would silently fail → squads=[] → wrong redirect.
          navigate('/home')
        }
      }
    } else {
      const { error } = await signUp(email, password, username)
      if (error) {
        setError(translateAuthError(error.message))
        setIsSubmitting(false)
      } else {
        // Process referral code if present in URL (?ref=CODE)
        if (referralCode) {
          try {
            await useReferralStore.getState().processReferralCode(referralCode)
          } catch {
            // Non-blocking — referral failure shouldn't block signup flow
          }
        }
        setShowConfetti(true)
        setTimeout(() => navigate('/onboarding'), 1500)
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
    <div className="h-[100dvh] bg-bg-base mesh-bg flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide-mobile">
      {showConfetti && typeof window !== 'undefined' && (
        <>
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={120}
            gravity={0.25}
            colors={[
              'var(--color-primary)',
              'var(--color-success)',
              'var(--color-warning)',
              'var(--color-purple)',
            ]}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
          />
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none"
          >
            <div className="px-6 py-4 rounded-2xl bg-bg-elevated/90 border border-primary/20 backdrop-blur-sm shadow-lg">
              <p className="text-lg font-bold text-text-primary text-center">
                C'est parti ! On prépare ta squad...
              </p>
            </div>
          </m.div>
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />

      <header className="relative z-10 px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
          <SquadPlannerLogo size={28} />
          <span className="text-base font-semibold text-text-primary">Squad Planner</span>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-[900px] flex flex-col lg:flex-row gap-6 lg:gap-12 items-center">
          {/* Social proof sidebar — condensed on mobile, full on desktop */}
          <div className="flex flex-col gap-4 lg:gap-6 w-full lg:w-[380px] lg:flex-shrink-0 order-2 lg:order-1">
            <div className="p-4 lg:p-6 rounded-2xl bg-bg-elevated border border-border-subtle">
              <div className="flex items-center gap-2 lg:mb-4">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-success">+2 000 gamers inscrits</span>
              </div>
              <p className="hidden lg:block text-lg font-bold text-text-primary mb-1">
                Rejoins la communauté
              </p>
              <p className="hidden lg:block text-sm text-text-tertiary">
                Des squads planifient leurs sessions en ce moment même.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface-card border border-border-subtle">
                <p className="text-sm text-text-secondary italic mb-2">
                  « Depuis Squad Planner, on joue 3 fois par semaine au lieu d'une. Tout le monde confirme, personne ne ghost. »
                </p>
                <p className="text-xs text-text-quaternary">— Alex_Valo, squad Valorant</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-card border border-border-subtle">
                <p className="text-sm text-text-secondary italic mb-2">
                  « Le meilleur outil pour organiser nos sessions ranked. On a fini par monter ensemble grâce à la régularité. »
                </p>
                <p className="text-xs text-text-quaternary">— SarahLoL, squad League of Legends</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {['🎯 Valorant', '⚔️ LoL', '🏗️ Fortnite', '🌍 Minecraft', '🚀 Rocket League', '🎮 Apex'].map((g) => (
                <span key={g} className="px-3 py-1.5 rounded-full bg-bg-elevated border border-border-subtle text-xs text-text-tertiary">
                  {g}
                </span>
              ))}
            </div>

            <p className="hidden lg:block text-xs text-text-quaternary text-center">
              30 secondes pour commencer · 100% gratuit
            </p>
          </div>

          <div className="w-full max-w-[400px] mx-auto order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <m.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-10 mb-5">
                  <Gamepad2 className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-lg font-bold text-text-primary mb-2 font-display">
                  {mode === 'login'
                    ? "Ta squad t'attend, reconnecte-toi !"
                    : mode === 'reset'
                      ? 'Nouveau mot de passe'
                      : 'Rejoins ta squad en 30 secondes'}
                </h1>
                <p className="text-base text-text-secondary">
                  {mode === 'login'
                    ? 'Des sessions sont peut-être déjà planifiées'
                    : mode === 'reset'
                      ? 'Choisis un nouveau mot de passe sécurisé'
                      : 'Inscription gratuite. Pas de carte bancaire. Jamais.'}
                </p>
              </div>

              <Card className="mb-6">
                <form
                  onSubmit={mode === 'reset' ? handlePasswordUpdate : handleSubmit}
                  noValidate
                  className="p-5 space-y-4"
                >
                  {mode !== 'reset' && (
                    <AuthGoogleButton
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting}
                      loading={isSubmitting}
                    />
                  )}

                  <AuthFormFields
                    mode={mode}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    username={username}
                    setUsername={setUsername}
                    fieldErrors={fieldErrors}
                    setFieldErrors={setFieldErrors}
                  />

                  {passwordUpdated && (
                    <div className="p-3 rounded-xl bg-success-5 border border-success/10">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-base">Mot de passe mis à jour !</span>
                      </div>
                    </div>
                  )}

                  <div aria-live="polite" aria-atomic="true">
                    <AnimatePresence>
                      {error && (
                        <m.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="p-3 rounded-xl bg-error-5 border border-error"
                            role="alert"
                          >
                            <p className="text-error text-base">{error}</p>
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button
                    type="submit"
                    className={`w-full h-12 ${!isFormValid && !isSubmitting && !isResetting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting || isResetting || !isFormValid}
                  >
                    {isSubmitting || isResetting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : mode === 'login' ? (
                      'Se connecter'
                    ) : mode === 'reset' ? (
                      'Mettre à jour'
                    ) : (
                      'Créer ma squad — c\u2019est gratuit'
                    )}
                  </Button>

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

              {mode !== 'reset' && (
                <div className="text-center">
                  <p className="text-base text-text-secondary">
                    {mode === 'login' ? 'Première fois ?' : 'Déjà un compte ?'}{' '}
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
            </m.div>
          </AnimatePresence>
        </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-4 text-center">
        <p className="text-sm text-text-tertiary">
          En continuant, tu acceptes nos{' '}
          <Link to="/legal" className="text-primary hover:text-purple underline transition-colors">
            conditions d'utilisation
          </Link>{' '}
          et notre{' '}
          <Link
            to="/legal?tab=privacy"
            className="text-primary hover:text-purple underline transition-colors"
          >
            politique de confidentialité
          </Link>
        </p>
      </footer>
    </div>
  )
}
