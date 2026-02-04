import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Calendar, Clock, Users, Check, X, HelpCircle,
  CheckCircle2, AlertCircle, XCircle, Loader2, Gamepad2
} from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, Badge } from '../components/ui'
import { VoiceChat } from '../components/VoiceChat'
import { useAuthStore, useSessionsStore } from '../hooks'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

type RsvpResponse = 'present' | 'absent' | 'maybe'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [rsvpLoading, setRsvpLoading] = useState<RsvpResponse | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  
  const { user, isInitialized } = useAuthStore()
  const { currentSession, fetchSessionById, updateRsvp, checkin, cancelSession, confirmSession } = useSessionsStore()

  useEffect(() => {
    if (isInitialized && !user) {
      navigate('/auth')
    } else if (id && user) {
      fetchSessionById(id)
    }
  }, [id, user, isInitialized, navigate, fetchSessionById])

  const handleRsvp = async (response: RsvpResponse) => {
    if (!id) return
    setRsvpLoading(response)
    await updateRsvp(id, response)
    setRsvpLoading(null)
  }

  const handleCheckin = async () => {
    if (!id) return
    setCheckinLoading(true)
    await checkin(id, 'present')
    setCheckinLoading(false)
  }

  const handleCancel = async () => {
    if (!id) return
    if (!confirm('Annuler cette session ?')) return
    await cancelSession(id)
  }

  const handleConfirm = async () => {
    if (!id) return
    await confirmSession(id)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date),
      time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date),
    }
  }

  const isSessionTime = () => {
    if (!currentSession) return false
    const now = new Date()
    const sessionStart = new Date(currentSession.scheduled_at)
    const sessionEnd = new Date(sessionStart.getTime() + (currentSession.duration_minutes || 120) * 60000)
    return now >= sessionStart && now <= sessionEnd
  }

  const hasCheckedIn = () => {
    return currentSession?.checkins?.some(c => c.user_id === user?.id)
  }

  const getStatusInfo = () => {
    if (!currentSession) return null
    
    const now = new Date()
    const sessionDate = new Date(currentSession.scheduled_at)
    
    if (currentSession.status === 'cancelled') {
      return { color: '#f87171', label: 'Annulée', icon: XCircle }
    }
    if (currentSession.status === 'completed') {
      return { color: '#4ade80', label: 'Terminée', icon: CheckCircle2 }
    }
    if (sessionDate < now) {
      return { color: '#8b8d90', label: 'Passée', icon: Clock }
    }
    if (currentSession.status === 'confirmed') {
      return { color: '#4ade80', label: 'Confirmée', icon: CheckCircle2 }
    }
    return { color: '#f5a623', label: 'En attente de confirmations', icon: AlertCircle }
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
      </div>
    )
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
      </div>
    )
  }

  const dateInfo = formatDate(currentSession.scheduled_at)
  const statusInfo = getStatusInfo()
  const isCreator = currentSession.created_by === user?.id

  return (
    <div className="min-h-screen bg-[#08090a] pb-8">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
            <Link to={`/squad/${currentSession.squad_id}`} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#8b8d90]" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#f7f8f8]">
                {currentSession.title || currentSession.game || 'Session'}
              </h1>
              {statusInfo && (
                <div className="flex items-center gap-1.5 mt-1">
                  <statusInfo.icon className="w-4 h-4" style={{ color: statusInfo.color }} />
                  <span className="text-[13px]" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(245,166,35,0.15)] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#f5a623]" />
                </div>
                <div>
                  <div className="text-[15px] font-medium text-[#f7f8f8] capitalize">{dateInfo.day}</div>
                  <div className="text-[13px] text-[#8b8d90]">{dateInfo.time}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(96,165,250,0.15)] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#60a5fa]" />
                </div>
                <div>
                  <div className="text-[15px] font-medium text-[#f7f8f8]">{currentSession.duration_minutes} min</div>
                  <div className="text-[13px] text-[#8b8d90]">Durée</div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* RSVP Counts */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em] mb-4">
              Réponses
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 text-center">
                <Check className="w-5 h-5 mx-auto mb-2 text-[#4ade80]" />
                <div className="text-[20px] font-bold text-[#f7f8f8]">{currentSession.rsvp_counts?.present || 0}</div>
                <div className="text-[12px] text-[#5e6063]">Présents</div>
              </Card>
              <Card className="p-4 text-center">
                <HelpCircle className="w-5 h-5 mx-auto mb-2 text-[#f5a623]" />
                <div className="text-[20px] font-bold text-[#f7f8f8]">{currentSession.rsvp_counts?.maybe || 0}</div>
                <div className="text-[12px] text-[#5e6063]">Peut-être</div>
              </Card>
              <Card className="p-4 text-center">
                <X className="w-5 h-5 mx-auto mb-2 text-[#f87171]" />
                <div className="text-[20px] font-bold text-[#f7f8f8]">{currentSession.rsvp_counts?.absent || 0}</div>
                <div className="text-[12px] text-[#5e6063]">Absents</div>
              </Card>
            </div>
          </motion.div>

          {/* My RSVP */}
          {currentSession.status !== 'cancelled' && currentSession.status !== 'completed' && (
            <motion.div variants={itemVariants} className="mb-8">
              <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em] mb-4">
                Ta réponse
              </h2>
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Button
                      variant={currentSession.my_rsvp === 'present' ? 'primary' : 'secondary'}
                      className="flex-1"
                      onClick={() => handleRsvp('present')}
                      disabled={rsvpLoading !== null}
                    >
                      {rsvpLoading === 'present' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Présent
                    </Button>
                    <Button
                      variant={currentSession.my_rsvp === 'maybe' ? 'primary' : 'secondary'}
                      className="flex-1"
                      onClick={() => handleRsvp('maybe')}
                      disabled={rsvpLoading !== null}
                    >
                      {rsvpLoading === 'maybe' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <HelpCircle className="w-4 h-4" />
                      )}
                      Peut-être
                    </Button>
                    <Button
                      variant={currentSession.my_rsvp === 'absent' ? 'danger' : 'secondary'}
                      className="flex-1"
                      onClick={() => handleRsvp('absent')}
                      disabled={rsvpLoading !== null}
                    >
                      {rsvpLoading === 'absent' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Absent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Check-in */}
          {isSessionTime() && currentSession.my_rsvp === 'present' && !hasCheckedIn() && (
            <motion.div variants={itemVariants} className="mb-8">
              <Card className="p-6 text-center bg-gradient-to-b from-[rgba(74,222,128,0.1)] to-transparent border-[rgba(74,222,128,0.2)]">
                <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-[#4ade80]" />
                <h3 className="text-lg font-bold text-[#f7f8f8] mb-2">C'est l'heure !</h3>
                <p className="text-[#8b8d90] mb-4">Confirme ta présence pour cette session</p>
                <Button onClick={handleCheckin} disabled={checkinLoading}>
                  {checkinLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  Je suis là !
                </Button>
              </Card>
            </motion.div>
          )}

          {hasCheckedIn() && (
            <motion.div variants={itemVariants} className="mb-8">
              <Card className="p-4 text-center bg-[rgba(74,222,128,0.1)] border-[rgba(74,222,128,0.2)]">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#4ade80]" />
                <p className="text-[#4ade80] font-medium">Check-in confirmé !</p>
              </Card>
            </motion.div>
          )}

          {/* Voice Chat */}
          {currentSession.status === 'confirmed' && id && (
            <motion.div variants={itemVariants} className="mb-8">
              <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em] mb-4">
                Chat Vocal
              </h2>
              <VoiceChat
                sessionId={id}
                sessionTitle={currentSession.title || currentSession.game || 'Session'}
              />
            </motion.div>
          )}

          {/* Participants */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em] mb-4">
              Participants
            </h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                {currentSession.rsvps?.map((rsvp) => {
                  const hasCheckedin = currentSession.checkins?.some(c => c.user_id === rsvp.user_id)
                  return (
                    <div key={rsvp.user_id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgba(139,147,255,0.15)] flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#8b93ff]" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[15px] text-[#f7f8f8]">
                          {(rsvp as { profiles?: { username?: string } }).profiles?.username || 'Joueur'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasCheckedin && (
                          <Badge variant="success">Check-in ✓</Badge>
                        )}
                        <Badge 
                          variant={
                            rsvp.response === 'present' ? 'success' : 
                            rsvp.response === 'maybe' ? 'warning' : 'danger'
                          }
                        >
                          {rsvp.response === 'present' ? 'Présent' : 
                           rsvp.response === 'maybe' ? 'Peut-être' : 'Absent'}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
                {(!currentSession.rsvps || currentSession.rsvps.length === 0) && (
                  <p className="text-center text-[#8b8d90] py-4">Aucune réponse pour l'instant</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Creator Actions */}
          {isCreator && currentSession.status === 'proposed' && (
            <motion.div variants={itemVariants} className="space-y-3">
              <Button onClick={handleConfirm} className="w-full">
                <CheckCircle2 className="w-5 h-5" />
                Confirmer la session
              </Button>
              <Button variant="danger" onClick={handleCancel} className="w-full">
                <XCircle className="w-5 h-5" />
                Annuler la session
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
