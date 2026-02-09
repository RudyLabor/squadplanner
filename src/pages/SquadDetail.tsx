import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Calendar, Plus, Copy, Check, MessageCircle, Phone,
  Clock, Trash2, LogOut, Loader2, ChevronRight, UserPlus, Share2, Search, X,
  Mic, MicOff, Sparkles, Crown, TrendingUp, Trophy,
  CheckCircle2, XCircle, HelpCircle, BarChart3, Download, Zap
} from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Button, Card, CardContent, Badge, Input, SquadDetailSkeleton, Drawer } from '../components/ui'
import { useAuthStore, useSquadsStore, useSessionsStore, useVoiceChatStore, useVoiceCallStore, usePremiumStore } from '../hooks'
import { useSquadLeaderboardQuery } from '../hooks/queries'
import { PremiumGate, PremiumBadge } from '../components/PremiumGate'
import { SquadLeaderboard } from '../components/SquadLeaderboard'
// theme import removed - animation variants caused mobile rendering issues
import { supabase } from '../lib/supabase'
import { sendMemberJoinedMessage } from '../lib/systemMessages'
import { exportSessionsToICS } from '../utils/calendarExport'
import { showSuccess } from '../lib/toast'

// Animation variants removed - they can block mobile rendering

// Toast de succès avec célébration
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  const isCelebration = message.includes('confirmé') || message.includes('🔥')

  useEffect(() => {
    const timer = setTimeout(onClose, isCelebration ? 4000 : 3000)
    return () => clearTimeout(timer)
  }, [onClose, isCelebration])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
    >
      <motion.div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium shadow-xl ${
          isCelebration
            ? 'bg-gradient-to-r from-success to-success text-bg-base shadow-glow-success'
            : 'bg-success text-bg-base shadow-lg'
        }`}
        animate={isCelebration ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3, repeat: isCelebration ? 2 : 0 }}
      >
        <motion.div
          animate={isCelebration ? { rotate: [0, 15, -15, 0] } : {}}
          transition={{ duration: 0.5, repeat: isCelebration ? 2 : 0 }}
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
        <span className="text-[14px]">{message}</span>
      </motion.div>
    </motion.div>
  )
}

// Section Party Vocale
function PartySection({ squadId }: { squadId: string }) {
  const { user, profile } = useAuthStore()
  const { hasPremium } = usePremiumStore()
  const { isConnected, isConnecting, isMuted, remoteUsers, joinChannel, leaveChannel, toggleMute, error } = useVoiceChatStore()

  const handleJoinParty = async () => {
    if (!user || !profile) return
    const channelName = `squad-${squadId}`
    // Premium users get HD audio quality
    await joinChannel(channelName, user.id, profile.username || 'Joueur', hasPremium)
  }

  const participantCount = isConnected ? remoteUsers.length + 1 : remoteUsers.length

  return (
    <Card className={`p-4 ${isConnected ? 'border-success/30 bg-success/5' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic className={`w-5 h-5 ${isConnected ? 'text-success' : 'text-primary'}`} />
          <span className="text-[14px] font-semibold text-text-primary">Party vocale</span>
        </div>
        {participantCount > 0 && !isConnected && (
          <Badge variant="success">{participantCount} connecté{participantCount > 1 ? 's' : ''}</Badge>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-3">
          {/* Participants */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toi */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/20 border border-success/30">
              <div className={`w-2 h-2 rounded-full ${isMuted ? 'bg-error' : 'bg-success'}`} />
              <span className="text-[13px] text-text-primary">Toi</span>
            </div>
            {/* Autres */}
            {remoteUsers.map((u) => (
              <div key={String(u.odrop)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-border-hover">
                <div className={`w-2 h-2 rounded-full ${u.isSpeaking ? 'bg-success' : 'bg-text-tertiary'}`} />
                <span className="text-[13px] text-text-primary">{u.username}</span>
              </div>
            ))}
          </div>

          {/* Contrôles */}
          <div className="flex gap-2">
            <Button
              variant={isMuted ? 'danger' : 'secondary'}
              size="sm"
              onClick={toggleMute}
              className="flex-1"
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isMuted ? 'Muet' : 'Micro actif'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={leaveChannel}
            >
              Quitter
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {error && (
            <p className="text-[12px] text-error mb-2">{error}</p>
          )}
          <Button
            onClick={handleJoinParty}
            disabled={isConnecting}
            className="w-full"
            variant={participantCount > 0 ? 'primary' : 'secondary'}
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            {participantCount > 0 ? 'Rejoindre la party' : 'Lancer une party'}
          </Button>
          {participantCount === 0 && (
            <p className="text-[12px] text-text-quaternary text-center mt-2">
              Personne n'est connectée pour l'instant
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

// Card session avec RSVP rapide
function SessionCard({ session, onRsvp }: {
  session: {
    id: string
    title?: string | null
    game?: string | null
    scheduled_at: string
    status: string
    rsvp_counts?: { present: number; absent: number; maybe: number }
    my_rsvp?: 'present' | 'absent' | 'maybe' | null
  }
  onRsvp: (sessionId: string, response: 'present' | 'absent' | 'maybe') => void
}) {
  const date = new Date(session.scheduled_at)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const isPast = diffMs < 0 && session.status !== 'cancelled'
  const isToday = diffHours >= 0 && diffHours < 24
  const isTomorrow = diffHours >= 24 && diffHours < 48

  let timeLabel = ''
  if (isPast) {
    timeLabel = 'Passée'
  } else if (diffHours < 1 && diffHours >= 0) {
    timeLabel = 'Maintenant !'
  } else if (isToday) {
    timeLabel = `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  } else if (isTomorrow) {
    timeLabel = `Demain ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  } else {
    timeLabel = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ` · ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }

  const getStatusBadge = () => {
    if (session.status === 'cancelled') return { label: 'Annulée', variant: 'danger' as const }
    if (session.status === 'confirmed') return { label: 'Confirmée', variant: 'success' as const }
    if (isPast) return { label: 'Passée', variant: 'default' as const }
    return null
  }

  const statusBadge = getStatusBadge()
  const canRsvp = !isPast && session.status !== 'cancelled'

  return (
    <Card className={`p-4 transition-interactive hover:shadow-glow-primary-sm ${isToday && !isPast ? 'border-warning/30 hover:shadow-glow-warning-sm' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isToday && !isPast ? 'bg-warning/15' : 'bg-primary/15'
        }`}>
          <Calendar className={`w-6 h-6 ${isToday && !isPast ? 'text-warning' : 'text-primary'}`} strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-medium text-text-primary truncate">
              {session.title || session.game || 'Session'}
            </h3>
            {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
          </div>

          <div className="flex items-center gap-3 text-[13px] text-text-tertiary mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeLabel}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {session.rsvp_counts?.present || 0} présent{(session.rsvp_counts?.present || 0) > 1 ? 's' : ''}
            </span>
          </div>

          {/* RSVP rapide avec animations - touch targets 44px min */}
          {canRsvp && (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.preventDefault(); onRsvp(session.id, 'present') }}
                aria-label="Marquer comme présent"
                aria-pressed={session.my_rsvp === 'present'}
                className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium transition-interactive ${
                  session.my_rsvp === 'present'
                    ? 'bg-success/20 text-success border border-success/30 shadow-glow-success'
                    : 'bg-surface-card text-text-tertiary hover:bg-success-10 hover:text-success hover:border-success/20 border border-transparent'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Présent
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.preventDefault(); onRsvp(session.id, 'maybe') }}
                aria-label="Marquer comme peut-être"
                aria-pressed={session.my_rsvp === 'maybe'}
                className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium transition-interactive ${
                  session.my_rsvp === 'maybe'
                    ? 'bg-warning/20 text-warning border border-warning/30 shadow-glow-warning'
                    : 'bg-surface-card text-text-tertiary hover:bg-warning-10 hover:text-warning hover:border-warning/20 border border-transparent'
                }`}
              >
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
                Peut-être
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.preventDefault(); onRsvp(session.id, 'absent') }}
                aria-label="Marquer comme absent"
                aria-pressed={session.my_rsvp === 'absent'}
                className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium transition-interactive ${
                  session.my_rsvp === 'absent'
                    ? 'bg-error/20 text-error border border-error/30 shadow-glow-error'
                    : 'bg-surface-card text-text-tertiary hover:bg-error-10 hover:text-error hover:border-error/20 border border-transparent'
                }`}
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
                Absent
              </motion.button>
            </div>
          )}
        </div>

        <Link to={`/session/${session.id}`} onClick={(e) => e.stopPropagation()}>
          <ChevronRight className="w-5 h-5 text-text-quaternary" />
        </Link>
      </div>
    </Card>
  )
}

// Modal d'invitation
function InviteModal({
  isOpen,
  onClose,
  squadId,
  squadName,
  inviteCode,
  existingMemberIds
}: {
  isOpen: boolean
  onClose: () => void
  squadId: string
  squadName: string
  inviteCode: string
  existingMemberIds: string[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: string; username: string; avatar_url: string | null }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set())
  const [invitingUser, setInvitingUser] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Recherche d'utilisateurs
  const handleSearch = async () => {
    if (searchQuery.length < 2) return
    setIsSearching(true)
    setSearchResults([])
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .limit(10)

      console.log('Search results:', data, 'Error:', error)

      if (error) {
        console.error('Erreur recherche:', error)
      } else if (data) {
        // Filtrer les membres existants
        const filtered = data.filter(u => !existingMemberIds.includes(u.id))
        setSearchResults(filtered)
      }
    } catch (err) {
      console.error('Erreur recherche:', err)
    }
    setIsSearching(false)
  }

  // Inviter un utilisateur directement
  const handleInvite = async (userId: string, username: string) => {
    setInvitingUser(userId)
    setInviteError(null)
    try {
      // Insérer le membre
      const { error } = await supabase
        .from('squad_members')
        .insert({ squad_id: squadId, user_id: userId, role: 'member' })

      if (!error) {
        setInvitedUsers(prev => new Set([...prev, userId]))
        // Envoyer message système
        await sendMemberJoinedMessage(squadId, username)
      } else {
        console.error('Erreur invitation:', error)
        // Afficher une erreur plus claire
        if (error.code === '42501') {
          setInviteError('Tu dois être propriétaire de la squad pour inviter')
        } else if (error.code === '23505') {
          setInviteError('Ce joueur est déjà membre de la squad')
        } else {
          setInviteError(error.message || 'Erreur lors de l\'invitation')
        }
      }
    } catch (err) {
      console.error('Erreur invitation:', err)
      setInviteError('Erreur réseau, réessaie')
    } finally {
      setInvitingUser(null)
    }
  }

  // Partager via Web Share API
  const handleShare = async () => {
    const shareData = {
      title: `Rejoins ${squadName} sur Squad Planner !`,
      text: `Utilise le code ${inviteCode} pour rejoindre ma squad "${squadName}" !`,
      url: window.location.origin
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled ou erreur - intentionally ignored
      }
    } else {
      // Fallback: copier le texte
      await navigator.clipboard.writeText(`Rejoins ma squad "${squadName}" sur Squad Planner ! Code: ${inviteCode}`)
      setCopied(true)
      showSuccess('Lien d\'invitation copié !')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Copier le code
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    showSuccess('Code d\'invitation copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-bg-elevated rounded-2xl border border-border-default overflow-hidden shadow-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h2 className="text-[16px] font-semibold text-text-primary">Inviter des joueurs</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-lg hover:bg-bg-hover">
            <X className="w-5 h-5 text-text-tertiary" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Code d'invitation */}
          <div className="p-4 rounded-xl bg-primary-10 border border-primary/20">
            <p className="text-[12px] text-text-tertiary mb-2">Code d'invitation</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary tracking-wider flex-1">
                {inviteCode}
              </span>
              <Button size="sm" variant="secondary" onClick={handleCopyCode} aria-label="Copier le code d'invitation">
                {copied ? <Check className="w-4 h-4 text-success" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              </Button>
              <Button size="sm" variant="primary" onClick={handleShare} aria-label="Partager le code d'invitation">
                <Share2 className="w-4 h-4" aria-hidden="true" />
                Partager
              </Button>
            </div>
          </div>

          {/* Recherche d'utilisateurs */}
          <div>
            <p className="text-[12px] text-text-tertiary mb-2">Ou rechercher un joueur</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary" />
                <Input
                  placeholder="Nom d'utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || searchQuery.length < 2}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chercher'}
              </Button>
            </div>
          </div>

          {/* Message d'erreur */}
          {inviteError && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20">
              <p className="text-error text-[13px]">{inviteError}</p>
            </div>
          )}

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-card">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple/15 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple" />
                    </div>
                  )}
                  <span className="flex-1 text-[14px] text-text-primary">{user.username}</span>
                  {invitedUsers.has(user.id) ? (
                    <span className="text-[12px] text-success flex items-center gap-1">
                      <Check className="w-4 h-4" /> Ajouté
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleInvite(user.id, user.username)}
                      disabled={invitingUser === user.id}
                    >
                      {invitingUser === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {invitingUser === user.id ? 'Ajout...' : 'Inviter'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <p className="text-center text-[13px] text-text-quaternary py-4">
              Aucun joueur trouvé
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Card membre avec boutons d'appel et message
function MemberCard({ member, isOwner, currentUserId }: {
  member: {
    user_id: string
    role: string
    profiles?: { username?: string; avatar_url?: string; reliability_score?: number }
  }
  isOwner: boolean
  currentUserId?: string
}) {
  const navigate = useNavigate()
  const { startCall } = useVoiceCallStore()
  const reliability = member.profiles?.reliability_score ?? 100
  const isCurrentUser = member.user_id === currentUserId

  const handleCall = async (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('[MemberCard] handleCall clicked, username:', member.profiles?.username)
    if (!member.profiles?.username) {
      console.warn('[MemberCard] No username, aborting call')
      return
    }
    console.log('[MemberCard] Starting call to:', member.user_id)
    await startCall(member.user_id, member.profiles.username, member.profiles.avatar_url)
    console.log('[MemberCard] startCall completed')
  }

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Naviguer vers les DM avec cet utilisateur
    navigate(`/messages?dm=${member.user_id}`)
  }

  return (
    <div className="flex items-center gap-3 py-2">
      {member.profiles?.avatar_url ? (
        <img
          src={member.profiles.avatar_url}
          alt={member.profiles.username || 'Avatar'}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-purple/15 flex items-center justify-center">
          <Users className="w-5 h-5 text-purple" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-text-primary truncate">
            {member.profiles?.username || 'Joueur'}
          </span>
          {isOwner && <Crown className="w-4 h-4 text-warning" />}
        </div>
        <div className="flex items-center gap-1 text-[12px]">
          <TrendingUp className={`w-3 h-3 ${reliability >= 80 ? 'text-success' : reliability >= 60 ? 'text-warning' : 'text-error'}`} />
          <span className={reliability >= 80 ? 'text-success' : reliability >= 60 ? 'text-warning' : 'text-error'}>
            {reliability}%
          </span>
          <span className="text-text-quaternary">fiable</span>
        </div>
      </div>
      {/* Boutons d'action - seulement si ce n'est pas l'utilisateur courant */}
      {!isCurrentUser && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleMessage}
            className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-bg-hover transition-colors flex items-center justify-center"
            aria-label={`Envoyer un message à ${member.profiles?.username || 'ce joueur'}`}
          >
            <MessageCircle className="w-5 h-5 text-primary" aria-hidden="true" />
          </button>
          <button
            onClick={handleCall}
            className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-bg-hover transition-colors flex items-center justify-center"
            aria-label={`Appeler ${member.profiles?.username || 'ce joueur'}`}
          >
            <Phone className="w-5 h-5 text-success" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function SquadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [showCreateSession, setShowCreateSession] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showActionsDrawer, setShowActionsDrawer] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [sessionTime, setSessionTime] = useState('')
  const [sessionDuration, setSessionDuration] = useState('120')
  const [sessionThreshold, setSessionThreshold] = useState('3')
  const [copiedCode, setCopiedCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const { user, isInitialized } = useAuthStore()
  const { currentSquad, fetchSquadById, leaveSquad, deleteSquad, isLoading, setCurrentSquad } = useSquadsStore()
  const { sessions, fetchSessions, createSession, updateRsvp, isLoading: sessionsLoading } = useSessionsStore()
  const { canAccessFeature, fetchPremiumStatus, isSquadPremium } = usePremiumStore()
  const [loadTimeout, setLoadTimeout] = useState(false)

  // React Query hook for leaderboard - replaces direct RPC call
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useSquadLeaderboardQuery(id)

  // Reset currentSquad on unmount or id change to avoid stale data
  useEffect(() => {
    setCurrentSquad(null)
    setLoadTimeout(false)
    return () => setCurrentSquad(null)
  }, [id, setCurrentSquad])

  useEffect(() => {
    if (isInitialized && !user) {
      navigate('/auth')
    } else if (id && user) {
      fetchSquadById(id)
      fetchSessions(id)
      fetchPremiumStatus()
    }
  }, [id, user, isInitialized, navigate, fetchSquadById, fetchSessions, fetchPremiumStatus])

  // Timeout fallback — 10 seconds max loading
  useEffect(() => {
    if (!isLoading && currentSquad) return
    const timer = setTimeout(() => setLoadTimeout(true), 10000)
    return () => clearTimeout(timer)
  }, [id, isLoading, currentSquad])

  const handleCopyCode = async () => {
    if (!currentSquad) return
    await navigator.clipboard.writeText(currentSquad.invite_code)
    setCopiedCode(true)
    showSuccess('Code copié ! 📋')
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
      auto_confirm_threshold: parseInt(sessionThreshold),
      game: currentSquad?.game,
    })

    if (error) {
      setError(error.message)
    } else {
      setShowCreateSession(false)
      setSessionTitle('')
      setSessionDate('')
      setSessionTime('')
      setSessionThreshold('3')
      setSuccessMessage('Session créée !')
    }
  }

  const handleRsvp = async (sessionId: string, response: 'present' | 'absent' | 'maybe') => {
    try {
      const { error } = await updateRsvp(sessionId, response)
      if (error) {
        setError(error.message || 'Erreur lors de l\'enregistrement')
        return
      }

      if (id) fetchSessions(id)

      // Célébration pour "présent" - moment Wow! (only on success)
      const ariaLabels = {
        present: 'Tu es marqué comme présent',
        absent: 'Tu es marqué comme absent',
        maybe: 'Tu es marqué comme peut-être'
      }
      // A11Y 4: Announce RSVP status to screen readers
      const ariaRegion = document.getElementById('aria-live-polite')
      if (ariaRegion) ariaRegion.textContent = ariaLabels[response]

      if (response === 'present') {
        setShowConfetti(true)
        setSuccessMessage("T'es confirmé ! 🔥 Ta squad compte sur toi")
        setTimeout(() => setShowConfetti(false), 4000)
      } else {
        const labels = {
          absent: 'Absence enregistrée',
          maybe: 'Réponse enregistrée'
        }
        setSuccessMessage(labels[response])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    }
  }

  const handleLeaveSquad = async () => {
    if (!id) return
    if (!confirm('Quitter cette squad ?')) return

    await leaveSquad(id)
    showSuccess('Tu as quitté la squad')
    navigate('/squads')
  }

  const handleDeleteSquad = async () => {
    if (!id) return
    if (!confirm('Supprimer cette squad ? Cette action est irréversible.')) return

    await deleteSquad(id)
    showSuccess('Squad supprimée')
    navigate('/squads')
  }

  const isOwner = currentSquad?.owner_id === user?.id

  // Filtrer sessions futures
  const now = new Date()
  const futureSessions = sessions.filter(s => new Date(s.scheduled_at) >= now || s.status === 'confirmed')

  // Afficher le skeleton loader tant que le fetch n'est pas terminé
  if (!isInitialized || isLoading || (!currentSquad && id && !loadTimeout)) {
    return (
      <div className="min-h-0 bg-bg-base pb-6">
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
          <SquadDetailSkeleton />
        </div>
      </div>
    )
  }

  // Timeout — chargement trop long
  if (loadTimeout && !currentSquad) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center flex-col gap-4 py-12">
        <p className="text-text-tertiary">Le chargement prend trop de temps</p>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => { setLoadTimeout(false); if (id) { fetchSquadById(id); fetchSessions(id) } }}>
            Réessayer
          </Button>
          <Button variant="secondary" onClick={() => navigate('/squads')}>
            Retour aux squads
          </Button>
        </div>
      </div>
    )
  }

  // Squad non trouvée seulement si le fetch est terminé et qu'il n'y a pas de squad
  if (!currentSquad) {
    return (
      <div className="min-h-0 bg-bg-base flex items-center justify-center flex-col gap-4 py-12">
        <p className="text-text-tertiary">Squad non trouvée</p>
        <Button variant="secondary" onClick={() => navigate('/squads')}>
          Retour aux squads
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-0 bg-bg-base pb-6">
      {/* Confetti celebration for RSVP present */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={150}
          gravity={0.3}
          colors={['#6366f1', '#34d399', '#fbbf24', '#f7f8f8', '#a78bfa']}
        />
      )}
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div>
          {/* Header - V3: layoutId for shared element transition from Squads page */}
          <motion.div className="mb-6" layoutId={`squad-card-${id}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-text-primary truncate">{currentSquad.name}</h1>
                  {isOwner && <Crown className="w-5 h-5 text-warning flex-shrink-0" />}
                </div>
                <p className="text-[13px] text-text-tertiary">
                  {currentSquad.game} · {currentSquad.member_count} membre{(currentSquad.member_count || 0) > 1 ? 's' : ''}
                </p>
              </div>
              <Link to={`/messages?squad=${currentSquad.id}`} aria-label="Ouvrir les messages de cette squad">
                <Button variant="ghost" size="sm" aria-label="Ouvrir les messages">
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>

            {/* Code d'invitation - toujours visible et clair */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-10 border border-primary/20">
              <div className="flex-1">
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-0.5">Code d'invitation</p>
                <p className="text-[18px] font-bold text-primary tracking-wider">{currentSquad.invite_code}</p>
              </div>
              <Button variant="primary" size="sm" onClick={handleCopyCode} aria-label="Copier le code d'invitation">
                {copiedCode ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copiedCode ? 'Copié !' : 'Copier'}
              </Button>
            </div>
          </motion.div>

          {/* Party Vocale - PRIORITÉ #1 */}
          <div className="mb-6">
            <PartySection squadId={id || ''} />
          </div>

          {/* Créer session */}
          <AnimatePresence>
            {showCreateSession ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-[16px] font-semibold text-text-primary mb-4">Nouvelle session</h3>
                    <form onSubmit={handleCreateSession} className="space-y-4">
                      <Input
                        label="Titre (optionnel)"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        placeholder="Session ranked, Détente, Tryhard..."
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                            Durée
                          </label>
                          <select
                            value={sessionDuration}
                            onChange={(e) => setSessionDuration(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-input"
                          >
                            <option value="60">1 heure</option>
                            <option value="120">2 heures</option>
                            <option value="180">3 heures</option>
                            <option value="240">4 heures</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-text-secondary mb-1">
                            Confirmation automatique
                          </label>
                          <p className="text-[11px] text-text-quaternary mb-1.5">
                            La session sera confirmée quand ce nombre de joueurs aura répondu "Présent"
                          </p>
                          <select
                            value={sessionThreshold}
                            onChange={(e) => setSessionThreshold(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-input"
                          >
                            <option value="2">2 joueurs</option>
                            <option value="3">3 joueurs</option>
                            <option value="4">4 joueurs</option>
                            <option value="5">5 joueurs</option>
                            <option value="6">6 joueurs</option>
                            <option value="8">8 joueurs</option>
                            <option value="10">10 joueurs</option>
                          </select>
                        </div>
                      </div>
                      {error && (
                        <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                          <p className="text-error text-[13px]">{error}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button type="button" variant="ghost" onClick={() => setShowCreateSession(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={sessionsLoading}>
                          {sessionsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="mb-6">
                <Button onClick={() => setShowCreateSession(true)} className="w-full">
                  <Plus className="w-5 h-5" />
                  Planifier une session
                </Button>
              </div>
            )}
          </AnimatePresence>

          {/* Sessions à venir */}
          <div className="mb-6">
            <h2 className="text-[13px] font-semibold text-text-primary uppercase tracking-wide mb-3">
              Sessions à venir
            </h2>
            {futureSessions.length > 0 ? (
              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {futureSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onRsvp={handleRsvp}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-text-quaternary" strokeWidth={1} />
                <p className="text-[14px] text-text-tertiary mb-1">Pas encore de session prévue</p>
                <p className="text-[12px] text-text-quaternary mb-4">Propose un créneau pour jouer avec ta squad</p>
                <Button type="button" size="sm" onClick={() => setShowCreateSession(true)}>
                  <Plus className="w-4 h-4" />
                  Planifier une session
                </Button>
              </Card>
            )}
          </div>

          {/* Membres */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-text-primary uppercase tracking-wide">
                Membres ({currentSquad.member_count})
              </h2>
              <Button size="sm" variant="secondary" onClick={() => setShowInviteModal(true)}>
                <UserPlus className="w-4 h-4" />
                Inviter
              </Button>
            </div>
            <Card>
              <CardContent className="p-4 divide-y divide-border-default">
                {currentSquad.members?.map((member: { user_id: string; role: string; profiles?: { username?: string; avatar_url?: string; reliability_score?: number } }) => (
                  <MemberCard
                    key={member.user_id}
                    member={member}
                    isOwner={member.role === 'leader' || member.user_id === currentSquad.owner_id}
                    currentUserId={user?.id}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Stats Avancées - Premium */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[13px] font-semibold text-text-primary uppercase tracking-wide">
                Stats avancées
              </h2>
              {!canAccessFeature('advanced_stats', id) && <PremiumBadge small />}
            </div>
            <PremiumGate
              feature="advanced_stats"
              squadId={id}
              fallback="lock"
            >
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-medium text-text-primary">Analyse de la squad</h3>
                    <p className="text-[12px] text-text-quaternary">Tendances et performances</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-surface-card">
                    <div className="text-xl font-bold text-success">{sessions.length}</div>
                    <div className="text-xs text-text-quaternary">Sessions</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-card">
                    <div className="text-xl font-bold text-primary">{currentSquad.member_count || 0}</div>
                    <div className="text-xs text-text-quaternary">Membres</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-card">
                    <div className="text-xl font-bold text-warning">{Math.round(currentSquad.avg_reliability_score || 0)}%</div>
                    <div className="text-xs text-text-quaternary">Fiabilité</div>
                  </div>
                </div>
              </Card>
            </PremiumGate>
          </div>

          {/* Export Calendrier - Premium */}
          <div className="mb-6">
            <PremiumGate
              feature="calendar_export"
              featureLabel="Export calendrier"
              squadId={id}
              fallback="lock"
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                      <Download className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-medium text-text-primary">Export calendrier</h3>
                      <p className="text-[12px] text-text-quaternary">Synchronise avec Google, Apple...</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      try {
                        exportSessionsToICS(sessions, currentSquad?.name)
                        setSuccessMessage('Calendrier exporté ! Importez le fichier .ics dans votre app calendrier.')
                      } catch (error) {
                        setSuccessMessage(error instanceof Error ? error.message : 'Erreur lors de l\'export')
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Exporter
                  </Button>
                </div>
              </Card>
            </PremiumGate>
          </div>

          {/* Audio HD Badge si premium */}
          {isSquadPremium(id || '') && (
            <div className="mb-6">
              <Card className="p-4 bg-gradient-to-br from-warning/8 to-warning/[0.01] border-warning/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-medium text-text-primary">Squad Premium</h3>
                      <PremiumBadge small />
                    </div>
                    <p className="text-[12px] text-text-quaternary">Audio HD, stats avancées, export calendrier actifs</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Classement Squad */}
          {leaderboard.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[14px] font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Classement
              </h3>
              <SquadLeaderboard
                entries={leaderboard}
                currentUserId={user?.id || ''}
              />
            </div>
          )}
          {leaderboardLoading && (
            <div className="mb-6 flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-text-quaternary" />
            </div>
          )}

          {/* Actions squad - opens drawer on mobile */}
          <div className="mt-6">
            {/* Desktop: direct buttons */}
            <div className="hidden md:block">
              {isOwner ? (
                <button
                  onClick={handleDeleteSquad}
                  className="w-full py-3 text-[14px] text-error hover:text-error/70 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer la squad
                </button>
              ) : (
                <button
                  onClick={handleLeaveSquad}
                  className="w-full py-3 text-[14px] text-error hover:text-error/70 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Quitter la squad
                </button>
              )}
            </div>
            {/* Mobile: open drawer */}
            <button
              onClick={() => setShowActionsDrawer(true)}
              className="md:hidden w-full py-3 text-[14px] text-text-tertiary hover:text-text-primary transition-colors flex items-center justify-center gap-2 border border-border-subtle rounded-xl"
            >
              Actions de la squad
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Actions Drawer */}
          <Drawer
            isOpen={showActionsDrawer}
            onClose={() => setShowActionsDrawer(false)}
            title="Actions"
          >
            <div className="space-y-2">
              <button
                onClick={() => { setShowInviteModal(true); setShowActionsDrawer(false) }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
              >
                <UserPlus className="w-5 h-5 text-primary" />
                <span className="text-[14px] text-text-primary">Inviter des joueurs</span>
              </button>
              <button
                onClick={() => { setShowCreateSession(true); setShowActionsDrawer(false) }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
              >
                <Calendar className="w-5 h-5 text-warning" />
                <span className="text-[14px] text-text-primary">Créer une session</span>
              </button>
              <button
                onClick={() => { navigate(`/messages?squad=${id}`); setShowActionsDrawer(false) }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-success" />
                <span className="text-[14px] text-text-primary">Chat de la squad</span>
              </button>
              <div className="border-t border-border-subtle pt-2 mt-2">
                {isOwner ? (
                  <button
                    onClick={() => { handleDeleteSquad(); setShowActionsDrawer(false) }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-error/5 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-error" />
                    <span className="text-[14px] text-error">Supprimer la squad</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { handleLeaveSquad(); setShowActionsDrawer(false) }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-error/5 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-error" />
                    <span className="text-[14px] text-error">Quitter la squad</span>
                  </button>
                )}
              </div>
            </div>
          </Drawer>
        </div>
      </div>

      {/* Toast de succès */}
      <AnimatePresence>
        {successMessage && (
          <SuccessToast
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal d'invitation */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            squadId={id || ''}
            squadName={currentSquad.name}
            inviteCode={currentSquad.invite_code || ''}
            existingMemberIds={currentSquad.members?.map((m: { user_id: string }) => m.user_id) || []}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
