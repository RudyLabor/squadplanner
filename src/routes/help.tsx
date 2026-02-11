import { Help } from '../pages/Help'

export function meta() {
  return [
    { title: "Aide - Squad Planner" },
    { name: "description", content: "Centre d'aide Squad Planner. FAQ, guides et support." },
  ]
}

export default function HelpRoute() {
  return <Help />
}
