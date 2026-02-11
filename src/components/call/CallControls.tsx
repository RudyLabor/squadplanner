import { m } from 'framer-motion'
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'

interface CallControlsProps {
  status: string
  isMuted: boolean
  isSpeakerOn: boolean
  toggleMute: () => void
  toggleSpeaker: () => void
  endCall: () => void
}

export function CallControls({ status, isMuted, isSpeakerOn, toggleMute, toggleSpeaker, endCall }: CallControlsProps) {
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
              isMuted
                ? 'bg-border-hover'
                : 'bg-border-subtle'
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
            onClick={toggleSpeaker}
            aria-label={isSpeakerOn ? 'Désactiver le haut-parleur' : 'Activer le haut-parleur'}
            aria-pressed={isSpeakerOn}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              !isSpeakerOn
                ? 'bg-border-hover'
                : 'bg-border-subtle'
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
