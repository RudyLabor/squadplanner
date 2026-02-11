import { useRef } from 'react'
import { useLoaderData } from 'react-router'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { Profile } from '../pages/Profile'

export function meta() {
  return [
    { title: "Mon Profil - Squad Planner" },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data({ profile }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function ProfileRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const queryClient = useQueryClient()

  const seeded = useRef(false)
  if (!seeded.current && loaderData?.profile) {
    queryClient.setQueryData(queryKeys.profile.current(), loaderData.profile)
    seeded.current = true
  }

  return <Profile />
}
