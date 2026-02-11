import type { HeadersArgs } from 'react-router'
import Maintenance from '../pages/Maintenance'

export function headers(_args: HeadersArgs) {
  return {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  }
}

export function meta() {
  return [
    { title: "Maintenance - Squad Planner" },
  ]
}

export default function MaintenanceRoute() {
  return <Maintenance />
}
