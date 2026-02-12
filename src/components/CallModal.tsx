'use client'

import { useEffect, useRef, useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, WifiOff, Loader2 } from './icons'
import { useVoiceCallStore, formatCallDuration } from '../hooks/useVoiceCall'
import { NetworkQualityIndicator, QualityChangeToast } from './NetworkQualityIndicator'
import { useNetworkQualityStore } from '../hooks/useNetworkQuality'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { CallToast } from './call/CallToast'
import { CallAvatar } from './call/CallAvatar'
import { CallControls } from './call/CallControls'

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

  // Focus trap et gestion Escape pour l'accessibilite
  const focusTrapRef = useFocusTrap<HTMLDivElement>(shouldShow, endCall)

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success')
  const wasReconnecting = useRef(false)

  // Toast de changement de qualite reseau
  const [showQualityToast, setShowQualityToast] = useState(false)
  const [qualityToastLevel, setQualityToastLevel] = useState<
    'excellent' | 'good' | 'medium' | 'poor'
  >('good')

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
      <m.div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-modal-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-bg-base flex flex-col"
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
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-warning/10 border-b border-warning/20 px-4 py-3"
            >
              <div className="flex items-center justify-center gap-3">
                <WifiOff className="w-5 h-5 text-warning animate-pulse" />
                <p className="text-md font-medium text-warning">Reconnexion en cours...</p>
                <Loader2 className="w-5 h-5 text-warning animate-spin" />
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Header with close button and network quality */}
        <div className="absolute top-4 left-0 right-0 px-4 flex items-center justify-between">
          {status === 'connected' && localQuality !== 'unknown' && (
            <NetworkQualityIndicator size="sm" showLabel showTooltip />
          )}
          {status !== 'connected' && <div />}

          {status === 'calling' && (
            <button
              onClick={endCall}
              aria-label="Annuler l'appel"
              className="p-2 rounded-full bg-border-hover hover:bg-overlay-medium transition-colors"
            >
              <X className="w-6 h-6 text-text-secondary" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <CallAvatar
            status={status}
            avatarUrl={otherPerson.avatar_url}
            username={otherPerson.username}
            initial={initial}
          />

          {/* Name */}
          <m.h2
            id="call-modal-title"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold text-text-primary mb-2"
          >
            Appel avec {otherPerson.username}
          </m.h2>

          {/* Status */}
          <m.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-base ${
              status === 'connected' ? 'text-success' : 'text-text-secondary'
            }`}
          >
            {getStatusText()}
          </m.p>
        </div>

        {/* Controls */}
        <CallControls
          status={status}
          isMuted={isMuted}
          isSpeakerOn={isSpeakerOn}
          toggleMute={toggleMute}
          toggleSpeaker={toggleSpeaker}
          endCall={endCall}
        />
      </m.div>
    </AnimatePresence>
  )
}

export default CallModal
