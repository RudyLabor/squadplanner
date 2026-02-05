import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Loader2,
  Gamepad2,
  CheckCircle2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { useAuthStore, useSquadsStore, useVoiceChatStore } from '../hooks'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

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
      animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
    >
      <div className={`
        relative ${sizeClasses[size]} rounded-full flex items-center justify-center
        ${isSpeaking
          ? 'bg-[#4ade80] ring-4 ring-[#4ade80]/30'
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
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ef4444] flex items-center justify-center">
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <span className={`text-[11px] font-medium ${isLocal ? 'text-[#5e6dd2]' : 'text-[#8b8d90]'}`}>
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
  const { localUser, remoteUsers, isMuted, toggleMute, error } = useVoiceChatStore()

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
          <Link to={`/squad/${squad.id}`}>
            <span className="text-[12px] text-[#5e6dd2]">Voir la squad</span>
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-[#ef4444]/10 text-[#ef4444] text-[12px]">
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
          <p className="text-center text-[12px] text-[#5e6063] mt-4">
            Tu es seul pour l'instant...
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 flex items-center justify-center gap-4">
        <motion.button
          className={`
            w-14 h-14 rounded-full flex items-center justify-center
            ${isMuted
              ? 'bg-[#ef4444] text-white'
              : 'bg-[rgba(255,255,255,0.1)] text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.15)]'
            }
            transition-colors
          `}
          onClick={toggleMute}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </motion.button>

        <motion.button
          className="w-14 h-14 rounded-full bg-[#ef4444] text-white flex items-center justify-center"
          onClick={onLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PhoneOff className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Mute label */}
      <p className="text-center text-[11px] text-[#5e6063] pb-4">
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
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
          <Gamepad2 className="w-6 h-6 text-[#5e6dd2]" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-medium text-[#f7f8f8] truncate">{squad.name}</h3>
          <p className="text-[12px] text-[#8b8d90]">{squad.game}</p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={onJoin}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Rejoindre</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}

// Toast simple pour les notifications
function Toast({ message, isVisible, onClose }: { message: string; isVisible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#4ade80] text-[#08090a] shadow-lg">
            <CheckCircle2 className="w-5 h-5" />
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
    currentChannel,
    joinChannel,
    leaveChannel
  } = useVoiceChatStore()

  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSquads()
    }
  }, [user, fetchSquads])

  const handleJoinParty = async (squadId: string) => {
    if (!user || !profile) return
    const channelName = `squad-${squadId}`
    const squad = squads.find(s => s.id === squadId)
    const success = await joinChannel(channelName, user.id, profile.username || 'Joueur')
    if (success) {
      setToastMessage(`Tu as rejoint la party ${squad?.name || ''}`)
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
    <div className="min-h-screen bg-[#08090a] pb-24">
      {/* Toast de notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header compact */}
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[22px] font-bold text-[#f7f8f8]">Party</h1>
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
          </motion.div>

          {/* Loading */}
          {squadsLoading ? (
            <motion.div variants={itemVariants} className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
            </motion.div>
          ) : squads.length === 0 ? (
            /* État vide */
            <motion.div variants={itemVariants}>
              <Card className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#1f2023] flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-7 h-7 text-[#5e6063]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-2">
                  Pas encore de squad
                </h3>
                <p className="text-[14px] text-[#8b8d90] mb-6 max-w-[260px] mx-auto">
                  Crée ou rejoins une squad pour accéder aux parties vocales.
                </p>
                <Link to="/squads">
                  <Button>
                    <Users className="w-4 h-4" />
                    Mes squads
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ) : (
            <>
              {/* Party Active (en haut, grande) */}
              {isConnected && activeSquad && (
                <motion.div variants={itemVariants} className="mb-6">
                  <ActivePartySection
                    squad={{
                      id: activeSquad.id,
                      name: activeSquad.name,
                      game: activeSquad.game || 'Jeu'
                    }}
                    onLeave={handleLeaveParty}
                  />
                </motion.div>
              )}

              {/* Autres squads (compactes) */}
              {otherSquads.length > 0 && (
                <motion.div variants={itemVariants}>
                  {isConnected && (
                    <h2 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide mb-3">
                      Autres squads
                    </h2>
                  )}
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
                </motion.div>
              )}

              {/* Si pas connecté et une seule squad */}
              {!isConnected && squads.length === 1 && (
                <motion.div variants={itemVariants}>
                  <Card className="p-6 text-center">
                    <Mic className="w-10 h-10 mx-auto mb-4 text-[#5e6dd2]" />
                    <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-2">
                      Prêt à parler ?
                    </h3>
                    <p className="text-[13px] text-[#8b8d90] mb-4">
                      Rejoins la party de {squads[0].name}
                    </p>
                    <Button onClick={() => handleJoinParty(squads[0].id)} disabled={isConnecting}>
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                      Rejoindre la party
                    </Button>
                  </Card>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Party
