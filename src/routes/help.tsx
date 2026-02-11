import type { HeadersArgs } from 'react-router'
import { Help } from '../pages/Help'

export function headers(_args: HeadersArgs) {
  return {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  }
}

export function meta() {
  return [
    { title: "Aide - Squad Planner" },
    { name: "description", content: "Centre d'aide Squad Planner. FAQ, guides et support." },
  ]
}

// Server Component — zero JS overhead for this route wrapper.
export function ServerComponent() {
  return <Help />
}
