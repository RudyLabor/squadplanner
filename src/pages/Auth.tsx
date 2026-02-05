import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Loader2, Gamepad2, CheckCircle } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, Input } from '../components/ui'
import { SquadPlannerLogo } from '../components/SquadPlannerLogo'
import { useAuthStore, useSquadsStore } from '../hooks'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const urlMode = searchParams.get('mode')
  const [mode, setMode] = useState<'login' | 'register'>(urlMode === 'register' ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const { signIn, signUp, signInWithGoogle, isLoading } = useAuthStore()
  const { fetchSquads } = useSquadsStore()
  const navigate = useNavigate()

  const handleGoogleSignIn = async () => {
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
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
      setError(error.message)
    } else {
      setResetEmailSent(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        await fetchSquads()
        const { squads } = useSquadsStore.getState()
        if (squads.length === 0) {
          navigate('/onboarding')
        } else {
          navigate('/')
        }
      }
    } else {
      if (!username.trim()) {
        setError('Le pseudo est requis')
        return
      }
      const { error } = await signUp(email, password, username)
      if (error) {
        setError(error.message)
      } else {
        navigate('/onboarding')
      }
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError(null)
    setEmail('')
    setPassword('')
    setUsername('')
  }

  return (
    <div className="min-h-screen bg-[#08090a] flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(94,109,210,0.08)] via-transparent to-transparent pointer-events-none" />

      {/* Header with logo */}
      <header className="relative z-10 px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
          <SquadPlannerLogo size={28} />
          <span className="text-[15px] font-semibold text-[#f7f8f8]">Squad Planner</span>
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
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[rgba(94,109,210,0.15)] mb-5">
                  <Gamepad2 className="w-7 h-7 text-[#5e6dd2]" />
                </div>
                <h1 className="text-[28px] font-bold text-[#f7f8f8] mb-2">
                  {mode === 'login' ? 'Content de te revoir' : 'Rejoins la partie'}
                </h1>
                <p className="text-[15px] text-[#8b8d90]">
                  {mode === 'login'
                    ? 'Tes squads t\'attendent'
                    : 'Crée ton compte en 30 secondes'
                  }
                </p>
              </div>

              {/* Form */}
              <Card className="mb-6">
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* Google - En premier, plus visible */}
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full h-12"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                      <div className="w-full border-t border-[rgba(255,255,255,0.08)]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-[#101012] text-[12px] text-[#5e6063] uppercase tracking-wider">
                        ou par email
                      </span>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="space-y-3">
                    {mode === 'register' && (
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ton pseudo de gamer"
                        icon={<User className="w-4 h-4" />}
                        required
                        autoComplete="username"
                      />
                    )}

                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ton@email.gg"
                      icon={<Mail className="w-4 h-4" />}
                      required
                      autoComplete="email"
                    />

                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mot de passe"
                      icon={<Lock className="w-4 h-4" />}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
                          <p className="text-[#f87171] text-[13px]">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <Button type="submit" className="w-full h-12" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      mode === 'login' ? 'Se connecter' : 'Créer mon compte'
                    )}
                  </Button>

                  {/* Forgot password - login only */}
                  {mode === 'login' && (
                    <div className="text-center">
                      {resetEmailSent ? (
                        <div className="flex items-center justify-center gap-2 text-[#4ade80]">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-[13px]">Email envoyé ! Vérifie ta boîte mail</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={isResetting}
                          className="text-[13px] text-[#5e6063] hover:text-[#8b8d90] transition-colors disabled:opacity-50"
                        >
                          {isResetting ? 'Envoi en cours...' : 'Mot de passe oublié ?'}
                        </button>
                      )}
                    </div>
                  )}
                </form>
              </Card>

              {/* Toggle mode */}
              <div className="text-center">
                <p className="text-[14px] text-[#8b8d90]">
                  {mode === 'login' ? 'Première fois ?' : 'Déjà un compte ?'}
                  {' '}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-[#5e6dd2] hover:text-[#8b93ff] font-medium transition-colors"
                  >
                    {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
                  </button>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center">
        <p className="text-[12px] text-[#5e6063]">
          En continuant, tu acceptes nos conditions d'utilisation
        </p>
      </footer>
    </div>
  )
}
