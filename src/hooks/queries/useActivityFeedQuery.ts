import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseReady } from '../../lib/supabaseMinimal'
import { queryKeys } from '../../lib/queryClient'

export interface ActivityItem {
  id: string
  type: 'session_rsvp' | 'session_created' | 'squad_joined'
  description: string
  detail: string
  timestamp: string
  avatarInitial: string
  avatarColor: string
}

const AVATAR_COLORS = [
  'bg-primary/20 text-primary',
  'bg-success/20 text-success',
  'bg-warning/20 text-warning',
  'bg-info/20 text-info',
  'bg-error/20 text-error',
  'bg-secondary/20 text-secondary',
]

export function getRelativeTime(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin}min`
  if (diffH < 24) return `il y a ${diffH}h`
  if (diffD < 7) return `il y a ${diffD}j`
  return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function pickColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

async function fetchActivityFeed(squadIds: string[]): Promise<ActivityItem[]> {
  if (!isSupabaseReady() || squadIds.length === 0) return []

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const activities: ActivityItem[] = []

  const [rsvpResult, joinsResult, sessionsResult] = await Promise.all([
    supabase
      .from('session_rsvps')
      .select('session_id, user_id, response, responded_at')
      .gte('responded_at', sevenDaysAgo)
      .eq('response', 'present')
      .order('responded_at', { ascending: false })
      .limit(10),
    supabase
      .from('squad_members')
      .select('user_id, squad_id, joined_at')
      .in('squad_id', squadIds)
      .gte('joined_at', sevenDaysAgo)
      .order('joined_at', { ascending: false })
      .limit(5),
    supabase
      .from('sessions')
      .select('id, title, game, squad_id, created_by, created_at')
      .in('squad_id', squadIds)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const rsvps = rsvpResult.data || []
  const joins = joinsResult.data || []
  const sessions = sessionsResult.data || []

  // Collect all user IDs and squad IDs to batch-fetch names
  const userIds = new Set<string>()
  rsvps.forEach((r) => userIds.add(r.user_id))
  joins.forEach((j) => userIds.add(j.user_id))
  sessions.forEach((s) => {
    if (s.created_by) userIds.add(s.created_by)
  })

  const squadIdsToFetch = new Set<string>()
  joins.forEach((j) => squadIdsToFetch.add(j.squad_id))
  sessions.forEach((s) => squadIdsToFetch.add(s.squad_id))

  const sessionIdsFromRsvps = new Set<string>()
  rsvps.forEach((r) => {
    if (r.session_id) sessionIdsFromRsvps.add(r.session_id)
  })

  const [profilesResult, squadsResult, sessionsForRsvpsResult] = await Promise.all([
    userIds.size > 0
      ? supabase
          .from('profiles')
          .select('id, username')
          .in('id', [...userIds])
      : Promise.resolve({ data: [] }),
    squadIdsToFetch.size > 0
      ? supabase
          .from('squads')
          .select('id, name')
          .in('id', [...squadIdsToFetch])
      : Promise.resolve({ data: [] }),
    sessionIdsFromRsvps.size > 0
      ? supabase
          .from('sessions')
          .select('id, title, squad_id')
          .in('id', [...sessionIdsFromRsvps])
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p.username || 'Joueur']))
  const squadMap = new Map<string, string>((squadsResult.data || []).map((s: any) => [s.id, s.name]))
  const sessionMap = new Map((sessionsForRsvpsResult.data || []).map((s: any) => [s.id, s]))

  rsvps.forEach((r) => {
    const username = profileMap.get(r.user_id) || 'Joueur'
    const session = sessionMap.get(r.session_id)
    const squadName = session ? squadMap.get((session as any).squad_id) || '' : ''
    activities.push({
      id: `rsvp-${r.user_id}-${r.session_id}`,
      type: 'session_rsvp',
      description: `${username} a confirmé sa présence`,
      detail: session ? `${(session as any).title || 'Session'} - ${squadName}` : 'Session',
      timestamp: r.responded_at || new Date().toISOString(),
      avatarInitial: username[0]?.toUpperCase() || 'J',
      avatarColor: pickColor(r.user_id),
    })
  })

  joins.forEach((j) => {
    const username = profileMap.get(j.user_id) || 'Joueur'
    const squadName = squadMap.get(j.squad_id) || 'Squad'
    activities.push({
      id: `join-${j.user_id}-${j.squad_id}`,
      type: 'squad_joined',
      description: `${username} a rejoint ta squad`,
      detail: squadName,
      timestamp: j.joined_at || new Date().toISOString(),
      avatarInitial: username[0]?.toUpperCase() || 'J',
      avatarColor: pickColor(j.user_id),
    })
  })

  sessions.forEach((s) => {
    const username = s.created_by ? profileMap.get(s.created_by) || 'Joueur' : 'Joueur'
    const squadName = squadMap.get(s.squad_id) || 'Squad'
    activities.push({
      id: `session-${s.id}`,
      type: 'session_created',
      description: 'Nouvelle session créée',
      detail: `${s.game || s.title || 'Session'} - ${squadName}`,
      timestamp: s.created_at || new Date().toISOString(),
      avatarInitial: username[0]?.toUpperCase() || 'N',
      avatarColor: pickColor(s.id),
    })
  })

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return activities.slice(0, 5)
}

export function useActivityFeedQuery(squadIds: string[]) {
  return useQuery({
    queryKey: queryKeys.activityFeed.list(squadIds),
    queryFn: () => fetchActivityFeed(squadIds),
    staleTime: 2 * 60 * 1000,
    enabled: squadIds.length > 0 && isSupabaseReady(),
  })
}
