import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Profile = lazy(() => import('../pages/Profile').then((m) => ({ default: m.Profile })))

export function meta() {
  return [
    { title: 'Mon Profil - Squad Planner' },
    {
      name: 'description',
      content:
        'Consulte ton profil gaming : statistiques, fiabilité, XP et badges. Personnalise ton identité Squad Planner.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/profile' },
    { property: 'og:url', content: 'https://squadplanner.fr/profile' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, getUser } = createMinimalSSRClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    return data({ profile: null }, { headers })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return data({ profile }, { headers })
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const { withTimeout } = await import('../lib/withTimeout')
  const { data: { user } } = await withTimeout(supabase.auth.getUser(), 5000)
  if (!user) return { profile: null }
  const { data: profile } = await withTimeout(supabase.from('profiles').select('*').eq('id', user.id).single(), 5000)
  return { profile }
}
clientLoader.hydrate = true as const

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

import type { Profile as ProfileType } from '../types/database'

interface ProfileLoaderData {
  profile: ProfileType | null
}

export default function Component({ loaderData }: { loaderData: ProfileLoaderData }) {
  return (
    <ClientRouteWrapper
      seeds={[{ key: [...queryKeys.profile.current()], data: loaderData?.profile }]}
    >
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Profile />
      </Suspense>
    </ClientRouteWrapper>
  )
}
