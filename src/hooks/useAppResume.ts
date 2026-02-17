import { useEffect, useRef, useCallback } from 'react'
import { useRevalidator } from 'react-router'

const REVALIDATE_MS = 5 * 60 * 1000 // 5 minutes
const STALE_RELOAD_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Handles page resume after bfcache restore, freeze/thaw, or tab switching.
 *
 * Replaces the aggressive window.location.reload() calls that were in
 * entry.client.tsx — those destroyed React's event handlers, creating a
 * "hydration gap" where the navbar was visible but unresponsive.
 *
 * - Every resume: clears stuck body.style.overflow (Sheet/Dialog safety net)
 * - Resume > 5 min: revalidates React Router loader data (profile, squads, auth)
 * - Resume > 30 min: forces full reload (stale chunks, expired tokens)
 * - bfcache restore: clears overflow + revalidates
 */
export function useAppResume() {
  const revalidator = useRevalidator()
  const hiddenAtRef = useRef(0)

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      hiddenAtRef.current = Date.now()
      return
    }

    // === VISIBLE (resumed) ===
    const hiddenAt = hiddenAtRef.current
    hiddenAtRef.current = 0

    // Safety net: clear stuck body overflow from Sheet/Dialog/Drawer.
    // If a modal was open when the page froze and React's cleanup didn't
    // run, body scroll would be permanently locked.
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = ''
    }

    if (hiddenAt === 0) return
    const elapsed = Date.now() - hiddenAt

    // After 30+ minutes: force full reload.
    // Chunked assets may have been purged by CDN deploy, auth tokens
    // may be expired beyond refresh.
    if (elapsed > STALE_RELOAD_MS) {
      window.location.reload()
      return
    }

    // After 5+ minutes: revalidate React Router loaders.
    // Refreshes layout data (profile, squads, unread counts) without
    // destroying the React tree. Bypasses shouldRevalidate().
    if (elapsed > REVALIDATE_MS && revalidator.state === 'idle') {
      revalidator.revalidate()
    }
  }, [revalidator])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Handle bfcache restore. The pageshow event with persisted=true fires
    // when the page is restored from back/forward cache. React state is
    // fully intact, but data may be stale.
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return

      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''
      }

      if (revalidator.state === 'idle') {
        revalidator.revalidate()
      }
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [handleVisibilityChange, revalidator])
}
