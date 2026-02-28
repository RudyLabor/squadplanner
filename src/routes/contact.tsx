import { Contact } from '../pages/Contact'

export function meta() {
  return [
    { title: 'Nous contacter — Squad Planner' },
    { name: 'description', content: 'Contacte l\'équipe Squad Planner pour un devis sur mesure, un déploiement Club esport, ou toute question sur nos offres.' },
  ]
}

export default function ContactRoute() {
  return <Contact />
}
