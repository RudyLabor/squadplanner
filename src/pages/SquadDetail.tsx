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
import { Button, Card, CardContent, Badge, Input, SquadDetailSkeleton } from '../components/ui'
import { useAuthStore, useSquadsStore, useSessionsStore, useVoiceChatStore, useVoiceCallStore, usePremiumStore } from '../hooks'
import { PremiumGate, PremiumBadge } from '../components/PremiumGate'
import { SquadLeaderboard } from '../components/SquadLeaderboard'
// theme import removed - animation variants caused mobile rendering issues
import { supabase } from '../lib/supabase'
import { sendMemberJoinedMessage } from '../lib/systemMessages'
import { exportSessionsToICS } from '../utils/calendarExport'

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
            ? 'bg-gradient-to-r from-[#34d399] to-[#34d399] text-[#050506] shadow-[0_0_20px_rgba(52,211,153,0.2)]'
            : 'bg-[#34d399] text-[#050506] shadow-lg'
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
    <Card className={`p-4 ${isConnected ? 'border-[#34d399]/30 bg-[#34d399]/5' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic className={`w-5 h-5 ${isConnected ? 'text-[#34d399]' : 'text-[#6366f1]'}`} />
          <span className="text-[14px] font-semibold text-[#f7f8f8]">Party vocale</span>
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#34d399]/20 border border-[#34d399]/30">
              <div className={`w-2 h-2 rounded-full ${isMuted ? 'bg-[#fb7185]' : 'bg-[#34d399]'}`} />
              <span className="text-[13px] text-[#f7f8f8]">Toi</span>
            </div>
            {/* Autres */}
            {remoteUsers.map((u) => (
              <div key={String(u.odrop)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
                <div className={`w-2 h-2 rounded-full ${u.isSpeaking ? 'bg-[#34d399]' : 'bg-[#5e6063]'}`} />
                <span className="text-[13px] text-[#f7f8f8]">{u.username}</span>
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
            <p className="text-[12px] text-[#fb7185] mb-2">{error}</p>
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
            <p className="text-[12px] text-[#5e6063] text-center mt-2">
              Personne n'est connecté pour l'instant
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
    <Card className={`p-4 transition-interactive hover:shadow-[0_0_12px_rgba(99,102,241,0.08)] ${isToday && !isPast ? 'border-[#fbbf24]/30 hover:shadow-[0_0_12px_rgba(251,191,36,0.1)]' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isToday && !isPast ? 'bg-[#fbbf24]/15' : 'bg-[rgba(99,102,241,0.15)]'
        }`}>
          <Calendar className={`w-6 h-6 ${isToday && !isPast ? 'text-[#fbbf24]' : 'text-[#6366f1]'}`} strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-medium text-[#f7f8f8] truncate">
              {session.title || session.game || 'Session'}
            </h3>
            {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
          </div>

          <div className="flex items-center gap-3 text-[13px] text-[#8b8d90] mb-3">
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
                    ? 'bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                    : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(52,211,153,0.1)] hover:text-[#34d399] hover:border-[#34d399]/20 border border-transparent'
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
                    ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                    : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(251,191,36,0.1)] hover:text-[#fbbf24] hover:border-[#fbbf24]/20 border border-transparent'
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
                    ? 'bg-[#fb7185]/20 text-[#fb7185] border border-[#fb7185]/30 shadow-[0_0_10px_rgba(251,113,133,0.15)]'
                    : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(251,113,133,0.1)] hover:text-[#fb7185] hover:border-[#fb7185]/20 border border-transparent'
                }`}
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
                Absent
              </motion.button>
            </div>
          )}
        </div>

        <Link to={`/session/${session.id}`} onClick={(e) => e.stopPropagation()}>
          <ChevronRight className="w-5 h-5 text-[#5e6063]" />
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
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Copier le code
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-[#101012] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-[16px] font-semibold text-[#f7f8f8]">Inviter des joueurs</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.08)]">
            <X className="w-5 h-5 text-[#8b8d90]" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Code d'invitation */}
          <div className="p-4 rounded-xl bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)]">
            <p className="text-[12px] text-[#8b8d90] mb-2">Code d'invitation</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-[#6366f1] tracking-wider flex-1">
                {inviteCode}
              </span>
              <Button size="sm" variant="secondary" onClick={handleCopyCode}>
                {copied ? <Check className="w-4 h-4 text-[#34d399]" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="primary" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
            </div>
          </div>

          {/* Recherche d'utilisateurs */}
          <div>
            <p className="text-[12px] text-[#8b8d90] mb-2">Ou rechercher un joueur</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e6063]" />
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
            <div className="p-3 rounded-lg bg-[rgba(251,113,133,0.1)] border border-[rgba(251,113,133,0.2)]">
              <p className="text-[#fb7185] text-[13px]">{inviteError}</p>
            </div>
          )}

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)]">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[rgba(167,139,250,0.15)] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#a78bfa]" />
                    </div>
                  )}
                  <span className="flex-1 text-[14px] text-[#f7f8f8]">{user.username}</span>
                  {invitedUsers.has(user.id) ? (
                    <span className="text-[12px] text-[#34d399] flex items-center gap-1">
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
            <p className="text-center text-[13px] text-[#5e6063] py-4">
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
        <div className="w-10 h-10 rounded-full bg-[rgba(167,139,250,0.15)] flex items-center justify-center">
          <Users className="w-5 h-5 text-[#a78bfa]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-[#f7f8f8] truncate">
            {member.profiles?.username || 'Joueur'}
          </span>
          {isOwner && <Crown className="w-4 h-4 text-[#fbbf24]" />}
        </div>
        <div className="flex items-center gap-1 text-[12px]">
          <TrendingUp className={`w-3 h-3 ${reliability >= 80 ? 'text-[#34d399]' : reliability >= 60 ? 'text-[#fbbf24]' : 'text-[#fb7185]'}`} />
          <span className={reliability >= 80 ? 'text-[#34d399]' : reliability >= 60 ? 'text-[#fbbf24]' : 'text-[#fb7185]'}>
            {reliability}%
          </span>
          <span className="text-[#5e6063]">fiable</span>
        </div>
      </div>
      {/* Boutons d'action - seulement si ce n'est pas l'utilisateur courant */}
      {!isCurrentUser && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleMessage}
            className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors flex items-center justify-center"
            aria-label={`Envoyer un message à ${member.profiles?.username || 'ce joueur'}`}
          >
            <MessageCircle className="w-5 h-5 text-[#6366f1]" aria-hidden="true" />
          </button>
          <button
            onClick={handleCall}
            className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors flex items-center justify-center"
            aria-label={`Appeler ${member.profiles?.username || 'ce joueur'}`}
          >
            <Phone className="w-5 h-5 text-[#34d399]" aria-hidden="true" />
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
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [sessionTime, setSessionTime] = useState('')
  const [sessionDuration, setSessionDuration] = useState('120')
  const [sessionThreshold, setSessionThreshold] = useState('3')
  const [copiedCode, setCopiedCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [leaderboard, setLeaderboard] = useState<Array<{
    rank: number
    user_id: string
    username: string
    avatar_url: string | null
    xp: number
    level: number
    reliability_score: number
    streak_days: number
  }>>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  const { user, isInitialized } = useAuthStore()
  const { currentSquad, fetchSquadById, leaveSquad, deleteSquad, isLoading } = useSquadsStore()
  const { sessions, fetchSessions, createSession, updateRsvp, isLoading: sessionsLoading } = useSessionsStore()
  const { canAccessFeature, fetchPremiumStatus, isSquadPremium } = usePremiumStore()

  // Fetch leaderboard data
  const fetchLeaderboard = async (squadId: string) => {
    setLeaderboardLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_squad_leaderboard', { p_squad_id: squadId })

      if (error) {
        console.error('Error fetching leaderboard:', error)
        setLeaderboard([])
      } else {
        setLeaderboard(data || [])
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setLeaderboard([])
    } finally {
      setLeaderboardLoading(false)
    }
  }

  useEffect(() => {
    if (isInitialized && !user) {
      navigate('/auth')
    } else if (id && user) {
      fetchSquadById(id)
      fetchSessions(id)
      fetchPremiumStatus()
      fetchLeaderboard(id)
    }
  }, [id, user, isInitialized, navigate, fetchSquadById, fetchSessions, fetchPremiumStatus])

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
      if (response === 'present') {
        setShowConfetti(true)
        setSuccessMessage("T'es confirmé ! 🔥 Ta squad compte sur toi")
        // Arrêter le confetti après 4 secondes
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
    navigate('/squads')
  }

  const handleDeleteSquad = async () => {
    if (!id) return
    if (!confirm('Supprimer cette squad ? Cette action est irréversible.')) return

    await deleteSquad(id)
    navigate('/squads')
  }

  const isOwner = currentSquad?.owner_id === user?.id

  // Filtrer sessions futures
  const now = new Date()
  const futureSessions = sessions.filter(s => new Date(s.scheduled_at) >= now || s.status === 'confirmed')

  // Afficher le skeleton loader tant que le fetch n'est pas terminé
  if (!isInitialized || isLoading || (!currentSquad && id)) {
    return (
      <div className="min-h-0 bg-[#050506] pb-6">
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
          <SquadDetailSkeleton />
        </div>
      </div>
    )
  }

  // Squad non trouvée seulement si le fetch est terminé et qu'il n'y a pas de squad
  if (!currentSquad) {
    return (
      <div className="min-h-0 bg-[#050506] flex items-center justify-center flex-col gap-4 py-12">
        <p className="text-[#8b8d90]">Squad non trouvée</p>
        <Button variant="secondary" onClick={() => navigate('/squads')}>
          Retour aux squads
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-0 bg-[#050506] pb-6">
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
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-[#f7f8f8] truncate">{currentSquad.name}</h1>
                  {isOwner && <Crown className="w-5 h-5 text-[#fbbf24] flex-shrink-0" />}
                </div>
                <p className="text-[13px] text-[#8b8d90]">
                  {currentSquad.game} · {currentSquad.member_count} membre{(currentSquad.member_count || 0) > 1 ? 's' : ''}
                </p>
              </div>
              <Link to="/messages">
                <Button variant="ghost" size="sm">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Code d'invitation - toujours visible et clair */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)]">
              <div className="flex-1">
                <p className="text-xs text-[#8b8d90] uppercase tracking-wide mb-0.5">Code d'invitation</p>
                <p className="text-[18px] font-bold text-[#6366f1] tracking-wider">{currentSquad.invite_code}</p>
              </div>
              <Button variant="primary" size="sm" onClick={handleCopyCode}>
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'Copié !' : 'Copier'}
              </Button>
            </div>
          </div>

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
                    <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-4">Nouvelle session</h3>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[13px] font-medium text-[#c9cace] mb-1.5">
                            Durée
                          </label>
                          <select
                            value={sessionDuration}
                            onChange={(e) => setSessionDuration(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] focus:border-[rgba(99,102,241,0.5)] focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] transition-input"
                          >
                            <option value="60">1 heure</option>
                            <option value="120">2 heures</option>
                            <option value="180">3 heures</option>
                            <option value="240">4 heures</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-[#c9cace] mb-1.5">
                            Auto-confirm à
                          </label>
                          <select
                            value={sessionThreshold}
                            onChange={(e) => setSessionThreshold(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] focus:border-[rgba(99,102,241,0.5)] focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] transition-input"
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
                        <div className="p-3 rounded-lg bg-[rgba(251,113,133,0.1)] border border-[rgba(251,113,133,0.2)]">
                          <p className="text-[#fb7185] text-[13px]">{error}</p>
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
            <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide mb-3">
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
                <Calendar className="w-10 h-10 mx-auto mb-3 text-[#5e6063]" strokeWidth={1} />
                <p className="text-[14px] text-[#8b8d90]">Pas encore de session prévue</p>
                <p className="text-[12px] text-[#5e6063] mt-1">Lance la première !</p>
              </Card>
            )}
          </div>

          {/* Membres */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
                Membres ({currentSquad.member_count})
              </h2>
              <Button size="sm" variant="secondary" onClick={() => setShowInviteModal(true)}>
                <UserPlus className="w-4 h-4" />
                Inviter
              </Button>
            </div>
            <Card>
              <CardContent className="p-4 divide-y divide-[rgba(255,255,255,0.06)]">
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
              <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
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
                  <div className="w-10 h-10 rounded-xl bg-[rgba(99,102,241,0.15)] flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#6366f1]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-medium text-[#f7f8f8]">Analyse de la squad</h3>
                    <p className="text-[12px] text-[#5e6063]">Tendances et performances</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)]">
                    <div className="text-xl font-bold text-[#34d399]">{sessions.length}</div>
                    <div className="text-xs text-[#5e6063]">Sessions</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)]">
                    <div className="text-xl font-bold text-[#6366f1]">{currentSquad.member_count || 0}</div>
                    <div className="text-xs text-[#5e6063]">Membres</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)]">
                    <div className="text-xl font-bold text-[#fbbf24]">{Math.round(currentSquad.avg_reliability_score || 0)}%</div>
                    <div className="text-xs text-[#5e6063]">Fiabilité</div>
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
                    <div className="w-10 h-10 rounded-xl bg-[rgba(52,211,153,0.15)] flex items-center justify-center">
                      <Download className="w-5 h-5 text-[#34d399]" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-medium text-[#f7f8f8]">Export calendrier</h3>
                      <p className="text-[12px] text-[#5e6063]">Synchronise avec Google, Apple...</p>
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
              <Card className="p-4 bg-gradient-to-br from-[rgba(251,191,36,0.08)] to-[rgba(251,191,36,0.01)] border-[rgba(251,191,36,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(251,191,36,0.15)] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#fbbf24]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-medium text-[#f7f8f8]">Squad Premium</h3>
                      <PremiumBadge small />
                    </div>
                    <p className="text-[12px] text-[#5e6063]">Audio HD, stats avancées, export calendrier actifs</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Classement Squad */}
          {leaderboard.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[14px] font-semibold text-[#f7f8f8] mb-3 flex items-center gap-2">
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
              <Loader2 className="w-5 h-5 animate-spin text-[#5e6063]" />
            </div>
          )}

          {/* Actions squad - toujours visible */}
          <div className="mt-6">
            {isOwner ? (
              <button
                onClick={handleDeleteSquad}
                className="w-full py-3 text-[14px] text-[#fb7185] hover:text-[#fca5a5] transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer la squad
              </button>
            ) : (
              <button
                onClick={handleLeaveSquad}
                className="w-full py-3 text-[14px] text-[#fb7185] hover:text-[#fca5a5] transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Quitter la squad
              </button>
            )}
          </div>
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
