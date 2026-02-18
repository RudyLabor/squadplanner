import { supabaseMinimal as supabase } from './supabaseMinimal'

interface SessionNotifyData {
  sessionId: string
  squadId: string
  creatorId: string
  creatorUsername: string
  title: string
  game?: string
  scheduledAt: string
  durationMinutes: number
}

/**
 * Generates a Google Calendar "Add Event" URL for the session.
 */
export function generateGoogleCalendarUrl(data: {
  title: string
  scheduledAt: string
  durationMinutes: number
  game?: string
  squadName?: string
}): string {
  const start = new Date(data.scheduledAt)
  const end = new Date(start.getTime() + data.durationMinutes * 60 * 1000)

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${data.title}${data.game ? ` (${data.game})` : ''}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Session SquadPlanner${data.squadName ? ` — ${data.squadName}` : ''}\n\nOuvre l'app pour accepter ou refuser.`,
    location: 'SquadPlanner',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generates an .ics file content string for universal calendar import.
 */
export function generateIcsContent(data: {
  title: string
  scheduledAt: string
  durationMinutes: number
  game?: string
  sessionId: string
}): string {
  const start = new Date(data.scheduledAt)
  const end = new Date(start.getTime() + data.durationMinutes * 60 * 1000)

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SquadPlanner//Session//FR',
    'BEGIN:VEVENT',
    `UID:session-${data.sessionId}@squadplanner.fr`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${data.title}${data.game ? ` (${data.game})` : ''}`,
    'DESCRIPTION:Session SquadPlanner',
    'LOCATION:SquadPlanner',
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/**
 * Notify all squad members (except creator) about a new session.
 * Inserts in-app notifications + sends push with accept/refuse actions.
 */
export async function notifySessionCreated(data: SessionNotifyData) {
  try {
    // Get squad info
    const [{ data: members }, { data: squad }] = await Promise.all([
      supabase
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', data.squadId)
        .neq('user_id', data.creatorId),
      supabase.from('squads').select('name').eq('id', data.squadId).single(),
    ])

    if (!members?.length) return

    const squadName = squad?.name || 'Squad'
    const memberIds = members.map((m) => m.user_id)

    const scheduledDate = new Date(data.scheduledAt)
    const dateStr = scheduledDate.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

    const calendarUrl = generateGoogleCalendarUrl({
      title: data.title,
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes,
      game: data.game,
      squadName,
    })

    // Insert in-app notifications for each member
    const notifications = memberIds.map((memberId) => ({
      user_id: memberId,
      type: 'session_created',
      title: 'Nouvelle session !',
      message: `${data.creatorUsername} propose "${data.title}" le ${dateStr} dans ${squadName}`,
      data: {
        session_id: data.sessionId,
        squad_id: data.squadId,
        created_by: data.creatorId,
        scheduled_at: data.scheduledAt,
        calendar_url: calendarUrl,
        game: data.game,
      },
    }))
    await supabase.from('notifications').insert(notifications)

    // Send push notifications with accept/refuse actions
    await supabase.functions.invoke('send-push', {
      body: {
        userIds: memberIds,
        title: `Nouvelle session — ${squadName}`,
        body: `${data.creatorUsername} propose "${data.title}" le ${dateStr}`,
        icon: '/icon-192.svg',
        tag: `session-created-${data.sessionId}`,
        url: `/squad/${data.squadId}`,
        data: {
          type: 'session_created',
          session_id: data.sessionId,
          squad_id: data.squadId,
          calendar_url: calendarUrl,
        },
        actions: [
          { action: 'accept', title: 'Accepter' },
          { action: 'decline', title: 'Refuser' },
        ],
        vibrate: [200, 100, 200],
        requireInteraction: true,
      },
    })
  } catch (err) {
    if (!import.meta.env.PROD) console.warn('[notifySessionCreated] Failed:', err)
  }
}
