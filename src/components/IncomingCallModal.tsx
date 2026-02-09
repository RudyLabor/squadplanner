import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff } from 'lucide-react'
import { useVoiceCallStore } from '../hooks/useVoiceCall'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useRingtone } from '../hooks/useRingtone'

export function IncomingCallModal() {
  const {
    status,
    caller,
    acceptCall,
    rejectCall,
  } = useVoiceCallStore()

  // Only show for incoming calls (ringing state)
  const shouldShow = status === 'ringing' || status === 'missed' || status === 'rejected'

  // Play ringtone when ringing
  useRingtone(status === 'ringing')

  // Focus trap et gestion Escape pour l'accessibilité
  const focusTrapRef = useFocusTrap<HTMLDivElement>(shouldShow, rejectCall)

  if (!shouldShow || !caller) return null

  const initial = caller.username?.charAt(0).toUpperCase() || '?'

  const getStatusText = () => {
    switch (status) {
      case 'ringing':
        return 'Appel entrant...'
      case 'missed':
        return 'Appel manque'
      case 'rejected':
        return 'Appel refuse'
      default:
        return ''
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="incoming-call-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-bg-base/95 backdrop-blur-xl flex flex-col"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-10 blur-[100px]" />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
          {/* Avatar with ring animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative mb-8"
          >
            {/* Animated rings for ringing state - reduced to 2 rings with limited repeats */}
            {status === 'ringing' && (
              <>
                <motion.div
                  className="absolute inset-[-20px] rounded-full border-2 border-success/30"
                  animate={{
                    scale: [1, 1.3, 1.3],
                    opacity: [0.5, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: 3,
                    ease: 'easeOut',
                  }}
                />
                <motion.div
                  className="absolute inset-[-20px] rounded-full border-2 border-success/30"
                  animate={{
                    scale: [1, 1.3, 1.3],
                    opacity: [0.5, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: 3,
                    ease: 'easeOut',
                    delay: 0.75,
                  }}
                />
              </>
            )}

            {/* Shake animation for avatar - limited repeats */}
            <motion.div
              animate={status === 'ringing' ? {
                rotate: [-2, 2, -2, 2, 0],
              } : {}}
              transition={{
                duration: 0.5,
                repeat: status === 'ringing' ? 3 : 0,
                repeatDelay: 0.8,
              }}
              className="w-32 h-32 rounded-full overflow-hidden bg-primary-20 flex items-center justify-center border-4 border-[#34d399]/50"
            >
              {caller.avatar_url ? (
                <img
                  src={caller.avatar_url}
                  alt={caller.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-[#6366f1]">{initial}</span>
              )}
            </motion.div>

            {/* Phone icon badge */}
            {status === 'ringing' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#34d399] flex items-center justify-center shadow-lg shadow-[#34d399]/20"
              >
                <motion.div
                  animate={{ rotate: [0, 12, -12, 12, -12, 0] }}
                  transition={{
                    duration: 0.5,
                    repeat: 2,
                    repeatDelay: 1.5,
                  }}
                >
                  <Phone className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* Name */}
          <motion.h2
            id="incoming-call-title"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-[#f7f8f8] mb-2"
          >
            Appel de {caller.username}
          </motion.h2>

          {/* Status */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-base ${
              status === 'ringing' ? 'text-[#34d399]' : 'text-[#8b8d90]'
            }`}
          >
            {getStatusText()}
          </motion.p>
        </div>

        {/* Controls */}
        {status === 'ringing' && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="px-6 pb-12"
          >
            <div className="flex items-center justify-center gap-12">
              {/* Reject button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={rejectCall}
                  aria-label="Refuser l'appel"
                  className="w-20 h-20 rounded-full bg-[#fb7185] flex items-center justify-center shadow-lg shadow-[#fb7185]/20 active:scale-95 transition-transform touch-manipulation"
                >
                  <PhoneOff className="w-8 h-8 text-white" aria-hidden="true" />
                </button>
                <span className="text-[13px] text-[#8b8d90]" aria-hidden="true">Refuser</span>
              </div>

              {/* Accept button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={acceptCall}
                  aria-label="Accepter l'appel"
                  className="w-20 h-20 rounded-full bg-[#34d399] flex items-center justify-center shadow-lg shadow-[#34d399]/20 active:scale-95 transition-transform touch-manipulation"
                >
                  <Phone className="w-8 h-8 text-white" aria-hidden="true" />
                </button>
                <span className="text-[13px] text-[#8b8d90]" aria-hidden="true">Accepter</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default IncomingCallModal
