import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from '../icons'

interface CallControlsProps {
  status: string
  isMuted: boolean
  isSpeakerOn: boolean
  toggleMute: () => void
  toggleSpeaker: () => void
  endCall: () => void
  volume?: number
  onVolumeChange?: (volume: number) => void
}

export function CallControls({
  status,
  isMuted,
  isSpeakerOn,
  toggleMute,
  toggleSpeaker,
  endCall,
  volume = 100,
  onVolumeChange,
}: CallControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  const handleSpeakerClick = () => {
    if (onVolumeChange) {
      setShowVolumeSlider((prev) => !prev)
    } else {
      toggleSpeaker()
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10)
    onVolumeChange?.(newVolume)
  }

  const displayVolume = isSpeakerOn ? volume : 0
  const fillPercent = displayVolume / 100

  return (
    <m.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="px-6 pb-12"
    >
      <div className="flex items-center justify-center gap-6">
        {/* Mute button */}
        {status === 'connected' && (
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            aria-label={isMuted ? 'Réactiver le micro' : 'Couper le micro'}
            aria-pressed={isMuted}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-border-hover' : 'bg-border-subtle'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-7 h-7 text-error" aria-hidden="true" />
            ) : (
              <Mic className="w-7 h-7 text-text-secondary" aria-hidden="true" />
            )}
          </m.button>
        )}

        {/* End call button */}
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={endCall}
          aria-label="Raccrocher"
          className="w-20 h-20 rounded-full bg-error flex items-center justify-center shadow-lg shadow-error/20"
        >
          <PhoneOff className="w-8 h-8 text-white" aria-hidden="true" />
        </m.button>

        {/* Speaker button */}
        {status === 'connected' && (
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSpeakerClick}
            aria-label={isSpeakerOn ? 'Désactiver le haut-parleur' : 'Activer le haut-parleur'}
            aria-pressed={isSpeakerOn}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              !isSpeakerOn ? 'bg-border-hover' : 'bg-border-subtle'
            }`}
          >
            {isSpeakerOn ? (
              <Volume2 className="w-7 h-7 text-text-secondary" aria-hidden="true" />
            ) : (
              <VolumeX className="w-7 h-7 text-error" aria-hidden="true" />
            )}
          </m.button>
        )}
      </div>

      {/* Volume slider */}
      <AnimatePresence>
        {showVolumeSlider && status === 'connected' && onVolumeChange && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 px-4"
          >
            <div className="flex items-center gap-3 max-w-xs mx-auto">
              <m.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onVolumeChange(isSpeakerOn ? 0 : 100)
                }}
                className="flex-shrink-0"
                aria-label={isSpeakerOn ? 'Couper le son' : 'Remettre le son'}
              >
                {isSpeakerOn ? (
                  <Volume2 className="w-5 h-5 text-text-secondary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-error" />
                )}
              </m.button>

              <div className="relative flex-1 h-6 flex items-center">
                <div className="absolute inset-x-0 h-1.5 rounded-full bg-overlay-light overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-100"
                    style={{ width: `${fillPercent * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={displayVolume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Volume"
                />
              </div>

              <span className="flex-shrink-0 text-sm font-medium text-text-secondary tabular-nums min-w-[36px] text-right">
                {displayVolume}%
              </span>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Hint text */}
      {status === 'calling' && (
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-base text-text-tertiary mt-6"
        >
          En attente de réponse...
        </m.p>
      )}
    </m.div>
  )
}
