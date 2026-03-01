import type { HeadersArgs } from 'react-router'
import SquadAnalytics from '../pages/SquadAnalytics'

export function headers(_args: HeadersArgs) {
  return { 'Cache-Control': 'no-cache' }
}

export function meta() {
  return [
    { title: 'Analytiques Squad - Squad Planner' },
    { name: 'description', content: 'Tableau de bord analytique pour ta squad.' },
    { name: 'robots', content: 'noindex, nofollow' },
    { httpEquiv: 'content-language', content: 'fr' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Analytiques Squad - Squad Planner' },
    {
      property: 'og:description',
      content: 'Tableau de bord analytique pour ta squad.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Analytiques Squad - Squad Planner' },
    {
      name: 'twitter:description',
      content: 'Tableau de bord analytique pour ta squad.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

export default function Component() {
  return <SquadAnalytics />
}
