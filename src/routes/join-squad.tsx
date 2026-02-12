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
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/join' },
    { property: 'og:url', content: 'https://squadplanner.fr/join' },
  ]
}

export default function Component() {
  return <JoinSquad />
}
