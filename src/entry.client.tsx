import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'
import { initSupabase } from './lib/supabase'
import { initializePushNotifications } from './hooks/usePushNotifications'
import { initFontOptimization } from './utils/fontOptimization'

// Initialize Supabase client IMMEDIATELY — before hydration starts.
// This ensures _client is ready when hooks run their first effects.
// The dynamic import of @supabase/ssr starts downloading in parallel with hydration.
initSupabase()

// Detect when web fonts are loaded and add .fonts-loaded class to <html>
initFontOptimization()

// Initialize push notifications (service worker registration)
// This runs async and doesn't block the app startup
initializePushNotifications().catch(() => {
  // Silent fail — push notifications are non-critical
})

// Auto-update: reload when a new service worker takes control
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
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
    </StrictMode>,
  )
})

// Report Web Vitals (non-blocking)
import('./utils/webVitals').then(({ reportWebVitals }) => {
  reportWebVitals()
})
