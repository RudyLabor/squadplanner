import type { HeadersArgs } from 'react-router'
import { Help } from '../pages/Help'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  return [
    { title: 'Aide - Squad Planner' },
    {
      name: 'description',
      content:
        "Centre d'aide Squad Planner : trouve des réponses à tes questions sur la création de squads, la planification de sessions et les fonctionnalités Premium.",
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/help' },
    { property: 'og:url', content: 'https://squadplanner.fr/help' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Aide - Squad Planner' },
    {
      property: 'og:description',
      content:
        "Centre d'aide Squad Planner : trouve des réponses à tes questions sur la création de squads, la planification de sessions et les fonctionnalités Premium.",
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Aide - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        "Centre d'aide Squad Planner : trouve des réponses à tes questions sur la création de squads, la planification de sessions et les fonctionnalités Premium.",
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Comment créer une squad ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Inscris-toi gratuitement, clique sur Créer une squad, choisis un nom et un jeu, puis invite tes potes via le code.",
                },
              },
              {
                '@type': 'Question',
                name: 'Squad Planner est-il gratuit ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Oui, le plan gratuit inclut 1 squad, 3 sessions/semaine, le chat et les notifications push. Premium débloque plus de fonctionnalités.',
                },
              },
              {
                '@type': 'Question',
                name: 'Comment fonctionne le score de fiabilité ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Le score est calculé automatiquement en comparant tes confirmations de présence avec tes check-ins réels en début de session.",
                },
              },
            ],
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
              { '@type': 'ListItem', position: 2, name: 'Aide', item: 'https://squadplanner.fr/help' },
            ],
          },
        ],
      },
    },
  ]
}

export default function Component() {
  return <Help />
}
