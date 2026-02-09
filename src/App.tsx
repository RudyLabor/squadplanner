import { useEffect, useState, lazy, Suspense, memo, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './components/layout'
import { useAuthStore, useSquadsStore, subscribeToIncomingCalls, usePushNotificationStore, useVoiceCallStore, useThemeStore } from './hooks'
import { pageTransitionVariants, pageTransitionConfig } from './components/PageTransition'
import { initSentry } from './lib/sentry'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineBanner } from './components/OfflineBanner'
import { PWAInstallBanner } from './components/PWAInstallBanner'
import { usePWAInstallStore } from './hooks/usePWAInstall'
import { CookieConsent } from './components/CookieConsent'
import { TourGuide } from './components/TourGuide'
import NotificationBanner from './components/NotificationBanner'
import { queryClient } from './lib/queryClient'

// Initialize theme on app load - triggers theme initialization before first render
void useThemeStore.getState()

// Lazy load all pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const Auth = lazy(() => import('./pages/Auth'))
const Squads = lazy(() => import('./pages/Squads'))
const SquadDetail = lazy(() => import('./pages/SquadDetail'))
const SessionDetail = lazy(() => import('./pages/SessionDetail'))
const Landing = lazy(() => import('./pages/Landing'))
const Sessions = lazy(() => import('./pages/Sessions').then(m => ({ default: m.Sessions })))
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })))
const Messages = lazy(() => import('./pages/Messages').then(m => ({ default: m.Messages })))
const Party = lazy(() => import('./pages/Party').then(m => ({ default: m.Party })))
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })))
const CallHistory = lazy(() => import('./pages/CallHistory').then(m => ({ default: m.CallHistory })))
const Premium = lazy(() => import('./pages/Premium').then(m => ({ default: m.Premium })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const Help = lazy(() => import('./pages/Help').then(m => ({ default: m.Help })))
const JoinSquad = lazy(() => import('./pages/JoinSquad').then(m => ({ default: m.JoinSquad })))
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })))
const Legal = lazy(() => import('./pages/Legal').then(m => ({ default: m.Legal })))

// Lazy load heavy modals (only loaded when needed)
const CallModal = lazy(() => import('./components/CallModal').then(m => ({ default: m.CallModal })))
const IncomingCallModal = lazy(() => import('./components/IncomingCallModal').then(m => ({ default: m.IncomingCallModal })))
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })))
const CreateSessionModal = lazy(() => import('./components/CreateSessionModal').then(m => ({ default: m.CreateSessionModal })))

