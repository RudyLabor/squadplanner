import { useRef } from 'react'
import { useLoaderData } from 'react-router'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
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

export default function DiscoverRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const queryClient = useQueryClient()

  const seeded = useRef(false)
  if (!seeded.current && loaderData?.publicSquads) {
    queryClient.setQueryData(
      queryKeys.discover.publicSquads(),
      loaderData.publicSquads
    )
    seeded.current = true
  }

  return <Discover />
}
