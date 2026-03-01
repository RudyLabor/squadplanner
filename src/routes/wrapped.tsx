import { lazy, Suspense } from 'react'
import { data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Wrapped = lazy(() => import('../pages/Wrapped').then((m) => ({ default: m.Wrapped })))

export function meta() {
  return [
    { title: 'Gaming Wrapped 2026 - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Découvre ton Gaming Wrapped 2026 : sessions jouées, heures avec ta squad, meilleur streak, score de fiabilité. Partage tes stats !',
    },
    { httpEquiv: 'content-language', content: 'fr' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Mon Gaming Wrapped 2026 - Squad Planner' },
    {
      property: 'og:description',
      content: 'Découvre mes stats gaming de 2026 sur Squad Planner !',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Gaming Wrapped 2026 - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        'Découvre ton Gaming Wrapped 2026 : sessions jouées, heures avec ta squad, meilleur streak, score de fiabilité. Partage tes stats !',
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

  return data({ userId: user?.id ?? null }, { headers })
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return { userId: session?.user?.id ?? null }
}
clientLoader.hydrate = true as const

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component() {
  return (
    <ClientRouteWrapper>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-bg-base">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-tertiary">Chargement de ton Wrapped...</p>
            </div>
          </div>
        }
      >
        <Wrapped />
      </Suspense>
    </ClientRouteWrapper>
  )
}
