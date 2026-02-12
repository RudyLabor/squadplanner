'use client'

import { useState, useEffect, useMemo, useCallback, useRef, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { m } from 'framer-motion'
import { TrendingUp, Loader2, AlertCircle, Star } from '../components/icons'
import { useNavigate } from 'react-router'
import Confetti from '../components/LazyConfetti'
import { PullToRefresh } from '../components/PullToRefresh'
import { Tooltip, CrossfadeTransition, SkeletonHomePage } from '../components/ui'
import { useAuthStore } from '../hooks'
// Lazy-load voice chat store to avoid pulling livekit into the main bundle.
// IMPORTANT: We use getState()/subscribe() instead of calling the zustand hook
// directly, because calling store() conditionally would violate Rules of Hooks
// (the hook count changes when the dynamic import resolves, crashing React).
const voiceChatStorePromise = import('../hooks/useVoiceChat')
let cachedStore: any = null

const defaultVoiceState = { isConnected: false, currentChannel: null, remoteUsers: [] }

function useVoiceChatStoreLazy() {
  const state = useSyncExternalStore(
    (cb) => {
      if (!cachedStore) {
        voiceChatStorePromise.then((mod) => {
          cachedStore = mod.useVoiceChatStore
          cb()
        })
        return () => {}
      }
      // Once loaded, subscribe to zustand store changes via its subscribe API
      return cachedStore.subscribe(cb)
    },
    () => (cachedStore ? cachedStore.getState() : null),
    () => null
  )
  if (!state) return defaultVoiceState
  return state
}
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

interface HomeLoaderData {
  profile: any
  squads: any[]
  upcomingSessions: any[]
}

interface HomeProps {
  loaderData?: HomeLoaderData
}

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
  const tooltipText =
    'Ton score de fiabilit\u00e9 mesure ta r\u00e9gularit\u00e9 \u00e0 confirmer ta pr\u00e9sence aux sessions. Il monte quand tu confirmes (+5%) et baisse quand tu ne r\u00e9ponds pas (-10%). Au-dessus de 95%, tu es consid\u00e9r\u00e9 comme ultra-fiable !'

  const getBadgeContent = () => {
    if (score >= 95) {
      return (
        <m.div
          className="flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-gradient-to-r from-success/15 to-success/5 border border-success/20 shadow-glow-success cursor-help"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 25 }}
          whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glow-success)' }}
        >
          <m.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.5, repeat: 2, repeatDelay: 4 }}
          >
            <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-success fill-success" />
          </m.div>
          <span className="text-sm md:text-base font-medium text-success">{score}% fiable</span>
        </m.div>
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

