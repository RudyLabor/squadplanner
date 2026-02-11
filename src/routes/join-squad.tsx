import { JoinSquad } from '../pages/JoinSquad'

export function meta() {
  return [
    { title: "Rejoindre une squad - Squad Planner" },
  ]
}

// Server Component — zero JS overhead for this route wrapper.
export function ServerComponent() {
  return <JoinSquad />
}
