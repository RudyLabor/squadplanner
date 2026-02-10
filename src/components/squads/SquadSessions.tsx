import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, Loader2, Mic, MicOff
} from 'lucide-react'
import { Button, Card, CardContent, Badge, Input } from '../ui'
import { useAuthStore, useVoiceChatStore, usePremiumStore } from '../../hooks'
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
  const { isConnected, isConnecting, isMuted, remoteUsers, joinChannel, leaveChannel, toggleMute, error } = useVoiceChatStore()

  const handleJoinParty = async () => {
    if (!user || !profile) return
    const channelName = `squad-${squadId}`
    await joinChannel(channelName, user.id, profile.username || 'Joueur', hasPremium)
  }

  const participantCount = isConnected ? (remoteUsers?.length || 0) + 1 : (remoteUsers?.length || 0)

  return (
    <Card className={`p-4 ${isConnected ? 'border-success/30 bg-success/5' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic className={`w-5 h-5 ${isConnected ? 'text-success' : 'text-primary'}`} />
          <span className="text-md font-semibold text-text-primary">Party vocale</span>
        </div>
        {participantCount > 0 && !isConnected && (
          <Badge variant="success">{participantCount} connecte{participantCount > 1 ? 's' : ''}</Badge>
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
              <div key={String(u.odrop)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-border-hover">
                <div className={`w-2 h-2 rounded-full ${u.isSpeaking ? 'bg-success' : 'bg-text-tertiary'}`} />
                <span className="text-base text-text-primary">{u.username}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant={isMuted ? 'danger' : 'secondary'} size="sm" onClick={toggleMute} className="flex-1">
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
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            {participantCount > 0 ? 'Rejoindre la party' : 'Lancer une party'}
          </Button>
          {participantCount === 0 && (
            <p className="text-sm text-text-quaternary text-center mt-2">
              Personne n'est connectee pour l'instant
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
  onCreateSession: (data: {
    squad_id: string
    title?: string
    scheduled_at: string
    duration_minutes: number
    auto_confirm_threshold: number
    game?: string
  }) => Promise<{ error: { message: string } | null }>
  sessionsLoading: boolean
}

export function SquadSessionsList({
  sessions,
  squadId,
  squadGame,
  onRsvp,
  onCreateSession,
  sessionsLoading
}: SquadSessionsProps) {
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [sessionTime, setSessionTime] = useState('')
  const [sessionDuration, setSessionDuration] = useState('120')
  const [sessionThreshold, setSessionThreshold] = useState('3')
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const futureSessions = (sessions || []).filter(s => new Date(s.scheduled_at) >= now || s.status === 'confirmed')

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!sessionDate || !sessionTime) {
      setError('Date et heure sont requises')
      return
    }

    const scheduledAt = new Date(`${sessionDate}T${sessionTime}`).toISOString()

    const { error } = await onCreateSession({
      squad_id: squadId,
      title: sessionTitle || undefined,
      scheduled_at: scheduledAt,
      duration_minutes: parseInt(sessionDuration),
      auto_confirm_threshold: parseInt(sessionThreshold),
      game: squadGame,
    })

    if (error) {
      setError(error.message)
    } else {
      setShowCreateSession(false)
      setSessionTitle('')
      setSessionDate('')
      setSessionTime('')
      setSessionThreshold('3')
    }
  }

  return (
    <>
      {/* Create session form */}
      <AnimatePresence>
        {showCreateSession ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Nouvelle session</h3>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <Input
                    label="Titre (optionnel)"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="Session ranked, Detente, Tryhard..."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Date" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required />
                    <Input label="Heure" type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-medium text-text-secondary mb-1.5">Duree</label>
                      <select
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-input"
                      >
                        <option value="60">1 heure</option>
                        <option value="120">2 heures</option>
                        <option value="180">3 heures</option>
                        <option value="240">4 heures</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-base font-medium text-text-secondary mb-1">Confirmation automatique</label>
                      <p className="text-sm text-text-quaternary mb-1.5">
                        La session sera confirmée quand ce nombre de joueurs aura répondu "Présent"
                      </p>
                      <select
                        value={sessionThreshold}
                        onChange={(e) => setSessionThreshold(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-input"
                      >
                        <option value="2">2 joueurs</option>
                        <option value="3">3 joueurs</option>
                        <option value="4">4 joueurs</option>
                        <option value="5">5 joueurs</option>
                        <option value="6">6 joueurs</option>
                        <option value="8">8 joueurs</option>
                        <option value="10">10 joueurs</option>
                      </select>
                    </div>
                  </div>
                  {error && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                      <p className="text-error text-base">{error}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="ghost" onClick={() => setShowCreateSession(false)}>Annuler</Button>
                    <Button type="submit" disabled={sessionsLoading}>
                      {sessionsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="mb-6">
            <Button onClick={() => setShowCreateSession(true)} className="w-full">
              <Plus className="w-5 h-5" />
              Planifier une session
            </Button>
          </div>
        )}
      </AnimatePresence>

      {/* Sessions list */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-text-primary uppercase tracking-wide mb-3">
          Sessions a venir
        </h2>
        {futureSessions.length > 0 ? (
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {futureSessions.map((session) => (
              <SessionCard key={session.id} session={session} onRsvp={onRsvp} />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-text-quaternary" strokeWidth={1} />
            <p className="text-md text-text-tertiary mb-1">Pas encore de session prevue</p>
            <p className="text-sm text-text-quaternary mb-4">Propose un creneau pour jouer avec ta squad</p>
            <Button type="button" size="sm" onClick={() => setShowCreateSession(true)}>
              <Plus className="w-4 h-4" />
              Planifier une session
            </Button>
          </Card>
        )}
      </div>
    </>
  )
}
