import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Calendar, Clock, Users, Check, X, HelpCircle,
  CheckCircle2, AlertCircle, XCircle, Loader2, Gamepad2, Sparkles
} from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Button, Card, CardContent, Badge } from '../components/ui'
import { VoiceChat } from '../components/VoiceChat'
import { useAuthStore, useSessionsStore } from '../hooks'

// Toast component for celebrations
function CelebrationToast({ message, isVisible, onClose }: { message: string; isVisible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3500)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#34d399] text-[#050506] font-medium shadow-md">
            <Sparkles className="w-5 h-5" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

type RsvpResponse = 'present' | 'absent' | 'maybe'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [rsvpLoading, setRsvpLoading] = useState<RsvpResponse | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

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

    try {
      const { error } = await updateRsvp(id, response)
      setRsvpLoading(null)

      if (error) {
        setToastMessage('Erreur: ' + (error.message || 'Réponse non enregistrée'))
        setShowToast(true)
        return
      }

      // 🎉 Celebration when user confirms presence (only on success)
      if (response === 'present') {
        setShowConfetti(true)
        setToastMessage('✅ Ta squad sait qu\'elle peut compter sur toi !')
        setShowToast(true)
        setTimeout(() => setShowConfetti(false), 3500)
      }
    } catch {
      setRsvpLoading(null)
      setToastMessage('Erreur réseau, réessaie')
      setShowToast(true)
    }
  }

  const handleCheckin = async () => {
    if (!id) return
    setCheckinLoading(true)
    await checkin(id, 'present')
    setCheckinLoading(false)

    // 🎮 Big celebration for check-in
    setShowConfetti(true)
    setToastMessage('🎮 Check-in validé ! Bon game !')
    setShowToast(true)
    setTimeout(() => setShowConfetti(false), 4000)
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
      return { color: '#fb7185', label: 'Annulée', icon: XCircle }
    }
    if (currentSession.status === 'completed') {
      return { color: '#34d399', label: 'Terminée', icon: CheckCircle2 }
    }
    if (sessionDate < now) {
      return { color: '#8b8d90', label: 'Passée', icon: Clock }
    }
    if (currentSession.status === 'confirmed') {
      return { color: '#34d399', label: 'Confirmée', icon: CheckCircle2 }
    }
    return { color: '#fbbf24', label: 'En attente de confirmations', icon: AlertCircle }
  }

  if (!isInitialized) {
    return (
      <div className="min-h-0 bg-[#050506] flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
      </div>
    )
  }

  if (!currentSession) {
    return (
      <div className="min-h-0 bg-[#050506] flex items-center justify-center flex-col gap-4 py-12">
        <AlertCircle className="w-8 h-8 text-[#5e6063]" />
        <p className="text-[#8b8d90]">Session non trouvée</p>
        <Button variant="secondary" onClick={() => navigate('/home')}>
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  const dateInfo = formatDate(currentSession.scheduled_at)
  const statusInfo = getStatusInfo()
  const isCreator = currentSession.created_by === user?.id

  return (
    <div className="min-h-0 bg-[#050506] pb-6">
      {/* Confetti celebration */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={100}
          gravity={0.25}
          colors={['#6366f1', '#34d399', '#fbbf24', '#a78bfa', '#f7f8f8']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Toast notification */}
      <CelebrationToast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              to={`/squad/${currentSession.squad_id}`}
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors flex items-center justify-center touch-target"
              aria-label="Retour à la squad"
            >
              <ArrowLeft className="w-5 h-5 text-[#8b8d90]" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#f7f8f8]">
                {currentSession.title || currentSession.game || 'Session'}
              </h1>
              {statusInfo && (
                <div className="flex items-center gap-1.5 mt-1">
                  <statusInfo.icon className="w-4 h-4" style={{ color: statusInfo.color }} />
                  <span className="text-[13px]" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(251,191,36,0.075)] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#fbbf24]" />
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
          </div>

          {/* RSVP Counts */}
          <div className="mb-8">
            <h2 className="text-xs font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em] mb-4">
              Réponses
            </h2>
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              <Card className="p-4 lg:p-5 text-center">
                <Check className="w-5 h-5 mx-auto mb-2 text-[#34d399]" />
                <div className="text-xl lg:text-2xl font-bold text-[#f7f8f8]">{currentSession.rsvp_counts?.present || 0}</div>
                <div className="text-[12px] text-[#5e6063]">Présents</div>
              </Card>
              <Card className="p-4 lg:p-5 text-center">
                <HelpCircle className="w-5 h-5 mx-auto mb-2 text-[#fbbf24]" />
                <div className="text-xl lg:text-2xl font-bold text-[#f7f8f8]">{currentSession.rsvp_counts?.maybe || 0}</div>
                <div className="text-[12px] text-[#5e6063]">Peut-être</div>
              </Card>
              <Card className="p-4 lg:p-5 text-center">
                <X className="w-5 h-5 mx-auto mb-2 text-[#fb7185]" />
                <div className="text-xl lg:text-2xl font-bold text-[#f7f8f8]">{currentSession.rsvp_counts?.absent || 0}</div>
                <div className="text-[12px] text-[#5e6063]">Absents</div>
              </Card>
            </div>
          </div>

          {/* My RSVP */}
          {currentSession.status !== 'cancelled' && currentSession.status !== 'completed' && (
            <div className="mb-8">
              <h2 className="text-xs font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em] mb-4">
                Ta réponse
              </h2>
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                      <Button
                        variant={currentSession.my_rsvp === 'present' ? 'primary' : 'secondary'}
                        className={`w-full ${currentSession.my_rsvp === 'present' ? 'shadow-[0_0_10px_rgba(52,211,153,0.2)] ring-2 ring-[#34d399]/15' : ''}`}
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
                    </motion.div>
                    <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                      <Button
                        variant={currentSession.my_rsvp === 'maybe' ? 'primary' : 'secondary'}
                        className={`w-full ${currentSession.my_rsvp === 'maybe' ? 'shadow-[0_0_10px_rgba(251,191,36,0.2)] ring-2 ring-[#fbbf24]/15' : ''}`}
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
                    </motion.div>
                    <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                      <Button
                        variant={currentSession.my_rsvp === 'absent' ? 'danger' : 'secondary'}
                        className="w-full"
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
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Check-in */}
          {isSessionTime() && currentSession.my_rsvp === 'present' && !hasCheckedIn() && (
            <div className="mb-8">
              <Card className="p-6 text-center bg-gradient-to-b from-[rgba(52,211,153,0.075)] to-transparent border-[rgba(52,211,153,0.15)] relative overflow-hidden">
                {/* Pulsing background effect */}
                <motion.div
                  className="absolute inset-0 bg-[#34d399]/2.5"
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: 3 }}
                />
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: 3 }}
                  >
                    <Gamepad2 className="w-14 h-14 mx-auto mb-4 text-[#34d399]" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[#f7f8f8] mb-2">🎮 C'est l'heure du game !</h3>
                  <p className="text-[#8b8d90] mb-5">Ta squad t'attend. Confirme que t'es là !</p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleCheckin}
                      disabled={checkinLoading}
                      className="h-12 px-8 bg-[#34d399] hover:bg-[#34d399] text-[#050506] font-semibold shadow-[0_0_12px_rgba(52,211,153,0.2)]"
                    >
                      {checkinLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      Je suis là !
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </div>
          )}

          {hasCheckedIn() && (
            <div className="mb-8">
              <Card className="p-4 text-center bg-[rgba(52,211,153,0.05)] border-[rgba(52,211,153,0.1)]">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#34d399]" />
                <p className="text-[#34d399] font-medium">Check-in confirmé !</p>
              </Card>
            </div>
          )}

          {/* Voice Chat */}
          {currentSession.status === 'confirmed' && id && (
            <div className="mb-8">
              <h2 className="text-xs font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em] mb-4">
                Chat Vocal
              </h2>
              <VoiceChat
                sessionId={id}
                sessionTitle={currentSession.title || currentSession.game || 'Session'}
              />
            </div>
          )}

          {/* Participants */}
          <div className="mb-8">
            <h2 className="text-xs font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em] mb-4">
              Participants
            </h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                {currentSession.rsvps?.map((rsvp) => {
                  const hasCheckedin = currentSession.checkins?.some(c => c.user_id === rsvp.user_id)
                  return (
                    <div key={rsvp.user_id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgba(167,139,250,0.075)] flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#a78bfa]" />
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
          </div>

          {/* Creator Actions */}
          {isCreator && currentSession.status === 'proposed' && (
            <div className="space-y-3">
              <Button onClick={handleConfirm} className="w-full">
                <CheckCircle2 className="w-5 h-5" />
                Confirmer la session
              </Button>
              <Button variant="danger" onClick={handleCancel} className="w-full">
                <XCircle className="w-5 h-5" />
                Annuler la session
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
