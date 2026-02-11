import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'
import PublicProfile from '../pages/PublicProfile'

export function meta() {
  return [
    { title: "Profil - Squad Planner" },
  ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  const username = params.username!

  // Fetch the public profile by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  return data({ profile, username }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

// Server Component — data loaded on server, React Query seeded via ClientRouteWrapper
export function ServerComponent({ loaderData }: { loaderData: any }) {
  return (
    <ClientRouteWrapper seeds={[
      { key: queryKeys.discover.publicProfile(loaderData?.username), data: loaderData?.profile },
    ]}>
      <PublicProfile />
    </ClientRouteWrapper>
  )
}
