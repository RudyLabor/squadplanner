import type { HeadersArgs } from 'react-router'
import { Legal } from '../pages/Legal'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  return [
    { title: 'Mentions légales - Squad Planner' },
    {
      name: 'description',
      content:
        "Mentions légales, conditions d'utilisation et politique de confidentialité de Squad Planner.",
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/legal' },
    { property: 'og:url', content: 'https://squadplanner.fr/legal' },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:title', content: 'Mentions légales - Squad Planner' },
    {
      property: 'og:description',
      content:
        "Mentions légales, conditions d'utilisation et politique de confidentialité de Squad Planner.",
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Mentions légales - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        "Mentions légales, conditions d'utilisation et politique de confidentialité de Squad Planner.",
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
          { '@type': 'ListItem', position: 2, name: 'Mentions légales', item: 'https://squadplanner.fr/legal' },
        ],
      },
    },
  ]
}

export default function Component() {
  return <Legal />
}
