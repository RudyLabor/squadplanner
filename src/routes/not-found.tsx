import type { HeadersArgs } from 'react-router'
import { NotFound } from '../pages/NotFound'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
  }
}

export function meta() {
  return [
    { title: 'Page introuvable - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:title', content: 'Page introuvable - Squad Planner' },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Page introuvable - Squad Planner' },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
    { httpEquiv: 'content-language', content: 'fr' },
  ]
}

export default function Component() {
  return <NotFound />
}
