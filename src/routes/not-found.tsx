import type { HeadersArgs } from 'react-router'
import { NotFound } from '../pages/NotFound'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
  }
}

export function meta() {
  return [{ title: 'Page introuvable - Squad Planner' }]
}

export default function Component() {
  return <NotFound />
}
