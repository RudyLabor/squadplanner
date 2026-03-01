import { DiscordCallback } from '../pages/DiscordCallback'

export function meta() {
  return [
    { title: 'Connexion Discord - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
  ]
}

export default function Component() {
  return <DiscordCallback />
}
