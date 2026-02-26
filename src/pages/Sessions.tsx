import { useEffect, useState, useRef, useCallback } from 'react'
import { Plus, Loader2 } from '../components/icons'
import Confetti from '../components/LazyConfetti'
import { Button } from '../components/ui'
import { PullToRefresh } from '../components/PullToRefresh'
import { useAuthStore, useAIStore, useConfetti } from '../hooks'
import { useSquadsQuery } from '../hooks/queries/useSquadsQuery'
import { useUpcomingSessionsQuery } from '../hooks/queries/useSessionsQuery'
import { queryClient } from '../lib/queryClient'
import { useCreateSessionModal } from '../components/CreateSessionModal'
import { NeedsResponseSection, AllCaughtUp } from './sessions/NeedsResponseSection'
import { AISlotSuggestions, CoachTipsSection } from './sessions/AISuggestions'
import { ConfirmedSessions, HowItWorksSection } from './sessions/ConfirmedSessions'
import { WeekCalendar } from './sessions/WeekCalendar'
import type { SquadWithMembers } from '../hooks/queries/useSquadsQuery'
import type { SessionWithDetails } from '../hooks/queries/useSessionFetchers'

interface SessionsProps {
  loaderData?: {
    squads: SquadWithMembers[]
    sessions: SessionWithDetails[]
  }
}

export function Sessions({ loaderData: _loaderData }: SessionsProps) {
  const { user, isInitialized } = useAuthStore()
  const {
    data: squads = [],
    isLoading: squadsLoadingRaw,
    isPending: squadsLoadingPending,
  } = useSquadsQuery()
  const squadsLoading = squadsLoadingRaw || squadsLoadingPending
  const { data: sessions = [], isLoading: sessionsLoading } = useUpcomingSessionsQuery(user?.id)
  const { slotSuggestions, hasSlotHistory, coachTips, fetchSlotSuggestions, fetchCoachTips } =
    useAIStore()
  const openCreateSession = useCreateSessionModal((s) => s.open)

  const { active: showConfetti, fire: fireConfetti } = useConfetti()

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['squads'] }),
      queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    ])
  }, [])
  const [weekOffset, setWeekOffset] = useState(0)
  const hasShownCelebration = useRef(false)
  const aiFetchedRef = useRef<Set<string>>(new Set())

  // Stable dep: stringified squad IDs (the squads array changes reference every render)
  const squadIds = squads
    .map((s) => s.id)
    .sort()
    .join(',')

  useEffect(() => {
    if (!squadIds || !isInitialized) return
    squads.forEach((squad) => {
      // Only fetch once per squad — prevents infinite re-fetch loop
      if (aiFetchedRef.current.has(squad.id)) return
      aiFetchedRef.current.add(squad.id)
      fetchSlotSuggestions(squad.id)
      fetchCoachTips(squad.id)
    })
  }, [squadIds, isInitialized]) // eslint-disable-line react-hooks/exhaustive-deps

  const upcomingSessions = sessions
    .filter((s) => new Date(s.scheduled_at) > new Date() && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  const needsResponse = upcomingSessions.filter((s) => !s.my_rsvp)
  const confirmed = upcomingSessions.filter((s) => s.my_rsvp === 'present')

  useEffect(() => {
    if (
      needsResponse.length === 0 &&
      confirmed.length > 0 &&
      !hasShownCelebration.current &&
      sessions.length > 0
    ) {
      hasShownCelebration.current = true
      queueMicrotask(() => {
        fireConfetti()
      })
    }
  }, [needsResponse.length, confirmed.length, sessions.length])

  const hasData = squads.length > 0 || (!squadsLoading && !sessionsLoading)
  if (!hasData && squadsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <main className="min-h-0 bg-bg-base mesh-bg pb-6 page-enter" aria-label="Sessions">
        {showConfetti && typeof window !== 'undefined' && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={80}
            gravity={0.25}
            colors={['#8B5CF6', '#34d399', '#fbbf24', '#a78bfa']}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
          />
        )}

        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
          <div>
            <header className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-lg font-bold text-text-primary mb-1">
                  Tes prochaines sessions
                </h1>
                <p className="text-sm text-text-secondary">
                  {needsResponse.length > 0
                    ? `${needsResponse.length} session${needsResponse.length > 1 ? 's' : ''} en attente de ta réponse`
                    : confirmed.length > 0
                      ? `${confirmed.length} session${confirmed.length > 1 ? 's' : ''} confirmée${confirmed.length > 1 ? 's' : ''} — ta squad compte sur toi !`
                      : 'Aucune session planifiée pour le moment'}
                </p>
              </div>
              <Button size="sm" onClick={() => openCreateSession()}>
                <Plus className="w-4 h-4" />
                Créer
              </Button>
            </header>

            <WeekCalendar
              sessions={upcomingSessions}
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
            />
            <AllCaughtUp needsResponse={needsResponse.length} confirmed={confirmed.length} />
            <NeedsResponseSection needsResponse={needsResponse} />
            <AISlotSuggestions slotSuggestions={slotSuggestions} hasSlotHistory={hasSlotHistory} />
            <CoachTipsSection coachTips={coachTips} />
            <ConfirmedSessions confirmed={confirmed} sessionsLoading={sessionsLoading} />
            <HowItWorksSection />
          </div>
        </div>
      </main>
    </PullToRefresh>
  )
}
