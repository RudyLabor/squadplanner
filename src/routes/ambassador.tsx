import { lazy, Suspense } from 'react'

const Ambassador = lazy(() =>
  import('../pages/Ambassador').then((m) => ({ default: m.Ambassador }))
)

export function meta() {
  return [
    { title: 'Programme Ambassadeur - Squad Planner' },
    {
      name: 'description',
      content:
        'Deviens ambassadeur Squad Planner : Squad Leader gratuit à vie, 20% de commission, badge exclusif. Streamers, créateurs de contenu, capitaines de communauté — on recrute.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/ambassador' },
    { property: 'og:url', content: 'https://squadplanner.fr/ambassador' },
    { property: 'og:title', content: 'Programme Ambassadeur - Squad Planner' },
    {
      property: 'og:description',
      content:
        'Deviens ambassadeur Squad Planner : Squad Leader gratuit à vie, 20% de commission sur chaque abonné parrainé.',
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Programme Ambassadeur Squad Planner',
        description: 'Programme ambassadeur pour streamers et créateurs de contenu gaming.',
        url: 'https://squadplanner.fr/ambassador',
      },
    },
  ]
}

export default function Component() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-bg-base">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <Ambassador />
    </Suspense>
  )
}
