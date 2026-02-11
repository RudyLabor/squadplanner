import { useRef } from 'react'
import { useLoaderData } from 'react-router'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import Home from '../pages/Home'

export function meta() {
  return [
    { title: "Accueil - Squad Planner" },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  // Critical data — awaited (rendered immediately)
  const [profileResult, membershipsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('squad_members')
      .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, created_at)')
      .eq('user_id', user.id),
  ])

  const profile = profileResult.data
  const squads = membershipsResult.data?.map((m: any) => m.squads) || []
  const squadIds = squads.map((s: any) => s.id)

  // Get member counts
  let squadsWithCounts = squads
  if (squadIds.length > 0) {
    const { data: memberCounts } = await supabase
      .from('squad_members')
      .select('squad_id')
      .in('squad_id', squadIds)

    const countBySquad: Record<string, number> = {}
    memberCounts?.forEach((m: any) => {
      countBySquad[m.squad_id] = (countBySquad[m.squad_id] || 0) + 1
    })
    squadsWithCounts = squads.map((squad: any) => ({
      ...squad,
      member_count: countBySquad[squad.id] || 0,
    }))
  }

  // Upcoming sessions (critical)
  let upcomingSessions: any[] = []
  if (squadIds.length > 0) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .in('squad_id', squadIds)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(20)

    if (sessions?.length) {
      const sessionIds = sessions.map((s: any) => s.id)
      const { data: allRsvps } = await supabase
        .from('session_rsvps')
        .select('*')
        .in('session_id', sessionIds)

      upcomingSessions = sessions.map((session: any) => {
        const sessionRsvps = allRsvps?.filter((r: any) => r.session_id === session.id) || []
        const myRsvp = sessionRsvps.find((r: any) => r.user_id === user.id)?.response || null
        return {
          ...session,
          my_rsvp: myRsvp,
          rsvp_counts: {
            present: sessionRsvps.filter((r: any) => r.response === 'present').length,
            absent: sessionRsvps.filter((r: any) => r.response === 'absent').length,
            maybe: sessionRsvps.filter((r: any) => r.response === 'maybe').length,
          },
        }
      })
    }
  }

  return data(
    { profile, squads: squadsWithCounts, upcomingSessions },
    { headers }
  )
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function HomeRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const queryClient = useQueryClient()

  // Seed React Query cache with server data (once)
  const seeded = useRef(false)
  if (!seeded.current && loaderData) {
    queryClient.setQueryData(queryKeys.squads.list(), loaderData.squads)
    queryClient.setQueryData(queryKeys.sessions.upcoming(), loaderData.upcomingSessions)
    seeded.current = true
  }

  return <Home />
}
