import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, TrendingUp, ChevronRight, Loader2, Mic, CheckCircle2, AlertCircle, Sparkles, Star, HelpCircle, XCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CountUp from 'react-countup'
import Confetti from 'react-confetti'
import { Card, Badge, SessionCardSkeleton, SquadCardSkeleton, SkeletonFriendsPlaying, SkeletonStatsRow, SkeletonStreakCounter, SkeletonAICoach, Tooltip } from '../components/ui'
import { useAuthStore, useVoiceChatStore } from '../hooks'
import { useSquadsQuery } from '../hooks/queries/useSquadsQuery'
import { useRsvpMutation, useUpcomingSessionsQuery } from '../hooks/queries/useSessionsQuery'
import { useFriendsPlayingQuery } from '../hooks/queries/useFriendsPlaying'
import { useAICoachQueryDeferred } from '../hooks/queries/useAICoach'
import { FriendsPlaying } from '../components/FriendsPlaying'
import { useCreateSessionModal } from '../components/CreateSessionModal'
import { OnboardingChecklist } from '../components/OnboardingChecklist'
import { StreakCounter } from '../components/StreakCounter'
import { haptic } from '../utils/haptics'

// Types
interface UpcomingSession {
  id: string
  title?: string | null
  game?: string | null
  scheduled_at: string
  status: string
  squad_id: string
  squad_name: string
  rsvp_counts: { present: number; absent: number; maybe: number }
  my_rsvp: 'present' | 'absent' | 'maybe' | null
  total_members: number
}

// Badge fiabilité avec glow subtil et tooltip stylisé
function ReliabilityBadge({ score }: { score: number }) {
  const tooltipText = "Ton score de fiabilité. Il augmente quand tu confirmes ta présence aux sessions."

  const getBadgeContent = () => {
    if (score >= 95) {
      return (
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#34d399]/15 to-[#34d399]/5 border border-[#34d399]/20 shadow-[0_0_12px_rgba(52,211,153,0.1)] cursor-help"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 25 }}
          whileHover={{ scale: 1.02, boxShadow: "0 0 16px rgba(52,211,153,0.15)" }}
        >
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.5, repeat: 2, repeatDelay: 4 }}
          >
            <Star className="w-4 h-4 text-success fill-success" />
          </motion.div>
          <span className="text-[13px] font-medium text-success">100% fiable</span>
        </motion.div>
      )
    }
    if (score >= 80) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#34d399]/10 border border-[#34d399]/15 cursor-help">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-[13px] font-medium text-success">{score}% fiable</span>
        </div>
      )
    }
    if (score >= 60) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/15 cursor-help">
          <TrendingUp className="w-4 h-4 text-warning" />
          <span className="text-[13px] font-medium text-warning">{score}%</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f87171]/10 border border-[#f87171]/15 cursor-help">
        <AlertCircle className="w-4 h-4 text-error" />
        <span className="text-[13px] font-medium text-error">{score}%</span>
      </div>
    )
  }

  return (
    <Tooltip content={tooltipText} position="bottom">
      {getBadgeContent()}
    </Tooltip>
  )
}

