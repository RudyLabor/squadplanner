import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

// PERF: Hydrate FIRST — defer all non-critical init to after first paint.
// initSupabase + initFontOptimization were previously blocking hydration,
// adding ~100-200ms to FCP. They now run in a microtask after hydration starts.
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  )
})

// Initialize Supabase client right after hydration starts (microtask).
// This ensures _client is ready when hooks run their first effects,
// but doesn't block the initial paint.
queueMicrotask(() => {
  import('./lib/supabaseMinimal').then(({ initSupabase }) => initSupabase())
  import('./utils/fontOptimization').then(({ initFontOptimization }) => initFontOptimization())
})

// bfcache: force reload when page is restored from back/forward cache.
// React Router's internal state (history listeners, pending navigations) doesn't
// survive bfcache freezing, causing dead links on mobile after tab-switching.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload()
})

// Freeze/thaw recovery for mobile browsers.
// On Android/iOS, switching apps often "freezes" the page without using bfcache,
// so `pageshow` with `persisted=true` never fires. But React Router's internal
// listeners become stale after being frozen for a while. We track how long the
// page was hidden and force a reload if it exceeds a threshold.
{
  let hiddenAt = 0
  const STALE_THRESHOLD_MS = 30_000 // 30 seconds
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now()
    } else if (hiddenAt > 0 && Date.now() - hiddenAt > STALE_THRESHOLD_MS) {
      hiddenAt = 0
      window.location.reload()
    } else {
      hiddenAt = 0
    }
  })
}

// Auto-update: reload when a NEW service worker replaces an existing one.
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return
    refreshing = true
    window.location.reload()
  })

  navigator.serviceWorker.ready.then((registration) => {
    setInterval(() => registration.update(), 30 * 60 * 1000)
  })
}

// Report Web Vitals (non-blocking)
import('./utils/webVitals').then(({ reportWebVitals }) => {
  reportWebVitals()
})

// Persist React Query cache to IndexedDB for offline access (non-blocking)
import('./lib/queryClient').then(({ initQueryPersistence }) => {
  initQueryPersistence()
})

// Initialize offline mutation queue — replays failed mutations on reconnect
import('./lib/offlineMutationQueue').then(({ initOfflineMutationSync }) => {
  initOfflineMutationSync()
})
