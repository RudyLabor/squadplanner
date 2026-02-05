import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, TrendingUp, ChevronRight, Loader2, Mic, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CountUp from 'react-countup'
import { Card, Badge } from '../components/ui'
import { useAuthStore, useSquadsStore, useVoiceChatStore, useAIStore } from '../hooks'
import { theme } from '../lib/theme'
import { supabase } from '../lib/supabase'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

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

// Célébration fiabilité
function ReliabilityBadge({ score }: { score: number }) {
  if (score >= 95) {
    return (
      <motion.div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#4ade80]/20 to-[#22c55e]/10 border border-[#4ade80]/30"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        <Sparkles className="w-4 h-4 text-[#4ade80]" />
        <span className="text-[13px] font-medium text-[#4ade80]">100% fiable</span>
      </motion.div>
    )
  }
  if (score >= 80) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/20">
        <TrendingUp className="w-4 h-4 text-[#4ade80]" />
        <span className="text-[13px] font-medium text-[#4ade80]">{score}% fiable</span>
      </div>
    )
  }
  if (score >= 60) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20">
        <TrendingUp className="w-4 h-4 text-[#f5a623]" />
        <span className="text-[13px] font-medium text-[#f5a623]">{score}%</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20">
      <AlertCircle className="w-4 h-4 text-[#ef4444]" />
      <span className="text-[13px] font-medium text-[#ef4444]">{score}%</span>
    </div>
  )
}

