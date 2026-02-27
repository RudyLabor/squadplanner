import { Calendar, Plus, Mic, MicOff, Loader2 } from '../icons'
import { Button, Card, Badge } from '../ui'
import { useAuthStore, usePremiumStore } from '../../hooks'
import { useVoiceChatStore } from '../../hooks/useVoiceChat'
import { useCreateSessionModal } from '../CreateSessionModal'
import { SessionCard } from './SessionCard'

// Re-export SessionCard for barrel consumers
export { SessionCard } from './SessionCard'

// --- Party Section ---

interface PartySectionProps {
  squadId: string
}

export function PartySection({ squadId }: PartySectionProps) {
  const { user, profile } = useAuthStore()
  const { hasPremium } = usePremiumStore()
  const {
    isConnected,
    isConnecting,
    isMuted,
    remoteUsers,
    joinChannel,
    leaveChannel,
    toggleMute,
    error,
  } = useVoiceChatStore()

  const handleJoinParty = async () => {
    if (!user || !profile) return
    const channelName = `squad-${squadId}`
    await joinChannel(channelName, user.id, profile.username || 'Joueur', hasPremium)
  }

  const participantCount = isConnected ? (remoteUsers?.length || 0) + 1 : remoteUsers?.length || 0

  return (
    <Card className={`p-4 ${isConnected ? 'border-success/30 bg-success/5' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic className={`w-5 h-5 ${isConnected ? 'text-success' : 'text-primary'}`} />
          <span className="text-md font-semibold text-text-primary">Party vocale</span>
        </div>
        {participantCount > 0 && !isConnected && (
          <Badge variant="success">
            {participantCount} connecté{participantCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/20 border border-success/30">
              <div className={`w-2 h-2 rounded-full ${isMuted ? 'bg-error' : 'bg-success'}`} />
              <span className="text-base text-text-primary">Toi</span>
            </div>
            {(remoteUsers || []).map((u) => (
              <div
                key={String(u.odrop)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-border-hover"
              >
                <div
                  className={`w-2 h-2 rounded-full ${u.isSpeaking ? 'bg-success' : 'bg-text-tertiary'}`}
                />
                <span className="text-base text-text-primary">{u.username}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant={isMuted ? 'danger' : 'secondary'}
              size="sm"
              onClick={toggleMute}
              className="flex-1"
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isMuted ? 'Muet' : 'Micro actif'}
            </Button>
            <Button variant="ghost" size="sm" onClick={leaveChannel}>
              Quitter
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {error && <p className="text-sm text-error mb-2">{error}</p>}
          <Button
            onClick={handleJoinParty}
            disabled={isConnecting}
            className="w-full"
            variant={participantCount > 0 ? 'primary' : 'secondary'}
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            {participantCount > 0 ? 'Rejoindre la party' : 'Lancer une party'}
          </Button>
          {participantCount === 0 && (
            <p className="text-sm text-text-quaternary text-center mt-2">
              Personne n'est connectée pour l'instant
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

// --- Sessions List ---

interface SquadSessionsProps {
  sessions: Array<{
    id: string
    title?: string | null
    game?: string | null
    scheduled_at: string
    status: string
    rsvp_counts?: { present: number; absent: number; maybe: number }
    my_rsvp?: 'present' | 'absent' | 'maybe' | null
  }>
  squadId: string
  squadGame?: string
  onRsvp: (sessionId: string, response: 'present' | 'absent' | 'maybe') => void
  sessionsLoading: boolean
}

export function SquadSessionsList({
  sessions,
  squadId,
  onRsvp,
}: SquadSessionsProps) {
  const openCreateSession = useCreateSessionModal((s) => s.open)

  const now = new Date()
  // Only show truly future sessions (not past ones even if confirmed)
  const futureSessions = (sessions || []).filter(
    (s) => new Date(s.scheduled_at) >= now
  )

  return (
    <>
      {/* Create session button — opens the global CreateSessionModal */}
      <div className="mb-6">
        <Button onClick={() => openCreateSession(squadId)} className="w-full">
          <Plus className="w-5 h-5" />
          Planifier une session
        </Button>
      </div>

      {/* Sessions list */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-text-primary mb-3">Sessions à venir</h2>
        {futureSessions.length > 0 ? (
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {futureSessions.map((session) => (
              <SessionCard key={session.id} session={session} onRsvp={onRsvp} />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-text-quaternary" strokeWidth={1} />
            <p className="text-md text-text-tertiary mb-1">Pas encore de session prévue</p>
            <p className="text-sm text-text-quaternary mb-4">
              Propose un créneau pour jouer avec ta squad
            </p>
            <Button type="button" size="sm" onClick={() => openCreateSession(squadId)}>
              <Plus className="w-4 h-4" />
              Planifier une session
            </Button>
          </Card>
        )}
      </div>
    </>
  )
}
