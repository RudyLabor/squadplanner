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
    { name: 'description', content: 'Rejoins une squad gaming sur Squad Planner via un code d\'invitation.' },
    { name: 'robots', content: 'noindex, nofollow' },
    { property: 'og:title', content: 'Rejoindre une squad - Squad Planner' },
    { property: 'og:description', content: 'Rejoins une squad gaming sur Squad Planner via un code d\'invitation.' },
  ]
}

export default function Component() {
  return <JoinSquad />
}
