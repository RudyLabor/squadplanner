import { useState, useEffect } from 'react'
import { trackEvent } from '../utils/analytics'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Loader2,
  Sparkles,
  Edit2,
  X,
  Calendar,
  Trophy,
  Users,
  TrendingUp,
  Share2,
} from '../components/icons'
import { Link, useParams, useNavigate } from 'react-router'
import { m, AnimatePresence } from 'framer-motion'
import Confetti from '../components/LazyConfetti'
import { Button, ConfirmDialog, Card, CardContent, Select, Badge } from '../components/ui'
import { VoiceChat } from '../components/VoiceChat'
import { ShareButtons } from '../components/ShareButtons'
import { useAuthStore, useConfetti } from '../hooks'
import {
  useSessionQuery,
  useRsvpMutation,
  useCheckinMutation,
  useConfirmSessionMutation,
  useCancelSessionMutation,
} from '../hooks/queries'
import {
  SessionInfoCards,
  RsvpCounts,
  RsvpButtons,
  CheckinSection,
  ParticipantsList,
} from './session-detail/SessionDetailSections'
import { EditSessionModal } from './session-detail/EditSessionModal'
type RsvpResponse = 'present' | 'absent' | 'maybe'

function CelebrationToast({
  message,
  isVisible,
  onClose,
}: {
  message: string
  isVisible: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3500)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success text-bg-base font-medium shadow-md">
            <Sparkles className="w-5 h-5" />
            <span>{message}</span>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => { trackEvent('page_viewed', { page: 'session_detail' }) }, [])

  const [rsvpLoading, setRsvpLoading] = useState<RsvpResponse | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const { active: showConfetti, fire: fireConfetti } = useConfetti()
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const { user } = useAuthStore()
  const { data: currentSession, isLoading: sessionLoading } = useSessionQuery(id, user?.id)
  const rsvpMutation = useRsvpMutation()
  const checkinMutation = useCheckinMutation()
  const confirmSessionMutation = useConfirmSessionMutation()
  const cancelSessionMutation = useCancelSessionMutation()

  const handleRsvp = async (response: RsvpResponse) => {
    if (!id) return
    setRsvpLoading(response)
    try {
      await rsvpMutation.mutateAsync({ sessionId: id, response })
      setRsvpLoading(null)
      if (response === 'present') {
        fireConfetti()
        setToastMessage("✅ Confirmé ! Ta squad sait qu'elle peut compter sur toi")
        setShowToast(true)
      }
    } catch {
      setRsvpLoading(null)
      setToastMessage('Erreur réseau, réessaie')
      setShowToast(true)
    }
  }

  const handleCheckin = async () => {
    if (!id) return
    setCheckinLoading(true)
    try {
      await checkinMutation.mutateAsync({ sessionId: id, status: 'present' })
      fireConfetti(4000)
      setToastMessage('🎮 Check-in validé ! +5 % fiabilité — bon game !')
      setShowToast(true)
    } catch {
      setToastMessage('Erreur lors du check-in, réessaie')
      setShowToast(true)
    } finally {
      setCheckinLoading(false)
    }
  }

  const confirmCancelSession = async () => {
    if (!id) return
    try {
      await cancelSessionMutation.mutateAsync(id)
      setShowCancelConfirm(false)
    } catch {
      setShowCancelConfirm(false)
      setToastMessage("Erreur lors de l'annulation")
      setShowToast(true)
    }
  }
  const handleConfirm = async () => {
    if (!id) return
    try {
      await confirmSessionMutation.mutateAsync(id)
      setToastMessage('Session confirmée !')
      setShowToast(true)
    } catch {
      setToastMessage('Erreur lors de la confirmation')
      setShowToast(true)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(date),
      time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date),
    }
  }

  const isCheckinWindow = () => {
    if (!currentSession) return false
    if (currentSession.status !== 'confirmed') return false
    const now = new Date()
    const sessionStart = new Date(currentSession.scheduled_at)
    const windowStart = new Date(sessionStart.getTime() - 30 * 60000) // 30 min avant
    const sessionEnd = new Date(
      sessionStart.getTime() + (currentSession.duration_minutes || 120) * 60000
    )
    return now >= windowStart && now <= sessionEnd
  }

  const isSessionPast = () => {
    if (!currentSession) return false
    const sessionStart = new Date(currentSession.scheduled_at)
    const sessionEnd = new Date(
      sessionStart.getTime() + (currentSession.duration_minutes || 120) * 60000
    )
    return new Date() > sessionEnd
  }

  const hasCheckedIn = () => currentSession?.checkins?.some((c) => c.user_id === user?.id)

  const getStatusInfo = () => {
    if (!currentSession) return null
    const now = new Date()
    const sessionDate = new Date(currentSession.scheduled_at)
    if (currentSession.status === 'cancelled')
      return { color: 'var(--color-error)', label: 'Annulée', icon: XCircle }
    if (currentSession.status === 'completed')
      return { color: 'var(--color-success)', label: 'Terminée', icon: CheckCircle2 }
    if (sessionDate < now)
      return { color: 'var(--color-text-tertiary)', label: 'Passée', icon: Clock }
    if (currentSession.status === 'confirmed')
      return { color: 'var(--color-success)', label: 'Confirmée', icon: CheckCircle2 }
    return {
      color: 'var(--color-warning)',
      label: 'En attente de confirmations',
      icon: AlertCircle,
    }
  }

  if (sessionLoading && !currentSession) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!currentSession) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center flex-col gap-4 py-12">
        <AlertCircle className="w-8 h-8 text-text-tertiary" />
        <p className="text-text-secondary">Session non trouvée</p>
        <Button variant="secondary" onClick={() => navigate('/home')}>
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  const dateInfo = formatDate(currentSession.scheduled_at)
  const statusInfo = getStatusInfo()
  const isCreator = currentSession.created_by === user?.id

  return (
    <main className="min-h-0 bg-bg-base mesh-bg pb-6" aria-label="Détail de session">
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={100}
          gravity={0.25}
          colors={['#8B5CF6', '#34d399', '#fbbf24', '#a78bfa', '#f7f8f8']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}
      <CelebrationToast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          <header className="flex items-center gap-4 mb-8">
            <Link
              to={`/squad/${currentSession.squad_id}`}
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-border-subtle transition-colors flex items-center justify-center touch-target"
              aria-label="Retour à la squad"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" aria-hidden="true" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl lg:text-2xl font-bold font-display text-text-primary">
                {currentSession.title || currentSession.game || 'Session'}
              </h1>
              {statusInfo && (
                <div className="flex items-center gap-1.5 mt-1">
                  <statusInfo.icon className="w-4 h-4" style={{ color: statusInfo.color }} />
                  <span className="text-base" style={{ color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
              )}
            </div>
            {isCreator &&
              currentSession.status !== 'cancelled' &&
              currentSession.status !== 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  aria-label="Modifier la session"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              )}
          </header>

          <SessionInfoCards dateInfo={dateInfo} durationMinutes={currentSession.duration_minutes} />
          <RsvpCounts
            present={currentSession.rsvp_counts?.present || 0}
            maybe={currentSession.rsvp_counts?.maybe || 0}
            absent={currentSession.rsvp_counts?.absent || 0}
          />

          {currentSession.status !== 'cancelled' && currentSession.status !== 'completed' && (
            <RsvpButtons
              myRsvp={currentSession.my_rsvp ?? undefined}
              rsvpLoading={rsvpLoading}
              onRsvp={handleRsvp}
            />
          )}

          {isCheckinWindow() && currentSession.my_rsvp === 'present' && !hasCheckedIn() && (
            <CheckinSection checkinLoading={checkinLoading} onCheckin={handleCheckin} />
          )}

          {hasCheckedIn() && (
            <div className="mb-8">
              <div className="p-4 text-center bg-success/10 border border-success/10 rounded-xl">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
                <p className="text-success font-medium">Check-in confirmé !</p>
              </div>
            </div>
          )}

          {currentSession.status === 'confirmed' && id && (
            <div className="mb-8">
              <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-[0.05em] mb-4">
                Chat Vocal
              </h2>
              <VoiceChat
                sessionId={id}
                squadId={currentSession.squad_id}
                sessionTitle={currentSession.title || currentSession.game || 'Session'}
              />
            </div>
          )}

          {(isSessionPast() || currentSession.status === 'completed') && (
            <PostSessionResults
              rsvps={(currentSession.rsvps || []) as ParticipantsListProps_rsvps}
              checkins={currentSession.checkins}
              durationMinutes={currentSession.duration_minutes}
            />
          )}

          <ParticipantsList
            rsvps={(currentSession.rsvps || []) as ParticipantsListProps_rsvps}
            checkins={currentSession.checkins}
          />

          {/* Share session */}
          {currentSession.status !== 'cancelled' && id && (
            <div className="mb-8">
              <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-[0.05em] mb-4 flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5" />
                Partager la session
              </h2>
              <ShareButtons
                url={`${typeof window !== 'undefined' ? window.location.origin : 'https://squadplanner.fr'}/s/${id}`}
                title={`${currentSession.title || currentSession.game || 'Session'} — Squad Planner`}
                text={`On lance une session ${currentSession.game ? `de ${currentSession.game}` : ''} — il reste des places, rejoins-nous !`}
              />
            </div>
          )}

          {isCreator && currentSession.status === 'proposed' && (
            <div className="space-y-3">
              <Button onClick={handleConfirm} className="w-full">
                <CheckCircle2 className="w-5 h-5" />
                Confirmer la session
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowCancelConfirm(true)}
                className="w-full"
              >
                <XCircle className="w-5 h-5" />
                Annuler la session
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancelSession}
        title="Annuler cette session ?"
        description="Tous les membres seront notifiés et les réponses RSVP seront perdues. Cette action est irréversible."
        confirmLabel="Annuler la session"
        variant="warning"
      />

      <AnimatePresence>
        {showEditModal && currentSession && (
          <EditSessionModal
            sessionId={currentSession.id}
            initialTitle={currentSession.title || ''}
            initialScheduledAt={currentSession.scheduled_at}
            initialDuration={currentSession.duration_minutes || 120}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

// Type helper for ParticipantsList props
type ParticipantsListProps_rsvps = Array<{
  user_id: string
  response: string
  profiles?: { username?: string }
}>

// EditSessionModal extracted to ./session-detail/EditSessionModal.tsx

// --- F30: Post-Session Results ---

function PostSessionResults({
  rsvps,
  checkins,
  durationMinutes,
}: {
  rsvps?: ParticipantsListProps_rsvps
  checkins?: Array<{ user_id: string; status?: string }>
  durationMinutes: number
}) {
  const totalRsvps = rsvps?.length || 0
  const presentRsvps = rsvps?.filter((r) => r.response === 'present').length || 0
  const totalCheckins = checkins?.length || 0
  const participationRate = presentRsvps > 0 ? Math.round((totalCheckins / presentRsvps) * 100) : 0
  const isPerfect = participationRate === 100 && totalCheckins > 0

  return (
    <m.div
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-[0.05em] mb-4">
        Résultats de la session
      </h2>

      {/* R26 — Perfect attendance celebration */}
      {isPerfect && (
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-success/10 to-warning/10 border border-success/20 text-center"
        >
          <m.span
            className="text-4xl block mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
          >
            🏅
          </m.span>
          <p className="text-base font-bold text-text-primary">Squad Parfaite !</p>
          <p className="text-sm text-text-tertiary">100% de présence — tout le monde était là.</p>
        </m.div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-b from-primary/[0.05] to-transparent">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-warning" />
            <span className="text-base font-semibold text-text-primary">Récapitulatif</span>
          </div>

          <dl className="grid grid-cols-3 gap-3">
            <m.div
              className="text-center p-3 rounded-xl bg-bg-surface"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Users className="w-5 h-5 mx-auto mb-1 text-primary" aria-hidden="true" />
              <dd className="text-lg font-bold text-text-primary">{totalRsvps}</dd>
              <dt className="text-xs text-text-tertiary">Inscrits</dt>
            </m.div>
            <m.div
              className="text-center p-3 rounded-xl bg-bg-surface"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" aria-hidden="true" />
              <dd className="text-lg font-bold text-text-primary">{totalCheckins}</dd>
              <dt className="text-xs text-text-tertiary">Check-ins</dt>
            </m.div>
            <m.div
              className="text-center p-3 rounded-xl bg-bg-surface"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-info" aria-hidden="true" />
              <dd className="text-lg font-bold text-text-primary">{participationRate}%</dd>
              <dt className="text-xs text-text-tertiary">Fiabilité</dt>
            </m.div>
          </dl>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Durée prévue</span>
              <span className="text-text-primary font-medium">{durationMinutes} min</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Taux de participation</span>
              <Badge
                variant={
                  participationRate >= 75
                    ? 'success'
                    : participationRate >= 50
                      ? 'warning'
                      : 'error'
                }
              >
                {participationRate}%
              </Badge>
            </div>
            {checkins && checkins.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Joueurs présents</span>
                <span className="text-text-primary font-medium">
                  {checkins.length} / {presentRsvps}
                </span>
              </div>
            )}
          </div>

          {/* R26 — Share results button */}
          <m.div
            className="mt-4 pt-3 border-t border-border-subtle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="button"
              onClick={() => {
                const text = `Session terminée ! ${totalCheckins}/${presentRsvps} joueurs présents (${participationRate}% de fiabilité)${isPerfect ? ' 🏅 Squad Parfaite !' : ''}`
                if (navigator.share) {
                  navigator.share({ text }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(text).catch(() => {})
                }
              }}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-medium text-primary hover:bg-primary/[0.06] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Partager les résultats
            </button>
          </m.div>
        </div>
      </Card>
    </m.div>
  )
}
