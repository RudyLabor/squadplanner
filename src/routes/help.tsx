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
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/help' },
    { property: 'og:url', content: 'https://squadplanner.fr/help' },
  ]
}

export default function Component() {
  return <Help />
}
