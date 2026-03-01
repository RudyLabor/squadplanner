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
        'Gerez vos squads esport avec Squad Planner : dashboard multi-squads, analytics cross-squad, branding personnalise, export CSV. La solution pour les clubs esport.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `${baseUrl}/solutions/clubs-esport` },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Squad Planner pour les Clubs Esport' },
    {
      property: 'og:description',
      content:
        'La solution tout-en-un pour gerer vos equipes esport. Analytics, planning, engagement.',
    },
    { property: 'og:url', content: `${baseUrl}/solutions/clubs-esport` },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Solutions' },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Clubs Esport',
            item: `${baseUrl}/solutions/clubs-esport`,
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
