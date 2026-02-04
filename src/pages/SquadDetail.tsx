import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Users, Calendar, Plus, Copy, Check, 
  Gamepad2, Clock, Trash2, LogOut, Loader2, ChevronRight 
} from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, Badge, Input } from '../components/ui'
import { useAuthStore, useSquadsStore, useSessionsStore } from '../hooks'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

export default function SquadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [sessionTime, setSessionTime] = useState('')
  const [sessionDuration, setSessionDuration] = useState('120')
  const [copiedCode, setCopiedCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user, isInitialized } = useAuthStore()
  const { currentSquad, fetchSquadById, leaveSquad, deleteSquad, isLoading } = useSquadsStore()
  const { sessions, fetchSessions, createSession, isLoading: sessionsLoading } = useSessionsStore()

  useEffect(() => {
    if (isInitialized && !user) {
      navigate('/auth')
    } else if (id && user) {
      fetchSquadById(id)
      fetchSessions(id)
    }
  }, [id, user, isInitialized, navigate, fetchSquadById, fetchSessions])

  const handleCopyCode = async () => {
    if (!currentSquad) return
    await navigator.clipboard.writeText(currentSquad.invite_code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!sessionDate || !sessionTime || !id) {
      setError('Date et heure sont requises')
      return
    }

    const scheduledAt = new Date(`${sessionDate}T${sessionTime}`).toISOString()
    
    const { error } = await createSession({
      squad_id: id,
      title: sessionTitle || undefined,
      scheduled_at: scheduledAt,
      duration_minutes: parseInt(sessionDuration),
      game: currentSquad?.game,
    })

    if (error) {
      setError(error.message)
    } else {
      setShowCreateSession(false)
      setSessionTitle('')
      setSessionDate('')
      setSessionTime('')
    }
  }

  const handleLeaveSquad = async () => {
    if (!id) return
    if (!confirm('Quitter cette squad ?')) return
    
    await leaveSquad(id)
    navigate('/squads')
  }

  const handleDeleteSquad = async () => {
    if (!id) return
    if (!confirm('Supprimer cette squad ? Cette action est irréversible.')) return
    
    await deleteSquad(id)
    navigate('/squads')
  }

  const isOwner = currentSquad?.owner_id === user?.id

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

  const getSessionStatus = (session: typeof sessions[0]) => {
    const now = new Date()
    const sessionDate = new Date(session.scheduled_at)
    
    if (session.status === 'cancelled') return { label: 'Annulée', variant: 'danger' as const }
    if (session.status === 'completed') return { label: 'Terminée', variant: 'default' as const }
    if (sessionDate < now) return { label: 'Passée', variant: 'default' as const }
    if (session.status === 'confirmed') return { label: 'Confirmée', variant: 'success' as const }
    return { label: 'En attente', variant: 'warning' as const }
  }

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
      </div>
    )
  }

  if (!currentSquad) {
    return (
      <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
        <p className="text-[#8b8d90]">Squad non trouvée</p>
      </div>
    )
  }

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
            <Link to="/squads" className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#8b8d90]" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#f7f8f8]">{currentSquad.name}</h1>
              <p className="text-[13px] text-[#8b8d90]">{currentSquad.game}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleCopyCode}>
              {copiedCode ? <Check className="w-4 h-4 text-[#4ade80]" /> : <Copy className="w-4 h-4" />}
              {currentSquad.invite_code}
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mb-8">
            <Card className="p-4 text-center">
              <Users className="w-5 h-5 mx-auto mb-2 text-[#5e6dd2]" />
              <div className="text-[18px] font-semibold text-[#f7f8f8]">{currentSquad.member_count}</div>
              <div className="text-[12px] text-[#5e6063]">Membres</div>
            </Card>
            <Card className="p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-2 text-[#f5a623]" />
              <div className="text-[18px] font-semibold text-[#f7f8f8]">{sessions.length}</div>
              <div className="text-[12px] text-[#5e6063]">Sessions</div>
            </Card>
            <Card className="p-4 text-center">
              <Gamepad2 className="w-5 h-5 mx-auto mb-2 text-[#4ade80]" />
              <div className="text-[18px] font-semibold text-[#f7f8f8]">{sessions.filter(s => s.status === 'completed').length}</div>
              <div className="text-[12px] text-[#5e6063]">Jouées</div>
            </Card>
          </motion.div>

          {/* Create Session */}
          <motion.div variants={itemVariants} className="mb-6">
            {showCreateSession ? (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#f7f8f8] mb-4">Nouvelle session</h3>
                  <form onSubmit={handleCreateSession} className="space-y-4">
                    <Input
                      label="Titre (optionnel)"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      placeholder="Ranked grind, Fun time..."
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Date"
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        required
                      />
                      <Input
                        label="Heure"
                        type="time"
                        value={sessionTime}
                        onChange={(e) => setSessionTime(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#c9cace] mb-1.5">
                        Durée
                      </label>
                      <select
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] focus:border-[rgba(94,109,210,0.5)] focus:ring-2 focus:ring-[rgba(94,109,210,0.15)] transition-all"
                      >
                        <option value="60">1 heure</option>
                        <option value="120">2 heures</option>
                        <option value="180">3 heures</option>
                        <option value="240">4 heures</option>
                      </select>
                    </div>
                    {error && (
                      <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
                        <p className="text-[#f87171] text-sm">{error}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => setShowCreateSession(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={sessionsLoading}>
                        {sessionsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer la session'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Button onClick={() => setShowCreateSession(true)} className="w-full">
                <Plus className="w-5 h-5" />
                Planifier une session
              </Button>
            )}
          </motion.div>

          {/* Sessions List */}
          <motion.div variants={itemVariants}>
            <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em] mb-4">
              Sessions à venir
            </h2>
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const status = getSessionStatus(session)
                  return (
                    <Link key={session.id} to={`/session/${session.id}`}>
                      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
                        <Card className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[rgba(245,166,35,0.15)] flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-[#f5a623]" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-[15px] font-medium text-[#f7f8f8]">
                                  {session.title || session.game || 'Session'}
                                </h3>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </div>
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
                            <ChevronRight className="w-5 h-5 text-[#5e6063]" />
                          </div>
                        </Card>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-[#5e6063]" strokeWidth={1} />
                <p className="text-[#8b8d90] mb-4">Aucune session planifiée</p>
                <Button size="sm" onClick={() => setShowCreateSession(true)}>
                  <Plus className="w-4 h-4" />
                  Créer la première session
                </Button>
              </Card>
            )}
          </motion.div>

          {/* Members */}
          <motion.div variants={itemVariants} className="mt-8">
            <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em] mb-4">
              Membres
            </h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                {currentSquad.members?.map((member: { user_id: string; role: string; profiles?: { username?: string } }) => (
                  <div key={member.user_id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[rgba(139,147,255,0.15)] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#8b93ff]" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[15px] text-[#f7f8f8]">
                        {member.profiles?.username || 'Joueur'}
                      </span>
                    </div>
                    <Badge variant={member.role === 'owner' ? 'primary' : 'default'}>
                      {member.role === 'owner' ? 'Leader' : 'Membre'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div variants={itemVariants} className="mt-8 space-y-3">
            {isOwner ? (
              <Button variant="danger" onClick={handleDeleteSquad} className="w-full">
                <Trash2 className="w-4 h-4" />
                Supprimer la squad
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleLeaveSquad} className="w-full">
                <LogOut className="w-4 h-4" />
                Quitter la squad
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
