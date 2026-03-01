import { lazy, Suspense } from 'react'

const FeatureGamification = lazy(() => import('../pages/FeatureGamification'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Gamification XP & Challenges - Squad Planner',
    },
    {
      name: 'description',
      content:
        'Gagne de l\'XP, rel\u00e8ve des challenges quotidiens, maintiens tes streaks et d\u00e9bloque des badges. La gamification qui rend tes sessions addictives.',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/features/gamification`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: 'Gamification XP & Challenges - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        'XP, challenges, streaks et badges pour rendre tes sessions gaming encore plus fun.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/features/gamification`,
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
            name: 'Gamification',
            item: 'https://squadplanner.fr/features/gamification',
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Gamification',
    path: '/features/gamification',
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
      <FeatureGamification />
    </Suspense>
  )
}
