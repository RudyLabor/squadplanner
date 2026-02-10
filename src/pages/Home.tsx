import { useState, useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { TrendingUp, Loader2, AlertCircle, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Confetti from '../components/LazyConfetti'
import { PullToRefresh } from '../components/PullToRefresh'
import { Tooltip, CrossfadeTransition, SkeletonHomePage } from '../components/ui'
import { useAuthStore, useVoiceChatStore } from '../hooks'
import { useSquadsQuery } from '../hooks/queries/useSquadsQuery'
import { useRsvpMutation, useUpcomingSessionsQuery } from '../hooks/queries/useSessionsQuery'
import { useFriendsPlayingQuery } from '../hooks/queries/useFriendsPlaying'
import { useAICoachQueryDeferred } from '../hooks/queries/useAICoach'
import { useCreateSessionModal } from '../components/CreateSessionModal'
import { OnboardingChecklist } from '../components/OnboardingChecklist'
import { haptic } from '../utils/haptics'
import {
  HomeStatsSection,
  HomeSessionsSection,
  HomeFriendsSection,
  HomeAICoachSection,
  HomeSquadsSection,
  HomePartySection,
  HomeActivityFeed,
} from '../components/home'

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

// Badge fiabilité avec glow subtil et tooltip
function ReliabilityBadge({ score }: { score: number }) {
  const tooltipText = "Ton score de fiabilité. Il augmente quand tu confirmes ta présence aux sessions."

  const getBadgeContent = () => {
    if (score >= 95) {
      return (
        <motion.div
          className="flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-gradient-to-r from-success/15 to-success/5 border border-success/20 shadow-glow-success cursor-help"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 25 }}
          whileHover={{ scale: 1.02, boxShadow: "var(--shadow-glow-success)" }}
        >
          <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2.5, repeat: 2, repeatDelay: 4 }}>
            <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-success fill-success" />
          </motion.div>
          <span className="text-sm md:text-base font-medium text-success">{score}% fiable</span>
        </motion.div>
      )
    }
    if (score >= 80) {
      return (
        <div className="flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-success/10 border border-success/15 cursor-help">
          <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
          <span className="text-sm md:text-base font-medium text-success">{score}% fiable</span>
        </div>
      )
    }
    if (score >= 60) {
      return (
        <div className="flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-warning/10 border border-warning/15 cursor-help">
          <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-warning" />
          <span className="text-sm md:text-base font-medium text-warning">{score}%</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-error/10 border border-error/15 cursor-help">
        <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-error" />
        <span className="text-sm md:text-base font-medium text-error">{score}%</span>
      </div>
    )
  }

  return (
    <Tooltip content={tooltipText} position="bottom">
      {getBadgeContent()}
    </Tooltip>
  )
}

