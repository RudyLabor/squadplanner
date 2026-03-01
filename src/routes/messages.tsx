import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryClient, queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Messages = lazy(() => import('../pages/Messages'))

/** Squad data shape from the squad_members join for messages */
interface MessageSquadData {
  id: string
  name: string
  game: string
}

/** Row shape from the squad_members select with squads!inner join */
interface MessageMembershipRow {
  squad_id: string
  squads: MessageSquadData
}

export function meta() {
  return [
    { title: 'Messages — Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content: 'Discute avec tes coéquipiers en temps réel. Messagerie intégrée pour chaque squad.',
    },
    { httpEquiv: 'content-language', content: 'fr' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Messages — Squad Planner' },
    {
      property: 'og:description',
      content: 'Discute avec tes coéquipiers en temps réel. Messagerie intégrée pour chaque squad.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Messages — Squad Planner' },
    {
      name: 'twitter:description',
      content: 'Discute avec tes coéquipiers en temps réel. Messagerie intégrée pour chaque squad.',
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

  // Fetch squads for the conversation list
  const { data: memberships } = await supabase
    .from('squad_members')
    .select('squad_id, squads!inner(id, name, game)')
    .eq('user_id', user.id)

  const squads = (memberships as MessageMembershipRow[] | null)?.map((m) => m.squads) || []

  return data({ squads }, { headers })
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  // Fast auth — getSession reads local cache, no network call.
  // Parent _protected loader already validated with getUser().
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return { squads: [] }

  // Reuse squads from React Query cache (seeded by _protected layout)
  const cached = queryClient.getQueryData(queryKeys.squads.list()) as any[] | undefined
  if (cached !== undefined) {
    return { squads: cached.map((s: any) => ({ id: s.id, name: s.name, game: s.game })) }
  }

  // Fallback: fetch from Supabase (cold cache / first load)
  const { withTimeout } = await import('../lib/withTimeout')
  const { data: memberships } = (await withTimeout(
    supabase
      .from('squad_members')
      .select('squad_id, squads!inner(id, name, game)')
      .eq('user_id', session.user.id),
    5000
  )) as any

  const squads = (memberships as MessageMembershipRow[] | null)?.map((m) => m.squads) || []
  return { squads }
}
clientLoader.hydrate = true as const

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

interface MessagesLoaderData {
  squads: Array<{ id: string; name: string; game: string }>
}

export default function Component({ loaderData }: { loaderData: MessagesLoaderData }) {
  return (
    <ClientRouteWrapper seeds={[{ key: [...queryKeys.squads.list()], data: loaderData?.squads }]}>
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Messages />
      </Suspense>
    </ClientRouteWrapper>
  )
}
