import type { HeadersArgs } from 'react-router'
import { JoinSquad } from '../pages/JoinSquad'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  return [
    { title: 'Rejoindre une squad - Squad Planner' },
    {
      name: 'description',
      content:
        'Rejoins une squad gaming sur Squad Planner via un code d\'invitation. Planifie tes sessions et joue en équipe.',
    },
    { httpEquiv: 'content-language', content: 'fr' },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/join' },
    { property: 'og:url', content: 'https://squadplanner.fr/join' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Rejoindre une squad - Squad Planner' },
    {
      property: 'og:description',
      content:
        'Rejoins une squad gaming sur Squad Planner via un code d\'invitation. Planifie tes sessions et joue en équipe.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Rejoindre une squad - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        'Rejoins une squad gaming sur Squad Planner via un code d\'invitation. Planifie tes sessions et joue en équipe.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

export default function Component() {
  return <JoinSquad />
}
