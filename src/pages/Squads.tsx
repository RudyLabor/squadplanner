import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Gamepad2, Link as LinkIcon, Copy, Check, Loader2, UserPlus, Calendar, Crown, Mic, ChevronRight, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, Input } from '../components/ui'
import { useAuthStore, useSquadsStore, useVoiceChatStore, usePremiumStore } from '../hooks'
import { SquadLimitReached, PremiumBadge } from '../components/PremiumGate'
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal'
import { theme } from '../lib/theme'
import { supabase } from '../lib/supabase'
import { FREE_SQUAD_LIMIT } from '../hooks/usePremium'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

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

// Composant célébration après création
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#4ade80] text-[#08090a] font-medium shadow-lg">
        <Sparkles className="w-5 h-5" />
        <span>{message}</span>
      </div>
    </motion.div>
  )
}

// Card squad améliorée
function SquadCard({ squad, isOwner, nextSession, hasActiveParty, copiedCode, onCopyCode }: {
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
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      <Link to={`/squad/${squad.id}`}>
        <Card className={`cursor-pointer ${hasActiveParty ? 'border-[#4ade80]/30' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Icône avec indicateur party */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  hasActiveParty
                    ? 'bg-[#4ade80]/15'
                    : 'bg-[rgba(94,109,210,0.15)]'
                }`}>
                  {hasActiveParty ? (
                    <Mic className="w-6 h-6 text-[#4ade80]" strokeWidth={1.5} />
                  ) : (
                    <Gamepad2 className="w-6 h-6 text-[#5e6dd2]" strokeWidth={1.5} />
                  )}
                </div>
                {hasActiveParty && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4ade80] border-2 border-[#101012]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Infos squad */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-[15px] font-semibold text-[#f7f8f8] truncate">{squad.name}</h3>
                  {isOwner && (
                    <Crown className="w-4 h-4 text-[#f5a623] flex-shrink-0" />
                  )}
                </div>
                <p className="text-[13px] text-[#8b8d90]">
                  {squad.game} · {memberCount} membre{memberCount > 1 ? 's' : ''}
                </p>

                {/* Prochaine session ou état */}
                <div className="mt-2">
                  {hasActiveParty ? (
                    <div className="flex items-center gap-1.5 text-[12px] text-[#4ade80]">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Party en cours</span>
                    </div>
                  ) : nextSession ? (
                    <div className="flex items-center gap-1.5 text-[12px] text-[#5e6dd2]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{sessionLabel}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[12px] text-[#5e6063]">
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
                  className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  title="Copier le code d'invitation"
                >
                  {copiedCode === squad.invite_code ? (
                    <Check className="w-4 h-4 text-[#4ade80]" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#5e6063]" />
                  )}
                </button>
                <ChevronRight className="w-5 h-5 text-[#5e6063]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export default function Squads() {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [name, setName] = useState('')
  const [game, setGame] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [nextSessions, setNextSessions] = useState<SquadNextSession[]>([])

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
      setError(`Limite de ${FREE_SQUAD_LIMIT} squads atteinte. Passe Premium pour en creer plus !`)
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
      setSuccessMessage(`Squad "${squad?.name}" créée !`)
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
      setSuccessMessage('Tu as rejoint la squad !')
    }
  }

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Déterminer si une squad a une party active
  const getSquadHasActiveParty = (squadId: string): boolean => {
    return !!(isInVoiceChat && currentChannel?.includes(squadId))
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
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
    <div className="min-h-screen bg-[#08090a] pb-24">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header simplifié */}
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[22px] font-bold text-[#f7f8f8]">Mes Squads</h1>
              <p className="text-[13px] text-[#5e6063]">{getSubtitle()}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowJoin(true)}>
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Rejoindre</span>
              </Button>
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Creer</span>
                {!hasPremium && userSquadCount >= FREE_SQUAD_LIMIT && (
                  <PremiumBadge small />
                )}
              </Button>
            </div>
          </motion.div>

          {/* Alerte limite atteinte */}
          {!hasPremium && userSquadCount >= FREE_SQUAD_LIMIT && !showCreate && !showJoin && (
            <motion.div variants={itemVariants} className="mb-6">
              <SquadLimitReached
                currentCount={userSquadCount}
                maxCount={FREE_SQUAD_LIMIT}
                onUpgrade={() => setShowPremiumModal(true)}
              />
            </motion.div>
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
                    <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-4">Rejoindre une squad</h3>
                    <form onSubmit={handleJoinSquad} className="space-y-4">
                      <Input
                        label="Code d'invitation"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        icon={<LinkIcon className="w-5 h-5" />}
                      />
                      {error && (
                        <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
                          <p className="text-[#f87171] text-[13px]">{error}</p>
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
                    <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-4">Créer une squad</h3>
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
                        <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
                          <p className="text-[#f87171] text-[13px]">{error}</p>
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
            <motion.div
              className="space-y-3"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {squads.map((squad) => (
                <motion.div key={squad.id} variants={staggerItemVariants}>
                  <SquadCard
                    squad={squad}
                    isOwner={squad.owner_id === user?.id}
                    nextSession={nextSessions.find(s => s.squadId === squad.id)}
                    hasActiveParty={getSquadHasActiveParty(squad.id)}
                    copiedCode={copiedCode}
                    onCopyCode={copyInviteCode}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : !showCreate && !showJoin && (
            <motion.div variants={itemVariants}>
              <Card className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#1f2023] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-[#5e6063]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-2">
                  Pas encore de squad
                </h3>
                <p className="text-[14px] text-[#8b8d90] mb-6 max-w-[280px] mx-auto">
                  Crée ta squad pour inviter tes potes, ou rejoins-en une avec un code.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={() => setShowJoin(true)}>
                    <UserPlus className="w-4 h-4" />
                    Rejoindre
                  </Button>
                  <Button onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4" />
                    Creer
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Toast de succès */}
      <AnimatePresence>
        {successMessage && (
          <SuccessToast
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal Premium */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        squadId={squads[0]?.id}
        feature="Squads illimites"
      />
    </div>
  )
}