// Prochaine session card - avec RSVP inline et célébration
function NextSessionCard({
  session,
  onRsvp,
  isRsvpLoading
}: {
  session: UpcomingSession
  onRsvp: (sessionId: string, response: 'present' | 'absent' | 'maybe') => void
  isRsvpLoading?: boolean
}) {
  const scheduledDate = new Date(session.scheduled_at)
  const now = new Date()
  const diffMs = scheduledDate.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  let timeLabel = ''
  if (diffMs < 0) {
    timeLabel = 'En cours'
  } else if (diffHours < 1) {
    timeLabel = 'Dans moins d\'1h'
  } else if (diffHours < 24) {
    timeLabel = `Dans ${diffHours}h`
  } else if (diffDays === 1) {
    timeLabel = 'Demain'
  } else {
    timeLabel = `Dans ${diffDays} jours`
  }

  const timeFormatted = scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const dateFormatted = scheduledDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

  const hasResponded = session.my_rsvp !== null
  const canRsvp = diffMs > -2 * 60 * 60 * 1000 // Can RSVP until 2h after start

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="p-4 border-l-4 border-l-primary bg-gradient-to-br from-primary/8 via-transparent to-success/3 hover:from-primary/12 hover:to-success/6 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-interactive">
        {/* Header avec lien vers squad */}
        <Link to={`/squad/${session.squad_id}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[15px] font-semibold text-text-primary hover:text-primary transition-colors duration-400">
                {session.title || session.game || 'Session'}
              </div>
              <div className="text-[13px] text-text-tertiary">{session.squad_name}</div>
            </div>
            <Badge variant={diffMs < 0 ? 'success' : diffHours < 24 ? 'warning' : 'default'}>
              {timeLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-[13px] text-text-tertiary mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{dateFormatted} · {timeFormatted}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{session.rsvp_counts.present}/{session.total_members}</span>
            </div>
          </div>
        </Link>

        {/* RSVP inline buttons - 1 clic pour répondre */}
        {canRsvp && (
          <div className="flex gap-2 pt-2 border-t border-border-subtle">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              disabled={isRsvpLoading}
              onClick={() => onRsvp(session.id, 'present')}
              aria-label="Marquer comme présent"
              aria-pressed={session.my_rsvp === 'present'}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium transition-interactive ${
                session.my_rsvp === 'present'
                  ? 'bg-success/15 text-success border border-success/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]'
                  : 'bg-surface-card text-text-tertiary hover:bg-success/10 hover:text-success border border-transparent hover:border-success/15'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Présent</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              disabled={isRsvpLoading}
              onClick={() => onRsvp(session.id, 'maybe')}
              aria-label="Marquer comme peut-être"
              aria-pressed={session.my_rsvp === 'maybe'}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium transition-interactive ${
                session.my_rsvp === 'maybe'
                  ? 'bg-warning/15 text-warning border border-warning/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]'
                  : 'bg-surface-card text-text-tertiary hover:bg-warning/10 hover:text-warning border border-transparent hover:border-warning/15'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Peut-être</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              disabled={isRsvpLoading}
              onClick={() => onRsvp(session.id, 'absent')}
              aria-label="Marquer comme absent"
              aria-pressed={session.my_rsvp === 'absent'}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium transition-interactive ${
                session.my_rsvp === 'absent'
                  ? 'bg-error/15 text-error border border-error/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]'
                  : 'bg-surface-card text-text-tertiary hover:bg-error/10 hover:text-error border border-transparent hover:border-error/15'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Absent</span>
            </motion.button>
          </div>
        )}

        {/* Message de confirmation après RSVP */}
        {hasResponded && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`flex items-center gap-2 text-[13px] mt-2 pt-2 border-t border-border-subtle ${
              session.my_rsvp === 'present' ? 'text-success' :
              session.my_rsvp === 'absent' ? 'text-error' : 'text-warning'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {session.my_rsvp === 'present' ? "T'es chaud, on t'attend !" :
               session.my_rsvp === 'absent' ? 'Pas dispo cette fois' : 'En mode peut-être...'}
            </span>
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}

// Party en cours card
function ActivePartyCard({ squadName, participantCount }: { squadName: string; participantCount: number }) {
  return (
    <Link to="/party">
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="p-4 bg-gradient-to-r from-primary/8 to-transparent border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-text-primary">
                {participantCount} {participantCount > 1 ? 'potes' : 'pote'} dans {squadName}
              </div>
              <div className="text-[13px] text-text-tertiary">Party vocale en cours</div>
            </div>
            <motion.div
              className="px-4 py-2 rounded-lg bg-primary text-white text-[14px] font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              Rejoindre
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </Link>
  )
}

// Stats compactes avec icônes - Design premium gaming - Cards cliquables
function StatsRow({ squadsCount, sessionsThisWeek, reliabilityScore }: {
  squadsCount: number
  sessionsThisWeek: number
  reliabilityScore: number
}) {
  const stats = [
    { value: squadsCount, label: 'Squads', icon: Users, color: '#6366f1', suffix: '', path: '/squads' },
    { value: sessionsThisWeek, label: 'Cette semaine', icon: Calendar, color: '#fbbf24', suffix: '', path: '/sessions' },
    { value: reliabilityScore, label: 'Fiabilité', icon: TrendingUp, color: '#34d399', suffix: '%', path: '/profile' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat, index) => (
        <Link key={stat.label} to={stat.path}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              scale: 1.02,
              boxShadow: `0 0 20px ${stat.color}25`,
            }}
            whileTap={{ scale: 0.98 }}
            className="h-[60px] sm:h-[68px] px-2 sm:px-4 flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-border-default bg-surface-card hover:bg-surface-card-hover cursor-pointer transition-all duration-200"
            style={{
              transition: 'all 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[16px] sm:text-[20px] font-bold text-text-primary tracking-tight leading-none">
                <CountUp end={stat.value} duration={1.2} suffix={stat.suffix} />
              </div>
              <div className="text-[8px] sm:text-[10px] text-text-quaternary uppercase tracking-wider mt-0.5 truncate font-medium">
                {stat.label}
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  )
}

export default function Home() {
  const { user, profile, isInitialized } = useAuthStore()
  const { isConnected: isInVoiceChat, currentChannel, remoteUsers } = useVoiceChatStore()
  const navigate = useNavigate()

  // React Query hooks - automatic caching and deduplication
  const { data: squads = [], isLoading: squadsLoading } = useSquadsQuery()
  const { data: rawSessions = [], isLoading: sessionsQueryLoading } = useUpcomingSessionsQuery(user?.id)
  const rsvpMutation = useRsvpMutation()

  // Friends playing - React Query with automatic caching (replaces useEffect)
  const { data: friendsPlaying = [], isLoading: friendsLoading } = useFriendsPlayingQuery(user?.id)

  // AI Coach tip - React Query with Infinity staleTime (only fetches once per session)
  const { data: aiCoachTip, isLoading: aiCoachLoading } = useAICoachQueryDeferred(user?.id, 'home')
  const openCreateSessionModal = useCreateSessionModal(state => state.open)

  const [showConfetti, setShowConfetti] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Transform sessions to include squad names (memoized)
  const upcomingSessions = useMemo<UpcomingSession[]>(() => {
    if (!rawSessions.length || !squads.length) return []

    return rawSessions
      .filter(s => s.status !== 'cancelled')
      .slice(0, 5)
      .map(session => {
        const squad = squads.find(s => s.id === session.squad_id)
        return {
          id: session.id,
          title: session.title,
          game: session.game,
          scheduled_at: session.scheduled_at,
          status: session.status,
          squad_id: session.squad_id,
          squad_name: squad?.name || 'Squad',
          total_members: squad?.member_count || squad?.total_members || 1,
          rsvp_counts: session.rsvp_counts || { present: 0, absent: 0, maybe: 0 },
          my_rsvp: session.my_rsvp || null,
        }
      })
  }, [rawSessions, squads])

  // Calculate sessions this week (memoized)
  const sessionsThisWeek = useMemo(() => {
    if (!rawSessions.length) return 0
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    return rawSessions.filter(s => {
      const date = new Date(s.scheduled_at)
      return date >= startOfWeek && date < endOfWeek
    }).length
  }, [rawSessions])

  const sessionsLoading = sessionsQueryLoading || (squadsLoading && !squads.length)

  // Handle joining a friend's party
  const handleJoinFriendParty = (squadId: string) => {
    navigate(`/party?squad=${squadId}`)
  }

  // Handle inviting a friend - navigate to DM to send invite
  const handleInviteFriend = (friendId: string) => {
    navigate(`/messages?dm=${friendId}`)
  }

  // Handle RSVP avec célébration - Uses React Query mutation with optimistic updates
  const handleRsvp = async (sessionId: string, response: 'present' | 'absent' | 'maybe') => {
    // Trigger haptic feedback on mobile
    haptic.medium()

    try {
      await rsvpMutation.mutateAsync({ sessionId, response })

      // React Query handles cache invalidation automatically via the mutation's onSuccess
      // Célébration pour "présent" - moment Wow!
      if (response === 'present') {
        haptic.success()
        setShowConfetti(true)
        setSuccessMessage("T'es confirme ! Ta squad compte sur toi")
        setTimeout(() => setShowConfetti(false), 4000)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        const labels = {
          absent: 'Absence enregistrée',
          maybe: 'Réponse enregistrée'
        }
        setSuccessMessage(labels[response])
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (error) {
      haptic.error()
      console.error('RSVP error:', error)
    }
  }

  if (!isInitialized) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // Non connecté : rediriger vers landing
  if (!user) {
    navigate('/')
    return null
  }

  const reliabilityScore = profile?.reliability_score || 100
  const nextSession = upcomingSessions[0]

  // Déterminer si une party est active avec d'autres participants
  // Ne pas afficher si l'utilisateur est seul dans la party (ça n'a pas de sens)
  const activeParty = isInVoiceChat && currentChannel && remoteUsers.length > 0 ? {
    squadName: squads.find(s => currentChannel.includes(s.id))?.name || 'Ta squad',
    participantCount: remoteUsers.length + 1,
  } : null

  // Nombre de sessions en attente de réponse
  const pendingRsvps = upcomingSessions.filter(s => !s.my_rsvp).length

  return (
    <div className="min-h-0 bg-bg-base pb-6">
      {/* Confetti celebration for RSVP present */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={150}
          gravity={0.3}
          colors={['#34d399', '#6366f1', '#fbbf24', '#a78bfa', '#f7f8f8']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Success message toast */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-success/15 border border-success/20 backdrop-blur-sm"
        >
          <p className="text-[14px] font-medium text-success">{successMessage}</p>
        </motion.div>
      )}

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          {/* Header avec célébration - Wording gamer */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Salut {profile?.username || 'Gamer'} !
              </h1>
              {upcomingSessions.length > 0 ? (
                <p className="text-[14px] text-text-tertiary">
                  {pendingRsvps > 0
                    ? `${pendingRsvps} session${pendingRsvps > 1 ? 's' : ''} ${pendingRsvps > 1 ? 'attendent' : 'attend'} ta réponse`
                    : "T'es carré, toutes tes sessions sont confirmées"
                  }
                </p>
              ) : (
                <p className="text-[14px] text-text-tertiary">Ta squad t'attend, lance une session !</p>
              )}
            </div>
            <ReliabilityBadge score={reliabilityScore} />
          </div>

          {/* Onboarding Checklist pour les nouveaux utilisateurs */}
          {(!squadsLoading && !sessionsLoading) && (squads.length === 0 || upcomingSessions.length === 0) && (
            <OnboardingChecklist
              hasSquad={squads.length > 0}
              hasSession={upcomingSessions.length > 0}
              onCreateSession={openCreateSessionModal}
            />
          )}

          {/* AI Coach Tip - Contextuel - Cliquable pour créer une session */}
          {aiCoachLoading ? (
            <div className="mb-6" data-tour="ai-coach">
              <SkeletonAICoach />
            </div>
          ) : aiCoachTip && (
            <motion.div
              className="mb-6 cursor-pointer"
              data-tour="ai-coach"
              onClick={() => openCreateSessionModal()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card className={`p-3 flex items-center gap-3 border transition-all duration-200 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] ${
                aiCoachTip.tone === 'celebration'
                  ? 'bg-gradient-to-r from-success/8 to-transparent border-success/15 hover:border-success/30'
                  : aiCoachTip.tone === 'warning'
                    ? 'bg-gradient-to-r from-error/8 to-transparent border-error/15 hover:border-error/30'
                    : 'bg-gradient-to-r from-primary/8 to-transparent border-primary/15 hover:border-primary/30'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  aiCoachTip.tone === 'celebration'
                    ? 'bg-success/12'
                    : aiCoachTip.tone === 'warning'
                      ? 'bg-error/12'
                      : 'bg-primary/12'
                }`}>
                  <Sparkles className={`w-4 h-4 ${
                    aiCoachTip.tone === 'celebration'
                      ? 'text-success'
                      : aiCoachTip.tone === 'warning'
                        ? 'text-error'
                        : 'text-primary'
                  }`} />
                </div>
                <p className={`text-[13px] leading-relaxed flex-1 ${
                  aiCoachTip.tone === 'celebration'
                    ? 'text-success'
                    : aiCoachTip.tone === 'warning'
                      ? 'text-error'
                      : 'text-text-tertiary'
                }`}>
                  {aiCoachTip.tip}
                </p>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                  aiCoachTip.tone === 'celebration'
                    ? 'text-success/60'
                    : aiCoachTip.tone === 'warning'
                      ? 'text-error/60'
                      : 'text-primary/60'
                }`} />
              </Card>
            </motion.div>
          )}

          {/* Party en cours */}
          {activeParty && (
            <div className="mb-6">
              <ActivePartyCard
                squadName={activeParty.squadName}
                participantCount={activeParty.participantCount}
              />
            </div>
          )}

          {/* Prochaine session */}
          {sessionsLoading ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[18px] font-semibold text-text-primary">
                  Prochaine session
                </h2>
              </div>
              <SessionCardSkeleton />
            </div>
          ) : nextSession && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[18px] font-semibold text-text-primary">
                  Prochaine session
                </h2>
                {upcomingSessions.length > 1 && (
                  <Link to="/squads" className="text-[12px] text-primary font-medium">
                    Voir tout ({upcomingSessions.length})
                  </Link>
                )}
              </div>
              <NextSessionCard session={nextSession} onRsvp={handleRsvp} isRsvpLoading={rsvpMutation.isPending} />
            </div>
          )}

          {/* Friends Playing Section */}
          {friendsLoading ? (
            <SkeletonFriendsPlaying />
          ) : (
            <FriendsPlaying
              friends={friendsPlaying}
              onJoin={handleJoinFriendParty}
              onInvite={handleInviteFriend}
            />
          )}

          {/* Stats - Wording gamer */}
          <div className="mb-6">
            <h2 className="text-[18px] font-semibold text-text-primary mb-3">
              Ton tableau de bord
            </h2>
            <div className="space-y-4">
              {(squadsLoading || sessionsLoading) ? (
                /* Skeleton pendant le chargement - évite le flash de fausses données */
                <SkeletonStatsRow />
              ) : (
                <StatsRow
                  squadsCount={squads.length}
                  sessionsThisWeek={sessionsThisWeek}
                  reliabilityScore={reliabilityScore}
                />
              )}
              {/* Streak Counter */}
              {!profile ? (
                <SkeletonStreakCounter />
              ) : (
                <StreakCounter
                  streakDays={profile.streak_days || 0}
                  lastActiveDate={profile.streak_last_date || null}
                />
              )}
            </div>
          </div>

          {/* Mes squads */}
          {squadsLoading ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[18px] font-semibold text-text-primary">
                  Mes squads
                </h2>
              </div>
              <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                <SquadCardSkeleton />
                <SquadCardSkeleton />
                <SquadCardSkeleton />
              </div>
            </div>
          ) : squads.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[18px] font-semibold text-text-primary">
                  Mes squads
                </h2>
                <Link to="/squads">
                  <motion.button
                    className="text-[12px] text-primary font-medium flex items-center gap-1"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    Gérer
                    <ChevronRight className="w-3.5 h-3.5" />
                  </motion.button>
                </Link>
              </div>
              <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                {squads.slice(0, 6).map((squad, index) => (
                  <Link key={squad.id} to={`/squad/${squad.id}`}>
                    <motion.div
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                    >
                      <Card className="p-3 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-interactive">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/12 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-medium text-text-primary truncate">{squad.name}</div>
                            <div className="text-[12px] text-text-tertiary">{squad.game}</div>
                          </div>
                          <div className="text-[12px] text-text-quaternary">
                            {squad.member_count || squad.total_members || 1} membre{(squad.member_count || squad.total_members || 1) > 1 ? 's' : ''}
                          </div>
                          <ChevronRight className="w-4 h-4 text-text-quaternary" />
                        </div>
                      </Card>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            /* État vide - Pas de squad - Wording motivant */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            >
              <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-transparent border-dashed">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-[#a78bfa]/8 flex items-center justify-center mx-auto mb-4"
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 4, repeat: 2 }}
                >
                  <Users className="w-7 h-7 text-primary" strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-[16px] font-semibold text-text-primary mb-2">
                  Tes potes t'attendent !
                </h3>
                <p className="text-[14px] text-text-tertiary mb-6 max-w-[250px] mx-auto">
                  Crée ta squad et finis-en avec les "on verra". Place à l'action !
                </p>
                <Link to="/squads">
                  <motion.button
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-white text-[14px] font-semibold shadow-[0_0_16px_rgba(99,102,241,0.15)]"
                    whileHover={{ y: -2, scale: 1.02, boxShadow: "0 0 20px rgba(99,102,241,0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    Créer ma squad
                  </motion.button>
                </Link>
              </Card>
            </motion.div>
          )}

          {/* CTA Party flottant - Wording fun */}
          {!nextSession && squads.length > 0 && !activeParty && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
            >
              <Link to="/party">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Card className="p-4 bg-gradient-to-r from-[#6366f1]/8 to-transparent border-dashed border-[#6366f1]/20 hover:border-[#6366f1]/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-interactive">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-10 h-10 rounded-lg bg-[#6366f1]/12 flex items-center justify-center"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2.5, repeat: 3 }}
                      >
                        <Mic className="w-5 h-5 text-[#6366f1]" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="text-[14px] font-medium text-text-primary">Envie de papoter ?</div>
                        <div className="text-[12px] text-text-tertiary">Lance une party, ta squad est peut-être dispo !</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-quaternary" />
                    </div>
                  </Card>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
