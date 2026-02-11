import { NotFound } from '../pages/NotFound'

export function meta() {
  return [
    { title: "Page introuvable - Squad Planner" },
  ]
}

// Server Component — zero JS overhead for this route wrapper.
export function ServerComponent() {
  return <NotFound />
}
