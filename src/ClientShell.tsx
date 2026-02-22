import { lazy, Suspense, memo, useEffect, useRef } from 'react'
import { Outlet, useSearchParams, useLocation } from 'react-router'
import { useAuthStore, usePushNotificationStore, initializePushNotifications } from './hooks'
import { initErrorTracker } from './lib/errorTracker'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { useScrollRestoration } from './hooks/useScrollRestoration'
import { useSwipeBack } from './hooks/useSwipeBack'
import { useSessionExpiry } from './hooks/useSessionExpiry'
import { useRateLimitStore } from './hooks/useRateLimit'
import { usePWAInstallStore, type BeforeInstallPromptEvent } from './hooks/usePWAInstall'
import { useNavigationProgress } from './hooks/useNavigationProgress'
import { useAppResume } from './hooks/useAppResume'
import { initTrackingListeners } from './utils/trackEvent'
import { TopLoadingBar } from './components/ui/TopLoadingBar'
// import { initializeWebVitalsMonitoring } from './lib/webVitalsMonitoring'
import { AppLayout } from './components/layout'

// Lazy load heavy modals (only rendered when user is authenticated)
const CallModal = lazy(() =>
  import('./components/CallModal').then((m) => ({ default: m.CallModal }))
)
const IncomingCallModal = lazy(() =>
  import('./components/IncomingCallModal').then((m) => ({ default: m.IncomingCallModal }))
)
const CommandPalette = lazy(() =>
  import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette }))
)
const CreateSessionModal = lazy(() =>
  import('./components/CreateSessionModal').then((m) => ({ default: m.CreateSessionModal }))
)
const VoiceMiniPlayer = lazy(() =>
  import('./components/VoiceMiniPlayer').then((m) => ({ default: m.VoiceMiniPlayer }))
)

// Lazy load shell components - conditional or deferred
const OfflineBanner = lazy(() =>
  import('./components/OfflineBanner').then((m) => ({ default: m.OfflineBanner }))
)
const SessionExpiredModal = lazy(() =>
  import('./components/SessionExpiredModal').then((m) => ({ default: m.SessionExpiredModal }))
)
const RateLimitBanner = lazy(() =>
  import('./components/RateLimitBanner').then((m) => ({ default: m.RateLimitBanner }))
)
const PWAInstallBanner = lazy(() =>
  import('./components/PWAInstallBanner').then((m) => ({ default: m.PWAInstallBanner }))
)
const NotificationBanner = lazy(() => import('./components/NotificationBanner'))
const CookieConsent = lazy(() =>
  import('./components/CookieConsent').then((m) => ({ default: m.CookieConsent }))
)
const TourGuide = lazy(() =>
  import('./components/TourGuide').then((m) => ({ default: m.TourGuide }))
)
const LevelUpModal = lazy(() =>
  import('./components/LevelUpModal').then((m) => ({ default: m.LevelUpModal }))
)
const AchievementToast = lazy(() =>
  import('./components/LevelUpModal').then((m) => ({ default: m.AchievementToast }))
)
const RatingPrompt = lazy(() =>
  import('./components/RatingPrompt').then((m) => ({ default: m.RatingPrompt }))
)

// Global state banners
const GlobalStateBanners = memo(function GlobalStateBanners() {
  const { showModal, dismissModal } = useSessionExpiry()
  const {
    isRateLimited,
    retryAfter,
    dismiss: dismissRateLimit,
    reset: resetRateLimit,
  } = useRateLimitStore()

  return (
    <>
      <SessionExpiredModal isOpen={showModal} onReconnect={() => {}} onDismiss={dismissModal} />
      {isRateLimited && (
        <RateLimitBanner
          retryAfter={retryAfter}
          onRetry={resetRateLimit}
          onDismiss={dismissRateLimit}
        />
      )}
    </>
  )
})

export default function ClientShell() {
  const { initialize, user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  useDocumentTitle()
  useScrollRestoration()
  useSwipeBack()
  useNavigationProgress()
  useAppResume()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Track page views on route changes
  useEffect(() => {
    import('./utils/analytics').then(({ trackPageView }) => {
      trackPageView(location.pathname + location.search)
    })
  }, [location.pathname, location.search])

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

  // Web Vitals monitoring disabled — import resolution issue with webVitals.ts in SSR bundler.
  // Re-enable when Vite handles the .ts extension consistently in client/server builds.

  // Capture PWA install prompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      usePWAInstallStore.getState().setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Initialize error tracker + prefetch routes + identify user when authenticated
  const trackerInitRef = useRef(false)
  useEffect(() => {
    if (user && !trackerInitRef.current) {
      trackerInitRef.current = true
      initErrorTracker()

      // Set user context for error reports
      import('./lib/errorTracker').then(({ setUser }) => {
        setUser({ id: user.id, username: user.user_metadata?.username as string | undefined })
      })

      import('./utils/routePrefetch').then(({ prefetchProbableRoutes }) => {
        prefetchProbableRoutes()
      })

      // Identify user in analytics
      import('./utils/analytics').then(({ identifyUser }) => {
        identifyUser(user.id, {
          username: user.user_metadata?.username as string | undefined,
          email: user.email,
          premium: user.user_metadata?.premium as boolean | undefined,
          created_at: user.created_at,
        })
      })
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
          const { supabase } = await import('./lib/supabaseMinimal')
          const { data: callerProfile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', callerId)
            .single()
          if (callerProfile) {
            setIncomingCall(
              {
                id: callerId,
                username: callerProfile.username,
                avatar_url: callerProfile.avatar_url,
              },
              incomingCallId
            )
          }
        } catch (error) {
          console.error('[App] Error handling incoming call from URL:', error)
        }
      }
      handleIncomingCallFromUrl()
      searchParams.delete('incoming_call')
      searchParams.delete('caller_id')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, user])

  // Subscribe to incoming calls — lazy-loads voice call module (426KB) only when user is authenticated
  // BUG-2: Protect against unmount before lazy import resolves — track mounted state
  useEffect(() => {
    if (!user) return
    let unsubscribe: (() => void) | undefined
    let isMounted = true
    import('./hooks/useVoiceCall').then(({ subscribeToIncomingCalls }) => {
      if (isMounted) {
        unsubscribe = subscribeToIncomingCalls(user.id)
      }
    })
    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [user])

  // Auto-subscribe to push notifications
  const pushSubscribedRef = useRef(false)
  useEffect(() => {
    if (!user) {
      pushSubscribedRef.current = false
      return
    }
    if (pushSubscribedRef.current) return

    const timeoutId = setTimeout(async () => {
      try {
        const pushStore = usePushNotificationStore.getState()
        if (!pushStore.isSupported) return
        if (pushStore.isSubscribed) {
          pushSubscribedRef.current = true
          return
        }
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
          <Suspense fallback={null}>
            <CallModal />
            <IncomingCallModal />
          </Suspense>
          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>
          <Suspense fallback={null}>
            <CreateSessionModal />
          </Suspense>
          <Suspense fallback={null}>
            <VoiceMiniPlayer />
          </Suspense>
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
        <LevelUpModal />
        <AchievementToast />
        <RatingPrompt />
      </Suspense>
    </>
  )
}
