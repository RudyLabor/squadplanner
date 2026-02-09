/**
 * Chantier 9 - Session Expiry Detection Hook
 *
 * Listens to Supabase auth state changes and detects when the
 * session expires or becomes invalid. Shows a warning toast
 * 5 minutes before expiry when possible.
 *
 * Uses dynamic import() for supabase to avoid accessing the proxy
 * before initSupabase() completes (which crashes the app).
 */
import { useState, useEffect, useCallback, useRef } from 'react'

const EXPIRY_WARNING_MS = 5 * 60 * 1000 // 5 minutes before expiry

export function useSessionExpiry() {
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

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

  const setupExpiryTimers = useCallback((expiresAt: number) => {
    const expiresAtMs = expiresAt * 1000
    const now = Date.now()
    const timeUntilExpiry = expiresAtMs - now

    if (timeUntilExpiry <= 0) {
      setIsSessionExpired(true)
      setShowModal(true)
      return
    }

    // Warning toast 5 minutes before expiry
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

    // Expiry timer
    expiryTimerRef.current = setTimeout(() => {
      setIsSessionExpired(true)
      setShowModal(true)
    }, timeUntilExpiry)
  }, [])

  useEffect(() => {
    let cancelled = false

    // Dynamically import supabase to avoid accessing proxy before initialization
    import('../lib/supabase').then(({ supabase }) => {
      if (cancelled) return

      try {
        // Listen to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            clearTimers()

            if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
              setIsSessionExpired(true)
              setShowModal(true)
              return
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setIsSessionExpired(false)
              setShowModal(false)

              if (session?.expires_at) {
                setupExpiryTimers(session.expires_at)
              }
            }
          }
        )

        subscriptionRef.current = subscription

        // Check current session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (cancelled || !session) return
          if (session.expires_at) {
            setupExpiryTimers(session.expires_at)
          }
        })
      } catch {
        // Supabase not yet initialized, silently ignore
      }
    }).catch(() => {
      // Dynamic import failed, silently ignore
    })

    return () => {
      cancelled = true
      subscriptionRef.current?.unsubscribe()
      clearTimers()
    }
  }, [clearTimers, setupExpiryTimers])

  return {
    isSessionExpired,
    showModal,
    dismissModal,
  }
}
