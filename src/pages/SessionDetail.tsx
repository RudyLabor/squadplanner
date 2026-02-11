import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Loader2,
  Sparkles,
} from '../components/icons'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Confetti from '../components/LazyConfetti'
import { Button, ConfirmDialog } from '../components/ui'
import { VoiceChat } from '../components/VoiceChat'
import { useAuthStore } from '../hooks'
import {
  useSessionQuery, useRsvpMutation, useCheckinMutation,
  useConfirmSessionMutation, useCancelSessionMutation,
} from '../hooks/queries'
import {
  SessionInfoCards, RsvpCounts, RsvpButtons,
  CheckinSection, ParticipantsList
} from './session-detail/SessionDetailSections'
import { AnimatePresence } from 'framer-motion'
type RsvpResponse = 'present' | 'absent' | 'maybe'

function CelebrationToast({ message, isVisible, onClose }: { message: string; isVisible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isVisible) { const timer = setTimeout(onClose, 3500); return () => clearTimeout(timer) }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success text-bg-base font-medium shadow-md">
            <Sparkles className="w-5 h-5" /><span>{message}</span>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [rsvpLoading, setRsvpLoading] = useState<RsvpResponse | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

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
        setShowConfetti(true); setToastMessage('\u2705 Ta squad sait qu\'elle peut compter sur toi !'); setShowToast(true)
        setTimeout(() => setShowConfetti(false), 3500)
      }
    } catch {
      setRsvpLoading(null); setToastMessage('Erreur réseau, réessaie'); setShowToast(true)
    }
  }

  const handleCheckin = async () => {
    if (!id) return
    setCheckinLoading(true)
    await checkinMutation.mutateAsync({ sessionId: id, status: 'present' })
    setCheckinLoading(false)
    setShowConfetti(true); setToastMessage('\uD83C\uDFAE Check-in validé ! Bon game !'); setShowToast(true)
    setTimeout(() => setShowConfetti(false), 4000)
  }

  const confirmCancelSession = async () => { if (!id) return; setShowCancelConfirm(false); await cancelSessionMutation.mutateAsync(id) }
  const handleConfirm = async () => { if (!id) return; await confirmSessionMutation.mutateAsync(id) }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date),
      time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date),
    }
  }

  const isSessionTime = () => {
    if (!currentSession) return false
    const now = new Date()
    const sessionStart = new Date(currentSession.scheduled_at)
    const sessionEnd = new Date(sessionStart.getTime() + (currentSession.duration_minutes || 120) * 60000)
    return now >= sessionStart && now <= sessionEnd
  }

  const hasCheckedIn = () => currentSession?.checkins?.some(c => c.user_id === user?.id)

  const getStatusInfo = () => {
    if (!currentSession) return null
    const now = new Date()
    const sessionDate = new Date(currentSession.scheduled_at)
    if (currentSession.status === 'cancelled') return { color: 'var(--color-error)', label: 'Annulée', icon: XCircle }
    if (currentSession.status === 'completed') return { color: 'var(--color-success)', label: 'Terminée', icon: CheckCircle2 }
    if (sessionDate < now) return { color: 'var(--color-text-tertiary)', label: 'Passée', icon: Clock }
    if (currentSession.status === 'confirmed') return { color: 'var(--color-success)', label: 'Confirmée', icon: CheckCircle2 }
    return { color: 'var(--color-warning)', label: 'En attente de confirmations', icon: AlertCircle }
  }

  if (sessionLoading && !currentSession) {
    return <div className="min-h-0 bg-bg-base flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
  }

  if (!currentSession) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center flex-col gap-4 py-12">
        <AlertCircle className="w-8 h-8 text-text-tertiary" />
        <p className="text-text-secondary">Session non trouvée</p>
        <Button variant="secondary" onClick={() => navigate('/home')}>Retour à l'accueil</Button>
      </div>
    )
  }

  const dateInfo = formatDate(currentSession.scheduled_at)
  const statusInfo = getStatusInfo()
  const isCreator = currentSession.created_by === user?.id

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Détail de session">
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={100} gravity={0.25}
          colors={['#6366f1', '#34d399', '#fbbf24', '#a78bfa', '#f7f8f8']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }} />
      )}
      <CelebrationToast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          <header className="flex items-center gap-4 mb-8">
            <Link to={`/squad/${currentSession.squad_id}`}
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-border-subtle transition-colors flex items-center justify-center touch-target"
              aria-label="Retour à la squad">
              <ArrowLeft className="w-5 h-5 text-text-secondary" aria-hidden="true" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-text-primary">{currentSession.title || currentSession.game || 'Session'}</h1>
              {statusInfo && (
                <div className="flex items-center gap-1.5 mt-1">
                  <statusInfo.icon className="w-4 h-4" style={{ color: statusInfo.color }} />
                  <span className="text-base" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                </div>
              )}
            </div>
          </header>

          <SessionInfoCards dateInfo={dateInfo} durationMinutes={currentSession.duration_minutes} />
          <RsvpCounts present={currentSession.rsvp_counts?.present || 0}
            maybe={currentSession.rsvp_counts?.maybe || 0} absent={currentSession.rsvp_counts?.absent || 0} />

          {currentSession.status !== 'cancelled' && currentSession.status !== 'completed' && (
            <RsvpButtons myRsvp={currentSession.my_rsvp} rsvpLoading={rsvpLoading} onRsvp={handleRsvp} />
          )}

          {isSessionTime() && currentSession.my_rsvp === 'present' && !hasCheckedIn() && (
            <CheckinSection checkinLoading={checkinLoading} onCheckin={handleCheckin} />
          )}

          {hasCheckedIn() && (
            <div className="mb-8">
              <div className="p-4 text-center bg-success-10 border border-success/10 rounded-xl">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
                <p className="text-success font-medium">Check-in confirmé !</p>
              </div>
            </div>
          )}

          {currentSession.status === 'confirmed' && id && (
            <div className="mb-8">
              <h2 className="text-xs font-medium text-text-tertiary/35 uppercase tracking-[0.05em] mb-4">Chat Vocal</h2>
              <VoiceChat sessionId={id} sessionTitle={currentSession.title || currentSession.game || 'Session'} />
            </div>
          )}

          <ParticipantsList rsvps={currentSession.rsvps as ParticipantsListProps_rsvps} checkins={currentSession.checkins} />

          {isCreator && currentSession.status === 'proposed' && (
            <div className="space-y-3">
              <Button onClick={handleConfirm} className="w-full"><CheckCircle2 className="w-5 h-5" />Confirmer la session</Button>
              <Button variant="danger" onClick={() => setShowCancelConfirm(true)} className="w-full"><XCircle className="w-5 h-5" />Annuler la session</Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} onConfirm={confirmCancelSession}
        title="Annuler cette session ?" description="Les membres de la squad seront notifiés de l'annulation. Cette action ne peut pas être annulée."
        confirmLabel="Annuler la session" variant="warning" />
    </main>
  )
}

// Type helper for ParticipantsList props
type ParticipantsListProps_rsvps = Array<{
  user_id: string
  response: string
  profiles?: { username?: string }
}>
