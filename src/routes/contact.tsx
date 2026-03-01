import type { HeadersArgs } from 'react-router'
import { Contact } from '../pages/Contact'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    { title: 'Nous contacter — Squad Planner' },
    {
      name: 'description',
      content:
        "Contacte l'équipe Squad Planner pour un devis sur mesure, un déploiement Club esport, ou toute question sur nos offres.",
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `${baseUrl}/contact` },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${baseUrl}/contact` },
    { property: 'og:title', content: 'Nous contacter — Squad Planner' },
    {
      property: 'og:description',
      content:
        "Contacte l'équipe Squad Planner pour un devis sur mesure, un déploiement Club esport, ou toute question sur nos offres.",
    },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Nous contacter — Squad Planner' },
    {
      name: 'twitter:description',
      content:
        "Contacte l'équipe Squad Planner pour un devis sur mesure, un déploiement Club esport, ou toute question sur nos offres.",
    },
    { name: 'twitter:image', content: `${baseUrl}/og-image.png` },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Contact', item: `${baseUrl}/contact` },
        ],
      },
    },
  ]
}

export default function ContactRoute() {
  return <Contact />
}
