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
  
  const { signIn, signUp, isLoading } = useAuthStore()
  const navigate = useNavigate()

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
