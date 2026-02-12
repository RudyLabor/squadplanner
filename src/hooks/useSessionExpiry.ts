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
  const supabaseRef = useRef<typeof import('../lib/supabase') | null>(null)

  const clearTimers = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current)
      expiryTimerRef.current = null
    }
  }, [])

  const dismissModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const setupExpiryTimer = useCallback((expiresAt: number) => {
    clearTimers()

    const expiresAtMs = expiresAt * 1000
    const now = Date.now()
    const timeUntilExpiry = expiresAtMs - now

    if (timeUntilExpiry <= 0) {
      // Token already expired — attempt refresh before showing modal
      supabaseRef.current?.supabase.auth.refreshSession().then(({ data }) => {
        if (!data.session) {
          setIsSessionExpired(true)
          setShowModal(true)
        }
        // If refresh succeeded, onAuthStateChange TOKEN_REFRESHED will reset timers
      }).catch(() => {
        setIsSessionExpired(true)
        setShowModal(true)
      })
      return
    }

    // Schedule a refresh attempt shortly before expiry
    const refreshAt = Math.max(timeUntilExpiry - EXPIRY_BUFFER_MS, 0)
    expiryTimerRef.current = setTimeout(async () => {
      try {
        const mod = supabaseRef.current
        if (!mod) return
        const { data } = await mod.supabase.auth.refreshSession()
        if (!data.session) {
          // Refresh failed — session is truly expired
          setIsSessionExpired(true)
          setShowModal(true)
        }
        // If refresh succeeded, onAuthStateChange TOKEN_REFRESHED will set up a new timer
      } catch {
        setIsSessionExpired(true)
        setShowModal(true)
      }
    }, refreshAt)
  }, [clearTimers])

  useEffect(() => {
    let cancelled = false

    // Dynamically import supabase to avoid accessing proxy before initialization
    import('../lib/supabase').then((mod) => {
      if (cancelled) return
      supabaseRef.current = mod
      const { supabase } = mod

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
                setupExpiryTimer(session.expires_at)
              }
            }
          }
        )

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
    }).catch(() => {
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
