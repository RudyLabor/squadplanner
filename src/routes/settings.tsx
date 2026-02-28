import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryClient, queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Settings = lazy(() => import('../pages/Settings').then((m) => ({ default: m.Settings })))

export function meta() {
  return [
    { title: 'Paramètres - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Configure ton compte Squad Planner : notifications, thème, confidentialité et préférences.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/settings' },
    { property: 'og:url', content: 'https://squadplanner.fr/settings' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Paramètres' },
    {
      property: 'og:description',
      content:
        'Configure ton compte Squad Planner : notifications, thème, confidentialité et préférences.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Paramètres' },
    {
      name: 'twitter:description',
      content:
        'Configure ton compte Squad Planner : notifications, thème, confidentialité et préférences.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
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
  // Fast auth — getSession reads local cache, no network call.
  // Parent _protected loader already validated with getUser().
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return { profile: null }

  // Reuse profile from React Query cache (seeded by _protected layout)
  const cached = queryClient.getQueryData(queryKeys.profile.current())
  if (cached !== undefined) return { profile: cached }

  // Fallback: fetch from Supabase (cold cache / first load)
  const { withTimeout } = await import('../lib/withTimeout')
  const { data: profile } = (await withTimeout(
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    5000
  )) as any
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
