import { useEffect, lazy, Suspense, useState } from 'react'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
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
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="description" content="Squad Planner — Le Calendly du gaming. Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra ». Gratuit." />
        <meta name="theme-color" content="#08090a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Squad Planner" />
        <meta name="robots" content="index, follow" />

        {/* Preconnect for faster resource loading */}
        <link rel="preconnect" href="https://nxbqiwmfyafgshxzczxo.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://nxbqiwmfyafgshxzczxo.supabase.co" />
        <link rel="dns-prefetch" href="https://squadplanner-i1mfqcqs.livekit.cloud" />

        {/* Font preloads (self-hosted) */}
        <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://squadplanner.fr/" />
        <meta property="og:title" content="Squad Planner - Le Calendly du gaming" />
        <meta property="og:description" content="Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra » — ta squad joue pour de vrai. Gratuit, en 30 secondes." />
        <meta property="og:image" content="https://squadplanner.fr/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="Squad Planner" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://squadplanner.fr/" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://squadplanner.fr/" />
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

        {/* Critical CSS */}
        <link rel="stylesheet" href="/critical.css" />

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
        <Links />
      </head>
      <body>
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
    // Initialize theme on client
    import('./hooks/useTheme').then(({ useThemeStore }) => {
      const state = useThemeStore.getState()
      const effectiveTheme = state.mode === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : state.mode
      document.documentElement.setAttribute('data-theme', effectiveTheme)
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
      </LazyMotion>
    </QueryClientProvider>
  )
}

// SSR-safe fallback - renders just the route content without client-side chrome
function SSRFallback() {
  return <Outlet />
}

// Error boundary for the root route
export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary mb-4">{error.status}</h1>
          <p className="text-text-secondary text-lg">{error.statusText}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-error mb-4">Oops!</h1>
        <p className="text-text-secondary text-lg">Une erreur inattendue est survenue.</p>
      </div>
    </div>
  )
}
