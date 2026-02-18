import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ClientLoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryKeys } from '../lib/queryClient'
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
    { title: 'Messages - Squad Planner' },
    {
      name: 'description',
      content: 'Discute avec tes coéquipiers en temps réel. Messagerie intégrée pour chaque squad.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/messages' },
    { property: 'og:url', content: 'https://squadplanner.fr/messages' },
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

  const squads =
    (memberships as MessageMembershipRow[] | null)?.map((m) => m.squads) || []

  return data({ squads }, { headers })
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const { supabaseMinimal: supabase } = await import('../lib/supabaseMinimal')
  const { withTimeout } = await import('../lib/withTimeout')
  const { data: { user } } = await withTimeout(supabase.auth.getUser(), 5000)
    .catch(() => ({ data: { user: null as null } }))
  if (!user) return { squads: [] }

  const { data: memberships } = await withTimeout(
    supabase
      .from('squad_members')
      .select('squad_id, squads!inner(id, name, game)')
      .eq('user_id', user.id),
    5000
  )

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
