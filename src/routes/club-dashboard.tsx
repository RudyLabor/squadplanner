import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const ClubDashboard = lazy(() =>
  import('../pages/ClubDashboard').then((m) => ({ default: m.ClubDashboard }))
)

export function meta() {
  return [
    { title: 'Dashboard Club - Squad Planner' },
    {
      name: 'description',
      content:
        'Gère toutes tes équipes gaming depuis un seul dashboard. Analytics cross-squad, export CSV, branding personnalisé.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/club' },
    { property: 'og:url', content: 'https://squadplanner.fr/club' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, getUser } = createMinimalSSRClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    throw redirect('/auth', { headers })
  }

  return data({ userId: user.id }, { headers })
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
