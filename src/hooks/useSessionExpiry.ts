/**
 * Chantier 9 - Session Expiry Detection Hook
 *
 * Listens to Supabase auth state changes and detects when the
 * session expires or becomes invalid. Shows a warning toast
 * 5 minutes before expiry when possible.
 *
 * Integration: use in your main App layout component:
 *   const { isSessionExpired, showModal, dismissModal } = useSessionExpiry()
 *   <SessionExpiredModal isOpen={showModal} onReconnect={() => {}} onDismiss={dismissModal} />
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const EXPIRY_WARNING_MS = 5 * 60 * 1000 // 5 minutes before expiry

export function useSessionExpiry() {
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current)
      expiryTimerRef.current = null
    }
  }, [])

  const dismissModal = useCallback(() => {
    setShowModal(false)
  }, [])

  useEffect(() => {
    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        clearTimers()

        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
          // Session is gone
          setIsSessionExpired(true)
          setShowModal(true)
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Session refreshed or user signed in
          setIsSessionExpired(false)
          setShowModal(false)

          // Set up expiry timers if we have an expiry timestamp
          if (session?.expires_at) {
            const expiresAtMs = session.expires_at * 1000
            const now = Date.now()
            const timeUntilExpiry = expiresAtMs - now

            if (timeUntilExpiry <= 0) {
              // Already expired
              setIsSessionExpired(true)
              setShowModal(true)
              return
            }

            // Warning toast 5 minutes before expiry
            const timeUntilWarning = timeUntilExpiry - EXPIRY_WARNING_MS
            if (timeUntilWarning > 0) {
              warningTimerRef.current = setTimeout(() => {
                // Dynamically import toast to avoid circular deps
                import('../components/ui/Toast').then(({ toast }) => {
                  toast({
                    type: 'warning',
                    title: 'Session bientôt expirée',
                    message: 'Ta session expire dans 5 minutes. Sauvegarde ton travail.',
                    duration: 10000,
                  })
                }).catch(() => {
                  // Toast not available, no-op
                })
              }, timeUntilWarning)
            }

            // Expiry timer
            expiryTimerRef.current = setTimeout(() => {
              setIsSessionExpired(true)
              setShowModal(true)
            }, timeUntilExpiry)
          }
        }
      }
    )

    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // No session - don't show modal on mount, user may not be logged in
        return
      }

      if (session.expires_at) {
        const expiresAtMs = session.expires_at * 1000
        const now = Date.now()
        const timeUntilExpiry = expiresAtMs - now

        if (timeUntilExpiry <= 0) {
          setIsSessionExpired(true)
          setShowModal(true)
        } else {
          // Set up timers
          const timeUntilWarning = timeUntilExpiry - EXPIRY_WARNING_MS
          if (timeUntilWarning > 0) {
            warningTimerRef.current = setTimeout(() => {
              import('../components/ui/Toast').then(({ toast }) => {
                toast({
                  type: 'warning',
                  title: 'Session bientôt expirée',
                  message: 'Ta session expire dans 5 minutes. Sauvegarde ton travail.',
                  duration: 10000,
                })
              }).catch(() => {})
            }, timeUntilWarning)
          }

          expiryTimerRef.current = setTimeout(() => {
            setIsSessionExpired(true)
            setShowModal(true)
          }, timeUntilExpiry)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimers()
    }
  }, [clearTimers])

  return {
    isSessionExpired,
    showModal,
    dismissModal,
  }
}
