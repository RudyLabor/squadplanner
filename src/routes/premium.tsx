import type { HeadersArgs } from 'react-router'
import { Premium } from '../pages/Premium'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  return [
    { title: 'Premium - Squad Planner' },
    {
      name: 'description',
      content:
        'Débloquez les fonctionnalités Premium de Squad Planner : squads illimitées, heatmaps de présence, IA Coach personnalisé. Essai gratuit 7 jours sans carte bancaire.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/premium' },
    { property: 'og:url', content: 'https://squadplanner.fr/premium' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Premium - Squad Planner' },
    {
      property: 'og:description',
      content:
        'Débloquez les fonctionnalités Premium de Squad Planner : squads illimitées, heatmaps de présence, IA Coach personnalisé. Essai gratuit 7 jours sans carte bancaire.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Premium - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        'Débloquez les fonctionnalités Premium de Squad Planner : squads illimitées, heatmaps de présence, IA Coach personnalisé. Essai gratuit 7 jours sans carte bancaire.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product',
            name: 'Squad Planner Premium',
            description:
              'Fonctionnalités Premium pour les gamers sérieux : squads illimitées, heatmaps de présence, IA Coach.',
            brand: { '@type': 'Organization', name: 'Squad Planner' },
            offers: [
              {
                '@type': 'Offer',
                name: 'Premium',
                price: '6.99',
                priceCurrency: 'EUR',
                url: 'https://squadplanner.fr/premium',
              },
              {
                '@type': 'Offer',
                name: 'Squad Leader',
                price: '14.99',
                priceCurrency: 'EUR',
                url: 'https://squadplanner.fr/premium',
              },
              {
                '@type': 'Offer',
                name: 'Club',
                price: '39.99',
                priceCurrency: 'EUR',
                url: 'https://squadplanner.fr/premium',
              },
            ],
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Je peux annuler quand je veux ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Oui ! Tu peux annuler ton abonnement à tout moment depuis ton profil. Tu garderas l'accès jusqu'à la fin de ta période payée. Zéro engagement, zéro frais cachés.",
                },
              },
              {
                '@type': 'Question',
                name: "C'est quoi la différence entre Premium et Squad Leader ?",
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Premium est pour les joueurs réguliers qui veulent plus de squads et de features. Squad Leader est pour les capitaines qui gèrent des équipes — avec dashboard analytics, sessions récurrentes, audio HD et rôles avancés.",
                },
              },
              {
                '@type': 'Question',
                name: "Y a-t-il une période d'essai ?",
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Oui ! Tu bénéficies de 7 jours d'essai gratuit sans carte bancaire. À la fin de l'essai, tu choisis ton plan. On offre aussi une garantie satisfait ou remboursé de 30 jours.",
                },
              },
              {
                '@type': 'Question',
                name: 'Comment demander un remboursement ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Garantie satisfait ou remboursé de 30 jours, sans condition et sans justification. Contacte-nous via le formulaire dans tes paramètres, et on te rembourse sous 48h.",
                },
              },
            ],
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
              { '@type': 'ListItem', position: 2, name: 'Premium', item: 'https://squadplanner.fr/premium' },
            ],
          },
        ],
      },
    },
  ]
}

export default function Component() {
  return <Premium />
}
