import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, X, WifiOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useVoiceCallStore, formatCallDuration } from '../hooks/useVoiceCall'
import { NetworkQualityIndicator, QualityChangeToast } from './NetworkQualityIndicator'
import { useNetworkQualityStore } from '../hooks/useNetworkQuality'
import { useFocusTrap } from '../hooks/useFocusTrap'

// Toast pour les notifications dans le modal d'appel
function CallToast({ message, isVisible, variant = 'success' }: {
  message: string
  isVisible: boolean
  variant?: 'success' | 'error'
}) {
  const variantStyles = {
    success: {
      bg: 'bg-[#34d399]',
      text: 'text-[#050506]',
      Icon: CheckCircle2
    },
    error: {
      bg: 'bg-[#fb7185]',
      text: 'text-white',
      Icon: AlertCircle
    }
  }

  const style = variantStyles[variant]
  const Icon = style.Icon

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[110]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${style.bg} ${style.text} shadow-lg`}>
            <Icon className="w-5 h-5" />
            <span className="text-[14px] font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function CallModal() {
  const {
    status,
    isMuted,
    isSpeakerOn,
    callDuration,
    caller,
    receiver,
    isIncoming,
    isReconnecting,
    reconnectAttempts,
    networkQualityChanged,
    toggleMute,
    toggleSpeaker,
    endCall,
    clearNetworkQualityNotification,
  } = useVoiceCallStore()

  const { localQuality } = useNetworkQualityStore()

  // Only show for outgoing calls or connected calls
  const shouldShow = status === 'calling' || status === 'connected' || status === 'ended'

  // Focus trap et gestion Escape pour l'accessibilité
  const focusTrapRef = useFocusTrap<HTMLDivElement>(shouldShow, endCall)

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success')
  const wasReconnecting = useRef(false)

  // Toast de changement de qualite reseau
  const [showQualityToast, setShowQualityToast] = useState(false)
  const [qualityToastLevel, setQualityToastLevel] = useState<'excellent' | 'good' | 'medium' | 'poor'>('good')

  // Detecter la fin de la reconnexion pour afficher un toast
  useEffect(() => {
    if (wasReconnecting.current && !isReconnecting && status === 'connected') {
      // La reconnexion a reussi - defer state updates to avoid cascading renders
      queueMicrotask(() => {
        setToastMessage('Connexion rétablie !')
        setToastVariant('success')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      })
    }
    wasReconnecting.current = isReconnecting
  }, [isReconnecting, status])

  // Detecter les changements de qualite reseau pour afficher un toast
  useEffect(() => {
    if (networkQualityChanged && networkQualityChanged !== 'unknown') {
      // Defer state updates to avoid cascading renders
      queueMicrotask(() => {
        setQualityToastLevel(networkQualityChanged as 'excellent' | 'good' | 'medium' | 'poor')
        setShowQualityToast(true)
        // Clear la notification apres l'affichage
        clearNetworkQualityNotification()
      })
    }
  }, [networkQualityChanged, clearNetworkQualityNotification])

  // Get the other person's info
  const otherPerson = isIncoming ? caller : receiver

  // Debug logging
  console.log('[CallModal] status:', status, 'shouldShow:', shouldShow, 'otherPerson:', otherPerson, 'isIncoming:', isIncoming)

  if (!shouldShow || !otherPerson) return null

  const getStatusText = () => {
    if (isReconnecting) {
      return `Reconnexion... (${reconnectAttempts}/3)`
    }
    switch (status) {
      case 'calling':
        return 'Appel en cours...'
      case 'connected':
        return formatCallDuration(callDuration)
      case 'ended':
        return 'Appel terminé'
      default:
        return ''
    }
  }

  const initial = otherPerson.username?.charAt(0).toUpperCase() || '?'

  return (
    <AnimatePresence>
      <motion.div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-modal-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#050506] flex flex-col"
      >
        {/* Toast de reconnexion */}
        <CallToast message={toastMessage} isVisible={showToast} variant={toastVariant} />

        {/* Toast de changement de qualite reseau */}
        <QualityChangeToast
          isVisible={showQualityToast}
          newQuality={qualityToastLevel}
          onClose={() => setShowQualityToast(false)}
        />

        {/* Banniere de reconnexion */}
        <AnimatePresence>
          {isReconnecting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#fbbf24]/10 border-b border-[#fbbf24]/20 px-4 py-3"
            >
              <div className="flex items-center justify-center gap-3">
                <WifiOff className="w-5 h-5 text-[#fbbf24] animate-pulse" />
                <p className="text-[14px] font-medium text-[#fbbf24]">
                  Reconnexion en cours...
                </p>
                <Loader2 className="w-5 h-5 text-[#fbbf24] animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header with close button and network quality */}
        <div className="absolute top-4 left-0 right-0 px-4 flex items-center justify-between">
          {/* Indicateur de qualite reseau (visible seulement en appel connecte) */}
          {status === 'connected' && localQuality !== 'unknown' && (
            <NetworkQualityIndicator size="sm" showLabel showTooltip />
          )}
          {status !== 'connected' && <div />}

          {/* Close button for calling state */}
          {status === 'calling' && (
            <button
              onClick={endCall}
              aria-label="Annuler l'appel"
              className="p-2 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] transition-colors"
            >
              <X className="w-6 h-6 text-[#c9cace]" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative mb-8"
          >
            {/* Pulse animation for calling state - single subtle animation */}
            {status === 'calling' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-[#6366f1]/20"
                animate={{
                  scale: [1, 1.4, 1.4],
                  opacity: [0.4, 0, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: 3,
                  ease: 'easeOut',
                }}
              />
            )}

            {/* Connected indicator */}
            {status === 'connected' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#34d399] border-4 border-[#050506] flex items-center justify-center"
              >
                <Phone className="w-3 h-3 text-white" />
              </motion.div>
            )}

            {/* Avatar image or initial */}
            <div className="w-32 h-32 rounded-full overflow-hidden bg-[rgba(99,102,241,0.2)] flex items-center justify-center">
              {otherPerson.avatar_url ? (
                <img
                  src={otherPerson.avatar_url}
                  alt={otherPerson.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-[#6366f1]">{initial}</span>
              )}
            </div>
          </motion.div>

          {/* Name */}
          <motion.h2
            id="call-modal-title"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-[#f7f8f8] mb-2"
          >
            Appel avec {otherPerson.username}
          </motion.h2>

          {/* Status */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-base ${
              status === 'connected' ? 'text-[#34d399]' : 'text-[#8b8d90]'
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
                aria-label={isMuted ? 'Réactiver le micro' : 'Couper le micro'}
                aria-pressed={isMuted}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? 'bg-[rgba(255,255,255,0.1)]'
                    : 'bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-7 h-7 text-[#fb7185]" aria-hidden="true" />
                ) : (
                  <Mic className="w-7 h-7 text-[#c9cace]" aria-hidden="true" />
                )}
              </motion.button>
            )}

            {/* End call button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={endCall}
              aria-label="Raccrocher"
              className="w-20 h-20 rounded-full bg-[#fb7185] flex items-center justify-center shadow-lg shadow-[#fb7185]/20"
            >
              <PhoneOff className="w-8 h-8 text-white" aria-hidden="true" />
            </motion.button>

            {/* Speaker button */}
            {status === 'connected' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleSpeaker}
                aria-label={isSpeakerOn ? 'Désactiver le haut-parleur' : 'Activer le haut-parleur'}
                aria-pressed={isSpeakerOn}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  !isSpeakerOn
                    ? 'bg-[rgba(255,255,255,0.1)]'
                    : 'bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                {isSpeakerOn ? (
                  <Volume2 className="w-7 h-7 text-[#c9cace]" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-7 h-7 text-[#fb7185]" aria-hidden="true" />
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
              En attente de réponse...
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CallModal
