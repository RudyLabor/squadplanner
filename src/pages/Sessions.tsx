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

  // Loading state
  if (!isInitialized || (squadsLoading && squads.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-0 bg-bg-base pb-6">
      {/* Confetti celebration */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={80}
          gravity={0.25}
          colors={['#6366f1', '#34d399', '#fbbf24', '#a78bfa']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          {/* Header with guidance */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Tes prochaines sessions</h1>
            <p className="text-[14px] text-text-secondary">
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
              <Card className="p-4 bg-gradient-to-r from-success-5 to-transparent border-success">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-success">
                      🎯 T'es à jour !
                    </h3>
                    <p className="text-[12px] text-text-secondary">
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
              <div className="p-4 rounded-xl bg-warning-5 border border-warning">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 3, repeatDelay: 2 }}
                  >
                    <PartyPopper className="w-5 h-5 text-warning" />
                  </motion.div>
                  <h2 className="text-[15px] font-semibold text-text-primary">
                    Ta squad t'attend ! {needsResponse.length} session{needsResponse.length > 1 ? 's' : ''} à confirmer
                  </h2>
                </div>
                <p className="text-[13px] text-text-secondary mb-3">
                  👉 <span className="text-text-primary">Réponds maintenant</span> pour que ta squad puisse s'organiser.
                  Plus tu réponds vite, plus ton score de fiabilité augmente !
                </p>
                <div className="space-y-2">
                  {needsResponse.slice(0, 3).map(session => (
                    <Link key={session.id} to={`/session/${session.id}`}>
                      <motion.div 
                        className="flex items-center gap-3 p-3 rounded-lg bg-black/30 hover:bg-border-subtle"
                        whileHover={{ x: 4 }}
                      >
                        <Calendar className="w-4 h-4 text-warning" />
                        <span className="flex-1 text-[14px] text-text-primary">
                          {session.title || session.game || 'Session'}
                        </span>
                        <span className="text-[12px] text-text-secondary">{formatDate(session.scheduled_at)}</span>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
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
              <Card className="p-4 border-purple bg-purple-10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-purple" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-text-primary mb-2">
                      💡 Meilleurs créneaux suggérés
                    </h3>
                    <div className="space-y-2">
                      {slotSuggestions.slice(0, 3).map((slot, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                          <span className="text-[13px] text-text-secondary">
                            {dayNames[slot.day_of_week]} {slot.hour}h
                          </span>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-success" />
                            <span className="text-[12px] font-medium text-success">
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
              <Card className="p-4 border-warning bg-warning-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning-10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-text-primary mb-1">
                      🎯 Conseil Coach
                    </h3>
                    <p className="text-[13px] text-text-secondary">
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
              <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-[0.05em]">
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
                    <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.99 }}>
                      <Card className="p-4 transition-interactive hover:shadow-glow-success">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-success-10 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-success" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[15px] font-medium text-text-primary">
                              {session.title || session.game || 'Session'}
                            </h3>
                            <div className="flex items-center gap-3 text-[13px] text-text-secondary">
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-text-tertiary" strokeWidth={1} />
                  </motion.div>
                  <h3 className="text-[16px] font-semibold text-text-primary mb-2">
                    Aucune session confirmée
                  </h3>
                  <p className="text-[14px] text-text-secondary mb-4">
                    Réponds "Présent" à une session pour la voir ici.
                  </p>
                  <Link to="/squads">
                    <Button variant="secondary" size="sm">
                      <Plus className="w-4 h-4" />
                      Voir mes squads
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            )}
          </div>

          {/* How it works - User guidance */}
          <div>
            <Card className="p-6">
              <h3 className="text-[14px] font-semibold text-text-primary mb-4">
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
                    <div className="w-6 h-6 rounded-lg bg-primary-10 flex items-center justify-center">
                      <span className="text-[12px] font-bold text-primary">{step.num}</span>
                    </div>
                    <span className="text-[13px] text-text-secondary">{step.text}</span>
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
