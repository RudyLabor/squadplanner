import { useEffect, useState, useRef } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import Confetti from '../components/LazyConfetti'
import { Button } from '../components/ui'
import { useAuthStore, useSquadsStore, useSessionsStore, useAIStore } from '../hooks'
import { useCreateSessionModal } from '../components/CreateSessionModal'
import { NeedsResponseSection, AllCaughtUp } from './sessions/NeedsResponseSection'
import { AISlotSuggestions, CoachTipsSection } from './sessions/AISuggestions'
import { ConfirmedSessions, HowItWorksSection } from './sessions/ConfirmedSessions'

export function Sessions() {
  const { user, isInitialized } = useAuthStore()
  const { squads, fetchSquads, isLoading: squadsLoading } = useSquadsStore()
  const { sessions, fetchSessions, isLoading: sessionsLoading } = useSessionsStore()
  const { slotSuggestions, coachTips, fetchSlotSuggestions, fetchCoachTips } = useAIStore()
  const openCreateSession = useCreateSessionModal(s => s.open)

  const [showConfetti, setShowConfetti] = useState(false)
  const hasShownCelebration = useRef(false)

  useEffect(() => { if (user) fetchSquads() }, [user, fetchSquads])

  useEffect(() => {
    squads.forEach(squad => {
      fetchSessions(squad.id)
      fetchSlotSuggestions(squad.id)
      fetchCoachTips(squad.id)
    })
  }, [squads, fetchSessions, fetchSlotSuggestions, fetchCoachTips])

  const upcomingSessions = sessions
    .filter(s => new Date(s.scheduled_at) > new Date() && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  const needsResponse = upcomingSessions.filter(s => !s.my_rsvp)
  const confirmed = upcomingSessions.filter(s => s.my_rsvp === 'present')

  useEffect(() => {
    if (needsResponse.length === 0 && confirmed.length > 0 && !hasShownCelebration.current && sessions.length > 0) {
      hasShownCelebration.current = true
      queueMicrotask(() => {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3500)
      })
    }
  }, [needsResponse.length, confirmed.length, sessions.length])

  if (!isInitialized || (squadsLoading && squads.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Sessions">
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={80} gravity={0.25}
          colors={['#6366f1', '#34d399', '#fbbf24', '#a78bfa']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }} />
      )}

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-lg font-bold text-text-primary mb-1">Tes prochaines sessions</h1>
              <p className="text-sm text-text-secondary">
                {needsResponse.length > 0
                  ? `${needsResponse.length} session${needsResponse.length > 1 ? 's' : ''} en attente de ta réponse`
                  : confirmed.length > 0
                    ? `${confirmed.length} session${confirmed.length > 1 ? 's' : ''} confirmée${confirmed.length > 1 ? 's' : ''} — ta squad compte sur toi !`
                    : 'Aucune session planifiée pour le moment'}
              </p>
            </div>
            <Button size="sm" onClick={openCreateSession}>
              <Plus className="w-4 h-4" />Créer
            </Button>
          </header>

          <AllCaughtUp needsResponse={needsResponse.length} confirmed={confirmed.length} />
          <NeedsResponseSection needsResponse={needsResponse} />
          <AISlotSuggestions slotSuggestions={slotSuggestions} />
          <CoachTipsSection coachTips={coachTips} />
          <ConfirmedSessions confirmed={confirmed} sessionsLoading={sessionsLoading} />
          <HowItWorksSection />
        </div>
      </div>
    </main>
  )
}
