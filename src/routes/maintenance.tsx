import type { HeadersArgs } from 'react-router'
import Maintenance from '../pages/Maintenance'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  return [
    { title: 'Maintenance - Squad Planner' },
    {
      name: 'description',
      content:
        'Squad Planner est actuellement en maintenance. Nous revenons très vite avec une version améliorée.',
    },
    { name: 'robots', content: 'noindex, nofollow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:title', content: 'Maintenance - Squad Planner' },
    {
      property: 'og:description',
      content:
        'Squad Planner est actuellement en maintenance. Nous revenons très vite avec une version améliorée.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Maintenance - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        'Squad Planner est actuellement en maintenance. Nous revenons très vite avec une version améliorée.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
    { httpEquiv: 'content-language', content: 'fr' },
  ]
}

export default function Component() {
  return <Maintenance />
}
