import type { HeadersArgs } from 'react-router'
import { lazy, Suspense } from 'react'

const VsGoogleCalendarVsSquadPlanner = lazy(() => import('../pages/VsGoogleCalendarVsSquadPlanner'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    { title: 'Google Calendar vs Squad Planner - Planification Gaming 2026' },
    {
      name: 'description',
      content: 'Google Calendar vs Squad Planner pour organiser tes sessions gaming. Comparaison RSVP, fiabilité, notifications, analytics gaming.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `${baseUrl}/vs/google-calendar-vs-squad-planner` },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Google Calendar vs Squad Planner - Gaming' },
    { property: 'og:description', content: 'Google Calendar est généraliste. Squad Planner est fait pour les gamers. Découvre pourquoi.' },
    { property: 'og:url', content: `${baseUrl}/vs/google-calendar-vs-squad-planner` },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Google Calendar vs Squad Planner' },
    { name: 'twitter:description', content: 'Google Calendar pour la vie, Squad Planner pour le gaming. Comparaison complète.' },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
          { '@type': 'ListItem', position: 2, name: 'Comparatifs' },
          { '@type': 'ListItem', position: 3, name: 'Google Calendar vs Squad Planner', item: 'https://squadplanner.fr/vs/google-calendar-vs-squad-planner' },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Google Calendar vs Squad Planner',
    path: '/vs/google-calendar-vs-squad-planner',
  }),
}

export default function Component() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VsGoogleCalendarVsSquadPlanner />
    </Suspense>
  )
}
