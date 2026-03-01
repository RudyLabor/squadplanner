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
    { httpEquiv: 'content-language', content: 'fr' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Connexion Discord - Squad Planner' },
    { property: 'og:description', content: 'Lie ton compte Discord à Squad Planner.' },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Connexion Discord - Squad Planner' },
    { name: 'twitter:description', content: 'Lie ton compte Discord à Squad Planner.' },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

export default function Component() {
  return <DiscordCallback />
}
