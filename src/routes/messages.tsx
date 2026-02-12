import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Messages = lazy(() => import('../pages/Messages'))

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
  const { supabase, headers, getUser } = createSupabaseServerClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  // Fetch squads for the conversation list
  const { data: memberships } = await supabase
    .from('squad_members')
    .select('squad_id, squads!inner(id, name, game)')
    .eq('user_id', user.id)

  const squads =
    (memberships as any[])?.map(
      (m: { squads: { id: string; name: string; game: string } }) => m.squads
    ) || []

  return data({ squads }, { headers })
}

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
