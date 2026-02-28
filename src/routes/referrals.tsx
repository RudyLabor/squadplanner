import { Referrals } from '../pages/Referrals'

export function meta() {
  return [
    { title: 'Parrainage - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Invite tes amis sur Squad Planner et gagnez tous les deux 7 jours Premium gratuit. Débloquez des badges exclusifs et des récompenses.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/referrals' },
    { property: 'og:url', content: 'https://squadplanner.fr/referrals' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Parrainage' },
    {
      property: 'og:description',
      content:
        'Invite tes amis sur Squad Planner et gagnez tous les deux 7 jours Premium gratuit. Débloquez des badges exclusifs et des récompenses.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Parrainage' },
    {
      name: 'twitter:description',
      content:
        'Invite tes amis sur Squad Planner et gagnez tous les deux 7 jours Premium gratuit. Débloquez des badges exclusifs et des récompenses.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

export default function Component() {
  return <Referrals />
}
