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
      title: 'Comment ça marche - Squad Planner',
    },
    {
      name: 'description',
      content:
        'Découvre comment Squad Planner fonctionne en 4 étapes simples : crée ta squad, planifie tes sessions, confirme ta présence, joue ensemble.',
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
      content: 'Comment ça marche - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        '4 étapes pour organiser tes sessions gaming sans prise de tête.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/how-it-works`,
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
      content: 'Comment ça marche - Squad Planner',
    },
    {
      name: 'twitter:description',
      content: '4 étapes pour organiser tes sessions gaming sans prise de tête.',
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
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Comment ça marche',
                item: 'https://squadplanner.fr/how-it-works',
              },
            ],
          },
          {
            '@type': 'HowTo',
            name: 'Comment utiliser Squad Planner',
            description: 'Guide en 4 étapes pour organiser vos sessions gaming avec Squad Planner.',
            step: [
              { '@type': 'HowToStep', position: 1, name: 'Crée ta squad', text: 'Crée un groupe et invite tes coéquipiers en 30 secondes.' },
              { '@type': 'HowToStep', position: 2, name: 'Planifie une session', text: 'Choisis la date, l\'heure et le jeu. Tout le monde reçoit une notification.' },
              { '@type': 'HowToStep', position: 3, name: 'Confirme ta présence', text: 'Chaque membre confirme sa présence. Tu vois qui sera là en temps réel.' },
              { '@type': 'HowToStep', position: 4, name: 'Jouez ensemble', text: 'Rejoins le voice chat intégré et lance la partie avec ton équipe au complet.' },
            ],
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Comment ça marche',
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
