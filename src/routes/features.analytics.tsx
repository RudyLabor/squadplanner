import { lazy, Suspense } from 'react'

const FeatureAnalytics = lazy(() => import('../pages/FeatureAnalytics'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Analytics Squad - Squad Planner',
    },
    {
      name: 'description',
      content:
        'Visualise les tendances de ta squad avec des heatmaps de pr\u00e9sence, la fiabilit\u00e9 par joueur et les cr\u00e9neaux optimaux pour jouer ensemble.',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/features/analytics`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: 'Analytics Squad - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        'Heatmaps, fiabilit\u00e9 par joueur, tendances sessions. Les analytics pour optimiser ta squad.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/features/analytics`,
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
            name: 'Analytics Squad',
            item: 'https://squadplanner.fr/features/analytics',
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Analytics Squad',
    path: '/features/analytics',
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
      <FeatureAnalytics />
    </Suspense>
  )
}
