import { lazy, Suspense, memo, useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { AppLayout } from './components/layout'
import { useAuthStore, useSquadsStore } from './hooks'
import { pageTransitionVariants, pageTransitionConfig } from './components/PageTransition'
import { ErrorBoundary } from './components/ErrorBoundary'

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
const Discover = lazy(() => import('./pages/Discover'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const Maintenance = lazy(() => import('./pages/Maintenance'))

// Optimized loading spinner - memoized to prevent re-renders
export const LoadingSpinner = memo(function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

// Page loading skeleton
const PageSkeleton = memo(function PageSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

// Landing page that redirects logged-in users to /home
const LandingOrHome = memo(function LandingOrHome() {
  const { user, isInitialized } = useAuthStore()
  const [searchParams] = useSearchParams()
  const showPublic = searchParams.get('public') === 'true'
  if (!isInitialized) return <LoadingSpinner />
  if (user && !showPublic) return <Navigate to="/home" replace />
  return <Landing />
})

// Memoized ProtectedRoute
export const ProtectedRoute = memo(function ProtectedRoute({
  children,
  skipOnboardingCheck = false
}: {
  children: React.ReactNode
  skipOnboardingCheck?: boolean
}) {
  const { user, isInitialized } = useAuthStore()
  const { squads, fetchSquads } = useSquadsStore()
  const [hasCheckedSquads, setHasCheckedSquads] = useState(false)

  useEffect(() => {
    if (user && !hasCheckedSquads) {
      fetchSquads().then(() => setHasCheckedSquads(true))
    }
  }, [user, hasCheckedSquads, fetchSquads])

  if (!isInitialized) return <LoadingSpinner />
  if (!user) return <Navigate to="/" replace />
  if (!skipOnboardingCheck && !hasCheckedSquads) return <LoadingSpinner />
  if (!skipOnboardingCheck && hasCheckedSquads && squads.length === 0 && localStorage.getItem('sq-onboarding-skipped') !== 'true') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
})

export function AppRoutes() {
  const location = useLocation()

  return (
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
                <Route path="/" element={<LandingOrHome />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<ProtectedRoute skipOnboardingCheck><Onboarding /></ProtectedRoute>} />
                <Route path="/squads" element={<ProtectedRoute><Squads /></ProtectedRoute>} />
                <Route path="/squad/:id" element={<ProtectedRoute><SquadDetail /></ProtectedRoute>} />
                <Route path="/party" element={<ProtectedRoute><Party /></ProtectedRoute>} />
                <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
                <Route path="/session/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/call-history" element={<ProtectedRoute><CallHistory /></ProtectedRoute>} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/help" element={<Help />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
                <Route path="/u/:username" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
                <Route path="/join/:code" element={<JoinSquad />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
      </LayoutGroup>
    </AppLayout>
  )
}
