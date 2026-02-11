import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import { Users, Plus, UserPlus } from '../components/icons'
import Confetti from '../components/LazyConfetti'
import { Button, Card, SquadCardSkeleton } from '../components/ui'
import { showSuccess } from '../lib/toast'
import { useAuthStore, useVoiceChatStore, usePremiumStore } from '../hooks'
import { useSquadsQuery, useCreateSquadMutation, useJoinSquadMutation } from '../hooks/queries/useSquadsQuery'
import { SquadLimitReached, PremiumBadge } from '../components/PremiumGate'
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal'
import { supabase } from '../lib/supabase'
import { FREE_SQUAD_LIMIT } from '../hooks/usePremium'
import { SquadCard, type SquadNextSession } from './squads/SquadCard'
import { JoinSquadForm, CreateSquadForm } from './squads/SquadForms'

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

interface SquadsProps {
  loaderData?: {
    squads: any[]
  }
}

export default function Squads({ loaderData }: SquadsProps) {
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

  const { user } = useAuthStore()
  const { data: squads = [], isLoading } = useSquadsQuery()
  const createSquadMutation = useCreateSquadMutation()
  const joinSquadMutation = useJoinSquadMutation()
  const { isConnected: isInVoiceChat, currentChannel } = useVoiceChatStore()
  const { hasPremium, canCreateSquad, fetchPremiumStatus, userSquadCount } = usePremiumStore()

  useEffect(() => {
    fetchPremiumStatus()
  }, [fetchPremiumStatus])

  useEffect(() => {
    const fetchNextSessions = async () => {
      if (!squads.length) return
      const squadIds = squads.map(s => s.id)
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, squad_id, title, scheduled_at')
        .in('squad_id', squadIds)
        .neq('status', 'cancelled')
        .gte('scheduled_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order('scheduled_at', { ascending: true })

      if (sessions) {
        const sessionMap = new Map<string, SquadNextSession>()
        for (const session of sessions) {
          if (!sessionMap.has(session.squad_id)) {
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
  }, [squads])

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !game.trim()) { setError('Nom et jeu sont requis'); return }
    if (!canCreateSquad()) {
      setError(`Limite de ${FREE_SQUAD_LIMIT} squads atteinte. Passe Premium pour en créer plus !`)
      setShowPremiumModal(true)
      return
    }
    try {
      await createSquadMutation.mutateAsync({ name, game })
      setShowCreate(false); setName(''); setGame(''); fetchPremiumStatus()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleOpenCreate = () => {
    if (!canCreateSquad()) setShowPremiumModal(true)
    else setShowCreate(true)
  }

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!inviteCode.trim()) { setError('Code d\'invitation requis'); return }
    try {
      await joinSquadMutation.mutateAsync(inviteCode)
      setShowJoin(false); setInviteCode(''); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    showSuccess('Code d\'invitation copié ! 📋')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getSquadHasActiveParty = (squadId: string): boolean => {
    return !!(isInVoiceChat && currentChannel?.includes(squadId))
  }

  if (isLoading && squads.length === 0) {
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
            <SquadCardSkeleton /><SquadCardSkeleton /><SquadCardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  const getSubtitle = () => {
    if (squads.length === 0) return 'Crée ou rejoins ta première squad'
    if (squads.length === 1) return '1 squad'
    return `${squads.length} squads`
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Squads">
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={100} gravity={0.25}
          colors={['#6366f1', '#34d399', '#fbbf24', '#a78bfa']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }} />
      )}

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-bold text-text-primary">Mes Squads</h1>
              <p className="text-base text-text-quaternary">{getSubtitle()}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowJoin(true)}>
                <UserPlus className="w-4 h-4" /><span className="hidden sm:inline">Rejoindre</span>
              </Button>
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4" /><span className="hidden sm:inline">Créer</span>
                {!hasPremium && userSquadCount >= FREE_SQUAD_LIMIT && <PremiumBadge small />}
              </Button>
            </div>
          </header>

          {!hasPremium && userSquadCount >= FREE_SQUAD_LIMIT && !showCreate && !showJoin && (
            <div className="mb-6">
              <SquadLimitReached currentCount={userSquadCount} maxCount={FREE_SQUAD_LIMIT} onUpgrade={() => setShowPremiumModal(true)} />
            </div>
          )}

          <JoinSquadForm show={showJoin} inviteCode={inviteCode} onInviteCodeChange={setInviteCode}
            error={error} isLoading={joinSquadMutation.isPending} onSubmit={handleJoinSquad}
            onCancel={() => { setShowJoin(false); setError(null) }} />

          <CreateSquadForm show={showCreate} name={name} onNameChange={setName}
            game={game} onGameChange={setGame} error={error} isLoading={createSquadMutation.isPending}
            onSubmit={handleCreateSquad} onCancel={() => { setShowCreate(false); setError(null) }} />

          {squads.length > 0 ? (
            <m.ul className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0 list-none"
              variants={staggerContainerVariants} initial="hidden" animate="visible" aria-label="Liste des squads">
              {squads.map((squad) => (
                <m.li key={squad.id} variants={staggerItemVariants}>
                  <SquadCard squad={squad} isOwner={squad.owner_id === user?.id}
                    nextSession={nextSessions.find(s => s.squadId === squad.id)}
                    hasActiveParty={getSquadHasActiveParty(squad.id)}
                    copiedCode={copiedCode} onCopyCode={copyInviteCode} />
                </m.li>
              ))}
            </m.ul>
          ) : !showCreate && !showJoin && (
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="p-8 text-center">
                <m.div className="w-14 h-14 rounded-2xl bg-bg-hover flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0.8, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}>
                  <Users className="w-7 h-7 text-text-quaternary" strokeWidth={1.5} />
                </m.div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Pas encore de squad</h3>
                <p className="text-md text-text-tertiary mb-6 max-w-[280px] mx-auto">
                  Lance ta squad pour inviter tes potes, ou rejoins l'action avec un code.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={() => setShowJoin(true)}>
                    <UserPlus className="w-4 h-4" />Rejoins l'action
                  </Button>
                  <Button onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4" />Lance ta squad
                  </Button>
                </div>
              </Card>
            </m.div>
          )}
        </div>
      </div>

      <PremiumUpgradeModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)}
        squadId={squads[0]?.id} feature="Squads illimitées" />
    </main>
  )
}
