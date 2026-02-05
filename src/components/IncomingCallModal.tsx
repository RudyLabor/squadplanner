import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff } from 'lucide-react'
import { useVoiceCallStore } from '../hooks/useVoiceCall'

export function IncomingCallModal() {
  const {
    status,
    caller,
    acceptCall,
    rejectCall,
  } = useVoiceCallStore()

  // Only show for incoming calls (ringing state)
  const shouldShow = status === 'ringing' || status === 'missed' || status === 'rejected'

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#08090a]/95 backdrop-blur-xl flex flex-col"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#5e6dd2]/10 blur-[120px]" />
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
            {/* Animated rings for ringing state */}
            {status === 'ringing' && (
              <>
                <motion.div
                  className="absolute inset-[-20px] rounded-full border-2 border-[#22c55e]/30"
                  animate={{
                    scale: [1, 1.3, 1.3],
                    opacity: [0.6, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
                <motion.div
                  className="absolute inset-[-20px] rounded-full border-2 border-[#22c55e]/30"
                  animate={{
                    scale: [1, 1.3, 1.3],
                    opacity: [0.6, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: 0.5,
                  }}
                />
                <motion.div
                  className="absolute inset-[-20px] rounded-full border-2 border-[#22c55e]/30"
                  animate={{
                    scale: [1, 1.3, 1.3],
                    opacity: [0.6, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: 1,
                  }}
                />
              </>
            )}

            {/* Shake animation for avatar */}
            <motion.div
              animate={status === 'ringing' ? {
                rotate: [-3, 3, -3, 3, 0],
              } : {}}
              transition={{
                duration: 0.5,
                repeat: status === 'ringing' ? Infinity : 0,
                repeatDelay: 0.5,
              }}
              className="w-32 h-32 rounded-full overflow-hidden bg-[rgba(94,109,210,0.2)] flex items-center justify-center border-4 border-[#22c55e]/50"
            >
              {caller.avatar_url ? (
                <img
                  src={caller.avatar_url}
                  alt={caller.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-[#5e6dd2]">{initial}</span>
              )}
            </motion.div>

            {/* Phone icon badge */}
            {status === 'ringing' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center shadow-lg shadow-[#22c55e]/30"
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 15, -15, 0] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                >
                  <Phone className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* Name */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-[#f7f8f8] mb-2"
          >
            {caller.username}
          </motion.h2>

          {/* Status */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-base ${
              status === 'ringing' ? 'text-[#22c55e]' : 'text-[#8b8d90]'
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={rejectCall}
                  className="w-20 h-20 rounded-full bg-[#ef4444] flex items-center justify-center shadow-lg shadow-[#ef4444]/30"
                >
                  <PhoneOff className="w-8 h-8 text-white" />
                </motion.button>
                <span className="text-[13px] text-[#8b8d90]">Refuser</span>
              </div>

              {/* Accept button */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={acceptCall}
                  className="w-20 h-20 rounded-full bg-[#22c55e] flex items-center justify-center shadow-lg shadow-[#22c55e]/30"
                  animate={{
                    boxShadow: [
                      '0 10px 25px rgba(34, 197, 94, 0.3)',
                      '0 10px 35px rgba(34, 197, 94, 0.5)',
                      '0 10px 25px rgba(34, 197, 94, 0.3)',
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Phone className="w-8 h-8 text-white" />
                </motion.button>
                <span className="text-[13px] text-[#8b8d90]">Accepter</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default IncomingCallModal
