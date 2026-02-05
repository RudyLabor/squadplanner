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
  AlertCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Card, Button } from '../components/ui'
import { useAuthStore, useSquadsStore, useVoiceChatStore } from '../hooks'
import { NetworkQualityIndicator, QualityChangeToast } from '../components/NetworkQualityIndicator'
import { useNetworkQualityStore } from '../hooks/useNetworkQuality'

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
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      animate={isSpeaking ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
    >
      <div className="relative">
        {/* Glow effect when speaking */}
        {isSpeaking && (
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-[#4ade80]`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        <div className={`
          relative ${sizeClasses[size]} rounded-full flex items-center justify-center
          ${isSpeaking
            ? 'bg-[#4ade80] ring-4 ring-[#4ade80]/50 shadow-[0_0_25px_rgba(74,222,128,0.5)]'
            : isLocal
              ? 'bg-[#5e6dd2]'
              : 'bg-[rgba(94,109,210,0.3)]'
          }
          transition-all duration-200
        `}>
          <span className={`${textSizes[size]} font-bold text-white`}>
            {username.charAt(0).toUpperCase()}
          </span>
          {isMuted && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#f87171] flex items-center justify-center">
              <MicOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      </div>
      <span className={`text-xs font-medium ${isLocal ? 'text-[#5e6dd2]' : 'text-[#8b8d90]'}`}>
        {isLocal ? 'Toi' : username}
      </span>
    </motion.div>
  )
}

// Section Party Active (grande, en haut)
function ActivePartySection({ squad, onLeave }: {
  squad: { id: string; name: string; game: string }
  onLeave: () => void
}) {
  const { localUser, remoteUsers, isMuted, toggleMute, error, isReconnecting, reconnectAttempts } = useVoiceChatStore()
  const { localQuality } = useNetworkQualityStore()

  const participants = [
    ...(localUser ? [{ ...localUser, isLocal: true }] : []),
    ...remoteUsers.map(u => ({ ...u, isLocal: false }))
  ]

  return (
    <Card className="p-0 overflow-hidden border-[#4ade80]/30 bg-gradient-to-b from-[#4ade80]/5 to-transparent">
      {/* Header */}
      <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#4ade80] animate-pulse" />
            <div>
              <h2 className="text-[16px] font-semibold text-[#f7f8f8]">{squad.name}</h2>
              <p className="text-[12px] text-[#8b8d90]">{squad.game}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Indicateur de qualite reseau */}
            {localQuality !== 'unknown' && (
              <NetworkQualityIndicator size="sm" showLabel showTooltip />
            )}
            <Link to={`/squad/${squad.id}`}>
              <span className="text-[12px] text-[#5e6dd2]">Voir la squad</span>
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
          className="px-4 py-3 bg-[#f5a623]/10 border-b border-[#f5a623]/20"
        >
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-[#f5a623] animate-pulse" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-[#f5a623]">
                Reconnexion en cours...
              </p>
              <p className="text-xs text-[#f5a623]/70">
                Tentative {reconnectAttempts}/3
              </p>
            </div>
            <Loader2 className="w-5 h-5 text-[#f5a623] animate-spin" />
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-[#f87171]/10 text-[#f87171] text-[12px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Participants */}
      <div className="p-6 bg-[rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <AnimatePresence mode="popLayout">
            {participants.map((p) => (
              <motion.div
                key={String(p.odrop)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <ParticipantAvatar
                  username={p.username}
                  isSpeaking={p.isSpeaking}
                  isMuted={p.isMuted}
                  isLocal={p.isLocal}
                  size="lg"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {participants.length === 1 && (
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-[13px] text-[#8b8d90]">
              🎤 Invite tes potes ! La party t'attend
            </p>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 flex items-center justify-center gap-4">
        <div className="relative">
          {/* Pulse animation when mic is active */}
          {!isMuted && (
            <motion.div
              className="absolute inset-0 w-14 h-14 rounded-full bg-[#4ade80]"
              animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          <motion.button
            className={`
              relative w-14 h-14 rounded-full flex items-center justify-center
              ${isMuted
                ? 'bg-[#f87171] text-white'
                : 'bg-[#4ade80] text-[#08090a]'
              }
              transition-colors
            `}
            onClick={toggleMute}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </motion.button>
        </div>

        <motion.button
          className="w-14 h-14 rounded-full bg-[#f87171] text-white flex items-center justify-center"
          onClick={onLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PhoneOff className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Mute label */}
      <p className="text-center text-xs text-[#5e6063] pb-4">
        {isMuted ? 'Micro coupé' : 'Micro actif'}
      </p>
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
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card className="p-4 bg-gradient-to-br from-[rgba(94,109,210,0.08)] to-transparent border-[rgba(94,109,210,0.15)] hover:border-[rgba(94,109,210,0.3)] transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5e6dd2] to-[#8b93ff] flex items-center justify-center shadow-lg shadow-[#5e6dd2]/20">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-[#f7f8f8] truncate">{squad.name}</h3>
            <p className="text-[12px] text-[#8b8d90]">{squad.game} · {squad.member_count} membre{squad.member_count > 1 ? 's' : ''}</p>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={onJoin}
            disabled={isConnecting}
            className="shadow-lg shadow-[#5e6dd2]/20"
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
      bg: 'bg-[#4ade80]',
      text: 'text-[#08090a]',
      Icon: CheckCircle2
    },
    error: {
      bg: 'bg-[#f87171]',
      text: 'text-white',
      Icon: AlertCircle
    },
    warning: {
      bg: 'bg-[#f5a623]',
      text: 'text-[#08090a]',
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
            <span className="text-[14px] font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Party() {
  const { user, profile } = useAuthStore()
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

  // Toast de changement de qualite reseau
  const [showQualityToast, setShowQualityToast] = useState(false)
  const [qualityToastLevel, setQualityToastLevel] = useState<'excellent' | 'good' | 'medium' | 'poor'>('good')

  useEffect(() => {
    if (user) {
      fetchSquads()
    }
  }, [user, fetchSquads])

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
    const success = await joinChannel(channelName, user.id, profile.username || 'Joueur')
    if (success) {
      setToastMessage(`Tu as rejoint la party ${squad?.name || ''}`)
      setToastVariant('success')
      setShowToast(true)
    }
  }

  const handleLeaveParty = async () => {
    await leaveChannel()
  }

  // Trouver la squad active
  const activeSquadId = currentChannel?.replace('squad-', '') || null
  const activeSquad = squads.find(s => s.id === activeSquadId)
  const otherSquads = squads.filter(s => s.id !== activeSquadId)

  return (
    <div className="min-h-0 bg-[#08090a] pb-6">
      {/* Confetti celebration when duo */}
      {showDuoConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={120}
          gravity={0.25}
          colors={['#5e6dd2', '#4ade80', '#f5a623', '#8b93ff', '#f7f8f8']}
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#f7f8f8]">Party</h1>
              <p className="text-[13px] text-[#5e6063]">
                {isConnected ? 'Connecté' : squads.length > 0 ? `${squads.length} squad${squads.length > 1 ? 's' : ''}` : 'Rejoins une squad'}
              </p>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4ade80]/15 border border-[#4ade80]/30">
                <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="text-[12px] font-medium text-[#4ade80]">En ligne</span>
              </div>
            )}
          </div>

          {/* Loading */}
          {squadsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
            </div>
          ) : squads.length === 0 ? (
            /* État vide - design amélioré */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-8 text-center bg-gradient-to-br from-[rgba(94,109,210,0.08)] to-transparent border-[rgba(94,109,210,0.15)]">
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5e6dd2] to-[#8b93ff] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#5e6dd2]/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Mic className="w-8 h-8 text-white" strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-[18px] font-bold text-[#f7f8f8] mb-2">
                  Parle avec ta squad
                </h3>
                <p className="text-[14px] text-[#8b8d90] mb-6 max-w-[280px] mx-auto leading-relaxed">
                  Crée ou rejoins une squad pour lancer des parties vocales avec tes potes.
                </p>
                <Link to="/squads">
                  <Button className="shadow-lg shadow-[#5e6dd2]/20">
                    <Users className="w-4 h-4" />
                    Trouver une squad
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ) : (
            <>
              {/* Party Active (en haut, grande) */}
              {isConnected && activeSquad && (
                <div className="mb-6">
                  <ActivePartySection
                    squad={{
                      id: activeSquad.id,
                      name: activeSquad.name,
                      game: activeSquad.game || 'Jeu'
                    }}
                    onLeave={handleLeaveParty}
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
                    /* Une seule squad - affichage central amélioré */
                    <Card className="p-8 text-center bg-gradient-to-br from-[rgba(94,109,210,0.1)] via-transparent to-[rgba(74,222,128,0.05)] border-[rgba(94,109,210,0.2)]">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5e6dd2] to-[#8b93ff] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-[#5e6dd2]/30"
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Mic className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-[18px] font-bold text-[#f7f8f8] mb-2">
                        🎤 Prêt à parler ?
                      </h3>
                      <p className="text-[14px] text-[#8b8d90] mb-2">
                        {squads[0].name}
                      </p>
                      <p className="text-[12px] text-[#5e6063] mb-5">
                        {squads[0].game} · {squads[0].member_count || 1} membre{(squads[0].member_count || 1) > 1 ? 's' : ''}
                      </p>
                      <Button
                        onClick={() => handleJoinParty(squads[0].id)}
                        disabled={isConnecting}
                        className="shadow-lg shadow-[#5e6dd2]/20 px-8"
                      >
                        {isConnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                        Lancer la party
                      </Button>
                    </Card>
                  ) : (
                    /* Plusieurs squads - liste compacte */
                    <div className="space-y-3">
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
                  )}
                </motion.div>
              )}

              {/* Autres squads quand connecté */}
              {isConnected && otherSquads.length > 0 && (
                <div>
                  <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide mb-3">
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
    </div>
  )
}

export default Party
