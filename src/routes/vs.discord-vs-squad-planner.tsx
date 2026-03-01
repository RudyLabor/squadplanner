import type { HeadersArgs } from 'react-router'
import { lazy, Suspense } from 'react'

const VsDiscordVsSquadPlanner = lazy(() => import('../pages/VsDiscordVsSquadPlanner'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    { title: 'Discord vs Squad Planner - Organisation Gaming 2026' },
    {
      name: 'description',
      content:
        'Discord vs Squad Planner : lequel est le meilleur pour organiser tes sessions gaming ? Comparaison complète calendrier, RSVP, fiabilité, analytics.',
    },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `${baseUrl}/vs/discord-vs-squad-planner` },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Discord vs Squad Planner - Organisation Gaming' },
    {
      property: 'og:description',
      content:
        "Discord gère la communication. Squad Planner gère l'organisation gaming. Découvre pourquoi les deux sont complémentaires.",
    },
    { property: 'og:url', content: `${baseUrl}/vs/discord-vs-squad-planner` },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Discord vs Squad Planner - Organisation Gaming 2026' },
    {
      name: 'twitter:description',
      content:
        "Discord pour la commu, Squad Planner pour l'organisation. Découvre la comparaison complète.",
    },
    { name: 'twitter:image', content: `${baseUrl}/og-image.png` },
    { httpEquiv: 'content-language', content: 'fr' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: 'https://squadplanner.fr/',
          },
          { '@type': 'ListItem', position: 2, name: 'Comparatifs', item: 'https://squadplanner.fr/vs/discord-vs-squad-planner' },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Discord vs Squad Planner',
            item: 'https://squadplanner.fr/vs/discord-vs-squad-planner',
          },
        ],
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Je dois quitter Discord pour utiliser Squad Planner ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Non. Discord et Squad Planner sont complémentaires. Discord gère la communication, Squad Planner gère l\'organisation des sessions gaming.',
            },
          },
          {
            '@type': 'Question',
            name: 'Discord Events ne suffit pas pour organiser des sessions ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Discord Events est basique : pas de confirmation fiable, pas de score de fiabilité, pas de rappels automatiques ni d\'analytics de présence.',
            },
          },
          {
            '@type': 'Question',
            name: 'C\'est gratuit ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui. Le plan gratuit inclut 1 squad, 5 membres et 2 sessions par semaine. Suffisant pour une équipe gaming régulière.',
            },
          },
          {
            '@type': 'Question',
            name: 'Mes données sont en sécurité ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui. Hébergé sur Supabase (PostgreSQL), conforme RGPD, export complet de tes données disponible à tout moment.',
            },
          },
          {
            '@type': 'Question',
            name: 'Ça marche pour tous les jeux ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui. Valorant, League of Legends, Fortnite, Apex, CS2, Overwatch 2 et tous les jeux multijoueur sont supportés.',
            },
          },
          {
            '@type': 'Question',
            name: 'Comment intégrer Discord avec Squad Planner ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Connecte ton compte Discord dans les paramètres pour synchroniser ton profil et recevoir les notifications directement sur Discord.',
            },
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Discord vs Squad Planner',
    path: '/vs/discord-vs-squad-planner',
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
      <VsDiscordVsSquadPlanner />
    </Suspense>
  )
}
