import { useEffect, useState, lazy, Suspense, memo } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AppLayout } from './components/layout'
import { useAuthStore, useSquadsStore, subscribeToIncomingCalls, usePushNotificationStore, useVoiceCallStore } from './hooks'
import { pageTransitionVariants, pageTransitionConfig } from './components/PageTransition'
import { supabase } from './lib/supabase'

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

// Lazy load heavy modals (only loaded when needed)
const CallModal = lazy(() => import('./components/CallModal').then(m => ({ default: m.CallModal })))
const IncomingCallModal = lazy(() => import('./components/IncomingCallModal').then(m => ({ default: m.IncomingCallModal })))
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })))

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

  useEffect(() => {
    initialize()
  }, [initialize])

  // Handle incoming call from URL params (when app opened from push notification)
  useEffect(() => {
    const incomingCallId = searchParams.get('incoming_call')
    const callerId = searchParams.get('caller_id')

    if (incomingCallId && callerId && user && callStatus === 'idle') {
      console.log('[App] Handling incoming call from URL:', { incomingCallId, callerId })

      const handleIncomingCallFromUrl = async () => {
        try {
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

  // Auto-subscribe to push notifications when user logs in (non-blocking)
  useEffect(() => {
    if (!user) return

    const timeoutId = setTimeout(async () => {
      try {
        const pushStore = usePushNotificationStore.getState()

        if (!pushStore.isSupported) {
          console.log('[App] Push notifications not supported on this browser')
          return
        }

        console.log('[App] Checking push subscription for user:', user.id.substring(0, 8) + '...')

        const success = await pushStore.subscribeToPush(user.id)
        console.log('[App] Push subscription result:', success ? 'subscribed' : 'failed')
      } catch (err) {
        console.warn('[App] Push setup failed:', err)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [user])

  return (
    <>
      {/* Global call modals - lazy loaded */}
      <Suspense fallback={null}>
        <CallModal />
        <IncomingCallModal />
      </Suspense>

      {/* Command Palette - lazy loaded */}
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>

      <AppLayout>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={pageTransitionVariants.slide.initial}
            animate={pageTransitionVariants.slide.animate}
            exit={pageTransitionVariants.slide.exit}
            transition={pageTransitionConfig}
            className="h-full"
          >
            <Suspense fallback={<PageSkeleton />}>
              <Routes location={location}>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
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

                {/* Catch-all redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </AppLayout>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
