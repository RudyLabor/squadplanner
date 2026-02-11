import { useRef } from 'react'
import { useLoaderData } from 'react-router'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
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

export default function PublicProfileRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const queryClient = useQueryClient()

  const seeded = useRef(false)
  if (!seeded.current && loaderData?.profile && loaderData?.username) {
    queryClient.setQueryData(
      queryKeys.discover.publicProfile(loaderData.username),
      loaderData.profile
    )
    seeded.current = true
  }

  return <PublicProfile />
}
