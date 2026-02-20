import type { HeadersArgs } from 'react-router'
import SquadAnalytics from '../pages/SquadAnalytics'

export function headers(_args: HeadersArgs) {
  return { 'Cache-Control': 'no-cache' }
}

export function meta() {
  return [
    { title: 'Analytics Squad - Squad Planner' },
    { name: 'description', content: 'Tableau de bord analytique pour votre squad.' },
  ]
}

export default function Component() {
  return <SquadAnalytics />
}
