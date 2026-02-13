import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'
import { initSupabase } from './lib/supabaseMinimal'
import { initFontOptimization } from './utils/fontOptimization'

// Initialize Supabase client IMMEDIATELY — before hydration starts.
// This ensures _client is ready when hooks run their first effects.
// The dynamic import of @supabase/ssr starts downloading in parallel with hydration.
initSupabase()

// Detect when web fonts are loaded and add .fonts-loaded class to <html>
initFontOptimization()

// Auto-update: reload when a NEW service worker replaces an existing one.
// On first visit, there is no controller yet — skipWaiting + clients.claim
// fires controllerchange immediately, causing an unwanted page reload.
// We only reload when a previous controller existed (= SW update after deploy).
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return
    refreshing = true
    window.location.reload()
  })

  // Check for SW updates every 30 minutes
  navigator.serviceWorker.ready.then((registration) => {
    setInterval(() => registration.update(), 30 * 60 * 1000)
  })
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  )
})

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
