import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Users,
  Volume2,
  Loader2,
  AlertCircle,
  Gamepad2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { useAuthStore, useSquadsStore, useVoiceChatStore } from '../hooks'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

// Participant avatar component
function ParticipantAvatar({
  username,
  isSpeaking,
  isMuted,
  isLocal
}: {
  username: string
  isSpeaking: boolean
  isMuted: boolean
  isLocal?: boolean
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
    >
      <div className={`
        relative w-16 h-16 rounded-full flex items-center justify-center
        ${isSpeaking
          ? 'bg-[#4ade80] ring-4 ring-[#4ade80]/30'
          : 'bg-[rgba(94,109,210,0.15)]'
        }
        transition-all duration-200
      `}>
        <span className="text-xl font-bold text-white">
          {username.charAt(0).toUpperCase()}
        </span>
        {isMuted && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#ef4444] flex items-center justify-center">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <span className={`text-[12px] font-medium ${isLocal ? 'text-[#5e6dd2]' : 'text-[#8b8d90]'}`}>
        {isLocal ? 'Toi' : username}
      </span>
    </motion.div>
  )
}

// Squad party card component
function SquadPartyCard({
  squad,
  isActive,
  isConnecting,
  onJoin,
  onLeave
}: {
  squad: {
    id: string
    name: string
    game: string
    member_count: number
  }
  isActive: boolean
  isConnecting: boolean
  onJoin: () => void
  onLeave: () => void
}) {
  const {
    localUser,
    remoteUsers,
    isMuted,
    toggleMute,
    error
  } = useVoiceChatStore()

  const participants = [
    ...(localUser ? [{ ...localUser, isLocal: true }] : []),
    ...remoteUsers.map(u => ({ ...u, isLocal: false }))
  ]

  return (
    <div>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
                <Users className="w-6 h-6 text-[#5e6dd2]" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#f7f8f8]">{squad.name}</h3>
                <div className="flex items-center gap-2 text-[13px] text-[#8b8d90]">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>{squad.game}</span>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className={`
              px-3 py-1.5 rounded-full text-[12px] font-medium
              ${isActive
                ? 'bg-[#4ade80]/15 text-[#4ade80]'
                : 'bg-[rgba(255,255,255,0.05)] text-[#5e6063]'
              }
            `}>
              {isActive ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                  En ligne
                </span>
              ) : (
                'Hors ligne'
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && isActive && (
          <div className="px-4 py-3 bg-[#ef4444]/10 border-b border-[#ef4444]/20">
            <div className="flex items-center gap-2 text-[#ef4444] text-[13px]">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Participants grid */}
        {isActive && participants.length > 0 && (
          <div className="p-6 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <AnimatePresence mode="popLayout">
                {participants.map((p) => (
                  <motion.div
                    key={p.odrop.toString()}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <ParticipantAvatar
                      username={p.username}
                      isSpeaking={p.isSpeaking}
                      isMuted={p.isMuted}
                      isLocal={p.isLocal}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-4">
          <div className="flex items-center justify-center gap-3">
            {isActive ? (
              <>
                {/* Mute button */}
                <motion.button
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${isMuted
                      ? 'bg-[#ef4444]/15 text-[#ef4444]'
                      : 'bg-[rgba(255,255,255,0.05)] text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.1)]'
                    }
                    transition-colors
                  `}
                  onClick={toggleMute}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </motion.button>

                {/* Leave button */}
                <motion.button
                  className="w-12 h-12 rounded-full bg-[#ef4444] text-white flex items-center justify-center"
                  onClick={onLeave}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PhoneOff className="w-5 h-5" />
                </motion.button>

                {/* Volume indicator */}
                <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#8b8d90]">
                  <Volume2 className="w-5 h-5" />
                </div>
              </>
            ) : (
              <Button
                onClick={onJoin}
                disabled={isConnecting}
                className="flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    Rejoindre la party
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Link to squad detail */}
        <div className="px-4 pb-4">
          <Link
            to={`/squad/${squad.id}`}
            className="block text-center text-[13px] text-[#5e6dd2] hover:text-[#8b93ff] transition-colors"
          >
            Voir la squad →
          </Link>
        </div>
      </Card>
    </div>
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

  useEffect(() => {
    if (user) {
      fetchSquads()
    }
  }, [user, fetchSquads])

  const handleJoinParty = async (squadId: string) => {
    if (!user || !profile) return
    const channelName = `squad-${squadId}`
    await joinChannel(channelName, user.id, profile.username || 'Joueur')
  }

  const handleLeaveParty = async () => {
    await leaveChannel()
  }

  const getActiveSquadId = () => {
    if (!currentChannel) return null
    return currentChannel.replace('squad-', '')
  }

  const activeSquadId = getActiveSquadId()

  return (
    <div className="min-h-screen bg-[#08090a] pb-8">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-2xl font-bold text-[#f7f8f8] mb-2">Party Vocale</h1>
            <p className="text-[14px] text-[#8b8d90]">
              Rejoins la party de ta squad et discute avec tes amis
            </p>
          </motion.div>

          {/* Active party indicator */}
          {isConnected && (
            <motion.div
              variants={itemVariants}
              className="mb-6 p-4 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="text-[14px] text-[#4ade80] font-medium">
                  Tu es connecté à une party
                </span>
              </div>
            </motion.div>
          )}

          {/* Loading state */}
          {squadsLoading ? (
            <motion.div variants={itemVariants} className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
            </motion.div>
          ) : squads.length === 0 ? (
            /* Empty state */
            <motion.div variants={itemVariants}>
              <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#18191b] to-[#101012] border border-[rgba(255,255,255,0.06)] text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#1f2023] flex items-center justify-center mx-auto mb-6">
                  <Mic className="w-8 h-8 text-[#5e6063]" strokeWidth={1.2} />
                </div>
                <h3 className="text-[18px] font-bold text-[#f7f8f8] mb-2">Pas encore de squad</h3>
                <p className="text-[14px] text-[#8b8d90] mb-8">
                  Crée ou rejoins une squad pour accéder aux parties vocales
                </p>
                <Link to="/squads">
                  <motion.button
                    className="inline-flex items-center gap-2.5 h-12 px-7 rounded-xl bg-[#5e6dd2] text-white text-[15px] font-semibold shadow-lg shadow-[#5e6dd2]/20"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Users className="w-5 h-5" />
                    Mes squads
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Squad list */
            <motion.div variants={itemVariants} className="space-y-4">
              {squads.map((squad) => (
                <SquadPartyCard
                  key={squad.id}
                  squad={{
                    id: squad.id,
                    name: squad.name,
                    game: squad.game || 'Jeu non défini',
                    member_count: squad.member_count || 0
                  }}
                  isActive={activeSquadId === squad.id}
                  isConnecting={isConnecting && !isConnected}
                  onJoin={() => handleJoinParty(squad.id)}
                  onLeave={handleLeaveParty}
                />
              ))}
            </motion.div>
          )}

          {/* Info section */}
          <motion.div variants={itemVariants} className="mt-8">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(94,109,210,0.15)] flex items-center justify-center flex-shrink-0">
                  <Volume2 className="w-4 h-4 text-[#5e6dd2]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-medium text-[#f7f8f8] mb-1">
                    Party persistante
                  </h4>
                  <p className="text-[13px] text-[#8b8d90]">
                    La party de ta squad reste active même quand tu quittes l'app.
                    Rejoins-la à tout moment pour discuter avec tes amis,
                    que vous ayez une session prévue ou non.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Party
