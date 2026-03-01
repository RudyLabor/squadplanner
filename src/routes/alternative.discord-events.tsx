import type { HeadersArgs } from 'react-router'
import { lazy, Suspense } from 'react'

const AlternativeDiscordEvents = lazy(() => import('../pages/AlternativeDiscordEvents'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Alternative aux Événements Discord - Squad Planner',
    },
    {
      name: 'description',
      content:
        'Les événements Discord ne sont pas assez pour les sessions gaming. Squad Planner offre calendrier, confirmation fiable, notifications et analytics. Gratuit.',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'keywords',
      content:
        'alternative événements Discord, calendrier gaming, confirmation fiable, organisation sessions gaming, Squad Planner',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/alternative/discord-events`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: 'Alternative aux Événements Discord - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        "Plus qu'un simple événement Discord. Squad Planner offre une organisation gaming complète avec confirmation fiable, récurrence et analytics.",
    },
    {
      property: 'og:url',
      content: `${baseUrl}/alternative/discord-events`,
    },
    {
      property: 'og:image',
      content: `${baseUrl}/og-image.png`,
    },
    {
      property: 'og:image:width',
      content: '1200',
    },
    {
      property: 'og:image:height',
      content: '630',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Alternative aux Événements Discord',
    },
    {
      name: 'twitter:description',
      content:
        "Discord pour la commu, Squad Planner pour l'organisation. Confirmation fiable, calendrier, notifications push.",
    },
    {
      httpEquiv: 'content-language',
      content: 'fr',
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
          { '@type': 'ListItem', position: 2, name: 'Alternatives' },
          { '@type': 'ListItem', position: 3, name: 'Alternative Discord Events', item: 'https://squadplanner.fr/alternative/discord-events' },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Alternative Événements Discord',
    path: '/alternative/discord-events',
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
      <AlternativeDiscordEvents />
    </Suspense>
  )
}
