/**
 * Comprehensive tests for src/utils/calendarExport.ts
 * Covers: sessionToCalendarEvent, exportSessionsToICS, getGoogleCalendarUrl,
 *         formatICSDate, escapeICS, generateICS, downloadICS (internal)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sessionToCalendarEvent, getGoogleCalendarUrl, exportSessionsToICS } from '../calendarExport'

describe('calendarExport', () => {
  // =========================================================================
  // sessionToCalendarEvent
  // =========================================================================
  describe('sessionToCalendarEvent', () => {
    it('should convert a session with all fields', () => {
      const session = {
        id: 'session-1',
        scheduled_at: '2026-02-14T18:00:00Z',
        status: 'confirmed',
        title: 'Ranked',
        game: 'Valorant',
        duration_minutes: 90,
        description: 'Session ranked',
      }
      const event = sessionToCalendarEvent(session, 'MySquad')
      expect(event.id).toBe('session-1')
      expect(event.title).toBe('Ranked')
      expect(event.startDate).toEqual(new Date('2026-02-14T18:00:00Z'))
      expect(event.endDate).toEqual(new Date('2026-02-14T19:30:00Z')) // 90 min later
      expect(event.description).toContain('Valorant')
      expect(event.description).toContain('MySquad')
      expect(event.description).toContain('90 minutes')
      expect(event.description).toContain('confirmed')
      expect(event.location).toBe('Squad Planner')
    })

    it('should use game as title fallback when no title', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed', game: 'Fortnite' }
      const event = sessionToCalendarEvent(session)
      expect(event.title).toBe('Fortnite')
    })

    it('should use "Session gaming" when no title and no game', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed' }
      const event = sessionToCalendarEvent(session)
      expect(event.title).toBe('Session gaming')
    })

    it('should default to 120 minutes duration', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed' }
      const event = sessionToCalendarEvent(session)
      const diffMs = event.endDate.getTime() - event.startDate.getTime()
      expect(diffMs).toBe(120 * 60 * 1000)
    })

    it('should handle 0 duration_minutes by defaulting to 120', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed', duration_minutes: 0 }
      const event = sessionToCalendarEvent(session)
      const diffMs = event.endDate.getTime() - event.startDate.getTime()
      expect(diffMs).toBe(120 * 60 * 1000)
    })

    it('should handle short duration (15 minutes)', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed', duration_minutes: 15 }
      const event = sessionToCalendarEvent(session)
      const diffMs = event.endDate.getTime() - event.startDate.getTime()
      expect(diffMs).toBe(15 * 60 * 1000)
    })

    it('should handle long duration (480 minutes / 8 hours)', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed', duration_minutes: 480 }
      const event = sessionToCalendarEvent(session)
      expect(event.endDate).toEqual(new Date('2026-02-15T02:00:00Z'))
    })

    it('should include game in description when provided', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed', game: 'CS2' }
      const event = sessionToCalendarEvent(session)
      expect(event.description).toContain('Jeu: CS2')
    })

    it('should not include game line in description when game is null', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed', game: null }
      const event = sessionToCalendarEvent(session)
      expect(event.description).not.toContain('Jeu:')
    })

    it('should include squad name in description when provided', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed' }
      const event = sessionToCalendarEvent(session, 'Team Alpha')
      expect(event.description).toContain('Squad: Team Alpha')
    })

    it('should not include squad line when squadName is not provided', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed' }
      const event = sessionToCalendarEvent(session)
      expect(event.description).not.toContain('Squad:')
    })

    it('should include status in description', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'pending' }
      const event = sessionToCalendarEvent(session)
      expect(event.description).toContain('Statut: pending')
    })

    it('should handle null title and null game', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed', title: null, game: null }
      const event = sessionToCalendarEvent(session)
      expect(event.title).toBe('Session gaming')
    })

    it('should handle empty string title', () => {
      const session = { id: '1', scheduled_at: '2026-02-14T18:00:00Z', status: 'confirmed', title: '' }
      const event = sessionToCalendarEvent(session)
      // Empty string is falsy, should fallback
      expect(event.title).toBe('Session gaming')
    })
  })

  // =========================================================================
  // getGoogleCalendarUrl
  // =========================================================================
  describe('getGoogleCalendarUrl', () => {
    it('should generate valid Google Calendar URL', () => {
      const event = {
        id: '1',
        title: 'Ranked',
        startDate: new Date('2026-02-14T18:00:00Z'),
        endDate: new Date('2026-02-14T20:00:00Z'),
        description: 'Test session',
      }
      const url = getGoogleCalendarUrl(event)
      expect(url).toContain('https://calendar.google.com/calendar/render')
      expect(url).toContain('action=TEMPLATE')
      expect(url).toContain('text=Ranked')
      expect(url).toContain('details=Test+session')
    })

    it('should include dates in correct format', () => {
      const event = {
        id: '1',
        title: 'Test',
        startDate: new Date('2026-02-14T18:00:00Z'),
        endDate: new Date('2026-02-14T20:00:00Z'),
      }
      const url = getGoogleCalendarUrl(event)
      // Google Calendar date format: YYYYMMDDTHHMMSSZ
      expect(url).toContain('20260214T180000Z')
      expect(url).toContain('20260214T200000Z')
    })

    it('should handle event without description', () => {
      const event = {
        id: '1',
        title: 'No desc',
        startDate: new Date('2026-02-14T18:00:00Z'),
        endDate: new Date('2026-02-14T20:00:00Z'),
      }
      const url = getGoogleCalendarUrl(event)
      expect(url).toContain('details=')
    })

    it('should handle event with location', () => {
      const event = {
        id: '1',
        title: 'Located',
        startDate: new Date('2026-02-14T18:00:00Z'),
        endDate: new Date('2026-02-14T20:00:00Z'),
        location: 'Squad Planner',
      }
      const url = getGoogleCalendarUrl(event)
      expect(url).toContain('location=Squad')
    })

    it('should handle event without location', () => {
      const event = {
        id: '1',
        title: 'No location',
        startDate: new Date('2026-02-14T18:00:00Z'),
        endDate: new Date('2026-02-14T20:00:00Z'),
      }
      const url = getGoogleCalendarUrl(event)
      expect(url).toContain('location=')
    })

    it('should handle special characters in title', () => {
      const event = {
        id: '1',
        title: 'Session & Friends',
        startDate: new Date('2026-02-14T18:00:00Z'),
        endDate: new Date('2026-02-14T20:00:00Z'),
      }
      const url = getGoogleCalendarUrl(event)
      expect(url).toContain('text=')
    })
  })

  // =========================================================================
  // exportSessionsToICS
  // =========================================================================
  describe('exportSessionsToICS', () => {
    let createElementSpy: ReturnType<typeof vi.spyOn>
    let appendChildSpy: ReturnType<typeof vi.spyOn>
    let removeChildSpy: ReturnType<typeof vi.spyOn>
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
    let mockLink: any

    beforeEach(() => {
      mockLink = { href: '', download: '', click: vi.fn() }
      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink as any)
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockLink as any)
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should throw when no valid sessions', () => {
      const sessions = [{ id: '1', scheduled_at: '2020-01-01T00:00:00Z', status: 'cancelled' }]
      expect(() => exportSessionsToICS(sessions)).toThrow('Aucune session')
    })

    it('should throw when all sessions are past (more than 24h ago)', () => {
      const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      const sessions = [{ id: '1', scheduled_at: pastDate, status: 'confirmed' }]
      expect(() => exportSessionsToICS(sessions)).toThrow('Aucune session')
    })

    it('should not throw for sessions within last 24 hours', () => {
      const recentDate = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      const sessions = [{ id: '1', scheduled_at: recentDate, status: 'confirmed' }]
      expect(() => exportSessionsToICS(sessions)).not.toThrow()
    })

    it('should throw when all sessions are cancelled', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const sessions = [
        { id: '1', scheduled_at: futureDate, status: 'cancelled' },
        { id: '2', scheduled_at: futureDate, status: 'cancelled' },
      ]
      expect(() => exportSessionsToICS(sessions)).toThrow('Aucune session')
    })

    it('should export valid sessions and trigger download', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const sessions = [
        { id: '1', scheduled_at: futureDate, status: 'confirmed', title: 'Test' },
      ]
      exportSessionsToICS(sessions)

      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalled()
    })

    it('should filter out cancelled sessions', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const sessions = [
        { id: '1', scheduled_at: futureDate, status: 'cancelled' },
        { id: '2', scheduled_at: futureDate, status: 'confirmed', title: 'Active' },
      ]
      exportSessionsToICS(sessions)
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should use squad name in default filename', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const sessions = [{ id: '1', scheduled_at: futureDate, status: 'confirmed' }]
      exportSessionsToICS(sessions, 'My Squad!')
      expect(mockLink.download).toBe('My_Squad__sessions.ics')
    })

    it('should use default filename when no squad name', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const sessions = [{ id: '1', scheduled_at: futureDate, status: 'confirmed' }]
      exportSessionsToICS(sessions)
      expect(mockLink.download).toBe('squad_sessions.ics')
    })

    it('should use custom filename when provided', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const sessions = [{ id: '1', scheduled_at: futureDate, status: 'confirmed' }]
      exportSessionsToICS(sessions, 'MySquad', 'custom.ics')
      expect(mockLink.download).toBe('custom.ics')
    })

    it('should throw for empty array', () => {
      expect(() => exportSessionsToICS([])).toThrow('Aucune session')
    })
  })
})
