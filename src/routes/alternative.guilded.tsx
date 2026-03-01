import type { HeadersArgs } from 'react-router'
import { lazy, Suspense } from 'react'

const AlternativeGuilded = lazy(() => import('../pages/AlternativeGuilded'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Alternative à Guilded - Squad Planner | Guilded a fermé',
    },
    {
      name: 'description',
      content:
        'Guilded a fermé. Découvre Squad Planner, la meilleure alternative pour organiser tes sessions gaming. Gratuit, fiable, optimisé pour les gamers.',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'keywords',
      content:
        'Guilded fermeture, alternative Guilded, Squad Planner, calendrier gaming, confirmation gaming',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/alternative/guilded`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: 'Alternative à Guilded - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        'Guilded a fermé. Squad Planner offre tout ce que tu aimais sur Guilded, mais en mieux. Gratuit pour organiser tes sessions gaming.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/alternative/guilded`,
    },
    {
      property: 'og:locale',
      content: 'fr_FR',
    },
    {
      property: 'og:site_name',
      content: 'Squad Planner',
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
      content: 'Alternative à Guilded - Squad Planner',
    },
    {
      name: 'twitter:description',
      content:
        'La plateforme gaming parfaite pour remplacer Guilded. Calendrier, confirmations, notifications. Gratuit.',
    },
    {
      name: 'twitter:image',
      content: `${baseUrl}/og-image.png`,
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
          { '@type': 'ListItem', position: 2, name: 'Alternatives', item: 'https://squadplanner.fr/alternative/guilded' },
          { '@type': 'ListItem', position: 3, name: 'Alternative Guilded', item: 'https://squadplanner.fr/alternative/guilded' },
        ],
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Pourquoi Guilded a fermé ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Guilded a fermé boutique en 2024 après son rachat par Roblox. Les serveurs ont été coupés et la plateforme n\'est plus accessible.',
            },
          },
          {
            '@type': 'Question',
            name: 'Comment passer de Guilded à Squad Planner ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Crée ton compte gratuit en 30 secondes, crée ta squad, partage le lien d\'invitation à tes coéquipiers. Tout est opérationnel en moins de 2 minutes.',
            },
          },
          {
            '@type': 'Question',
            name: 'Mais je perds mes données ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Tu devras recréer tes squads et sessions, mais Squad Planner offre des fonctionnalités que Guilded n\'avait pas comme le score de fiabilité et les confirmations intelligentes.',
            },
          },
          {
            '@type': 'Question',
            name: 'C\'est vraiment gratuit ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui. Le plan gratuit inclut 1 squad, 5 membres et 2 sessions par semaine. Le Premium à 6,99\u00a0\u20ac/mois débloque les squads illimitées et les fonctionnalités avancées.',
            },
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Alternative Guilded',
    path: '/alternative/guilded',
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
      <AlternativeGuilded />
    </Suspense>
  )
}
