import { lazy, Suspense } from 'react'

const HowItWorks = lazy(() => import('../pages/HowItWorks'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Comment \u00e7a marche - Squad Planner',
    },
    {
      name: 'description',
      content:
        'D\u00e9couvre comment Squad Planner fonctionne en 4 \u00e9tapes simples : cr\u00e9e ta squad, planifie tes sessions, confirme ta pr\u00e9sence, joue ensemble.',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/how-it-works`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: 'Comment \u00e7a marche - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        '4 \u00e9tapes pour organiser tes sessions gaming sans prise de t\u00eate.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/how-it-works`,
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
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Comment \u00e7a marche',
            item: 'https://squadplanner.fr/how-it-works',
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Comment \u00e7a marche',
    path: '/how-it-works',
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
      <HowItWorks />
    </Suspense>
  )
}
