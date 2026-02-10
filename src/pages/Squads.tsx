import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Gamepad2, Link as LinkIcon, Copy, Check, Loader2, UserPlus, Calendar, Crown, Mic, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Button, Card, CardContent, Input, SquadCardSkeleton } from '../components/ui'
import { showSuccess } from '../lib/toast'
import { useAuthStore, useSquadsStore, useVoiceChatStore, usePremiumStore } from '../hooks'
import { SquadLimitReached, PremiumBadge } from '../components/PremiumGate'
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal'
import { supabase } from '../lib/supabase'
import { FREE_SQUAD_LIMIT } from '../hooks/usePremium'

// Stagger animations for squad list
const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Type pour les sessions à venir
interface SquadNextSession {
  squadId: string
  sessionTitle?: string
  scheduledAt: string
  rsvpCount: number
}


// Card squad améliorée
const SquadCard = memo(function SquadCard({ squad, isOwner, nextSession, hasActiveParty, copiedCode, onCopyCode }: {
  squad: {
    id: string
    name: string
    game: string
    invite_code: string
    member_count?: number
    total_members?: number
  }
  isOwner: boolean
  nextSession?: SquadNextSession
  hasActiveParty: boolean
  copiedCode: string | null
  onCopyCode: (code: string) => void
}) {
  const memberCount = squad.member_count || squad.total_members || 1

  // Formatage de la prochaine session
  let sessionLabel = ''
  if (nextSession) {
    const date = new Date(nextSession.scheduledAt)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMs < 0) {
      sessionLabel = 'Session en cours'
    } else if (diffHours < 1) {
      sessionLabel = 'Dans moins d\'1h'
    } else if (diffHours < 24) {
      sessionLabel = `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      sessionLabel = `Demain ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      sessionLabel = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    }
  }

  return (
    <motion.article
      layoutId={`squad-card-${squad.id}`}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-labelledby={`squad-name-${squad.id}`}
    >
      <Link to={`/squad/${squad.id}`}>
        <Card className={`cursor-pointer transition-interactive ${
          hasActiveParty
            ? 'border-success/30 shadow-glow-success bg-gradient-to-r from-success/5 to-transparent'
            : 'hover:border-primary/25 hover:shadow-glow-primary-sm'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Icône avec indicateur party */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  hasActiveParty
                    ? 'bg-success/15'
                    : 'bg-primary/15'
                }`}>
                  {hasActiveParty ? (
                    <Mic className="w-6 h-6 text-success" strokeWidth={1.5} />
                  ) : (
                    <Gamepad2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  )}
                </div>
                {hasActiveParty && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-bg-elevated"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: 3 }}
                  />
                )}
              </div>

              {/* Infos squad */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 id={`squad-name-${squad.id}`} className="text-md font-semibold text-text-primary truncate">{squad.name}</h3>
                  {isOwner && (
                    <Crown className="w-4 h-4 text-warning flex-shrink-0" />
                  )}
                </div>
                <p className="text-base text-text-tertiary">
                  {squad.game} · {memberCount} membre{memberCount > 1 ? 's' : ''}
                </p>

                {/* Prochaine session ou état */}
                <div className="mt-2">
                  {hasActiveParty ? (
                    <div className="flex items-center gap-1.5 text-sm text-success">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Party en cours</span>
                    </div>
                  ) : nextSession ? (
                    <div className="flex items-center gap-1.5 text-sm text-primary">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{sessionLabel}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm text-text-quaternary">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Aucune session planifiée</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onCopyCode(squad.invite_code)
                  }}
                  className="p-2 rounded-lg hover:bg-surface-card-hover transition-colors"
                  aria-label="Copier le code d'invitation"
                >
                  <motion.div
                    key={copiedCode === squad.invite_code ? 'check' : 'copy'}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    {copiedCode === squad.invite_code ? (
                      <Check className="w-4 h-4 text-success" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4 text-text-quaternary" aria-hidden="true" />
                    )}
                  </motion.div>
                </button>
                <ChevronRight className="w-5 h-5 text-text-quaternary" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.article>
  )
})

