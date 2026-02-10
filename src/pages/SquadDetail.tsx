import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Button, SquadDetailSkeleton, CrossfadeTransition } from '../components/ui'
import { useAuthStore, useSquadsStore, useSessionsStore, usePremiumStore } from '../hooks'
import { useSquadLeaderboardQuery } from '../hooks/queries'
import { showSuccess } from '../lib/toast'
import { SquadHeader, InviteModal } from '../components/squads/SquadHeader'
import { SquadMembers } from '../components/squads/SquadMembers'
import { PartySection, SquadSessionsList } from '../components/squads/SquadSessions'
import { SquadSettings } from '../components/squads/SquadSettings'

// Toast de succes avec celebration
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  const isCelebration = message.includes('confirm') || message.includes('\uD83D\uDD25')

  useEffect(() => {
    const timer = setTimeout(onClose, isCelebration ? 4000 : 3000)
    return () => clearTimeout(timer)
  }, [onClose, isCelebration])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
    >
      <motion.div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium shadow-xl ${
          isCelebration
            ? 'bg-gradient-to-r from-success to-success text-bg-base shadow-glow-success'
            : 'bg-success text-bg-base shadow-lg'
        }`}
        animate={isCelebration ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3, repeat: isCelebration ? 2 : 0 }}
      >
        <motion.div
          animate={isCelebration ? { rotate: [0, 15, -15, 0] } : {}}
          transition={{ duration: 0.5, repeat: isCelebration ? 2 : 0 }}
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
        <span className="text-md">{message}</span>
      </motion.div>
    </motion.div>
  )
}

export default function SquadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showActionsDrawer, setShowActionsDrawer] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [loadTimeout, setLoadTimeout] = useState(false)

  const { user, isInitialized } = useAuthStore()
  const { currentSquad, fetchSquadById, leaveSquad, deleteSquad, isLoading, setCurrentSquad } = useSquadsStore()
  const { sessions, fetchSessions, createSession, updateRsvp, isLoading: sessionsLoading } = useSessionsStore()
  const { canAccessFeature, fetchPremiumStatus, isSquadPremium } = usePremiumStore()

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useSquadLeaderboardQuery(id)

  // Reset currentSquad on unmount or id change to avoid stale data
  useEffect(() => {
    setCurrentSquad(null)
    setLoadTimeout(false)
    return () => setCurrentSquad(null)
  }, [id, setCurrentSquad])

  useEffect(() => {
    if (isInitialized && !user) {
      navigate('/auth')
    } else if (id && user) {
      fetchSquadById(id)
      fetchSessions(id)
      fetchPremiumStatus()
    }
  }, [id, user, isInitialized, navigate, fetchSquadById, fetchSessions, fetchPremiumStatus])

  // Timeout fallback -- 10 seconds max loading
  useEffect(() => {
    if (!isLoading && currentSquad) return
    const timer = setTimeout(() => setLoadTimeout(true), 10000)
    return () => clearTimeout(timer)
  }, [id, isLoading, currentSquad])

  const handleCreateSession = useCallback(async (data: {
    squad_id: string
    title?: string
    scheduled_at: string
    duration_minutes: number
    auto_confirm_threshold: number
    game?: string
  }) => {
    const result = await createSession(data)
    if (!result.error) {
      setSuccessMessage('Session creee !')
      if (id) fetchSessions(id)
    }
    return result
  }, [createSession, id, fetchSessions])

  const handleRsvp = useCallback(async (sessionId: string, response: 'present' | 'absent' | 'maybe') => {
    try {
      const { error } = await updateRsvp(sessionId, response)
      if (error) return

      if (id) fetchSessions(id)

      // A11Y: Announce RSVP status to screen readers
      const ariaLabels = { present: 'Tu es marque comme present', absent: 'Tu es marque comme absent', maybe: 'Tu es marque comme peut-etre' }
      const ariaRegion = document.getElementById('aria-live-polite')
      if (ariaRegion) ariaRegion.textContent = ariaLabels[response]

      if (response === 'present') {
        setShowConfetti(true)
        setSuccessMessage("T'es confirme ! \uD83D\uDD25 Ta squad compte sur toi")
        setTimeout(() => setShowConfetti(false), 4000)
      } else {
        setSuccessMessage(response === 'absent' ? 'Absence enregistree' : 'Reponse enregistree')
      }
    } catch (err) {
      console.error('RSVP error:', err)
    }
  }, [id, updateRsvp, fetchSessions])

  const handleLeaveSquad = async () => {
    if (!id || !confirm('Quitter cette squad ?')) return
    await leaveSquad(id)
    showSuccess('Tu as quitte la squad')
    navigate('/squads')
  }

  const handleDeleteSquad = async () => {
    if (!id || !confirm('Supprimer cette squad ? Cette action est irreversible.')) return
    await deleteSquad(id)
    showSuccess('Squad supprimee')
    navigate('/squads')
  }

  const isOwner = currentSquad?.owner_id === user?.id

  const showSkeleton = !isInitialized || isLoading || (!currentSquad && id && !loadTimeout)

  // Timeout state
  if (loadTimeout && !currentSquad) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center flex-col gap-4 py-12">
        <p className="text-text-tertiary">Le chargement prend trop de temps</p>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => { setLoadTimeout(false); if (id) { fetchSquadById(id); fetchSessions(id) } }}>
            Reessayer
          </Button>
          <Button variant="secondary" onClick={() => navigate('/squads')}>
            Retour aux squads
          </Button>
        </div>
      </div>
    )
  }

  // Not found state
  if (!showSkeleton && !currentSquad) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center flex-col gap-4 py-12">
        <p className="text-text-tertiary">Squad non trouvee</p>
        <Button variant="secondary" onClick={() => navigate('/squads')}>
          Retour aux squads
        </Button>
      </div>
    )
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Detail de la squad">
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={150} gravity={0.3} colors={['#6366f1', '#34d399', '#fbbf24', '#f7f8f8', '#a78bfa']} />
      )}

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <CrossfadeTransition isLoading={showSkeleton} skeleton={<SquadDetailSkeleton />}>
        {currentSquad ? (
        <div>
          <SquadHeader squadId={id || ''} squad={currentSquad} isOwner={!!isOwner} />

          <div className="mb-6">
            <PartySection squadId={id || ''} />
          </div>

          <SquadSessionsList
            sessions={sessions}
            squadId={id || ''}
            squadGame={currentSquad.game}
            onRsvp={handleRsvp}
            onCreateSession={handleCreateSession}
            sessionsLoading={sessionsLoading}
          />

          <SquadMembers
            members={currentSquad.members || []}
            ownerId={currentSquad.owner_id}
            memberCount={currentSquad.member_count || 0}
            currentUserId={user?.id}
            onInviteClick={() => setShowInviteModal(true)}
          />

          <SquadSettings
            squadId={id || ''}
            squadName={currentSquad.name}
            isOwner={!!isOwner}
            sessionsCount={sessions.length}
            memberCount={currentSquad.member_count || 0}
            avgReliability={currentSquad.avg_reliability_score || 0}
            canAccessAdvancedStats={canAccessFeature('advanced_stats', id)}
            leaderboard={leaderboard}
            leaderboardLoading={leaderboardLoading}
            currentUserId={user?.id || ''}
            isSquadPremium={isSquadPremium(id || '')}
            sessions={sessions}
            onLeaveSquad={handleLeaveSquad}
            onDeleteSquad={handleDeleteSquad}
            onInviteClick={() => setShowInviteModal(true)}
            onCreateSessionClick={() => {/* handled inside SquadSessionsList */}}
            showActionsDrawer={showActionsDrawer}
            onOpenActionsDrawer={() => setShowActionsDrawer(true)}
            onCloseActionsDrawer={() => setShowActionsDrawer(false)}
            onSuccess={setSuccessMessage}
          />
        </div>
        ) : null}
        </CrossfadeTransition>
      </div>

      <AnimatePresence>
        {successMessage && <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showInviteModal && currentSquad && (
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            squadId={id || ''}
            squadName={currentSquad.name}
            inviteCode={currentSquad.invite_code || ''}
            existingMemberIds={currentSquad.members?.map((m: { user_id: string }) => m.user_id) || []}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
