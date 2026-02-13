import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Settings = lazy(() => import('../pages/Settings').then((m) => ({ default: m.Settings })))

export function meta() {
  return [
    { title: 'Paramètres - Squad Planner' },
    {
      name: 'description',
      content:
        'Configure ton compte Squad Planner : notifications, thème, confidentialité et préférences.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/settings' },
    { property: 'og:url', content: 'https://squadplanner.fr/settings' },
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { profile: null }
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return { profile }
}
clientLoader.hydrate = true as const

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

import type { Profile } from '../types/database'

interface SettingsLoaderData {
  profile: Profile | null
}

export default function Component({ loaderData }: { loaderData: SettingsLoaderData }) {
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
        <Settings />
      </Suspense>
    </ClientRouteWrapper>
  )
}
