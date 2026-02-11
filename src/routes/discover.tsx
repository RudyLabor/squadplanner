import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'
import Discover from '../pages/Discover'

export function meta() {
  return [
    { title: "Découvrir - Squad Planner" },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  // Fetch public squads for discovery
  const { data: publicSquads } = await supabase
    .from('squads')
    .select('id, name, game, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return data({ publicSquads: publicSquads || [] }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

// Server Component — data loaded on server, React Query seeded via ClientRouteWrapper
export function ServerComponent({ loaderData }: { loaderData: any }) {
  return (
    <ClientRouteWrapper seeds={[
      { key: queryKeys.discover.publicSquads(), data: loaderData?.publicSquads },
    ]}>
      <Discover />
    </ClientRouteWrapper>
  )
}
