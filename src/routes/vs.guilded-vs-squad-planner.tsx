import type { HeadersArgs } from 'react-router'
import { lazy, Suspense } from 'react'

const VsGuildedVsSquadPlanner = lazy(() => import('../pages/VsGuildedVsSquadPlanner'))

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  const baseUrl = 'https://squadplanner.fr'
  return [
    {
      title: 'Guilded vs Squad Planner - Comparaison Détaillée',
    },
    {
      name: 'description',
      content:
        "Comparaison complète Guilded vs Squad Planner. Fonctionnalités, tarification, migration. Guilded a fermé, Squad Planner est l'alternative spécialisée gaming.",
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'keywords',
      content:
        'Guilded vs Squad Planner, fermeture Guilded, alternative Guilded, migration gaming, calendrier événements gaming',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `${baseUrl}/vs/guilded-vs-squad-planner`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: 'Guilded vs Squad Planner - Comparaison Complète',
    },
    {
      property: 'og:description',
      content:
        'Guilded a fermé. Squad Planner offre une meilleure organisation gaming avec calendrier, confirmation fiable, notifications et analytics. Voir la comparaison.',
    },
    {
      property: 'og:url',
      content: `${baseUrl}/vs/guilded-vs-squad-planner`,
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
      content: 'Guilded vs Squad Planner - Comparaison Détaillée',
    },
    {
      name: 'twitter:description',
      content:
        "Guilded a fermé. Découvre comment Squad Planner se compare et pourquoi c'est le meilleur remplacement pour les gamers.",
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
          { '@type': 'ListItem', position: 2, name: 'Guilded vs Squad Planner' },
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
            name: 'Pourquoi pas rester sur Guilded ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Guilded a fermé définitivement en 2024. La plateforme n\'est plus accessible et les serveurs ont été coupés.',
            },
          },
          {
            '@type': 'Question',
            name: 'Je peux importer mes données depuis Guilded ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Guilded ayant fermé, l\'import direct n\'est pas possible. Mais créer ta squad sur Squad Planner prend moins de 2 minutes.',
            },
          },
          {
            '@type': 'Question',
            name: 'C\'est quoi Premium ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Premium débloque les squads illimitées, l\'historique étendu, les stats avancées, le coach IA et le voice chat HD pour 6,99 €/mois.',
            },
          },
          {
            '@type': 'Question',
            name: 'Je peux utiliser Squad Planner ET Discord ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui, les deux sont complémentaires. Discord gère la communication, Squad Planner gère l\'organisation des sessions gaming.',
            },
          },
          {
            '@type': 'Question',
            name: 'Ça marche pour tous les jeux ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui. Squad Planner est compatible avec tous les jeux multijoueur : Valorant, League of Legends, Fortnite, Apex, CS2, et bien d\'autres.',
            },
          },
          {
            '@type': 'Question',
            name: 'Mais Squad Planner fermera aussi un jour ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Squad Planner est un produit indépendant avec un modèle économique durable. L\'export RGPD permet de récupérer tes données à tout moment.',
            },
          },
        ],
      },
    },
  ]
}

export const handle = {
  breadcrumb: () => ({
    label: 'Guilded vs Squad Planner',
    path: '/vs/guilded-vs-squad-planner',
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
      <VsGuildedVsSquadPlanner />
    </Suspense>
  )
}
