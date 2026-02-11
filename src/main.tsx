import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializePushNotifications } from './hooks/usePushNotifications'
import { initFontOptimization } from './utils/fontOptimization'

// Error tracker is initialized in authenticated routes (see App.tsx / ClientShell.tsx)

// Detect when web fonts are loaded and add .fonts-loaded class to <html>
initFontOptimization()

// Initialize push notifications (service worker registration)
// This runs async and doesn't block the app startup
initializePushNotifications().catch((error) => {
  console.warn('[App] Push notifications initialization failed:', error)
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Report Web Vitals (non-blocking)
import('./utils/webVitals').then(({ reportWebVitals }) => {
  reportWebVitals();
})
