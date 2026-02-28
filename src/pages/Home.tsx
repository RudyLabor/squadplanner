import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useSyncExternalStore,
  lazy,
  Suspense,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { m } from 'framer-motion'
import { TrendingUp, Loader2, AlertCircle, Star } from '../components/icons'
import { useNavigate } from 'react-router'
import Confetti from '../components/LazyConfetti'
import { PullToRefresh } from '../components/PullToRefresh'
import { Tooltip, CrossfadeTransition, SkeletonHomePage } from '../components/ui'
import { useAuthStore, useConfetti } from '../hooks'

// PHASE 5: Lazy load WeeklyLeaderboard to avoid blocking initial render
const WeeklyLeaderboard = lazy(() => import('../components/WeeklyLeaderboard'))
// Lazy-load voice chat store (now using native WebRTC)
// IMPORTANT: We use getState()/subscribe() instead of calling the zustand hook
// directly, because calling store() conditionally would violate Rules of Hooks
// (the hook count changes when the dynamic import resolves, crashing React).
const voiceChatStorePromise = import('../hooks/useVoiceChat')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
import { PlanBadge } from '../components/PlanBadge'
import { usePremium, usePremiumStore } from '../hooks/usePremium'
import type { Profile } from '../types/database'
import type { SquadWithMembers } from '../hooks/queries/useSquadsQuery'
import type { SessionWithDetails } from '../hooks/queries/useSessionFetchers'

interface HomeLoaderData {
  profile: Profile | null
  squads: SquadWithMembers[]
  upcomingSessions: SessionWithDetails[]
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
    'Ton score de fiabilité montre si tu tiens parole. +5 % quand tu confirmes. -10 % si tu ghost. Au-dessus de 95 %, tu es invité en priorité.'

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
  const { tier } = usePremium()
  const fetchPremiumStatus = usePremiumStore((s) => s.fetchPremiumStatus)

  useEffect(() => {
    if (user?.id) fetchPremiumStatus()
  }, [user?.id, fetchPremiumStatus])
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

  const loaderSquads = Array.isArray(loaderData?.squads) ? loaderData.squads : []
  const loaderSessions = Array.isArray(loaderData?.upcomingSessions)
    ? loaderData.upcomingSessions
    : []
  const {
    data: querySquads,
    isLoading: squadsLoadingRaw,
    isPending: squadsLoadingPending,
  } = useSquadsQuery()
  const squadsLoading = squadsLoadingRaw || squadsLoadingPending
  const { data: queryRawSessions, isLoading: sessionsQueryLoading } = useUpcomingSessionsQuery(
    user?.id
  )
  // Prefer query data when it has actual results, otherwise use loader data.
  // querySquads can be undefined (not yet fetched) or [] (fetched but empty due to auth race).
  // Only override loaderData when querySquads has real data (length > 0).
  const squads = querySquads && querySquads.length > 0 ? querySquads : loaderSquads
  const rawSessions =
    queryRawSessions && queryRawSessions.length > 0 ? queryRawSessions : loaderSessions
  const rsvpMutation = useRsvpMutation()
  const { data: friendsPlaying = [], isLoading: friendsLoading } = useFriendsPlayingQuery(user?.id)
  const { data: aiCoachTip, isLoading: aiCoachLoading } = useAICoachQueryDeferred(user?.id, 'home')
  const openCreateSessionModal = useCreateSessionModal((state) => state.open)

