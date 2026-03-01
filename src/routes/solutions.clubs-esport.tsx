import { lazy, Suspense } from 'react'

const SolutionClubsEsport = lazy(() => import('../pages/SolutionClubsEsport'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    { title: 'Squad Planner pour les Clubs Esport' },
    {
      name: 'description',
      content:
        'Gère tes squads esport avec Squad Planner : dashboard multi-squads, analytics cross-squad, branding personnalisé, export CSV. La solution pour les clubs esport.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `${baseUrl}/solutions/clubs-esport` },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Squad Planner pour les Clubs Esport' },
    {
      property: 'og:description',
      content:
        'La solution tout-en-un pour gérer tes squads esport. Analytics, planning, engagement.',
    },
    { property: 'og:url', content: `${baseUrl}/solutions/clubs-esport` },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Squad Planner pour les Clubs Esport' },
    { name: 'twitter:description', content: 'La solution tout-en-un pour gérer tes équipes esport. Analytics, planning, engagement.' },
    { name: 'twitter:image', content: `${baseUrl}/og-image.png` },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}/` },
              { '@type': 'ListItem', position: 2, name: 'Solutions', item: `${baseUrl}/solutions` },
              { '@type': 'ListItem', position: 3, name: 'Clubs Esport' },
            ],
          },
          {
            '@type': 'WebPage',
            name: 'Squad Planner pour les Clubs Esport',
            description: 'Gère tes squads esport avec Squad Planner : dashboard multi-squads, analytics cross-squad, branding personnalisé, export CSV. La solution pour les clubs esport.',
            url: `${baseUrl}/solutions/clubs-esport`,
            inLanguage: 'fr',
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Clubs Esport',
    path: '/solutions/clubs-esport',
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
      <SolutionClubsEsport />
    </Suspense>
  )
}
