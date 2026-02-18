
import { useEffect, useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  PhoneOff,
  UserPlus,
  Radio,
  ShieldCheck,
  WifiOff,
  AlertCircle,
  Loader2,
} from '../../components/icons'
import { Link } from 'react-router'
import { Card } from '../../components/ui'
import { useVoiceChatStore } from '../../hooks/useVoiceChat'
import { NetworkQualityIndicator } from '../../components/NetworkQualityIndicator'
import { useNetworkQualityStore } from '../../hooks/useNetworkQuality'
import { VoiceWaveformDemo } from '../../components/VoiceWaveform'
import { ParticipantVolumeControl } from '../../components/ParticipantVolumeControl'
import { useParticipantVolumes } from '../../hooks/useParticipantVolumes'
import { InviteToPartyModal } from '../../components/InviteToPartyModal'
import { ParticipantAvatar } from './ParticipantAvatar'

export function ActivePartySection({
  squad,
  onLeave,
  currentUserId,
}: {
  squad: { id: string; name: string; game: string }
  onLeave: () => void
  currentUserId: string
}) {
  const {
    localUser,
    remoteUsers,
    isMuted,
    toggleMute,
    error,
    isReconnecting,
    reconnectAttempts,
    pushToTalkEnabled,
    pushToTalkActive,
    setPushToTalk,
    pushToTalkStart,
    pushToTalkEnd,
    noiseSuppressionEnabled,
    toggleNoiseSuppression,
  } = useVoiceChatStore()
  // 'room' may not exist on VoiceChatState yet — cast to access safely
  const room = (useVoiceChatStore.getState() as any).room
  const { localQuality } = useNetworkQualityStore()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const {
    getVolume,
    setVolume,
    isMuted: isParticipantMuted,
    setMuted,
    getEffectiveVolume,
  } = useParticipantVolumes()

  useEffect(() => {
    if (!room) return
    interface RemoteRoomUser {
      uid: string
      audioTrack?: { setVolume: (v: number) => void }
    }
    remoteUsers.forEach((user) => {
      const remoteUser = (room as { remoteUsers?: RemoteRoomUser[] }).remoteUsers?.find(
        (u) => u.uid === user.odrop
      )
      if (remoteUser?.audioTrack) {
        const effectiveVolume = getEffectiveVolume(String(user.odrop))
        remoteUser.audioTrack.setVolume(effectiveVolume)
      }
    })
  }, [room, remoteUsers, getEffectiveVolume])

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

  const partyLink = `${window.location.origin}/squad/${squad.id}?join=party`
  const connectedUserIds = remoteUsers.map((u) => String(u.odrop))
  const participants = [
    ...(localUser ? [{ ...localUser, isLocal: true }] : []),
    ...remoteUsers.map((u) => ({ ...u, isLocal: false })),
  ]

  return (
    <Card className="p-0 overflow-hidden border-success/30 bg-gradient-to-b from-success/5 to-transparent">
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
            {localQuality !== 'unknown' && (
              <NetworkQualityIndicator size="sm" showLabel showTooltip />
            )}
            <m.button
              onClick={() => setShowInviteModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-primary-15 text-primary hover:bg-primary-20"
            >
              <UserPlus className="w-3.5 h-3.5" /> Inviter
            </m.button>
            <Link to={`/squad/${squad.id}`}>
              <span className="text-sm text-primary hover:text-purple">Voir la squad</span>
            </Link>
          </div>
        </div>
      </div>

      {isReconnecting && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-3 bg-warning/10 border-b border-warning/20"
        >
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-warning animate-pulse" />
            <div className="flex-1">
              <p className="text-base font-medium text-warning">Reconnexion en cours...</p>
              <p className="text-xs text-warning/70">Tentative {reconnectAttempts}/3</p>
            </div>
            <Loader2 className="w-5 h-5 text-warning animate-spin" />
          </div>
        </m.div>
      )}

      {error && (
        <div className="px-4 py-3 bg-error/10 text-error text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="p-6 bg-surface-dark">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <AnimatePresence mode="popLayout">
            {participants.map((p) => {
              const participantId = String(p.odrop)
              const isRemote = !p.isLocal
              const participantMuted = isRemote ? isParticipantMuted(participantId) : false
              return (
                <m.div
                  key={participantId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-3"
                >
                  <ParticipantAvatar
                    username={p.username}
                    isSpeaking={p.isSpeaking && !participantMuted}
                    isMuted={p.isMuted}
                    isLocal={p.isLocal}
                    size="lg"
                  />
                  <div className="h-6">
                    <VoiceWaveformDemo
                      isActive={p.isSpeaking && !participantMuted}
                      size="sm"
                      color={p.isLocal ? 'var(--color-primary)' : 'var(--color-success)'}
                      barCount={5}
                    />
                  </div>
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
                </m.div>
              )
            })}
          </AnimatePresence>
        </div>
        {participants.length === 1 && (
          <m.div className="text-center mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-base text-text-secondary">Invite tes potes ! La party t'attend</p>
          </m.div>
        )}
      </div>

      <div className="p-4 flex items-center justify-center gap-3">
        <m.button
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${noiseSuppressionEnabled ? 'bg-primary-20 text-primary-hover' : 'bg-border-default text-text-tertiary'}`}
          onClick={toggleNoiseSuppression}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={
            noiseSuppressionEnabled
              ? 'Désactiver la suppression de bruit'
              : 'Activer la suppression de bruit'
          }
        >
          <ShieldCheck className="w-4 h-4" />
        </m.button>
        <m.button
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${pushToTalkEnabled ? 'bg-warning/20 text-warning' : 'bg-border-default text-text-tertiary'}`}
          onClick={() => setPushToTalk(!pushToTalkEnabled)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={pushToTalkEnabled ? 'Désactiver Push-to-Talk' : 'Activer Push-to-Talk (Espace)'}
        >
          <Radio className="w-4 h-4" />
        </m.button>
        <div className="relative">
          {!isMuted && (
            <m.div
              className="absolute inset-0 w-14 h-14 rounded-full bg-success"
              animate={{ scale: [1, 1.2], opacity: [0.2, 0] }}
              transition={{ duration: 1.5, repeat: 2 }}
            />
          )}
          {pushToTalkEnabled ? (
            <m.button
              className={`relative w-14 h-14 rounded-full flex items-center justify-center ${pushToTalkActive ? 'bg-success text-bg-base' : 'bg-warning text-bg-base'} transition-colors`}
              onMouseDown={pushToTalkStart}
              onMouseUp={pushToTalkEnd}
              onMouseLeave={pushToTalkEnd}
              onTouchStart={pushToTalkStart}
              onTouchEnd={pushToTalkEnd}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {pushToTalkActive ? <Mic className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
            </m.button>
          ) : (
            <m.button
              className={`relative w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-error text-white' : 'bg-success text-bg-base'} transition-colors`}
              onClick={toggleMute}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </m.button>
          )}
        </div>
        <m.button
          className="w-14 h-14 rounded-full bg-error text-white flex items-center justify-center"
          onClick={onLeave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PhoneOff className="w-6 h-6" />
        </m.button>
      </div>

      <p className="text-center text-xs text-text-tertiary pb-4">
        {pushToTalkEnabled
          ? pushToTalkActive
            ? 'Parle maintenant...'
            : 'Maintiens Espace pour parler'
          : isMuted
            ? 'Micro coupé'
            : 'Micro actif'}
        {noiseSuppressionEnabled && (
          <span className="ml-2 text-primary-hover">• Bruit supprimé</span>
        )}
      </p>

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
