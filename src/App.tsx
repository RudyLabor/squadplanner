import { useEffect, lazy, Suspense, memo, useRef } from 'react'
import { BrowserRouter, useSearchParams } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore, subscribeToIncomingCalls, usePushNotificationStore, useVoiceCallStore, useThemeStore } from './hooks'
import { initSentry } from './lib/sentry'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { useScrollRestoration } from './hooks/useScrollRestoration'
import { useSwipeBack } from './hooks/useSwipeBack'
import { OfflineBanner } from './components/OfflineBanner'
import { SessionExpiredModal } from './components/SessionExpiredModal'
import { RateLimitBanner } from './components/RateLimitBanner'
import { useSessionExpiry } from './hooks/useSessionExpiry'
import { useRateLimitStore } from './hooks/useRateLimit'
import { PWAInstallBanner } from './components/PWAInstallBanner'
import { usePWAInstallStore } from './hooks/usePWAInstall'
import { CookieConsent } from './components/CookieConsent'
import { TourGuide } from './components/TourGuide'
import NotificationBanner from './components/NotificationBanner'
import { queryClient } from './lib/queryClient'
import { useNavigationProgress } from './hooks/useNavigationProgress'
import { TopLoadingBar } from './components/ui/TopLoadingBar'
import { AppRoutes } from './AppRoutes'

// Initialize theme on app load
void useThemeStore.getState()

// Lazy load heavy modals
const CallModal = lazy(() => import('./components/CallModal').then(m => ({ default: m.CallModal })))
const IncomingCallModal = lazy(() => import('./components/IncomingCallModal').then(m => ({ default: m.IncomingCallModal })))
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })))
const CreateSessionModal = lazy(() => import('./components/CreateSessionModal').then(m => ({ default: m.CreateSessionModal })))

function AppContent() {
  const { initialize, user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setIncomingCall, status: callStatus } = useVoiceCallStore()

  useDocumentTitle()
  useScrollRestoration()
  useSwipeBack()
  useNavigationProgress()

  useEffect(() => { initialize() }, [initialize])

  // Capture PWA install prompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usePWAInstallStore.getState().setDeferredPrompt(e as any)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Initialize Sentry when authenticated
  const sentryInitRef = useRef(false)
  useEffect(() => {
    if (user && !sentryInitRef.current) {
      sentryInitRef.current = true
      initSentry().catch((err) => console.warn('[App] Sentry initialization failed:', err))
      import('./utils/routePrefetch').then(({ prefetchProbableRoutes }) => { prefetchProbableRoutes() })
    }
  }, [user])

  // Handle incoming call from URL params
  useEffect(() => {
    const incomingCallId = searchParams.get('incoming_call')
    const callerId = searchParams.get('caller_id')

    if (incomingCallId && callerId && user && callStatus === 'idle') {
      const handleIncomingCallFromUrl = async () => {
        try {
          const { supabase } = await import('./lib/supabase')
          const { data: callerProfile } = await supabase.from('profiles').select('username, avatar_url').eq('id', callerId).single()
          if (callerProfile) {
            setIncomingCall({ id: callerId, username: callerProfile.username, avatar_url: callerProfile.avatar_url }, incomingCallId)
          }
        } catch (error) { console.error('[App] Error handling incoming call from URL:', error) }
      }
      handleIncomingCallFromUrl()
      searchParams.delete('incoming_call'); searchParams.delete('caller_id')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, user, callStatus, setIncomingCall])

  // Subscribe to incoming calls
  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToIncomingCalls(user.id)
    return () => unsubscribe()
  }, [user])

  // Auto-subscribe to push notifications
  const pushSubscribedRef = useRef(false)
  useEffect(() => {
    if (!user) { pushSubscribedRef.current = false; return }
    if (pushSubscribedRef.current) return

    const timeoutId = setTimeout(async () => {
      try {
        const pushStore = usePushNotificationStore.getState()
        if (!pushStore.isSupported) return
        if (pushStore.isSubscribed) { pushSubscribedRef.current = true; return }
        const success = await pushStore.subscribeToPush(user.id)
        pushSubscribedRef.current = success
      } catch (err) {
        if (!import.meta.env.PROD) console.warn('[App] Push setup failed:', err)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [user])

  return (
    <>
      {user && (
        <>
          <Suspense fallback={null}><CallModal /><IncomingCallModal /></Suspense>
          <Suspense fallback={null}><CommandPalette /></Suspense>
          <Suspense fallback={null}><CreateSessionModal /></Suspense>
        </>
      )}
      <AppRoutes />
    </>
  )
}

// Global state banners
const GlobalStateBanners = memo(function GlobalStateBanners() {
  const { showModal, dismissModal } = useSessionExpiry()
  const { isRateLimited, retryAfter, dismiss: dismissRateLimit, reset: resetRateLimit } = useRateLimitStore()

  return (
    <>
      <SessionExpiredModal isOpen={showModal} onReconnect={() => {}} onDismiss={dismissModal} />
      {isRateLimited && <RateLimitBanner retryAfter={retryAfter} onRetry={resetRateLimit} onDismiss={dismissRateLimit} />}
    </>
  )
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TopLoadingBar />
        <AppContent />
        <OfflineBanner />
        <GlobalStateBanners />
        <PWAInstallBanner />
        <NotificationBanner />
        <CookieConsent />
        <TourGuide />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              borderRadius: '12px',
              padding: '12px 16px',
              position: 'relative' as const,
              overflow: 'hidden',
            },
            classNames: {
              success: 'border-success/20 bg-success/10',
              error: 'border-error/20 bg-error/10',
              warning: 'border-warning/20 bg-warning/10',
              info: 'border-primary/20 bg-primary/10',
            },
          }}
        />
        <div id="aria-live-polite" aria-live="polite" aria-atomic="true" className="sr-only" />
        <div id="aria-live-assertive" aria-live="assertive" aria-atomic="true" className="sr-only" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
