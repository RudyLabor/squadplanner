import { useRef } from 'react'
import { useLoaderData } from 'react-router'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import SessionDetail from '../pages/SessionDetail'

export function meta() {
  return [
    { title: "Détail Session - Squad Planner" },
  ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  const sessionId = params.id!

  // Fetch session + RSVPs + checkins in parallel
  const [sessionResult, rsvpsResult, checkinsResult] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', sessionId).single(),
    supabase
      .from('session_rsvps')
      .select('*, profiles(username)')
      .eq('session_id', sessionId),
    supabase
      .from('session_checkins')
      .select('*')
      .eq('session_id', sessionId),
  ])

  const rsvps = rsvpsResult.data || []
  const myRsvp = rsvps.find((r: any) => r.user_id === user.id)?.response || null

  const session = sessionResult.data
    ? {
        ...sessionResult.data,
        rsvps,
        checkins: checkinsResult.data || [],
        my_rsvp: myRsvp,
        rsvp_counts: {
          present: rsvps.filter((r: any) => r.response === 'present').length,
          absent: rsvps.filter((r: any) => r.response === 'absent').length,
          maybe: rsvps.filter((r: any) => r.response === 'maybe').length,
        },
      }
    : null

  return data({ session }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function SessionDetailRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const queryClient = useQueryClient()

  const seeded = useRef(false)
  if (!seeded.current && loaderData?.session) {
    queryClient.setQueryData(
      queryKeys.sessions.detail(loaderData.session.id),
      loaderData.session
    )
    seeded.current = true
  }

  return <SessionDetail />
}
