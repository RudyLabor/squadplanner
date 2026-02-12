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
        "Centre d'aide Squad Planner : trouvez des réponses à vos questions sur la création de squads, planification de sessions, RSVP et fonctionnalités Premium.",
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/help' },
    { property: 'og:url', content: 'https://squadplanner.fr/help' },
  ]
}

export default function Component() {
  return <Help />
}
