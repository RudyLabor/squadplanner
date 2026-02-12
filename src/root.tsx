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
        <meta name="description" content="Squad Planner | Le Calendly du gaming. Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra ». Gratuit." />
        <meta name="theme-color" content="#08090a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Squad Planner" />
        {/* TODO: Generer les images splash-*.png dans public/ puis decommenter:
        <link rel="apple-touch-startup-image" href="/splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        */}
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
        <meta property="og:title" content="Squad Planner | Le Calendly du gaming" />
        <meta property="og:description" content="Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra » — ta squad joue pour de vrai. Gratuit, en 30 secondes." />
        <meta property="og:image" content="https://squadplanner.fr/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="Squad Planner" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Squad Planner | Le Calendly du gaming" />
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

        {/* FAQ Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "C'est quoi Squad Planner ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Squad Planner est le Calendly du gaming. C'est une application web gratuite qui permet de cr\u00e9er des squads, planifier des sessions de jeu avec RSVP et mesurer la fiabilit\u00e9 de chaque joueur."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Est-ce que Squad Planner est gratuit ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Oui, Squad Planner est enti\u00e8rement gratuit. Une version Premium optionnelle offre des fonctionnalit\u00e9s suppl\u00e9mentaires comme les statistiques avanc\u00e9es et la personnalisation."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Comment fonctionne le syst\u00e8me de fiabilit\u00e9 ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Chaque joueur a un score de fiabilit\u00e9 bas\u00e9 sur sa participation r\u00e9elle aux sessions. Quand tu dis 'Pr\u00e9sent' et que tu joues, ton score monte. Si tu ne te pr\u00e9sentes pas, il descend."
                  }
                }
              ]
            })
          }}
        />

        {/* BreadcrumbList Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Accueil",
                  "item": "https://squadplanner.fr/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Premium",
                  "item": "https://squadplanner.fr/premium"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Aide",
                  "item": "https://squadplanner.fr/help"
                },
                {
                  "@type": "ListItem",
                  "position": 4,
                  "name": "D\u00e9couvrir",
                  "item": "https://squadplanner.fr/discover"
                }
              ]
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
      <aside className="desktop-only w-[140px] shrink-0 bg-bg-elevated border-r border-border-subtle" aria-hidden="true" />
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
      <nav className="hidden lg:flex w-[200px] shrink-0 bg-bg-elevated border-r border-border-subtle flex-col p-4" aria-label="Menu principal">
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
          ].map(item => (
            <a key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-sm">{item.label}</a>
          ))}
        </div>
        <div className="mt-auto space-y-0.5">
          <a href="/help" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-sm">Aide</a>
          <a href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-sm">Paramètres</a>
        </div>
      </nav>

      {/* Contenu d'erreur — aligné visuellement avec la page 404 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Animated error icon — same style as 404 page */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-error/15 to-warning/[0.08] flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          </div>

          <h1 className="text-4xl font-bold text-text-primary mb-3">
            {status}
          </h1>

          <p className="text-lg font-semibold text-text-primary mb-2">
            {status === 503 ? 'Service temporairement indisponible' : status === 500 ? 'Erreur interne du serveur' : message}
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
              ].map(item => (
                <a key={item.href} href={item.href} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors">{item.label}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
