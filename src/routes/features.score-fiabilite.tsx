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
      title: 'Score de Fiabilit\u00e9 - Squad Planner',
    },
    {
      name: 'description',
      content:
        "Le Score de Fiabilit\u00e9 Squad Planner mesure la ponctualit\u00e9 et l'engagement de chaque joueur. Fini les ghosts, place aux joueurs s\u00e9rieux.",
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
      content: 'Score de Fiabilit\u00e9 - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        'Mesure la fiabilit\u00e9 de chaque joueur. Plus de ghosts dans ta squad.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/features/score-fiabilite`,
    },
    {
      property: 'og:image',
      content: `${baseUrl}/og-image.png`,
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
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
          { '@type': 'ListItem', position: 2, name: 'Features' },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Score de Fiabilit\u00e9',
            item: 'https://squadplanner.fr/features/score-fiabilite',
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Score de Fiabilit\u00e9',
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