// Optimized loading spinner - memoized to prevent re-renders
const LoadingSpinner = memo(function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#5e6dd2] border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

// Page loading skeleton - smaller, inline loading for page transitions
const PageSkeleton = memo(function PageSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#5e6dd2] border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

// Landing page that redirects logged-in users to /home (unless ?public=true)
const LandingOrHome = memo(function LandingOrHome() {
  const { user, isInitialized } = useAuthStore()
  const [searchParams] = useSearchParams()
  const showPublic = searchParams.get('public') === 'true'

  // Show loading while checking auth
  if (!isInitialized) {
    return <LoadingSpinner />
  }

  // Redirect logged-in users to home (unless they want to see the public landing)
  if (user && !showPublic) {
    return <Navigate to="/home" replace />
  }

  // Show landing page for non-authenticated users or when ?public=true
  return <Landing />
})

// Memoized ProtectedRoute for performance
const ProtectedRoute = memo(function ProtectedRoute({
  children,
  skipOnboardingCheck = false
}: {
  children: React.ReactNode
  skipOnboardingCheck?: boolean
}) {
  const { user, isInitialized } = useAuthStore()
  const { squads, fetchSquads } = useSquadsStore()
  const [hasCheckedSquads, setHasCheckedSquads] = useState(false)

  // Fetch squads when user is authenticated
  useEffect(() => {
    if (user && !hasCheckedSquads) {
      fetchSquads().then(() => setHasCheckedSquads(true))
    }
  }, [user, hasCheckedSquads, fetchSquads])

  if (!isInitialized) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!skipOnboardingCheck && !hasCheckedSquads) {
    return <LoadingSpinner />
  }

  if (!skipOnboardingCheck && hasCheckedSquads && squads.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
})

function AppContent() {
  const { initialize, user } = useAuthStore()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setIncomingCall, status: callStatus } = useVoiceCallStore()

  useDocumentTitle()

  useEffect(() => {
    initialize()
  }, [initialize])

  // PHASE 5.2: Capture PWA install prompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usePWAInstallStore.getState().setDeferredPrompt(e as any)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Initialize Sentry ONLY when user is authenticated (keeps it out of landing bundle)
  const sentryInitRef = useRef(false)
  useEffect(() => {
    if (user && !sentryInitRef.current) {
      sentryInitRef.current = true
      initSentry().catch((err) => {
        console.warn('[App] Sentry initialization failed:', err)
      })
    }
  }, [user])

  // Handle incoming call from URL params (when app opened from push notification)
  useEffect(() => {
    const incomingCallId = searchParams.get('incoming_call')
    const callerId = searchParams.get('caller_id')

    if (incomingCallId && callerId && user && callStatus === 'idle') {
      console.log('[App] Handling incoming call from URL:', { incomingCallId, callerId })

      const handleIncomingCallFromUrl = async () => {
        try {
          const { supabase } = await import('./lib/supabase')
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
  }, [searchParams, setSearchParams, user, callStatus, setIncomingCall])

  // Subscribe to incoming calls when user is authenticated
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToIncomingCalls(user.id)
    return () => unsubscribe()
  }, [user])

  // Track if we've already subscribed to push this session to avoid re-subscribing on every navigation
  const pushSubscribedRef = useRef(false)

  // Auto-subscribe to push notifications when user logs in (non-blocking, once per session)
  useEffect(() => {
    if (!user) {
      // Reset flag when user logs out
      pushSubscribedRef.current = false
      return
    }

    // Skip if already subscribed this session
    if (pushSubscribedRef.current) return

    const timeoutId = setTimeout(async () => {
      try {
        const pushStore = usePushNotificationStore.getState()

        if (!pushStore.isSupported) {
          if (!import.meta.env.PROD) {
            console.log('[App] Push notifications not supported on this browser')
          }
          return
        }

        // Check if already subscribed in the store
        if (pushStore.isSubscribed) {
          pushSubscribedRef.current = true
          return
        }

        if (!import.meta.env.PROD) {
          console.log('[App] Checking push subscription for user:', user.id.substring(0, 8) + '...')
        }

        const success = await pushStore.subscribeToPush(user.id)
        pushSubscribedRef.current = success

        if (!import.meta.env.PROD) {
          console.log('[App] Push subscription result:', success ? 'subscribed' : 'failed')
        }
      } catch (err) {
        if (!import.meta.env.PROD) {
          console.warn('[App] Push setup failed:', err)
        }
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [user])

  return (
    <>
      {/* Global call modals & command palette - only loaded for authenticated users */}
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
        </>
      )}

      <AppLayout>
        <LayoutGroup>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={pageTransitionVariants.slide.initial}
            animate={pageTransitionVariants.slide.animate}
            exit={{ ...pageTransitionVariants.slide.exit, position: 'absolute' as const, top: 0, left: 0, right: 0 }}
            transition={pageTransitionConfig}
            className="h-full"
          >
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <Routes location={location}>
                  {/* Public routes - Redirect logged-in users from landing to home */}
                  <Route path="/" element={<LandingOrHome />} />
                  <Route path="/home" element={
                    <ProtectedRoute><Home /></ProtectedRoute>
                  } />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={
                  <ProtectedRoute skipOnboardingCheck><Onboarding /></ProtectedRoute>
                } />

                {/* Protected routes */}
                <Route path="/squads" element={
                  <ProtectedRoute><Squads /></ProtectedRoute>
                } />
                <Route path="/squad/:id" element={
                  <ProtectedRoute><SquadDetail /></ProtectedRoute>
                } />
                <Route path="/party" element={
                  <ProtectedRoute><Party /></ProtectedRoute>
                } />
                <Route path="/sessions" element={
                  <ProtectedRoute><Sessions /></ProtectedRoute>
                } />
                <Route path="/session/:id" element={
                  <ProtectedRoute><SessionDetail /></ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute><Messages /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
                <Route path="/call-history" element={
                  <ProtectedRoute><CallHistory /></ProtectedRoute>
                } />
                <Route path="/premium" element={
                  <Premium />
                } />
                <Route path="/settings" element={
                  <ProtectedRoute><Settings /></ProtectedRoute>
                } />
                <Route path="/help" element={<Help />} />
                <Route path="/legal" element={<Legal />} />

                {/* Deep linking - Join squad via invite code */}
                <Route path="/join/:code" element={<JoinSquad />} />

                {/* 404 - Page not found */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
        </LayoutGroup>
      </AppLayout>
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
        {/* Offline/Online status banner */}
        <OfflineBanner />
        {/* PWA install prompt — Phase 5.2 */}
        <PWAInstallBanner />
        {/* In-app notification banners - V3 */}
        <NotificationBanner />
        {/* Cookie consent popup - RGPD compliance */}
        <CookieConsent />
        {/* Tour guide for new users */}
        <TourGuide />
        {/* Global toast notifications - Phase 3.4 */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f1012',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#fafafa',
              fontSize: '14px',
              borderRadius: '12px',
              padding: '12px 16px',
              position: 'relative' as const,
              overflow: 'hidden',
            },
            classNames: {
              success: 'border-[#34d399]/20 bg-[#34d399]/10',
              error: 'border-[#f87171]/20 bg-[#f87171]/10',
              warning: 'border-[#fbbf24]/20 bg-[#fbbf24]/10',
              info: 'border-[#6366f1]/20 bg-[#6366f1]/10',
            },
          }}
        />

        {/* Aria-live regions for screen reader announcements */}
        <div
          id="aria-live-polite"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        <div
          id="aria-live-assertive"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
