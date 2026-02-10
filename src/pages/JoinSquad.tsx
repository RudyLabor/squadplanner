import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Loader2, CheckCircle2, XCircle, LogIn } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { useAuthStore } from '../hooks/useAuth'
import { useSquadsStore } from '../hooks/useSquads'
import { supabase } from '../lib/supabase'
import { showSuccess, showError } from '../lib/toast'

interface SquadPreview {
  id: string
  name: string
  game: string
  member_count: number
}

/**
 * Deep linking page for joining a squad via invite code
 * URL: /join/:code
 *
 * Phase 5.3 - Deep linking
 */
export function JoinSquad() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user, isInitialized } = useAuthStore()
  const { joinSquad, fetchSquads } = useSquadsStore()

  const [status, setStatus] = useState<'loading' | 'preview' | 'joining' | 'success' | 'error' | 'not-found'>('loading')
  const [squadPreview, setSquadPreview] = useState<SquadPreview | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch squad preview
  useEffect(() => {
    const fetchSquadPreview = async () => {
      if (!code) {
        setStatus('not-found')
        return
      }

      try {
        // Get squad info by invite code (public query - no auth required)
        const { data: squad, error } = await supabase
          .from('squads')
          .select('id, name, game')
          .eq('invite_code', code.toUpperCase())
          .single()

        if (error || !squad) {
          setStatus('not-found')
          return
        }

        // Get member count
        const { count } = await supabase
          .from('squad_members')
          .select('*', { count: 'exact', head: true })
          .eq('squad_id', squad.id)

        setSquadPreview({
          ...squad,
          member_count: count || 0
        })
        setStatus('preview')
      } catch {
        setStatus('not-found')
      }
    }

    fetchSquadPreview()
  }, [code])

  // Handle join
  const handleJoin = async () => {
    if (!code || !user) return

    setStatus('joining')

    try {
      const { error } = await joinSquad(code)

      if (error) {
        if (error.message.includes('déjà partie')) {
          // Already a member - redirect to squad
          showSuccess('Tu fais déjà partie de cette squad !')
          await fetchSquads(true)
          navigate(`/squad/${squadPreview?.id}`, { replace: true })
          return
        }
        throw error
      }

      setStatus('success')
      showSuccess(`Bienvenue dans ${squadPreview?.name} !`)

      // Refresh squads and redirect after animation
      await fetchSquads(true)
      setTimeout(() => {
        navigate(`/squad/${squadPreview?.id}`, { replace: true })
      }, 1500)
    } catch (err) {
      setStatus('error')
      const message = err instanceof Error ? err.message : 'Impossible de rejoindre la squad'
      setErrorMessage(message)
      showError(message)
    }
  }

  // Redirect to auth if not logged in (with return URL)
  const handleLoginRedirect = () => {
    // Store the join URL to redirect back after auth
    sessionStorage.setItem('redirectAfterAuth', `/join/${code}`)
    navigate('/auth')
  }

  // Loading state
  if (!isInitialized || status === 'loading') {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center p-4" aria-label="Rejoindre une squad">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Chargement de l'invitation...</p>
        </div>
      </main>
    )
  }

  // Not found
  if (status === 'not-found') {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center p-4" aria-label="Rejoindre une squad">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-error" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            Invitation invalide
          </h1>
          <p className="text-text-secondary mb-6">
            Ce code d'invitation n'existe pas ou a expiré.
          </p>
          <Link to="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </motion.div>
      </main>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center p-4" aria-label="Rejoindre une squad">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-success" />
          </motion.div>
          <h1 className="text-lg font-bold text-text-primary mb-2">
            Bienvenue dans la squad !
          </h1>
          <p className="text-text-secondary">
            Tu fais maintenant partie de {squadPreview?.name}
          </p>
        </motion.div>
      </main>
    )
  }

  // Preview / Join state
  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center p-4" aria-label="Rejoindre une squad">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="p-6">
          {/* Squad info */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
            >
              <Users className="w-8 h-8 text-primary" />
            </motion.div>

            <h1 className="text-xl font-semibold text-text-primary mb-1">
              {squadPreview?.name}
            </h1>
            <p className="text-text-secondary text-sm mb-2">
              {squadPreview?.game}
            </p>
            <p className="text-text-tertiary text-xs">
              {squadPreview?.member_count} membre{(squadPreview?.member_count || 0) > 1 ? 's' : ''}
            </p>
          </div>

          {/* Action */}
          {user ? (
            <div className="space-y-3">
              <Button
                onClick={handleJoin}
                disabled={status === 'joining'}
                className="w-full"
              >
                {status === 'joining' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Rejoindre...
                  </>
                ) : (
                  'Rejoindre la squad'
                )}
              </Button>

              {status === 'error' && errorMessage && (
                <p className="text-error text-sm text-center">
                  {errorMessage}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-text-secondary text-sm text-center mb-4">
                Connecte-toi pour rejoindre cette squad
              </p>
              <Button onClick={handleLoginRedirect} className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Se connecter
              </Button>
            </div>
          )}
        </Card>

        {/* Back link */}
        <div className="text-center mt-4">
          <Link to="/" className="text-text-tertiary text-sm hover:text-text-secondary transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </motion.div>
    </main>
  )
}

export default JoinSquad
