import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializePushNotifications } from './hooks/usePushNotifications'

// Sentry is now lazily initialized ONLY in authenticated routes (see App.tsx)
// This keeps @sentry/react out of the landing page bundle

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
