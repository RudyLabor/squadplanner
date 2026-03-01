import { lazy, Suspense } from 'react'

const FeatureScoreFiabilite = lazy(() => import('../pages/FeatureScoreFiabilite'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Score de Fiabilité - Squad Planner',
    },
    {
      name: 'description',
      content:
        "Le Score de Fiabilité Squad Planner mesure la ponctualité et l'engagement de chaque joueur. Fini les ghosts, place aux joueurs sérieux.",
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/features/score-fiabilite`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: 'Score de Fiabilité - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        'Mesure la fiabilité de chaque joueur. Plus de ghosts dans ta squad.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/features/score-fiabilite`,
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
      content: 'Score de Fiabilité - Squad Planner',
    },
    {
      name: 'twitter:description',
      content: 'Mesure la fiabilité de chaque joueur. Plus de ghosts dans ta squad.',
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
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
              { '@type': 'ListItem', position: 2, name: 'Fonctionnalités', item: 'https://squadplanner.fr/features' },
              { '@type': 'ListItem', position: 3, name: 'Score de Fiabilité' },
            ],
          },
          {
            '@type': 'WebPage',
            name: 'Score de Fiabilité - Squad Planner',
            description: "Le Score de Fiabilité Squad Planner mesure la ponctualité et l'engagement de chaque joueur. Fini les ghosts, place aux joueurs sérieux.",
            url: `${baseUrl}/features/score-fiabilite`,
            inLanguage: 'fr',
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Score de Fiabilité',
    path: '/features/score-fiabilite',
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
      <FeatureScoreFiabilite />
    </Suspense>
  )
}
