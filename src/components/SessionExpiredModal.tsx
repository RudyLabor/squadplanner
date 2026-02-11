/**
 * Chantier 9 - Session Expired Modal
 *
 * Full-screen modal that appears when the user's auth session expires.
 * Offers reconnection or read-only mode.
 */
import { m, AnimatePresence } from 'framer-motion'
import { Clock, Lock, LogIn, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'

export interface SessionExpiredModalProps {
  isOpen: boolean
  onReconnect: () => void
  onDismiss?: () => void
}

export function SessionExpiredModal({ isOpen, onReconnect, onDismiss }: SessionExpiredModalProps) {
  const navigate = useNavigate()
  const titleId = 'session-expired-title'
  const descId = 'session-expired-desc'
  const reconnectRef = useRef<HTMLButtonElement>(null)

  // Focus trap: focus the primary button when modal opens
  useEffect(() => {
    if (isOpen) {
      reconnectRef.current?.focus()
    }
  }, [isOpen])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  const handleReconnect = () => {
    onReconnect()
    navigate('/auth')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <m.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-sm bg-surface-card border border-border-subtle rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6 text-center">
              {/* Icon */}
              <div className="relative w-16 h-16 mx-auto mb-5">
                <m.div
                  className="absolute inset-0 rounded-2xl bg-warning/15 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Clock className="w-7 h-7 text-warning" />
                </m.div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-error/15 flex items-center justify-center border-2 border-surface-card">
                  <Lock className="w-3 h-3 text-error" />
                </div>
              </div>

              {/* Title */}
              <h2
                id={titleId}
                className="text-xl font-semibold text-text-primary mb-2"
              >
                Session expirée
              </h2>

              {/* Description */}
              <p
                id={descId}
                className="text-md text-text-secondary mb-6"
              >
                Ta session a expiré. Reconnecte-toi pour continuer.
              </p>

              {/* Primary: reconnect */}
              <button
                ref={reconnectRef}
                onClick={handleReconnect}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-md font-medium hover:bg-primary-hover transition-colors mb-3"
              >
                <LogIn className="w-4 h-4" />
                Se reconnecter
              </button>

              {/* Secondary: continue read-only */}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-overlay-subtle text-text-secondary text-base font-medium hover:bg-overlay-light transition-colors border border-border-subtle"
                >
                  <Eye className="w-4 h-4" />
                  Continuer en lecture seule
                </button>
              )}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}

export default SessionExpiredModal
