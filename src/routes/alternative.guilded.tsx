import type { HeadersArgs } from 'react-router'
import { lazy, Suspense } from 'react'

const AlternativeGuilded = lazy(() => import('../pages/AlternativeGuilded'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Alternative à Guilded - Squad Planner | Guilded a fermé'
    },
    {
      name: 'description',
      content:
        'Guilded a fermé. Découvre Squad Planner, la meilleure alternative pour organiser tes sessions gaming. Gratuit, fiable, optimisé pour les gamers.'
    },
    {
      name: 'keywords',
      content: 'Guilded fermeture, alternative Guilded, Squad Planner, calendrier gaming, RSVP gaming'
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/alternative-guilded`
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:title',
      content: 'Alternative à Guilded - Squad Planner'
    },
    {
      property: 'og:description',
      content: 'Guilded a fermé. Squad Planner offre tout ce que tu aimais sur Guilded, mais en mieux. Gratuit pour organiser tes sessions gaming.'
    },
    {
      property: 'og:url',
      content: `${baseUrl}/alternative-guilded`
    },
    {
      property: 'og:image',
      content: `${baseUrl}/og-alternative-guilded.png`
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: 'Alternative à Guilded - Squad Planner'
    },
    {
      name: 'twitter:description',
      content: 'La plateforme gaming parfaite pour remplacer Guilded. Calendrier, RSVP, notifications. Gratuit.'
    },
    {
      httpEquiv: 'content-language',
      content: 'fr'
    }
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Alternative Guilded',
    path: '/alternative-guilded'
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
      <AlternativeGuilded />
    </Suspense>
  )
}
