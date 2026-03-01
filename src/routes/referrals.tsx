import { Referrals } from '../pages/Referrals'

export function headers() {
  return {
    'Cache-Control': 'private, no-cache',
  }
}

export function meta() {
  return [
    { title: 'Parrainage - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Invite tes potes sur Squad Planner et gagne 7 jours Premium gratuit. Débloque des badges exclusifs et des récompenses.',
    },
    { httpEquiv: 'content-language', content: 'fr' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Parrainage - Squad Planner' },
    {
      property: 'og:description',
      content:
        'Invite tes potes sur Squad Planner et gagne 7 jours Premium gratuit. Débloque des badges exclusifs et des récompenses.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Parrainage - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        'Invite tes potes sur Squad Planner et gagne 7 jours Premium gratuit. Débloque des badges exclusifs et des récompenses.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

export default function Component() {
  return <Referrals />
}