  const { active: showConfetti, fire: fireConfetti } = useConfetti(4000)
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
  }, [profile?.username, user?.user_metadata?.username])

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
    // Semaine commence le lundi (convention FR) : getDay() retourne 0=dim, 1=lun...
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startOfWeek.setDate(now.getDate() - diffToMonday)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    return rawSessions.filter((s) => {
      const date = new Date(s.scheduled_at)
      return s.status !== 'cancelled' && date >= startOfWeek && date < endOfWeek
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

  const handleRsvp = useCallback(
    async (sessionId: string, response: 'present' | 'absent' | 'maybe') => {
      haptic.medium()
      try {
        await rsvpMutation.mutateAsync({ sessionId, response })
        if (response === 'present') {
          haptic.success()
          fireConfetti()
          setSuccessMessage("Confirmé ! Ta squad sait qu'elle peut compter sur toi 🔥")
          rsvpTimers.current.push(setTimeout(() => setSuccessMessage(null), 5000))
        } else {
          setSuccessMessage(response === 'absent' ? 'Absence enregistrée' : 'Réponse enregistrée')
          rsvpTimers.current.push(setTimeout(() => setSuccessMessage(null), 3000))
        }
      } catch (error) {
        haptic.error()
        if (!import.meta.env.PROD) console.error('RSVP error:', error)
        setSuccessMessage("Erreur : ta réponse n'a pas pu être enregistrée")
        rsvpTimers.current.push(setTimeout(() => setSuccessMessage(null), 4000))
      }
    },
    [rsvpMutation, fireConfetti]
  )

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

  // New player with no sessions → effective score is 0 regardless of DB value
  const totalSessions = profile?.total_sessions || 0
  const reliabilityScore = totalSessions === 0 ? 0 : (profile?.reliability_score ?? 0)
  const pendingRsvps = upcomingSessions.filter((s) => !s.my_rsvp).length

  // R16 — Contextual nudge (1 at a time, priority order)
  const homeNudge = useMemo(() => {
    if (squads.length === 0) return null
    if (pendingRsvps > 0)
      return {
        icon: '⚡',
        text: `${pendingRsvps} session${pendingRsvps > 1 ? 's' : ''} attend${pendingRsvps > 1 ? 'ent' : ''} ta réponse. Ta squad t'attend — réponds en 2 secondes.`,
        cta: 'Répondre maintenant',
        action: () => navigate(`/session/${upcomingSessions.find((s) => !s.my_rsvp)?.id}`),
        color: 'warning' as const,
      }
    if (sessionsThisWeek === 0)
      return {
        icon: '📅',
        text: "Pas encore de session cette semaine — crée la première et ta squad sera prévenue.",
        cta: 'Créer une session',
        action: openCreateSessionModal,
        color: 'primary' as const,
      }
    if (reliabilityScore > 0 && reliabilityScore < 70)
      return {
        icon: '📉',
        text: `Ton score est à ${reliabilityScore}%. Confirme ta prochaine session pour le remonter.`,
        cta: 'Voir les sessions',
        action: () => navigate('/sessions'),
        color: 'error' as const,
      }
    if (
      profile?.created_at &&
      Date.now() - new Date(profile.created_at).getTime() < 3 * 24 * 60 * 60 * 1000 &&
      squads.length === 1
    )
      return {
        icon: '👋',
        text: `Bienvenue dans ${squads[0].name} ! Invite tes potes pour compléter ta squad.`,
        cta: 'Inviter',
        action: () => navigate(`/squad/${squads[0].id}`),
        color: 'success' as const,
      }
    return null
  }, [squads, pendingRsvps, sessionsThisWeek, reliabilityScore, profile?.created_at, upcomingSessions, navigate, openCreateSessionModal])

  const activeParty =
    isInVoiceChat && currentChannel && remoteUsers.length > 0
      ? {
          squadName: squads.find((s) => currentChannel.includes(s.id))?.name || 'Ta squad',
          participantCount: remoteUsers.length + 1,
        }
      : null

  return (
    <main className="min-h-0 bg-bg-base mesh-bg pb-6 page-enter" aria-label="Accueil">
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={150}
          gravity={0.3}
          colors={['#34d399', '#8B5CF6', '#fbbf24', '#a78bfa', '#f7f8f8']}
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
          <div className="space-y-6">
            <m.header
              className="mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-lg md:text-xl font-bold text-text-primary mb-1">
                {greeting}
                {profile?.username
                  ? ` ${profile.username.length > 15 ? profile.username.slice(0, 15) + '…' : profile.username}`
                  : ''}{' '}
                !
              </h1>
              <p className="text-sm text-text-tertiary">
                {upcomingSessions.length > 0
                  ? pendingRsvps > 0
                    ? `${pendingRsvps} session${pendingRsvps > 1 ? 's' : ''} sans ta réponse — ta squad t'attend, réponds en 2 secondes`
                    : "T'es carré, toutes tes sessions sont confirmées 🔥"
                  : "Tes potes ont voté pour la prochaine session. Ton avis compte !"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <PlanBadge tier={tier} size="sm" />
                <ReliabilityBadge score={reliabilityScore} />
              </div>
            </m.header>

            {/* R16 — Contextual nudge */}
            {homeNudge && (
              <m.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  homeNudge.color === 'warning'
                    ? 'bg-warning/[0.06] border-warning/15'
                    : homeNudge.color === 'error'
                      ? 'bg-error/[0.06] border-error/15'
                      : homeNudge.color === 'success'
                        ? 'bg-success/[0.06] border-success/15'
                        : 'bg-primary/[0.06] border-primary/15'
                }`}
              >
                <span className="text-xl flex-shrink-0">{homeNudge.icon}</span>
                <p className="text-sm text-text-secondary flex-1">{homeNudge.text}</p>
                <button
                  onClick={() => homeNudge.action()}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                    homeNudge.color === 'warning'
                      ? 'bg-warning/15 text-warning hover:bg-warning/25'
                      : homeNudge.color === 'error'
                        ? 'bg-error/15 text-error hover:bg-error/25'
                        : homeNudge.color === 'success'
                          ? 'bg-success/15 text-success hover:bg-success/25'
                          : 'bg-primary/15 text-primary hover:bg-primary/25'
                  }`}
                >
                  {homeNudge.cta}
                </button>
              </m.div>
            )}

            {!squadsLoading &&
              !sessionsLoading &&
              (squads.length === 0 || upcomingSessions.length === 0) &&
              profile?.created_at &&
              Date.now() - new Date(profile.created_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
                <OnboardingChecklist
                  hasSquad={squads.length > 0}
                  hasSession={upcomingSessions.length > 0}
                  onCreateSession={openCreateSessionModal}
                  userId={user?.id}
                  hasAvatar={!!profile?.avatar_url}
                  hasCheckedIn={(profile?.total_sessions ?? 0) > 0}
                />
              )}

            <div className="section-divider" />
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

            <div className="section-divider" />
            {/* PHASE 5: Weekly Leaderboard with gamification stats */}
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Suspense fallback={null}>
                <WeeklyLeaderboard />
              </Suspense>
            </m.div>

            <div className="section-divider" />
            <m.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
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
            <div className="section-divider" />
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
            <div className="section-divider" />
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
            <div className="section-divider" />
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <HomeActivityFeed squadIds={(squads || []).map((s) => s.id)} />
            </m.div>
            <div className="section-divider" />
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
    </main>
  )
}
