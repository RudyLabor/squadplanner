import {
  Links,
  Meta,
  ScrollRestoration,
} from 'react-router'
import { ClientProviders } from './ClientProviders'
import { ErrorBoundaryClient } from './ErrorBoundaryClient'
import './index.css'

// Layout component provides the HTML document shell (replaces index.html)
// This is rendered on the server — zero JS sent to client for this shell.
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
      </body>
    </html>
  )
}

// Root Server Component — renders on the server with zero client JS overhead.
// Client-side providers (QueryClient, LazyMotion, Toaster) are in the
// ClientProviders client boundary, which hydrates independently.
export function ServerComponent() {
  return <ClientProviders />
}

// Error boundary — delegated to client module (useRouteError is client-only in RSC)
export { ErrorBoundaryClient as ErrorBoundary } from './ErrorBoundaryClient'
