import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, TrendingUp, ChevronRight, Loader2, Mic, CheckCircle2, AlertCircle, Sparkles, Star, HelpCircle, XCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CountUp from 'react-countup'
import Confetti from 'react-confetti'
import { Card, Badge, SessionCardSkeleton, SquadCardSkeleton } from '../components/ui'
import { useAuthStore, useSquadsStore, useVoiceChatStore, useAIStore, useSessionsStore } from '../hooks'
import { supabase } from '../lib/supabase'
import { FriendsPlaying, type FriendPlaying } from '../components/FriendsPlaying'
import { StreakCounter } from '../components/StreakCounter'

// Types
interface UpcomingSession {
  id: string
  title?: string
  game?: string
  scheduled_at: string
  status: string
  squad_id: string
  squad_name: string
  rsvp_counts: { present: number; absent: number; maybe: number }
  my_rsvp: 'present' | 'absent' | 'maybe' | null
  total_members: number
}

// Badge fiabilité avec glow subtil
function ReliabilityBadge({ score }: { score: number }) {
  if (score >= 95) {
    return (
      <motion.div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#34d399]/15 to-[#34d399]/5 border border-[#34d399]/20 shadow-[0_0_12px_rgba(52,211,153,0.1)]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 25 }}
        whileHover={{ scale: 1.02, boxShadow: "0 0 16px rgba(52,211,153,0.15)" }}
      >
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2.5, repeat: 2, repeatDelay: 4 }}
        >
          <Star className="w-4 h-4 text-[#34d399] fill-[#34d399]" />
        </motion.div>
        <span className="text-[13px] font-medium text-[#34d399]">100% fiable</span>
      </motion.div>
    )
  }
  if (score >= 80) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#34d399]/10 border border-[#34d399]/15">
        <TrendingUp className="w-4 h-4 text-[#34d399]" />
        <span className="text-[13px] font-medium text-[#34d399]">{score}% fiable</span>
      </div>
    )
  }
  if (score >= 60) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/15">
        <TrendingUp className="w-4 h-4 text-[#fbbf24]" />
        <span className="text-[13px] font-medium text-[#fbbf24]">{score}%</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f87171]/10 border border-[#f87171]/15">
      <AlertCircle className="w-4 h-4 text-[#f87171]" />
      <span className="text-[13px] font-medium text-[#f87171]">{score}%</span>
    </div>
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
      <Card className="p-4 border-l-4 border-l-[#6366f1] bg-gradient-to-br from-[#6366f1]/8 via-transparent to-[#34d399]/3 hover:from-[#6366f1]/12 hover:to-[#34d399]/6 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-400">
        {/* Header avec lien vers squad */}
        <Link to={`/squad/${session.squad_id}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[15px] font-semibold text-[#f7f8f8] hover:text-[#6366f1] transition-colors duration-400">
                {session.title || session.game || 'Session'}
              </div>
              <div className="text-[13px] text-[#8b8d90]">{session.squad_name}</div>
            </div>
            <Badge variant={diffMs < 0 ? 'success' : diffHours < 24 ? 'warning' : 'default'}>
              {timeLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-[13px] text-[#8b8d90] mb-3">
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
          <div className="flex gap-2 pt-2 border-t border-white/5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              disabled={isRsvpLoading}
              onClick={() => onRsvp(session.id, 'present')}
              aria-label="Marquer comme présent"
              aria-pressed={session.my_rsvp === 'present'}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium transition-all duration-400 ${
                session.my_rsvp === 'present'
                  ? 'bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(52,211,153,0.1)] hover:text-[#34d399] border border-transparent hover:border-[#34d399]/15'
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
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium transition-all duration-400 ${
                session.my_rsvp === 'maybe'
                  ? 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(251,191,36,0.1)] hover:text-[#fbbf24] border border-transparent hover:border-[#fbbf24]/15'
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
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium transition-all duration-400 ${
                session.my_rsvp === 'absent'
                  ? 'bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(248,113,113,0.1)] hover:text-[#f87171] border border-transparent hover:border-[#f87171]/15'
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
            className={`flex items-center gap-2 text-[13px] mt-2 pt-2 border-t border-white/5 ${
              session.my_rsvp === 'present' ? 'text-[#34d399]' :
              session.my_rsvp === 'absent' ? 'text-[#f87171]' : 'text-[#fbbf24]'
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
        <Card className="p-4 bg-gradient-to-r from-[#6366f1]/8 to-transparent border-[#6366f1]/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#6366f1]/15 flex items-center justify-center">
              <Mic className="w-6 h-6 text-[#6366f1]" />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-[#f7f8f8]">
                {participantCount} {participantCount > 1 ? 'potes' : 'pote'} dans {squadName}
              </div>
              <div className="text-[13px] text-[#8b8d90]">Party vocale en cours</div>
            </div>
            <motion.div
              className="px-4 py-2 rounded-lg bg-[#6366f1] text-white text-[14px] font-medium"
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

// Stats compactes avec icônes - Design premium gaming
function StatsRow({ squadsCount, sessionsThisWeek, reliabilityScore }: {
  squadsCount: number
  sessionsThisWeek: number
  reliabilityScore: number
}) {
  const stats = [
    { value: squadsCount, label: 'Squads', icon: Users, color: '#6366f1', suffix: '' },
    { value: sessionsThisWeek, label: 'Cette semaine', icon: Calendar, color: '#fbbf24', suffix: '' },
    { value: reliabilityScore, label: 'Fiabilité', icon: TrendingUp, color: '#34d399', suffix: '%' },
  ]

  return (
    <div className="flex gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 h-[68px] px-4 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] cursor-pointer transition-all duration-300"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${stat.color}15` }}
          >
            <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[20px] font-bold text-white tracking-tight leading-none">
              <CountUp end={stat.value} duration={1.2} suffix={stat.suffix} />
            </div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5 truncate font-medium">
              {stat.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function Home() {
  const { user, profile, isInitialized } = useAuthStore()
  const { squads, fetchSquads, isLoading: squadsLoading } = useSquadsStore()
  const { isConnected: isInVoiceChat, currentChannel, remoteUsers } = useVoiceChatStore()
  const { aiCoachTip, fetchAICoachTip } = useAIStore()
  const { updateRsvp } = useSessionsStore()
  const navigate = useNavigate()

  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [friendsPlaying, setFriendsPlaying] = useState<FriendPlaying[]>([])
  const [friendsLoading, setFriendsLoading] = useState(true)

  // Fetch squads
  useEffect(() => {
    if (user) {
      fetchSquads()
    }
  }, [user, fetchSquads])

  // Fetch AI Coach tip for home context
  useEffect(() => {
    if (user?.id) {
      fetchAICoachTip(user.id, 'home')
    }
  }, [user?.id, fetchAICoachTip])

  // Fetch upcoming sessions from all squads
  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      if (!user || squads.length === 0) {
        setSessionsLoading(false)
        return
      }

      setSessionsLoading(true)
      try {
        const squadIds = squads.map(s => s.id)
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)

        // Fetch upcoming sessions (not cancelled)
        const { data: sessions, error } = await supabase
          .from('sessions')
          .select('*')
          .in('squad_id', squadIds)
          .neq('status', 'cancelled')
          .gte('scheduled_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Include sessions from 2h ago (in progress)
          .order('scheduled_at', { ascending: true })
          .limit(5)

        if (error) throw error

        // Count sessions this week
        const { count: weekCount } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .in('squad_id', squadIds)
          .gte('scheduled_at', startOfWeek.toISOString())
          .lt('scheduled_at', endOfWeek.toISOString())

        setSessionsThisWeek(weekCount || 0)

        // Enrich sessions with squad info and RSVPs
        const enrichedSessions: UpcomingSession[] = []
        for (const session of sessions || []) {
          const squad = squads.find(s => s.id === session.squad_id)

          // Get RSVPs
          const { data: rsvps } = await supabase
            .from('session_rsvps')
            .select('*')
            .eq('session_id', session.id)

          const my_rsvp = rsvps?.find(r => r.user_id === user.id)?.response as 'present' | 'absent' | 'maybe' | null || null

          enrichedSessions.push({
            id: session.id,
            title: session.title,
            game: session.game,
            scheduled_at: session.scheduled_at,
            status: session.status,
            squad_id: session.squad_id,
            squad_name: squad?.name || 'Squad',
            total_members: squad?.member_count || squad?.total_members || 1,
            rsvp_counts: {
              present: rsvps?.filter(r => r.response === 'present').length || 0,
              absent: rsvps?.filter(r => r.response === 'absent').length || 0,
              maybe: rsvps?.filter(r => r.response === 'maybe').length || 0,
            },
            my_rsvp,
          })
        }

        setUpcomingSessions(enrichedSessions)
      } catch (error) {
        console.error('Error fetching upcoming sessions:', error)
      } finally {
        setSessionsLoading(false)
      }
    }

    fetchUpcomingSessions()
  }, [user, squads])

  // Fetch friends playing
  useEffect(() => {
    const fetchFriendsPlaying = async () => {
      if (!user?.id) {
        setFriendsLoading(false)
        return
      }

      setFriendsLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_friends_playing', { user_id: user.id })

        if (error) {
          // If the RPC doesn't exist yet, just set empty array
          console.warn('get_friends_playing RPC not available:', error.message)
          setFriendsPlaying([])
        } else {
          setFriendsPlaying(data || [])
        }
      } catch (error) {
        console.error('Error fetching friends playing:', error)
        setFriendsPlaying([])
      } finally {
        setFriendsLoading(false)
      }
    }

    fetchFriendsPlaying()
  }, [user?.id])

  // Handle joining a friend's party
  const handleJoinFriendParty = (squadId: string) => {
    navigate(`/party?squad=${squadId}`)
  }

  // Handle inviting a friend
  const handleInviteFriend = (friendId: string) => {
    // TODO: Open invite modal
    console.log('Invite friend:', friendId)
  }

  // Handle RSVP avec célébration
  const handleRsvp = async (sessionId: string, response: 'present' | 'absent' | 'maybe') => {
    setRsvpLoading(true)
    try {
      const { error } = await updateRsvp(sessionId, response)
      if (error) {
        console.error('RSVP error:', error)
        return
      }

      // Update local state immédiatement pour UX réactive
      setUpcomingSessions(prev => prev.map(s =>
        s.id === sessionId
          ? {
              ...s,
              my_rsvp: response,
              rsvp_counts: {
                ...s.rsvp_counts,
                [response]: s.rsvp_counts[response] + (s.my_rsvp === response ? 0 : 1),
                ...(s.my_rsvp && s.my_rsvp !== response ? { [s.my_rsvp]: Math.max(0, s.rsvp_counts[s.my_rsvp] - 1) } : {})
              }
            }
          : s
      ))

      // Célébration pour "présent" - moment Wow!
      if (response === 'present') {
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
      console.error('RSVP error:', error)
    } finally {
      setRsvpLoading(false)
    }
  }

  if (!isInitialized) {
    return (
      <div className="min-h-0 bg-[#050506] flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
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

  // Déterminer si une party est active (simulé pour l'instant)
  // TODO: Implémenter la détection réelle des parties actives via Supabase Realtime
  const activeParty = isInVoiceChat && currentChannel ? {
    squadName: squads.find(s => currentChannel.includes(s.id))?.name || 'Ta squad',
    participantCount: remoteUsers.length + 1,
  } : null

  // Nombre de sessions en attente de réponse
  const pendingRsvps = upcomingSessions.filter(s => !s.my_rsvp).length

  return (
    <div className="min-h-0 bg-[#050506] pb-6">
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
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-[#34d399]/15 border border-[#34d399]/20 backdrop-blur-sm"
        >
          <p className="text-[14px] font-medium text-[#34d399]">{successMessage}</p>
        </motion.div>
      )}

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          {/* Header avec célébration - Wording gamer */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#f7f8f8]">
                Salut {profile?.username || 'Gamer'} !
              </h1>
              {upcomingSessions.length > 0 ? (
                <p className="text-[14px] text-[#8b8d90]">
                  {pendingRsvps > 0
                    ? `${pendingRsvps} session${pendingRsvps > 1 ? 's' : ''} ${pendingRsvps > 1 ? 'attendent' : 'attend'} ta réponse`
                    : "T'es carré, toutes tes sessions sont confirmées"
                  }
                </p>
              ) : (
                <p className="text-[14px] text-[#8b8d90]">Ta squad t'attend, lance une session !</p>
              )}
            </div>
            <ReliabilityBadge score={reliabilityScore} />
          </div>

          {/* AI Coach Tip - Contextuel */}
          {aiCoachTip && (
            <div className="mb-6">
              <Card className={`p-3 flex items-center gap-3 border ${
                aiCoachTip.tone === 'celebration'
                  ? 'bg-gradient-to-r from-[#34d399]/8 to-transparent border-[#34d399]/15'
                  : aiCoachTip.tone === 'warning'
                    ? 'bg-gradient-to-r from-[#f87171]/8 to-transparent border-[#f87171]/15'
                    : 'bg-gradient-to-r from-[#6366f1]/8 to-transparent border-[#6366f1]/15'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  aiCoachTip.tone === 'celebration'
                    ? 'bg-[#34d399]/12'
                    : aiCoachTip.tone === 'warning'
                      ? 'bg-[#f87171]/12'
                      : 'bg-[#6366f1]/12'
                }`}>
                  <Sparkles className={`w-4 h-4 ${
                    aiCoachTip.tone === 'celebration'
                      ? 'text-[#34d399]'
                      : aiCoachTip.tone === 'warning'
                        ? 'text-[#f87171]'
                        : 'text-[#6366f1]'
                  }`} />
                </div>
                <p className={`text-[13px] leading-relaxed flex-1 ${
                  aiCoachTip.tone === 'celebration'
                    ? 'text-[#34d399]'
                    : aiCoachTip.tone === 'warning'
                      ? 'text-[#f87171]'
                      : 'text-[#8b8d90]'
                }`}>
                  {aiCoachTip.tip}
                </p>
              </Card>
            </div>
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
                <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
                  Prochaine session
                </h2>
              </div>
              <SessionCardSkeleton />
            </div>
          ) : nextSession && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
                  Prochaine session
                </h2>
                {upcomingSessions.length > 1 && (
                  <Link to="/squads" className="text-[12px] text-[#6366f1] font-medium">
                    Voir tout ({upcomingSessions.length})
                  </Link>
                )}
              </div>
              <NextSessionCard session={nextSession} onRsvp={handleRsvp} isRsvpLoading={rsvpLoading} />
            </div>
          )}

          {/* Friends Playing Section */}
          {!friendsLoading && (
            <FriendsPlaying
              friends={friendsPlaying}
              onJoin={handleJoinFriendParty}
              onInvite={handleInviteFriend}
            />
          )}

          {/* Stats - Wording gamer */}
          <div className="mb-6">
            <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide mb-3">
              Ton tableau de bord
            </h2>
            <div className="space-y-4">
              <StatsRow
                squadsCount={squads.length}
                sessionsThisWeek={sessionsThisWeek}
                reliabilityScore={reliabilityScore}
              />
              {/* Streak Counter */}
              <StreakCounter
                streakDays={profile?.streak_days || 0}
                lastActiveDate={profile?.streak_last_date || null}
              />
            </div>
          </div>

          {/* Mes squads */}
          {squadsLoading ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
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
                <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
                  Mes squads
                </h2>
                <Link to="/squads">
                  <motion.button
                    className="text-[12px] text-[#6366f1] font-medium flex items-center gap-1"
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
                      <Card className="p-3 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all duration-400">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[rgba(99,102,241,0.12)] flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#6366f1]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-medium text-[#f7f8f8] truncate">{squad.name}</div>
                            <div className="text-[12px] text-[#8b8d90]">{squad.game}</div>
                          </div>
                          <div className="text-[12px] text-[#5e6063]">
                            {squad.member_count || squad.total_members || 1} potes
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#5e6063]" />
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
              <Card className="p-8 text-center bg-gradient-to-br from-[#6366f1]/5 to-transparent border-dashed">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1]/15 to-[#a78bfa]/8 flex items-center justify-center mx-auto mb-4"
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 4, repeat: 2 }}
                >
                  <Users className="w-7 h-7 text-[#6366f1]" strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-2">
                  Tes potes t'attendent !
                </h3>
                <p className="text-[14px] text-[#8b8d90] mb-6 max-w-[250px] mx-auto">
                  Crée ta squad et finis-en avec les "on verra". Place à l'action !
                </p>
                <Link to="/squads">
                  <motion.button
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#6366f1] text-white text-[14px] font-semibold shadow-[0_0_16px_rgba(99,102,241,0.15)]"
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
                  <Card className="p-4 bg-gradient-to-r from-[#6366f1]/8 to-transparent border-dashed border-[#6366f1]/20 hover:border-[#6366f1]/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all duration-400">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-10 h-10 rounded-lg bg-[#6366f1]/12 flex items-center justify-center"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2.5, repeat: 3 }}
                      >
                        <Mic className="w-5 h-5 text-[#6366f1]" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="text-[14px] font-medium text-[#f7f8f8]">Envie de papoter ?</div>
                        <div className="text-[12px] text-[#8b8d90]">Lance une party, ta squad est peut-être dispo !</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#5e6063]" />
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
