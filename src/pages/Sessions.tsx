import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Plus, Clock, Users, ChevronRight, Sparkles, TrendingUp, CheckCircle2, PartyPopper, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Button, Card, Badge, SessionCardSkeleton } from '../components/ui'
import { useAuthStore, useSquadsStore, useSessionsStore, useAIStore } from '../hooks'

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export function Sessions() {
  const { user, isInitialized } = useAuthStore()
  const { squads, fetchSquads, isLoading: squadsLoading } = useSquadsStore()
  const { sessions, fetchSessions, isLoading: sessionsLoading } = useSessionsStore()
  const { slotSuggestions, coachTips, fetchSlotSuggestions, fetchCoachTips } = useAIStore()

  const [showConfetti, setShowConfetti] = useState(false)
  const hasShownCelebration = useRef(false)

  useEffect(() => {
    if (user) {
      fetchSquads()
    }
  }, [user, fetchSquads])

  // Fetch sessions for all squads and AI suggestions
  useEffect(() => {
    squads.forEach(squad => {
      fetchSessions(squad.id)
      fetchSlotSuggestions(squad.id)
      fetchCoachTips(squad.id)
    })
  }, [squads, fetchSessions, fetchSlotSuggestions, fetchCoachTips])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const upcomingSessions = sessions
    .filter(s => new Date(s.scheduled_at) > new Date() && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  const needsResponse = upcomingSessions.filter(s => !s.my_rsvp)
  const confirmed = upcomingSessions.filter(s => s.my_rsvp === 'present')

  // 🎉 Celebration when user has responded to all sessions
  useEffect(() => {
    if (needsResponse.length === 0 && confirmed.length > 0 && !hasShownCelebration.current && sessions.length > 0) {
      hasShownCelebration.current = true
      // Defer state updates to avoid cascading renders
      queueMicrotask(() => {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3500)
      })
    }
  }, [needsResponse.length, confirmed.length, sessions.length])

  return (
    <div className="min-h-screen bg-[#08090a] pb-8">
      {/* Confetti celebration */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={80}
          gravity={0.25}
          colors={['#5e6dd2', '#4ade80', '#f5a623', '#8b93ff']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          {/* Header with guidance */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#f7f8f8] mb-2">Tes prochaines parties</h1>
            <p className="text-[14px] text-[#8b8d90]">
              {needsResponse.length > 0
                ? `${needsResponse.length} session${needsResponse.length > 1 ? 's' : ''} en attente de ta réponse`
                : confirmed.length > 0
                  ? `${confirmed.length} session${confirmed.length > 1 ? 's' : ''} confirmée${confirmed.length > 1 ? 's' : ''} — ta squad compte sur toi !`
                  : 'Aucune session planifiée pour le moment'
              }
            </p>
          </div>

          {/* Success state - All caught up */}
          {needsResponse.length === 0 && confirmed.length > 0 && (
            <div className="mb-6">
              <Card className="p-4 bg-gradient-to-r from-[rgba(74,222,128,0.1)] to-transparent border-[rgba(74,222,128,0.3)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(74,222,128,0.2)] flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[#4ade80]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#4ade80]">
                      🎯 T'es à jour !
                    </h3>
                    <p className="text-[12px] text-[#8b8d90]">
                      Ta squad sait qu'elle peut compter sur toi
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Action required - User guidance */}
          {needsResponse.length > 0 && (
            <div className="mb-6">
              <div className="p-4 rounded-xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)]">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <PartyPopper className="w-5 h-5 text-[#f5a623]" />
                  </motion.div>
                  <h2 className="text-[15px] font-semibold text-[#f7f8f8]">
                    Ta squad t'attend ! {needsResponse.length} session{needsResponse.length > 1 ? 's' : ''} à confirmer
                  </h2>
                </div>
                <p className="text-[13px] text-[#8b8d90] mb-3">
                  👉 <span className="text-[#f7f8f8]">Réponds maintenant</span> pour que ta squad puisse s'organiser.
                  Plus tu réponds vite, plus ton score de fiabilité augmente !
                </p>
                <div className="space-y-2">
                  {needsResponse.slice(0, 3).map(session => (
                    <Link key={session.id} to={`/session/${session.id}`}>
                      <motion.div 
                        className="flex items-center gap-3 p-3 rounded-lg bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(255,255,255,0.05)]"
                        whileHover={{ x: 4 }}
                      >
                        <Calendar className="w-4 h-4 text-[#f5a623]" />
                        <span className="flex-1 text-[14px] text-[#f7f8f8]">
                          {session.title || session.game || 'Session'}
                        </span>
                        <span className="text-[12px] text-[#8b8d90]">{formatDate(session.scheduled_at)}</span>
                        <ChevronRight className="w-4 h-4 text-[#5e6063]" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Slot Suggestions */}
          {slotSuggestions.length > 0 && (
            <div className="mb-6">
              <Card className="p-4 border-[rgba(139,147,255,0.2)] bg-[rgba(139,147,255,0.05)]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(139,147,255,0.15)] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#8b93ff]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-[#f7f8f8] mb-2">
                      💡 Meilleurs créneaux suggérés
                    </h3>
                    <div className="space-y-2">
                      {slotSuggestions.slice(0, 3).map((slot, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
                          <span className="text-[13px] text-[#c9cace]">
                            {dayNames[slot.day_of_week]} {slot.hour}h
                          </span>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-[#4ade80]" />
                            <span className="text-[12px] font-medium text-[#4ade80]">
                              {slot.reliability_score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Coach Tips */}
          {coachTips.length > 0 && (
            <div className="mb-6">
              <Card className="p-4 border-[rgba(245,166,35,0.2)] bg-[rgba(245,166,35,0.05)]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(245,166,35,0.15)] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#f5a623]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#f7f8f8] mb-1">
                      🎯 Conseil Coach
                    </h3>
                    <p className="text-[13px] text-[#8b8d90]">
                      {coachTips[0].content}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Upcoming confirmed */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em]">
                Mes sessions confirmées
              </h2>
              {!sessionsLoading && <Badge variant="success">{confirmed.length}</Badge>}
            </div>

            {sessionsLoading ? (
              <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                <SessionCardSkeleton />
                <SessionCardSkeleton />
                <SessionCardSkeleton />
              </div>
            ) : confirmed.length > 0 ? (
              <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                {confirmed.map(session => (
                  <Link key={session.id} to={`/session/${session.id}`}>
                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
                      <Card className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[rgba(74,222,128,0.15)] flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-[#4ade80]" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[15px] font-medium text-[#f7f8f8]">
                              {session.title || session.game || 'Session'}
                            </h3>
                            <div className="flex items-center gap-3 text-[13px] text-[#8b8d90]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(session.scheduled_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {session.rsvp_counts?.present || 0} présents
                              </span>
                            </div>
                          </div>
                          <Badge variant="success">Confirmé</Badge>
                        </div>
                      </Card>
                    </motion.div>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-[#5e6063]" strokeWidth={1} />
                <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-2">
                  Aucune session confirmée
                </h3>
                <p className="text-[14px] text-[#8b8d90] mb-4">
                  Réponds "Présent" à une session pour la voir ici.
                </p>
                <Link to="/squads">
                  <Button variant="secondary" size="sm">
                    <Plus className="w-4 h-4" />
                    Voir mes squads
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* How it works - User guidance */}
          <div>
            <Card className="p-6">
              <h3 className="text-[14px] font-semibold text-[#f7f8f8] mb-4">
                📖 Comment fonctionnent les sessions ?
              </h3>
              <div className="space-y-3">
                {[
                  { num: '1', text: 'Un membre de ta squad propose un créneau' },
                  { num: '2', text: 'Tu cliques "Présent", "Absent" ou "Peut-être"' },
                  { num: '3', text: 'À l\'heure, tu fais ton check-in' },
                  { num: '4', text: 'Ton score de fiabilité augmente !' },
                ].map(step => (
                  <div key={step.num} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
                      <span className="text-[12px] font-bold text-[#5e6dd2]">{step.num}</span>
                    </div>
                    <span className="text-[13px] text-[#8b8d90]">{step.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
