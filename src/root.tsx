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

const loadFeatures = () => import('framer-motion').then(mod => mod.domMax)

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
        <meta name="description" content="Squad Planner — Le Calendly du gaming. Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra ». Gratuit." />
        <meta name="theme-color" content="#08090a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Squad Planner" />
        <meta name="robots" content="index, follow" />

        {/* Preconnect for faster resource loading */}
        <link rel="preconnect" href="https://nxbqiwmfyafgshxzczxo.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://nxbqiwmfyafgshxzczxo.supabase.co" />
        <link rel="dns-prefetch" href="https://squadplanner-i1mfqcqs.livekit.cloud" />

        {/* Inline @font-face so browser can match preload to font declaration immediately,
            without waiting for critical.css to parse. Prevents "preloaded but not used" warning. */}
        <style dangerouslySetInnerHTML={{ __html: `@font-face{font-family:'Inter';font-style:normal;font-weight:100 900;font-display:swap;src:url('/fonts/inter-var-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;size-adjust:100%;ascent-override:90%;descent-override:22%;line-gap-override:0%}@font-face{font-family:'Space Grotesk';font-style:normal;font-weight:300 700;font-display:swap;src:url('/fonts/space-grotesk-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}` }} />
        <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Squad Planner - Le Calendly du gaming" />
        <meta property="og:description" content="Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra » — ta squad joue pour de vrai. Gratuit, en 30 secondes." />
        <meta property="og:image" content="https://squadplanner.fr/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="Squad Planner" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Squad Planner - Le Calendly du gaming" />
        <meta name="twitter:description" content="Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra » — ta squad joue pour de vrai. Gratuit, en 30 secondes." />
        <meta name="twitter:image" content="https://squadplanner.fr/og-image.png" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Squad Planner",
              "alternateName": "Le Calendly du gaming",
              "url": "https://squadplanner.fr",
              "description": "Crée l'habitude de jouer ensemble. Planifie, confirme, joue. Fini les 'on verra'.",
              "applicationCategory": "GameApplication",
              "operatingSystem": "Web, iOS, Android",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
              "author": { "@type": "Organization", "name": "Squad Planner" },
              "inLanguage": "fr",
              "potentialAction": { "@type": "ViewAction", "target": "https://squadplanner.fr/auth" }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Squad Planner",
              "url": "https://squadplanner.fr",
              "logo": "https://squadplanner.fr/favicon.svg",
              "sameAs": [],
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "contact@squadplanner.fr",
                "contactType": "customer support",
                "availableLanguage": "French"
              }
            })
          }}
        />

        {/* Critical CSS */}
        <link rel="stylesheet" href="/critical.css" />

        {/* Blocking theme script — runs BEFORE React hydration to prevent FOUC and CLS */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('squadplanner-theme')||'{}');var m=s&&s.state&&s.state.mode||'system';var t=m==='system'?(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):m;document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`,
          }}
        />

        {/* Handle stale module scripts after deploy — reload once to get fresh chunks */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('vite:preloadError',function(e){e.preventDefault();if(!sessionStorage.getItem('sp-reload')){sessionStorage.setItem('sp-reload','1');location.reload()}})`,
          }}
        />

        {/* Speculation Rules for predictive navigation */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [{
                where: {
                  and: [
                    { href_matches: "/*" },
                    { not: { href_matches: "/auth*" } },
                    { not: { href_matches: "/api/*" } }
                  ]
                },
                eagerness: "moderate"
              }],
              prefetch: [{
                where: {
                  and: [
                    { href_matches: "/*" },
                    { not: { selector_matches: "[data-no-prefetch]" } }
                  ]
                },
                eagerness: "moderate"
              }]
            })
          }}
        />

        <Meta />
        {/* Dynamic canonical fallback */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var c=document.querySelector('link[rel="canonical"]');if(!c){c=document.createElement('link');c.rel='canonical';document.head.appendChild(c)}c.href='https://squadplanner.fr'+location.pathname;var o=document.querySelector('meta[property="og:url"]');if(o)o.content=c.href})()` }} />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// Root component - SSR-safe shell, client-only features deferred
export default function Root() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    import('./hooks/useTheme').then(({ useThemeStore }) => {
      const { mode } = useThemeStore.getState()
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      const effectiveTheme = mode === 'system' ? systemTheme : mode
      document.documentElement.setAttribute('data-theme', effectiveTheme)
      useThemeStore.setState({ effectiveTheme })
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadFeatures} strict>
        {isClient ? (
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
        )}
        <div id="aria-live-polite" aria-live="polite" aria-atomic="true" className="sr-only" />
        <div id="aria-live-assertive" aria-live="assertive" aria-atomic="true" className="sr-only" />
      </LazyMotion>
    </QueryClientProvider>
  )
}

// SSR-safe fallback - renders layout structure matching client to prevent CLS
// Sidebar width must match DesktopSidebar collapsed width (140px) and
// DesktopContentWrapper initial marginLeft (140px) to avoid layout shift on hydration.
// Public pages (landing, auth, onboarding, etc.) skip the sidebar entirely.
function SSRFallback() {
  const { pathname } = useLocation()
  const isPublicPage = pathname === '/' || pathname === '/auth' || pathname === '/onboarding'
    || pathname === '/legal' || pathname === '/help' || pathname === '/premium'
    || pathname === '/maintenance' || pathname.startsWith('/join/')

  if (isPublicPage) {
    return (
      <main id="main-content">
        <Outlet />
      </main>
    )
  }

  return (
    <div className="h-[100dvh] bg-bg-base flex overflow-hidden">
      <aside className="hidden lg:block w-[140px] shrink-0 bg-bg-elevated border-r border-border-subtle" aria-hidden="true" />
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
      {/* Sidebar de navigation simplifiée */}
      <nav className="hidden lg:flex w-[200px] shrink-0 bg-bg-elevated border-r border-border-subtle flex-col p-4" aria-label="Menu principal">
        <a href="/" className="flex items-center gap-2 mb-8 px-2">
          <img src="/favicon.svg" alt="Squad Planner" className="w-8 h-8" />
          <span className="font-semibold text-text-primary">Squad Planner</span>
        </a>
        <div className="flex flex-col gap-1">
          <a href="/squads" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Mes Squads</a>
          <a href="/sessions" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Sessions</a>
          <a href="/messages" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Messages</a>
          <a href="/discover" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Découvrir</a>
          <a href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Profil</a>
        </div>
        <div className="mt-auto">
          <a href="/help" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Aide</a>
          <a href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Paramètres</a>
        </div>
      </nav>

      {/* Contenu d'erreur */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">😵</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {isRoute ? status : 'Quelque chose s\'est mal passé'}
          </h1>
          <p className="text-md text-text-secondary mb-8">
            {message}. Tu peux essayer de recharger la page ou revenir à la navigation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-md font-medium hover:bg-primary-hover transition-colors"
            >
              Recharger la page
            </button>
            <a
              href="/squads"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-overlay-subtle text-text-secondary text-md font-medium hover:bg-overlay-light transition-colors border border-border-subtle"
            >
              Mes Squads
            </a>
          </div>
          {/* Navigation mobile */}
          <div className="lg:hidden mt-6 flex flex-wrap gap-2 justify-center">
            <a href="/squads" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors">Squads</a>
            <a href="/sessions" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors">Sessions</a>
            <a href="/messages" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors">Messages</a>
            <a href="/discover" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors">Découvrir</a>
            <a href="/help" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors">Aide</a>
          </div>
        </div>
      </div>
    </div>
  )
}
