import { lazy, Suspense } from 'react'

const SolutionStreamers = lazy(() => import('../pages/SolutionStreamers'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    { title: 'Squad Planner pour les Streamers' },
    {
      name: 'description',
      content:
        'Organise tes sessions gaming avec ta communauté. Sessions planifiées, RSVP fiable, widget embeddable, programme ambassadeur. La solution pour les streamers.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `${baseUrl}/solutions/streamers` },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Squad Planner pour les Streamers' },
    {
      property: 'og:description',
      content:
        'Organise tes games avec ta commu. Widget stream, RSVP, programme ambassadeur.',
    },
    { property: 'og:url', content: `${baseUrl}/solutions/streamers` },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Squad Planner pour les Streamers' },
    { name: 'twitter:description', content: 'Organise tes games avec ta commu. Widget stream, RSVP, programme ambassadeur.' },
    { name: 'twitter:image', content: `${baseUrl}/og-image.png` },
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
            name: 'Streamers',
            item: `${baseUrl}/solutions/streamers`,
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Streamers',
    path: '/solutions/streamers',
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
      <SolutionStreamers />
    </Suspense>
  )
}
