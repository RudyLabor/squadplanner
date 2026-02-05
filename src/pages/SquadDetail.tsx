import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Calendar, Plus, Copy, Check, MessageCircle,
  Clock, Trash2, LogOut, Loader2, ChevronRight,
  Mic, MicOff, Settings, Sparkles, Crown, TrendingUp,
  CheckCircle2, XCircle, HelpCircle, BarChart3, Download, Zap
} from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, Badge, Input } from '../components/ui'
import { useAuthStore, useSquadsStore, useSessionsStore, useVoiceChatStore, usePremiumStore } from '../hooks'
import { PremiumGate, PremiumBadge } from '../components/PremiumGate'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

// Toast de succès
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

// Section Party Vocale
function PartySection({ squadId }: { squadId: string }) {
  const { user, profile } = useAuthStore()
  const { isConnected, isConnecting, isMuted, remoteUsers, joinChannel, leaveChannel, toggleMute, error } = useVoiceChatStore()

  const handleJoinParty = async () => {
    if (!user || !profile) return
    const channelName = `squad-${squadId}`
    await joinChannel(channelName, user.id, profile.username || 'Joueur')
  }

  const participantCount = isConnected ? remoteUsers.length + 1 : remoteUsers.length

  return (
    <Card className={`p-4 ${isConnected ? 'border-[#4ade80]/30 bg-[#4ade80]/5' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic className={`w-5 h-5 ${isConnected ? 'text-[#4ade80]' : 'text-[#5e6dd2]'}`} />
          <span className="text-[14px] font-semibold text-[#f7f8f8]">Party vocale</span>
        </div>
        {participantCount > 0 && !isConnected && (
          <Badge variant="success">{participantCount} connecté{participantCount > 1 ? 's' : ''}</Badge>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-3">
          {/* Participants */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toi */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4ade80]/20 border border-[#4ade80]/30">
              <div className={`w-2 h-2 rounded-full ${isMuted ? 'bg-[#ef4444]' : 'bg-[#4ade80]'}`} />
              <span className="text-[13px] text-[#f7f8f8]">Toi</span>
            </div>
            {/* Autres */}
            {remoteUsers.map((u) => (
              <div key={String(u.odrop)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
                <div className={`w-2 h-2 rounded-full ${u.isSpeaking ? 'bg-[#4ade80]' : 'bg-[#5e6063]'}`} />
                <span className="text-[13px] text-[#f7f8f8]">{u.username}</span>
              </div>
            ))}
          </div>

          {/* Contrôles */}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={leaveChannel}
            >
              Quitter
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {error && (
            <p className="text-[12px] text-[#f87171] mb-2">{error}</p>
          )}
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
            <p className="text-[12px] text-[#5e6063] text-center mt-2">
              Personne n'est connecté pour l'instant
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

// Card session avec RSVP rapide
function SessionCard({ session, onRsvp }: {
  session: {
    id: string
    title?: string | null
    game?: string | null
    scheduled_at: string
    status: string
    rsvp_counts?: { present: number; absent: number; maybe: number }
    my_rsvp?: 'present' | 'absent' | 'maybe' | null
  }
  onRsvp: (sessionId: string, response: 'present' | 'absent' | 'maybe') => void
}) {
  const date = new Date(session.scheduled_at)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const isPast = diffMs < 0 && session.status !== 'cancelled'
  const isToday = diffHours >= 0 && diffHours < 24
  const isTomorrow = diffHours >= 24 && diffHours < 48

  let timeLabel = ''
  if (isPast) {
    timeLabel = 'Passée'
  } else if (diffHours < 1 && diffHours >= 0) {
    timeLabel = 'Maintenant !'
  } else if (isToday) {
    timeLabel = `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  } else if (isTomorrow) {
    timeLabel = `Demain ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  } else {
    timeLabel = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ` · ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }

  const getStatusBadge = () => {
    if (session.status === 'cancelled') return { label: 'Annulée', variant: 'danger' as const }
    if (session.status === 'confirmed') return { label: 'Confirmée', variant: 'success' as const }
    if (isPast) return { label: 'Passée', variant: 'default' as const }
    return null
  }

  const statusBadge = getStatusBadge()
  const canRsvp = !isPast && session.status !== 'cancelled'

  return (
    <Card className={`p-4 ${isToday && !isPast ? 'border-[#f5a623]/30' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isToday && !isPast ? 'bg-[#f5a623]/15' : 'bg-[rgba(94,109,210,0.15)]'
        }`}>
          <Calendar className={`w-6 h-6 ${isToday && !isPast ? 'text-[#f5a623]' : 'text-[#5e6dd2]'}`} strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-medium text-[#f7f8f8] truncate">
              {session.title || session.game || 'Session'}
            </h3>
            {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
          </div>

          <div className="flex items-center gap-3 text-[13px] text-[#8b8d90] mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeLabel}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {session.rsvp_counts?.present || 0} présent{(session.rsvp_counts?.present || 0) > 1 ? 's' : ''}
            </span>
          </div>

          {/* RSVP rapide */}
          {canRsvp && (
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.preventDefault(); onRsvp(session.id, 'present') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  session.my_rsvp === 'present'
                    ? 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30'
                    : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Présent
              </button>
              <button
                onClick={(e) => { e.preventDefault(); onRsvp(session.id, 'maybe') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  session.my_rsvp === 'maybe'
                    ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30'
                    : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Peut-être
              </button>
              <button
                onClick={(e) => { e.preventDefault(); onRsvp(session.id, 'absent') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  session.my_rsvp === 'absent'
                    ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
                    : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Absent
              </button>
            </div>
          )}
        </div>

        <Link to={`/session/${session.id}`} onClick={(e) => e.stopPropagation()}>
          <ChevronRight className="w-5 h-5 text-[#5e6063]" />
        </Link>
      </div>
    </Card>
  )
}

// Card membre
function MemberCard({ member, isOwner }: {
  member: {
    user_id: string
    role: string
    profiles?: { username?: string; avatar_url?: string; reliability_score?: number }
  }
  isOwner: boolean
}) {
  const reliability = member.profiles?.reliability_score || 100

  return (
    <div className="flex items-center gap-3 py-2">
      {member.profiles?.avatar_url ? (
        <img
          src={member.profiles.avatar_url}
          alt={member.profiles.username || 'Avatar'}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[rgba(139,147,255,0.15)] flex items-center justify-center">
          <Users className="w-5 h-5 text-[#8b93ff]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-[#f7f8f8] truncate">
            {member.profiles?.username || 'Joueur'}
          </span>
          {isOwner && <Crown className="w-4 h-4 text-[#f5a623]" />}
        </div>
        <div className="flex items-center gap-1 text-[12px]">
          <TrendingUp className={`w-3 h-3 ${reliability >= 80 ? 'text-[#4ade80]' : reliability >= 60 ? 'text-[#f5a623]' : 'text-[#ef4444]'}`} />
          <span className={reliability >= 80 ? 'text-[#4ade80]' : reliability >= 60 ? 'text-[#f5a623]' : 'text-[#ef4444]'}>
            {reliability}%
          </span>
          <span className="text-[#5e6063]">fiable</span>
        </div>
      </div>
    </div>
  )
}

export default function SquadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [showCreateSession, setShowCreateSession] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [sessionTime, setSessionTime] = useState('')
  const [sessionDuration, setSessionDuration] = useState('120')
  const [copiedCode, setCopiedCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { user, isInitialized } = useAuthStore()
  const { currentSquad, fetchSquadById, leaveSquad, deleteSquad, isLoading } = useSquadsStore()
  const { sessions, fetchSessions, createSession, updateRsvp, isLoading: sessionsLoading } = useSessionsStore()
  const { canAccessFeature, fetchPremiumStatus, isSquadPremium } = usePremiumStore()

  useEffect(() => {
    if (isInitialized && !user) {
      navigate('/auth')
    } else if (id && user) {
      fetchSquadById(id)
      fetchSessions(id)
      fetchPremiumStatus()
    }
  }, [id, user, isInitialized, navigate, fetchSquadById, fetchSessions, fetchPremiumStatus])

  const handleCopyCode = async () => {
    if (!currentSquad) return
    await navigator.clipboard.writeText(currentSquad.invite_code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!sessionDate || !sessionTime || !id) {
      setError('Date et heure sont requises')
      return
    }

    const scheduledAt = new Date(`${sessionDate}T${sessionTime}`).toISOString()

    const { error } = await createSession({
      squad_id: id,
      title: sessionTitle || undefined,
      scheduled_at: scheduledAt,
      duration_minutes: parseInt(sessionDuration),
      game: currentSquad?.game,
    })

    if (error) {
      setError(error.message)
    } else {
      setShowCreateSession(false)
      setSessionTitle('')
      setSessionDate('')
      setSessionTime('')
      setSuccessMessage('Session créée !')
    }
  }

  const handleRsvp = async (sessionId: string, response: 'present' | 'absent' | 'maybe') => {
    await updateRsvp(sessionId, response)
    if (id) fetchSessions(id)

    // Toast de confirmation
    const labels = {
      present: 'Presence confirmee !',
      absent: 'Absence enregistree',
      maybe: 'Reponse enregistree'
    }
    setSuccessMessage(labels[response])
  }

  const handleLeaveSquad = async () => {
    if (!id) return
    if (!confirm('Quitter cette squad ?')) return

    await leaveSquad(id)
    navigate('/squads')
  }

  const handleDeleteSquad = async () => {
    if (!id) return
    if (!confirm('Supprimer cette squad ? Cette action est irréversible.')) return

    await deleteSquad(id)
    navigate('/squads')
  }

  const isOwner = currentSquad?.owner_id === user?.id

  // Filtrer sessions futures
  const now = new Date()
  const futureSessions = sessions.filter(s => new Date(s.scheduled_at) >= now || s.status === 'confirmed')

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
      </div>
    )
  }

  if (!currentSquad) {
    return (
      <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
        <p className="text-[#8b8d90]">Squad non trouvée</p>
      </div>
    )
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold text-[#f7f8f8] truncate">{currentSquad.name}</h1>
                {isOwner && <Crown className="w-5 h-5 text-[#f5a623] flex-shrink-0" />}
              </div>
              <p className="text-[13px] text-[#8b8d90]">
                {currentSquad.game} · {currentSquad.member_count} membre{(currentSquad.member_count || 0) > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/messages">
                <Button variant="ghost" size="sm">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleCopyCode}>
                {copiedCode ? <Check className="w-4 h-4 text-[#4ade80]" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{currentSquad.invite_code}</span>
              </Button>
              {isOwner && (
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>

          {/* Party Vocale - PRIORITÉ #1 */}
          <motion.div variants={itemVariants} className="mb-6">
            <PartySection squadId={id || ''} />
          </motion.div>

          {/* Créer session */}
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
                    <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-4">Nouvelle session</h3>
                    <form onSubmit={handleCreateSession} className="space-y-4">
                      <Input
                        label="Titre (optionnel)"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        placeholder="Ranked grind, Fun time..."
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Date"
                          type="date"
                          value={sessionDate}
                          onChange={(e) => setSessionDate(e.target.value)}
                          required
                        />
                        <Input
                          label="Heure"
                          type="time"
                          value={sessionTime}
                          onChange={(e) => setSessionTime(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#c9cace] mb-1.5">
                          Durée
                        </label>
                        <select
                          value={sessionDuration}
                          onChange={(e) => setSessionDuration(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] focus:border-[rgba(94,109,210,0.5)] focus:ring-2 focus:ring-[rgba(94,109,210,0.15)] transition-all"
                        >
                          <option value="60">1 heure</option>
                          <option value="120">2 heures</option>
                          <option value="180">3 heures</option>
                          <option value="240">4 heures</option>
                        </select>
                      </div>
                      {error && (
                        <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
                          <p className="text-[#f87171] text-[13px]">{error}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button type="button" variant="ghost" onClick={() => setShowCreateSession(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={sessionsLoading}>
                          {sessionsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="mb-6">
                <Button onClick={() => setShowCreateSession(true)} className="w-full">
                  <Plus className="w-5 h-5" />
                  Planifier une session
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sessions à venir */}
          <motion.div variants={itemVariants} className="mb-6">
            <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide mb-3">
              Sessions à venir
            </h2>
            {futureSessions.length > 0 ? (
              <div className="space-y-3">
                {futureSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onRsvp={handleRsvp}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-[#5e6063]" strokeWidth={1} />
                <p className="text-[14px] text-[#8b8d90]">Aucune session planifiée</p>
              </Card>
            )}
          </motion.div>

          {/* Membres */}
          <motion.div variants={itemVariants} className="mb-6">
            <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide mb-3">
              Membres ({currentSquad.member_count})
            </h2>
            <Card>
              <CardContent className="p-4 divide-y divide-[rgba(255,255,255,0.06)]">
                {currentSquad.members?.map((member: { user_id: string; role: string; profiles?: { username?: string; avatar_url?: string; reliability_score?: number } }) => (
                  <MemberCard
                    key={member.user_id}
                    member={member}
                    isOwner={member.role === 'leader' || member.user_id === currentSquad.owner_id}
                  />
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Avancees - Premium */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
                Stats avancees
              </h2>
              {!canAccessFeature('advanced_stats', id) && <PremiumBadge small />}
            </div>
            <PremiumGate
              feature="advanced_stats"
              squadId={id}
              fallback="lock"
            >
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#5e6dd2]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-medium text-[#f7f8f8]">Analyse de la squad</h3>
                    <p className="text-[12px] text-[#5e6063]">Tendances et performances</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)]">
                    <div className="text-[20px] font-bold text-[#4ade80]">{sessions.length}</div>
                    <div className="text-[11px] text-[#5e6063]">Sessions</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)]">
                    <div className="text-[20px] font-bold text-[#5e6dd2]">{currentSquad.member_count || 0}</div>
                    <div className="text-[11px] text-[#5e6063]">Membres</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)]">
                    <div className="text-[20px] font-bold text-[#f5a623]">{Math.round(currentSquad.avg_reliability_score || 0)}%</div>
                    <div className="text-[11px] text-[#5e6063]">Fiabilite</div>
                  </div>
                </div>
              </Card>
            </PremiumGate>
          </motion.div>

          {/* Export Calendrier - Premium */}
          <motion.div variants={itemVariants} className="mb-6">
            <PremiumGate
              feature="calendar_export"
              featureLabel="Export calendrier"
              squadId={id}
              fallback="lock"
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(74,222,128,0.15)] flex items-center justify-center">
                      <Download className="w-5 h-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-medium text-[#f7f8f8]">Export calendrier</h3>
                      <p className="text-[12px] text-[#5e6063]">Synchronise avec Google, Apple...</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      // TODO: Implementer export ICS
                      setSuccessMessage('Export calendrier bientot disponible !')
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Exporter
                  </Button>
                </div>
              </Card>
            </PremiumGate>
          </motion.div>

          {/* Audio HD Badge si premium */}
          {isSquadPremium(id || '') && (
            <motion.div variants={itemVariants} className="mb-6">
              <Card className="p-4 bg-gradient-to-br from-[rgba(245,166,35,0.1)] to-[rgba(245,166,35,0.02)] border-[rgba(245,166,35,0.2)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(245,166,35,0.2)] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#f5a623]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-medium text-[#f7f8f8]">Squad Premium</h3>
                      <PremiumBadge small />
                    </div>
                    <p className="text-[12px] text-[#5e6063]">Audio HD, stats avancees, export calendrier actifs</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Settings (owner only) */}
          <AnimatePresence>
            {showSettings && isOwner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <motion.div variants={itemVariants}>
                  <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide mb-3">
                    Paramètres
                  </h2>
                  <Card className="p-4">
                    <Button variant="danger" onClick={handleDeleteSquad} className="w-full">
                      <Trash2 className="w-4 h-4" />
                      Supprimer la squad
                    </Button>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quitter (non-owner) */}
          {!isOwner && (
            <motion.div variants={itemVariants}>
              <Button variant="ghost" onClick={handleLeaveSquad} className="w-full">
                <LogOut className="w-4 h-4" />
                Quitter la squad
              </Button>
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

    </div>
  )
}
