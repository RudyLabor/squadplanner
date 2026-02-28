import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryClient, queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Discover = lazy(() => import('../pages/Discover'))

export function meta() {
  return [
    { title: 'Découvrir - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Découvre de nouvelles squads et joueurs. Trouve des partenaires de jeu qui correspondent à ton style.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/discover' },
    { property: 'og:url', content: 'https://squadplanner.fr/discover' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Découvrir' },
    {
      property: 'og:description',
      content:
        'Découvre de nouvelles squads et joueurs. Trouve des partenaires de jeu qui correspondent à ton style.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Découvrir' },
    {
      name: 'twitter:description',
      content:
        'Découvre de nouvelles squads et joueurs. Trouve des partenaires de jeu qui correspondent à ton style.',
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
    return data({ squads: [] }, { headers })
  }

  // Fetch only public squads for discovery (with member count)
  const { data: publicSquads } = await supabase
    .from('squads')
    .select('id, name, game, total_members, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

  return data({ publicSquads: publicSquads || [] }, { headers })
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  // Fast auth — getSession reads local cache, no network call.
  // Parent _protected loader already validated with getUser().
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return { publicSquads: [] }

  // Check React Query cache for public squads
  const cached = queryClient.getQueryData(queryKeys.discover.publicSquads())
  if (cached !== undefined) return { publicSquads: cached }

  // Fallback: fetch from Supabase (cold cache / first load)
  const { withTimeout } = await import('../lib/withTimeout')
  const { data: publicSquads } = (await withTimeout(
    supabase
      .from('squads')
      .select('id, name, game, total_members, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50),
    5000
  )) as any
  return { publicSquads: publicSquads || [] }
}
clientLoader.hydrate = true as const

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

interface DiscoverLoaderData {
  publicSquads: Array<{ id: string; name: string; game: string; created_at: string }>
}

export default function Component({ loaderData }: { loaderData: DiscoverLoaderData }) {
  return (
    <ClientRouteWrapper
      seeds={[{ key: [...queryKeys.discover.publicSquads()], data: loaderData?.publicSquads }]}
    >
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Discover />
      </Suspense>
    </ClientRouteWrapper>
  )
}
