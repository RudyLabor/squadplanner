import { describe, it, expect, vi } from 'vitest'
import { sessionToCalendarEvent, getGoogleCalendarUrl, exportSessionsToICS } from '../calendarExport'

describe('calendarExport', () => {
  describe('sessionToCalendarEvent', () => {
    it('converts session with all fields', () => {
      const session = {
        id: 'session-1',
        scheduled_at: '2026-02-14T18:00:00Z',
        status: 'confirmed',
        title: 'Ranked',
        game: 'Valorant',
        duration_minutes: 90,
        description: 'Session ranked'
      }
      const event = sessionToCalendarEvent(session, 'MySquad')
      expect(event.id).toBe('session-1')
      expect(event.title).toBe('Ranked')
      expect(event.startDate).toEqual(new Date('2026-02-14T18:00:00Z'))
      expect(event.endDate).toEqual(new Date('2026-02-14T19:30:00Z'))
      expect(event.description).toContain('Valorant')
      expect(event.description).toContain('MySquad')
    })

    it('uses game as title fallback', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed', game: 'Fortnite' }
      const event = sessionToCalendarEvent(session)
      expect(event.title).toBe('Fortnite')
    })

    it('uses default title when no title or game', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed' }
      const event = sessionToCalendarEvent(session)
      expect(event.title).toBe('Session gaming')
    })

    it('defaults to 120 minutes duration', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed' }
      const event = sessionToCalendarEvent(session)
      const diffMs = event.endDate.getTime() - event.startDate.getTime()
      expect(diffMs).toBe(120 * 60 * 1000)
    })
  })

  describe('getGoogleCalendarUrl', () => {
    it('generates valid Google Calendar URL', () => {
      const event = {
        id: '1',
        title: 'Ranked',
        startDate: new Date('2026-02-14T18:00:00Z'),
        endDate: new Date('2026-02-14T20:00:00Z'),
        description: 'Test'
      }
      const url = getGoogleCalendarUrl(event)
      expect(url).toContain('calendar.google.com/calendar/render')
      expect(url).toContain('text=Ranked')
      expect(url).toContain('details=Test')
    })
  })

  describe('exportSessionsToICS', () => {
    it('throws when no valid sessions', () => {
      const sessions = [{ id: '1', scheduled_at: '2020-01-01T00:00:00Z', status: 'cancelled' }]
      expect(() => exportSessionsToICS(sessions)).toThrow('Aucune session')
    })
  })
})
