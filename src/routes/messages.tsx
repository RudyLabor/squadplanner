import { useRef } from 'react'
import { useLoaderData } from 'react-router'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { Messages } from '../pages/Messages'

export function meta() {
  return [
    { title: "Messages - Squad Planner" },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  // Fetch squads for the conversation list
  const { data: memberships } = await supabase
    .from('squad_members')
    .select('squad_id, squads!inner(id, name, game)')
    .eq('user_id', user.id)

  const squads = memberships?.map((m: any) => m.squads) || []

  return data({ squads }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function MessagesRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const queryClient = useQueryClient()

  const seeded = useRef(false)
  if (!seeded.current && loaderData?.squads) {
    queryClient.setQueryData(queryKeys.squads.list(), loaderData.squads)
    seeded.current = true
  }

  return <Messages />
}
