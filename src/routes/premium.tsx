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
    { name: "description", content: "Débloquez les fonctionnalités Premium de Squad Planner : squads illimitées, analyses avancées, customisation totale. Essai gratuit 7 jours sans carte bancaire." },
    { tagName: "link", rel: "canonical", href: "https://squadplanner.fr/premium" },
    { property: "og:url", content: "https://squadplanner.fr/premium" },
  ]
}

export default function Component() {
  return <Premium />
}
