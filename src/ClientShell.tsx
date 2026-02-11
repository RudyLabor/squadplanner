"use client";

import { lazy, Suspense, memo, useEffect, useRef } from 'react'
import { Outlet, useSearchParams } from 'react-router'
import { useAuthStore, usePushNotificationStore, initializePushNotifications } from './hooks'
import { initErrorTracker } from './lib/errorTracker'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { useScrollRestoration } from './hooks/useScrollRestoration'
import { useSwipeBack } from './hooks/useSwipeBack'
import { useSessionExpiry } from './hooks/useSessionExpiry'
import { useRateLimitStore } from './hooks/useRateLimit'
import { usePWAInstallStore } from './hooks/usePWAInstall'
import { useNavigationProgress } from './hooks/useNavigationProgress'
import { initTrackingListeners } from './utils/trackEvent'
import { TopLoadingBar } from './components/ui/TopLoadingBar'
import { AppLayout } from './components/layout'

// Lazy load heavy modals (only rendered when user is authenticated)
const CallModal = lazy(() => import('./components/CallModal').then(m => ({ default: m.CallModal })))
const IncomingCallModal = lazy(() => import('./components/IncomingCallModal').then(m => ({ default: m.IncomingCallModal })))
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })))
const CreateSessionModal = lazy(() => import('./components/CreateSessionModal').then(m => ({ default: m.CreateSessionModal })))

// Lazy load shell components - conditional or deferred
const OfflineBanner = lazy(() => import('./components/OfflineBanner').then(m => ({ default: m.OfflineBanner })))
const SessionExpiredModal = lazy(() => import('./components/SessionExpiredModal').then(m => ({ default: m.SessionExpiredModal })))
const RateLimitBanner = lazy(() => import('./components/RateLimitBanner').then(m => ({ default: m.RateLimitBanner })))
const PWAInstallBanner = lazy(() => import('./components/PWAInstallBanner').then(m => ({ default: m.PWAInstallBanner })))
const NotificationBanner = lazy(() => import('./components/NotificationBanner'))
const CookieConsent = lazy(() => import('./components/CookieConsent').then(m => ({ default: m.CookieConsent })))
const TourGuide = lazy(() => import('./components/TourGuide').then(m => ({ default: m.TourGuide })))

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

export default function ClientShell() {
  const { initialize, user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  useDocumentTitle()
  useScrollRestoration()
  useSwipeBack()
  useNavigationProgress()

  useEffect(() => { initialize() }, [initialize])

  // Initialize push notifications (service worker registration)
  useEffect(() => {
    initializePushNotifications().catch(() => {
      // Silent fail — push notifications are non-critical
    })
  }, [])

  // Initialize analytics click tracking for data-track elements
  useEffect(() => {
    initTrackingListeners()
  }, [])

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

  // Initialize error tracker + prefetch routes when authenticated
  const trackerInitRef = useRef(false)
  useEffect(() => {
    if (user && !trackerInitRef.current) {
      trackerInitRef.current = true
      initErrorTracker()
      import('./utils/routePrefetch').then(({ prefetchProbableRoutes }) => { prefetchProbableRoutes() })
    }
  }, [user])

  // Handle incoming call from URL params — lazy-loads voice call module (426KB)
  useEffect(() => {
    const incomingCallId = searchParams.get('incoming_call')
    const callerId = searchParams.get('caller_id')

    if (incomingCallId && callerId && user) {
      const handleIncomingCallFromUrl = async () => {
        try {
          const { useVoiceCallStore } = await import('./hooks/useVoiceCall')
          const { status, setIncomingCall } = useVoiceCallStore.getState()
          if (status !== 'idle') return
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
  }, [searchParams, setSearchParams, user])

  // Subscribe to incoming calls — lazy-loads voice call module (426KB) only when user is authenticated
  useEffect(() => {
    if (!user) return
    let unsubscribe: (() => void) | undefined
    import('./hooks/useVoiceCall').then(({ subscribeToIncomingCalls }) => {
      unsubscribe = subscribeToIncomingCalls(user.id)
    })
    return () => { unsubscribe?.() }
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
      <TopLoadingBar />
      {user && (
        <>
          <Suspense fallback={null}><CallModal /><IncomingCallModal /></Suspense>
          <Suspense fallback={null}><CommandPalette /></Suspense>
          <Suspense fallback={null}><CreateSessionModal /></Suspense>
        </>
      )}
      <AppLayout>
        <Outlet />
      </AppLayout>
      <Suspense fallback={null}>
        <OfflineBanner />
        <GlobalStateBanners />
        <PWAInstallBanner />
        <NotificationBanner />
        <CookieConsent />
        <TourGuide />
      </Suspense>
    </>
  )
}
