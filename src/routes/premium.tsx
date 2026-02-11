import type { HeadersArgs } from 'react-router'
import { Premium } from '../pages/Premium'

export function headers(_args: HeadersArgs) {
  return {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  }
}

export function meta() {
  return [
    { title: "Premium - Squad Planner" },
    { name: "description", content: "Découvre les fonctionnalités Premium de Squad Planner." },
  ]
}

export default function PremiumRoute() {
  return <Premium />
}
