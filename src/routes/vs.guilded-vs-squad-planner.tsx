import type { HeadersArgs } from 'react-router'
import { lazy, Suspense } from 'react'

const VsGuildedVsSquadPlanner = lazy(() => import('../pages/VsGuildedVsSquadPlanner'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Guilded vs Squad Planner - Comparaison Détaillée'
    },
    {
      name: 'description',
      content:
        'Comparaison complète Guilded vs Squad Planner. Fonctionnalités, tarification, migration. Guilded a fermé, Squad Planner est l\'alternative spécialisée gaming.'
    },
    {
      name: 'keywords',
      content: 'Guilded vs Squad Planner, fermeture Guilded, alternative Guilded, migration gaming, calendrier événements gaming'
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/vs-guilded-vs-squad-planner`
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:title',
      content: 'Guilded vs Squad Planner - Comparaison Complète'
    },
    {
      property: 'og:description',
      content: 'Guilded a fermé. Squad Planner offre une meilleure organisation gaming avec calendrier, RSVP fiable, notifications et analytics. Voir la comparaison.'
    },
    {
      property: 'og:url',
      content: `${baseUrl}/vs-guilded-vs-squad-planner`
    },
    {
      property: 'og:image',
      content: `${baseUrl}/og-guilded-vs-squadplanner.png`
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: 'Guilded vs Squad Planner - Comparaison Détaillée'
    },
    {
      name: 'twitter:description',
      content: 'Guilded a fermé. Découvre comment Squad Planner se compare et pourquoi c\'est le meilleur remplacement pour les gamers.'
    },
    {
      httpEquiv: 'content-language',
      content: 'fr'
    }
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Guilded vs Squad Planner',
    path: '/vs-guilded-vs-squad-planner'
  })
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
      <VsGuildedVsSquadPlanner />
    </Suspense>
  )
}
