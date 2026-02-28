import type { HeadersArgs } from 'react-router'
import Auth from '../pages/Auth'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  }
}

export function meta() {
  return [
    { title: 'Connexion - Squad Planner' },
    {
      name: 'description',
      content: 'Connecte-toi ou crée ton compte Squad Planner pour planifier tes sessions gaming.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/auth' },
    { property: 'og:url', content: 'https://squadplanner.fr/auth' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Connexion - Squad Planner' },
    {
      property: 'og:description',
      content: 'Connecte-toi ou crée ton compte Squad Planner pour planifier tes sessions gaming.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Connexion - Squad Planner' },
    {
      name: 'twitter:description',
      content: 'Connecte-toi ou crée ton compte Squad Planner pour planifier tes sessions gaming.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

export default function Component() {
  return <Auth />
}
