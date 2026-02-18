import { useEffect, useRef } from 'react'

const STALE_RELOAD_MS = 30 * 60 * 1000 // 30 minutes
const LOCK_PROBE_TIMEOUT_MS = 3000 // Time to wait for Supabase to respond before declaring deadlock

/**
 * Force mobile browsers to recalculate hit-test regions for fixed elements.
 *
 * Safari and Chrome on iOS/Android have a bug where `position: fixed`
 * elements keep their visual position after app-resume but their touch
 * target regions become stale (taps pass through or land on wrong elements).
 * Using translateZ(0) forces a GPU repaint without touching display/layout,
 * which avoids desynchronizing React's Virtual DOM and breaking touch targets.
 */
function repaintFixedNav() {
  const targets = document.querySelectorAll<HTMLElement>(
    '.mobile-bottom-nav, .desktop-only'
  )
  targets.forEach((el) => {
    el.style.transform = 'translateZ(0)'
    void el.offsetHeight // sync reflow
    el.style.transform = ''
  })
}

/**
 * Handles page resume after bfcache restore, freeze/thaw, or tab switching.
 *
 * Recovery actions on every resume:
 * 1. Dismiss open Sheet/Dialog/Drawer via synthetic Escape — their portal
 *    overlay (fixed inset-0 z-50) captures ALL pointer events and makes
 *    the navbar completely unresponsive.
 * 2. Clear stuck body.style.overflow (safety net if Escape doesn't fire).
 * 3. Skip stuck View Transitions (captures pointer events via pseudo-elements).
 * 4. Force repaint on fixed nav elements — Safari/Chrome mobile bug where
 *    touch target regions become stale after background restore.
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

      // FIX 1: Dismiss any open Sheet/Dialog/Drawer — only if one is actually open.
      // When the user backgrounds the app while a modal is open, its portal
      // overlay (fixed inset-0 z-50) stays in the DOM and blocks all touch
      // events on the navbar. Dispatching Escape triggers the modal's own
      // onClose handler via the keydown listener on document, cleanly
      // unmounting the portal through React state.
      // Dispatching Escape unconditionally can corrupt React Router navigation
      // state, so we only fire it when an overlay is actually present.
      const hasOpenOverlay =
        document.body.style.overflow === 'hidden' ||
        document.querySelector('[role="dialog"]:not([hidden])') ||
        document.querySelector('[data-state="open"]')
      if (hasOpenOverlay) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      }

      // FIX 2: Clear stuck body overflow from Sheet/Dialog/Drawer.
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''
      }

      // FIX 3: Skip stuck View Transition.
      if (document.startViewTransition && (document as any).activeViewTransition) {
        try {
          ;(document as any).activeViewTransition.skipTransition()
        } catch {
          // Already finished or not supported — ignore
        }
      }

      // FIX 4: Force repaint on fixed nav elements.
      // Must run after a frame so the Escape-triggered React state update
      // (which removes overlays) has time to flush to the DOM.
      // If React Router is mid-navigation, wait for it to finish first —
      // forcing a repaint during navigation can corrupt the router state.
      const router = (window as any).__reactRouterDataRouter
      if (router?.state?.navigation?.state !== 'idle') {
        const unsub = router.subscribe((state: any) => {
          if (state.navigation.state === 'idle') {
            unsub()
            requestAnimationFrame(() => repaintFixedNav())
          }
        })
      } else {
        requestAnimationFrame(() => repaintFixedNav())
      }

      // FIX 5: Detect and recover from navigator.locks deadlock.
      // Supabase uses navigator.locks('auth-token-...' ) for token refresh.
      // If a deadlock occurs (e.g. dual refresh race), all Supabase calls
      // hang forever, blocking React Router loaders and freezing navigation.
      // We probe by checking if any auth-token lock is held, then testing
      // if Supabase can actually respond within 3 seconds.
      if (typeof navigator?.locks?.query === 'function') {
        setTimeout(async () => {
          try {
            const { held } = await navigator.locks.query()
            const hasAuthLock = held?.some((l) => l.name?.startsWith('auth-token'))
            if (!hasAuthLock) return // No lock held — all good

            // Lock is held — probe if Supabase can respond
            const { supabaseMinimal } = await import('../lib/supabaseMinimal')
            const probe = Promise.race([
              supabaseMinimal.auth.getUser().then(() => true),
              new Promise<false>((resolve) =>
                setTimeout(() => resolve(false), LOCK_PROBE_TIMEOUT_MS)
              ),
            ])
            const ok = await probe
            if (!ok) {
              // Deadlock confirmed — steal the lock and force reload
              console.warn('[useAppResume] navigator.locks deadlock detected, forcing reload')
              navigator.locks.request(
                held!.find((l) => l.name?.startsWith('auth-token'))!.name,
                { steal: true },
                async () => {
                  window.location.reload()
                }
              )
            }
          } catch {
            // navigator.locks not available or query failed — ignore
          }
        }, 1000) // Delay to let normal Supabase auto-refresh settle first
      }

      if (hiddenAt === 0) return
      const elapsed = Date.now() - hiddenAt

      // After 30+ minutes: force full reload.
      if (elapsed > STALE_RELOAD_MS) {
        window.location.reload()
      }
    }

    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return

      const hasOpenOverlay =
        document.body.style.overflow === 'hidden' ||
        document.querySelector('[role="dialog"]:not([hidden])') ||
        document.querySelector('[data-state="open"]')
      if (hasOpenOverlay) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      }

      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''
      }

      const router = (window as any).__reactRouterDataRouter
      if (router?.state?.navigation?.state !== 'idle') {
        const unsub = router.subscribe((state: any) => {
          if (state.navigation.state === 'idle') {
            unsub()
            requestAnimationFrame(() => repaintFixedNav())
          }
        })
      } else {
        requestAnimationFrame(() => repaintFixedNav())
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
