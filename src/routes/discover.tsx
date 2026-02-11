import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Discover = lazy(() => import('../pages/Discover'))

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

export default function Component({ loaderData }: { loaderData: any }) {
  return (
    <ClientRouteWrapper seeds={[
      { key: queryKeys.discover.publicSquads(), data: loaderData?.publicSquads },
    ]}>
      <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <Discover />
      </Suspense>
    </ClientRouteWrapper>
  )
}
