import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Loader2,
  Gamepad2,
  CheckCircle2,
  WifiOff,
  AlertCircle,
  UserPlus,
  Radio,
  ShieldCheck,
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Card, Button } from '../components/ui'
import { useAuthStore, useSquadsStore, useVoiceChatStore, usePremiumStore, getSavedPartyInfo } from '../hooks'
import { NetworkQualityIndicator, QualityChangeToast } from '../components/NetworkQualityIndicator'
import { useNetworkQualityStore } from '../hooks/useNetworkQuality'
import { VoiceWaveformDemo } from '../components/VoiceWaveform'
import { ParticipantVolumeControl } from '../components/ParticipantVolumeControl'
import { useParticipantVolumes } from '../hooks/useParticipantVolumes'
import { InviteToPartyModal } from '../components/InviteToPartyModal'

// Participant avatar avec animation speaking
function ParticipantAvatar({
  username,
  isSpeaking,
  isMuted,
  isLocal,
  size = 'md'
}: {
  username: string
  isSpeaking: boolean
  isMuted: boolean
  isLocal?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      animate={isSpeaking ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3, repeat: isSpeaking ? 3 : 0 }}
    >
      <div className="relative">
        {/* Glow effect when speaking */}
        {isSpeaking && (
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-success`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 1, repeat: 2 }}
          />
        )}
        <div className={`
          relative ${sizeClasses[size]} rounded-full flex items-center justify-center
          ${isSpeaking
            ? 'bg-success ring-2 ring-success/25 shadow-glow-success'
            : isLocal
              ? 'bg-primary'
              : 'bg-primary/30'
          }
          transition-interactive
        `}>
          <span className={`${textSizes[size]} font-bold text-white`}>
            {username.charAt(0).toUpperCase()}
          </span>
          {isMuted && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-error flex items-center justify-center">
              <MicOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      </div>
      <span className={`text-xs font-medium ${isLocal ? 'text-primary' : 'text-text-secondary'}`}>
        {isLocal ? 'Toi' : username}
      </span>
    </motion.div>
  )
}

// Section Party Active (grande, en haut)
function ActivePartySection({ squad, onLeave, currentUserId }: {
  squad: { id: string; name: string; game: string }
  onLeave: () => void
  currentUserId: string
}) {
  const {
    localUser, remoteUsers, isMuted, toggleMute, error, isReconnecting, reconnectAttempts, client,
    pushToTalkEnabled, pushToTalkActive, setPushToTalk, pushToTalkStart, pushToTalkEnd,
    noiseSuppressionEnabled, toggleNoiseSuppression,
  } = useVoiceChatStore()
  const { localQuality } = useNetworkQualityStore()
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Volume control hook
  const { getVolume, setVolume, isMuted: isParticipantMuted, setMuted, getEffectiveVolume } = useParticipantVolumes()

  // Apply volume settings to remote audio tracks
  useEffect(() => {
    if (!client) return

    remoteUsers.forEach(user => {
      const remoteUser = client.remoteUsers.find(u => u.uid === user.odrop)
      if (remoteUser?.audioTrack) {
        const effectiveVolume = getEffectiveVolume(String(user.odrop))
        remoteUser.audioTrack.setVolume(effectiveVolume)
      }
    })
  }, [client, remoteUsers, getEffectiveVolume])

  // Push-to-talk keyboard listener (Space key)
  useEffect(() => {
    if (!pushToTalkEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && e.target === document.body) {
        e.preventDefault()
        pushToTalkStart()
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        pushToTalkEnd()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [pushToTalkEnabled, pushToTalkStart, pushToTalkEnd])

  // Generate shareable party link
  const partyLink = `${window.location.origin}/squad/${squad.id}?join=party`

  // Get connected user IDs for the invite modal
  const connectedUserIds = remoteUsers.map(u => String(u.odrop))

  const participants = [
    ...(localUser ? [{ ...localUser, isLocal: true }] : []),
    ...remoteUsers.map(u => ({ ...u, isLocal: false }))
  ]

  return (
    <Card className="p-0 overflow-hidden border-success/30 bg-gradient-to-b from-success/5 to-transparent">
      {/* Header */}
      <div className="p-4 border-b border-border-default">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{squad.name}</h2>
              <p className="text-sm text-text-secondary">{squad.game}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Indicateur de qualite reseau */}
            {localQuality !== 'unknown' && (
              <NetworkQualityIndicator size="sm" showLabel showTooltip />
            )}
            {/* Invite squad members button */}
            <motion.button
              onClick={() => setShowInviteModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-primary-15 text-primary hover:bg-primary-20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Inviter
            </motion.button>
            <Link to={`/squad/${squad.id}`}>
              <span className="text-sm text-primary hover:text-purple">Voir la squad</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Reconnection status */}
      {isReconnecting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-3 bg-warning/10 border-b border-warning/20"
        >
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-warning animate-pulse" />
            <div className="flex-1">
              <p className="text-base font-medium text-warning">
                Reconnexion en cours...
              </p>
              <p className="text-xs text-warning/70">
                Tentative {reconnectAttempts}/3
              </p>
            </div>
            <Loader2 className="w-5 h-5 text-warning animate-spin" />
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-error/10 text-error text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Participants */}
      <div className="p-6 bg-surface-dark">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <AnimatePresence mode="popLayout">
            {participants.map((p) => {
              const participantId = String(p.odrop)
              const isRemote = !p.isLocal
              const participantMuted = isRemote ? isParticipantMuted(participantId) : false

              return (
                <motion.div
                  key={participantId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* Avatar and name */}
                  <ParticipantAvatar
                    username={p.username}
                    isSpeaking={p.isSpeaking && !participantMuted}
                    isMuted={p.isMuted}
                    isLocal={p.isLocal}
                    size="lg"
                  />

                  {/* Voice waveform - shows when participant is speaking */}
                  <div className="h-6">
                    <VoiceWaveformDemo
                      isActive={p.isSpeaking && !participantMuted}
                      size="sm"
                      color={p.isLocal ? 'var(--color-primary)' : 'var(--color-success)'}
                      barCount={5}
                    />
                  </div>

                  {/* Volume control - only for other participants, not self */}
                  {isRemote && (
                    <div className="mt-1">
                      <ParticipantVolumeControl
                        participantId={participantId}
                        participantName={p.username}
                        initialVolume={getVolume(participantId)}
                        onVolumeChange={setVolume}
                        onMute={setMuted}
                        isMuted={participantMuted}
                        compact
                      />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        {participants.length === 1 && (
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-base text-text-secondary">
              Invite tes potes ! La party t'attend
            </p>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 flex items-center justify-center gap-3">
        {/* Noise suppression toggle */}
        <motion.button
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            noiseSuppressionEnabled
              ? 'bg-primary-20 text-primary-hover'
              : 'bg-border-default text-text-tertiary'
          }`}
          onClick={toggleNoiseSuppression}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={noiseSuppressionEnabled ? 'Désactiver la suppression de bruit' : 'Activer la suppression de bruit'}
        >
          <ShieldCheck className="w-4 h-4" />
        </motion.button>

        {/* Push-to-talk toggle */}
        <motion.button
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            pushToTalkEnabled
              ? 'bg-warning/20 text-warning'
              : 'bg-border-default text-text-tertiary'
          }`}
          onClick={() => setPushToTalk(!pushToTalkEnabled)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={pushToTalkEnabled ? 'Désactiver Push-to-Talk' : 'Activer Push-to-Talk (Espace)'}
        >
          <Radio className="w-4 h-4" />
        </motion.button>

        {/* Mic toggle / PTT indicator */}
        <div className="relative">
          {/* Pulse animation when mic is active */}
          {!isMuted && (
            <motion.div
              className="absolute inset-0 w-14 h-14 rounded-full bg-success"
              animate={{ scale: [1, 1.2], opacity: [0.2, 0] }}
              transition={{ duration: 1.5, repeat: 2 }}
            />
          )}
          {pushToTalkEnabled ? (
            <motion.button
              className={`
                relative w-14 h-14 rounded-full flex items-center justify-center
                ${pushToTalkActive
                  ? 'bg-success text-bg-base'
                  : 'bg-warning text-bg-base'
                }
                transition-colors
              `}
              onMouseDown={pushToTalkStart}
              onMouseUp={pushToTalkEnd}
              onMouseLeave={pushToTalkEnd}
              onTouchStart={pushToTalkStart}
              onTouchEnd={pushToTalkEnd}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {pushToTalkActive ? <Mic className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
            </motion.button>
          ) : (
            <motion.button
              className={`
                relative w-14 h-14 rounded-full flex items-center justify-center
                ${isMuted
                  ? 'bg-error text-white'
                  : 'bg-success text-bg-base'
                }
                transition-colors
              `}
              onClick={toggleMute}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </motion.button>
          )}
        </div>

        <motion.button
          className="w-14 h-14 rounded-full bg-error text-white flex items-center justify-center"
          onClick={onLeave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PhoneOff className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Mute / PTT label */}
      <p className="text-center text-xs text-text-tertiary pb-4">
        {pushToTalkEnabled
          ? (pushToTalkActive ? 'Parle maintenant...' : 'Maintiens Espace pour parler')
          : (isMuted ? 'Micro coupé' : 'Micro actif')
        }
        {noiseSuppressionEnabled && <span className="ml-2 text-primary-hover">• Bruit supprimé</span>}
      </p>

      {/* Invite modal */}
      <InviteToPartyModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        squadId={squad.id}
        squadName={squad.name}
        partyLink={partyLink}
        currentUserId={currentUserId}
        connectedUserIds={connectedUserIds}
      />
    </Card>
  )
}

// Card squad compacte (quand pas active)
function SquadCard({ squad, onJoin, isConnecting }: {
  squad: { id: string; name: string; game: string; member_count: number }
  onJoin: () => void
  isConnecting: boolean
}) {
  return (
    <motion.div
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card className="p-4 bg-gradient-to-br from-primary/[0.08] to-transparent border-primary hover:border-primary transition-interactive">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-md shadow-primary/10">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-md font-semibold text-text-primary truncate">{squad.name}</h3>
            <p className="text-sm text-text-secondary">{squad.game} · {squad.member_count} membre{squad.member_count > 1 ? 's' : ''}</p>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={onJoin}
            disabled={isConnecting}
            className="shadow-md shadow-primary/10"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Rejoindre
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

// Toast simple pour les notifications
function Toast({ message, isVisible, onClose, variant = 'success' }: {
  message: string
  isVisible: boolean
  onClose: () => void
  variant?: 'success' | 'error' | 'warning'
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  const variantStyles = {
    success: {
      bg: 'bg-success',
      text: 'text-bg-base',
      Icon: CheckCircle2
    },
    error: {
      bg: 'bg-error',
      text: 'text-white',
      Icon: AlertCircle
    },
    warning: {
      bg: 'bg-warning',
      text: 'text-bg-base',
      Icon: WifiOff
    }
  }

  const style = variantStyles[variant]
  const Icon = style.Icon

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${style.bg} ${style.text} shadow-lg`}>
            <Icon className="w-5 h-5" />
            <span className="text-md font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Party() {
  const { user, profile } = useAuthStore()
  const { hasPremium } = usePremiumStore()
  const { squads, fetchSquads, isLoading: squadsLoading } = useSquadsStore()
  const {
    isConnected,
    isConnecting,
    isReconnecting,
    currentChannel,
    joinChannel,
    leaveChannel,
    networkQualityChanged,
    clearNetworkQualityNotification,
    remoteUsers
  } = useVoiceChatStore()

  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'warning'>('success')
  const wasReconnecting = useRef(false)
  const [showDuoConfetti, setShowDuoConfetti] = useState(false)
  const hadDuoCelebration = useRef(false)
  const prevRemoteCount = useRef(0)
  const hasAttemptedAutoReconnect = useRef(false)

  // Toast de changement de qualite reseau
  const [showQualityToast, setShowQualityToast] = useState(false)
  const [qualityToastLevel, setQualityToastLevel] = useState<'excellent' | 'good' | 'medium' | 'poor'>('good')

  useEffect(() => {
    if (user) {
      fetchSquads()
    }
  }, [user, fetchSquads])

  // Auto-reconnect to party after page refresh
  useEffect(() => {
    // Only attempt once, and only if not already connected
    if (hasAttemptedAutoReconnect.current || isConnected || isConnecting) return
    if (!user || !profile) return

    const savedParty = getSavedPartyInfo()
    if (savedParty) {
      hasAttemptedAutoReconnect.current = true
      console.log('[Party] Auto-reconnecting to saved party:', savedParty.channelName)

      // Small delay to let the page render first
      setTimeout(() => {
        joinChannel(savedParty.channelName, savedParty.userId, savedParty.username, hasPremium)
          .then(success => {
            if (success) {
              setToastMessage('Reconnecté à la party !')
              setToastVariant('success')
              setShowToast(true)
            }
          })
          .catch(err => {
            console.error('[Party] Auto-reconnect failed:', err)
          })
      }, 500)
    }
  }, [user, profile, isConnected, isConnecting, joinChannel])

  // Detecter la fin de la reconnexion pour afficher un toast
  useEffect(() => {
    if (wasReconnecting.current && !isReconnecting && isConnected) {
      // La reconnexion a reussi - defer state updates to avoid cascading renders
      queueMicrotask(() => {
        setToastMessage('Connexion rétablie !')
        setToastVariant('success')
        setShowToast(true)
      })
    }
    wasReconnecting.current = isReconnecting
  }, [isReconnecting, isConnected])

  // Detecter les changements de qualite reseau pour afficher un toast
  useEffect(() => {
    if (networkQualityChanged && networkQualityChanged !== 'unknown') {
      // Defer state updates to avoid cascading renders
      queueMicrotask(() => {
        setQualityToastLevel(networkQualityChanged as 'excellent' | 'good' | 'medium' | 'poor')
        setShowQualityToast(true)
        // Clear la notification apres l'affichage
        clearNetworkQualityNotification()
      })
    }
  }, [networkQualityChanged, clearNetworkQualityNotification])

  // 🎉 Celebration confetti when 2nd participant joins (duo moment!)
  useEffect(() => {
    const currentRemoteCount = remoteUsers.length
    // Si on passe de 0 à 1+ remote users et qu'on n'a pas déjà célébré
    if (isConnected && currentRemoteCount > 0 && prevRemoteCount.current === 0 && !hadDuoCelebration.current) {
      hadDuoCelebration.current = true
      // Defer state updates to avoid cascading renders
      queueMicrotask(() => {
        setShowDuoConfetti(true)
        setToastMessage('🎉 Vous êtes 2 ! La party commence')
        setToastVariant('success')
        setShowToast(true)
        setTimeout(() => setShowDuoConfetti(false), 4000)
      })
    }
    // Reset si on quitte la party
    if (!isConnected) {
      hadDuoCelebration.current = false
    }
    prevRemoteCount.current = currentRemoteCount
  }, [remoteUsers.length, isConnected])

  const handleJoinParty = async (squadId: string) => {
    if (!user || !profile) return
    const channelName = `squad-${squadId}`
    const squad = squads.find(s => s.id === squadId)
    const success = await joinChannel(channelName, user.id, profile.username || 'Joueur', hasPremium)
    if (success) {
      setToastMessage(`Tu as rejoint la party ${squad?.name || ''}`)
      setToastVariant('success')
      setShowToast(true)
    }
  }

  const handleLeaveParty = async () => {
    console.log('[Party] Leaving party...')
    try {
      await leaveChannel()
      console.log('[Party] Left party successfully')
    } catch (err) {
      console.error('[Party] Error leaving party:', err)
    }
  }

  // Trouver la squad active
  const activeSquadId = currentChannel?.replace('squad-', '') || null
  const activeSquad = squads.find(s => s.id === activeSquadId)
  const otherSquads = squads.filter(s => s.id !== activeSquadId)

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Party vocale">
      {/* Confetti celebration when duo */}
      {showDuoConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={120}
          gravity={0.25}
          colors={['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-purple)', 'var(--color-text-primary)']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Toast de notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        variant={toastVariant}
      />

      {/* Toast de changement de qualite reseau */}
      <QualityChangeToast
        isVisible={showQualityToast}
        newQuality={qualityToastLevel}
        onClose={() => setShowQualityToast(false)}
      />

      <div className="px-4 md:px-6 py-6 max-w-4xl lg:max-w-5xl mx-auto">
        <div>
          {/* Header compact */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-bold text-text-primary">Party</h1>
              <p className="text-base text-text-tertiary">
                {isConnected ? 'Connecté' : squads.length > 0 ? `${squads.length} squad${squads.length > 1 ? 's' : ''}` : 'Rejoins une squad'}
              </p>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/15 border border-success/30">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-success">En ligne</span>
              </div>
            )}
          </header>

          {/* Loading */}
          {squadsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : squads.length === 0 ? (
            /* état vide - design amélioré */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-8 text-center bg-gradient-to-br from-primary/[0.08] to-transparent border-primary">
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-primary/20"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-md shadow-primary/15"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Mic className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </motion.div>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  Parle avec ta squad
                </h3>
                <p className="text-md text-text-secondary mb-6 max-w-[280px] mx-auto leading-relaxed">
                  Crée ou rejoins une squad pour lancer des parties vocales avec tes potes.
                </p>
                <Link to="/squads">
                  <Button className="shadow-md shadow-primary/10">
                    <Users className="w-4 h-4" />
                    Trouver une squad
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ) : (
            <>
              {/* Party Active (en haut, grande) */}
              {isConnected && activeSquad && user && (
                <div className="mb-6">
                  <ActivePartySection
                    squad={{
                      id: activeSquad.id,
                      name: activeSquad.name,
                      game: activeSquad.game || 'Jeu'
                    }}
                    onLeave={handleLeaveParty}
                    currentUserId={user.id}
                  />
                </div>
              )}

              {/* Liste des squads pour rejoindre une party */}
              {!isConnected && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {squads.length === 1 ? (
                    /* Une seule squad - affichage central ameliore avec stats desktop */
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {/* Main card */}
                      <Card className="md:col-span-3 p-8 text-center bg-gradient-to-br from-primary/10 via-transparent to-success/5 border-primary">
                        {/* Mic icon with pulse ring animation */}
                        <div className="relative w-20 h-20 mx-auto mb-5">
                          <motion.div
                            className="absolute inset-0 rounded-2xl bg-primary/20"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-2xl bg-primary/15"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                          />
                          <motion.div
                            className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-lg shadow-primary/15"
                            animate={{ scale: [1, 1.03, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Mic className="w-9 h-9 text-white" />
                          </motion.div>
                        </div>
                        <h3 className="text-lg font-bold text-text-primary mb-2">
                          Prêt à parler ?
                        </h3>
                        <p className="text-md text-text-secondary mb-2">
                          {squads[0].name}
                        </p>
                        <p className="text-sm text-text-tertiary mb-3">
                          {squads[0].game} · {squads[0].member_count || 1} membre{(squads[0].member_count || 1) > 1 ? 's' : ''}
                        </p>

                        {/* Online members indicator */}
                        <div className="flex items-center justify-center gap-2 mb-5">
                          <div className="flex -space-x-2">
                            {Array.from({ length: Math.min(squads[0].member_count || 1, 4) }).map((_, i) => (
                              <div key={i} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-bg-base flex items-center justify-center">
                                <span className="text-[10px] font-bold text-primary">{String.fromCharCode(65 + i)}</span>
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-text-tertiary">
                            {squads[0].member_count || 1} membre{(squads[0].member_count || 1) > 1 ? 's' : ''} dans la squad
                          </span>
                        </div>

                        <Button
                          onClick={() => handleJoinParty(squads[0].id)}
                          disabled={isConnecting}
                          className="shadow-md shadow-primary/10 px-8"
                        >
                          {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                          Lancer la party
                        </Button>
                      </Card>

                      {/* Stats sidebar - desktop only */}
                      <div className="md:col-span-2 hidden md:flex flex-col gap-3">
                        <Card className="p-4 bg-bg-elevated border-border-default">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Zap className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">Party vocale</p>
                              <p className="text-xs text-text-tertiary">Statistiques</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-text-secondary flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                                Durée moyenne
                              </span>
                              <span className="text-sm font-medium text-text-primary">45 min</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-text-secondary flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-text-tertiary" />
                                Cette semaine
                              </span>
                              <span className="text-sm font-medium text-text-primary">12 parties</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-text-secondary flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-text-tertiary" />
                                Participants moy.
                              </span>
                              <span className="text-sm font-medium text-text-primary">3.2</span>
                            </div>
                          </div>
                        </Card>

                        <Card className="p-4 bg-bg-elevated border-border-default flex-1">
                          <p className="text-sm font-semibold text-text-primary mb-3">Historique récent</p>
                          <div className="space-y-2.5">
                            {[
                              { name: squads[0].name, time: 'Hier, 21h30', duration: '1h 12min' },
                              { name: squads[0].name, time: 'Lundi, 19h00', duration: '45min' },
                              { name: squads[0].name, time: 'Dimanche, 15h15', duration: '2h 05min' },
                            ].map((entry, i) => (
                              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
                                <div>
                                  <p className="text-xs font-medium text-text-primary">{entry.name}</p>
                                  <p className="text-xs text-text-tertiary">{entry.time}</p>
                                </div>
                                <span className="text-xs text-text-secondary">{entry.duration}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    /* Plusieurs squads - liste compacte avec stats desktop */
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-3 space-y-3">
                        <p className="text-sm font-medium text-text-secondary mb-1">Choisis une squad pour lancer la party</p>
                        {squads.map((squad) => (
                          <SquadCard
                            key={squad.id}
                            squad={{
                              id: squad.id,
                              name: squad.name,
                              game: squad.game || 'Jeu',
                              member_count: squad.member_count || 0
                            }}
                            onJoin={() => handleJoinParty(squad.id)}
                            isConnecting={isConnecting}
                          />
                        ))}
                      </div>
                      <div className="md:col-span-2 hidden md:flex flex-col gap-3">
                        <Card className="p-4 bg-bg-elevated border-border-default">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Zap className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">Party vocale</p>
                              <p className="text-xs text-text-tertiary">Statistiques</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-text-secondary flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                                Durée moyenne
                              </span>
                              <span className="text-sm font-medium text-text-primary">45 min</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-text-secondary flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-text-tertiary" />
                                Cette semaine
                              </span>
                              <span className="text-sm font-medium text-text-primary">12 parties</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-text-secondary flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-text-tertiary" />
                                Participants moy.
                              </span>
                              <span className="text-sm font-medium text-text-primary">3.2</span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Autres squads quand connecté */}
              {isConnected && otherSquads.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold text-text-primary uppercase tracking-wide mb-3">
                    Autres squads
                  </h2>
                  <div className="space-y-3">
                    {otherSquads.map((squad) => (
                      <SquadCard
                        key={squad.id}
                        squad={{
                          id: squad.id,
                          name: squad.name,
                          game: squad.game || 'Jeu',
                          member_count: squad.member_count || 0
                        }}
                        onJoin={() => handleJoinParty(squad.id)}
                        isConnecting={isConnecting}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default Party
