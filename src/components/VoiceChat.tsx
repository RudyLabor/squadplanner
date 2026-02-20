
import { useEffect, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { useVoiceChatStore } from '../hooks/useVoiceChat'
import { useAuthStore, usePremiumStore } from '../hooks'
import { Button } from './ui'

interface VoiceChatProps {
  sessionId: string
  sessionTitle?: string
}

export function VoiceChat({ sessionId, sessionTitle }: VoiceChatProps) {
  const { user, profile } = useAuthStore()
  const { hasPremium } = usePremiumStore()
  const {
    isConnected,
    isConnecting,
    isMuted,
    localUser,
    remoteUsers,
    error,
    joinChannel,
    leaveChannel,
    toggleMute,
    clearError,
  } = useVoiceChatStore()

  const channelName = `session-${sessionId}`

  // Store refs to avoid stale closures in cleanup
  const isConnectedRef = useRef(isConnected)
  const leaveChannelRef = useRef(leaveChannel)

  // Update refs in effect to avoid updating during render
  useEffect(() => {
    isConnectedRef.current = isConnected
    leaveChannelRef.current = leaveChannel
  })

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isConnectedRef.current) {
        leaveChannelRef.current()
      }
    }
  }, [])

  const handleJoin = async () => {
    if (!user || !profile) return
    // Premium users get HD audio quality (48kHz stereo, 192 Kbps)
    await joinChannel(channelName, user.id, profile.username || 'Anonyme', hasPremium)
  }

  const handleLeave = async () => {
    await leaveChannel()
  }

  const allUsers = [
    ...(localUser ? [{ ...localUser, isLocal: true }] : []),
    ...remoteUsers.map((u) => ({ ...u, isLocal: false })),
  ]

  return (
    <div className="bg-elevated rounded-xl p-4 border border-border-subtle">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-overlay-heavy'}`}
          />
          <span className="text-sm font-medium">
            {isConnected ? 'Vocal connecté' : 'Chat Vocal'}
          </span>
        </div>
        {isConnected && (
          <span className="text-xs text-secondary">
            {allUsers.length} participant{allUsers.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg"
          >
            <p className="text-sm text-danger">{error}</p>
            <button onClick={clearError} className="text-xs text-danger/70 hover:text-danger mt-1">
              Fermer
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* Not connected state */}
      {!isConnected && (
        <div className="text-center py-4">
          <p className="text-secondary text-sm mb-4">
            Rejoins le vocal pour parler avec ta squad pendant la session
          </p>
          <Button onClick={handleJoin} disabled={isConnecting} className="w-full">
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Connexion...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                Rejoindre le vocal
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Connected state */}
      {isConnected && (
        <>
          {/* Participants */}
          <div className="space-y-2 mb-4">
            {allUsers.map((participant) => (
              <m.div
                key={String(participant.odrop)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  participant.isSpeaking ? 'bg-primary/10' : 'bg-overlay-subtle'
                }`}
              >
                {/* Avatar with speaking indicator */}
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium ${
                      participant.isSpeaking
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-elevated avatar-speaking'
                        : ''
                    }`}
                  >
                    {participant.username.charAt(0).toUpperCase()}
                  </div>
                  {participant.isMuted && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-danger rounded-full flex items-center justify-center">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 3.636a1 1 0 010 1.414L7.172 7.172H4a1 1 0 000 2h3.172l-2.122 2.122a1 1 0 101.414 1.414l2.122-2.122V14a1 1 0 102 0v-3.172l2.122 2.122a1 1 0 001.414-1.414L11.828 9.414l2.122-2.122a1 1 0 00-1.414-1.414L10.414 8V4a1 1 0 10-2 0v4.172L6.464 5.05a1 1 0 00-1.414-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {participant.username}
                    {participant.isLocal && (
                      <span className="text-xs text-secondary ml-1">(toi)</span>
                    )}
                  </p>
                </div>

                {/* Speaking indicator */}
                {participant.isSpeaking && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <m.div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        animate={{
                          height: [4, 12, 4],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: 3,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                )}
              </m.div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              variant={isMuted ? 'danger' : 'secondary'}
              onClick={toggleMute}
              className="flex-1"
            >
              {isMuted ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Muet
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Micro
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={handleLeave}
              aria-label="Quitter le vocal"
              className="text-danger hover:bg-danger/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </Button>
          </div>
        </>
      )}

      {/* Session info */}
      {sessionTitle && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <p className="text-xs text-secondary text-center">Session: {sessionTitle}</p>
        </div>
      )}
    </div>
  )
}
