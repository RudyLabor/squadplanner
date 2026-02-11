import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'
import { Sessions } from '../pages/Sessions'

export function meta() {
  return [
    { title: "Sessions - Squad Planner" },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  const { data: memberships } = await supabase
    .from('squad_members')
    .select('squad_id, squads!inner(id, name, game, invite_code, owner_id, created_at)')
    .eq('user_id', user.id)

  const squads = memberships?.map((m: any) => m.squads) || []
  const squadIds = squads.map((s: any) => s.id)

  let sessions: any[] = []
  if (squadIds.length > 0) {
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .in('squad_id', squadIds)
      .order('scheduled_at', { ascending: true })

    if (sessionsData?.length) {
      const sessionIds = sessionsData.map((s: any) => s.id)
      const { data: allRsvps } = await supabase
        .from('session_rsvps')
        .select('*')
        .in('session_id', sessionIds)

      sessions = sessionsData.map((session: any) => {
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
  }

  return data({ squads, sessions }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component({ loaderData }: { loaderData: any }) {
  return (
    <ClientRouteWrapper seeds={[
      { key: queryKeys.squads.list(), data: loaderData?.squads },
      { key: queryKeys.sessions.upcoming(), data: loaderData?.sessions },
    ]}>
      <Sessions loaderData={loaderData} />
    </ClientRouteWrapper>
  )
}
