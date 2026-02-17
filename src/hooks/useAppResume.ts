import { useEffect, useRef } from 'react'

const STALE_RELOAD_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Handles page resume after bfcache restore, freeze/thaw, or tab switching.
 *
 * Recovery actions on every resume:
 * 1. Dismiss open Sheet/Dialog/Drawer via synthetic Escape — their portal
 *    overlay (fixed inset-0 z-50) captures ALL pointer events and makes
 *    the navbar completely unresponsive.
 * 2. Clear stuck body.style.overflow (safety net if Escape doesn't fire).
 * 3. Skip stuck View Transitions (captures pointer events via pseudo-elements).
 *
 * Resume > 30 min: forces full reload (stale chunks, expired tokens).
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

      // FIX: Dismiss any open Sheet/Dialog/Drawer.
      // When the user backgrounds the app while a modal is open, its portal
      // overlay (fixed inset-0 z-50) stays in the DOM and blocks all touch
      // events on the navbar. Dispatching Escape triggers the modal's own
      // onClose handler via the keydown listener on document, cleanly
      // unmounting the portal through React state.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

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
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
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
