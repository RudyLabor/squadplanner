import { NotFound } from '../pages/NotFound'

export function meta() {
  return [
    { title: "Page introuvable - Squad Planner" },
  ]
}

export default function Component() {
  return <NotFound />
}
