/**
 * Chantier 9 - Session Expiry Detection Hook
 *
 * Listens to Supabase auth state changes and detects when the
 * session expires or becomes invalid. Attempts to refresh the
 * session before showing the expired modal.
 *
 * Uses dynamic import() for supabase to avoid accessing the proxy
 * before initSupabase() completes (which crashes the app).
 */
import { useState, useEffect, useCallback, useRef } from 'react'

// Only show the modal when the token is truly expired and refresh fails.
// Supabase's built-in token refresh handles the normal renewal cycle.
const EXPIRY_BUFFER_MS = 30 * 1000 // 30s buffer before actual expiry to attempt refresh

export function useSessionExpiry() {
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const supabaseRef = useRef<typeof import('../lib/supabaseMinimal') | null>(null)

  const clearTimers = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current)
      expiryTimerRef.current = null
    }
  }, [])

  const dismissModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const setupExpiryTimer = useCallback(
    (expiresAt: number) => {
      clearTimers()

      const expiresAtMs = expiresAt * 1000
      const now = Date.now()
      const timeUntilExpiry = expiresAtMs - now

      if (timeUntilExpiry <= 0) {
        // Token already expired — Supabase's autoRefreshToken will attempt
        // renewal on its own. We only show the modal; if the auto-refresh
        // succeeds, onAuthStateChange TOKEN_REFRESHED will dismiss it.
        // DO NOT call refreshSession() manually here — it races with
        // Supabase's internal refresh and creates a navigator.locks deadlock.
        setIsSessionExpired(true)
        setShowModal(true)
        return
      }

      // Schedule expiry detection shortly before the token expires.
      // Supabase's built-in autoRefreshToken handles the actual renewal;
      // we only detect expiry and show the modal as a fallback.
      const detectAt = Math.max(timeUntilExpiry - EXPIRY_BUFFER_MS, 0)
      expiryTimerRef.current = setTimeout(async () => {
        try {
          const mod = supabaseRef.current
          if (!mod) return
          // Check current session without triggering a refresh
          const { data } = await mod.supabase.auth.getSession()
          if (!data.session) {
            // Session is truly gone — auto-refresh didn't save it
            setIsSessionExpired(true)
            setShowModal(true)
          }
          // If session exists, autoRefreshToken will handle renewal
        } catch {
          setIsSessionExpired(true)
          setShowModal(true)
        }
      }, detectAt)
    },
    [clearTimers]
  )

  useEffect(() => {
    let cancelled = false

    // Dynamically import supabase to avoid accessing proxy before initialization
    import('../lib/supabaseMinimal')
      .then((mod) => {
        if (cancelled) return
        supabaseRef.current = mod
        const { supabase } = mod

        try {
          // Listen to auth state changes
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, session) => {
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
                setupExpiryTimer(session.expires_at)
              }
            }
          })

          subscriptionRef.current = subscription

          // Check current session on mount
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (cancelled || !session) return
            if (session.expires_at) {
              setupExpiryTimer(session.expires_at)
            }
          })
        } catch {
          // Supabase not yet initialized, silently ignore
        }
      })
      .catch(() => {
        // Dynamic import failed, silently ignore
      })

    return () => {
      cancelled = true
      subscriptionRef.current?.unsubscribe()
      clearTimers()
    }
  }, [clearTimers, setupExpiryTimer])

  return {
    isSessionExpired,
    showModal,
    dismissModal,
  }
}