export default function Home() {
  const { user, profile, isInitialized } = useAuthStore()
  const { isConnected: isInVoiceChat, currentChannel, remoteUsers } = useVoiceChatStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['squads'] }),
      queryClient.invalidateQueries({ queryKey: ['sessions'] }),
      queryClient.invalidateQueries({ queryKey: ['friends-playing'] }),
    ])
  }, [queryClient])

  const { data: squads = [], isLoading: squadsLoading } = useSquadsQuery()
  const { data: rawSessions = [], isLoading: sessionsQueryLoading } = useUpcomingSessionsQuery(user?.id)
  const rsvpMutation = useRsvpMutation()
  const { data: friendsPlaying = [], isLoading: friendsLoading } = useFriendsPlayingQuery(user?.id)
  const { data: aiCoachTip, isLoading: aiCoachLoading } = useAICoachQueryDeferred(user?.id, 'home')
  const openCreateSessionModal = useCreateSessionModal(state => state.open)

  const [showConfetti, setShowConfetti] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const upcomingSessions = useMemo<UpcomingSession[]>(() => {
    if (!rawSessions.length || !squads.length) return []
    return rawSessions
      .filter(s => s.status !== 'cancelled')
      .slice(0, 5)
      .map(session => {
        const squad = squads.find(s => s.id === session.squad_id)
        return {
          id: session.id, title: session.title, game: session.game,
          scheduled_at: session.scheduled_at, status: session.status,
          squad_id: session.squad_id, squad_name: squad?.name || 'Squad',
          total_members: squad?.member_count || squad?.total_members || 1,
          rsvp_counts: session.rsvp_counts || { present: 0, absent: 0, maybe: 0 },
          my_rsvp: session.my_rsvp || null,
        }
      })
  }, [rawSessions, squads])

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

  const handleJoinFriendParty = useCallback((squadId: string) => { navigate(`/party?squad=${squadId}`) }, [navigate])
  const handleInviteFriend = useCallback((friendId: string) => { navigate(`/messages?dm=${friendId}`) }, [navigate])

  const handleRsvp = async (sessionId: string, response: 'present' | 'absent' | 'maybe') => {
    haptic.medium()
    try {
      await rsvpMutation.mutateAsync({ sessionId, response })
      if (response === 'present') {
        haptic.success()
        setShowConfetti(true)
        setSuccessMessage("T'es confirmé ! Ta squad compte sur toi")
        setTimeout(() => setShowConfetti(false), 4000)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setSuccessMessage(response === 'absent' ? 'Absence enregistrée' : 'Réponse enregistrée')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (error) {
      haptic.error()
      console.error('RSVP error:', error)
    }
  }

  const homeLoading = !isInitialized || (squadsLoading && sessionsQueryLoading)

  if (!isInitialized && !user) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (isInitialized && !user) { navigate('/'); return null }

  const reliabilityScore = profile?.reliability_score ?? 100
  const pendingRsvps = upcomingSessions.filter(s => !s.my_rsvp).length

  const activeParty = isInVoiceChat && currentChannel && remoteUsers.length > 0 ? {
    squadName: squads.find(s => currentChannel.includes(s.id))?.name || 'Ta squad',
    participantCount: remoteUsers.length + 1,
  } : null

  return (
    <div className="min-h-0 bg-bg-base pb-6">
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={150} gravity={0.3}
          colors={['#34d399', '#6366f1', '#fbbf24', '#a78bfa', '#f7f8f8']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }} />
      )}

      {successMessage && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-success/15 border border-success/20 backdrop-blur-sm"
          role="status">
          <p className="text-md font-medium text-success">{successMessage}</p>
        </motion.div>
      )}

      <PullToRefresh onRefresh={handleRefresh} className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <CrossfadeTransition isLoading={homeLoading} skeleton={<SkeletonHomePage />}>
          <div>
            <motion.header
              className="mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-xl md:text-2xl font-bold text-text-primary truncate mb-1">
                Salut {profile?.username || 'Gamer'} !
              </h1>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-text-tertiary line-clamp-1 min-w-0">
                  {upcomingSessions.length > 0
                    ? pendingRsvps > 0
                      ? `${pendingRsvps} session${pendingRsvps > 1 ? 's' : ''} ${pendingRsvps > 1 ? 'attendent' : 'attend'} ta réponse`
                      : "T'es carré, toutes tes sessions sont confirmées"
                    : 'Ta squad t\'attend, lance une session !'
                  }
                </p>
                <ReliabilityBadge score={reliabilityScore} />
              </div>
            </motion.header>

            {(!squadsLoading && !sessionsLoading) && (squads.length === 0 || upcomingSessions.length === 0) && profile?.created_at && (Date.now() - new Date(profile.created_at).getTime() < 7 * 24 * 60 * 60 * 1000) && (
              <OnboardingChecklist hasSquad={squads.length > 0} hasSession={upcomingSessions.length > 0} onCreateSession={openCreateSessionModal} />
            )}

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <HomeAICoachSection aiCoachTip={aiCoachTip} aiCoachLoading={aiCoachLoading} onAction={openCreateSessionModal} />
              <HomePartySection activeParty={activeParty} showCTA={!upcomingSessions[0] && squads.length > 0 && !activeParty} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <HomeSessionsSection upcomingSessions={upcomingSessions} sessionsLoading={sessionsLoading} onRsvp={handleRsvp} isRsvpLoading={rsvpMutation.isPending} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <HomeFriendsSection friendsPlaying={friendsPlaying} friendsLoading={friendsLoading} onJoin={handleJoinFriendParty} onInvite={handleInviteFriend} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <HomeStatsSection squadsCount={squads.length} sessionsThisWeek={sessionsThisWeek} reliabilityScore={reliabilityScore} squadsLoading={squadsLoading} sessionsLoading={sessionsLoading} profile={profile} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <HomeActivityFeed squads={squads} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <HomeSquadsSection squads={squads} squadsLoading={squadsLoading} />
            </motion.div>
          </div>
        </CrossfadeTransition>
      </PullToRefresh>
    </div>
  )
}
