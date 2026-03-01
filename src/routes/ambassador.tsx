import { lazy, Suspense } from 'react'

const Ambassador = lazy(() =>
  import('../pages/Ambassador').then((m) => ({ default: m.Ambassador }))
)

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  return [
    { title: 'Programme Ambassadeur - Squad Planner' },
    {
      name: 'description',
      content:
        'Deviens ambassadeur Squad Planner : Squad Leader gratuit à vie, 20% de commission, badge exclusif. Streamers, créateurs de contenu, capitaines de communauté — on recrute.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/ambassador' },
    { property: 'og:url', content: 'https://squadplanner.fr/ambassador' },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:title', content: 'Programme Ambassadeur - Squad Planner' },
    {
      property: 'og:description',
      content:
        'Deviens ambassadeur Squad Planner : Squad Leader gratuit à vie, 20% de commission sur chaque abonné parrainé.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Programme Ambassadeur - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        'Deviens ambassadeur Squad Planner : Squad Leader gratuit à vie, 20% de commission sur chaque abonné parrainé.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            name: 'Programme Ambassadeur Squad Planner',
            description: 'Programme ambassadeur pour streamers et créateurs de contenu gaming.',
            url: 'https://squadplanner.fr/ambassador',
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
              { '@type': 'ListItem', position: 2, name: 'Programme Ambassadeur', item: 'https://squadplanner.fr/ambassador' },
            ],
          },
        ],
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'C\'est quoi un ambassadeur Squad Planner ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Un ambassadeur est une personne influente dans la communauté gaming qui recommande Squad Planner et bénéficie d\'avantages exclusifs en retour.',
            },
          },
          {
            '@type': 'Question',
            name: 'Comment fonctionne la commission ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '20% de commission sur chaque abonnement Premium généré via ton lien ambassadeur, versée mensuellement tant que l\'abonné reste actif.',
            },
          },
          {
            '@type': 'Question',
            name: 'Je peux cumuler avec le parrainage normal ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui. En tant qu\'ambassadeur, tu cumules la commission de 20% avec les récompenses du programme de parrainage classique.',
            },
          },
          {
            '@type': 'Question',
            name: 'C\'est obligatoire d\'être un gros streamer ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Non. On recherche aussi des capitaines de communauté, des organisateurs de tournois et des joueurs influents dans leur cercle gaming.',
            },
          },
          {
            '@type': 'Question',
            name: 'Quels outils marketing vais-je recevoir ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Tu recevras des visuels, des overlays stream, des codes promo personnalisés et un accès au dashboard ambassadeur avec tes statistiques.',
            },
          },
          {
            '@type': 'Question',
            name: 'Comment rester en contact après ma candidature ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Après ta candidature approuvée, tu rejoins le serveur Discord privé des ambassadeurs avec contact direct avec l\'équipe Squad Planner.',
            },
          },
        ],
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
