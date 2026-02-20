import { useEffect, lazy, Suspense, useState } from 'react'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  useLocation,
} from 'react-router'
import { Toaster } from 'sonner'
import { LazyMotion } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import './index.css'

// Client-only imports (deferred to avoid SSR issues)
const ClientShell = lazy(() => import('./ClientShell'))
const PublicPageEffects = lazy(() => import('./PublicPageEffects'))

// domMax required: Drawer, Sheet, Toast, Tabs, SwipeableMessage all use drag gestures
const loadFeatures = () => import('framer-motion').then((mod) => mod.domMax)

// Routes that skip the full ClientShell (no sidebar, no heavy hooks)
const PUBLIC_PATHS = ['/', '/auth', '/onboarding', '/legal', '/help', '/premium', '/maintenance']
function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/join/') || pathname.startsWith('/s/')
}

// Layout component provides the HTML document shell (replaces index.html)
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta
          name="description"
          content="Squad Planner | Le Calendly du gaming. Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra ». Gratuit."
        />
        <meta name="theme-color" content="#08090a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Squad Planner" />
        {/* Splash screens — uncomment when splash-*.png images are generated in public/
        <link rel="apple-touch-startup-image" href="/splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        */}
        <meta name="robots" content="index, follow" />

        {/* Preconnect for faster resource loading */}
        <link
          rel="preconnect"
          href="https://nxbqiwmfyafgshxzczxo.supabase.co"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://nxbqiwmfyafgshxzczxo.supabase.co" />
        {/* LIVEKIT REMOVED: DNS prefetch removed */}
        {/* <link rel="dns-prefetch" href="https://squadplanner-i1mfqcqs.livekit.cloud" /> */}

        {/* Inline @font-face so browser can match preload to font declaration immediately,
            without waiting for critical.css to parse. Prevents "preloaded but not used" warning. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `@font-face{font-family:'Inter';font-style:normal;font-weight:100 900;font-display:swap;src:url('/fonts/inter-var-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;size-adjust:100%;ascent-override:90%;descent-override:22%;line-gap-override:0%}@font-face{font-family:'Space Grotesk';font-style:normal;font-weight:300 700;font-display:swap;src:url('/fonts/space-grotesk-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}`,
          }}
        />
        <link
          rel="preload"
          href="/fonts/inter-var-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/space-grotesk-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Squad Planner | Le Calendly du gaming" />
        <meta
          property="og:description"
          content="Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra » — ta squad joue pour de vrai. Gratuit, en 30 secondes."
        />
        <meta property="og:image" content="https://squadplanner.fr/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="Squad Planner" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Squad Planner | Le Calendly du gaming" />
        <meta
          name="twitter:description"
          content="Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra » — ta squad joue pour de vrai. Gratuit, en 30 secondes."
        />
        <meta name="twitter:image" content="https://squadplanner.fr/og-image.png" />

        {/* JSON-LD Structured Data — single @graph reduces DOM nodes and parse time */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebApplication',
                  name: 'Squad Planner',
                  alternateName: 'Le Calendly du gaming',
                  url: 'https://squadplanner.fr',
                  description: "Crée l'habitude de jouer ensemble. Planifie, confirme, joue. Fini les 'on verra'.",
                  applicationCategory: 'GameApplication',
                  operatingSystem: 'Web, iOS, Android',
                  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
                  author: { '@type': 'Organization', name: 'Squad Planner' },
                  inLanguage: 'fr',
                  potentialAction: { '@type': 'ViewAction', target: 'https://squadplanner.fr/auth' },
                },
                {
                  '@type': 'Organization',
                  name: 'Squad Planner',
                  url: 'https://squadplanner.fr',
                  logo: 'https://squadplanner.fr/favicon.svg',
                  sameAs: [],
                  contactPoint: { '@type': 'ContactPoint', email: 'contact@squadplanner.fr', contactType: 'customer support', availableLanguage: 'French' },
                },
                {
                  '@type': 'BreadcrumbList',
                  itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
                    { '@type': 'ListItem', position: 2, name: 'Premium', item: 'https://squadplanner.fr/premium' },
                    { '@type': 'ListItem', position: 3, name: 'Aide', item: 'https://squadplanner.fr/help' },
                    { '@type': 'ListItem', position: 4, name: 'Découvrir', item: 'https://squadplanner.fr/discover' },
                  ],
                },
              ],
            }),
          }}
        />

        {/* Critical CSS — inlined to eliminate render-blocking network request */}
        <style
          dangerouslySetInnerHTML={{
            __html: `@font-face{font-family:'Space Grotesk';font-style:normal;font-weight:300 700;font-display:optional;src:url('/fonts/space-grotesk-latin.woff2') format('woff2')}:root{--color-bg-base:#050506;--color-primary:#5c60ef}html,body,#root{margin:0;padding:0;min-height:100vh;background-color:var(--color-bg-base);color:#fafafa;font-family:'Inter',system-ui,-apple-system,sans-serif}.initial-loader{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:var(--color-bg-base);z-index:9999}.initial-loader-spinner{width:32px;height:32px;border:2px solid var(--color-primary);border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.skip-link{position:absolute;top:-100px;left:0;background:var(--color-primary);color:white;padding:8px 16px;z-index:10000;text-decoration:none;font-weight:500;border-radius:0 0 8px 0;transition:top 0.2s}.skip-link:focus{top:0}`,
          }}
        />

        {/* Blocking theme script — runs BEFORE React hydration to prevent FOUC and CLS */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('squadplanner-theme')||'{}');var m=s&&s.state&&s.state.mode||'dark';var t=m==='system'?(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):m;document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`,
          }}
        />

        {/* Handle stale module scripts after deploy — reload once to get fresh chunks */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('vite:preloadError',function(e){e.preventDefault();if(!sessionStorage.getItem('sp-reload')){sessionStorage.setItem('sp-reload','1');location.reload()}})`,
          }}
        />

        {/* Speculation Rules — prefetch only (prerender too costly on mobile 4G) */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prefetch: [
                {
                  where: {
                    and: [
                      { href_matches: '/*' },
                      { not: { selector_matches: '[data-no-prefetch]' } },
                    ],
                  },
                  eagerness: 'moderate',
                },
              ],
            }),
          }}
        />

        <Meta />
        {/* Dynamic canonical fallback */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var c=document.querySelector('link[rel="canonical"]');if(!c){c=document.createElement('link');c.rel='canonical';document.head.appendChild(c)}c.href='https://squadplanner.fr'+location.pathname;var o=document.querySelector('meta[property="og:url"]');if(o)o.content=c.href})()`,
          }}
        />
        <Links />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// Root component - SSR-safe shell, client-only features deferred
//
// PUBLIC PAGES (landing, auth, onboarding…):
//   <Outlet /> is rendered at a STABLE position in the React tree.
//   When isClient flips true, only PublicPageEffects is added above —
//   the <main><Outlet /></main> stays at the same Fragment index so
//   React never unmounts/remounts the page (no "double refresh").
//
// PROTECTED PAGES (home, squads, sessions…):
//   Full ClientShell with sidebar, nav, modals, etc.
//   The swap from SSRFallback → ClientShell causes a remount, but that's
//   acceptable because protected pages require auth and often redirect.
export default function Root() {
  const [isClient, setIsClient] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setIsClient(true)
    import('./hooks/useTheme').then(({ useThemeStore }) => {
      const { mode } = useThemeStore.getState()
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      const effectiveTheme = mode === 'system' ? systemTheme : mode
      document.documentElement.setAttribute('data-theme', effectiveTheme)
      useThemeStore.setState({ effectiveTheme })
    })

    // Steal orphaned auth-token locks when the tab becomes visible again.
    // Background tabs can hold locks indefinitely if a Supabase token
    // refresh was frozen mid-flight by the browser's throttling.
    const cleanupStaleLocks = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const { held } = await navigator.locks.query()
        const stuck = held?.find((l: LockInfo) => l.name.includes('auth-token'))
        if (stuck) {
          await navigator.locks.request(stuck.name, { steal: true }, () => {})
        }
      } catch {
        // navigator.locks may not be available (e.g. Firefox private browsing)
      }
    }
    document.addEventListener('visibilitychange', cleanupStaleLocks)
    return () => document.removeEventListener('visibilitychange', cleanupStaleLocks)
  }, [])

  const isPublic = isPublicPath(pathname)

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadFeatures} strict>
        {isPublic ? (
          <>
            {/* Position 0: client effects (null during SSR/hydration, Suspense after) */}
            {isClient && (
              <Suspense fallback={null}>
                <PublicPageEffects />
              </Suspense>
            )}
            {/* Position 1: STABLE — never unmounts across isClient flip */}
            <main id="main-content">
              <Outlet />
            </main>
          </>
        ) : isClient ? (
          <Suspense fallback={<SSRFallback />}>
            <ClientShell />
          </Suspense>
        ) : (
          <SSRFallback />
        )}
        {/* Toaster must be client-only — sonner uses portals that differ between SSR and client,
            causing React hydration error #418 if rendered during SSR */}
        {isClient && (
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              classNames: {
                toast: 'bg-bg-surface border-border-default text-text-primary',
                success: 'border-success/20 bg-success/10',
                error: 'border-error/20 bg-error/10',
                warning: 'border-warning/20 bg-warning/10',
                info: 'border-primary/20 bg-primary/10',
              },
            }}
          />
        )}
        <div id="aria-live-polite" aria-live="polite" aria-atomic="true" className="sr-only" />
        <div
          id="aria-live-assertive"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        />
      </LazyMotion>
    </QueryClientProvider>
  )
}

// SSR-safe fallback for PROTECTED pages only.
// Public pages are handled directly in Root (stable Outlet position).
// Sidebar width must match DesktopSidebar collapsed width (140px) and
// DesktopContentWrapper initial marginLeft (140px) to avoid layout shift on hydration.
function SSRFallback() {
  return (
    <div className="h-[100dvh] bg-bg-base flex overflow-hidden">
      <aside
        className="desktop-only w-[140px] shrink-0 bg-bg-elevated border-r border-border-subtle"
        aria-hidden="true"
      />
      <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}

// Error boundary for the root route
export function ErrorBoundary() {
  const error = useRouteError()
  const isRoute = isRouteErrorResponse(error)
  const status = isRoute ? error.status : 500
  const message = isRoute ? error.statusText : 'Une erreur inattendue est survenue'

  // Report error to error tracker in production
  useEffect(() => {
    if (!isRoute && error instanceof Error && import.meta.env?.PROD) {
      import('./lib/errorTracker').then(({ captureException }) => {
        captureException(error, {
          errorBoundary: 'RootErrorBoundary',
          status,
          url: typeof window !== 'undefined' ? window.location.href : '',
        })
      })
    }
  }, [error, isRoute, status])

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar de navigation — style cohérent avec la 404 */}
      <nav
        className="hidden lg:flex w-[200px] shrink-0 bg-bg-elevated border-r border-border-subtle flex-col p-4"
        aria-label="Menu principal"
      >
        <a href="/" className="flex items-center gap-2 mb-8 px-2">
          <img src="/favicon.svg" alt="Squad Planner" className="w-8 h-8" />
          <span className="font-semibold text-text-primary">Squad Planner</span>
        </a>
        <div className="flex flex-col gap-1">
          {[
            { href: '/home', label: 'Accueil' },
            { href: '/squads', label: 'Mes Squads' },
            { href: '/sessions', label: 'Sessions' },
            { href: '/messages', label: 'Messages' },
            { href: '/discover', label: 'Découvrir' },
            { href: '/profile', label: 'Profil' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-sm"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="mt-auto space-y-0.5">
          <a
            href="/help"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-sm"
          >
            Aide
          </a>
          <a
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-sm"
          >
            Paramètres
          </a>
        </div>
      </nav>

      {/* Contenu d'erreur — aligné visuellement avec la page 404 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Animated error icon — same style as 404 page */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-error/15 to-warning/[0.08] flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-text-primary mb-3">{status}</h1>

          <p className="text-lg font-semibold text-text-primary mb-2">
            {status === 503
              ? 'Service temporairement indisponible'
              : status === 500
                ? 'Erreur interne du serveur'
                : message}
          </p>

          <p className="text-md text-text-secondary mb-8">
            {status === 503
              ? 'Le serveur est temporairement surchargé. Réessaie dans quelques instants.'
              : 'Une erreur inattendue est survenue. Tu peux essayer de recharger la page.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-md font-medium hover:bg-primary-hover transition-colors"
            >
              Recharger la page
            </button>
            <a
              href="/home"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-overlay-subtle text-text-secondary text-md font-medium hover:bg-overlay-light transition-colors border border-border-subtle"
            >
              Retour à l'accueil
            </a>
          </div>

          {/* Pages populaires — même pattern que la 404 */}
          <div className="border-t border-border-subtle pt-6">
            <p className="text-sm text-text-tertiary mb-4">Pages populaires</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { href: '/squads', label: 'Mes squads' },
                { href: '/messages', label: 'Messages' },
                { href: '/help', label: 'Aide' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
