/**
 * Utility functions for exporting sessions to calendar formats (ICS)
 */

import type { Session } from '../types/database'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  location?: string
}

/**
 * Converts a session to a calendar event
 */
export function sessionToCalendarEvent(
  session: Session,
  squadName?: string
): CalendarEvent {
  const startDate = new Date(session.scheduled_at)
  const durationMinutes = session.duration_minutes || 120
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)

  const title = session.title || session.game || 'Session gaming'
  const description = [
    session.game ? `Jeu: ${session.game}` : '',
    squadName ? `Squad: ${squadName}` : '',
    `Durée: ${durationMinutes} minutes`,
    session.status ? `Statut: ${session.status}` : ''
  ].filter(Boolean).join('\n')

  return {
    id: session.id,
    title,
    description,
    startDate,
    endDate,
    location: 'Squad Planner'
  }
}

/**
 * Formats a date to ICS format (YYYYMMDDTHHmmssZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Escapes special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Generates ICS content for multiple events
 */
export function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Squad Planner//Sessions Export//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Squad Planner Sessions',
    'X-WR-TIMEZONE:Europe/Paris'
  ]

  for (const event of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.id}@squadplanner.app`)
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`)
    lines.push(`DTSTART:${formatICSDate(event.startDate)}`)
    lines.push(`DTEND:${formatICSDate(event.endDate)}`)
    lines.push(`SUMMARY:${escapeICS(event.title)}`)

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeICS(event.location)}`)
    }

    // Add reminder 30 minutes before
    lines.push('BEGIN:VALARM')
    lines.push('TRIGGER:-PT30M')
    lines.push('ACTION:DISPLAY')
    lines.push('DESCRIPTION:Session Squad Planner dans 30 minutes!')
    lines.push('END:VALARM')

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Downloads an ICS file
 */
export function downloadICS(content: string, filename: string = 'sessions.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Exports sessions to an ICS file and triggers download
 */
export function exportSessionsToICS(
  sessions: Session[],
  squadName?: string,
  filename?: string
): void {
  // Filter out cancelled sessions and only include future/confirmed ones
  const validSessions = sessions.filter(s =>
    s.status !== 'cancelled' &&
    new Date(s.scheduled_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Include sessions from last 24h
  )

  if (validSessions.length === 0) {
    throw new Error('Aucune session à exporter')
  }

  const events = validSessions.map(s => sessionToCalendarEvent(s, squadName))
  const icsContent = generateICS(events)

  const defaultFilename = squadName
    ? `${squadName.replace(/[^a-zA-Z0-9]/g, '_')}_sessions.ics`
    : 'squad_sessions.ics'

  downloadICS(icsContent, filename || defaultFilename)
}

/**
 * Generates a Google Calendar URL for a single session
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
    details: event.description || '',
    location: event.location || ''
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
