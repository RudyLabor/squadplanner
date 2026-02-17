import { useEffect, useRef } from 'react'

const STALE_RELOAD_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Handles page resume after bfcache restore, freeze/thaw, or tab switching.
 *
 * Keeps it minimal to avoid flooding the network on resume:
 * - Every resume: clears stuck body.style.overflow (Sheet/Dialog safety net)
 *   and skips any stuck View Transition
 * - Resume > 30 min: forces full reload (stale chunks, expired tokens)
 *
 * Does NOT trigger revalidation or data refetching — that would fire 12-16
 * simultaneous network requests and freeze the UI for 2-4 seconds.
 * Data refreshes naturally when the user navigates.
 */
export function useAppResume() {
  const hiddenAtRef = useRef(0)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now()
        return
      }

      // === VISIBLE (resumed) ===
      const hiddenAt = hiddenAtRef.current
      hiddenAtRef.current = 0

      // Safety net: clear stuck body overflow from Sheet/Dialog/Drawer.
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''
      }

      // Skip any stuck View Transition that was pending when the page froze.
      // A stuck transition captures all pointer events via ::view-transition-*
      // pseudo-elements, making the navbar appear unresponsive.
      if (document.startViewTransition && (document as any).activeViewTransition) {
        try {
          ;(document as any).activeViewTransition.skipTransition()
        } catch {
          // Already finished or not supported — ignore
        }
      }

      if (hiddenAt === 0) return
      const elapsed = Date.now() - hiddenAt

      // After 30+ minutes: force full reload.
      // Chunked assets may have been purged by CDN deploy, auth tokens
      // may be expired beyond refresh.
      if (elapsed > STALE_RELOAD_MS) {
        window.location.reload()
      }
    }

    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])
}
