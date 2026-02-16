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
