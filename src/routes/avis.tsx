import { lazy, Suspense } from 'react'

const Avis = lazy(() => import('../pages/Avis'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    { title: 'Avis Squad Planner - Ce que disent les joueurs' },
    {
      name: 'description',
      content:
        'Découvre les avis des joueurs sur Squad Planner : organisation de sessions, fiabilité, analytics, gamification. +4.8/5 de moyenne.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `${baseUrl}/avis` },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Avis Squad Planner - Ce que disent les joueurs' },
    {
      property: 'og:description',
      content: 'Ce que les gamers pensent de Squad Planner. +4.8/5 de moyenne.',
    },
    { property: 'og:url', content: `${baseUrl}/avis` },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Avis Squad Planner - Ce que disent les joueurs' },
    { name: 'twitter:description', content: 'Ce que les gamers pensent de Squad Planner. +4.8/5 de moyenne.' },
    { name: 'twitter:image', content: `${baseUrl}/og-image.png` },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Avis', item: `${baseUrl}/avis` },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Avis',
    path: '/avis',
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
      <Avis />
    </Suspense>
  )
}