export default function Home({ loaderData }: HomeProps) {
  const { user, profile: authProfile, isInitialized } = useAuthStore()
  const profile = loaderData?.profile || authProfile
  const { isConnected: isInVoiceChat, currentChannel, remoteUsers } = useVoiceChatStoreLazy()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['squads'] }),
      queryClient.invalidateQueries({ queryKey: ['sessions'] }),
      queryClient.invalidateQueries({ queryKey: ['friends-playing'] }),
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] }),
    ])
  }, [queryClient])

  const { data: squads = [], isLoading: squadsLoading } = useSquadsQuery()
  const { data: rawSessions = [], isLoading: sessionsQueryLoading } = useUpcomingSessionsQuery(
    user?.id
  )
  const rsvpMutation = useRsvpMutation()
  const { data: friendsPlaying = [], isLoading: friendsLoading } = useFriendsPlayingQuery(user?.id)
  const { data: aiCoachTip, isLoading: aiCoachLoading } = useAICoachQueryDeferred(user?.id, 'home')
  const openCreateSessionModal = useCreateSessionModal((state) => state.open)

  const [showConfetti, setShowConfetti] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [greeting, setGreeting] = useState('Salut')
  const rsvpTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const hour = new Date().getHours()
    const g = hour >= 5 && hour < 18 ? 'Salut' : 'Bonsoir'
    setGreeting(g)
    // UI #1: Sync document title with dynamic greeting
    const username = profile?.username || user?.user_metadata?.username || ''
    document.title = username ? `${g} ${username} — Squad Planner` : 'Accueil — Squad Planner'
    return () => {
      rsvpTimers.current.forEach(clearTimeout)
    }
  }, [])

  const upcomingSessions = useMemo<UpcomingSession[]>(() => {
    if (!rawSessions?.length || !squads?.length) return []
    return rawSessions
      .filter((s) => s.status !== 'cancelled')
      .slice(0, 5)
      .map((session) => {
        const squad = squads.find((s) => s.id === session.squad_id)
        return {
          id: session.id,
          title: session.title,
          game: session.game,
          scheduled_at: session.scheduled_at,
          status: session.status,
          squad_id: session.squad_id,
          squad_name: squad?.name || 'Squad',
          total_members: squad?.member_count ?? squad?.total_members ?? 1,
          rsvp_counts: session.rsvp_counts || { present: 0, absent: 0, maybe: 0 },
          my_rsvp: session.my_rsvp || null,
        }
      })
  }, [rawSessions, squads])

  const sessionsThisWeek = useMemo(() => {
    if (!rawSessions?.length) return 0
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    return rawSessions.filter((s) => {
      const date = new Date(s.scheduled_at)
      return date >= startOfWeek && date < endOfWeek
    }).length
  }, [rawSessions])

  const sessionsLoading = sessionsQueryLoading || (squadsLoading && !squads.length)

  const handleJoinFriendParty = useCallback(
    (squadId: string) => {
      navigate(`/party?squad=${squadId}`)
    },
    [navigate]
  )
  const handleInviteFriend = useCallback(
    (friendId: string) => {
      navigate(`/messages?dm=${friendId}`)
    },
    [navigate]
  )

  const handleRsvp = async (sessionId: string, response: 'present' | 'absent' | 'maybe') => {
    haptic.medium()
    try {
      await rsvpMutation.mutateAsync({ sessionId, response })
      if (response === 'present') {
        haptic.success()
        setShowConfetti(true)
        setSuccessMessage("T'es confirmé ! Ta squad compte sur toi")
        rsvpTimers.current.push(setTimeout(() => setShowConfetti(false), 4000))
        rsvpTimers.current.push(setTimeout(() => setSuccessMessage(null), 5000))
      } else {
        setSuccessMessage(response === 'absent' ? 'Absence enregistrée' : 'Réponse enregistrée')
        rsvpTimers.current.push(setTimeout(() => setSuccessMessage(null), 3000))
      }
    } catch (error) {
      haptic.error()
      console.error('RSVP error:', error)
      setSuccessMessage("Erreur : ta réponse n'a pas pu être enregistrée")
      rsvpTimers.current.push(setTimeout(() => setSuccessMessage(null), 4000))
    }
  }

  const hasServerData = !!loaderData?.profile
  const homeLoading = hasServerData
    ? false
    : !isInitialized || (squadsLoading && sessionsQueryLoading)

  if (!hasServerData && !isInitialized && !user) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!hasServerData && isInitialized && !user) {
    navigate('/')
    return null
  }

  const reliabilityScore = profile?.reliability_score ?? 100
  const pendingRsvps = upcomingSessions.filter((s) => !s.my_rsvp).length

  const activeParty =
    isInVoiceChat && currentChannel && remoteUsers.length > 0
      ? {
          squadName: squads.find((s) => currentChannel.includes(s.id))?.name || 'Ta squad',
          participantCount: remoteUsers.length + 1,
        }
      : null

  return (
    <div className="min-h-0 bg-bg-base pb-6">
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

      {successMessage && (
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-success/15 border border-success/20 backdrop-blur-sm"
          role="status"
        >
          <p className="text-md font-medium text-success">{successMessage}</p>
        </m.div>
      )}

      <PullToRefresh
        onRefresh={handleRefresh}
        className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-6xl mx-auto"
      >
        <CrossfadeTransition isLoading={homeLoading} skeleton={<SkeletonHomePage />}>
          <div>
            <m.header
              className="mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-lg md:text-xl font-bold text-text-primary mb-1">
                {greeting}{' '}
                {profile?.username && (
                  <span className="hidden sm:inline">
                    {profile.username.length > 15
                      ? profile.username.slice(0, 15) + '\u2026'
                      : profile.username}{' '}
                  </span>
                )}
                !
              </h1>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-text-tertiary line-clamp-1 min-w-0">
                  {upcomingSessions.length > 0
                    ? pendingRsvps > 0
                      ? `${pendingRsvps} session${pendingRsvps > 1 ? 's' : ''} ${pendingRsvps > 1 ? 'attendent' : 'attend'} ta réponse`
                      : "T'es carré, toutes tes sessions sont confirmées"
                    : "Ta squad t'attend, lance une session !"}
                </p>
                <ReliabilityBadge score={reliabilityScore} />
              </div>
            </m.header>

            {!squadsLoading &&
              !sessionsLoading &&
              (squads.length === 0 || upcomingSessions.length === 0) &&
              profile?.created_at &&
              Date.now() - new Date(profile.created_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
                <OnboardingChecklist
                  hasSquad={squads.length > 0}
                  hasSession={upcomingSessions.length > 0}
                  onCreateSession={openCreateSessionModal}
                />
              )}

            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <HomeStatsSection
                squadsCount={squads.length}
                sessionsThisWeek={sessionsThisWeek}
                squadsLoading={squadsLoading}
                sessionsLoading={sessionsLoading}
                profile={profile}
              />
            </m.div>
            <m.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <HomeAICoachSection
                aiCoachTip={aiCoachTip}
                aiCoachLoading={aiCoachLoading}
                onAction={openCreateSessionModal}
              />
              <HomePartySection
                activeParty={activeParty}
                showCTA={!upcomingSessions[0] && squads.length > 0 && !activeParty}
              />
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <HomeSessionsSection
                upcomingSessions={upcomingSessions}
                sessionsLoading={sessionsLoading}
                onRsvp={handleRsvp}
                isRsvpLoading={rsvpMutation.isPending}
                onCreateSession={openCreateSessionModal}
              />
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <HomeFriendsSection
                friendsPlaying={friendsPlaying}
                friendsLoading={friendsLoading}
                onJoin={handleJoinFriendParty}
                onInvite={handleInviteFriend}
              />
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <HomeActivityFeed squadIds={(squads || []).map((s) => s.id)} />
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <HomeSquadsSection squads={squads} squadsLoading={squadsLoading} />
            </m.div>
          </div>
        </CrossfadeTransition>
      </PullToRefresh>
    </div>
  )
}
