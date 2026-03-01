import type { HeadersArgs } from 'react-router'
import { lazy, Suspense } from 'react'

const VsDiscordVsSquadPlanner = lazy(() => import('../pages/VsDiscordVsSquadPlanner'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    { title: 'Discord vs Squad Planner - Comparaison Organisation Gaming 2026' },
    {
      name: 'description',
      content:
        'Discord vs Squad Planner : lequel est le meilleur pour organiser tes sessions gaming ? Comparaison complete calendrier, RSVP, fiabilite, analytics.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `${baseUrl}/vs/discord-vs-squad-planner` },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Discord vs Squad Planner - Organisation Gaming' },
    {
      property: 'og:description',
      content:
        "Discord gere la communication. Squad Planner gere l'organisation gaming. Decouvre pourquoi les deux sont complementaires.",
    },
    { property: 'og:url', content: `${baseUrl}/vs/discord-vs-squad-planner` },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Discord vs Squad Planner - Comparaison 2026' },
    {
      name: 'twitter:description',
      content:
        "Discord pour la commu, Squad Planner pour l'organisation. Decouvre la comparaison complete.",
    },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: 'https://squadplanner.fr/',
          },
          { '@type': 'ListItem', position: 2, name: 'Comparatifs' },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Discord vs Squad Planner',
            item: 'https://squadplanner.fr/vs/discord-vs-squad-planner',
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Discord vs Squad Planner',
    path: '/vs/discord-vs-squad-planner',
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
      <VsDiscordVsSquadPlanner />
    </Suspense>
  )
}
