import { Referrals } from '../pages/Referrals'

export function meta() {
  return [
    { title: 'Parrainage - Squad Planner' },
    {
      name: 'description',
      content:
        'Invite tes amis sur Squad Planner et gagnez tous les deux 7 jours Premium gratuit. Débloquez des badges exclusifs et des récompenses.',
    },
  ]
}

export default function Component() {
  return <Referrals />
}