// Prochaine session card
function NextSessionCard({ session }: { session: UpcomingSession }) {
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
  const isConfirmed = session.my_rsvp === 'present'

  return (
    <Link to={`/squad/${session.squad_id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
      >
        <Card className="p-4 border-l-4 border-l-[#5e6dd2]">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[15px] font-semibold text-[#f7f8f8]">
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

          {hasResponded ? (
            <div className={`flex items-center gap-2 text-[13px] ${isConfirmed ? 'text-[#4ade80]' : 'text-[#8b8d90]'}`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>{isConfirmed ? 'Tu as confirmé ta présence' : session.my_rsvp === 'absent' ? 'Tu as décliné' : 'Tu as répondu peut-être'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-[#f5a623]">
              <Clock className="w-4 h-4" />
              <span>Tu n'as pas encore répondu</span>
            </div>
          )}
        </Card>
      </motion.div>
    </Link>
  )
}

// Party en cours card
function ActivePartyCard({ squadName, participantCount }: { squadName: string; participantCount: number }) {
  return (
    <Link to="/party">
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
      >
        <Card className="p-4 bg-gradient-to-r from-[#5e6dd2]/10 to-transparent border-[#5e6dd2]/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#5e6dd2]/20 flex items-center justify-center">
              <Mic className="w-6 h-6 text-[#5e6dd2]" />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-[#f7f8f8]">
                {participantCount} {participantCount > 1 ? 'potes' : 'pote'} dans {squadName}
              </div>
              <div className="text-[13px] text-[#8b8d90]">Party vocale en cours</div>
            </div>
            <motion.div
              className="px-4 py-2 rounded-lg bg-[#5e6dd2] text-white text-[14px] font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Rejoindre
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </Link>
  )
}

// Stats compactes
function StatsRow({ squadsCount, sessionsThisWeek, reliabilityScore }: {
  squadsCount: number
  sessionsThisWeek: number
  reliabilityScore: number
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="p-3 text-center">
        <div className="text-[18px] font-semibold text-[#f7f8f8]">
          <CountUp end={squadsCount} duration={1.5} />
        </div>
        <div className="text-[11px] text-[#5e6063] uppercase tracking-wide">Squads</div>
      </Card>
      <Card className="p-3 text-center">
        <div className="text-[18px] font-semibold text-[#f7f8f8]">
          <CountUp end={sessionsThisWeek} duration={1.5} />
        </div>
        <div className="text-[11px] text-[#5e6063] uppercase tracking-wide">Cette semaine</div>
      </Card>
      <Card className="p-3 text-center">
        <div className="text-[18px] font-semibold text-[#4ade80]">
          <CountUp end={reliabilityScore} duration={1.5} suffix="%" />
        </div>
        <div className="text-[11px] text-[#5e6063] uppercase tracking-wide">Fiabilité</div>
      </Card>
    </div>
  )
}

export default function Home() {
  const { user, profile, isInitialized } = useAuthStore()
  const { squads, fetchSquads } = useSquadsStore()
  const { isConnected: isInVoiceChat, currentChannel, remoteUsers } = useVoiceChatStore()
  const { aiCoachTip, aiCoachTipLoading, fetchAICoachTip } = useAIStore()
  const navigate = useNavigate()

  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0)

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
        return
      }

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
      }
    }

    fetchUpcomingSessions()
  }, [user, squads])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
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

  return (
    <div className="min-h-screen bg-[#08090a] pb-24">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header avec célébration */}
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[22px] font-bold text-[#f7f8f8]">
                Salut {profile?.username || 'Gamer'} !
              </h1>
              {upcomingSessions.length > 0 ? (
                <p className="text-[14px] text-[#8b8d90]">
                  {upcomingSessions.filter(s => !s.my_rsvp).length > 0
                    ? `${upcomingSessions.filter(s => !s.my_rsvp).length} session(s) en attente de réponse`
                    : 'Toutes tes sessions sont confirmées'
                  }
                </p>
              ) : (
                <p className="text-[14px] text-[#8b8d90]">Prêt à organiser une session ?</p>
              )}
            </div>
            <ReliabilityBadge score={reliabilityScore} />
          </motion.div>

          {/* AI Coach Tip - Contextuel */}
          {aiCoachTip && (
            <motion.div variants={itemVariants} className="mb-6">
              <Card className={`p-3 flex items-center gap-3 border ${
                aiCoachTip.tone === 'celebration'
                  ? 'bg-gradient-to-r from-[#4ade80]/10 to-transparent border-[#4ade80]/20'
                  : aiCoachTip.tone === 'warning'
                    ? 'bg-gradient-to-r from-[#f87171]/10 to-transparent border-[#f87171]/20'
                    : 'bg-gradient-to-r from-[#5e6dd2]/10 to-transparent border-[#5e6dd2]/20'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  aiCoachTip.tone === 'celebration'
                    ? 'bg-[#4ade80]/15'
                    : aiCoachTip.tone === 'warning'
                      ? 'bg-[#f87171]/15'
                      : 'bg-[#5e6dd2]/15'
                }`}>
                  {aiCoachTipLoading ? (
                    <Loader2 className="w-4 h-4 text-[#5e6dd2] animate-spin" />
                  ) : (
                    <Sparkles className={`w-4 h-4 ${
                      aiCoachTip.tone === 'celebration'
                        ? 'text-[#4ade80]'
                        : aiCoachTip.tone === 'warning'
                          ? 'text-[#f87171]'
                          : 'text-[#5e6dd2]'
                    }`} />
                  )}
                </div>
                <p className={`text-[13px] leading-relaxed flex-1 ${
                  aiCoachTip.tone === 'celebration'
                    ? 'text-[#4ade80]'
                    : aiCoachTip.tone === 'warning'
                      ? 'text-[#f87171]'
                      : 'text-[#8b8d90]'
                }`}>
                  {aiCoachTip.tip}
                </p>
              </Card>
            </motion.div>
          )}

          {/* Party en cours */}
          {activeParty && (
            <motion.div variants={itemVariants} className="mb-6">
              <ActivePartyCard
                squadName={activeParty.squadName}
                participantCount={activeParty.participantCount}
              />
            </motion.div>
          )}

          {/* Prochaine session */}
          {nextSession && (
            <motion.div variants={itemVariants} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
                  Prochaine session
                </h2>
                {upcomingSessions.length > 1 && (
                  <Link to="/squads" className="text-[12px] text-[#5e6dd2] font-medium">
                    Voir tout ({upcomingSessions.length})
                  </Link>
                )}
              </div>
              <NextSessionCard session={nextSession} />
            </motion.div>
          )}

          {/* Stats */}
          <motion.div variants={itemVariants} className="mb-6">
            <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide mb-3">
              Tes stats
            </h2>
            <StatsRow
              squadsCount={squads.length}
              sessionsThisWeek={sessionsThisWeek}
              reliabilityScore={reliabilityScore}
            />
          </motion.div>

          {/* Mes squads */}
          {squads.length > 0 ? (
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
                  Mes squads
                </h2>
                <Link to="/squads">
                  <motion.button
                    className="text-[12px] text-[#5e6dd2] font-medium flex items-center gap-1"
                    whileHover={{ x: 2 }}
                  >
                    Gérer
                    <ChevronRight className="w-3.5 h-3.5" />
                  </motion.button>
                </Link>
              </div>
              <div className="space-y-2">
                {squads.slice(0, 3).map((squad) => (
                  <Link key={squad.id} to={`/squad/${squad.id}`}>
                    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
                      <Card className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#5e6dd2]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-medium text-[#f7f8f8] truncate">{squad.name}</div>
                            <div className="text-[12px] text-[#8b8d90]">{squad.game}</div>
                          </div>
                          <div className="text-[12px] text-[#5e6063]">
                            {squad.member_count || squad.total_members || 1} membres
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#5e6063]" />
                        </div>
                      </Card>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ) : (
            /* État vide - Pas de squad */
            <motion.div variants={itemVariants}>
              <Card className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#1f2023] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-[#5e6063]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-2">
                  Prêt à jouer ?
                </h3>
                <p className="text-[14px] text-[#8b8d90] mb-6 max-w-[250px] mx-auto">
                  Crée ta squad ou rejoins-en une pour commencer à planifier des sessions.
                </p>
                <Link to="/squads">
                  <motion.button
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#5e6dd2] text-white text-[14px] font-semibold"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Commencer
                  </motion.button>
                </Link>
              </Card>
            </motion.div>
          )}

          {/* CTA Party flottant si pas de session prochaine et a des squads */}
          {!nextSession && squads.length > 0 && !activeParty && (
            <motion.div
              variants={itemVariants}
              className="mt-6"
            >
              <Link to="/party">
                <Card className="p-4 bg-gradient-to-r from-[#5e6dd2]/5 to-transparent border-dashed border-[#5e6dd2]/30 hover:border-[#5e6dd2]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#5e6dd2]/10 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-[#5e6dd2]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-medium text-[#f7f8f8]">Envie de parler ?</div>
                      <div className="text-[12px] text-[#8b8d90]">Lance une party vocale avec ta squad</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#5e6063]" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
