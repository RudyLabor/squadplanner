import { Legal } from '../pages/Legal'

export function meta() {
  return [
    { title: "Mentions légales - Squad Planner" },
    { name: "description", content: "Mentions légales, conditions d'utilisation et politique de confidentialité de Squad Planner." },
  ]
}

export default function LegalRoute() {
  return <Legal />
}
