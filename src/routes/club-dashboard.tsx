import { lazy, Suspense } from 'react'
import { data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const ClubDashboard = lazy(() =>
  import('../pages/ClubDashboard').then((m) => ({ default: m.ClubDashboard }))
)

export function meta() {
  return [
    { title: 'Dashboard Club - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Gère toutes tes équipes gaming depuis un seul dashboard. Analytics cross-squad, export CSV, branding personnalisé.',
    },
    { httpEquiv: 'content-language', content: 'fr' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Dashboard Club - Squad Planner' },
    {
      property: 'og:description',
      content:
        'Gère toutes tes équipes gaming depuis un seul dashboard. Analytics cross-squad, export CSV, branding personnalisé.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Dashboard Club - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        'Gère toutes tes équipes gaming depuis un seul dashboard. Analytics cross-squad, export CSV, branding personnalisé.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { headers, getUser } = createMinimalSSRClient(request)
  const {
    data: { user },
  } = await getUser()

  // Don't redirect in SSR — clientLoader.hydrate=true handles auth on the client.
  // SSR with localStorage-based auth can't authenticate, so redirecting here
  // would cause a loop: /club → /auth → /home (because user IS authenticated client-side).
  return data({ userId: user?.id ?? null }, { headers })
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return { userId: null }
  return { userId: session.user.id }
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
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ClubDashboard />
      </Suspense>
    </ClientRouteWrapper>
  )
}
