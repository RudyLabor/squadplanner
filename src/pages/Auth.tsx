import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Gamepad2, CheckCircle } from 'lucide-react'
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import Confetti from '../components/LazyConfetti'
import { Button, Card } from '../components/ui'
import { SquadPlannerLogo } from '../components/SquadPlannerLogo'
import { useAuthStore, useSquadsStore } from '../hooks'
import { supabase } from '../lib/supabase'
import { translateAuthError } from './auth/AuthHelpers'
import { AuthGoogleButton } from './auth/AuthGoogleButton'
import { AuthFormFields } from './auth/AuthFormFields'
import type { FieldErrors } from './auth/AuthFormFields'

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)

  const { signIn, signUp, signInWithGoogle, isLoading, user, isInitialized } = useAuthStore()
  const { fetchSquads } = useSquadsStore()
  const navigate = useNavigate()

  if (isInitialized && user && mode !== 'reset') {
    return <Navigate to="/home" replace />
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return }
    setIsResetting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setIsResetting(false)
    if (error) { setError(translateAuthError(error.message)) }
    else {
      setPasswordUpdated(true)
      setShowConfetti(true)
      setTimeout(() => { setMode('login'); setPassword(''); setConfirmPassword('') }, 2000)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) setError(translateAuthError(error.message))
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError('Entre ton email pour recevoir le lien de réinitialisation'); return }
    setIsResetting(true); setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    })
    setIsResetting(false)
    if (error) setError(translateAuthError(error.message))
    else setResetEmailSent(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setFieldErrors({})
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const errors: FieldErrors = {}
    if (mode === 'register' && !username.trim()) errors.username = 'Le pseudo est requis'
    if (mode !== 'reset' && !email.trim()) errors.email = "L'email est requis"
    else if (mode !== 'reset' && !emailRegex.test(email)) errors.email = "L'adresse email n'est pas valide"
    if (!password) errors.password = 'Le mot de passe est requis'
    else if (password.length < 6) errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) { setError(translateAuthError(error.message)) }
      else {
        const redirectUrl = sessionStorage.getItem('redirectAfterAuth')
        if (redirectUrl) { sessionStorage.removeItem('redirectAfterAuth'); navigate(redirectUrl) }
        else { await fetchSquads(); const { squads } = useSquadsStore.getState(); navigate(squads.length === 0 ? '/onboarding' : '/home') }
      }
    } else {
      const { error } = await signUp(email, password, username)
      if (error) { setError(translateAuthError(error.message)) }
      else { setShowConfetti(true); setTimeout(() => navigate('/onboarding'), 1500) }
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError(null); setFieldErrors({}); setEmail(''); setPassword(''); setUsername('')
  }

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide-mobile">
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={120} gravity={0.25}
          colors={['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-purple)']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />

      <header className="relative z-10 px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
          <SquadPlannerLogo size={28} />
          <span className="text-md font-semibold text-text-primary">Squad Planner</span>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-10 mb-5">
                  <Gamepad2 className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-lg font-bold text-text-primary mb-2">
                  {mode === 'login' ? 'T\'as manqué à ta squad !' : mode === 'reset' ? 'Nouveau mot de passe' : 'Rejoins l\'aventure'}
                </h1>
                <p className="text-md text-text-secondary">
                  {mode === 'login' ? 'Tes potes t\'attendent' : mode === 'reset' ? 'Choisis un nouveau mot de passe sécurisé' : 'Crée ton compte en 30 secondes'}
                </p>
              </div>

              <Card className="mb-6">
                <form onSubmit={mode === 'reset' ? handlePasswordUpdate : handleSubmit} noValidate className="p-5 space-y-4">
                  {mode !== 'reset' && (
                    <AuthGoogleButton onClick={handleGoogleSignIn} disabled={isLoading} />
                  )}

                  <AuthFormFields
                    mode={mode} email={email} setEmail={setEmail}
                    password={password} setPassword={setPassword}
                    confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                    username={username} setUsername={setUsername}
                    fieldErrors={fieldErrors} setFieldErrors={setFieldErrors}
                  />

                  {passwordUpdated && (
                    <div className="p-3 rounded-xl bg-success-5 border border-success/10">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="w-4 h-4" /><span className="text-base">Mot de passe mis à jour !</span>
                      </div>
                    </div>
                  )}

                  <div aria-live="polite" aria-atomic="true">
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="p-3 rounded-xl bg-error-5 border border-error" role="alert">
                            <p className="text-error text-base">{error}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button type="submit" className="w-full h-12" disabled={isLoading || isResetting}>
                    {(isLoading || isResetting) ? <Loader2 className="w-5 h-5 animate-spin" />
                      : mode === 'login' ? 'Se connecter' : mode === 'reset' ? 'Mettre à jour' : 'Créer mon compte'}
                  </Button>

                  {mode === 'login' && (
                    <div className="text-center">
                      {resetEmailSent ? (
                        <div className="flex items-center justify-center gap-2 text-success">
                          <CheckCircle className="w-4 h-4" /><span className="text-base">Email envoyé ! Vérifie ta boîte mail</span>
                        </div>
                      ) : (
                        <button type="button" onClick={handleForgotPassword} disabled={isResetting}
                          className="text-base text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-50">
                          {isResetting ? 'Envoi en cours...' : 'Mot de passe oublié ?'}
                        </button>
                      )}
                    </div>
                  )}
                  {mode === 'reset' && (
                    <div className="text-center">
                      <button type="button" onClick={() => setMode('login')}
                        className="text-base text-text-tertiary hover:text-text-secondary transition-colors">
                        Retour à la connexion
                      </button>
                    </div>
                  )}
                </form>
              </Card>

              {mode !== 'reset' && (
                <div className="text-center">
                  <p className="text-md text-text-secondary">
                    {mode === 'login' ? 'Première fois ?' : 'Déjà un compte ?'}{' '}
                    <button type="button" onClick={switchMode} className="text-primary hover:text-purple font-medium transition-colors">
                      {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
                    </button>
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-4 text-center">
        <p className="text-sm text-text-tertiary">
          En continuant, tu acceptes nos{' '}
          <Link to="/legal" className="text-primary hover:text-purple underline transition-colors">conditions d'utilisation</Link>
          {' '}et notre{' '}
          <Link to="/legal?tab=privacy" className="text-primary hover:text-purple underline transition-colors">politique de confidentialité</Link>
        </p>
      </footer>
    </div>
  )
}
