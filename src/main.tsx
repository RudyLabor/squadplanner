import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializePushNotifications } from './hooks/usePushNotifications'
import { initSentry } from './lib/sentry'

// Initialize Sentry error monitoring (production only)
initSentry().catch((error) => {
  console.warn('[App] Sentry initialization failed:', error)
})

// Initialize push notifications (service worker registration)
// This runs async and doesn't block the app startup
initializePushNotifications().catch((error) => {
  console.warn('[App] Push notifications initialization failed:', error)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
