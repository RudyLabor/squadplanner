import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'

const CallHistory = lazy(() =>
  import('../pages/CallHistory').then((m) => ({ default: m.CallHistory }))
)

export function meta() {
  return [
    { title: "Historique d'appels - Squad Planner" },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        "Retrouve l'historique de tes appels vocaux avec ta squad. Durée, participants et détails de chaque party.",
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/call-history' },
    { property: 'og:url', content: 'https://squadplanner.fr/call-history' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: "Historique d'appels" },
    {
      property: 'og:description',
      content:
        "Retrouve l'historique de tes appels vocaux avec ta squad. Durée, participants et détails de chaque party.",
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: "Historique d'appels" },
    {
      name: 'twitter:description',
      content:
        "Retrouve l'historique de tes appels vocaux avec ta squad. Durée, participants et détails de chaque party.",
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { headers, getUser } = createMinimalSSRClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    return data({ userId: null }, { headers })
  }

  return data({ userId: user.id }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
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
      <CallHistory />
    </Suspense>
  )
}
