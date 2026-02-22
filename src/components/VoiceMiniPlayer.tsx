import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { m, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, PhoneOff } from './icons'

/**
 * Floating mini-player that shows when voice chat is active.
 * Persists across all pages. Hidden on /party to avoid duplication.
 * Lazy-loaded in ClientShell — only rendered for authenticated users.
 */
export function VoiceMiniPlayer() {
  const location = useLocation()
  const navigate = useNavigate()
  const [voiceState, setVoiceState] = useState<{
    isConnected: boolean
    isMuted: boolean
    currentChannel: string | null
    localUser: { username: string } | null
    remoteUsers: { odrop: string }[]
  }>({ isConnected: false, isMuted: false, currentChannel: null, localUser: null, remoteUsers: [] })
  const [actions, setActions] = useState<{
    toggleMute: () => Promise<void>
    leaveChannel: () => Promise<void>
  } | null>(null)

  useEffect(() => {
    let unsub: (() => void) | undefined
    import('../hooks/useVoiceChat').then(({ useVoiceChatStore }) => {
      const update = (state: {
        isConnected: boolean
        isMuted: boolean
        currentChannel: string | null
        localUser: { username: string } | null
        remoteUsers: { odrop: string }[]
        toggleMute: () => Promise<void>
        leaveChannel: () => Promise<void>
      }) => {
        setVoiceState({
          isConnected: state.isConnected,
          isMuted: state.isMuted,
          currentChannel: state.currentChannel,
          localUser: state.localUser,
          remoteUsers: state.remoteUsers,
        })
        setActions({ toggleMute: state.toggleMute, leaveChannel: state.leaveChannel })
      }
      update(useVoiceChatStore.getState())
      unsub = useVoiceChatStore.subscribe(update)
    })
    return () => { unsub?.() }
  }, [])

  const { isConnected, isMuted, currentChannel, localUser, remoteUsers } = voiceState
  const isOnPartyPage = location.pathname === '/party' || location.pathname.startsWith('/party/')

  // Don't show on /party page (ActivePartySection handles it there)
  if (!isConnected || isOnPartyPage) return null

  const participantCount = (localUser ? 1 : 0) + remoteUsers.length

  const handleNavigateToParty = () => {
    navigate('/party')
  }

  const handleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    actions?.toggleMute()
  }

  const handleLeave = (e: React.MouseEvent) => {
    e.stopPropagation()
    actions?.leaveChannel()
  }

  return (
    <AnimatePresence>
      {isConnected && (
        <m.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-40"
        >
          <div
            onClick={handleNavigateToParty}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNavigateToParty() }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-card backdrop-blur-lg border border-success/30 shadow-lg cursor-pointer hover:border-success/50 transition-colors"
          >
            {/* Pulsing indicator */}
            <div className="relative flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-success" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-success animate-ping opacity-40" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                Vocal actif
              </p>
              <p className="text-xs text-text-secondary truncate">
                {participantCount} participant{participantCount > 1 ? 's' : ''}
                {currentChannel && (
                  <span className="ml-1 text-text-tertiary">
                    &middot; Aller à la party
                  </span>
                )}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <m.button
                onClick={handleMute}
                whileTap={{ scale: 0.9 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? 'bg-error/20 text-error'
                    : 'bg-success/20 text-success'
                }`}
                aria-label={isMuted ? 'Activer le micro' : 'Couper le micro'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </m.button>

              <m.button
                onClick={handleLeave}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full bg-error/20 text-error flex items-center justify-center hover:bg-error/30 transition-colors"
                aria-label="Quitter le vocal"
              >
                <PhoneOff className="w-4 h-4" />
              </m.button>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
