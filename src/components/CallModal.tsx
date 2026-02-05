import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react'
import { useVoiceCallStore, formatCallDuration } from '../hooks/useVoiceCall'

export function CallModal() {
  const {
    status,
    isMuted,
    isSpeakerOn,
    callDuration,
    caller,
    receiver,
    isIncoming,
    toggleMute,
    toggleSpeaker,
    endCall,
  } = useVoiceCallStore()

  // Only show for outgoing calls or connected calls
  const shouldShow = status === 'calling' || status === 'connected' || status === 'ended'

  // Get the other person's info
  const otherPerson = isIncoming ? caller : receiver

  if (!shouldShow || !otherPerson) return null

  const getStatusText = () => {
    switch (status) {
      case 'calling':
        return 'Appel en cours...'
      case 'connected':
        return formatCallDuration(callDuration)
      case 'ended':
        return 'Appel termine'
      default:
        return ''
    }
  }

  const initial = otherPerson.username?.charAt(0).toUpperCase() || '?'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#08090a] flex flex-col"
      >
        {/* Close button for calling state */}
        {status === 'calling' && (
          <button
            onClick={endCall}
            className="absolute top-4 right-4 p-2 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] transition-colors"
          >
            <X className="w-6 h-6 text-[#c9cace]" />
          </button>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative mb-8"
          >
            {/* Pulse animation for calling state */}
            {status === 'calling' && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#5e6dd2]/20"
                  animate={{
                    scale: [1, 1.5, 1.5],
                    opacity: [0.5, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#5e6dd2]/20"
                  animate={{
                    scale: [1, 1.5, 1.5],
                    opacity: [0.5, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: 0.5,
                  }}
                />
              </>
            )}

            {/* Connected indicator */}
            {status === 'connected' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#22c55e] border-4 border-[#08090a] flex items-center justify-center"
              >
                <Phone className="w-3 h-3 text-white" />
              </motion.div>
            )}

            {/* Avatar image or initial */}
            <div className="w-32 h-32 rounded-full overflow-hidden bg-[rgba(94,109,210,0.2)] flex items-center justify-center">
              {otherPerson.avatar_url ? (
                <img
                  src={otherPerson.avatar_url}
                  alt={otherPerson.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-[#5e6dd2]">{initial}</span>
              )}
            </div>
          </motion.div>

          {/* Name */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-[#f7f8f8] mb-2"
          >
            {otherPerson.username}
          </motion.h2>

          {/* Status */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-base ${
              status === 'connected' ? 'text-[#22c55e]' : 'text-[#8b8d90]'
            }`}
          >
            {getStatusText()}
          </motion.p>
        </div>

        {/* Controls */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="px-6 pb-12"
        >
          <div className="flex items-center justify-center gap-6">
            {/* Mute button */}
            {status === 'connected' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? 'bg-[rgba(255,255,255,0.1)]'
                    : 'bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-7 h-7 text-[#ef4444]" />
                ) : (
                  <Mic className="w-7 h-7 text-[#c9cace]" />
                )}
              </motion.button>
            )}

            {/* End call button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={endCall}
              className="w-20 h-20 rounded-full bg-[#ef4444] flex items-center justify-center shadow-lg shadow-[#ef4444]/30"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </motion.button>

            {/* Speaker button */}
            {status === 'connected' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleSpeaker}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  !isSpeakerOn
                    ? 'bg-[rgba(255,255,255,0.1)]'
                    : 'bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                {isSpeakerOn ? (
                  <Volume2 className="w-7 h-7 text-[#c9cace]" />
                ) : (
                  <VolumeX className="w-7 h-7 text-[#ef4444]" />
                )}
              </motion.button>
            )}
          </div>

          {/* Hint text */}
          {status === 'calling' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center text-[13px] text-[#5e6063] mt-6"
            >
              En attente de reponse...
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CallModal
