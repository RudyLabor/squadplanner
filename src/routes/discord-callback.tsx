import { DiscordCallback } from '../pages/DiscordCallback'

export function headers() {
  return {
    'Cache-Control': 'no-store',
  }
}

export function meta() {
  return [
    { title: 'Connexion Discord - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
  ]
}

export default function Component() {
  return <DiscordCallback />
}
