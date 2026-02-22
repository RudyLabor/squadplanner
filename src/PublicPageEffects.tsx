import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { lazy, Suspense } from 'react'
import { useAuthStore } from './hooks/useAuth'

const CookieConsent = lazy(() =>
  import('./components/CookieConsent').then((m) => ({ default: m.CookieConsent }))
)
const OfflineBanner = lazy(() =>
  import('./components/OfflineBanner').then((m) => ({ default: m.OfflineBanner }))
)

// Lightweight client effects for public pages (landing, auth, etc.)
// This replaces the full ClientShell to avoid the heavy bundle on public routes,
// while still providing auth init (needed for redirect) and essential overlays.
export default function PublicPageEffects() {
  const { initialize } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Track page views on route changes
  useEffect(() => {
    import('./utils/analytics').then(({ trackPageView }) => {
      trackPageView(location.pathname + location.search)
    })
  }, [location.pathname, location.search])

  return (
    <Suspense fallback={null}>
      <CookieConsent />
      <OfflineBanner />
    </Suspense>
  )
}
