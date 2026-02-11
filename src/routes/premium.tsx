import { Premium } from '../pages/Premium'

export function meta() {
  return [
    { title: "Premium - Squad Planner" },
    { name: "description", content: "Découvre les fonctionnalités Premium de Squad Planner." },
  ]
}

export default function PremiumRoute() {
  return <Premium />
}
