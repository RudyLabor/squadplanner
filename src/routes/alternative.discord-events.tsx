import type { HeadersArgs } from 'react-router'
import { lazy, Suspense } from 'react'

const AlternativeDiscordEvents = lazy(() => import('../pages/AlternativeDiscordEvents'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Alternative aux Événements Discord - Squad Planner',
    },
    {
      name: 'description',
      content:
        'Les événements Discord ne sont pas assez pour les sessions gaming. Squad Planner offre calendrier, confirmation fiable, notifications et analytics. Gratuit.',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'keywords',
      content:
        'alternative événements Discord, calendrier gaming, confirmation fiable, organisation sessions gaming, Squad Planner',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/alternative/discord-events`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: 'Alternative aux Événements Discord - Squad Planner',
    },
    {
      property: 'og:description',
      content:
        "Plus qu'un simple événement Discord. Squad Planner offre une organisation gaming complète avec confirmation fiable, récurrence et analytics.",
    },
    {
      property: 'og:url',
      content: `${baseUrl}/alternative/discord-events`,
    },
    {
      property: 'og:locale',
      content: 'fr_FR',
    },
    {
      property: 'og:site_name',
      content: 'Squad Planner',
    },
    {
      property: 'og:image',
      content: `${baseUrl}/og-image.png`,
    },
    {
      property: 'og:image:width',
      content: '1200',
    },
    {
      property: 'og:image:height',
      content: '630',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Alternative aux Événements Discord',
    },
    {
      name: 'twitter:description',
      content:
        "Discord pour la commu, Squad Planner pour l'organisation. Confirmation fiable, calendrier, notifications push.",
    },
    {
      name: 'twitter:image',
      content: `${baseUrl}/og-image.png`,
    },
    {
      httpEquiv: 'content-language',
      content: 'fr',
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
          { '@type': 'ListItem', position: 2, name: 'Alternative Discord Events' },
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
            name: "Les événements Discord suffisent pour organiser des sessions gaming ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Les événements Discord sont basiques : pas de confirmation fiable (OUI/NON/Peut-être sans engagement), pas de score de fiabilité, pas de rappels automatiques ni d'analytics de présence. Squad Planner comble ces lacunes.",
            },
          },
          {
            '@type': 'Question',
            name: "Je dois quitter Discord pour utiliser Squad Planner ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Non. Discord et Squad Planner sont complémentaires. Discord gère la communication (chat, voice), Squad Planner gère l'organisation des sessions gaming (calendrier, confirmations, fiabilité).",
            },
          },
          {
            '@type': 'Question',
            name: "C'est gratuit ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Oui. Le plan gratuit de Squad Planner inclut 1 squad, 5 membres et 2 sessions par semaine. Le Premium à 6,99 €/mois ajoute les squads illimitées et les fonctionnalités avancées.",
            },
          },
          {
            '@type': 'Question',
            name: "Squad Planner a un système de rappels automatiques ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Oui. Squad Planner envoie des rappels automatiques par email et push notification avant chaque session. Plus personne n'oublie qu'il y a une session ce soir.",
            },
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Alternative Événements Discord',
    path: '/alternative/discord-events',
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
      <AlternativeDiscordEvents />
    </Suspense>
  )
}
