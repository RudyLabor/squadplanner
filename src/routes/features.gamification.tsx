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
        'Gagne de l\'XP, relève des challenges quotidiens, maintiens tes streaks et débloque des badges. La gamification qui rend tes sessions addictives.',
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
      content: 'Gamification XP & Challenges - Squad Planner',
    },
    {
      name: 'twitter:description',
      content: 'XP, challenges, streaks et badges pour rendre tes sessions gaming encore plus fun.',
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
              { '@type': 'ListItem', position: 3, name: 'Gamification' },
            ],
          },
          {
            '@type': 'WebPage',
            name: 'Gamification XP & Challenges - Squad Planner',
            description: 'Gagne de l\'XP, relève des challenges quotidiens, maintiens tes streaks et débloque des badges. La gamification qui rend tes sessions addictives.',
            url: `${baseUrl}/features/gamification`,
            inLanguage: 'fr',
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
