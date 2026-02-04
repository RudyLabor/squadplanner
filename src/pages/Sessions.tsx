import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Plus, Clock, Users, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card, Badge } from '../components/ui'
import { useAuthStore, useSquadsStore, useSessionsStore } from '../hooks'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

export function Sessions() {
  const { user } = useAuthStore()
  const { squads, fetchSquads } = useSquadsStore()
  const { sessions, fetchSessions } = useSessionsStore()

  useEffect(() => {
    if (user) {
      fetchSquads()
    }
  }, [user, fetchSquads])

  // Fetch sessions for all squads
  useEffect(() => {
    squads.forEach(squad => {
      fetchSessions(squad.id)
    })
  }, [squads, fetchSessions])

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

  return (
    <div className="min-h-screen bg-[#08090a] pb-8">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header with guidance */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-2xl font-bold text-[#f7f8f8] mb-2">Sessions</h1>
            <p className="text-[14px] text-[#8b8d90]">
              Tes sessions planifiées. Réponds aux invitations et confirme ta présence.
            </p>
          </motion.div>

          {/* Action required - User guidance */}
          {needsResponse.length > 0 && (
            <motion.div variants={itemVariants} className="mb-6">
              <div className="p-4 rounded-xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)]">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-[#f5a623]" />
                  <h2 className="text-[15px] font-semibold text-[#f7f8f8]">
                    Action requise : {needsResponse.length} session{needsResponse.length > 1 ? 's' : ''} en attente
                  </h2>
                </div>
                <p className="text-[13px] text-[#8b8d90] mb-3">
                  👉 <span className="text-[#f7f8f8]">Clique sur une session</span> pour dire si tu seras présent ou non.
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
            </motion.div>
          )}

          {/* AI Suggestion placeholder */}
          <motion.div variants={itemVariants} className="mb-6">
            <Card className="p-4 border-[rgba(139,147,255,0.2)] bg-[rgba(139,147,255,0.05)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(139,147,255,0.15)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#8b93ff]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#f7f8f8] mb-1">
                    💡 Suggestion IA
                  </h3>
                  <p className="text-[13px] text-[#8b8d90]">
                    Ta squad joue le mieux le <span className="text-[#f7f8f8] font-medium">jeudi à 21h</span>.
                    92% de présence historique. Propose un créneau !
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Upcoming confirmed */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em]">
                Mes sessions confirmées
              </h2>
              <Badge variant="success">{confirmed.length}</Badge>
            </div>

            {confirmed.length > 0 ? (
              <div className="space-y-3">
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
          </motion.div>

          {/* How it works - User guidance */}
          <motion.div variants={itemVariants}>
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
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
