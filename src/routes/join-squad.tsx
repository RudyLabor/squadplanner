import { JoinSquad } from '../pages/JoinSquad'

export function meta() {
  return [
    { title: "Rejoindre une squad - Squad Planner" },
    { tagName: "link", rel: "canonical", href: "https://squadplanner.fr/join" },
    { property: "og:url", content: "https://squadplanner.fr/join" },
  ]
}

export default function Component() {
  return <JoinSquad />
}
