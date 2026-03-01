import { lazy, Suspense } from 'react'

const FeatureCoachIA = lazy(() => import('../pages/FeatureCoachIA'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Coach IA - Squad Planner',
    },
    {
      name: 'description',
      content:
        'Ton coach IA personnel analyse tes habitudes de jeu et te donne des conseils personnalisés pour optimiser tes sessions et ta squad.',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/features/coach-ia`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: 'Coach IA - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        'Un coach IA qui analyse tes habitudes et te donne des tips personnalisés pour tes sessions.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/features/coach-ia`,
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
      content: 'Coach IA - Squad Planner',
    },
    {
      name: 'twitter:description',
      content: 'Un coach IA qui analyse tes habitudes et te donne des tips personnalisés pour tes sessions.',
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
              { '@type': 'ListItem', position: 3, name: 'Coach IA' },
            ],
          },
          {
            '@type': 'WebPage',
            name: 'Coach IA - Squad Planner',
            description: 'Ton coach IA personnel analyse tes habitudes de jeu et te donne des conseils personnalisés pour optimiser tes sessions et ta squad.',
            url: `${baseUrl}/features/coach-ia`,
            inLanguage: 'fr',
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Coach IA',
    path: '/features/coach-ia',
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
      <FeatureCoachIA />
    </Suspense>
  )
}
