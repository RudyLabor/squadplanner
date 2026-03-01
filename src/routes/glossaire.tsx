import { lazy, Suspense } from 'react'

const Glossaire = lazy(() => import('../pages/Glossaire'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    { title: 'Glossaire Gaming - Squad Planner' },
    {
      name: 'description',
      content:
        'Glossaire complet du vocabulaire gaming et esport : RSVP, ghost, IGL, squad, scrim, clutch, carry. Tous les termes expliqués.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `${baseUrl}/glossaire` },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Glossaire Gaming - Squad Planner' },
    {
      property: 'og:description',
      content: 'Tous les termes gaming expliqués simplement.',
    },
    { property: 'og:url', content: `${baseUrl}/glossaire` },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Glossaire Gaming - Squad Planner' },
    { name: 'twitter:description', content: 'Tous les termes gaming expliqués simplement.' },
    { name: 'twitter:image', content: `${baseUrl}/og-image.png` },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Glossaire', item: `${baseUrl}/glossaire` },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Glossaire',
    path: '/glossaire',
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
      <Glossaire />
    </Suspense>
  )
}
