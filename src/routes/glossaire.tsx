import { lazy, Suspense } from 'react'

const Glossaire = lazy(() => import('../pages/Glossaire'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    { title: 'Glossaire Gaming - Squad Planner' },
    {
      name: 'description',
      content:
        'Glossaire complet du vocabulaire gaming et esport : RSVP, ghost, IGL, squad, scrim, clutch, carry. Tous les termes expliqués.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `${baseUrl}/glossaire` },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Glossaire Gaming - Squad Planner' },
    {
      property: 'og:description',
      content: 'Tous les termes gaming expliqués simplement.',
    },
    { property: 'og:url', content: `${baseUrl}/glossaire` },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Glossaire Gaming - Squad Planner' },
    { name: 'twitter:description', content: 'Tous les termes gaming expliqués simplement.' },
    { name: 'twitter:image', content: `${baseUrl}/og-image.png` },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}/` },
              { '@type': 'ListItem', position: 2, name: 'Glossaire', item: `${baseUrl}/glossaire` },
            ],
          },
          {
            '@type': 'DefinedTermSet',
            name: 'Glossaire Gaming',
            description: 'Glossaire complet du vocabulaire gaming et esport.',
            url: `${baseUrl}/glossaire`,
            hasDefinedTerm: [
              { '@type': 'DefinedTerm', name: 'AFK', description: 'Away From Keyboard. Joueur temporairement absent de son poste.' },
              { '@type': 'DefinedTerm', name: 'Carry', description: "Joueur qui porte l'équipe sur ses épaules grâce à ses performances individuelles." },
              { '@type': 'DefinedTerm', name: 'Check-in', description: 'Confirmation de présence réelle à une session de jeu.' },
              { '@type': 'DefinedTerm', name: 'Clutch', description: 'Gagner un round ou une situation en infériorité numérique.' },
              { '@type': 'DefinedTerm', name: 'DPS', description: 'Damage Per Second. Mesure de dégâts ou rôle dédié aux dégâts dans une équipe.' },
              { '@type': 'DefinedTerm', name: 'Entry fragger', description: 'Premier joueur à entrer sur un site ou à engager le combat.' },
              { '@type': 'DefinedTerm', name: 'Ghost / Ghosting', description: 'Ne pas se présenter à une session sans prévenir.' },
              { '@type': 'DefinedTerm', name: 'GG', description: 'Good Game. Expression de fair-play en fin de partie.' },
              { '@type': 'DefinedTerm', name: 'IGL', description: "In-Game Leader. Le shotcaller de l'équipe qui prend les décisions tactiques." },
              { '@type': 'DefinedTerm', name: 'LFG', description: 'Looking For Group. Quand tu cherches des joueurs pour former une équipe.' },
              { '@type': 'DefinedTerm', name: 'Main', description: "Personnage ou rôle principal d'un joueur." },
              { '@type': 'DefinedTerm', name: 'Meta', description: 'Most Effective Tactics Available. Les stratégies les plus efficaces du moment.' },
              { '@type': 'DefinedTerm', name: 'Nerf', description: "Réduction de la puissance d'un personnage, arme ou capacité par les développeurs." },
              { '@type': 'DefinedTerm', name: 'Ping', description: 'Latence réseau entre ton PC et le serveur de jeu.' },
              { '@type': 'DefinedTerm', name: 'RSVP', description: 'Confirmation de présence à une session planifiée. Présent, absent ou peut-être.' },
              { '@type': 'DefinedTerm', name: 'Scrim', description: "Scrimmage. Match d'entraînement organisé entre deux équipes." },
              { '@type': 'DefinedTerm', name: 'Squad', description: 'Groupe de joueurs qui jouent régulièrement ensemble.' },
              { '@type': 'DefinedTerm', name: 'Streak', description: "Série de jours consécutifs avec activité." },
              { '@type': 'DefinedTerm', name: 'Tilt', description: 'État émotionnel négatif qui affecte tes performances.' },
              { '@type': 'DefinedTerm', name: 'Tryhard', description: 'Joueur qui donne absolument tout pour gagner, même en partie casual.' },
              { '@type': 'DefinedTerm', name: 'XP', description: "Points d'expérience gagnés en participant aux sessions et en complétant des challenges." },
            ],
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Glossaire',
    path: '/glossaire',
  }),
}

export default function Component() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <Glossaire />
    </Suspense>
  )
}
