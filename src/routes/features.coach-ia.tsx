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
        'Ton coach IA personnel analyse tes habitudes de jeu et te donne des conseils personnalis\u00e9s pour optimiser tes sessions et ta squad.',
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
        'Un coach IA qui analyse tes habitudes et te donne des tips personnalis\u00e9s pour tes sessions.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/features/coach-ia`,
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
            name: 'Coach IA',
            item: 'https://squadplanner.fr/features/coach-ia',
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
