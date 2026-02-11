"use client";

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft } from '../components/icons'
import { useParams, useNavigate } from 'react-router-dom'
import Confetti from '../components/LazyConfetti'
import { Button, SquadDetailSkeleton, CrossfadeTransition, ConfirmDialog } from '../components/ui'
import { useAuthStore, usePremiumStore } from '../hooks'
import {
  useSquadQuery, useSquadSessionsQuery, useSquadLeaderboardQuery,
  useLeaveSquadMutation, useDeleteSquadMutation,
  useCreateSessionMutation, useRsvpMutation,
} from '../hooks/queries'
import { SquadHeader, InviteModal } from '../components/squads/SquadHeader'
import { SquadMembers } from '../components/squads/SquadMembers'
import { PartySection, SquadSessionsList } from '../components/squads/SquadSessions'
import { SquadSettings } from '../components/squads/SquadSettings'
import { SuccessToast } from '../components/squads/SuccessToast'

export default function SquadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showActionsDrawer, setShowActionsDrawer] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { user, isInitialized } = useAuthStore()
  const { canAccessFeature, fetchPremiumStatus, isSquadPremium } = usePremiumStore()

  const { data: currentSquad, isLoading: squadLoading } = useSquadQuery(id)
  const { data: sessions, isLoading: sessionsLoading } = useSquadSessionsQuery(id, user?.id)
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useSquadLeaderboardQuery(id)

  const leaveSquadMutation = useLeaveSquadMutation()
  const deleteSquadMutation = useDeleteSquadMutation()
  const createSessionMutation = useCreateSessionMutation()
  const rsvpMutation = useRsvpMutation()

  useEffect(() => {
    if (isInitialized && !user) navigate('/auth')
  }, [user, isInitialized, navigate])

  useEffect(() => {
    if (user?.id) fetchPremiumStatus()
  }, [user?.id, fetchPremiumStatus])

  const handleCreateSession = useCallback(async (data: {
    squad_id: string
    title?: string
    scheduled_at: string
    duration_minutes: number
    auto_confirm_threshold: number
    game?: string
  }) => {
    try {
      await createSessionMutation.mutateAsync(data)
      setSuccessMessage('Session créée !')
      return { session: null, error: null }
    } catch (error) {
      return { session: null, error: error as Error }
    }
  }, [createSessionMutation])

  const handleRsvp = useCallback(async (sessionId: string, response: 'present' | 'absent' | 'maybe') => {
    try {
      await rsvpMutation.mutateAsync({ sessionId, response })

      const ariaLabels = { present: 'Tu es marqué comme présent', absent: 'Tu es marqué comme absent', maybe: 'Tu es marqué comme peut-être' }
      const ariaRegion = document.getElementById('aria-live-polite')
      if (ariaRegion) ariaRegion.textContent = ariaLabels[response]

      if (response === 'present') {
        setShowConfetti(true)
        setSuccessMessage("T'es confirmé ! \uD83D\uDD25 Ta squad compte sur toi")
        setTimeout(() => setShowConfetti(false), 4000)
      } else {
        setSuccessMessage(response === 'absent' ? 'Absence enregistrée' : 'Réponse enregistrée')
      }
    } catch (err) {
      console.error('RSVP error:', err)
    }
  }, [rsvpMutation])

  const handleLeaveSquad = () => {
    if (!id) return
    setShowLeaveConfirm(true)
  }

  const confirmLeaveSquad = async () => {
    if (!id) return
    setShowLeaveConfirm(false)
    await leaveSquadMutation.mutateAsync(id)
    navigate('/squads')
  }

  const handleDeleteSquad = () => {
    if (!id) return
    setShowDeleteConfirm(true)
  }

  const confirmDeleteSquad = async () => {
    if (!id) return
    setShowDeleteConfirm(false)
    await deleteSquadMutation.mutateAsync(id)
    navigate('/squads')
  }

  const isOwner = currentSquad?.owner_id === user?.id
  const isLoading = squadLoading
  const showSkeleton = isLoading && !currentSquad

  // Not found state (only after loading is done)
  if (!showSkeleton && !currentSquad) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center flex-col gap-4 py-12">
        <p className="text-text-tertiary">Squad non trouvée</p>
        <Button variant="secondary" onClick={() => navigate('/squads')}>
          Retour aux squads
        </Button>
      </div>
    )
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Détail de la squad">
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={150} gravity={0.3} colors={['#6366f1', '#34d399', '#fbbf24', '#f7f8f8', '#a78bfa']} />
      )}

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {/* Mobile back button */}
        <button
          onClick={() => navigate('/squads')}
          className="lg:hidden flex items-center gap-2 mb-4 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Retour aux squads"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-md">Squads</span>
        </button>

        <CrossfadeTransition isLoading={showSkeleton} skeleton={<SquadDetailSkeleton />}>
        {currentSquad ? (
        <div>
          <SquadHeader squadId={id || ''} squad={currentSquad} isOwner={!!isOwner} />

          <div className="mb-6">
            <PartySection squadId={id || ''} />
          </div>

          <SquadSessionsList
            sessions={sessions || []}
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
            sessionsCount={sessions?.length || 0}
            memberCount={currentSquad.member_count || 0}
            avgReliability={currentSquad.avg_reliability_score || 0}
            canAccessAdvancedStats={canAccessFeature('advanced_stats', id)}
            leaderboard={leaderboard}
            leaderboardLoading={leaderboardLoading}
            currentUserId={user?.id || ''}
            isSquadPremium={isSquadPremium(id || '')}
            sessions={sessions || []}
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

      <ConfirmDialog
        open={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={confirmLeaveSquad}
        title="Quitter cette squad ?"
        description="Tu ne pourras plus voir les sessions et messages de cette squad. Tu pourras la rejoindre avec un code d'invitation."
        confirmLabel="Quitter"
        variant="danger"
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteSquad}
        title="Supprimer cette squad ?"
        description="Cette action est irréversible. Toutes les sessions, messages et données de la squad seront supprimés."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </main>
  )
}
