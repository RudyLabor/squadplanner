import type { HeadersArgs } from 'react-router'
import { Legal } from '../pages/Legal'

export function headers(_args: HeadersArgs) {
  return {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  }
}

export function meta() {
  return [
    { title: "Mentions légales - Squad Planner" },
    { name: "description", content: "Mentions légales, conditions d'utilisation et politique de confidentialité de Squad Planner." },
  ]
}

export default function LegalRoute() {
  return <Legal />
}