export default function Squads() {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [name, setName] = useState('')
  const [game, setGame] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [nextSessions, setNextSessions] = useState<SquadNextSession[]>([])
  const [showConfetti, setShowConfetti] = useState(false)

  const { user, isInitialized } = useAuthStore()
  const { squads, isLoading, fetchSquads, createSquad, joinSquad } = useSquadsStore()
  const { isConnected: isInVoiceChat, currentChannel } = useVoiceChatStore()
  const { hasPremium, canCreateSquad, fetchPremiumStatus, userSquadCount } = usePremiumStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isInitialized && !user) {
      navigate('/auth')
    } else if (user) {
      fetchSquads()
      fetchPremiumStatus()
    }
  }, [user, isInitialized, navigate, fetchSquads, fetchPremiumStatus])

  // Fetch next sessions for all squads
  useEffect(() => {
    const fetchNextSessions = async () => {
      if (!user || squads.length === 0) return

      const squadIds = squads.map(s => s.id)

      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, squad_id, title, scheduled_at')
        .in('squad_id', squadIds)
        .neq('status', 'cancelled')
        .gte('scheduled_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order('scheduled_at', { ascending: true })

      if (sessions) {
        // Get the first (next) session for each squad
        const sessionMap = new Map<string, SquadNextSession>()
        for (const session of sessions) {
          if (!sessionMap.has(session.squad_id)) {
            // Get RSVP count
            const { count } = await supabase
              .from('session_rsvps')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id)
              .eq('response', 'present')

            sessionMap.set(session.squad_id, {
              squadId: session.squad_id,
              sessionTitle: session.title,
              scheduledAt: session.scheduled_at,
              rsvpCount: count || 0,
            })
          }
        }
        setNextSessions(Array.from(sessionMap.values()))
      }
    }

    fetchNextSessions()
  }, [user, squads])

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !game.trim()) {
      setError('Nom et jeu sont requis')
      return
    }

    // Verifier la limite de squads pour les utilisateurs gratuits
    if (!canCreateSquad()) {
      setError(`Limite de ${FREE_SQUAD_LIMIT} squads atteinte. Passe Premium pour en créer plus !`)
      setShowPremiumModal(true)
      return
    }

    const { squad, error } = await createSquad({ name, game })
    if (error) {
      setError(error.message)
    } else {
      setShowCreate(false)
      setName('')
      setGame('')
      showSuccess(`Squad "${squad?.name}" creee !`)
      // Refresh premium status apres creation
      fetchPremiumStatus()
    }
  }

  // Handler pour ouvrir le formulaire de creation avec verification premium
  const handleOpenCreate = () => {
    if (!canCreateSquad()) {
      setShowPremiumModal(true)
    } else {
      setShowCreate(true)
    }
  }

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!inviteCode.trim()) {
      setError('Code d\'invitation requis')
      return
    }

    const { error } = await joinSquad(inviteCode)
    if (error) {
      setError(error.message)
    } else {
      setShowJoin(false)
      setInviteCode('')
      showSuccess('Bienvenue dans la squad !')
      // Celebration confetti
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
    }
  }

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    showSuccess('Code d\'invitation copié ! 📋')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Déterminer si une squad a une party active
  const getSquadHasActiveParty = (squadId: string): boolean => {
    return !!(isInVoiceChat && currentChannel?.includes(squadId))
  }

  // Afficher le skeleton loader tant que l'initialisation ou le chargement est en cours
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-0 bg-bg-base pb-6">
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-bold text-text-primary">Mes Squads</h1>
              <p className="text-base text-text-quaternary">Chargement...</p>
            </div>
          </div>
          <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
            <SquadCardSkeleton />
            <SquadCardSkeleton />
            <SquadCardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  // Subtitle contextuel
  const getSubtitle = () => {
    if (squads.length === 0) return 'Crée ou rejoins ta première squad'
    if (squads.length === 1) return '1 squad'
    return `${squads.length} squads`
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Squads">
      {/* Celebration confetti */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={100}
          gravity={0.25}
          colors={['#6366f1', '#34d399', '#fbbf24', '#a78bfa']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          {/* Header simplifié */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-bold text-text-primary">Mes Squads</h1>
              <p className="text-base text-text-quaternary">{getSubtitle()}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowJoin(true)}>
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Rejoindre</span>
              </Button>
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Créer</span>
                {!hasPremium && userSquadCount >= FREE_SQUAD_LIMIT && (
                  <PremiumBadge small />
                )}
              </Button>
            </div>
          </header>

          {/* Alerte limite atteinte */}
          {!hasPremium && userSquadCount >= FREE_SQUAD_LIMIT && !showCreate && !showJoin && (
            <div className="mb-6">
              <SquadLimitReached
                currentCount={userSquadCount}
                maxCount={FREE_SQUAD_LIMIT}
                onUpgrade={() => setShowPremiumModal(true)}
              />
            </div>
          )}

          {/* Join Form */}
          <AnimatePresence>
            {showJoin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-6 overflow-hidden"
              >
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Rejoindre une squad</h3>
                    <form onSubmit={handleJoinSquad} className="space-y-4">
                      <Input
                        label="Code d'invitation"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        icon={<LinkIcon className="w-5 h-5" />}
                      />
                      {error && (
                        <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                          <p className="text-error text-base">{error}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button type="button" variant="ghost" onClick={() => { setShowJoin(false); setError(null) }}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rejoindre'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Form */}
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-6 overflow-hidden"
              >
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Créer une squad</h3>
                    <form onSubmit={handleCreateSquad} className="space-y-4">
                      <Input
                        label="Nom de la squad"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Les Légendes"
                        icon={<Users className="w-5 h-5" />}
                      />
                      <Input
                        label="Jeu principal"
                        value={game}
                        onChange={(e) => setGame(e.target.value)}
                        placeholder="Valorant, LoL, Fortnite..."
                        icon={<Gamepad2 className="w-5 h-5" />}
                      />
                      {error && (
                        <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                          <p className="text-error text-base">{error}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setError(null) }}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Squads List */}
          {squads.length > 0 ? (
            <motion.ul
              className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0 list-none"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
              aria-label="Liste des squads"
            >
              {squads.map((squad) => (
                <motion.li key={squad.id} variants={staggerItemVariants}>
                  <SquadCard
                    squad={squad}
                    isOwner={squad.owner_id === user?.id}
                    nextSession={nextSessions.find(s => s.squadId === squad.id)}
                    hasActiveParty={getSquadHasActiveParty(squad.id)}
                    copiedCode={copiedCode}
                    onCopyCode={copyInviteCode}
                  />
                </motion.li>
              ))}
            </motion.ul>
          ) : !showCreate && !showJoin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 text-center">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-bg-hover flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <Users className="w-7 h-7 text-text-quaternary" strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Pas encore de squad
                </h3>
                <p className="text-md text-text-tertiary mb-6 max-w-[280px] mx-auto">
                  Lance ta squad pour inviter tes potes, ou rejoins l'action avec un code.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={() => setShowJoin(true)}>
                    <UserPlus className="w-4 h-4" />
                    Rejoins l'action
                  </Button>
                  <Button onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4" />
                    Lance ta squad
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal Premium */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        squadId={squads[0]?.id}
        feature="Squads illimites"
      />
    </main>
  )
}
