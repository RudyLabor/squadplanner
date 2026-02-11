import { useRef } from 'react'
import { useLoaderData } from 'react-router'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import SquadDetail from '../pages/SquadDetail'

export function meta() {
  return [
    { title: "Détail Squad - Squad Planner" },
  ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  const squadId = params.id!

  // Fetch squad + members + sessions in parallel
  const [squadResult, membersResult, sessionsResult] = await Promise.all([
    supabase.from('squads').select('*').eq('id', squadId).single(),
    supabase
      .from('squad_members')
      .select('*, profiles(username, avatar_url, reliability_score)')
      .eq('squad_id', squadId),
    supabase
      .from('sessions')
      .select('*')
      .eq('squad_id', squadId)
      .order('scheduled_at', { ascending: true }),
  ])

  const squad = squadResult.data
    ? {
        ...squadResult.data,
        members: membersResult.data || [],
        member_count: membersResult.data?.length || 0,
      }
    : null

  // Get RSVPs for sessions
  let sessions: any[] = []
  if (sessionsResult.data?.length) {
    const sessionIds = sessionsResult.data.map((s: any) => s.id)
    const { data: allRsvps } = await supabase
      .from('session_rsvps')
      .select('*')
      .in('session_id', sessionIds)

    sessions = sessionsResult.data.map((session: any) => {
      const sessionRsvps = allRsvps?.filter((r: any) => r.session_id === session.id) || []
      return {
        ...session,
        my_rsvp: sessionRsvps.find((r: any) => r.user_id === user.id)?.response || null,
        rsvp_counts: {
          present: sessionRsvps.filter((r: any) => r.response === 'present').length,
          absent: sessionRsvps.filter((r: any) => r.response === 'absent').length,
          maybe: sessionRsvps.filter((r: any) => r.response === 'maybe').length,
        },
      }
    })
  }

  return data({ squad, sessions }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function SquadDetailRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const queryClient = useQueryClient()

  const seeded = useRef(false)
  if (!seeded.current && loaderData?.squad) {
    queryClient.setQueryData(
      queryKeys.squads.detail(loaderData.squad.id),
      loaderData.squad
    )
    queryClient.setQueryData(
      queryKeys.sessions.list(loaderData.squad.id),
      loaderData.sessions
    )
    seeded.current = true
  }

  return <SquadDetail />
}
