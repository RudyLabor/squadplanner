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
  ]
}

export default function Component() {
  return <Maintenance />
}
