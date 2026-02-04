import { useState } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, ArrowLeft, Mail, Lock, User, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Input } from '../components/ui'
import { useAuthStore } from '../hooks'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const { signIn, signUp, signInWithGoogle, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleGoogleSignIn = async () => {
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
    // OAuth will redirect, so no need to navigate here
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        navigate('/')
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
        navigate('/')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        {/* Back button */}
        <motion.div variants={itemVariants} className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-[#8b8d90] hover:text-[#f7f8f8] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </motion.div>

        {/* Icon */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 text-[#5e6dd2]" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#f7f8f8] mb-2">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </h1>
          <p className="text-[#8b8d90]">
            {mode === 'login' ? 'Retrouve tes squads' : 'Crée ton compte'}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div variants={itemVariants}>
          <Card>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {mode === 'register' && (
                <Input
                  label="Pseudo"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="TonPseudo"
                  icon={<User className="w-5 h-5" />}
                  required
                />
              )}
              
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
                icon={<Mail className="w-5 h-5" />}
                required
              />
              
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                required
              />

              {error && (
                <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
                  <p className="text-[#f87171] text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  mode === 'login' ? 'Se connecter' : 'Créer mon compte'
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgba(255,255,255,0.1)]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#101012] text-[#5e6063]">ou</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuer avec Google
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Toggle mode */}
        <motion.div variants={itemVariants} className="text-center mt-6">
          <p className="text-[#8b8d90]">
            {mode === 'login' ? "Pas encore de compte ?" : "Déjà un compte ?"}
            {' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
              }}
              className="text-[#5e6dd2] hover:text-[#8b93ff] font-medium"
            >
              {mode === 'login' ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
