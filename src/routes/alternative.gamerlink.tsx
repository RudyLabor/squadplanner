import type { HeadersArgs } from 'react-router'
import { lazy, Suspense } from 'react'

const AlternativeGamerLink = lazy(() => import('../pages/AlternativeGamerLink'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Alternative à GamerLink - Squad Planner',
    },
    {
      name: 'description',
      content:
        "GamerLink n'a pas tout ce dont tu as besoin ? Découvre Squad Planner. Meilleure alternative pour trouver des partenaires et organiser tes sessions gaming.",
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'keywords',
      content:
        'alternative GamerLink, matchmaking gaming, Squad Planner, calendrier sessions, confirmation gaming fiable',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/alternative/gamerlink`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: 'Alternative à GamerLink - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        'Trouve des partenaires gaming et organise tes sessions avec Squad Planner. Meilleur que GamerLink. Gratuit et simple.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/alternative/gamerlink`,
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
      content: 'Alternative à GamerLink - Squad Planner',
    },
    {
      name: 'twitter:description',
      content:
        'Comparaison complète : GamerLink vs Squad Planner. Matchmaking + calendrier + confirmation fiable.',
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
          { '@type': 'ListItem', position: 2, name: 'Alternative GamerLink' },
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
            name: "Quelle est la différence entre GamerLink et Squad Planner ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "GamerLink se concentre sur le matchmaking social entre joueurs. Squad Planner va plus loin en ajoutant la planification de sessions, les confirmations de présence, le score de fiabilité et les analytics de squad.",
            },
          },
          {
            '@type': 'Question',
            name: "Squad Planner a un système de matchmaking ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Oui. Squad Planner propose un matchmaking algorithmique basé sur le niveau, le style de jeu, les horaires et la fiabilité. Tu trouves des joueurs compatibles, pas juste des randoms.",
            },
          },
          {
            '@type': 'Question',
            name: "C'est gratuit de passer de GamerLink à Squad Planner ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Oui. Le plan gratuit de Squad Planner inclut 1 squad, 5 membres et 2 sessions par semaine. Crée ton compte en 30 secondes et commence à organiser tes sessions.",
            },
          },
          {
            '@type': 'Question',
            name: "Squad Planner fonctionne sur mobile ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Oui. Squad Planner est une PWA responsive qui fonctionne sur tous les navigateurs mobiles. Une version native iOS et Android est en préparation.",
            },
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Alternative GamerLink',
    path: '/alternative/gamerlink',
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
      <AlternativeGamerLink />
    </Suspense>
  )
}
